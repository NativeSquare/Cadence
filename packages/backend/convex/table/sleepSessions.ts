import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Sleep Sessions Table Schema
// =============================================================================
// Terra-aligned sleep data model for storing wearable sleep data.
// Supports: HealthKit, Garmin, COROS, Oura, Whoop, Terra API
//
// Reference: architecture-backend-v2.md, data-model-comprehensive.md

export const sleepSessions = defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Terra-aligned metadata
  externalId: v.optional(v.string()), // Provider's unique ID
  source: v.string(), // "healthkit" | "garmin" | "oura" | "whoop" | "terra"

  // Time bounds
  startTime: v.number(), // Unix timestamp ms - when sleep started
  endTime: v.number(), // Unix timestamp ms - when sleep ended
  date: v.string(), // "2026-02-16" - the night this sleep is attributed to
  timezone: v.optional(v.string()), // IANA timezone

  // Duration stages (all in minutes)
  totalSleepMinutes: v.optional(v.number()), // Total sleep time
  totalInBedMinutes: v.optional(v.number()), // Time in bed (includes awake)
  sleepEfficiency: v.optional(v.number()), // Percent (sleep/in-bed)

  // Sleep stages
  deepSleepMinutes: v.optional(v.number()), // N3/Deep/SWS
  lightSleepMinutes: v.optional(v.number()), // N1+N2/Light
  remSleepMinutes: v.optional(v.number()), // REM stage
  awakeMinutes: v.optional(v.number()), // Time awake during night

  // Sleep timing
  sleepOnsetLatencyMinutes: v.optional(v.number()), // Time to fall asleep
  wakeAfterSleepOnsetMinutes: v.optional(v.number()), // WASO
  awakeningsCount: v.optional(v.number()), // Number of times woke up

  // Heart rate during sleep
  avgHeartRate: v.optional(v.number()),
  lowestHeartRate: v.optional(v.number()),
  restingHeartRate: v.optional(v.number()), // Device-calculated
  hrvMs: v.optional(v.number()), // Average HRV during sleep
  hrvRmssd: v.optional(v.number()), // RMSSD if available

  // Respiration
  avgBreathingRate: v.optional(v.number()), // Breaths per minute
  avgSpO2: v.optional(v.number()), // Blood oxygen percent
  minSpO2: v.optional(v.number()),

  // Recovery/Readiness scores (device-specific)
  sleepScore: v.optional(v.number()), // 0-100 overall sleep quality
  readinessScore: v.optional(v.number()), // 0-100 (Oura/Whoop style)
  recoveryScore: v.optional(v.number()), // 0-100 (Whoop style)

  // Sleep quality indicators
  sleepQuality: v.optional(
    v.union(
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("poor")
    )
  ),
  restfulnessScore: v.optional(v.number()), // Movement-based quality 0-100

  // Additional metrics
  bodyTemperatureDeviation: v.optional(v.number()), // Degrees from baseline
  skinTemperature: v.optional(v.number()), // Celsius

  // Sleep stage samples (JSON for MVP)
  stageSamples: v.optional(v.string()), // JSON: [{time, stage: "deep"|"light"|"rem"|"awake"}]
  heartRateSamples: v.optional(v.string()), // JSON: [{time, value}]
  hrvSamples: v.optional(v.string()), // JSON: [{time, value}]

  // User input
  userNotes: v.optional(v.string()), // User's notes about sleep
  userRating: v.optional(v.number()), // 1-5 subjective rating

  // Metadata
  rawPayload: v.optional(v.string()), // Original API response
  importedAt: v.number(),
  lastSyncedAt: v.number(),
})
  .index("by_runnerId", ["runnerId"])
  .index("by_userId", ["userId"])
  .index("by_date", ["runnerId", "date"])
  .index("by_startTime", ["runnerId", "startTime"])
  .index("by_source", ["runnerId", "source"])
  .index("by_externalId", ["source", "externalId"]);
