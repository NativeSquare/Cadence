/**
 * HealthKit Sync - Batch upsert activities from HealthKit
 *
 * This module handles syncing raw HealthKit workout data to the activities table.
 * It normalizes the data and performs upsert operations to prevent duplicates.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";
import { getAdapter, type RawHealthKitWorkout } from "../../lib/adapters";

// Validator for raw HealthKit workout data
const rawWorkoutValidator = v.object({
  uuid: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  durationSeconds: v.number(),
  distanceMeters: v.number(),
  activeEnergyBurnedKcal: v.optional(v.number()),
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  avgSpeedMps: v.optional(v.number()),
  avgPaceSecondsPerKm: v.optional(v.number()),
});

/**
 * Sync HealthKit activities to the database.
 *
 * Performs upsert by externalId to prevent duplicate activities.
 * Returns sync statistics for UI feedback.
 */
export const syncHealthKitActivities = mutation({
  args: {
    rawWorkouts: v.array(rawWorkoutValidator),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    failed: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Get the runner for this user
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

    // Get the HealthKit adapter
    const adapter = getAdapter("healthkit");

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    // Process activities - normalize and upsert by externalId
    for (const raw of args.rawWorkouts as RawHealthKitWorkout[]) {
      try {
        // Normalize using adapter
        const activity = adapter.normalizeActivity(raw, runner._id, userId);

        // Check if activity already exists by externalId
        const existing = await ctx.db
          .query("activities")
          .withIndex("by_externalId", (q) =>
            q.eq("source", "healthkit").eq("externalId", activity.externalId)
          )
          .first();

        if (existing) {
          // Update existing activity
          await ctx.db.patch(existing._id, {
            ...activity,
            lastSyncedAt: Date.now(),
          });
          updated++;
        } else {
          // Insert new activity
          await ctx.db.insert("activities", activity);
          inserted++;
        }
      } catch (error) {
        console.error(
          `[HealthKit Sync] Failed to process workout ${raw.uuid}:`,
          error instanceof Error ? error.message : error
        );
        failed++;
      }
    }

    // Update runner's wearable connection status
    await ctx.db.patch(runner._id, {
      connections: {
        ...runner.connections,
        wearableConnected: true,
        wearableType: "apple_watch",
      },
    });

    return {
      inserted,
      updated,
      failed,
      total: args.rawWorkouts.length,
    };
  },
});
