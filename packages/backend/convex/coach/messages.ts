import { getAuthUserId } from "@convex-dev/auth/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import { action, query } from "../_generated/server";
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
  },
  handler: async (ctx, { threadId, text }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    await coach.streamText(
      ctx,
      { threadId, userId: userId as string },
      { prompt: text },
      { saveStreamDeltas: true },
    );
  },
});
