// =============================================================================
// Mock Activities Seed Mutations (Story 4.2)
// =============================================================================
// Provides seed and cleanup mutations for mock activity data.
// Used for development and testing without real wearable devices.
//
// IMPORTANT: All mock data uses source="mock" and can be cleaned up.
// Real data (source="healthkit", "strava") is never affected.

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import {
  generateTrainingBlock,
  TrainingProfile,
} from "../lib/mock-data-generator";

// ─── Seed Mutation ───────────────────────────────────────────────────────────

/**
 * Seed mock activities for the current user's runner profile.
 *
 * AC #1, #2: Generates realistic activities matching the Soma activities schema.
 * AC #4: Supports different training profiles (beginner, intermediate, advanced).
 * AC #6: Does NOT replace real HealthKit integration - this is for dev/testing only.
 */
export const seedMockActivities = mutation({
  args: {
    profile: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    weeks: v.optional(v.number()), // Default 12 weeks
  },
  returns: v.object({
    inserted: v.number(),
    profile: v.string(),
    weeks: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Get runner for this user
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) {
      throw new ConvexError({
        code: "RUNNER_NOT_FOUND",
        message: "Runner profile not found. Complete onboarding first.",
      });
    }

    const profile: TrainingProfile = args.profile;
    const weeks = args.weeks ?? 12;

    // Generate training block
    const activities = generateTrainingBlock(
      runner._id,
      userId,
      profile,
      weeks
    );

    // Batch insert (chunks of 50 for performance)
    const BATCH_SIZE = 50;
    let inserted = 0;

    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE);

      for (const activity of batch) {
        await ctx.db.insert("activities", activity);
        inserted++;
      }
    }

    return {
      inserted,
      profile,
      weeks,
      message: `Generated ${inserted} mock activities for ${weeks} weeks of ${profile} training`,
    };
  },
});

// ─── Cleanup Mutation ────────────────────────────────────────────────────────

/**
 * Clear all mock activities for the current user.
 *
 * AC #5: Deletes only activities with source="mock".
 * Real data (source="healthkit", "strava", etc.) is preserved.
 */
export const clearMockActivities = mutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Get runner for this user
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) {
      throw new ConvexError({
        code: "RUNNER_NOT_FOUND",
        message: "Runner profile not found.",
      });
    }

    // Query all mock activities for this runner
    const mockActivities = await ctx.db
      .query("activities")
      .withIndex("by_source", (q) =>
        q.eq("runnerId", runner._id).eq("source", "mock")
      )
      .collect();

    // Delete all mock activities
    for (const activity of mockActivities) {
      await ctx.db.delete(activity._id);
    }

    return {
      deleted: mockActivities.length,
      message: `Deleted ${mockActivities.length} mock activities. Real data preserved.`,
    };
  },
});

// ─── Query Functions ─────────────────────────────────────────────────────────

/**
 * Get count of mock vs real activities for the current user.
 * Useful for debugging and verifying seed/cleanup operations.
 */
export const getMockActivityStats = query({
  args: {},
  returns: v.union(
    v.object({
      mock: v.number(),
      healthkit: v.number(),
      strava: v.number(),
      other: v.number(),
      total: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) return null;

    const allActivities = await ctx.db
      .query("activities")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .collect();

    const stats = {
      mock: 0,
      healthkit: 0,
      strava: 0,
      other: 0,
      total: allActivities.length,
    };

    for (const activity of allActivities) {
      switch (activity.source) {
        case "mock":
          stats.mock++;
          break;
        case "healthkit":
          stats.healthkit++;
          break;
        case "strava":
          stats.strava++;
          break;
        default:
          stats.other++;
      }
    }

    return stats;
  },
});
