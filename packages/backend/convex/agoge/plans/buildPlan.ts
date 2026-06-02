/**
 * Distance-agnostic plan orchestration — the single source of truth for what a
 * race plan contains. Both the production generator (`engine/generatePlan.ts` →
 * `generate`) and the admin Playground simulator call it (via the per-distance
 * `buildFiveKPlan` / `buildTenKPlan` wrappers): the generator persists the
 * result, the simulator renders it. Sharing one core guarantees the simulator
 * shows *exactly* what production produces — no drift.
 *
 * It is decoupled from persistence: instead of writing each workout to the DB, it
 * returns a `PlanTrace` where every session carries whether it was dropped by the
 * emit guards and why (the key debugging payload).
 *
 * ⚠️ NO convex runtime imports. This file is imported into the admin browser
 * bundle, so its entire transitive runtime graph must stay Convex-free. Keep all
 * `@nativesquare/agoge*` imports `import type` (they erase at build) so
 * `convex/values` never leaks in.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { BlockType, RaceFormat } from "@nativesquare/agoge/schema";
import {
  addDaysYmd,
  buildRaceStructure,
  buildStructure,
  computeVdot,
  distancePeakKm,
  isoDayOfWeek,
  type Locale,
  type Paces,
  type Schedule,
  type SessionSpec,
  summarizeStructure,
  trainingPaces,
  weeklyVolumeCurve,
  workoutName,
} from "../periodization";
import {
  lastHardDow,
  microcycle,
  type PlanEngineSpec,
  type PlanGrid,
  planGrid,
  taperSessions,
} from "./planEngine";

// Taper volume as a fraction of peak — drives EF duration + warmup scaling for
// the taper's easy days (the taper itself is mostly rest + a short tune-up).
// Single source of truth: `generate` imports it from here (via the wrappers).
export const TAPER_VOLUME_FACTOR = 0.6;

/** Per-distance knobs the orchestration needs beyond the engine spec. */
export type BuildPlanOptions = {
  /** Race format for peak-volume derivation (`distancePeakKm`). */
  format: RaceFormat;
  /** Race distance fallback when inputs omit `raceDistanceMeters`. */
  defaultDistanceMeters: number;
};

// ---------------------------------------------------------------------------
// Phase-count helpers (shared by the generator and the simulator; `expandPhases`
// is also used by the non-5K/10K generic branch in generatePlan.ts).
// ---------------------------------------------------------------------------

/**
 * Split a plan's pre-taper Mon→Sun weeks into base/build/peak. peak = 1
 * (spécifique / pics), build = up to 4 (2 construction-début + 2 construction-fin),
 * base = the rest. The taper is sized in days and created separately, so it isn't
 * part of this split.
 */
export function preTaperSplit(preTaperWeeks: number): {
  base: number;
  build: number;
  peak: number;
} {
  if (preTaperWeeks <= 0) return { base: 0, build: 0, peak: 0 };
  if (preTaperWeeks === 1) return { base: 0, build: 0, peak: 1 };
  const peak = 1;
  const build = Math.min(4, preTaperWeeks - peak);
  const base = preTaperWeeks - peak - build;
  return { base, build, peak };
}

export function expandPhases(phases: {
  base: number;
  build: number;
  peak: number;
  taper: number;
}): BlockType[] {
  const out: BlockType[] = [];
  for (let i = 0; i < phases.base; i++) out.push("base");
  for (let i = 0; i < phases.build; i++) out.push("build");
  for (let i = 0; i < phases.peak; i++) out.push("peak");
  for (let i = 0; i < phases.taper; i++) out.push("taper");
  return out;
}

// ---------------------------------------------------------------------------
// Inputs + trace types
// ---------------------------------------------------------------------------

export type BuildPlanInputs = {
  /** Plan start (YYYY-MM-DD). An input — never `new Date()` inside this fn. */
  planStartYmd: string;
  /** Race day (YYYY-MM-DD). */
  raceYmd: string;
  /** Baseline weekly volume. Replaces `loadBaselineVolume` (which used the clock). */
  currentKm: number;
  schedule: Schedule;
  /** Affects `workoutName` labels only. */
  locale: Locale;
  /** Defaults to the options' `defaultDistanceMeters`; feeds peakKm + race structure. */
  raceDistanceMeters?: number;
  /** Explicit peak weekly km; else derived via `distancePeakKm(format, dist)`. */
  peakKm?: number;
  /** Pacing resolution priority: `paces` > `vdot` > `targetTimeSeconds`. */
  paces?: Paces;
  vdot?: number;
  targetTimeSeconds?: number;
};

/** Why the emit guards would have dropped a session (instead of persisting it). */
export type DropReason =
  | "before-plan-start"
  | "on-or-after-race"
  | "too-short-no-spec"
  | "structure-empty";

