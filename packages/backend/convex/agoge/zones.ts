import { zonesValidator } from "@nativesquare/agoge/schema";
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
  loadOwnedZone,
  push,
  requireAuthError,
  result,
  validateZoneBoundariesExtremes,
  validateZoneBoundariesLength,
  validateZoneBoundariesOrder,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const listAthleteZones = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const [hr, pace] = await Promise.all([
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: auth.athlete._id,
        kind: "hr",
      }),
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: auth.athlete._id,
        kind: "pace",
      }),
    ]);
    return [hr, pace].filter((z): z is NonNullable<typeof z> => z !== null);
  },
});

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const createZoneArgs = zonesValidator.omit("athleteId", "sport");

async function checkCreateZone(
  ctx: QueryCtx | MutationCtx,
  args: typeof createZoneArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const errors: ValidationError[] = [];
  push(errors, validateZoneBoundariesLength(args.boundaries));
  push(errors, validateZoneBoundariesExtremes(args.boundaries));
  push(errors, validateZoneBoundariesOrder(args.boundaries));
  return result(errors);
}

const updateZoneArgs = zonesValidator
  .omit("athleteId", "sport")
  .partial()
  .extend({ zoneId: v.string() });

async function checkUpdateZone(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateZoneArgs.type,
): Promise<ValidationResult> {
  const owned = await loadOwnedZone(ctx, args.zoneId);
  if (!owned) return fail([requireAuthError]);
  const errors: ValidationError[] = [];
  if (args.boundaries !== undefined) {
    push(errors, validateZoneBoundariesLength(args.boundaries));
    push(errors, validateZoneBoundariesExtremes(args.boundaries));
    push(errors, validateZoneBoundariesOrder(args.boundaries));
  }
  return result(errors);
}

// ---------------------------------------------------------------------------
// Validate queries
// ---------------------------------------------------------------------------

export const validateCreate = query({
  args: createZoneArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkCreateZone(ctx, args),
});

export const validateUpdate = query({
  args: updateZoneArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkUpdateZone(ctx, args),
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

export const createZone = mutation({
  args: createZoneArgs.fields,
  handler: async (ctx, args) => {
    throwIfInvalid(await checkCreateZone(ctx, args));
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    return await ctx.runMutation(components.agoge.public.createZone, {
      ...args,
      athleteId: auth.athlete._id,
      sport: "run",
    });
  },
});

export const updateZone = mutation({
  args: updateZoneArgs.fields,
  handler: async (ctx, args) => {
    throwIfInvalid(await checkUpdateZone(ctx, args));
    const { zoneId, ...patch } = args;
    await ctx.runMutation(components.agoge.public.updateZone, {
      zoneId,
      ...patch,
    });
    return null;
  },
});

export const deleteZone = mutation({
  args: { zoneId: v.string() },
  handler: async (ctx, { zoneId }) => {
    const owned = await loadOwnedZone(ctx, zoneId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    await ctx.runMutation(components.agoge.public.deleteZone, { zoneId });
    return null;
  },
});
