import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "../_generated/server";

/**
 * Free-form things the AI coach has learned about the athlete and that the
 * Context sheet exposes verbatim. Whatever is in this table for a user is
 * appended to that user's system prompt on every coach turn — so the contract
 * is: "what the user sees in the Context sheet is exactly what the coach is
 * told about them." No extra metadata, no structured fields. The coach picks
 * the prose; the user gets to read it.
 */

const documentSchema = {
  userId: v.id("users"),
  text: v.string(),
};

export const coachMemories = defineTable(documentSchema).index("by_user", [
  "userId",
]);

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("coachMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("coachMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
  },
});

/**
 * Auth-checked write used by the coach tool. The tool runs inside an action
 * whose outer request is the authenticated user, so the auth context flows
 * through and we can refuse to write memories for anyone else.
 */
export const addForCurrentUser = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new ConvexError({
        code: "EMPTY_MEMORY",
        message: "Memory text must not be empty",
      });
    }
    return await ctx.db.insert("coachMemories", { userId, text: trimmed });
  },
});

/**
 * Internal variant for callers that already know the userId (proactive
 * triggers, cron jobs, etc.). Not used by the user chat path.
 */
export const _addForUser = internalMutation({
  args: { userId: v.id("users"), text: v.string() },
  handler: async (ctx, { userId, text }) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;
    return await ctx.db.insert("coachMemories", { userId, text: trimmed });
  },
});
