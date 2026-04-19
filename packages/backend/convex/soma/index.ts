/**
 * Soma - Centralized integration layer
 *
 * Single Soma instance and shared operations used across all providers.
 * Provider-specific operations live in their own files (garmin.ts, strava.ts).
 */

import { Soma } from "@nativesquare/soma";
import { plannedWorkoutValidator } from "@nativesquare/soma/validators";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import {
  internalMutation,
  internalQuery,
  query,
} from "../_generated/server";

export const soma = new Soma(components.soma);

// ---- Internal Helpers -------------------------------------------------------

/**
 * Get the authenticated user's ID. Used by actions that can't
 * call getAuthUserId directly (Convex actions lack query context).
 */
export const getAuthenticatedUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

// ---- Connections ------------------------------------------------------------

/**
 * List all Soma connections for the authenticated user.
 * Callers map / filter by provider as needed.
 */
export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await soma.listConnections(ctx, { userId });
  },
});

/**
 * Fetch a single connection by provider for a given user. Internal-only —
 * actions use it via `ctx.runQuery` before dispatching provider-specific calls.
 */
export const getConnectionByProvider = internalQuery({
  args: { userId: v.string(), provider: v.string() },
  handler: async (ctx, args) => {
    return await soma.getConnectionByProvider(ctx, {
      userId: args.userId,
      provider: args.provider,
    });
  },
});

// ---- Planned Workout ---------------------------------------------

/**
 * Ingest a SomaPlannedWorkout into the Soma component. Provider-agnostic —
 * garmin/strava export flows call it with the same validator-shaped payload.
 */
export const ingestPlannedWorkout = internalMutation({
  args: plannedWorkoutValidator,
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    return await soma.ingestPlannedWorkout(ctx, args);
  },
});