export type TracedSession = {
  dateYmd: string;
  /** isoDayOfWeek(dateYmd): 0=Mon … 6=Sun — for the calendar grid. */
  dayOfWeek: number;
  spec: SessionSpec;
  dropped: boolean;
  /** Present iff dropped — the key debugging payload. */
  dropReason?: DropReason;
  /** Present iff not dropped. */
  structure?: WorkoutStructure;
  workoutName?: string;
  labelDistanceMeters?: number;
};

export type TracedWeek = {
  weekIndex: number;
  phase: BlockType;
  weekIndexInPhase: number;
  weekKm: number;
  /** Monday: addDaysYmd(gridStartYmd, weekIndex*7). */
  weekStartYmd: string;
  sessions: TracedSession[];
};

export type PlanTrace = {
  inputs: BuildPlanInputs;
  resolved: {
    vdot?: number;
    paces?: Paces;
    peakKm: number;
    planPeakKm: number;
  };
  grid: PlanGrid;
  preTaperSplit: { base: number; build: number; peak: number };
  phaseByWeek: BlockType[];
  volumeCurve: number[];
  weeks: TracedWeek[];
  taper: { sessions: TracedSession[] };
  race: { dateYmd: string; structure?: WorkoutStructure } | null;
  /** Block layout, mirroring the generator's date math (no DB). */
  blocks: Array<{ type: BlockType; startYmd: string; endYmd: string }>;
};

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function resolvePaces(
  i: BuildPlanInputs,
  defaultDistanceMeters: number,
): { vdot?: number; paces?: Paces } {
  if (i.paces) return { vdot: i.vdot, paces: i.paces };
  const vdot =
    i.vdot ??
    (i.targetTimeSeconds && i.targetTimeSeconds > 0
      ? computeVdot(
          i.raceDistanceMeters ?? defaultDistanceMeters,
          i.targetTimeSeconds,
        )
      : undefined);
  return { vdot, paces: vdot !== undefined ? trainingPaces(vdot) : undefined };
}

type TraceCommon = {
  planStartYmd: string;
  raceYmd: string;
  paces?: Paces;
  locale: Locale;
};

/**
 * Pure mirror of `emitTrainingWorkout` (generatePlan.ts): same guard order, same
 * `buildStructure` arguments, same `summarizeStructure`/`workoutName` calls. The
 * combined date guard is split into two distinct drop reasons for the trace, but
 * the net drop decision is identical.
 */
function traceSession(
  common: TraceCommon,
  dateYmd: string,
  spec: SessionSpec,
): TracedSession {
  const base = { dateYmd, dayOfWeek: isoDayOfWeek(dateYmd), spec };
  if (dateYmd < common.planStartYmd) {
    return { ...base, dropped: true, dropReason: "before-plan-start" };
  }
  if (dateYmd >= common.raceYmd) {
    return { ...base, dropped: true, dropReason: "on-or-after-race" };
  }
  const distanceMeters = Math.round(spec.distanceKm * 1000);
  if (distanceMeters < 500 && !spec.structureSpec) {
    return { ...base, dropped: true, dropReason: "too-short-no-spec" };
  }
  const structure = buildStructure(
    spec.type,
    spec.intensity,
    distanceMeters,
    common.paces,
    spec.structureSpec,
  );
  if (!structure) {
    return { ...base, dropped: true, dropReason: "structure-empty" };
  }
  const labelDistance = summarizeStructure(structure).distanceMeters;
  return {
    ...base,
    dropped: false,
    structure,
    labelDistanceMeters: labelDistance,
    workoutName: workoutName({
      type: spec.type,
      distanceMeters: labelDistance,
      structure,
      locale: common.locale,
    }),
  };
}

/** Pure copy of `createBlocks5K`'s date math (no `ctx.runMutation`). */
function buildBlocks(
  gridStartYmd: string,
  planStartYmd: string,
  taperStartYmd: string,
  raceYmd: string,
  phaseByWeek: BlockType[],
): Array<{ type: BlockType; startYmd: string; endYmd: string }> {
  const blocks: Array<{ type: BlockType; startYmd: string; endYmd: string }> =
    [];
  const order: BlockType[] = ["base", "build", "peak"];
  for (const phase of order) {
    const startIdx = phaseByWeek.indexOf(phase);
    if (startIdx === -1) continue;
    let endIdx = startIdx;
    while (
      endIdx + 1 < phaseByWeek.length &&
      phaseByWeek[endIdx + 1] === phase
    ) {
      endIdx++;
    }
    const gridBlockStart = addDaysYmd(gridStartYmd, startIdx * 7);
    const startYmd =
      gridBlockStart < planStartYmd ? planStartYmd : gridBlockStart;
    const endYmd = addDaysYmd(gridStartYmd, (endIdx + 1) * 7 - 1);
    blocks.push({ type: phase, startYmd, endYmd });
  }
  const taperStart =
    taperStartYmd < planStartYmd ? planStartYmd : taperStartYmd;
  blocks.push({ type: "taper", startYmd: taperStart, endYmd: raceYmd });
  return blocks;
}

