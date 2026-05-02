/**
 * Garmin - OAuth, sync, disconnect, and export-to-watch via Soma.
 *
 * Export-to-watch is currently stubbed. The full path (agoge workout →
 * step-tree → Soma planned workout → Garmin push) requires the adapter
 * rewrite tracked in the plan generator work.
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

// ─── Export to Watch ──────────────────────────────────────────────────────────────────

export const exportWorkout = action({
  args: { workoutId: v.string() },
  returns: v.object({
    garminWorkoutId: v.number(),
    garminScheduleId: v.union(v.number(), v.null()),
  }),
  handler: async (_ctx, _args) => {
    throw new ConvexError({
      code: "NOT_IMPLEMENTED",
      message:
        "Export to Garmin watch is pending the agoge step-tree → Soma adapter rewrite.",
    });
  },
});
