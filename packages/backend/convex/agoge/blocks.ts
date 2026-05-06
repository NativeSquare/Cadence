/**
 * Block reads + mutations. Blocks belong to a plan and group consecutive weeks
 * of training.
 */

import { blocksValidator } from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import {
  fail,
  loadActiveAthletePlan,
  loadAthlete,
  loadOwnedBlock,
  noActivePlanError,
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
// Reads
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
    const result = await loadAthlete(ctx);
    if (!result) return [];
    const plans = await ctx.runQuery(
      components.agoge.public.getPlansByAthleteAndStatus,
      { athleteId: result.athlete._id, status: "active" },
    );
    const plan = plans[0];
    if (!plan) return [];
    return await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
      planId: plan._id,
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
// Validators
// ---------------------------------------------------------------------------

const createBlockArgs = blocksValidator.omit("planId");

async function checkCreateBlock(
  ctx: QueryCtx | MutationCtx,
  args: typeof createBlockArgs.type,
  userIdOverride?: string,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx, userIdOverride);
  if (!auth) return fail([requireAuthError]);
  const plan = await loadActiveAthletePlan(ctx, auth.athlete._id);
  if (!plan) return fail([noActivePlanError]);

  const errors: ValidationError[] = [];
  push(errors, validateBlockDateRange(args.startDate, args.endDate));
  push(errors, validateBlockWithinPlan(args, plan));
  push(errors, await validateNoBlockOverlap(ctx, plan._id, args));
  return result(errors);
}

const updateBlockArgs = blocksValidator
  .omit("planId")
  .partial()
  .extend({ blockId: v.string() });

async function checkUpdateBlock(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateBlockArgs.type,
  userIdOverride?: string,
): Promise<ValidationResult> {
  const { blockId, ...patch } = args;
  const owned = await loadOwnedBlock(ctx, blockId, userIdOverride);
  if (!owned) return fail([requireAuthError]);
  const { block, plan } = owned;

  const nextStart = patch.startDate ?? block.startDate;
  const nextEnd = patch.endDate ?? block.endDate;

  const errors: ValidationError[] = [];
  push(errors, validateBlockDateRange(nextStart, nextEnd));
  push(
    errors,
    validateBlockWithinPlan({ startDate: nextStart, endDate: nextEnd }, plan),
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

// ---------------------------------------------------------------------------
// Validate queries (AI-tool-callable dry-runs)
// ---------------------------------------------------------------------------

export const validateCreate = query({
  args: createBlockArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkCreateBlock(ctx, args),
});

export const validateUpdate = query({
  args: updateBlockArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkUpdateBlock(ctx, args),
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

async function performCreateBlock(
  ctx: MutationCtx,
  args: typeof createBlockArgs.type,
  userIdOverride?: string,
): Promise<string> {
  throwIfInvalid(await checkCreateBlock(ctx, args, userIdOverride));

  const auth = await loadAthlete(ctx, userIdOverride);
  if (!auth)
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [requireAuthError],
    });
  const plan = await loadActiveAthletePlan(ctx, auth.athlete._id);
  if (!plan)
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [noActivePlanError],
    });

  return await ctx.runMutation(components.agoge.public.createBlock, {
    ...args,
    planId: plan._id,
  });
}

async function performUpdateBlock(
  ctx: MutationCtx,
  args: typeof updateBlockArgs.type,
  userIdOverride?: string,
): Promise<void> {
  throwIfInvalid(await checkUpdateBlock(ctx, args, userIdOverride));

  const { blockId, ...patch } = args;
  const owned = await loadOwnedBlock(ctx, blockId, userIdOverride);
  if (!owned)
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [requireAuthError],
    });

  await ctx.runMutation(components.agoge.public.updateBlock, {
    blockId: owned.block._id,
    ...patch,
  });
}

async function performDeleteBlock(
  ctx: MutationCtx,
  blockId: string,
  userIdOverride?: string,
): Promise<void> {
  const owned = await loadOwnedBlock(ctx, blockId, userIdOverride);
  if (!owned)
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [requireAuthError],
    });
  await ctx.runMutation(components.agoge.public.deleteBlock, {
    blockId: owned.block._id,
  });
}

export const createBlock = mutation({
  args: createBlockArgs.fields,
  handler: async (ctx, args) => performCreateBlock(ctx, args),
});

export const updateBlock = mutation({
  args: updateBlockArgs.fields,
  handler: async (ctx, args) => {
    await performUpdateBlock(ctx, args);
    return null;
  },
});

export const deleteBlock = mutation({
  args: { blockId: v.string() },
  handler: async (ctx, { blockId }) => {
    await performDeleteBlock(ctx, blockId);
    return null;
  },
});

// Variants called from the coach agent's tool execution path. Post-approval
// continuations run as a scheduled internalAction with no auth identity, so
// getAuthUserId returns null and would trigger NOT_AUTHORIZED. The agent
// framework provides ctx.userId on the tool ctx (bound to the thread at
// streamText time), and we trust that here instead of re-deriving from auth.

export const createBlockAsUser = internalMutation({
  args: { ...createBlockArgs.fields, userId: v.string() },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    return await performCreateBlock(ctx, rest, userId);
  },
});

export const updateBlockAsUser = internalMutation({
  args: { ...updateBlockArgs.fields, userId: v.string() },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    await performUpdateBlock(ctx, rest, userId);
  },
});

export const deleteBlockAsUser = internalMutation({
  args: { userId: v.string(), blockId: v.string() },
  handler: async (ctx, { userId, blockId }) => {
    await performDeleteBlock(ctx, blockId, userId);
  },
});
