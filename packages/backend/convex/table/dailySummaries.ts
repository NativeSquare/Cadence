import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Daily Summaries Table Schema
// =============================================================================
// Terra-aligned daily summary data model for aggregated health metrics.
// One record per day per runner, aggregated from all sources.
// Supports: Strava, HealthKit, Garmin, COROS, Terra API
//
// Reference: architecture-backend-v2.md#New-Table-Daily-Summaries

export const dailySummaries = defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Date (one record per day)
  date: v.string(), // "2026-02-16" format (ISO date)

  // Activity Totals (aggregated from activities table)
  totalDistanceMeters: v.optional(v.number()),
  totalDurationSeconds: v.optional(v.number()),
  totalSteps: v.optional(v.number()),
  totalCalories: v.optional(v.number()),
  totalActiveCalories: v.optional(v.number()), // Calories from activities only
  activityCount: v.optional(v.number()), // Number of activities
  runningDistanceMeters: v.optional(v.number()), // Running-only distance

  // Training Load (aggregated)
  totalTrainingLoad: v.optional(v.number()), // Sum of all activity loads
  acuteTrainingLoad: v.optional(v.number()), // ATL - 7 day weighted
  chronicTrainingLoad: v.optional(v.number()), // CTL - 42 day weighted
  trainingStressBalance: v.optional(v.number()), // TSB = CTL - ATL

  // Heart Rate Summary (from wearable)
  restingHeartRate: v.optional(v.number()),
  avgHeartRate: v.optional(v.number()), // Average across day
  maxHeartRate: v.optional(v.number()), // Max across all activities
  minHeartRate: v.optional(v.number()), // Lowest recorded

  // HRV (typically from morning measurement or sleep)
  hrvMs: v.optional(v.number()),
  hrvRmssd: v.optional(v.number()),
  hrvSdnn: v.optional(v.number()),

  // Sleep summary (pulled from sleepSessions)
  sleepDurationMinutes: v.optional(v.number()),
  sleepScore: v.optional(v.number()), // 0-100
  sleepQuality: v.optional(
    v.union(
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("poor")
    )
  ),
  deepSleepMinutes: v.optional(v.number()),
  remSleepMinutes: v.optional(v.number()),

  // Readiness/Recovery (device-specific aggregation)
  readinessScore: v.optional(v.number()), // 0-100
  recoveryScore: v.optional(v.number()), // 0-100
  strainScore: v.optional(v.number()), // 0-21 (Whoop style)
  stressLevel: v.optional(v.number()), // 0-100 or Garmin stress

  // Body metrics (if measured this day)
  weight: v.optional(v.number()), // kg
  bodyFatPercent: v.optional(v.number()),
  hydrationLevel: v.optional(v.number()), // Percent or ml

  // Blood metrics
  bloodOxygenAvg: v.optional(v.number()), // SpO2 percent
  bloodOxygenMin: v.optional(v.number()),
  respirationRate: v.optional(v.number()), // Breaths per minute

  // Menstrual tracking (if applicable)
  menstrualPhase: v.optional(
    v.union(
      v.literal("menstruation"),
      v.literal("follicular"),
      v.literal("ovulation"),
      v.literal("luteal")
    )
  ),
  cycleDay: v.optional(v.number()),

  // Weather/Environment (for context)
  weatherHigh: v.optional(v.number()), // Celsius
  weatherLow: v.optional(v.number()),
  weatherConditions: v.optional(v.string()),

  // User input
  moodRating: v.optional(v.number()), // 1-5
  energyRating: v.optional(v.number()), // 1-5
  sorenessRating: v.optional(v.number()), // 1-5 (5 = very sore)
  notes: v.optional(v.string()),
  painReported: v.optional(v.array(v.string())), // ["knee", "shin"]

  // Source tracking (which providers contributed)
  sources: v.optional(v.array(v.string())), // ["strava", "healthkit", "manual"] - optional for records with unknown source
  primarySource: v.optional(v.string()), // Main data source for conflicts

  // Metadata
  lastUpdatedAt: v.number(),
  calculatedAt: v.optional(v.number()), // When we last computed aggregates
})
  .index("by_runnerId_date", ["runnerId", "date"])
  .index("by_userId", ["userId"])
  .index("by_date", ["date"])
  .index("by_runnerId", ["runnerId"]);
