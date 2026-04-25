import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";

/**
 * AI Conversation Messages Schema
 *
 * Persists conversation history for context continuity and delta streaming.
 * Messages are tied to a conversation which is tied to an agoge athlete
 * (`athleteId` is the branded agoge `Id<"athletes">` held as a string, since
 * Cadence does not own the athletes table).
 */

// Tool call schema for persisted messages
const toolCallSchema = v.object({
  toolCallId: v.string(),
  toolName: v.string(),
  args: v.any(),
});

// Tool result schema for persisted messages
const toolResultSchema = v.object({
  toolCallId: v.string(),
  toolName: v.string(),
  result: v.any(),
});

// Message part schema (matches AI SDK message parts)
const messagePartSchema = v.union(
  v.object({
    type: v.literal("text"),
    text: v.string(),
  }),
  v.object({
    type: v.literal("tool-call"),
    toolCallId: v.string(),
    toolName: v.string(),
    args: v.any(),
  }),
  v.object({
    type: v.literal("tool-result"),
    toolCallId: v.string(),
    toolName: v.string(),
    result: v.any(),
  })
);

// Full message schema
const messageSchema = {
  conversationId: v.id("conversations"),
  role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
  content: v.string(),
  parts: v.optional(v.array(messagePartSchema)),
  toolCalls: v.optional(v.array(toolCallSchema)),
  toolResults: v.optional(v.array(toolResultSchema)),
  createdAt: v.number(),
  isComplete: v.boolean(),
  streamedContent: v.optional(v.string()),
  archived: v.optional(v.boolean()),
};

// Conversation schema
const conversationSchema = {
  athleteId: v.string(),
  userId: v.id("users"),
  phase: v.union(
    v.literal("intro"),
    v.literal("data_bridge"),
    v.literal("profile"),
    v.literal("goals"),
    v.literal("schedule"),
    v.literal("health"),
    v.literal("coaching"),
    v.literal("analysis")
  ),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Table definitions
export const conversations = defineTable(conversationSchema)
  .index("by_athleteId", ["athleteId"])
  .index("by_userId", ["userId"])
  .index("by_active", ["userId", "isActive"]);

export const messages = defineTable(messageSchema)
  .index("by_conversationId", ["conversationId"])
  .index("by_conversation_time", ["conversationId", "createdAt"]);

// =============================================================================
// Conversation CRUD
// =============================================================================

/**
 * Create or get active conversation for the current user's agoge athlete.
 */
export const getOrCreateConversation = mutation({
  args: {
    athleteId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    // Check for existing active conversation
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_athleteId", (q) => q.eq("athleteId", args.athleteId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new conversation
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      athleteId: args.athleteId,
      userId,
      phase: "intro",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

/**
 * Get active conversation for current user
 */
export const getActiveConversation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .first();
  },
});

/**
 * Update conversation phase
 */
export const updateConversationPhase = mutation({
  args: {
    conversationId: v.id("conversations"),
    phase: v.union(
      v.literal("intro"),
      v.literal("data_bridge"),
      v.literal("profile"),
      v.literal("goals"),
      v.literal("schedule"),
      v.literal("health"),
      v.literal("coaching"),
      v.literal("analysis")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Conversation not found" });
    }

    await ctx.db.patch(args.conversationId, {
      phase: args.phase,
      updatedAt: Date.now(),
    });
  },
});

// =============================================================================
// Message CRUD
// =============================================================================

/**
 * Add a message to conversation
 */
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    parts: v.optional(v.array(messagePartSchema)),
    toolCalls: v.optional(v.array(toolCallSchema)),
    toolResults: v.optional(v.array(toolResultSchema)),
    isComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Conversation not found" });
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      parts: args.parts,
      toolCalls: args.toolCalls,
      toolResults: args.toolResults,
      createdAt: Date.now(),
      isComplete: args.isComplete ?? true,
    });

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Update message with streamed content (delta streaming)
 */
export const updateMessageContent = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    streamedContent: v.optional(v.string()),
    isComplete: v.boolean(),
    parts: v.optional(v.array(messagePartSchema)),
    toolCalls: v.optional(v.array(toolCallSchema)),
    toolResults: v.optional(v.array(toolResultSchema)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Message not found" });
    }

    // Verify ownership via conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authorized" });
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      streamedContent: args.streamedContent,
      isComplete: args.isComplete,
      parts: args.parts,
      toolCalls: args.toolCalls,
      toolResults: args.toolResults,
    });
  },
});

/**
 * Get conversation history for context
 */
export const getConversationHistory = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    // Verify ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return [];
    }

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    const activeMessages = allMessages.filter((m) => !m.archived);
    const limit = args.limit ?? 20;
    return activeMessages.slice(-limit);
  },
});

/**
 * Internal: fetch recent non-archived messages from a user's active
 * conversation. Used by the Mind specialist (runs in an action, can't call
 * auth-gated queries). Returns an empty array if there is no active
 * conversation.
 */
export const listRecentForUser = internalQuery({
  args: {
    userId: v.id("users"),
    since: v.number(),
  },
  handler: async (ctx, { userId, since }) => {
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
        q.eq("conversationId", conversation._id).gte("createdAt", since),
      )
      .order("asc")
      .collect();

    return msgs.filter((m) => !m.archived);
  },
});

// =============================================================================
// Message Archival (Seshat Compaction)
// =============================================================================

/**
 * Archive old messages after compaction, keeping only the most recent N.
 * Called internally by the agent loop when Seshat triggers compaction.
 */
export const archiveMessages = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    keepCount: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    const activeMessages = allMessages.filter((m) => !m.archived);
    const archiveCount = Math.max(0, activeMessages.length - args.keepCount);

    for (let i = 0; i < archiveCount; i++) {
      await ctx.db.patch(activeMessages[i]._id, { archived: true });
    }

    return archiveCount;
  },
});
