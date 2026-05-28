import {
  type GoalStatus,
  racesValidator,
  type RaceStatus,
} from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import {
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import { gatePlanGeneration } from "../engine/baselineTest";
import {
  fail,
  loadAthlete,
  loadOwnedRace,
  push,
  requireAuthError,
  result,
  validateIsoCalendarDate,
  validateMinimumPlanDuration,
  validateNoUpcomingARaceConflict,
  validateRaceDateStatusCoherent,
  validateRaceOwnership,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";
import {
  archivePlansForRace,
  deletePlansForRace,
  findOverlappingPlan,
} from "./plans";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const createMyRaceArgs = racesValidator.omit(
  "athleteId",
  "sport",
  "courseType",
  "surface",
);

async function validateCreateMyRace(
  ctx: QueryCtx | MutationCtx,
  args: typeof createMyRaceArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);

  const errors: ValidationError[] = [];
  push(errors, validateIsoCalendarDate(args.date, "date"));
  push(errors, validateRaceDateStatusCoherent(args.date, args.status));
  if (args.priority === "A" && args.status === "upcoming") {
    push(errors, await validateNoUpcomingARaceConflict(ctx, auth.athlete._id));
    const today = new Date().toISOString().slice(0, 10);
    push(errors, validateMinimumPlanDuration(today, args.date, args.format));
  }
  return result(errors);
}

const updateMyRaceArgs = racesValidator
  .omit("athleteId", "sport", "courseType", "surface")
  .partial()
  .extend({ raceId: v.string() });

async function validateUpdateMyRace(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateMyRaceArgs.type,
): Promise<ValidationResult> {
  const { raceId, ...patch } = args;
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const ownership = await validateRaceOwnership(ctx, raceId, auth.athlete._id);
  if (ownership) return fail([ownership]);

  const race = await ctx.runQuery(components.agoge.public.getRace, { raceId });
  if (!race) return fail([{ code: "NOT_FOUND", message: "Race not found" }]);

  const errors: ValidationError[] = [];
  if (patch.date) push(errors, validateIsoCalendarDate(patch.date, "date"));

  const effectiveDate = patch.date ?? race.date;
  const effectivePriority = patch.priority ?? race.priority;
  const effectiveStatus = patch.status ?? race.status;
  push(errors, validateRaceDateStatusCoherent(effectiveDate, effectiveStatus));

  if (effectivePriority === "A" && effectiveStatus === "upcoming") {
    push(
      errors,
      await validateNoUpcomingARaceConflict(ctx, auth.athlete._id, {
        excludeRaceId: race._id,
      }),
    );
  }

  // If a non-archived plan exists for this race and the date moves, ensure
  // the plan's new window doesn't overlap another plan. Walk via goals since
  // plans now hang off goals, not races directly.
  if (patch.date && patch.date !== race.date) {
    const goals = await ctx.runQuery(components.agoge.public.getGoalsByRace, {
      raceId,
    });
    const plansByGoal = await Promise.all(
      goals.map((g) =>
        ctx.runQuery(components.agoge.public.getPlansByGoal, {
          goalId: g._id,
        }),
      ),
    );
    const plan = plansByGoal.flat().find((p) => p.archivedAt === undefined);
    if (plan) {
      const conflict = await findOverlappingPlan(
        ctx,
        auth.athlete._id,
        {
          startDate: plan.startDate,
          endYmd: effectiveDate.slice(0, 10),
        },
        { excludePlanId: plan._id },
      );
      if (conflict) {
        push(errors, {
          code: "CONFLICT",
          message: `New race date would cause this plan to overlap an existing plan (${conflict.startDate} → ${conflict.endYmd}).`,
        });
      }
    }
  }

  return result(errors);
}

export const dryRunCreateMyRace = query({
  args: createMyRaceArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateCreateMyRace(ctx, args),
});

export const dryRunUpdateMyRace = query({
  args: updateMyRaceArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateUpdateMyRace(ctx, args),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listMyRaces = query({
  args: {},
  handler: async (ctx) => {
    const result = await loadAthlete(ctx);
    if (!result) return [];
    return await ctx.runQuery(components.agoge.public.getRacesByAthlete, {
      athleteId: result.athlete._id,
    });
  },
});

export const getMyRace = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const result = await loadOwnedRace(ctx, raceId);
    return result?.race ?? null;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createMyRace = mutation({
  args: createMyRaceArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateCreateMyRace(ctx, args);
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
    return await ctx.runMutation(components.agoge.public.createRace, {
      ...args,
      athleteId: auth.athlete._id,
      sport: "run",
    });
  },
});

export const updateMyRace = mutation({
  args: updateMyRaceArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateUpdateMyRace(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const { raceId, ...patch } = args;
    await ctx.runMutation(components.agoge.public.updateRace, {
      raceId,
      ...patch,
    });
    return null;
  },
});

export const deleteMyRace = mutation({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    const ownership = await validateRaceOwnership(
      ctx,
      raceId,
      auth.athlete._id,
    );
    if (ownership)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [ownership],
      });
    // Cascade-delete plans first. Agoge's `cascadeDeleteRace` would otherwise
    // try to detach the race from plans by patching `targetRaceId: undefined`,
    // which trips the now-required field. Deleting plans up front sidesteps
    // that path; `cascadeDeletePlan` also orphans the plan's workouts cleanly
    // (sets `planId`/`blockId` to undefined).
    await deletePlansForRace(ctx, raceId);
    await ctx.runMutation(components.agoge.public.deleteRace, { raceId });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Race + Goal (1:1 merged shape for Cadence UI)
//
// Cadence presents Race and Goal as a single object. Invariants enforced
// here (Agoge schema is left untouched so other consumers can still create
// standalone goals):
//   - every race has exactly one goal, created together
//   - goal type is restricted to "performance" | "completion"
//   - goal.status auto-derives from race.status (+ race.result); UI never
//     sets it directly
//   - goal.targetDate is not used — race.date is the single source of truth
//   - deleting a race cascades to its goal (handled by Agoge's deleteRace)
// ---------------------------------------------------------------------------

const raceTargetValidator = v.union(
  v.object({ type: v.literal("finish") }),
  v.object({ type: v.literal("time"), seconds: v.number() }),
);

const createRaceGoalInput = v.object({
  raceTarget: raceTargetValidator,
  description: v.optional(v.string()),
});

const updateRaceGoalInput = v.object({
  raceTarget: v.optional(raceTargetValidator),
  description: v.optional(v.string()),
});

const createMyRaceWithGoalArgs = {
  race: createMyRaceArgs,
  goal: createRaceGoalInput,
};

const updateMyRaceWithGoalArgs = {
  raceId: v.string(),
  race: v.optional(
    racesValidator
      .omit("athleteId", "sport", "courseType", "surface")
      .partial(),
  ),
  goal: v.optional(updateRaceGoalInput),
};

function deriveGoalStatus(
  raceStatus: RaceStatus,
  raceTarget: { type: "finish" } | { type: "time"; seconds: number },
  raceResult: { finishTimeSec?: number } | undefined,
): GoalStatus {
  switch (raceStatus) {
    case "upcoming":
      return "active";
    case "cancelled":
    case "dns":
      return "abandoned";
    case "dnf":
      return "missed";
    case "completed":
      if (raceTarget.type === "finish") return "achieved";
      if (raceResult?.finishTimeSec != null) {
        return raceResult.finishTimeSec <= raceTarget.seconds
          ? "achieved"
          : "missed";
      }
      return "achieved";
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listMyRacesWithGoals = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const races = await ctx.runQuery(
      components.agoge.public.getRacesByAthlete,
      { athleteId: auth.athlete._id },
    );
    const withGoals = await Promise.all(
      races.map(async (race) => {
        const goals = await ctx.runQuery(
          components.agoge.public.getGoalsByRace,
          { raceId: race._id },
        );
        return { race, goal: goals[0] ?? null };
      }),
    );
    return withGoals;
  },
});

export const getMyRaceWithGoal = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const owned = await loadOwnedRace(ctx, raceId);
    if (!owned) return null;
    const goals = await ctx.runQuery(components.agoge.public.getGoalsByRace, {
      raceId,
    });
    return { race: owned.race, goal: goals[0] ?? null };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createMyRaceWithGoal = mutation({
  args: createMyRaceWithGoalArgs,
  handler: async (ctx, { race, goal }) => {
    const validation = await validateCreateMyRace(ctx, race);
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

    const raceId = await ctx.runMutation(components.agoge.public.createRace, {
      ...race,
      athleteId: auth.athlete._id,
      sport: "run",
    });

    const initialStatus = deriveGoalStatus(
      race.status,
      goal.raceTarget,
      race.result,
    );

    const goalId = await ctx.runMutation(components.agoge.public.createGoal, {
      athleteId: auth.athlete._id,
      category: "race",
      raceId,
      raceTarget: goal.raceTarget,
      description: goal.description,
      status: initialStatus,
    });

    // Plan ⟺ A-race invariant: an upcoming A-race always has a plan, anchored
    // to its goal (which carries the raceId).
    if (race.priority === "A" && race.status === "upcoming") {
      const startDate = new Date().toISOString().slice(0, 10);
      const planId = await ctx.runMutation(components.agoge.public.createPlan, {
        athleteId: auth.athlete._id,
        goalId,
        startDate,
      });
      await gatePlanGeneration(ctx, {
        athleteId: auth.athlete._id,
        userId: auth.userId,
        planId,
        planStartDate: startDate,
        category: "race",
      });
    }

    return raceId;
  },
});

export const updateMyRaceWithGoal = mutation({
  args: updateMyRaceWithGoalArgs,
  handler: async (ctx, { raceId, race: racePatch, goal: goalPatch }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });

    const ownership = await validateRaceOwnership(
      ctx,
      raceId,
      auth.athlete._id,
    );
    if (ownership)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [ownership],
      });

    const existing = await ctx.runQuery(components.agoge.public.getRace, {
      raceId,
    });
    if (!existing)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [{ code: "NOT_FOUND", message: "Race not found" }],
      });

    if (racePatch) {
      const validation = await validateUpdateMyRace(ctx, {
        raceId,
        ...racePatch,
      });
      if (!validation.ok)
        throw new ConvexError({
          code: "VALIDATION_FAILED",
          errors: validation.errors,
        });
      await ctx.runMutation(components.agoge.public.updateRace, {
        raceId,
        ...racePatch,
      });

      // Plan lifecycle reactions to race edits.
      const effectivePriority = racePatch.priority ?? existing.priority;
      const effectiveStatus = racePatch.status ?? existing.status;
      const priorityChanged =
        racePatch.priority !== undefined &&
        racePatch.priority !== existing.priority;
      if (priorityChanged && existing.priority === "A") {
        await archivePlansForRace(ctx, raceId);
      }
      if (
        priorityChanged &&
        effectivePriority === "A" &&
        effectiveStatus === "upcoming"
      ) {
        const goalsForRace = await ctx.runQuery(
          components.agoge.public.getGoalsByRace,
          { raceId },
        );
        const plansByGoal = await Promise.all(
          goalsForRace.map((g) =>
            ctx.runQuery(components.agoge.public.getPlansByGoal, {
              goalId: g._id,
            }),
          ),
        );
        const hasActivePlan = plansByGoal
          .flat()
          .some((p) => p.archivedAt === undefined);
        const goalForPlan = goalsForRace[0];
        if (!hasActivePlan && goalForPlan) {
          const startDate = new Date().toISOString().slice(0, 10);
          const planId = await ctx.runMutation(
            components.agoge.public.createPlan,
            {
              athleteId: auth.athlete._id,
              goalId: goalForPlan._id,
              startDate,
            },
          );
          await gatePlanGeneration(ctx, {
            athleteId: auth.athlete._id,
            userId: auth.userId,
            planId,
            planStartDate: startDate,
            category: "race",
          });
        }
      }
    }

    const goals = await ctx.runQuery(components.agoge.public.getGoalsByRace, {
      raceId,
    });
    const existingGoal = goals[0];
    if (!existingGoal)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [{ code: "NOT_FOUND", message: "Goal not found for race" }],
      });

    if (existingGoal.category !== "race" || !existingGoal.raceTarget) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_STATE",
            message: "Goal attached to race must be a race-category goal.",
          },
        ],
      });
    }

    const effectiveStatus = racePatch?.status ?? existing.status;
    const effectiveResult =
      racePatch && "result" in racePatch ? racePatch.result : existing.result;
    const effectiveRaceTarget = goalPatch?.raceTarget ?? existingGoal.raceTarget;

    const derivedStatus = deriveGoalStatus(
      effectiveStatus,
      effectiveRaceTarget,
      effectiveResult,
    );

    await ctx.runMutation(components.agoge.public.updateGoal, {
      goalId: existingGoal._id,
      ...goalPatch,
      status: derivedStatus,
    });

    return null;
  },
});
