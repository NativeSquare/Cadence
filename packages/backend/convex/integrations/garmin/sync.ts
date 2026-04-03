/**
 * Garmin Sync - OAuth 2.0 + activity sync via Soma component (v0.9.4)
 *
 * Handles the full Garmin lifecycle:
 * - Server-side OAuth 2.0 via registerRoutes (getGarminAuthUrl)
 * - Incremental data sync                    (syncGarminData)
 * - Disconnect                               (disconnectGarminAccount)
 * - Export planned session to watch           (exportSessionToGarmin)
 *
 * OAuth flow: the native app calls getGarminAuthUrl to get a Garmin
 * authorization URL. Soma generates PKCE and stores pending state
 * server-side. After the user authorizes, Garmin redirects to the
 * /api/garmin/callback endpoint (registered by registerRoutes in http.ts),
 * which completes the code exchange, stores tokens, and syncs data.
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
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a Garmin OAuth authorization URL.
 *
 * Soma generates PKCE and stores {state, userId, codeVerifier} in its
 * pendingOAuth table server-side. The native app opens the returned URL
 * in an in-app browser. After authorization, Garmin redirects to the
 * /api/garmin/callback endpoint where Soma completes the exchange.
 */
export const getGarminAuthUrl = action({
  args: {},
  handler: async (ctx) => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.garmin.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const redirectUri = `${process.env.CONVEX_SITE_URL}/api/garmin/callback`;

    const result = await soma.getGarminAuthUrl(ctx, {
      userId,
      redirectUri,
    });

    return { authUrl: result.authUrl };
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
  handler: async (
    ctx,
    args,
  ): Promise<{
    synced: {
      activities: number;
      bloodPressures: number;
      body: number;
      dailies: number;
      hrv: number;
      menstruation: number;
      pulseOx: number;
      respiration: number;
      skinTemp: number;
      sleep: number;
      stressDetails: number;
      userMetrics: number;
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

    // Store the Garmin workout ID on the session for webhook matching
    await ctx.runMutation(
      internal.integrations.garmin.sync.patchSessionGarminWorkoutId,
      {
        sessionId: args.sessionId,
        garminWorkoutId: result.garminWorkoutId,
      },
    );

    return result;
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

// ─── Garmin User Mapping ──────────────────────────────────────────────────────

/**
 * After a successful Garmin OAuth connect, read the Soma connection to
 * extract the Garmin-side `providerUserId` and persist the mapping so
 * that incoming webhooks can be resolved to a Cadence user quickly.
 */
export const storeGarminUserMapping = internalMutation({
  args: { cadenceUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await soma.getConnectionByProvider(ctx, {
      userId: args.cadenceUserId,
      provider: "GARMIN",
    });

    if (!connection?.providerUserId) return null;

    // Upsert — avoid duplicates if the user reconnects
    const existing = await ctx.db
      .query("garminUserMappings")
      .withIndex("by_garminUserId", (q) =>
        q.eq("garminUserId", connection.providerUserId!),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cadenceUserId: args.cadenceUserId as any,
      });
    } else {
      await ctx.db.insert("garminUserMappings", {
        garminUserId: connection.providerUserId,
        cadenceUserId: args.cadenceUserId as any,
      });
    }

    return null;
  },
});
