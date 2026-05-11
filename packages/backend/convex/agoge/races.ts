import { racesValidator } from "@nativesquare/agoge/schema";
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
    await ctx.runMutation(components.agoge.public.deleteRace, { raceId });
    return null;
  },
});
