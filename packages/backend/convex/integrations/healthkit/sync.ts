/**
 * HealthKit Sync - Batch ingest health data via Soma component
 *
 * Receives pre-transformed data from the native app (app-owned HealthKit
 * transforms producing Soma unified schema shapes) and ingests all data
 * types into the Soma component tables.
 * Handles connection management and runner profile updates.
 */

import { Soma } from "@nativesquare/soma";
import {
  activityData,
  sleepData,
  bodyData,
  dailyData,
  nutritionData,
  menstruationData,
  athleteData,
} from "@nativesquare/soma/validators";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import {
  calculateDataCompleteness,
  getMissingFields,
  determinePhase,
} from "../../table/runners";

const soma = new Soma(components.soma);

// Aggregates computed on-device from HealthKit data, stored in runner.inferred
const aggregatesValidator = v.object({
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

/**
 * Sync all HealthKit health data to the Soma component.
 *
 * Accepts pre-transformed data from the native app in Soma's unified
 * (Terra-style) schema shapes, ready to be spread into soma.ingestX() calls.
 *
 * Returns per-type sync statistics for UI feedback.
 */
export const syncHealthKitData = mutation({
  args: {
    activities: v.array(
      v.object({ ...activityData, raw_payload: v.optional(v.any()) }),
    ),
    sleep: v.array(v.object(sleepData)),
    body: v.array(v.object(bodyData)),
    daily: v.array(v.object(dailyData)),
    nutrition: v.array(v.object(nutritionData)),
    menstruation: v.array(v.object(menstruationData)),
    athlete: v.optional(v.object(athleteData)),
    aggregates: v.optional(aggregatesValidator),
    totalRuns: v.optional(v.number()),
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

    // Helper to batch ingest with parallel processing
    // Processes records in batches to avoid timeout while maximizing throughput
    const BATCH_SIZE = 25;

    async function batchIngest<T>(
      records: T[],
      ingestFn: (record: T) => Promise<unknown>,
      typeName: string,
    ): Promise<{ ingested: number; failed: number }> {
      let ingested = 0;
      let failed = 0;

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(ingestFn));

        for (const result of results) {
          if (result.status === "fulfilled") {
            ingested++;
          } else {
            failed++;
            if (failed === 1) {
              console.warn(`[HealthKit Sync] ${typeName} ingestion failure:`, result.reason);
            }
          }
        }
      }

      return { ingested, failed };
    }

    // Ingest all data types using batched parallel processing
    const [
      activityStats,
      sleepStats,
      bodyStats,
      dailyStats,
      nutritionStats,
      menstruationStats,
    ] = await Promise.all([
      batchIngest(
        args.activities,
        (activity) => {
          const { raw_payload, ...somaFields } = activity;
          return soma.ingestActivity(ctx, {
            connectionId,
            userId,
            ...somaFields,
          });
        },
        "activity",
      ),
      batchIngest(
        args.sleep,
        (session) =>
          soma.ingestSleep(ctx, { connectionId, userId, ...session }),
        "sleep",
      ),
      batchIngest(
        args.body,
        (bodyRecord) =>
          soma.ingestBody(ctx, { connectionId, userId, ...bodyRecord }),
        "body",
      ),
      batchIngest(
        args.daily,
        (dailyRecord) =>
          soma.ingestDaily(ctx, { connectionId, userId, ...dailyRecord }),
        "daily",
      ),
      batchIngest(
        args.nutrition,
        (nutritionRecord) =>
          soma.ingestNutrition(ctx, {
            connectionId,
            userId,
            ...nutritionRecord,
          }),
        "nutrition",
      ),
      batchIngest(
        args.menstruation,
        (menstruationRecord) =>
          soma.ingestMenstruation(ctx, {
            connectionId,
            userId,
            ...menstruationRecord,
          }),
        "menstruation",
      ),
    ]);

    stats.activities = activityStats;
    stats.sleep = sleepStats;
    stats.body = bodyStats;
    stats.daily = dailyStats;
    stats.nutrition = nutritionStats;
    stats.menstruation = menstruationStats;

    // Ingest athlete profile (single record, no batching needed)
    if (args.athlete) {
      try {
        await soma.ingestAthlete(ctx, {
          connectionId,
          userId,
          ...args.athlete,
        });
        stats.athlete = true;
      } catch (error) {
        console.warn("[HealthKit Sync] Failed to ingest athlete:", error);
      }
    }

    // Build updated connections
    const updatedConnections = {
      ...runner.connections,
      wearableConnected: true,
      wearableType: "apple_watch" as const,
    };

    // Build updated inferred data from aggregates (if provided)
    const updatedInferred = args.aggregates
      ? {
        ...runner.inferred,
        avgWeeklyVolume: args.aggregates.avgWeeklyVolume,
        volumeConsistency: args.aggregates.volumeConsistency,
        easyPaceActual: args.aggregates.easyPaceActual,
        longRunPattern: args.aggregates.longRunPattern,
        restDayFrequency: args.aggregates.restDayFrequency,
        trainingLoadTrend: args.aggregates.trainingLoadTrend,
        estimatedFitness: args.aggregates.estimatedFitness,
      }
      : runner.inferred;

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

    // Update runner with connections, inferred data, and conversation state
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
