/**
 * Garmin - OAuth, sync, disconnect, and export-to-watch via Soma
 */

import { ConvexError, v } from "convex/values";
import { api, internal } from "../_generated/api";
import {
  action,
  internalAction,
  internalMutation,
} from "../_generated/server";
import { soma } from "./index";
import { toSoma } from "./adapter";

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

// ─── Pull ──────────────────────────────────────────────────────────────────

export const pullAll = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const result = await soma.garmin.pullAll(ctx, { userId });
    console.log(`[Soma] Garmin initial pull for user ${userId}:`, result);
  },
});

// ─── Export to Watch ──────────────────────────────────────────────────────────────────

export const exportSession = action({
  args: { sessionId: v.id("plannedSessions") },
  returns: v.object({
    garminWorkoutId: v.number(),
    garminScheduleId: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId: string | null = await ctx.runQuery(
      internal.soma.index.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const connection = await ctx.runQuery(
      internal.soma.index.getConnectionByProvider,
      { userId, provider: "GARMIN" },
    );
    if (!connection || !connection.active) {
      throw new ConvexError({
        code: "NOT_CONNECTED",
        message: "No active Garmin connection. Connect Garmin first in Settings.",
      });
    }

    const session = await ctx.runQuery(api.training.queries.getSessionById, {
      sessionId: args.sessionId,
    });
    if (!session) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Planned session not found",
      });
    }

    const somaWorkout = toSoma.plannedWorkout({
      id: session._id,
      scheduledDate: session.scheduledDate,
      sessionTypeDisplay: session.sessionTypeDisplay,
      description: session.description,
      targetDurationSeconds: session.targetDurationSeconds,
      targetDistanceMeters: session.targetDistanceMeters,
      targetPaceMin: session.targetPaceMin,
      targetPaceMax: session.targetPaceMax,
      targetHeartRateMin: session.targetHeartRateMin,
      targetHeartRateMax: session.targetHeartRateMax,
      structureSegments: session.structureSegments,
    });

    const plannedWorkoutId: string = await ctx.runMutation(
      internal.soma.index.ingestPlannedWorkout,
      {
        connectionId: connection._id,
        userId,
        steps: somaWorkout.steps,
        metadata: somaWorkout.metadata,
      },
    );

    const pushResult = await soma.garmin.pushWorkout(ctx, {
      userId,
      plannedWorkoutId,
      workoutProvider: "Cadence",
    });
    if (!pushResult.data) {
      throw new ConvexError({
        code: "GARMIN_PUSH_FAILED",
        message: pushResult.errors[0]?.message ?? "Failed to push workout to Garmin",
      });
    }
    const { garminWorkoutId } = pushResult.data;

    const scheduleResult = await soma.garmin.pushSchedule(ctx, {
      userId,
      plannedWorkoutId,
    });
    const garminScheduleId = scheduleResult.data?.garminScheduleId ?? null;

    // Store the Garmin workout ID on the session for webhook matching
    await ctx.runMutation(
      internal.soma.garmin.patchSessionGarminWorkoutId,
      {
        sessionId: args.sessionId,
        garminWorkoutId,
      },
    );

    return { garminWorkoutId, garminScheduleId };
  },
});

export const patchSessionGarminWorkoutId = internalMutation({
  args: {
    sessionId: v.id("plannedSessions"),
    garminWorkoutId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      garminWorkoutId: args.garminWorkoutId,
    });
    return null;
  },
});
