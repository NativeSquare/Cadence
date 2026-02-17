/**
 * HealthKit Sync - Batch ingest health data via Soma component
 *
 * Receives pre-transformed data from the native app (using Soma's HealthKit
 * transformers) and ingests all data types into the Soma component tables.
 * Handles connection management and runner profile updates.
 */

import { Soma } from "@nativesquare/soma";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components } from "../../_generated/api";
import { mutation } from "../../_generated/server";

const soma = new Soma(components.soma);

/**
 * Sync all HealthKit health data to the Soma component.
 *
 * Accepts pre-transformed data from the native app. Each data type array
 * contains objects already shaped by Soma's HealthKit transformers
 * (e.g., transformWorkout, transformSleep, etc.).
 *
 * Returns per-type sync statistics for UI feedback.
 */
export const syncHealthKitData = mutation({
  args: {
    activities: v.array(v.any()),
    sleep: v.array(v.any()),
    body: v.array(v.any()),
    daily: v.array(v.any()),
    nutrition: v.array(v.any()),
    menstruation: v.array(v.any()),
    athlete: v.optional(v.any()),
  },
  returns: v.object({
    activities: v.object({
      ingested: v.number(),
      failed: v.number(),
    }),
    sleep: v.object({
      ingested: v.number(),
      failed: v.number(),
    }),
    body: v.object({
      ingested: v.number(),
      failed: v.number(),
    }),
    daily: v.object({
      ingested: v.number(),
      failed: v.number(),
    }),
    nutrition: v.object({
      ingested: v.number(),
      failed: v.number(),
    }),
    menstruation: v.object({
      ingested: v.number(),
      failed: v.number(),
    }),
    athlete: v.boolean(),
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

    // Ensure runner exists
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

    // Ensure a Soma connection exists for this user + HEALTHKIT provider
    const connectionId = await soma.connect(ctx, {
      userId,
      provider: "HEALTHKIT",
    });

    const stats = {
      activities: { ingested: 0, failed: 0 },
      sleep: { ingested: 0, failed: 0 },
      body: { ingested: 0, failed: 0 },
      daily: { ingested: 0, failed: 0 },
      nutrition: { ingested: 0, failed: 0 },
      menstruation: { ingested: 0, failed: 0 },
      athlete: false,
      total: 0,
    };

    // Ingest activities
    for (const activity of args.activities) {
      try {
        await soma.ingestActivity(ctx, {
          connectionId,
          userId,
          ...(activity as Record<string, unknown>),
        });
        stats.activities.ingested++;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest activity:",
          error instanceof Error ? error.message : error,
        );
        stats.activities.failed++;
      }
    }

    // Ingest sleep sessions
    for (const session of args.sleep) {
      try {
        await soma.ingestSleep(ctx, {
          connectionId,
          userId,
          ...(session as Record<string, unknown>),
        });
        stats.sleep.ingested++;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest sleep:",
          error instanceof Error ? error.message : error,
        );
        stats.sleep.failed++;
      }
    }

    // Ingest body metrics
    for (const bodyRecord of args.body) {
      try {
        await soma.ingestBody(ctx, {
          connectionId,
          userId,
          ...(bodyRecord as Record<string, unknown>),
        });
        stats.body.ingested++;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest body:",
          error instanceof Error ? error.message : error,
        );
        stats.body.failed++;
      }
    }

    // Ingest daily summaries
    for (const dailyRecord of args.daily) {
      try {
        await soma.ingestDaily(ctx, {
          connectionId,
          userId,
          ...(dailyRecord as Record<string, unknown>),
        });
        stats.daily.ingested++;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest daily:",
          error instanceof Error ? error.message : error,
        );
        stats.daily.failed++;
      }
    }

    // Ingest nutrition records
    for (const nutritionRecord of args.nutrition) {
      try {
        await soma.ingestNutrition(ctx, {
          connectionId,
          userId,
          ...(nutritionRecord as Record<string, unknown>),
        });
        stats.nutrition.ingested++;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest nutrition:",
          error instanceof Error ? error.message : error,
        );
        stats.nutrition.failed++;
      }
    }

    // Ingest menstruation records
    for (const menstruationRecord of args.menstruation) {
      try {
        await soma.ingestMenstruation(ctx, {
          connectionId,
          userId,
          ...(menstruationRecord as Record<string, unknown>),
        });
        stats.menstruation.ingested++;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest menstruation:",
          error instanceof Error ? error.message : error,
        );
        stats.menstruation.failed++;
      }
    }

    // Ingest athlete profile
    if (args.athlete) {
      try {
        await soma.ingestAthlete(ctx, {
          connectionId,
          userId,
          ...(args.athlete as Record<string, unknown>),
        });
        stats.athlete = true;
      } catch (error) {
        console.error(
          "[HealthKit Sync] Failed to ingest athlete:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    // Update runner wearable connection status
    await ctx.db.patch(runner._id, {
      connections: {
        ...runner.connections,
        wearableConnected: true,
        wearableType: "apple_watch",
      },
    });

    stats.total =
      stats.activities.ingested +
      stats.sleep.ingested +
      stats.body.ingested +
      stats.daily.ingested +
      stats.nutrition.ingested +
      stats.menstruation.ingested +
      (stats.athlete ? 1 : 0);

    return stats;
  },
});
