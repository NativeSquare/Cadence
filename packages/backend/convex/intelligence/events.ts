import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { internalQuery, mutation } from "../_generated/server";

export const eventFields = {
  userId: v.id("users"),
  source: v.union(
    v.literal("chat"),
    v.literal("soma"),
    v.literal("cron"),
    v.literal("system"),
  ),
  type: v.string(),
  payload: v.any(),
  occurredAt: v.number(),
};

export const events = defineTable(eventFields).index("by_user_and_occurred", [
  "userId",
  "occurredAt",
]);

export const ingest = mutation({
  args: eventFields,
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", args);
    await ctx.scheduler.runAfter(0, internal.intelligence.router.route, {
      eventId,
    });
    return eventId;
  },
});

/**
 * Atomic "user speaks" entry point.
 *
 * Persists the user's chat message, records a `chat` event, and schedules
 * the Router. Replaces the old streaming HTTP send path — the client no
 * longer persists the user message separately.
 */
export const ingestChat = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.union(
      v.literal("user_message"),
      v.literal("tool_decision"),
    ),
    payload: v.any(),
  },
  handler: async (ctx, { conversationId, type, payload }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    const now = Date.now();

    const userMessageContent =
      type === "user_message"
        ? String(payload?.text ?? "")
        : type === "tool_decision"
          ? `[${payload?.decision === "accepted" ? "Confirmed" : "Declined"}: ${payload?.toolName ?? "action"}]`
          : "";

    const messageId = await ctx.db.insert("messages", {
      conversationId,
      role: "user",
      content: userMessageContent,
      createdAt: now,
      isComplete: true,
    });

    await ctx.db.patch(conversationId, { updatedAt: now });

    const eventId = await ctx.db.insert("events", {
      userId,
      source: "chat",
      type,
      payload: { ...(payload ?? {}), conversationId, messageId },
      occurredAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.intelligence.router.route, {
      eventId,
    });

    return { eventId, messageId };
  },
});

export const getById = internalQuery({
  args: { eventId: v.id("events") },
  handler: (ctx, { eventId }) => ctx.db.get(eventId),
});
