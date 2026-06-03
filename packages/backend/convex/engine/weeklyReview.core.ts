/**
 * Engine: weekly review — the pure, deterministic core.
 *
 * Mirrors the `buildFiveKPlan` discipline: NO convex runtime imports, so it can
 * be unit-tested in isolation and (later) reused in the admin simulator. The
 * Convex wrapper (`weeklyReview.ts`) gathers the inputs (reads), calls
 * `evaluateWeeklyReview`, then applies the decision (writes) and journals it.
 *
 * What a coach looks at, encoded deterministically:
 *   - adherence weighted by session ROLE (a missed long run or quality session
 *     matters; a missed easy filler is noise),
 *   - km-weighted completion of the week that just closed,
 *   - the streak (was last week already a down week?) — consistency beats any
 *     single session, so two bad weeks in a row escalates.
 *
 * The output describes how to reshape ONLY the upcoming week (race date is
 * fixed): a volume scale factor for the sessions we keep, plus the sessions we
 * drop. We never rewrite the far future — each weekly review only lays the next
 * microcycle, the way a real coach plans one week at a time off the last.
 *
 * Re-anchoring paces to a new VDOT is out of this slice (it needs tail
 * regeneration + a stored anchor VDOT — see the plan).
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";

// ---------------------------------------------------------------------------
// Session role
// ---------------------------------------------------------------------------

/**
 * Key sessions carry the week's adaptation — the long run and every quality
 * session. Easy/recovery runs are aerobic filler: missing one is noise. `race`
 * is the goal itself, never part of an adherence assessment.
 */
const KEY_TYPES = new Set<WorkoutType>([
  "long",
  "threshold",
  "intervals",
  "race_pace",
  "test",
]);

export type SessionRole = "key" | "filler";

export function sessionRole(type: WorkoutType): SessionRole {
  return KEY_TYPES.has(type) ? "key" : "filler";
}

// ---------------------------------------------------------------------------
// Tunable thresholds (one place to adjust the coaching policy)
// ---------------------------------------------------------------------------

/** Below this km-weighted completion, the week "slipped" (Tier 1). */
export const TIER1_COMPLETION = 0.85;
/** Below this km-weighted completion, the week went "off the rails" (Tier 2). */
export const TIER2_COMPLETION = 0.6;

/** Tier 1: hold back the planned progression for the upcoming week. */
export const SCALE_TIER1 = 0.9;
/** Tier 2: recovery-week volume for the sessions we keep. */
export const SCALE_TIER2 = 0.65;

/**
 * Grace before a past-due `planned` session is treated as a confirmed miss.
 * A run done on Sunday but logged Monday must not be auto-missed by the Monday
 * cron — within this window the session stays pending and invisible to the
 * assessment (never act on an uncertain signal); it only becomes a confirmed
 * miss at the next weekly review if still unlogged.
 */
export const AUTO_MISS_GRACE_MS = 48 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Inputs / output
// ---------------------------------------------------------------------------

/** A session from the week that just closed, after auto-miss reconciliation. */
export type ClosedSession = {
  workoutId: string;
  type: WorkoutType;
  /** "completed" | "missed" — closed-week sessions are all in the past. */
  status: string;
  /** Planned distance (km) from the stored structure — the load weight. */
  plannedKm: number;
};

/** A still-`planned` session in the week ahead — a candidate to reshape. */
export type UpcomingSession = {
  workoutId: string;
  type: WorkoutType;
  plannedKm: number;
};

export type WeeklyReviewInputs = {
  closed: ClosedSession[];
  upcoming: UpcomingSession[];
  /** Did the previous week's review land on Tier ≥ 1? Drives streak escalation. */
  prevWeekAdjusted: boolean;
};

export type LoadTier = 0 | 1 | 2;

export type WeeklyReviewSignals = {
  keyTotal: number;
  keyMissed: number;
  /** completed km / planned km of the closed week (1 when the week was empty). */
  completionRatio: number;
  /** Base tier before streak escalation — kept for the decision log. */
  baseTier: LoadTier;
  streakEscalated: boolean;
};

export type WeeklyDecision = {
  tier: LoadTier;
  signals: WeeklyReviewSignals;
  /** Multiply the kept upcoming sessions' volume by this (1 = untouched). */
  scaleFactor: number;
  /** Upcoming workout ids to drop entirely (Tier 2 sheds filler). */
  dropWorkoutIds: string[];
};

// ---------------------------------------------------------------------------
// Closed-week reconciliation (auto-miss with grace)
// ---------------------------------------------------------------------------

/** A closed-week workout as read from storage, before reconciliation. */
export type RawClosedWorkout = {
  workoutId: string;
  type: WorkoutType;
  /** "planned" | "completed" | "missed". */
  status: string;
  /** Planned instant (ms), or null if unparseable. */
  plannedDateMs: number | null;
  plannedKm: number;
};

