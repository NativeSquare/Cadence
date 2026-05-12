/**
 * Plan reads + creation.
 *
 * A Plan is 1:1 with an A-priority race. The plan's effective end is always
 * `race.date` (derived, not stored). Creation goes through the race-creation
 * mutation in races.ts; the standalone `createPlan` here is for recovery /
 * inconsistency repair (e.g. an A-race exists with no plan).
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
  validatePlanStart,
  validateRaceOwnership,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const createPlanArgs = v.object({
  targetRaceId: v.string(),
  startDate: v.optional(v.string()),
  notes: v.optional(v.string()),
});

async function validateCreatePlan(
  ctx: QueryCtx | MutationCtx,
  args: typeof createPlanArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);

  const ownership = await validateRaceOwnership(
    ctx,
    args.targetRaceId,
    auth.athlete._id,
  );
  if (ownership) return fail([ownership]);

  const race = await ctx.runQuery(components.agoge.public.getRace, {
    raceId: args.targetRaceId,
  });
  if (!race) return fail([{ code: "NOT_FOUND", message: "Race not found" }]);

  const errors: ValidationError[] = [];

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

  const existingForRace = await ctx.runQuery(
    components.agoge.public.getPlansByRace,
    { raceId: args.targetRaceId },
  );
  if (existingForRace.some((p) => p.archivedAt === undefined)) {
    push(errors, {
      code: "CONFLICT",
      message: "A plan already exists for this race.",
    });
  }

  const effectiveStartDate =
    args.startDate ?? new Date().toISOString().slice(0, 10);
  push(errors, validatePlanStart(effectiveStartDate, race.date));

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
 * candidate range. Used by plan creation and by race-date updates.
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
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      raceId: plan.targetRaceId,
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
 * The athlete's *current* plan (non-archived, today between startDate and
 * race.date), joined with its race. Returns null when planless.
 */
export const getAthletePlan = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return null;
    return await loadCurrentAthletePlan(ctx, auth.athlete._id);
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
        const race = await ctx.runQuery(components.agoge.public.getRace, {
          raceId: plan.targetRaceId,
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
      targetRaceId: args.targetRaceId,
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

export async function archivePlansForRace(
  ctx: MutationCtx,
  raceId: string,
): Promise<void> {
  const plans = await ctx.runQuery(components.agoge.public.getPlansByRace, {
    raceId,
  });
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
  const plans = await ctx.runQuery(components.agoge.public.getPlansByRace, {
    raceId,
  });
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
