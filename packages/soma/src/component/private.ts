import { v } from "convex/values";
import { internalQuery } from "./_generated/server.js";

// ─── Internal Connection Helpers ────────────────────────────────────────────
// Used by component-internal operations (sync crons, data ingestion, etc.).
// The host app should use the public API in public.ts instead.

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

