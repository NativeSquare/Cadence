/**
 * Block reads + mutations. Blocks belong to a plan and group consecutive weeks
 * of training.
 */

import { blocksValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import {
  assertAthlete,
  assertAthletePlan,
  assertBlockDateRange,
  assertBlockOwnership,
  assertBlockWithinPlan,
  assertNoBlockOverlap,
  loadAthlete,
  loadOwnedBlock,
} from "./helpers";

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

export const createBlock = mutation({
  args: blocksValidator.omit("planId"),
  handler: async (ctx, args) => {
    const { athlete } = await assertAthlete(ctx);
    const plan = await assertAthletePlan(ctx, athlete._id);
    assertBlockDateRange(args.startDate, args.endDate);
    assertBlockWithinPlan(args, plan);
    await assertNoBlockOverlap(ctx, plan._id, args);
    return await ctx.runMutation(components.agoge.public.createBlock, {
      ...args,
      planId: plan._id,
    });
  },
});

export const updateBlock = mutation({
  args: blocksValidator
    .omit("planId")
    .partial()
    .extend({ blockId: v.string() }),
  handler: async (ctx, args) => {
    const { blockId, ...patch } = args;
    const { block, plan } = await assertBlockOwnership(ctx, blockId);
    const nextStart = patch.startDate ?? block.startDate;
    const nextEnd = patch.endDate ?? block.endDate;
    assertBlockDateRange(nextStart, nextEnd);
    assertBlockWithinPlan({ startDate: nextStart, endDate: nextEnd }, plan);
    await assertNoBlockOverlap(
      ctx,
      plan._id,
      { startDate: nextStart, endDate: nextEnd },
      { excludeBlockId: block._id },
    );
    await ctx.runMutation(components.agoge.public.updateBlock, {
      blockId: block._id,
      ...patch,
    });
    return null;
  },
});

export const deleteBlock = mutation({
  args: { blockId: v.string() },
  handler: async (ctx, { blockId }) => {
    const { block } = await assertBlockOwnership(ctx, blockId);
    await ctx.runMutation(components.agoge.public.deleteBlock, {
      blockId: block._id,
    });
    return null;
  },
});
