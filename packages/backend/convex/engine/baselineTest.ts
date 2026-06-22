/**
 * Engine: pre-plan baseline assessment.
 *
 * Plan generation is gated on the athlete having a recorded VDOT metric. If
 * they do, the appropriate plan generator is scheduled immediately. If not, a
 * single test workout (5K time trial) is created under the empty plan.
 * Completing the test — or reporting a recent race result — writes a VDOT
 * metric and triggers plan generation.
 */

import { ConvexError, v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { loadAthlete, requireAuthError } from "../agoge/helpers";
import {
  buildTestStructure,
  computeVdot,
  type Locale,
  ymdToNoonUtc,
} from "../agoge/periodization";

export const TEST_NAME: Record<Locale, string> = {
  en: "5K time trial",
  fr: "Test 5 km",
};

export const TEST_DESCRIPTION: Record<Locale, string> = {
  en: "Run 5 km as fast as you can sustain. Your finish time sets the pace targets for the rest of your plan.",
  fr: "Cours 5 km aussi vite que tu peux le maintenir. Ton temps déterminera les allures cibles du reste du plan.",
};

/** Pure: (distance, time) → VDOT. Works for any pair, not just 5K. */
export function deriveVdotFromTest(
  distanceMeters: number,
  timeSeconds: number,
): number {
  return computeVdot(distanceMeters, timeSeconds);
}

export async function scheduleGenerate(
  ctx: MutationCtx,
  planId: string,
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.engine.generatePlan.generate, {
    planId,
  });
}

/**
 * Hook for the workout-completion path. When a "test" workout is marked
 * completed with valid actuals, derive a VDOT from the result, record it as
 * a metric, and kick off plan generation if the plan is still empty.
 */
export async function recordVdotFromCompletedTest(
  ctx: MutationCtx,
  workout: {
    athleteId: string;
    planId?: string;
    actual?: { distanceMeters?: number; durationSeconds?: number };
  },
): Promise<void> {
  const distance = workout.actual?.distanceMeters;
  const duration = workout.actual?.durationSeconds;
  if (!distance || distance <= 0 || !duration || duration <= 0) return;

  const vdot = deriveVdotFromTest(distance, duration);

  await ctx.runMutation(components.agoge.public.createMetric, {
    athleteId: workout.athleteId,
    kind: "vdot",
    value: vdot,
    source: "time_trial",
  });

  if (!workout.planId) return;
  const blocks = await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
    planId: workout.planId,
  });
  if (blocks.length > 0) return;

  const plan = await ctx.runQuery(components.agoge.public.getPlan, {
    planId: workout.planId,
  });
  if (!plan) return;

  const goal = await ctx.runQuery(components.agoge.public.getGoal, {
    goalId: plan.goalId,
  });
  if (!goal) return;

  await scheduleGenerate(ctx, workout.planId);
}

/**
 * Decide whether to start plan generation now or wait for a baseline test.
 *
 * - Latest VDOT metric present: schedule the appropriate generator.
 * - No VDOT yet: create a single baseline test workout under the plan (no
 *   blockId — plan has no blocks until generation runs) and do NOT schedule
 *   the generator. Completing the test (workouts.ts) or reporting a recent
 *   race result will schedule it.
 */
export async function gatePlanGeneration(
  ctx: MutationCtx,
  args: {
    athleteId: string;
    userId: Id<"users">;
    planId: string;
    planStartDate: string;
  },
): Promise<void> {
  const latestVdot = await ctx.runQuery(
    components.agoge.public.getMetricByAthleteKind,
    { athleteId: args.athleteId, kind: "vdot" },
  );

  if (latestVdot) {
    await scheduleGenerate(ctx, args.planId);
    return;
  }

  const user = await ctx.runQuery(api.table.users.get, { id: args.userId });
  const locale: Locale = user?.locale ?? "en";

  await ctx.runMutation(components.agoge.public.createWorkout, {
    athleteId: args.athleteId,
    planId: args.planId,
    name: TEST_NAME[locale],
    description: TEST_DESCRIPTION[locale],
    type: "test",
    sport: "run",
    status: "planned",
    planned: {
      date: ymdToNoonUtc(args.planStartDate),
      structure: buildTestStructure(),
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Record a fresh VDOT for the current athlete and (re)trigger plan generation
 * for any pending plan. Drops pending baseline-test workouts since they're no
 * longer needed once VDOT is known.
 */
async function applyVdotAndKickPlans(
  ctx: MutationCtx,
  athleteId: string,
  vdot: number,
  source: "race" | "self_reported",
): Promise<void> {
  await ctx.runMutation(components.agoge.public.createMetric, {
    athleteId,
    kind: "vdot",
    value: vdot,
    source,
  });

  const activeGoals = await ctx.runQuery(
    components.agoge.public.getGoalsByAthleteAndStatus,
    { athleteId, status: "active" },
  );

  for (const goal of activeGoals) {
    const plans = await ctx.runQuery(
      components.agoge.public.getPlansByGoal,
      { goalId: goal._id },
    );
    for (const plan of plans) {
      if (plan.archivedAt !== undefined) continue;
      const blocks = await ctx.runQuery(
        components.agoge.public.getBlocksByPlan,
        { planId: plan._id },
      );
      if (blocks.length > 0) continue;

      const workouts = await ctx.runQuery(
        components.agoge.public.getWorkoutsByPlan,
        { planId: plan._id },
      );
      for (const w of workouts) {
        if (w.type === "test" && w.status === "planned") {
          await ctx.runMutation(components.agoge.public.deleteWorkout, {
            workoutId: w._id,
          });
        }
      }

      await scheduleGenerate(ctx, plan._id);
    }
  }
}

/**
 * Set fitness from a user-reported race result. Same downstream effect as a
 * completed baseline test — writes a VDOT metric and (re)triggers plan
 * generation for any pending plan. The result doesn't need to be a standard
 * distance; any (distance, time) pair yields a valid VDOT.
 */
export const setVdotFromRaceResult = mutation({
  args: { distanceMeters: v.number(), timeSeconds: v.number() },
  handler: async (ctx, { distanceMeters, timeSeconds }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    if (!(distanceMeters > 0) || !(timeSeconds > 0)) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_INPUT",
            message:
              "distanceMeters and timeSeconds must be positive numbers.",
          },
        ],
      });
    }

    const vdot = deriveVdotFromTest(distanceMeters, timeSeconds);
    await applyVdotAndKickPlans(ctx, auth.athlete._id, vdot, "race");
  },
});
