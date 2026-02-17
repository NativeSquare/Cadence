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
  internalMutation,
  internalQuery,
  mutation,
} from "../../_generated/server";
import { generateTrainingBlock } from "../../lib/mockDataGenerator";
import { toSomaActivity } from "../../seeds/mockActivities";

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

/**
 * Mark the runner's Strava connection as active after a successful sync.
 */
export const markStravaConnected = internalMutation({
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
        stravaConnected: true,
        wearableConnected: true,
      },
    });

    return null;
  },
});

/**
 * Mark the runner's Strava connection as inactive after disconnect.
 */
export const markStravaDisconnected = internalMutation({
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
        stravaConnected: false,
      },
    });

    return null;
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

    // Mark runner as Strava-connected
    await ctx.runMutation(
      internal.integrations.strava.sync.markStravaConnected,
      { userId: userId as any },
    );

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

    // Mark runner as disconnected
    await ctx.runMutation(
      internal.integrations.strava.sync.markStravaDisconnected,
      { userId: userId as any },
    );

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

// ─── Mock Strava for Development ──────────────────────────────────────────────

/**
 * Seed mock Strava data for development/testing.
 *
 * This mutation bypasses the real Strava OAuth flow and seeds mock activities
 * using the mock data generator (Story 4.2). Used by the frontend in __DEV__ mode.
 *
 * - Seeds 12 weeks of intermediate training data
 * - Marks the runner as Strava-connected
 * - Returns a result compatible with the real connectStravaOAuth action
 */
export const seedMockStravaData = mutation({
  args: {
    profile: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    weeks: v.optional(v.number()),
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const profile = args.profile ?? "intermediate";
    const weeks = args.weeks ?? 12;

    // Get runner
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) {
      throw new ConvexError({
        code: "RUNNER_NOT_FOUND",
        message: "Runner not found. Complete initial onboarding first.",
      });
    }

    // Create or get mock-strava connection (use "mock-strava" to distinguish from pure mock)
    const existingConnection = await ctx.runQuery(
      components.soma.public.getConnectionByProvider,
      { userId: userId as string, provider: "mock-strava" },
    );

    let connectionId: string;
    if (!existingConnection) {
      connectionId = await ctx.runMutation(components.soma.public.connect, {
        userId: userId as string,
        provider: "mock-strava",
      });
    } else {
      connectionId = existingConnection._id;
    }

    // Generate training block
    const activities = generateTrainingBlock(runner._id, userId, profile, weeks);

    // Insert via Soma
    let synced = 0;
    for (const activity of activities) {
      const somaData = toSomaActivity(activity, connectionId, userId as string);
      await ctx.runMutation(components.soma.public.ingestActivity, somaData);
      synced++;
    }

    // Mark runner as Strava-connected
    await ctx.db.patch(runner._id, {
      connections: {
        ...runner.connections,
        stravaConnected: true,
        wearableConnected: true,
      },
    });

    return {
      connectionId,
      synced,
      errors: [],
    };
  },
});
