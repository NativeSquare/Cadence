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
import { components } from "../_generated/api";
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
// Reads
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
// Validators
// ---------------------------------------------------------------------------

const createGoalArgs = goalsValidator
  .omit("athleteId", "raceId")
  .extend({ raceId: v.optional(v.string()) });

async function checkCreateGoal(
  ctx: QueryCtx | MutationCtx,
  args: typeof createGoalArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const errors: ValidationError[] = [];
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

async function checkUpdateGoal(
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
  return result([]);
}

// ---------------------------------------------------------------------------
// Validate queries
// ---------------------------------------------------------------------------

export const validateCreate = query({
  args: createGoalArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkCreateGoal(ctx, args),
});

export const validateUpdate = query({
  args: updateGoalArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkUpdateGoal(ctx, args),
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function throwIfInvalid(validation: ValidationResult): void {
  if (!validation.ok) {
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: validation.errors,
    });
  }
}

export const createGoal = mutation({
  args: createGoalArgs.fields,
  handler: async (ctx, args) => {
    throwIfInvalid(await checkCreateGoal(ctx, args));
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
    throwIfInvalid(await checkUpdateGoal(ctx, args));
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
