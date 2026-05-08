import { getAuthUserId } from "@convex-dev/auth/server";
import {
  getThreadMetadata,
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, mutation, query } from "../_generated/server";
import { coach } from "./agent";
import { type TurnSeed, runCoachTurn } from "./turns";

export const list = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, args) => {
    const paginated = await listUIMessages(ctx, components.agent, args);
    const streams = await syncStreams(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});

export const send = action({
  args: {
    threadId: v.string(),
    text: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          url: v.string(),
          mimeType: v.string(),
          kind: v.union(v.literal("image"), v.literal("file")),
        }),
      ),
    ),
  },
  handler: async (ctx, { threadId, text, attachments }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const seed: TurnSeed = attachments && attachments.length > 0
      ? { kind: "multimodal", text, attachments }
      : { kind: "text", text };

    await runCoachTurn(ctx, { userId: userId as Id<"users">, threadId, seed });
  },
});

/**
 * Resolve a pending tool-approval-request from the chat UI.
 *
 * - approved=true  → framework runs the tool's `execute()` (the real DB write).
 * - approved=false → framework injects an `execution-denied` result; no write.
 *
 * After saving the response, schedules a coach turn to react to the result.
 */
export const respondToToolApproval = mutation({
  args: {
    threadId: v.string(),
    approvalId: v.string(),
    approved: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, approvalId, approved, reason }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const thread = await getThreadMetadata(ctx, components.agent, { threadId });
    if (thread.userId !== (userId as string)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Thread not owned by caller",
      });
    }

    const { messageId } = approved
      ? await coach.approveToolCall(ctx, { threadId, approvalId, reason })
      : await coach.denyToolCall(ctx, { threadId, approvalId, reason });

    await ctx.scheduler.runAfter(0, internal.coach.turns.run, {
      userId: userId as Id<"users">,
      threadId,
      seed: { kind: "continue", promptMessageId: messageId },
    });
  },
});
