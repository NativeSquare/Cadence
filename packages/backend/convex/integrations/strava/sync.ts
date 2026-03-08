/**
 * Strava Sync - OAuth + activity sync via Soma component (v0.2.0)
 *
 * Handles the full Strava lifecycle:
 * - OAuth code exchange + initial sync  (connectStrava)
 * - Incremental activity sync           (syncStravaData)
 * - Disconnect                          (disconnectStrava)
 *
 * All Strava API communication, token storage, and data normalization
 * is managed internally by the Soma component. The STRAVA_CLIENT_ID,
 * STRAVA_CLIENT_SECRET, and STRAVA_BASE_URL environment variables are
 * read automatically by the Soma constructor.
 */

import { Soma } from "@nativesquare/soma";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../../_generated/api";
import {
  action,
  internalQuery,
  mutation,
} from "../../_generated/server";

const soma = new Soma(components.soma);

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Get the authenticated user's ID. Used by actions that can't
 * call getAuthUserId directly.
 */
export const getAuthenticatedUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Handle the Strava OAuth callback.
 *
 * Exchanges the authorization code for tokens, creates/reactivates the
 * Soma connection, stores tokens securely, syncs the athlete profile,
 * and syncs all activities. Then marks the runner as Strava-connected.
 *
 * Call from the native app after the OAuth redirect returns a `code`.
 */
export const connectStravaOAuth = action({
  args: {
    code: v.string(),
  },
  returns: v.object({
    connectionId: v.string(),
    synced: v.number(),
    errors: v.array(
      v.object({
        activityId: v.number(),
        error: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.strava.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const result = await soma.connectStrava(ctx, {
      userId,
      code: args.code,
    });

    return result;
  },
});

/**
 * Sync activities from Strava for an already-connected user.
 *
 * Automatically refreshes the access token if expired. Fetches the
 * athlete profile and activities, transforms them, and ingests into Soma.
 */
export const syncStravaData = action({
  args: {
    after: v.optional(v.number()),
  },
  returns: v.object({
    synced: v.number(),
    errors: v.array(
      v.object({
        activityId: v.number(),
        error: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args): Promise<{
    synced: number;
    errors: Array<{ activityId: number; error: string }>;
  }> => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.strava.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    return await soma.syncStrava(ctx, {
      userId,
      after: args.after,
    });
  },
});

/**
 * Disconnect the current user from Strava.
 *
 * Revokes the token at Strava (best-effort), deletes stored tokens,
 * and sets the Soma connection to inactive.
 */
export const disconnectStravaAccount = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId: string | null = await ctx.runQuery(
      internal.integrations.strava.sync.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    await soma.disconnectStrava(ctx, { userId });

    return null;
  },
});

/**
 * Get the Strava connection status for the current user via Soma.
 */
export const getStravaStatus = mutation({
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
      provider: "STRAVA",
    });

    if (!connection || !connection.active) return null;

    return {
      connected: true,
      connectionId: connection._id,
    };
  },
});
