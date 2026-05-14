/**
 * Pre-plan baseline assessment.
 *
 * Plan generation is gated on the athlete having a pace zone. If they do, the
 * appropriate plan generator is scheduled immediately. If not, a single test
 * workout (5K time trial) is created under the empty plan. Completing the test
 * — or entering a threshold pace manually — writes the pace zone and triggers
 * plan generation.
 */

import { computeZoneBoundaries } from "@nativesquare/agoge";
import { ConvexError, v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { loadAthlete, requireAuthError } from "./helpers";
import {
  buildTestStructure,
  computeVdot,
  type Locale,
  trainingPaces,
  ymdToNoonUtc,
} from "./periodization";

export const TEST_DISTANCE_METERS = 8000;

export const TEST_NAME: Record<Locale, string> = {
  en: "5K time trial",
  fr: "Test 5 km",
};

export const TEST_DESCRIPTION: Record<Locale, string> = {
  en: "Run 5 km as fast as you can sustain. Your finish time sets the pace targets for the rest of your plan.",
  fr: "Cours 5 km aussi vite que tu peux le maintenir. Ton temps déterminera les allures cibles du reste du plan.",
};

export type PlanCategory = "race" | "fitness";

/**
 * Derive a pace zone (threshold + boundaries) from a completed time-trial.
 * Distance doesn't have to be exactly 5K — any (distance, time) pair yields a
 * valid VDOT.
 */
export function derivePaceZoneFromTest(
  distanceMeters: number,
  timeSeconds: number,
): { threshold: number; boundaries: number[] } {
  const vdot = computeVdot(distanceMeters, timeSeconds);
  const threshold = trainingPaces(vdot).T;
  const { boundaries } = computeZoneBoundaries("pace", threshold, "coggan-pace");
  return { threshold, boundaries };
}

export async function scheduleGenerate(
  ctx: MutationCtx,
  planId: string,
  category: PlanCategory,
): Promise<void> {
  await ctx.scheduler.runAfter(
    0,
    category === "race"
      ? internal.agoge.planGenerator.generate
      : internal.agoge.planGenerator.generateFitness,
    { planId },
  );
}

/**
 * Hook for the workout-completion path. When a "test" workout is marked
 * completed with valid actuals, derive a pace zone from the result, write it
 * (idempotently), and kick off plan generation if the plan is still empty.
 */
export async function deriveAndWriteZonesFromTest(
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

  const existing = await ctx.runQuery(
    components.agoge.public.getZoneByAthleteKind,
    { athleteId: workout.athleteId, kind: "pace" },
  );
  if (existing) return;

  const { threshold, boundaries } = derivePaceZoneFromTest(distance, duration);
  const today = new Date().toISOString().slice(0, 10);
  await ctx.runMutation(components.agoge.public.createZone, {
    athleteId: workout.athleteId,
    sport: "run",
    kind: "pace",
    threshold,
    boundaries,
    source: "system",
    effectiveFrom: today,
  });

  if (!workout.planId) return;
  const blocks = await ctx.runQuery(
    components.agoge.public.getBlocksByPlan,
    { planId: workout.planId },
  );
  if (blocks.length > 0) return;

  const plan = await ctx.runQuery(components.agoge.public.getPlan, {
    planId: workout.planId,
  });
  if (!plan) return;

  const goal = await ctx.runQuery(components.agoge.public.getGoal, {
    goalId: plan.goalId,
  });
  if (!goal) return;

  await scheduleGenerate(ctx, workout.planId, goal.category as PlanCategory);
}

/**
 * Decide whether to start plan generation now or wait for a baseline test.
 *
 * - Pace zone present: schedule the appropriate generator (current behaviour).
 * - Pace zone missing: create a single baseline test workout under the plan
 *   (no blockId yet — plan has no blocks until generation runs) and do NOT
 *   schedule the generator. Completing the test (workouts.ts) or the manual
 *   pace mutation will schedule it.
 */
export async function gatePlanGeneration(
  ctx: MutationCtx,
  args: {
    athleteId: string;
    userId: Id<"users">;
    planId: string;
    planStartDate: string;
    category: PlanCategory;
  },
): Promise<void> {
  const paceZone = await ctx.runQuery(
    components.agoge.public.getZoneByAthleteKind,
    { athleteId: args.athleteId, kind: "pace" },
  );

  if (paceZone) {
    await scheduleGenerate(ctx, args.planId, args.category);
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
      distanceMeters: TEST_DISTANCE_METERS,
      structure: buildTestStructure(),
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Manual-entry alternative to running the baseline test. Writes a pace zone
 * from a user-supplied threshold pace, deletes any pending test workout under
 * empty plans, and schedules plan generation for those plans.
 */
export const setManualPaceZone = mutation({
  args: { thresholdMps: v.number() },
  handler: async (ctx, { thresholdMps }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    if (!(thresholdMps > 0)) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_INPUT",
            message: "thresholdMps must be a positive number (m/s).",
          },
        ],
      });
    }

    const existing = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId: auth.athlete._id, kind: "pace" },
    );
    if (!existing) {
      const { boundaries } = computeZoneBoundaries(
        "pace",
        thresholdMps,
        "coggan-pace",
      );
      const today = new Date().toISOString().slice(0, 10);
      await ctx.runMutation(components.agoge.public.createZone, {
        athleteId: auth.athlete._id,
        sport: "run",
        kind: "pace",
        threshold: thresholdMps,
        boundaries,
        source: "manual",
        effectiveFrom: today,
      });
    }

    // Find active goals → pending plans (no blocks) → drop pending tests and
    // schedule the generator. Typically exactly one plan; loop covers edge
    // cases (race + fitness coexisting).
    const activeGoals = await ctx.runQuery(
      components.agoge.public.getGoalsByAthleteAndStatus,
      { athleteId: auth.athlete._id, status: "active" },
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

        await scheduleGenerate(ctx, plan._id, goal.category as PlanCategory);
      }
    }
  },
});
