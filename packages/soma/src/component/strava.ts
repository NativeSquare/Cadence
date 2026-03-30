// ─── Strava Component Actions ────────────────────────────────────────────────
// Public actions that handle the full Strava OAuth + sync lifecycle.
// The host app calls these through the Soma class, which threads the
// credentials automatically from env vars or constructor config.
//
// Internal mutations manage the providerTokens table (token CRUD).

import { v } from "convex/values";
import { anyApi } from "convex/server";
import {
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server.js";
import { StravaClient } from "../strava/client.js";
import {
  exchangeCode,
  refreshToken as refreshStravaToken,
} from "../strava/auth.js";
import { transformActivity } from "../strava/activity.js";
import { transformAthlete } from "../strava/athlete.js";

// Use anyApi to avoid circular type references between this file and _generated/api.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicApi: any = anyApi;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalApi: any = anyApi;

// ─── Internal Token CRUD ─────────────────────────────────────────────────────
// These are only callable from within the component (actions in this file).

/**
 * Store or update OAuth tokens for a connection.
 * Upserts by connectionId — one token record per connection.
 */
export const storeTokens = internalMutation({
  args: {
    connectionId: v.id("connections"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providerTokens")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
      });
      return null;
    }

    await ctx.db.insert("providerTokens", args);
    return null;
  },
});

/**
 * Get stored tokens for a connection.
 */
