/**
 * Strava Sync - Server-side OAuth + activity sync via Soma component (v0.10.0)
 *
 * Handles the full Strava lifecycle:
 * - Server-side OAuth URL generation       (getStravaAuthUrl)
 * - Incremental activity sync              (syncStravaData)
 * - Disconnect                             (disconnectStravaAccount)
 *
 * OAuth completion (code exchange + initial sync) is handled server-side
 * by the Soma callback registered in http.ts via registerRoutes.
 *
 * All Strava API communication, token storage, and data normalization
 * is managed internally by the Soma component. The STRAVA_CLIENT_ID,
 * STRAVA_CLIENT_SECRET environment variables are read automatically
 * by the Soma constructor.
 */

import { Soma } from "@nativesquare/soma";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../../_generated/api";
import { action, internalQuery } from "../../_generated/server";

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
 * Generate a Strava OAuth authorization URL.
 *
 * Soma generates a state parameter and stores {state, userId} in its
 * pendingOAuth table server-side. The native app opens the returned URL
 * in an in-app browser. After authorization, Strava redirects to the
 * /api/strava/callback endpoint where Soma completes the exchange.
 */
export const getStravaAuthUrl = action({
  args: {},
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

    const redirectUri = `${process.env.CONVEX_SITE_URL}/api/strava/callback`;

    const result = await soma.getStravaAuthUrl(ctx, {
      userId,
      redirectUri,
    });

    return { authUrl: result.authUrl };
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
    synced: v.object({
      athletes: v.number(),
      activities: v.number(),
    }),
    errors: v.array(
      v.object({
        type: v.string(),
        id: v.string(),
        error: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args): Promise<{
    synced: { athletes: number; activities: number };
    errors: Array<{ type: string; id: string; error: string }>;
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
