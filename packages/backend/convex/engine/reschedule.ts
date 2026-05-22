/**
 * Engine: reschedule
 *
 * Deterministic policy for "move workout X to date Y." The Engine — not the
 * AI Coach — owns the decision of *how* to realize the move:
 *
 *   - target slot empty                 → simple reschedule
 *   - target slot occupied, same week   → swap with the workout sitting there
 *   - target slot occupied, other week  → reject
 *
 * Same-week is the ISO week (Mon–Sun) containing the source's planned date.
 * Athletes mentally batch by week, so a same-week swap reads as "moving things
 * around"; crossing weeks would silently restructure the load.
 *
 * Both the Agoge domain validators and the Engine's prescriptive coaching
 * rules (weekly volume cap, quality-per-week cap) run before any write.
 * Rejections come back as `{ ok: false, errors }` so the calling Coach tool
 * can surface a structured failure (and the LLM can retry with a different
 * target date).
 *
 * Coach tools call this via `ctx.runMutation(internal.engine.reschedule.reschedule, …)`.
 * It is not a public mutation — direct user invocation goes through Agoge.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { type Infer, ConvexError, v } from "convex/values";
import { api, components } from "../_generated/api";
import {
  internalMutation,
  type MutationCtx,
} from "../_generated/server";
import {
  loadCurrentAthletePlan,
  loadOwnedWorkout,
  validateIsoInstantDate,
} from "../agoge/helpers";
import { summarizeStructure } from "../agoge/periodization";

const errorValidator = v.object({ code: v.string(), message: v.string() });

const beforeValidator = v.object({
  workoutId: v.string(),
  plannedDate: v.string(),
  swappedWith: v.optional(
    v.object({
      workoutId: v.string(),
      plannedDate: v.string(),
    }),
  ),
});

const rescheduleResultValidator = v.union(
  v.object({
    ok: v.literal(true),
    action: v.union(v.literal("moved"), v.literal("swapped")),
    before: beforeValidator,
  }),
  v.object({
    ok: v.literal(false),
    errors: v.array(errorValidator),
  }),
);

export type RescheduleResult = Infer<typeof rescheduleResultValidator>;
type RuleError = { code: string; message: string };

function ymd(iso: string): string {
  return iso.slice(0, 10);
}

const MS_PER_DAY = 86_400_000;

function utcMidnight(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isoWeekKey(dateIso: string): string {
  const d = utcMidnight(new Date(dateIso));
  const day = d.getUTCDay() || 7; // 1..7, Mon=1
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to Thursday
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / MS_PER_DAY + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function isoWeekStart(dateIso: string): string {
  const d = utcMidnight(new Date(dateIso));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString();
}

function previousIsoWeekKey(dateIso: string): string {
  const monday = new Date(isoWeekStart(dateIso));
  monday.setUTCDate(monday.getUTCDate() - 7);
  return isoWeekKey(monday.toISOString());
}

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

function isQualityType(type: string): boolean {
  return QUALITY_TYPES.has(type);
}

function fromConvexError(err: unknown): {
  ok: false;
  errors: RuleError[];
} {
  if (err instanceof ConvexError && typeof err.data === "object" && err.data) {
    const data = err.data as {
      code?: string;
      errors?: RuleError[];
    };
    if (Array.isArray(data.errors)) return { ok: false, errors: data.errors };
    return {
      ok: false,
      errors: [
        {
          code: data.code ?? "UNKNOWN",
          message:
            typeof err.message === "string" ? err.message : "Mutation failed",
        },
      ],
    };
  }
  return {
    ok: false,
    errors: [
      {
        code: "UNKNOWN",
        message: err instanceof Error ? err.message : String(err),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Prescriptive coaching rules (formerly coach/philosophy/rules/*)
//
// These are opinions, not Agoge invariants: "don't add 3+ quality sessions
// in a week", "don't blow up the weekly volume by >10%". They block the
// write when violated. We own the Engine so the rules live next to the
// operation that needs them, no registry indirection.
// ---------------------------------------------------------------------------

const MAX_QUALITY_PER_WEEK = 2;
const MAX_VOLUME_INCREASE_RATIO = 1.1;
const MIN_PREV_WEEK_WORKOUTS = 2;

type PlanWorkoutLite = {
  _id: string;
  type: string;
  status: "planned" | "completed" | "missed";
  planned?: { date: string; structure?: unknown };
  actual?: { date: string; distanceMeters?: number; durationSeconds?: number };
};

async function loadPlanWorkouts(
  ctx: MutationCtx,
  planId: string,
): Promise<PlanWorkoutLite[]> {
  return await ctx.runQuery(components.agoge.public.getWorkoutsByPlan, {
    planId,
  });
}

/**
 * Block: an ISO week must contain no more than 2 quality sessions
 * (tempo/threshold/intervals/vo2max/fartlek/progression/race_pace/hills/race/test).
 */
