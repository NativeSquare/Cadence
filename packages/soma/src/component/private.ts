import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server.js";

// ─── Internal Connection Helpers ────────────────────────────────────────────
// Used by component-internal operations (sync crons, data ingestion, etc.).
// The host app should use the public API in public.ts instead.

/**
 * Get all active connections (for sync scheduling).
 */
export const getActiveConnections = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("connections").collect();
    return all.filter((c) => c.active === true);
  },
});

/**
 * Get a connection by userId + provider (internal).
 */
export const getConnectionByProvider = internalQuery({
  args: {
    userId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .first();
  },
});

/**
 * Get a connection by provider's external user ID + provider (internal).
 * Used by webhook handlers to map Garmin's userId to a Soma connection.
 */
export const getConnectionByProviderUserId = internalQuery({
  args: {
    providerUserId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_providerUserId_provider", (q) =>
        q
          .eq("providerUserId", args.providerUserId)
          .eq("provider", args.provider),
      )
      .first();
  },
});

/**
 * Update the lastDataUpdate timestamp after a successful sync.
 */
export const updateLastDataUpdate = internalMutation({
  args: {
    connectionId: v.id("connections"),
    lastDataUpdate: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastDataUpdate: args.lastDataUpdate,
    });
  },
});