export const getTokens = internalQuery({
  args: { connectionId: v.id("connections") },
  returns: v.union(
    v.object({
      _id: v.id("providerTokens"),
      _creationTime: v.number(),
      connectionId: v.id("connections"),
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerTokens")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();
  },
});

/**
 * Delete stored tokens for a connection.
 */
export const deleteTokens = internalMutation({
  args: { connectionId: v.id("connections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providerTokens")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

// ─── Public Actions ──────────────────────────────────────────────────────────

/**
 * Full Strava OAuth callback handler.
 *
 * Exchanges the authorization code for tokens, creates/reactivates the
 * Soma connection, stores tokens securely, syncs the athlete profile,
 * and syncs all activities.
 *
 * Returns `{ connectionId, synced, errors }`.
 */
export const connectStrava = action({
  args: {
    userId: v.string(),
    code: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    baseUrl: v.optional(v.string()),
    includeStreams: v.optional(v.boolean()),
  },
  returns: v.object({
    connectionId: v.string(),
    synced: v.number(),
    errors: v.array(
      v.object({ activityId: v.number(), error: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeCode({
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      code: args.code,
      baseUrl: args.baseUrl,
    });

    // 2. Create/reactivate the Soma connection
    const connectionId = await ctx.runMutation(publicApi.public.connect, {
      userId: args.userId,
      provider: "STRAVA",
    });

    // 3. Store OAuth tokens in providerTokens table
    await ctx.runMutation(internalApi.strava.storeTokens, {
      connectionId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_at,
    });

    // 4. Sync athlete profile
    const client = new StravaClient({
      accessToken: tokens.access_token,
      baseUrl: args.baseUrl,
    });

    const athlete = await client.getAthlete();
    const athleteData = transformAthlete(athlete);
    await ctx.runMutation(publicApi.public.ingestAthlete, {
      connectionId,
      userId: args.userId,
      ...athleteData,
    } as never);

    // 5. Sync all activities
    const summaries = await client.listAllActivities();
    let synced = 0;
    const errors: Array<{ activityId: number; error: string }> = [];

    for (const summary of summaries) {
      try {
        const detailed = await client.getActivity(summary.id);
        const streams = args.includeStreams
          ? await client.getActivityStreams(summary.id)
          : undefined;
        const data = transformActivity(detailed, { streams });
        await ctx.runMutation(publicApi.public.ingestActivity, {
          connectionId,
          userId: args.userId,
          ...data,
        } as never);
        synced++;
      } catch (err) {
        errors.push({
          activityId: summary.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 6. Update lastDataUpdate timestamp
    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });

    return { connectionId, synced, errors };
  },
});

/**
 * Incremental Strava sync for an already-connected user.
 *
 * Looks up the stored tokens, auto-refreshes if expired, then syncs
 * the athlete profile and activities.
 *
 * Returns `{ synced, errors }`.
 */
export const syncStrava = action({
  args: {
    userId: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    baseUrl: v.optional(v.string()),
    includeStreams: v.optional(v.boolean()),
    after: v.optional(v.number()),
  },
  returns: v.object({
    synced: v.number(),
    errors: v.array(
      v.object({ activityId: v.number(), error: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    // 1. Look up connection
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProvider,
      { userId: args.userId, provider: "STRAVA" },
    );
    if (!connection) {
      throw new Error(
        `No Strava connection found for user "${args.userId}". ` +
        "Call connectStrava first.",
      );
    }
    if (!connection.active) {
      throw new Error(
        `Strava connection for user "${args.userId}" is inactive. Reconnect first.`,
      );
    }

    const connectionId = connection._id;

    // 2. Get stored tokens
    const tokenDoc = await ctx.runQuery(internalApi.strava.getTokens, {
      connectionId,
    });
    if (!tokenDoc) {
      throw new Error(
        `No tokens found for Strava connection. ` +
        "The connection may have been created before token storage was available.",
      );
    }

    // 3. Auto-refresh if token is expired or expiring within 5 minutes
    let accessToken = tokenDoc.accessToken;
    const now = Math.floor(Date.now() / 1000);
    if (!tokenDoc.refreshToken || !tokenDoc.expiresAt) {
      throw new Error(
        "Strava tokens are missing refreshToken or expiresAt. " +
        "This connection may have been created with an incompatible version.",
      );
    }
    if (tokenDoc.expiresAt < now + 300) {
      const refreshed = await refreshStravaToken({
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        refreshToken: tokenDoc.refreshToken,
        baseUrl: args.baseUrl,
      });
      accessToken = refreshed.access_token;
      await ctx.runMutation(internalApi.strava.storeTokens, {
        connectionId,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: refreshed.expires_at,
      });
    }

    // 4. Create client and sync
    const client = new StravaClient({
      accessToken,
      baseUrl: args.baseUrl,
    });

    // Sync athlete profile
    const athlete = await client.getAthlete();
    const athleteData = transformAthlete(athlete);
    await ctx.runMutation(publicApi.public.ingestAthlete, {
      connectionId,
      userId: args.userId,
      ...athleteData,
    } as never);

    // Sync activities (optionally incremental via `after`)
    const summaries = await client.listAllActivities({
      after: args.after,
    });
    let synced = 0;
    const errors: Array<{ activityId: number; error: string }> = [];

    for (const summary of summaries) {
      try {
        const detailed = await client.getActivity(summary.id);
        const streams = args.includeStreams
          ? await client.getActivityStreams(summary.id)
          : undefined;
        const data = transformActivity(detailed, { streams });
        await ctx.runMutation(publicApi.public.ingestActivity, {
          connectionId,
          userId: args.userId,
          ...data,
        } as never);
        synced++;
      } catch (err) {
        errors.push({
          activityId: summary.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 5. Update lastDataUpdate timestamp
    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });

    return { synced, errors };
  },
});

/**
 * Disconnect a user from Strava.
 *
 * Revokes the token at Strava (best-effort), deletes stored tokens,
 * and sets the connection to inactive.
 */
export const disconnectStrava = action({
  args: {
    userId: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    baseUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Look up connection
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProvider,
      { userId: args.userId, provider: "STRAVA" },
    );
    if (!connection) {
      throw new Error(
        `No Strava connection found for user "${args.userId}".`,
      );
    }

    const connectionId = connection._id;

    // 2. Revoke token at Strava (best-effort, don't fail if it errors)
    const tokenDoc = await ctx.runQuery(internalApi.strava.getTokens, {
      connectionId,
    });
    if (tokenDoc) {
      try {
        const base = (args.baseUrl ?? "https://www.strava.com").replace(
          /\/+$/,
          "",
        );
        await fetch(`${base}/oauth/deauthorize`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `access_token=${tokenDoc.accessToken}`,
        });
      } catch {
        // Deauthorization is best-effort — clean up locally regardless
      }

      // 3. Delete stored tokens
      await ctx.runMutation(internalApi.strava.deleteTokens, { connectionId });
    }

    // 4. Set connection inactive
    await ctx.runMutation(publicApi.public.disconnect, {
      userId: args.userId,
      provider: "STRAVA",
    });

    return null;
  },
});
