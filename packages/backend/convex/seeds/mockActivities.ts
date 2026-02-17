// =============================================================================
// Mock Activities Seed Mutations (Story 4.2, 4.6)
// =============================================================================
// Provides seed and cleanup mutations for mock activity data.
// Used for development and testing without real wearable devices.
//
// Story 4.6: Refactored to use Soma component for data storage.
// Mock data is stored via soma.ingestActivity() with provider="mock".

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import {
  generateTrainingBlock,
  type TrainingProfile,
  type MockActivity,
} from "../lib/mockDataGenerator";

// ─── Helper: Transform MockActivity to Soma/Terra Schema ─────────────────────

/**
 * Transform flat MockActivity to Soma/Terra ingestActivity format.
 * Maps the flat generator output to nested Terra schema.
 */
function toSomaActivity(
  mock: MockActivity,
  connectionId: string,
  userId: string
) {
  const startTime = new Date(mock.startTime).toISOString();
  const endTime = new Date(mock.endTime).toISOString();

  return {
    connectionId,
    userId,
    metadata: {
      summary_id: mock.externalId,
      start_time: startTime,
      end_time: endTime,
      type: 1, // Running (Terra activity type)
      name: mock.name,
      upload_type: 0, // Direct upload
    },
    distance_data: {
      summary: {
        distance_meters: mock.distanceMeters,
        steps: mock.steps,
        elevation: {
          gain_actual_meters: mock.elevationGainMeters,
        },
      },
    },
    heart_rate_data: {
      summary: {
        avg_hr_bpm: mock.avgHeartRate,
        max_hr_bpm: mock.maxHeartRate,
        min_hr_bpm: mock.minHeartRate,
      },
    },
    calories_data: {
      total_burned_calories: mock.calories,
    },
    movement_data: {
      avg_cadence_rpm: mock.avgCadence,
      avg_pace_minutes_per_kilometer: mock.avgPaceSecondsPerKm / 60,
      avg_speed_meters_per_second: (mock.avgSpeedKmh * 1000) / 3600,
    },
    TSS_data: {
      TSS_samples: [
        {
          actual: mock.trainingLoad,
          method: "mock",
        },
      ],
    },
  };
}

// ─── Seed Mutation ───────────────────────────────────────────────────────────

/**
 * Seed mock activities for the current user's runner profile.
 *
 * AC #1, #2: Generates realistic activities matching the Soma activities schema.
 * AC #4: Supports different training profiles (beginner, intermediate, advanced).
 * AC #6: Does NOT replace real HealthKit integration - this is for dev/testing only.
 *
 * Story 4.6: Uses Soma component's ingestActivity mutation.
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
    connectionId: v.string(),
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
    const userIdStr = userId as string;

    // Create or get mock connection for this user
    const existingConnection = await ctx.runQuery(
      components.soma.public.getConnectionByProvider,
      { userId: userIdStr, provider: "mock" }
    );

    let connectionId: string;
    if (!existingConnection) {
      // Create new mock connection
      connectionId = await ctx.runMutation(
        components.soma.public.connect,
        { userId: userIdStr, provider: "mock" }
      );
    } else {
      connectionId = existingConnection._id;
    }

    // Generate training block (flat format)
    const activities = generateTrainingBlock(
      runner._id,
      userId,
      profile,
      weeks
    );

    // Insert via Soma component (batch in chunks)
    const BATCH_SIZE = 50;
    let inserted = 0;

    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE);

      for (const activity of batch) {
        const somaData = toSomaActivity(activity, connectionId, userIdStr);
        await ctx.runMutation(
          components.soma.public.ingestActivity,
          somaData
        );
        inserted++;
      }
    }

    return {
      inserted,
      profile,
      weeks,
      connectionId,
      message: `Generated ${inserted} mock activities for ${weeks} weeks of ${profile} training via Soma`,
    };
  },
});

// ─── Cleanup Mutation ────────────────────────────────────────────────────────

/**
 * Clear mock connection for the current user.
 *
 * AC #5: Disconnects the mock provider, which removes access to mock data.
 * Note: Soma component handles data cleanup when connection is deleted.
 */
export const clearMockActivities = mutation({
  args: {},
  returns: v.object({
    deleted: v.boolean(),
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

    const userIdStr = userId as string;

    // Check if mock connection exists
    const connection = await ctx.runQuery(
      components.soma.public.getConnectionByProvider,
      { userId: userIdStr, provider: "mock" }
    );

    if (!connection) {
      return {
        deleted: false,
        message: "No mock data connection found.",
      };
    }

    // Disconnect mock provider (removes the connection)
    await ctx.runMutation(
      components.soma.public.disconnect,
      { userId: userIdStr, provider: "mock" }
    );

    return {
      deleted: true,
      message: "Mock data connection removed. Data will no longer be accessible.",
    };
  },
});

// ─── Query Functions ─────────────────────────────────────────────────────────

/**
 * Get count of activities by provider for the current user.
 * Useful for debugging and verifying seed/cleanup operations.
 */
export const getMockActivityStats = query({
  args: {},
  returns: v.union(
    v.object({
      connections: v.array(
        v.object({
          provider: v.string(),
          connectionId: v.string(),
          active: v.boolean(),
        })
      ),
      hasMockConnection: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userIdStr = userId as string;

    // List all connections for this user
    const connections = await ctx.runQuery(
      components.soma.public.listConnections,
      { userId: userIdStr }
    );

    const hasMockConnection = connections.some((c) => c.provider === "mock");

    return {
      connections: connections.map((c) => ({
        provider: c.provider,
        connectionId: c._id,
        active: c.active ?? true,
      })),
      hasMockConnection,
    };
  },
});
