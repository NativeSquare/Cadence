/**
 * Engine: prescriptive coaching rules (deterministic)
 *
 * These are opinions, not Agoge invariants: "don't add 3+ quality sessions in
 * a week", "don't blow up the weekly volume by >10%". They guard the manual
 * edits (reschedule, swap) — the only callers; the Coach never reshapes. Shared
 * here so a single deterministic source of truth backs every caller — no
 * LLM-as-judge.
 *
 * The check functions are pure (take `planWorkouts`); the `validate*` helpers
 * do the DB read of the athlete's current plan and run the checks.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { components } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { loadCurrentAthletePlan } from "../agoge/helpers";
import { summarizeStructure } from "../agoge/periodization";

export type RuleError = { code: string; message: string };

// ---------------------------------------------------------------------------
// ISO week helpers (Mon–Sun, ISO 8601)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function isoWeekKey(dateIso: string): string {
  const d = utcMidnight(new Date(dateIso));
  const day = d.getUTCDay() || 7; // 1..7, Mon=1
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to Thursday
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / MS_PER_DAY + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function isoWeekStart(dateIso: string): string {
  const d = utcMidnight(new Date(dateIso));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString();
}

export function previousIsoWeekKey(dateIso: string): string {
  const monday = new Date(isoWeekStart(dateIso));
  monday.setUTCDate(monday.getUTCDate() - 7);
  return isoWeekKey(monday.toISOString());
}

// ---------------------------------------------------------------------------
// Quality classification
// ---------------------------------------------------------------------------

const QUALITY_TYPES = new Set([
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "fartlek",
  "progression",
  "race_pace",
  "hills",
  "race",
  "test",
]);

export function isQualityType(type: string): boolean {
  return QUALITY_TYPES.has(type);
}

// ---------------------------------------------------------------------------
// Plan workouts
// ---------------------------------------------------------------------------

export type PlanWorkoutLite = {
  _id: string;
  type: string;
  status: "planned" | "completed" | "missed";
  planned?: { date: string; structure?: unknown };
  actual?: { date: string; distanceMeters?: number; durationSeconds?: number };
};

export async function loadPlanWorkouts(
  ctx: QueryCtx | MutationCtx,
  planId: string,
): Promise<PlanWorkoutLite[]> {
  return await ctx.runQuery(components.agoge.public.getWorkoutsByPlan, {
    planId,
  });
}

// ---------------------------------------------------------------------------
// Pure checks
// ---------------------------------------------------------------------------

const MAX_QUALITY_PER_WEEK = 2;
const MAX_VOLUME_INCREASE_RATIO = 1.1;
const MIN_PREV_WEEK_WORKOUTS = 2;

/**
 * Block: the ISO week receiving `addedType` must hold no more than 2 quality
 * sessions. `excludeIds` are the workouts leaving their current slot (the moved
 * workout for a reschedule, both workouts for a swap) so they aren't
 * double-counted in the destination week.
 */
export function checkMaxQualityPerWeek(args: {
  excludeIds: Set<string>;
  addedType: string;
  proposedDate: string;
  planWorkouts: PlanWorkoutLite[];
}): RuleError | null {
  if (!isQualityType(args.addedType)) return null;
  const proposedWeek = isoWeekKey(args.proposedDate);

  let qualityInWeek = 0;
  for (const w of args.planWorkouts) {
    if (args.excludeIds.has(w._id)) continue;
    if (!isQualityType(w.type)) continue;
    const date = w.planned?.date ?? w.actual?.date;
    if (!date) continue;
    if (isoWeekKey(date) === proposedWeek) qualityInWeek += 1;
  }

  if (qualityInWeek + 1 > MAX_QUALITY_PER_WEEK) {
    return {
      code: "philosophy.max_quality_sessions_per_week",
      message:
        `Week ${proposedWeek} would have ${qualityInWeek + 1} quality ` +
        `sessions, but the cap is ${MAX_QUALITY_PER_WEEK}. Replace one ` +
        `quality session with an easy run, or move this session to a ` +
        `different week.`,
    };
  }
  return null;
}

/**
 * Block: the ISO week receiving `addedWorkoutId` must not exceed the previous
 * week's completed volume by more than 10%. Only fires when the prior week has
 * at least two completed workouts (need a real baseline). `excludeIds` are the
 * workouts leaving their current slot.
 */
