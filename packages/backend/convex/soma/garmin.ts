/**
 * Garmin - OAuth, backfill, and disconnect via Soma. Workout-level operations
 * (export to watch, sync, etc.) live in agoge — see agoge/sync.ts.
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

    const redirectUri = `${process.env.CONVEX_SITE_URL}/api/garmin/callback`;

    const result = await soma.garmin.getAuthUrl(ctx, {
      userId,
      redirectUri,
    });

    return { authUrl: result.authUrl };
  },
});

export const disconnect = action({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const userId: string | null = await ctx.runQuery(
      internal.soma.index.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    await soma.garmin.disconnect(ctx, { userId });

    return null;
  },
});

// ─── Backfill ──────────────────────────────────────────────────────────────

export const backfillAll = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const endTimeInSeconds = Math.floor(Date.now() / 1000);
    const startTimeInSeconds = endTimeInSeconds - 24 * 60 * 60;
    const result = await soma.garmin.backfillAll(ctx, {
      userId,
      startTimeInSeconds,
      endTimeInSeconds,
    });
    console.log(`[Soma] Garmin initial backfill for user ${userId}:`, result);
  },
});

