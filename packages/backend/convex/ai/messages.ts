import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * AI Conversation Messages Schema
 *
 * Persists conversation history for context continuity and delta streaming.
 * Messages are tied to a conversation which is tied to a runner.
 *
 * Source: Story 2.1 - AC#2, AC#4
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
  // Delta streaming support
  isComplete: v.boolean(),
  streamedContent: v.optional(v.string()), // Partial content during streaming
};

// Conversation schema
const conversationSchema = {
  runnerId: v.id("runners"),
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
  .index("by_runnerId", ["runnerId"])
  .index("by_userId", ["userId"])
  .index("by_active", ["userId", "isActive"]);

export const messages = defineTable(messageSchema)
  .index("by_conversationId", ["conversationId"])
  .index("by_conversation_time", ["conversationId", "createdAt"]);

// =============================================================================
// Conversation CRUD
// =============================================================================

/**
 * Create or get active conversation for the current user's runner
 */
export const getOrCreateConversation = mutation({
  args: {
    runnerId: v.id("runners"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    // Check for existing active conversation
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", args.runnerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new conversation
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      runnerId: args.runnerId,
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

    // Get messages ordered by creation time
    const messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) => q.eq("conversationId", args.conversationId))
      .order("asc");

    const messages = await messagesQuery.collect();

    // Apply limit from the end (most recent messages)
    const limit = args.limit ?? 20;
    return messages.slice(-limit);
  },
});

/**
 * Get last incomplete message (for resuming after disconnect)
 */
export const getLastIncompleteMessage = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    // Verify ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    // Find the last incomplete message
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .filter((q) => q.eq(q.field("isComplete"), false))
      .first();

    return messages;
  },
});
