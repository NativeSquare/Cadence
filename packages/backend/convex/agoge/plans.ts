/**
 * Plan reads + creation.
 * Plan is the lifetime container in Cadence — one per athlete, status `active`.
 * Blocks/workouts hang off it.
 */

import { plansValidator } from "@nativesquare/agoge/schema";
import { ConvexError } from "convex/values";
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
  push,
  requireAuthError,
  result,
  validatePlanDateRange,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const getAthletePlan = query({
  args: {},
  handler: async (ctx) => {
    const result = await loadAthlete(ctx);
    if (!result) return null;
    const plans = await ctx.runQuery(
      components.agoge.public.getPlansByAthleteAndStatus,
      { athleteId: result.athlete._id, status: "active" },
    );
    return plans[0] ?? null;
  },
});

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const createPlanArgs = plansValidator.omit("athleteId");

async function checkCreatePlan(
  ctx: QueryCtx | MutationCtx,
  args: typeof createPlanArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const errors: ValidationError[] = [];
  push(errors, validatePlanDateRange(args.startDate, args.endDate));
  return result(errors);
}

// ---------------------------------------------------------------------------
// Validate query
// ---------------------------------------------------------------------------

export const validateCreate = query({
  args: createPlanArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkCreatePlan(ctx, args),
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

export const createPlan = mutation({
  args: createPlanArgs.fields,
  handler: async (ctx, args): Promise<string> => {
    throwIfInvalid(await checkCreatePlan(ctx, args));
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    return await ctx.runMutation(components.agoge.public.createPlan, {
      ...args,
      athleteId: auth.athlete._id,
    });
  },
});