function checkMaxQualityPerWeek(args: {
  movedWorkoutId: string;
  movedWorkoutType: string;
  proposedDate: string;
  planWorkouts: PlanWorkoutLite[];
}): RuleError | null {
  if (!isQualityType(args.movedWorkoutType)) return null;
  const proposedWeek = isoWeekKey(args.proposedDate);

  let qualityInWeek = 0;
  for (const w of args.planWorkouts) {
    if (w._id === args.movedWorkoutId) continue;
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
 * Block: a week's planned volume must not exceed the previous week's
 * completed volume by more than 10%. Only fires when the prior week has at
 * least two completed workouts (need a real baseline to compare against).
 */
function checkWeeklyVolumeCap(args: {
  movedWorkoutId: string;
  proposedDate: string;
  planWorkouts: PlanWorkoutLite[];
}): RuleError | null {
  const moved = args.planWorkouts.find((w) => w._id === args.movedWorkoutId);
  if (!moved?.planned?.structure) return null;
  const movedSummary = summarizeStructure(
    moved.planned.structure as WorkoutStructure,
  );
  const movedDistance = movedSummary.distanceMeters;
  const movedDuration = movedSummary.durationSeconds ?? 0;

  const proposedWeek = isoWeekKey(args.proposedDate);

  let weekDistanceOthers = 0;
  let weekDurationOthers = 0;
  for (const w of args.planWorkouts) {
    if (w._id === args.movedWorkoutId) continue;
    if (w.status !== "planned" && w.status !== "missed") continue;
    const date = w.planned?.date;
    if (!date) continue;
    if (isoWeekKey(date) !== proposedWeek) continue;
    if (!w.planned?.structure) continue;
    const s = summarizeStructure(w.planned.structure as WorkoutStructure);
    weekDistanceOthers += s.distanceMeters;
    weekDurationOthers += s.durationSeconds ?? 0;
  }

  const proposedDistance = weekDistanceOthers + movedDistance;
  const proposedDuration = weekDurationOthers + movedDuration;

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

/**
 * Apply all prescriptive coaching rules to a single proposed move. Returns
 * the first violation, or null if everything checks out. No-op when the
 * athlete has no current active plan.
 */
async function validateMoveAgainstRules(
  ctx: MutationCtx,
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

  const qualityErr = checkMaxQualityPerWeek({
    movedWorkoutId: args.workoutId,
    movedWorkoutType: args.workoutType,
    proposedDate: args.proposedDate,
    planWorkouts,
  });
  if (qualityErr) return qualityErr;

  const volumeErr = checkWeeklyVolumeCap({
    movedWorkoutId: args.workoutId,
    proposedDate: args.proposedDate,
    planWorkouts,
  });
  if (volumeErr) return volumeErr;

  return null;
}

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

export const reschedule = internalMutation({
  args: {
    workoutId: v.string(),
    toDate: v.string(),
  },
  returns: rescheduleResultValidator,
  handler: async (ctx, { workoutId, toDate }): Promise<RescheduleResult> => {
    const owned = await loadOwnedWorkout(ctx, workoutId);
    if (!owned) {
      return {
        ok: false as const,
        errors: [{ code: "NOT_AUTHORIZED", message: "Not authorized" }],
      };
    }
    const { workout } = owned;
    const planned = workout.planned;
    if (!planned) {
      return {
        ok: false as const,
        errors: [
          {
            code: "INVALID_STATE",
            message: "Cannot reschedule a workout without a planned face",
          },
        ],
      };
    }
    if (workout.status === "completed") {
      return {
        ok: false as const,
        errors: [
          {
            code: "INVALID_STATE",
            message: "Cannot reschedule a completed workout",
          },
        ],
      };
    }

    const dateErr = validateIsoInstantDate(toDate, "toDate");
    if (dateErr) return { ok: false as const, errors: [dateErr] };

    // Collision detection — any *other* planned workout sharing the target day?
    const dayPrefix = ymd(toDate);
    const dayStart = `${dayPrefix}T00:00:00.000Z`;
    const dayEnd = `${dayPrefix}T23:59:59.999Z`;
    const sameDay = await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: workout.athleteId,
        startDate: dayStart,
        endDate: dayEnd,
      },
    );
    const collision = sameDay.find((w) => w._id !== workoutId);

    if (collision) {
      const sourceWeek = isoWeekKey(planned.date);
      const targetWeek = isoWeekKey(toDate);
      if (sourceWeek !== targetWeek) {
        return {
          ok: false as const,
          errors: [
            {
              code: "SLOT_OCCUPIED",
              message: `Target date ${dayPrefix} is occupied by "${collision.name}" and falls in a different week from the source. Pick another date in the source's week to allow a swap, or pick an empty date.`,
            },
          ],
        };
      }

      const agoge = await ctx.runQuery(api.agoge.workouts.dryRunSwapWorkouts, {
        workoutAId: workoutId,
        workoutBId: collision._id,
      });
      if (!agoge.ok) return { ok: false as const, errors: agoge.errors };

      const phil1 = await validateMoveAgainstRules(ctx, {
        workoutId,
        workoutType: workout.type,
        athleteId: workout.athleteId,
        proposedDate: toDate,
      });
      if (phil1) return { ok: false as const, errors: [phil1] };
      const phil2 = await validateMoveAgainstRules(ctx, {
        workoutId: collision._id,
        workoutType: collision.type,
        athleteId: workout.athleteId,
        proposedDate: planned.date,
      });
      if (phil2) return { ok: false as const, errors: [phil2] };

      try {
        await ctx.runMutation(api.agoge.workouts.swapWorkouts, {
          workoutAId: workoutId,
          workoutBId: collision._id,
        });
      } catch (err) {
        return fromConvexError(err);
      }

      return {
        ok: true as const,
        action: "swapped" as const,
        before: {
          workoutId,
          plannedDate: planned.date,
          swappedWith: {
            workoutId: collision._id,
            plannedDate: collision.planned?.date ?? planned.date,
          },
        },
      };
    }

    const agoge = await ctx.runQuery(
      api.agoge.workouts.dryRunRescheduleWorkout,
      { workoutId, date: toDate },
    );
    if (!agoge.ok) return { ok: false as const, errors: agoge.errors };

    const phil = await validateMoveAgainstRules(ctx, {
      workoutId,
      workoutType: workout.type,
      athleteId: workout.athleteId,
      proposedDate: toDate,
    });
    if (phil) return { ok: false as const, errors: [phil] };

    try {
      await ctx.runMutation(api.agoge.workouts.rescheduleWorkout, {
        workoutId,
        date: toDate,
      });
    } catch (err) {
      return fromConvexError(err);
    }

    return {
      ok: true as const,
      action: "moved" as const,
      before: { workoutId, plannedDate: planned.date },
    };
  },
});
