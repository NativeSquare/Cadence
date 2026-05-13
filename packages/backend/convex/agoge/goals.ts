/**
 * Goal mutations/queries.
 *
 * Goals live in the Agoge component and carry an optional `raceId` — they may
 * be standalone or attached to a race. Cadence exposes both shapes: the race
 * detail screen lists race-attached goals, and the top-level Goals screen
 * lists every goal the athlete owns.
 */

import { goalsValidator } from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import {
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import {
  fail,
  loadAthlete,
  loadOwnedRace,
  push,
  requireAuthError,
  result,
  validateIsoCalendarDate,
  validateRaceOwnership,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

const GOAL_STATUSES = [
  "active",
  "achieved",
  "missed",
  "abandoned",
  "paused",
] as const;

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const createGoalArgs = goalsValidator
  .omit("athleteId", "raceId")
  .extend({ raceId: v.optional(v.string()) });

async function validateCreateGoal(
  ctx: QueryCtx | MutationCtx,
  args: typeof createGoalArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const errors: ValidationError[] = [];
  push(errors, validateIsoCalendarDate(args.targetDate, "targetDate"));
  if (args.raceId) {
    push(
      errors,
      await validateRaceOwnership(ctx, args.raceId, auth.athlete._id),
    );
  }
  return result(errors);
}

const updateGoalArgs = goalsValidator
  .omit("athleteId", "raceId")
  .partial()
  .extend({ goalId: v.string() });

async function validateUpdateGoal(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateGoalArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const goal = await ctx.runQuery(components.agoge.public.getGoal, {
    goalId: args.goalId,
  });
  if (!goal || goal.athleteId !== auth.athlete._id) {
    return fail([{ code: "NOT_FOUND", message: "Goal not found" }]);
  }
  const errors: ValidationError[] = [];
  push(errors, validateIsoCalendarDate(args.targetDate, "targetDate"));
  return result(errors);
}

export const dryRunCreateGoal = query({
  args: createGoalArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateCreateGoal(ctx, args),
});

export const dryRunUpdateGoal = query({
  args: updateGoalArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateUpdateGoal(ctx, args),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listMyGoals = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const buckets = await Promise.all(
      GOAL_STATUSES.map((status) =>
        ctx.runQuery(components.agoge.public.getGoalsByAthleteAndStatus, {
          athleteId: auth.athlete._id,
          status,
        }),
      ),
    );
    return buckets.flat();
  },
});

export const listGoalsForRace = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const result = await loadOwnedRace(ctx, raceId);
    if (!result) return [];
    return await ctx.runQuery(components.agoge.public.getGoalsByRace, {
      raceId,
    });
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createGoal = mutation({
  args: createGoalArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateCreateGoal(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    return await ctx.runMutation(components.agoge.public.createGoal, {
      ...args,
      athleteId: auth.athlete._id,
    });
  },
});

export const updateGoal = mutation({
  args: updateGoalArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateUpdateGoal(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const { goalId, ...patch } = args;
    await ctx.runMutation(components.agoge.public.updateGoal, {
      goalId,
      ...patch,
    });
    return null;
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.string() },
  handler: async (ctx, { goalId }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    const goal = await ctx.runQuery(components.agoge.public.getGoal, {
      goalId,
    });
    if (!goal || goal.athleteId !== auth.athlete._id) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [{ code: "NOT_FOUND", message: "Goal not found" }],
      });
    }
    await ctx.runMutation(components.agoge.public.deleteGoal, { goalId });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Fitness-goal helpers (host-app concern)
//
// "1 Athlete = 1 Active Primary Objective" — implemented as: at most one
// active fitness Goal at a time. Active race Goals are governed by the
// no-upcoming-A-race-conflict rule on the race side. The Home tab reads both
// signals through `getMyActiveGoal` below.
// ---------------------------------------------------------------------------

const fitnessIntentValidator = v.union(
  v.literal("start_running"),
  v.literal("restart_running"),
  v.literal("build_base"),
  v.literal("maintain_fitness"),
);

/**
 * The athlete's active goal — the most recently created active goal, race-
 * anchored or not — joined with its race (null for fitness goals) and its
 * non-archived plan. Powers the Home tab.
 */
export const getMyActiveGoal = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return null;

    const activeGoals = await ctx.runQuery(
      components.agoge.public.getGoalsByAthleteAndStatus,
      { athleteId: auth.athlete._id, status: "active" },
    );
    if (activeGoals.length === 0) return null;

    const goal = activeGoals.reduce((latest, g) =>
      g._creationTime > latest._creationTime ? g : latest,
    );

    const plansForGoal = await ctx.runQuery(
      components.agoge.public.getPlansByGoal,
      { goalId: goal._id },
    );
    const plan = plansForGoal.find((p) => p.archivedAt === undefined) ?? null;

    const race = goal.raceId
      ? await ctx.runQuery(components.agoge.public.getRace, {
          raceId: goal.raceId,
        })
      : null;

    return { goal, race, plan };
  },
});

export const createMyFitnessGoal = mutation({
  args: {
    fitnessIntent: fitnessIntentValidator,
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });

    const activeGoals = await ctx.runQuery(
      components.agoge.public.getGoalsByAthleteAndStatus,
      { athleteId: auth.athlete._id, status: "active" },
    );
    if (activeGoals.some((g) => g.category === "fitness")) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "CONFLICT",
            message: "Athlete already has an active fitness goal.",
          },
        ],
      });
    }

    const goalId = await ctx.runMutation(components.agoge.public.createGoal, {
      athleteId: auth.athlete._id,
      category: "fitness",
      fitnessIntent: args.fitnessIntent,
      description: args.description,
      status: "active",
    });

    // Goal ⟺ Plan invariant: every active goal — race or fitness — gets a plan
    // anchored to today.
    const planId = await ctx.runMutation(components.agoge.public.createPlan, {
      athleteId: auth.athlete._id,
      goalId,
      startDate: new Date().toISOString().slice(0, 10),
    });
    await ctx.scheduler.runAfter(
      0,
      internal.agoge.planGenerator.generateFitness,
      { planId },
    );

    return goalId;
  },
});
