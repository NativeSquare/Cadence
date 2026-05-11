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
import {
  fail,
  loadAthlete,
  loadOwnedRace,
  push,
  requireAuthError,
  result,
  validateIsoCalendarDate,
  validateNoUpcomingARaceConflict,
  validateRaceDateStatusCoherent,
  validateRaceOwnership,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

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
    // Agoge's deleteRace cascades to attached goals (and detaches the race
    // from any plans) — see @nativesquare/agoge cascadeDeleteRace.
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

const raceGoalTypeValidator = v.union(
  v.literal("performance"),
  v.literal("completion"),
);

const createRaceGoalInput = v.object({
  type: raceGoalTypeValidator,
  title: v.string(),
  description: v.optional(v.string()),
  targetValue: v.string(),
});

const updateRaceGoalInput = v.object({
  type: v.optional(raceGoalTypeValidator),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  targetValue: v.optional(v.string()),
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

function parseTimeTargetSec(target: string): number | null {
  const trimmed = target.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  for (const p of parts) if (!/^\d+$/.test(p)) return null;
  const nums = parts.map((p) => Number.parseInt(p, 10));
  if (nums.length === 2) {
    const [m, s] = nums;
    if (s >= 60) return null;
    return m * 60 + s;
  }
  const [h, m, s] = nums;
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

function deriveGoalStatus(
  raceStatus: RaceStatus,
  goalType: "performance" | "completion",
  goalTargetValue: string,
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
      if (goalType === "completion") return "achieved";
      if (raceResult?.finishTimeSec != null) {
        const target = parseTimeTargetSec(goalTargetValue);
        if (target != null) {
          return raceResult.finishTimeSec <= target ? "achieved" : "missed";
        }
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
      goal.type,
      goal.targetValue,
      race.result,
    );

    await ctx.runMutation(components.agoge.public.createGoal, {
      athleteId: auth.athlete._id,
      raceId,
      type: goal.type,
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      status: initialStatus,
    });

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

    const effectiveStatus = racePatch?.status ?? existing.status;
    const effectiveResult =
      racePatch && "result" in racePatch ? racePatch.result : existing.result;
    const effectiveGoalType = goalPatch?.type ?? existingGoal.type;
    const effectiveTargetValue =
      goalPatch?.targetValue ?? existingGoal.targetValue;

    if (effectiveGoalType !== "performance" && effectiveGoalType !== "completion") {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_INPUT",
            message:
              "Race-bound goal type must be 'performance' or 'completion'.",
          },
        ],
      });
    }

    const derivedStatus = deriveGoalStatus(
      effectiveStatus,
      effectiveGoalType,
      effectiveTargetValue,
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