export function checkWeeklyVolumeCap(args: {
  excludeIds: Set<string>;
  addedWorkoutId: string;
  proposedDate: string;
  planWorkouts: PlanWorkoutLite[];
}): RuleError | null {
  const added = args.planWorkouts.find((w) => w._id === args.addedWorkoutId);
  if (!added?.planned?.structure) return null;
  const addedSummary = summarizeStructure(
    added.planned.structure as WorkoutStructure,
  );
  const addedDistance = addedSummary.distanceMeters;
  const addedDuration = addedSummary.durationSeconds ?? 0;

  const proposedWeek = isoWeekKey(args.proposedDate);

  let weekDistanceOthers = 0;
  let weekDurationOthers = 0;
  for (const w of args.planWorkouts) {
    if (args.excludeIds.has(w._id)) continue;
    if (w.status !== "planned" && w.status !== "missed") continue;
    const date = w.planned?.date;
    if (!date) continue;
    if (isoWeekKey(date) !== proposedWeek) continue;
    if (!w.planned?.structure) continue;
    const s = summarizeStructure(w.planned.structure as WorkoutStructure);
    weekDistanceOthers += s.distanceMeters;
    weekDurationOthers += s.durationSeconds ?? 0;
  }

  const proposedDistance = weekDistanceOthers + addedDistance;
  const proposedDuration = weekDurationOthers + addedDuration;

  const prevWeekKey = previousIsoWeekKey(args.proposedDate);
  let prevDistance = 0;
  let prevDuration = 0;
  let prevCount = 0;
  for (const w of args.planWorkouts) {
    if (w.status !== "completed") continue;
    const date = w.actual?.date;
    if (!date) continue;
    if (isoWeekKey(date) !== prevWeekKey) continue;
    prevDistance += w.actual?.distanceMeters ?? 0;
    prevDuration += w.actual?.durationSeconds ?? 0;
    prevCount += 1;
  }
  if (prevCount < MIN_PREV_WEEK_WORKOUTS) return null;

  if (
    prevDistance > 0 &&
    proposedDistance > prevDistance * MAX_VOLUME_INCREASE_RATIO
  ) {
    const cap = (prevDistance * MAX_VOLUME_INCREASE_RATIO) / 1000;
    return {
      code: "philosophy.weekly_volume_increase_cap",
      message:
        `Week ${proposedWeek} planned distance ` +
        `(${(proposedDistance / 1000).toFixed(1)} km) exceeds 110% of last ` +
        `week's actual (${(prevDistance / 1000).toFixed(1)} km). ` +
        `Cap is ${cap.toFixed(1)} km — reduce this workout's distance or ` +
        `move it to a later week.`,
    };
  }

  if (
    prevDistance === 0 &&
    prevDuration > 0 &&
    proposedDuration > prevDuration * MAX_VOLUME_INCREASE_RATIO
  ) {
    const cap = Math.round((prevDuration * MAX_VOLUME_INCREASE_RATIO) / 60);
    return {
      code: "philosophy.weekly_volume_increase_cap",
      message:
        `Week ${proposedWeek} planned duration ` +
        `(${Math.round(proposedDuration / 60)} min) exceeds 110% of last ` +
        `week's actual (${Math.round(prevDuration / 60)} min). ` +
        `Cap is ${cap} min — reduce duration or move to a later week.`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// DB-touching validators
// ---------------------------------------------------------------------------

/**
 * Apply all prescriptive coaching rules to a single proposed move. Returns the
 * first violation, or null if everything checks out. No-op when the athlete has
 * no current active plan.
 */
export async function validateMoveAgainstRules(
  ctx: MutationCtx | QueryCtx,
  args: {
    workoutId: string;
    workoutType: string;
    athleteId: string;
    proposedDate: string;
  },
): Promise<RuleError | null> {
  const current = await loadCurrentAthletePlan(ctx, args.athleteId);
  if (!current) return null;
  const planWorkouts = await loadPlanWorkouts(ctx, current.plan._id);
  const excludeIds = new Set([args.workoutId]);

  const qualityErr = checkMaxQualityPerWeek({
    excludeIds,
    addedType: args.workoutType,
    proposedDate: args.proposedDate,
    planWorkouts,
  });
  if (qualityErr) return qualityErr;

  const volumeErr = checkWeeklyVolumeCap({
    excludeIds,
    addedWorkoutId: args.workoutId,
    proposedDate: args.proposedDate,
    planWorkouts,
  });
  if (volumeErr) return volumeErr;

  return null;
}

/**
 * Apply the coaching rules to a two-workout swap. Both workouts leave their
 * current slot and land on the other's date, so we check each destination week
 * with both ids excluded from the tally. Returns the first violation, or null.
 */
export async function validateSwapAgainstRules(
  ctx: MutationCtx | QueryCtx,
  args: {
    athleteId: string;
    a: { _id: string; type: string; plannedDate: string };
    b: { _id: string; type: string; plannedDate: string };
  },
): Promise<RuleError | null> {
  const current = await loadCurrentAthletePlan(ctx, args.athleteId);
  if (!current) return null;
  const planWorkouts = await loadPlanWorkouts(ctx, current.plan._id);
  const excludeIds = new Set([args.a._id, args.b._id]);

  // A lands on B's date.
  const q1 = checkMaxQualityPerWeek({
    excludeIds,
    addedType: args.a.type,
    proposedDate: args.b.plannedDate,
    planWorkouts,
  });
  if (q1) return q1;
  const v1 = checkWeeklyVolumeCap({
    excludeIds,
    addedWorkoutId: args.a._id,
    proposedDate: args.b.plannedDate,
    planWorkouts,
  });
  if (v1) return v1;

  // B lands on A's date.
  const q2 = checkMaxQualityPerWeek({
    excludeIds,
    addedType: args.b.type,
    proposedDate: args.a.plannedDate,
    planWorkouts,
  });
  if (q2) return q2;
  const v2 = checkWeeklyVolumeCap({
    excludeIds,
    addedWorkoutId: args.b._id,
    proposedDate: args.a.plannedDate,
    planWorkouts,
  });
  if (v2) return v2;

  return null;
}
