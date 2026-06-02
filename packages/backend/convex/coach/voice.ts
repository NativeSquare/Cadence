import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { callWhisper } from "./whisper";

export const transcribe = action({
  args: {
    storageId: v.id("_storage"),
    locale: v.union(v.literal("en"), v.literal("fr")),
  },
  returns: v.object({ text: v.string() }),
  handler: async (ctx, { storageId, locale }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    if (!(await ctx.runQuery(internal.table.users.checkPro, { userId }))) {
      throw new ConvexError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "An active Cadence Pro subscription is required.",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        code: "MISCONFIGURED",
        message: "OPENAI_API_KEY is not set",
      });
    }

    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Audio file not found",
      });
    }

    const text = await callWhisper(apiKey, blob, locale);

    // Voice recordings aren't retained server-side past transcription.
    await ctx.storage.delete(storageId).catch(() => undefined);

    return { text };
  },
});
