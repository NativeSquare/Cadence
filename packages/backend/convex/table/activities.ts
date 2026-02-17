import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

// =============================================================================
// Activities Query Wrapper
// =============================================================================
// Wraps Soma component's internal listActivities query for client access.
// Used by DataInsightsScreen to compute onboarding insights.

/**
 * List activities for the current authenticated user.
 * Returns activities from Soma component (Terra schema).
 *
 * @param startTime - Optional ISO-8601 timestamp to filter activities after
 * @param endTime - Optional ISO-8601 timestamp to filter activities before
 * @param limit - Optional max number of activities to return
 * @param order - Sort order: "asc" (oldest first) or "desc" (newest first)
 */
export const listMyActivities = query({
  args: {
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    limit: v.optional(v.number()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.runQuery(components.soma.public.listActivities, {
      userId: userId as string,
      startTime: args.startTime,
      endTime: args.endTime,
      limit: args.limit,
      order: args.order ?? "desc",
    });
  },
});
