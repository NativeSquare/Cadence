/**
 * Garmin Sync - OAuth 1.0a + activity sync via Soma component (v0.5.0)
 *
 * Handles the full Garmin lifecycle:
 * - Request token generation           (requestGarminToken)
 * - OAuth callback + token exchange     (handled by Soma's registerRoutes)
 * - Post-connection runner update       (confirmGarminConnection)
 * - Incremental data sync              (syncGarminData)
 * - Disconnect                         (disconnectGarminAccount)
 *
 * The OAuth callback, token exchange, connection creation, and initial
 * data sync are handled inside the Soma component via registerRoutes
 * (see convex/http.ts). The host app only needs to:
 * 1. Call requestGarminToken (passes userId so Soma stores pending state)
 * 2. Redirect the user to the authUrl
 * 3. Call confirmGarminConnection after the deep-link redirect to mark
 *    the runner record as Garmin-connected
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

const soma = new Soma(components.soma);

// ─── Internal Helpers ─────────────────────────────────────────────────────────

export const getAuthenticatedUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const markGarminConnected = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!runner) {
      throw new ConvexError({
        code: "RUNNER_NOT_FOUND",
        message: "Runner not found. Complete initial onboarding first.",
      });
    }

    await ctx.db.patch(runner._id, {
      connections: {
        ...runner.connections,
        wearableConnected: true,
        wearableType: "garmin" as const,
      },
    });

    return null;
  },
});

export const markGarminDisconnected = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!runner) return null;

    await ctx.db.patch(runner._id, {
      connections: {
        ...runner.connections,
        wearableConnected: false,
      },
    });

    return null;
  },
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Step 1 of the Garmin OAuth 1.0a flow.
 *
 * Obtains a request token from Garmin and returns the authorization URL.
 * The userId is passed to Soma so it stores the pending OAuth state;
 * the registerRoutes callback handler will complete the exchange
 * automatically when Garmin redirects back.
 */
export const requestGarminToken = action({
  args: {
    callbackUrl: v.string(),
  },
  returns: v.object({
    token: v.string(),
    tokenSecret: v.string(),
    authUrl: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ token: string; tokenSecret: string; authUrl: string }> => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.garmin.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    return await soma.getGarminRequestToken(ctx, {
      callbackUrl: args.callbackUrl,
      userId,
    });
  },
});

/**
 * Confirm a Garmin connection after the OAuth flow completes.
 *
 * Called by the native app after the registerRoutes callback has handled
 * the token exchange and initial data sync. Verifies the Soma connection
 * is active, then marks the runner record as Garmin-connected.
 */
export const confirmGarminConnection = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const connection = await soma.getConnectionByProvider(ctx, {
      userId,
      provider: "GARMIN",
    });

    if (!connection || !connection.active) {
      throw new ConvexError({
        code: "NOT_CONNECTED",
        message: "Garmin connection not found. The OAuth flow may not have completed.",
      });
    }

    await ctx.runMutation(
      internal.integrations.garmin.sync.markGarminConnected,
      { userId },
    );

    return null;
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
 * Deletes stored tokens and sets the Soma connection to inactive.
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

    await ctx.runMutation(
      internal.integrations.garmin.sync.markGarminDisconnected,
      { userId: userId as any },
    );

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
