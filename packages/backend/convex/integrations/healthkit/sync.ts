/**
 * HealthKit Sync - Batch ingest health data via Soma component
 *
 * Receives pre-transformed data from the native app (app-owned HealthKit
 * transforms producing Soma unified schema shapes) and ingests all data
 * types into the Soma component tables.
 * Handles connection management and runner profile updates.
 */

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
import { ConvexError, v, type PropertyValidators } from "convex/values";
import { components } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { soma } from "../../soma";

// Aggregates are accepted from the native app for compatibility but no longer
// persisted — derived metrics (ATL/CTL/volume trend) are computed on demand
// from the ingested Soma activity stream via plan/state.ts.
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
      v.object({
        ...activityData,
        raw_payload: v.optional(v.any()),
      } as PropertyValidators),
    ),
    sleep: v.array(v.object(sleepData as PropertyValidators)),
    body: v.array(v.object(bodyData as PropertyValidators)),
    daily: v.array(v.object(dailyData as PropertyValidators)),
    nutrition: v.array(v.object(nutritionData as PropertyValidators)),
    menstruation: v.array(v.object(menstruationData as PropertyValidators)),
    athlete: v.optional(v.object(athleteData as PropertyValidators)),
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

    // Ensure a Soma connection exists for this user + HEALTHKIT provider
    const connectionId = await ctx.runMutation(
      components.soma.public.connect,
      { userId, provider: "HEALTHKIT" },
    );

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
              console.warn(
                `[HealthKit Sync] ${typeName} ingestion failure:`,
                result.reason,
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

    // args.aggregates is accepted from the native app for backward compatibility
    // but no longer persisted. Derived metrics (ATL/CTL, volume trend, etc.)
    // are computed on demand via plan/state.ts from the ingested activity data.

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
