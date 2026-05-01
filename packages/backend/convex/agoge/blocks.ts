/**
 * Block reads. Blocks belong to a plan and group consecutive weeks of training.
 */

import { v } from "convex/values";
import { components } from "../_generated/api";
import { query } from "../_generated/server";

export const listBlocks = query({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    return await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
      planId: planId,
    });
  },
});
