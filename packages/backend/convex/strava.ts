import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

// ─── Internal Helpers (used by actions) ─────────────────────────────────────

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
 * Store or update a Strava connection for a user.
 * If the user already has a connection, it updates the existing one.
 */
export const storeConnectionInternal = internalMutation({
  args: {
    userId: v.id("users"),
    athleteId: v.number(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scopes: v.string(),
    athleteFirstName: v.optional(v.string()),
    athleteLastName: v.optional(v.string()),
    athleteProfileImage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        athleteId: args.athleteId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scopes: args.scopes,
        athleteFirstName: args.athleteFirstName,
        athleteLastName: args.athleteLastName,
        athleteProfileImage: args.athleteProfileImage,
      });
    } else {
      await ctx.db.insert("stravaConnections", args);
    }
    return null;
  },
});

/**
 * Get the Strava connection for a given user.
 * Used by internalAction (refreshAccessToken).
 */
export const getConnectionInternal = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("stravaConnections"),
      _creationTime: v.number(),
      userId: v.id("users"),
      athleteId: v.number(),
      accessToken: v.string(),
      refreshToken: v.string(),
      expiresAt: v.number(),
      scopes: v.string(),
      athleteFirstName: v.optional(v.string()),
      athleteLastName: v.optional(v.string()),
      athleteProfileImage: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Update tokens for an existing Strava connection.
 */
export const updateTokensInternal = internalMutation({
  args: {
    connectionId: v.id("stravaConnections"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Exchange a Strava authorization code for access/refresh tokens
 * and store the connection. Returns basic athlete profile info.
 */
export const exchangeCode = action({
  args: {
    code: v.string(),
    scopes: v.optional(v.string()),
  },
  returns: v.object({
    athleteFirstName: v.optional(v.string()),
    athleteLastName: v.optional(v.string()),
    athleteProfileImage: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId: string | null = await ctx.runQuery(
      internal.strava.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set in environment variables",
      );
    }

    // Exchange the authorization code for tokens
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: args.code,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strava token exchange failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    const athleteFirstName = data.athlete?.firstname || undefined;
    const athleteLastName = data.athlete?.lastname || undefined;
    const athleteProfileImage = data.athlete?.profile || undefined;

    // Store the connection in the database
    await ctx.runMutation(internal.strava.storeConnectionInternal, {
      userId: userId as any,
      athleteId: data.athlete.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      scopes: args.scopes ?? "",
      athleteFirstName,
      athleteLastName,
      athleteProfileImage,
    });

    return {
      athleteFirstName,
      athleteLastName,
      athleteProfileImage,
    };
  },
});

/**
 * Refresh an expired Strava access token for a given user.
 * Stores the new tokens in the database.
 */
export const refreshAccessToken = internalAction({
  args: { userId: v.id("users") },
  returns: v.object({
    accessToken: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const connection: any = await ctx.runQuery(
      internal.strava.getConnectionInternal,
      { userId: args.userId },
    );

    if (!connection) {
      throw new Error("No Strava connection found for this user");
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set in environment variables",
      );
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strava token refresh failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    await ctx.runMutation(internal.strava.updateTokensInternal, {
      connectionId: connection._id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    });

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_at,
    };
  },
});

/**
 * Get the current user's Strava connection status.
 * Returns null if not connected.
 */
export const getConnection = query({
  args: {},
  returns: v.union(
    v.object({
      athleteId: v.number(),
      athleteFirstName: v.optional(v.string()),
      athleteLastName: v.optional(v.string()),
      athleteProfileImage: v.optional(v.string()),
      connected: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!connection) return null;

    return {
      athleteId: connection.athleteId,
      athleteFirstName: connection.athleteFirstName,
      athleteLastName: connection.athleteLastName,
      athleteProfileImage: connection.athleteProfileImage,
      connected: true,
    };
  },
});

/**
 * Disconnect the current user's Strava account.
 */
export const disconnect = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db
      .query("stravaConnections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }

    return null;
  },
});
