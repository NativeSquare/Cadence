/**
 * Strava - OAuth, sync, and disconnect via Soma
 */

import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { soma } from "./index";

// ─── OAuth ──────────────────────────────────────────────────────────────────

export const getAuthUrl = action({
  args: {},
  handler: async (ctx) => {
    const userId: string | null = await ctx.runQuery(
      internal.soma.index.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const redirectUri = `${process.env.CONVEX_SITE_URL}/api/strava/callback`;

    const result = await soma.strava.getAuthUrl(ctx, {
      userId,
      redirectUri,
    });

    return { authUrl: result.authUrl };
  },
});

export const disconnect = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId: string | null = await ctx.runQuery(
      internal.soma.index.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    await soma.strava.disconnect(ctx, { userId });

    return null;
  },
});

// ─── Pull ──────────────────────────────────────────────────────────────────

export const pullAll = internalAction({
  args: {
    userId: v.string(),
    after: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await soma.strava.pullAll(ctx, {
      userId: args.userId,
      after: args.after,
    });
    console.log(`[Soma] Strava pull for user ${args.userId}:`, result);
  },
});