/**
 * Build the full traced plan for a distance (bound by `spec` + `opts`):
 * grid → pre-taper split → phaseByWeek → volume curve → per-week microcycles
 * (threading the cross-week hard-day seam) → taper → race.
 */
export function buildPlan(
  spec: PlanEngineSpec,
  opts: BuildPlanOptions,
  inputs: BuildPlanInputs,
): PlanTrace {
  const { planStartYmd, raceYmd, currentKm, schedule, locale } = inputs;
  const raceDistanceMeters =
    inputs.raceDistanceMeters ?? opts.defaultDistanceMeters;
  const { vdot, paces } = resolvePaces(inputs, opts.defaultDistanceMeters);
  const peakKm =
    inputs.peakKm ?? distancePeakKm(opts.format, raceDistanceMeters);

  const grid = planGrid(spec, planStartYmd, raceYmd);
  const { gridStartYmd, taperStartYmd, preTaperWeeks } = grid;

  const split = preTaperSplit(preTaperWeeks);
  const phaseByWeek = expandPhases({ ...split, taper: 0 });
  const maxBuildMultiple = preTaperWeeks + 1 < 6 ? 1.2 : 2.5;
  const volumeCurve = weeklyVolumeCurve({
    weeks: preTaperWeeks,
    currentKm,
    peakKm,
    taperWeeks: 0,
    maxBuildMultiple,
  });
  const planPeakKm = Math.max(currentKm, ...volumeCurve);

  const common: TraceCommon = { planStartYmd, raceYmd, paces, locale };

  const weeks: TracedWeek[] = [];
  let weekIndexInPhase = 0;
  let prevPhase: BlockType | undefined;
  // Last hard day-of-week of the previous week, threaded into each microcycle so
  // `placeRoles` keeps a recovery gap across the Mon→Sun boundary (no Sunday long
  // followed by a Monday quality). Undefined for the first week.
  let prevLastHardDow: number | undefined;
  for (let w = 0; w < preTaperWeeks; w++) {
    const phase = phaseByWeek[w];
    if (!phase) continue;
    const weekKm = volumeCurve[w] ?? 0;
    const weekStartYmd = addDaysYmd(gridStartYmd, w * 7); // a Monday

    if (phase === prevPhase) {
      weekIndexInPhase += 1;
    } else {
      weekIndexInPhase = 0;
      prevPhase = phase;
    }

    const sessions = microcycle(spec, {
      phase,
      weekIndexInPhase,
      weekKm,
      schedule,
      peakKm: planPeakKm,
      paces,
      vdot,
      // Peak only: anchors the last race-pace spé to J-8→J-10 before the race.
      raceDow: isoDayOfWeek(raceYmd),
      // Global plan position (0 = first pre-taper week → 1 = peak week). Drives
      // how hard a workout each quality-session bank draws this week.
      planProgress: preTaperWeeks <= 1 ? 1 : w / (preTaperWeeks - 1),
      // Previous week's last hard day — keeps the cross-boundary recovery gap.
      prevLastHardDow,
    });

    // Carry this week's last hard day into the next iteration's microcycle.
    prevLastHardDow = lastHardDow(sessions);

    const traced: TracedSession[] = sessions.map((session) => {
      // weekStart is a Monday, so day-of-week (0=Mon) is the offset directly.
      const dateYmd = addDaysYmd(weekStartYmd, session.dayOfWeek);
      return traceSession(common, dateYmd, session);
    });

    weeks.push({
      weekIndex: w,
      phase,
      weekIndexInPhase,
      weekKm,
      weekStartYmd,
      sessions: traced,
    });
  }

  // Taper: variable-length tail laid out over absolute dates.
  const taperList = taperSessions(spec, {
    taperStartYmd,
    raceYmd,
    weekKm: planPeakKm * TAPER_VOLUME_FACTOR,
    peakKm: planPeakKm,
    schedule,
    paces,
    vdot,
  });
  const taper = taperList.map(({ spec: sessionSpec, dateYmd }) =>
    traceSession(common, dateYmd, sessionSpec),
  );

  // Race day: emitted as its own workout in production.
  const raceStructure = buildRaceStructure({
    distanceMeters: raceDistanceMeters,
    goalSeconds: inputs.targetTimeSeconds,
  });

  return {
    inputs,
    resolved: { vdot, paces, peakKm, planPeakKm },
    grid,
    preTaperSplit: split,
    phaseByWeek,
    volumeCurve,
    weeks,
    taper: { sessions: taper },
    race: raceStructure ? { dateYmd: raceYmd, structure: raceStructure } : null,
    blocks: buildBlocks(
      gridStartYmd,
      planStartYmd,
      taperStartYmd,
      raceYmd,
      phaseByWeek,
    ),
  };
}
