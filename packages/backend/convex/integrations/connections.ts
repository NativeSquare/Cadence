/**
 * Connections - Unified integration status via Soma component
 *
 * Single source of truth for all provider connection statuses.
 * Queries the Soma component's connections table instead of
 * maintaining redundant fields on the runner document.
 */

import { Soma } from "@nativesquare/soma";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const soma = new Soma(components.soma);

const providerStatusValidator = v.object({
  connected: v.boolean(),
  lastSync: v.union(v.string(), v.null()),
});

/**
 * Get connection status for all providers from Soma.
 * Returns a map of provider → { connected, lastSync }.
 */
export const getConnectedProviders = query({
  args: {},
  returns: v.object({
    strava: providerStatusValidator,
    garmin: providerStatusValidator,
    healthkit: providerStatusValidator,
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    const empty = {
      strava: { connected: false, lastSync: null },
      garmin: { connected: false, lastSync: null },
      healthkit: { connected: false, lastSync: null },
    };

    if (!userId) return empty;

    const connections = await soma.listConnections(ctx, { userId });

    const result = { ...empty };

    for (const conn of connections) {
      const active = conn.active ?? false;
      switch (conn.provider) {
        case "STRAVA":
          result.strava = {
            connected: active,
            lastSync: conn.lastDataUpdate ?? null,
          };
          break;
        case "GARMIN":
          result.garmin = {
            connected: active,
            lastSync: conn.lastDataUpdate ?? null,
          };
          break;
        case "HEALTHKIT":
          result.healthkit = {
            connected: active,
            lastSync: conn.lastDataUpdate ?? null,
          };
          break;
      }
    }

    return result;
  },
});

/**
 * Disconnect Apple Health by deactivating the HEALTHKIT connection in Soma.
 */
export const disconnectAppleHealth = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    await soma.disconnect(ctx, { userId, provider: "HEALTHKIT" });
    return null;
  },
});
