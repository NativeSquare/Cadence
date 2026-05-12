import { blocksValidator } from "@nativesquare/agoge/schema";
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
  loadOwnedBlock,
  noCurrentPlanError,
  push,
  requireAuthError,
  result,
  validateBlockDateRange,
  validateBlockWithinPlan,
  validateNoBlockOverlap,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const createBlockArgs = blocksValidator.omit("planId");

async function validateCreateBlock(
  ctx: QueryCtx | MutationCtx,
  args: typeof createBlockArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const current = await loadCurrentAthletePlan(ctx, auth.athlete._id);
  if (!current) return fail([noCurrentPlanError]);

  const errors: ValidationError[] = [];
  push(errors, validateBlockDateRange(args.startDate, args.endDate));
  push(errors, validateBlockWithinPlan(args, current.plan, current.race));
  push(errors, await validateNoBlockOverlap(ctx, current.plan._id, args));
  return result(errors);
}

const updateBlockArgs = blocksValidator
  .omit("planId")
  .partial()
  .extend({ blockId: v.string() });

async function validateUpdateBlock(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateBlockArgs.type,
): Promise<ValidationResult> {
  const { blockId, ...patch } = args;
  const owned = await loadOwnedBlock(ctx, blockId);
  if (!owned) return fail([requireAuthError]);
  const { block, plan, race } = owned;

  const nextStart = patch.startDate ?? block.startDate;
  const nextEnd = patch.endDate ?? block.endDate;

  const errors: ValidationError[] = [];
  push(errors, validateBlockDateRange(nextStart, nextEnd));
  push(
    errors,
    validateBlockWithinPlan(
      { startDate: nextStart, endDate: nextEnd },
      plan,
      race,
    ),
  );
  push(
    errors,
    await validateNoBlockOverlap(
      ctx,
      plan._id,
      { startDate: nextStart, endDate: nextEnd },
      { excludeBlockId: block._id },
    ),
  );
  return result(errors);
}

export const dryRunCreateBlock = query({
  args: createBlockArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateCreateBlock(ctx, args),
});

export const dryRunUpdateBlock = query({
  args: updateBlockArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateUpdateBlock(ctx, args),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listBlocks = query({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    return await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
      planId: planId,
    });
  },
});

export const listBlocksForActiveAthletePlan = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const current = await loadCurrentAthletePlan(ctx, auth.athlete._id);
    if (!current) return [];
    return await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
      planId: current.plan._id,
    });
  },
});

export const getBlock = query({
  args: { blockId: v.string() },
  handler: async (ctx, { blockId }) => {
    const result = await loadOwnedBlock(ctx, blockId);
    return result?.block ?? null;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createBlock = mutation({
  args: createBlockArgs.fields,
  handler: async (ctx, args): Promise<string> => {
    const validation = await validateCreateBlock(ctx, args);
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
    const current = await loadCurrentAthletePlan(ctx, auth.athlete._id);
    if (!current)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [noCurrentPlanError],
      });

    return await ctx.runMutation(components.agoge.public.createBlock, {
      ...args,
      planId: current.plan._id,
    });
  },
});

export const updateBlock = mutation({
  args: updateBlockArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateUpdateBlock(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const { blockId, ...patch } = args;
    const owned = await loadOwnedBlock(ctx, blockId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });

    await ctx.runMutation(components.agoge.public.updateBlock, {
      blockId: owned.block._id,
      ...patch,
    });
    return null;
  },
});

export const deleteBlock = mutation({
  args: { blockId: v.string() },
  handler: async (ctx, { blockId }) => {
    const owned = await loadOwnedBlock(ctx, blockId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    await ctx.runMutation(components.agoge.public.deleteBlock, {
      blockId: owned.block._id,
    });
    return null;
  },
});