/**
 * Turn the raw closed-week workouts into the assessment input + the list of
 * sessions to auto-miss. Rules:
 *   - `race` is the goal, never training adherence → excluded entirely (and
 *     never auto-missed).
 *   - `completed` / `missed` carry through verbatim.
 *   - `planned` past the grace window → confirmed miss (auto-missed).
 *   - `planned` within the grace window → pending: excluded from the
 *     assessment so it can't drag completion down or count as a miss yet.
 */
export function reconcileClosedWeek(
  raw: RawClosedWorkout[],
  nowMs: number,
): { closed: ClosedSession[]; autoMissedWorkoutIds: string[] } {
  const closed: ClosedSession[] = [];
  const autoMissedWorkoutIds: string[] = [];
  for (const w of raw) {
    if (w.type === "race") continue;
    const base = { workoutId: w.workoutId, type: w.type, plannedKm: w.plannedKm };
    if (w.status === "completed") {
      closed.push({ ...base, status: "completed" });
    } else if (w.status === "missed") {
      closed.push({ ...base, status: "missed" });
    } else if (w.status === "planned") {
      const pastGrace =
        w.plannedDateMs !== null && w.plannedDateMs < nowMs - AUTO_MISS_GRACE_MS;
      if (pastGrace) {
        autoMissedWorkoutIds.push(w.workoutId);
        closed.push({ ...base, status: "missed" });
      }
      // else: within grace → pending, invisible to this week's assessment.
    }
  }
  return { closed, autoMissedWorkoutIds };
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

export function evaluateWeeklyReview(
  inputs: WeeklyReviewInputs,
): WeeklyDecision {
  const { closed, upcoming, prevWeekAdjusted } = inputs;

  const keySessions = closed.filter((s) => sessionRole(s.type) === "key");
  const keyTotal = keySessions.length;
  const keyMissed = keySessions.filter((s) => s.status === "missed").length;

  const totalKm = closed.reduce((acc, s) => acc + s.plannedKm, 0);
  const completedKm = closed
    .filter((s) => s.status === "completed")
    .reduce((acc, s) => acc + s.plannedKm, 0);
  // An empty closed week has no signal — treat as on-track, never act on absence.
  const completionRatio = totalKm > 0 ? completedKm / totalKm : 1;

  let baseTier: LoadTier = 0;
  if (keyMissed >= 2 || completionRatio < TIER2_COMPLETION) {
    baseTier = 2;
  } else if (keyMissed === 1 || completionRatio < TIER1_COMPLETION) {
    baseTier = 1;
  }

  // Consistency beats any single session: a second consecutive down week is a
  // trend, not a blip — escalate a slip into a deload.
  const streakEscalated = baseTier >= 1 && prevWeekAdjusted;
  const tier: LoadTier = streakEscalated ? 2 : baseTier;

  const scaleFactor =
    tier === 2 ? SCALE_TIER2 : tier === 1 ? SCALE_TIER1 : 1;
  // Tier 2 is a recovery week: shed the filler, keep (scaled) the key work.
  const dropWorkoutIds =
    tier === 2
      ? upcoming
          .filter((s) => sessionRole(s.type) === "filler")
          .map((s) => s.workoutId)
      : [];

  return {
    tier,
    signals: { keyTotal, keyMissed, completionRatio, baseTier, streakEscalated },
    scaleFactor,
    dropWorkoutIds,
  };
}

// ---------------------------------------------------------------------------
// Structure scaling (pure transform on the stored WorkoutStructure)
// ---------------------------------------------------------------------------

// The FIT block is a deep discriminated union that resolves to two nominally
// distinct (but structurally identical) declarations across the agoge module
// boundary, so spreading a block and re-assigning `children` trips tsc. The
// transform is mechanical and fully unit-tested, so we recurse over `any`
// internally and keep the public signature precisely typed.
function scaleBlock(block: any, factor: number): any {
  if (block.kind === "repeat") {
    return {
      ...block,
      children: block.children.map((c: unknown) => scaleBlock(c, factor)),
    };
  }
  const d = block.duration;
  if (d?.type === "distance") {
    return { ...block, duration: { ...d, meters: Math.round(d.meters * factor) } };
  }
  if (d?.type === "time") {
    return { ...block, duration: { ...d, seconds: Math.round(d.seconds * factor) } };
  }
  return block;
}

/**
 * Shrink a session's volume by `factor` while keeping its shape and pace
 * targets — a scaled threshold is still a threshold, just shorter. Leaf step
 * durations (distance or time) scale; rep counts and targets are untouched.
 */
export function scaleStructure(
  structure: WorkoutStructure,
  factor: number,
): WorkoutStructure {
  return {
    ...structure,
    blocks: structure.blocks.map((b) => scaleBlock(b, factor)),
  };
}
