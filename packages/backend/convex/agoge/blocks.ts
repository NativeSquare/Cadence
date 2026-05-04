/**
 * Block reads. Blocks belong to a plan and group consecutive weeks of training.
 */

import { v } from "convex/values";
import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { loadAthlete } from "./helpers";

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
