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
import {
  action,
  internalAction,
  mutation,
  query,
} from "../_generated/server";
import { coach } from "./agent";

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

    if (attachments && attachments.length > 0) {
      // Multimodal: build a user message with text + image/file content parts.
      // AI SDK v5 uses `mediaType` (not `mimeType`) on ImagePart/FilePart.
      const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; image: string; mediaType?: string }
        | { type: "file"; data: string; mediaType: string }
      > = [{ type: "text", text }];

      for (const a of attachments) {
        if (a.kind === "image") {
          content.push({ type: "image", image: a.url, mediaType: a.mimeType });
        } else {
          content.push({ type: "file", data: a.url, mediaType: a.mimeType });
        }
      }

      await coach.streamText(
        ctx,
        { threadId, userId: userId as string },
        { messages: [{ role: "user", content }] },
        { saveStreamDeltas: true },
      );
      return;
    }

    await coach.streamText(
      ctx,
      { threadId, userId: userId as string },
      { prompt: text },
      { saveStreamDeltas: true },
    );
  },
});

/**
 * Resolve a pending tool-approval-request from the chat UI.
 *
 * - approved=true  → framework runs the tool's `execute()` (the real DB write).
 * - approved=false → framework injects an `execution-denied` result; no write.
 *
 * After saving the response, schedules `continueAfterApproval` to re-enter
 * generation so the model can react to the result.
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

    await ctx.scheduler.runAfter(0, internal.coach.messages.continueAfterApproval, {
      threadId,
      promptMessageId: messageId,
      userId: userId as string,
    });
  },
});

export const continueAfterApproval = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { threadId, promptMessageId, userId }) => {
    await coach.streamText(
      ctx,
      { threadId, userId },
      { promptMessageId },
      { saveStreamDeltas: true },
    );
  },
});
