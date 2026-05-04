import { getAuthUserId } from "@convex-dev/auth/server";
import { createThread } from "@convex-dev/agent";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    const userIdStr = userId as string;

    const existing = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: userIdStr,
        order: "desc",
        paginationOpts: { numItems: 1, cursor: null },
      },
    );
    if (existing.page.length > 0) return existing.page[0]._id;

    return await createThread(ctx, components.agent, { userId: userIdStr });
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const result = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: userId as string,
        order: "desc",
        paginationOpts: { numItems: 1, cursor: null },
      },
    );
    return result.page[0] ?? null;
  },
});
