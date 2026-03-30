import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { connectionValidator } from "./validators/connection.js";
import { athleteValidator } from "./validators/athlete.js";
import { activityValidator } from "./validators/activity.js";
import { bodyValidator } from "./validators/body.js";
import { dailyValidator } from "./validators/daily.js";
import { sleepValidator } from "./validators/sleep.js";
import { menstruationValidator } from "./validators/menstruation.js";
import { nutritionValidator } from "./validators/nutrition.js";
import { plannedWorkoutValidator } from "./validators/plannedWorkout.js";

// ─── Soma Schema ─────────────────────────────────────────────────────────────
// Provider-agnostic normalized health data store.
// Uses Terra's data model as the schema standard, but has no opinion about
// where data comes from. The host app handles authentication and data fetching.
//
// Deduplication strategy:
//   - Activity & Sleep: uniquely identified by connectionId + metadata.summary_id
//   - Body, Daily, Nutrition: uniquely identified by connectionId + start_time + end_time
//   - On duplicate, update the existing document with new data.
//
// All fields are nullable (v.optional) unless explicitly marked otherwise.

export default defineSchema({
  // ── Connections ────────────────────────────────────────────────────────────
  // Represents a link between a host app user and a wearable provider.
  // One document per user-provider pair.
  connections: defineTable(connectionValidator)
    .index("by_userId", ["userId"])
    .index("by_provider", ["provider"])
    .index("by_userId_provider", ["userId", "provider"])
    .index("by_providerUserId_provider", ["providerUserId", "provider"]),

  // ── Athletes ───────────────────────────────────────────────────────────────
  // User profile/identifying information from the provider.
  athletes: defineTable(athleteValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"]),

  // ── Activities ─────────────────────────────────────────────────────────────
  // Workouts and activities.
  // Dedup key: connectionId + metadata.summary_id
  activities: defineTable(activityValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "metadata.start_time"])
    .index("by_connectionId_summaryId", [
      "connectionId",
      "metadata.summary_id",
    ]),

  // ── Body ───────────────────────────────────────────────────────────────────
  // Body metrics: heart, blood pressure, glucose, temperature, etc.
  // Dedup key: connectionId + metadata.start_time + metadata.end_time
  body: defineTable(bodyValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "metadata.start_time"])
    .index("by_connectionId_timeRange", [
      "connectionId",
      "metadata.start_time",
      "metadata.end_time",
    ]),

  // ── Daily ──────────────────────────────────────────────────────────────────
  // Daily activity summaries.
  // Dedup key: connectionId + metadata.start_time + metadata.end_time
  daily: defineTable(dailyValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "metadata.start_time"])
    .index("by_connectionId_timeRange", [
      "connectionId",
      "metadata.start_time",
      "metadata.end_time",
    ]),

  // ── Sleep ──────────────────────────────────────────────────────────────────
  // Sleep session data.
  // Dedup key: connectionId + metadata.summary_id
  sleep: defineTable(sleepValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "metadata.start_time"])
    .index("by_connectionId_summaryId", [
      "connectionId",
      "metadata.summary_id",
    ]),

  // ── Menstruation ───────────────────────────────────────────────────────────
  // Menstruation and fertility data.
  menstruation: defineTable(menstruationValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "metadata.start_time"]),

  // ── Nutrition ──────────────────────────────────────────────────────────────
  // Food, drink, macro/micronutrient data.
  // Dedup key: connectionId + metadata.start_time + metadata.end_time
  nutrition: defineTable(nutritionValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "metadata.start_time"])
    .index("by_connectionId_timeRange", [
      "connectionId",
      "metadata.start_time",
      "metadata.end_time",
    ]),

  // ── Planned Workouts ───────────────────────────────────────────────────────
  // Scheduled/planned workouts from the provider.
  plannedWorkouts: defineTable(plannedWorkoutValidator)
    .index("by_connectionId", ["connectionId"])
    .index("by_userId", ["userId"])
    .index("by_userId_plannedDate", ["userId", "metadata.planned_date"]),

  // ── Provider Tokens ────────────────────────────────────────────────────────
  // OAuth 2.0 tokens for cloud-based providers (Strava, Garmin, etc.).
  // Stored separately from connections to keep the connection table
  // provider-agnostic. One token record per connection.
  providerTokens: defineTable({
    connectionId: v.id("connections"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  }).index("by_connectionId", ["connectionId"]),

  // ── Pending OAuth ─────────────────────────────────────────────────────────
  // Temporary storage for in-progress OAuth 2.0 PKCE flows. Bridges the gap
  // between initiating OAuth (auth URL) and the callback (code exchange).
  // The `state` parameter links the callback back to the pending entry.
  pendingOAuth: defineTable({
    provider: v.string(),
    state: v.string(),
    codeVerifier: v.string(),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_state", ["state"]),
});
