/**
 * Garmin Sync - OAuth 2.0 + activity sync via Soma component (v0.6.0)
 *
 * Handles the full Garmin lifecycle:
 * - OAuth 2.0 code exchange + initial sync  (connectGarminOAuth)
 * - Incremental data sync                   (syncGarminData)
 * - Disconnect                              (disconnectGarminAccount)
 * - Export planned session to watch          (exportSessionToGarmin)
 *
 * All Garmin API communication, token storage, and data normalization
 * is managed internally by the Soma component. The GARMIN_CLIENT_ID
 * and GARMIN_CLIENT_SECRET environment variables are read automatically
 * by the Soma constructor.
 */

import { Soma } from "@nativesquare/soma";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../../_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
} from "../../_generated/server";
import { transformSessionToSomaWorkout } from "./transform";

const soma = new Soma(components.soma);

// ─── Internal Helpers ─────────────────────────────────────────────────────────

export const getAuthenticatedUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Handle the Garmin OAuth 2.0 callback.
 *
 * Exchanges the authorization code (+ PKCE code verifier) for tokens,
 * creates/reactivates the Soma connection, stores tokens securely,
 * and syncs all data types.
 *
 * Call from the native app after the OAuth redirect returns a `code`.
 */
export const connectGarminOAuth = action({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
  },
  returns: v.object({
    connectionId: v.string(),
    synced: v.object({
      activities: v.number(),
      dailies: v.number(),
      sleep: v.number(),
      body: v.number(),
      menstruation: v.number(),
    }),
    errors: v.array(
      v.object({
        type: v.string(),
        id: v.string(),
        error: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.garmin.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // TODO: Remove `as any` once Soma publishes updated OAuth 2.0 types for Garmin
    const result = await soma.connectGarmin(ctx, {
      userId,
      code: args.code,
      codeVerifier: args.codeVerifier,
    } as any);

    return result;
  },
});

/**
 * Sync all data types from Garmin for an already-connected user.
 *
 * Defaults to the last 30 days if no time range is specified.
 */
export const syncGarminData = action({
  args: {
    startTimeInSeconds: v.optional(v.number()),
    endTimeInSeconds: v.optional(v.number()),
  },
  returns: v.object({
    synced: v.object({
      activities: v.number(),
      dailies: v.number(),
      sleep: v.number(),
      body: v.number(),
      menstruation: v.number(),
    }),
    errors: v.array(
      v.object({
        type: v.string(),
        id: v.string(),
        error: v.string(),
      }),
    ),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    synced: {
      activities: number;
      dailies: number;
      sleep: number;
      body: number;
      menstruation: number;
    };
    errors: Array<{ type: string; id: string; error: string }>;
  }> => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.garmin.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    return await soma.syncGarmin(ctx, {
      userId,
      startTimeInSeconds: args.startTimeInSeconds,
      endTimeInSeconds: args.endTimeInSeconds,
    });
  },
});

/**
 * Disconnect the current user from Garmin.
 *
 * Revokes tokens and sets the Soma connection to inactive.
 */
export const disconnectGarminAccount = action({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.garmin.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    await soma.disconnectGarmin(ctx, { userId });

    return null;
  },
});

/**
 * Get the Garmin connection status for the current user via Soma.
 */
export const getGarminStatus = mutation({
  args: {},
  returns: v.union(
    v.object({
      connected: v.boolean(),
      connectionId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const connection = await soma.getConnectionByProvider(ctx, {
      userId,
      provider: "GARMIN",
    });

    if (!connection || !connection.active) return null;

    return {
      connected: true,
      connectionId: connection._id,
    };
  },
});

// ─── Export to Garmin ─────────────────────────────────────────────────────────

export const getPlannedSessionInternal = internalQuery({
  args: { sessionId: v.id("plannedSessions") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getGarminConnectionInternal = internalMutation({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await soma.getConnectionByProvider(ctx, {
      userId: args.userId,
      provider: "GARMIN",
    });
  },
});

export const ingestSomaPlannedWorkout = internalMutation({
  args: {
    connectionId: v.string(),
    userId: v.string(),
    steps: v.any(),
    metadata: v.any(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    return await soma.ingestPlannedWorkout(ctx, {
      connectionId: args.connectionId as never,
      userId: args.userId,
      steps: args.steps,
      metadata: args.metadata,
    });
  },
});

/**
 * Export a planned session to Garmin Connect.
 *
 * Transforms the Cadence planned session into Soma's format,
 * ingests it as a Soma planned workout, then pushes it to
 * Garmin via the Training API V2. The workout will appear on
 * the user's Garmin watch after they sync with Garmin Connect.
 */
export const exportSessionToGarmin = action({
  args: { sessionId: v.id("plannedSessions") },
  returns: v.object({
    garminWorkoutId: v.number(),
    garminScheduleId: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.garmin.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const connection = await ctx.runMutation(
      internal.integrations.garmin.sync.getGarminConnectionInternal,
      { userId },
    );
    if (!connection || !connection.active) {
      throw new ConvexError({
        code: "NOT_CONNECTED",
        message: "No active Garmin connection. Connect Garmin first in Settings.",
      });
    }

    const session = await ctx.runQuery(
      internal.integrations.garmin.sync.getPlannedSessionInternal,
      { sessionId: args.sessionId },
    );
    if (!session) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Planned session not found",
      });
    }

    const somaWorkout = transformSessionToSomaWorkout(session);

    const plannedWorkoutId: string = await ctx.runMutation(
      internal.integrations.garmin.sync.ingestSomaPlannedWorkout,
      {
        connectionId: connection._id,
        userId,
        steps: somaWorkout.steps,
        metadata: somaWorkout.metadata,
      },
    );

    const result = await soma.pushPlannedWorkoutToGarmin(ctx, {
      userId,
      plannedWorkoutId,
      workoutProvider: "Cadence",
    });

    return result;
  },
});
