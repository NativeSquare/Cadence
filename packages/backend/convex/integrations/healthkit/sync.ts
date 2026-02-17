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
import {
  calculateDataCompleteness,
  getMissingFields,
  determinePhase,
} from "../../table/runners";

const soma = new Soma(components.soma);

// ─── Validators for Soma-transformed HealthKit data ─────────────────────────
// These validators ensure data integrity at the API boundary while allowing
// Soma to perform deeper validation during ingestion.

const activityValidator = v.object({
  external_id: v.string(),
  activity_type: v.string(),
  start_time: v.string(),
  end_time: v.string(),
  duration_seconds: v.optional(v.number()),
  distance_meters: v.optional(v.number()),
  calories_burned: v.optional(v.number()),
  average_heart_rate: v.optional(v.number()),
  max_heart_rate: v.optional(v.number()),
  average_pace_seconds_per_km: v.optional(v.number()),
  elevation_gain_meters: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const sleepValidator = v.object({
  external_id: v.string(),
  start_time: v.string(),
  end_time: v.string(),
  duration_seconds: v.optional(v.number()),
  sleep_stages: v.optional(v.any()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const bodyValidator = v.object({
  external_id: v.string(),
  recorded_at: v.string(),
  weight_kg: v.optional(v.number()),
  height_cm: v.optional(v.number()),
  body_fat_percentage: v.optional(v.number()),
  resting_heart_rate: v.optional(v.number()),
  hrv_ms: v.optional(v.number()),
  vo2_max: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const dailyValidator = v.object({
  external_id: v.string(),
  date: v.string(),
  steps: v.optional(v.number()),
  active_calories: v.optional(v.number()),
  total_calories: v.optional(v.number()),
  distance_meters: v.optional(v.number()),
  floors_climbed: v.optional(v.number()),
  active_minutes: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const nutritionValidator = v.object({
  external_id: v.string(),
  date: v.string(),
  calories: v.optional(v.number()),
  protein_g: v.optional(v.number()),
  carbs_g: v.optional(v.number()),
  fat_g: v.optional(v.number()),
  water_ml: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const menstruationValidator = v.object({
  external_id: v.string(),
  date: v.string(),
  flow_level: v.optional(v.string()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const athleteValidator = v.object({
  biological_sex: v.optional(v.string()),
  date_of_birth: v.optional(v.string()),
  blood_type: v.optional(v.string()),
  skin_type: v.optional(v.number()),
  wheelchair_use: v.optional(v.boolean()),
});

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
 * Accepts pre-transformed data from the native app. Each data type array
 * contains objects already shaped by Soma's HealthKit transformers
 * (e.g., transformWorkout, transformSleep, etc.).
 *
 * Returns per-type sync statistics for UI feedback.
 */
export const syncHealthKitData = mutation({
  args: {
    activities: v.array(activityValidator),
    sleep: v.array(sleepValidator),
    body: v.array(bodyValidator),
    daily: v.array(dailyValidator),
    nutrition: v.array(nutritionValidator),
    menstruation: v.array(menstruationValidator),
    athlete: v.optional(athleteValidator),
    // Aggregates computed on-device, stored in runner.inferred for conversation state
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
            // Log first failure per batch for debugging without overwhelming logs
            if (failed === 1) {
              console.warn(
                `[HealthKit Sync] ${typeName} ingestion failure:`,
                result.reason instanceof Error
                  ? result.reason.message
                  : result.reason,
              );
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
        (activity) =>
          soma.ingestActivity(ctx, {
            connectionId,
            userId,
            ...(activity as Record<string, unknown>),
          }),
        "activity",
      ),
      batchIngest(
        args.sleep,
        (session) =>
          soma.ingestSleep(ctx, {
            connectionId,
            userId,
            ...(session as Record<string, unknown>),
          }),
        "sleep",
      ),
      batchIngest(
        args.body,
        (bodyRecord) =>
          soma.ingestBody(ctx, {
            connectionId,
            userId,
            ...(bodyRecord as Record<string, unknown>),
          }),
        "body",
      ),
      batchIngest(
        args.daily,
        (dailyRecord) =>
          soma.ingestDaily(ctx, {
            connectionId,
            userId,
            ...(dailyRecord as Record<string, unknown>),
          }),
        "daily",
      ),
      batchIngest(
        args.nutrition,
        (nutritionRecord) =>
          soma.ingestNutrition(ctx, {
            connectionId,
            userId,
            ...(nutritionRecord as Record<string, unknown>),
          }),
        "nutrition",
      ),
      batchIngest(
        args.menstruation,
        (menstruationRecord) =>
          soma.ingestMenstruation(ctx, {
            connectionId,
            userId,
            ...(menstruationRecord as Record<string, unknown>),
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
          ...(args.athlete as Record<string, unknown>),
        });
        stats.athlete = true;
      } catch (error) {
        console.warn(
          "[HealthKit Sync] Failed to ingest athlete:",
          error instanceof Error ? error.message : error,
        );
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
