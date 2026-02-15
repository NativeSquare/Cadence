import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  calculateDataCompleteness,
  getMissingFields,
  determinePhase,
} from "./table/runners";

// ─── Validators ──────────────────────────────────────────────────────────────

const inferredDataValidator = v.object({
  avgWeeklyVolume: v.number(),
  volumeConsistency: v.number(),
  easyPaceActual: v.optional(v.string()),
  longRunPattern: v.optional(v.string()),
  restDayFrequency: v.number(),
  trainingLoadTrend: v.union(
    v.literal("building"),
    v.literal("maintaining"),
    v.literal("declining"),
    v.literal("erratic"),
  ),
  estimatedFitness: v.optional(v.number()),
});

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Store HealthKit-derived aggregates in the runner profile.
 * Updates the `inferred` field and marks the wearable connection as active.
 *
 * Called from the native app after on-device HealthKit data processing.
 */
export const storeHealthData = mutation({
  args: {
    aggregates: inferredDataValidator,
    totalRuns: v.number(),
  },
  returns: v.id("runners"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

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

    // Verify ownership
    if (runner.userId !== userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authorized to update this runner",
      });
    }

    // Build updated connections
    const updatedConnections = {
      ...runner.connections,
      wearableConnected: true,
      wearableType: "apple_watch" as const,
    };

    // Build the inferred data from aggregates
    const updatedInferred = {
      ...runner.inferred,
      avgWeeklyVolume: args.aggregates.avgWeeklyVolume,
      volumeConsistency: args.aggregates.volumeConsistency,
      easyPaceActual: args.aggregates.easyPaceActual,
      longRunPattern: args.aggregates.longRunPattern,
      restDayFrequency: args.aggregates.restDayFrequency,
      trainingLoadTrend: args.aggregates.trainingLoadTrend,
      estimatedFitness: args.aggregates.estimatedFitness,
    };

    // Build merged runner for recalculation
    const mergedRunner = {
      ...runner,
      connections: updatedConnections,
      inferred: updatedInferred,
    };

    // Recalculate completeness, missing fields, and phase
    const dataCompleteness = calculateDataCompleteness(mergedRunner);
    const fieldsMissing = getMissingFields(mergedRunner);
    const currentPhase = determinePhase(mergedRunner);

    await ctx.db.patch(runner._id, {
      connections: updatedConnections,
      inferred: updatedInferred,
      conversationState: {
        ...runner.conversationState,
        dataCompleteness,
        fieldsMissing,
        currentPhase,
      },
    });

    return runner._id;
  },
});

/**
 * Get the current user's HealthKit connection status.
 * Returns null if not connected via HealthKit.
 */
export const getConnection = query({
  args: {},
  returns: v.union(
    v.object({
      connected: v.boolean(),
      wearableType: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) return null;
    if (!runner.connections.wearableConnected) return null;
    if (runner.connections.wearableType !== "apple_watch") return null;

    return {
      connected: true,
      wearableType: "apple_watch",
    };
  },
});
