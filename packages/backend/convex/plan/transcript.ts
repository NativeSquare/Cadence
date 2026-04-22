/**
 * Onboarding transcript loader for the plan generator.
 *
 * Pulls the user's active conversation (the onboarding one, by convention —
 * a user has one active conversation at a time) and returns a lightweight
 * role/content array suitable for inclusion in a generator system prompt.
 */

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export type TranscriptMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const getOnboardingTranscript = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<TranscriptMessage[]> => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_active", (q) =>
        q.eq("userId", userId).eq("isActive", true),
      )
      .first();
    if (!conversation) return [];

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .order("asc")
      .collect();

    return msgs
      .filter((m) => !m.archived && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
  },
});
