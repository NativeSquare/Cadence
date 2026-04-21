import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

const toolCallValidator = v.object({
  toolCallId: v.string(),
  toolName: v.string(),
  args: v.any(),
});

export const deliverCandidate = internalMutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    toolCalls: v.optional(v.array(toolCallValidator)),
  },
  handler: async (ctx, { userId, text, toolCalls }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_active", (q) =>
        q.eq("userId", userId).eq("isActive", true),
      )
      .first();

    if (!conversation) {
      console.log(`[delivery] no active conversation for ${userId} — dropping`);
      return null;
    }

    const parts: Array<
      | { type: "text"; text: string }
      | {
          type: "tool-call";
          toolCallId: string;
          toolName: string;
          args: unknown;
        }
    > = [];

    if (text.length > 0) {
      parts.push({ type: "text", text });
    }

    for (const call of toolCalls ?? []) {
      parts.push({
        type: "tool-call",
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        args: call.args,
      });
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      role: "assistant",
      content: text,
      parts: parts.length > 0 ? parts : undefined,
      createdAt: now,
      isComplete: true,
    });

    await ctx.db.patch(conversation._id, { updatedAt: now });
    return messageId;
  },
});
