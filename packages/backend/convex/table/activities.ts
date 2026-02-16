import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Activities Table Schema
// =============================================================================
// Terra-aligned activity data model for storing wearable workout data.
// Supports: Strava, HealthKit, Garmin, COROS, manual entry, Terra API
//
// Reference: architecture-backend-v2.md#New-Table-Activities

export const activities = defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Terra-aligned metadata
  externalId: v.optional(v.string()), // summary_id equivalent from provider
  source: v.string(), // "strava" | "healthkit" | "garmin" | "coros" | "manual" | "terra"

  // Core fields (Terra Activity model aligned)
  startTime: v.number(), // Unix timestamp ms
  endTime: v.number(), // Unix timestamp ms
  timezone: v.optional(v.string()), // IANA timezone string
  activityType: v.string(), // "running" | "cycling" | "swimming" | "walking" | etc.
  name: v.optional(v.string()), // "Morning Run", "Easy 5K"

  // Distance & Movement
  distanceMeters: v.optional(v.number()),
  durationSeconds: v.optional(v.number()), // Moving time
  elevationGainMeters: v.optional(v.number()),
  elevationLossMeters: v.optional(v.number()),
  steps: v.optional(v.number()),

  // Pace & Speed
  avgPaceSecondsPerKm: v.optional(v.number()),
  maxPaceSecondsPerKm: v.optional(v.number()), // Fastest pace
  avgSpeedKmh: v.optional(v.number()),
  maxSpeedKmh: v.optional(v.number()),

  // Heart Rate
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  minHeartRate: v.optional(v.number()),
  restingHeartRate: v.optional(v.number()), // Pre-activity if available
  hrvMs: v.optional(v.number()), // HRV if captured

  // Heart Rate Zones (minutes spent in each zone)
  hrZone1Minutes: v.optional(v.number()), // Recovery
  hrZone2Minutes: v.optional(v.number()), // Aerobic
  hrZone3Minutes: v.optional(v.number()), // Tempo
  hrZone4Minutes: v.optional(v.number()), // Threshold
  hrZone5Minutes: v.optional(v.number()), // VO2max

  // Training Load
  calories: v.optional(v.number()),
  trainingLoad: v.optional(v.number()), // TSS, Strava suffer score, etc.
  perceivedExertion: v.optional(v.number()), // RPE 1-10 scale
  trainingEffect: v.optional(v.number()), // Garmin/Polar training effect
  recoveryTimeHours: v.optional(v.number()), // Suggested recovery

  // Power (running power or cycling)
  avgPower: v.optional(v.number()), // Watts
  maxPower: v.optional(v.number()),
  normalizedPower: v.optional(v.number()),

  // Running Dynamics
  avgCadence: v.optional(v.number()), // Steps per minute
  maxCadence: v.optional(v.number()),
  groundContactTimeMs: v.optional(v.number()),
  strideLength: v.optional(v.number()), // Meters
  verticalOscillation: v.optional(v.number()), // cm
  verticalRatio: v.optional(v.number()), // Percent

  // Cadence-specific fields (for plan tracking)
  sessionType: v.optional(
    v.union(
      v.literal("easy"),
      v.literal("tempo"),
      v.literal("intervals"),
      v.literal("long_run"),
      v.literal("recovery"),
      v.literal("race"),
      v.literal("cross_training"),
      v.literal("unstructured")
    )
  ),
  // NOTE: plannedSessions table is a forward reference - will be created in Epic 6 (Plan Generator)
  plannedSessionId: v.optional(v.id("plannedSessions")), // Link to training plan session
  planAdherence: v.optional(v.number()), // 0-100% how well session matched plan

  // User feedback (post-activity)
  userFeedback: v.optional(
    v.object({
      feelingRating: v.optional(v.number()), // 1-5
      notes: v.optional(v.string()),
      wasPlanned: v.optional(v.boolean()),
      painReported: v.optional(v.array(v.string())),
    })
  ),

  // Weather conditions (if available)
  weather: v.optional(
    v.object({
      temperatureCelsius: v.optional(v.number()),
      humidity: v.optional(v.number()), // Percent
      windSpeedKmh: v.optional(v.number()),
      conditions: v.optional(v.string()), // "sunny", "cloudy", "rain"
    })
  ),

  // Samples (store as JSON for MVP, separate table later)
  heartRateSamples: v.optional(v.string()), // JSON array: [{time: number, value: number}]
  paceSamples: v.optional(v.string()), // JSON array
  cadenceSamples: v.optional(v.string()), // JSON array
  powerSamples: v.optional(v.string()), // JSON array
  gpsSamples: v.optional(v.string()), // JSON array for route (lat/lng/alt)

  // Metadata
  rawPayload: v.optional(v.string()), // Original API response for debugging
  importedAt: v.number(), // When we first imported this activity
  lastSyncedAt: v.number(), // Last time we synced/updated from source
})
  .index("by_runnerId", ["runnerId"])
  .index("by_userId", ["userId"])
  .index("by_startTime", ["runnerId", "startTime"])
  .index("by_source", ["runnerId", "source"])
  .index("by_externalId", ["source", "externalId"])
  .index("by_activityType", ["runnerId", "activityType"])
  .index("by_plannedSession", ["plannedSessionId"]);
