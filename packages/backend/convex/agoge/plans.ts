/**
 * Plan reads + creation.
 *
 * Host-app domain rule: a Plan only makes sense for a Goal that is anchored
 * to an A-priority race. Agoge itself allows any Goal to host a plan, but
 * Cadence enforces the stricter rule here. The plan's effective end is
 * always `race.date` (derived from goal.raceId, not stored).
 *
 * Creation usually goes through the race-creation mutation in races.ts (which
 * creates Race + Goal + Plan in one shot). The standalone `createPlan` here
 * is for recovery / inconsistency repair (e.g. a Goal with a race exists
 * with no plan).
 */

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
  loadCurrentAthletePlan,
  loadOwnedPlan,
  push,
  requireAuthError,
  result,
  validateMinimumPlanDuration,
  validatePlanStart,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const createPlanArgs = v.object({
  goalId: v.string(),
  startDate: v.optional(v.string()),
  notes: v.optional(v.string()),
});

async function validateCreatePlan(
  ctx: QueryCtx | MutationCtx,
  args: typeof createPlanArgs.type,
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

  if (!goal.raceId) {
    push(errors, {
      code: "INVALID_STATE",
      message: "Plan target goal must be anchored to a race.",
    });
    return result(errors);
  }

  const race = await ctx.runQuery(components.agoge.public.getRace, {
    raceId: goal.raceId,
  });
  if (!race) return fail([{ code: "NOT_FOUND", message: "Race not found" }]);

  if (race.priority !== "A") {
    push(errors, {
      code: "INVALID_STATE",
      message: "Plan target race must be an A-priority race.",
    });
  }
  if (race.status !== "upcoming") {
    push(errors, {
      code: "INVALID_STATE",
      message: "Plan target race must be upcoming.",
    });
  }

  const existingForGoal = await ctx.runQuery(
    components.agoge.public.getPlansByGoal,
    { goalId: args.goalId },
  );
  if (existingForGoal.some((p) => p.archivedAt === undefined)) {
    push(errors, {
      code: "CONFLICT",
      message: "A plan already exists for this goal.",
    });
  }

  const effectiveStartDate =
    args.startDate ?? new Date().toISOString().slice(0, 10);
  push(errors, validatePlanStart(effectiveStartDate, race.date));
  push(
    errors,
    validateMinimumPlanDuration(effectiveStartDate, race.date, race.format),
  );

  const conflict = await findOverlappingPlan(ctx, auth.athlete._id, {
    startDate: effectiveStartDate,
    endYmd: race.date.slice(0, 10),
  });
  if (conflict) {
    push(errors, {
      code: "CONFLICT",
      message: `Plan would overlap an existing plan (${conflict.startDate} → ${conflict.endYmd}).`,
    });
  }

  return result(errors);
}

/**
 * Find a non-archived plan whose [startDate, race.date] window overlaps the
 * candidate range. Used by plan creation and by race-date updates. Plans
 * whose goal isn't race-anchored are skipped (they shouldn't exist per the
 * host-app rule, but we're defensive).
 */
export async function findOverlappingPlan(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
  range: { startDate: string; endYmd: string },
  options?: { excludePlanId?: string },
): Promise<{ startDate: string; endYmd: string } | null> {
  const plans = await ctx.runQuery(components.agoge.public.getPlansByAthlete, {
    athleteId,
  });
  for (const plan of plans) {
    if (plan._id === options?.excludePlanId) continue;
    if (plan.archivedAt !== undefined) continue;
    const goal = await ctx.runQuery(components.agoge.public.getGoal, {
      goalId: plan.goalId,
    });
    if (!goal || !goal.raceId) continue;
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      raceId: goal.raceId,
    });
    if (!race) continue;
    const planEndYmd = race.date.slice(0, 10);
    if (range.startDate <= planEndYmd && range.endYmd >= plan.startDate) {
      return { startDate: plan.startDate, endYmd: planEndYmd };
    }
  }
  return null;
}

export const dryRunCreatePlan = query({
  args: createPlanArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateCreatePlan(ctx, args),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * The athlete's *current* plan — resolved from the last-created active goal,
 * race-anchored or not. Returns `{ plan, race }` where `race` is null for
 * fitness goals. Returns null when there's no active goal, or the active goal
 * has no non-archived plan.
 */
export const getAthletePlan = query({
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
    if (!plan) return null;

    const race = goal.raceId
      ? await ctx.runQuery(components.agoge.public.getRace, {
          raceId: goal.raceId,
        })
      : null;

    return { plan, race };
  },
});

export const listMyPlans = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const plans = await ctx.runQuery(components.agoge.public.getPlansByAthlete, {
      athleteId: auth.athlete._id,
    });
    const withRace = await Promise.all(
      plans.map(async (plan) => {
        const goal = await ctx.runQuery(components.agoge.public.getGoal, {
          goalId: plan.goalId,
        });
        if (!goal || !goal.raceId) return null;
        const race = await ctx.runQuery(components.agoge.public.getRace, {
          raceId: goal.raceId,
        });
        return race ? { plan, race } : null;
      }),
    );
    return withRace.filter((p): p is NonNullable<typeof p> => p !== null);
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createPlan = mutation({
  args: createPlanArgs.fields,
  handler: async (ctx, args): Promise<string> => {
    const validation = await validateCreatePlan(ctx, args);
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

    const startDate =
      args.startDate ?? new Date().toISOString().slice(0, 10);

    return await ctx.runMutation(components.agoge.public.createPlan, {
      athleteId: auth.athlete._id,
      goalId: args.goalId,
      startDate,
      notes: args.notes,
    });
  },
});

export const archivePlan = mutation({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    const owned = await loadOwnedPlan(ctx, planId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    await ctx.runMutation(components.agoge.public.updatePlan, {
      planId: owned.plan._id,
      archivedAt: new Date().toISOString(),
    });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Internal helpers used by races.ts lifecycle hooks
// ---------------------------------------------------------------------------

async function plansForRace(
  ctx: QueryCtx | MutationCtx,
  raceId: string,
): Promise<{ _id: string; archivedAt?: string }[]> {
  const goals = await ctx.runQuery(components.agoge.public.getGoalsByRace, {
    raceId,
  });
  const plansByGoal = await Promise.all(
    goals.map((g) =>
      ctx.runQuery(components.agoge.public.getPlansByGoal, { goalId: g._id }),
    ),
  );
  return plansByGoal.flat();
}

export async function archivePlansForRace(
  ctx: MutationCtx,
  raceId: string,
): Promise<void> {
  const plans = await plansForRace(ctx, raceId);
  const now = new Date().toISOString();
  for (const plan of plans) {
    if (plan.archivedAt !== undefined) continue;
    await ctx.runMutation(components.agoge.public.updatePlan, {
      planId: plan._id,
      archivedAt: now,
    });
  }
}

export async function deletePlansForRace(
  ctx: MutationCtx,
  raceId: string,
): Promise<void> {
  const plans = await plansForRace(ctx, raceId);
  for (const plan of plans) {
    await ctx.runMutation(components.agoge.public.deletePlan, {
      planId: plan._id,
    });
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Derived plan status. Source of truth = (startDate, race.date, today, archivedAt).
 * Never persisted.
 */
export function getPlanStatus(
  plan: { startDate: string; archivedAt?: string },
  race: { date: string },
  todayYmd: string,
): "upcoming" | "active" | "post-race" | "archived" {
  if (plan.archivedAt !== undefined) return "archived";
  const raceYmd = race.date.slice(0, 10);
  if (todayYmd < plan.startDate) return "upcoming";
  if (todayYmd > raceYmd) return "post-race";
  return "active";
}
