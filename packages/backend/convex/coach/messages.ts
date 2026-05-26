import { getAuthUserId } from "@convex-dev/auth/server";
import {
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import { action, query } from "../_generated/server";
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

    if (!(await ctx.runQuery(internal.table.users.checkPro, { userId }))) {
      throw new ConvexError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "An active Cadence Pro subscription is required.",
      });
    }

    const seed: TurnSeed = attachments && attachments.length > 0
      ? { kind: "multimodal", text, attachments }
      : { kind: "text", text };

    await runCoachTurn(ctx, { userId: userId, threadId, seed });
  },
});
