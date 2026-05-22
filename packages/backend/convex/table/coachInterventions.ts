import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Decision log of proactive coach interventions.
 *
 * Each row is a single firing of a rule (e.g. `hrv_low_v1`) that auto-modified
 * a workout based on a deterministic readiness signal. The user is told what
 * happened via push notification, not asked for permission. They can revert
 * from the workout detail page.
 *
 * The combination of trigger inputs, applied modification, notification text,
 * and user reaction (revert? completed as modified?) is the labelled dataset
 * that future tuning / RL signal will draw from.
 */
// Signals are a flat optional bag — each rule populates the subset relevant to
// its decision. Readers branch on `ruleId` to know which fields to expect.
// Existing `hrv_low_v1` rows keep the HRV fields populated; adherence-driven
// rules populate the `weekMissedQualityCount` instead.
const signals = v.object({
  hrvToday: v.optional(v.number()),
  hrvBaseline14d: v.optional(v.number()),
  hrvZScore: v.optional(v.number()),
  sleepHoursLastNight: v.optional(v.number()),
  rhrToday: v.optional(v.number()),
  weekMissedQualityCount: v.optional(v.number()),
});

const documentSchema = {
  userId: v.id("users"),
  // Agoge workout id — opaque string from the component's id namespace.
  workoutId: v.string(),
  // Versioned rule identifier — `hrv_low_v1` for MVP.
  ruleId: v.string(),
  firedAt: v.number(),
  signals,
  // Snapshot of the workout fields we replaced, so revert restores them
  // verbatim without re-deriving them.
  originalType: v.string(),
  originalName: v.string(),
  originalPlanned: v.any(),
  // Convenience fields for diff rendering without parsing the snapshot.
  originalDistanceMeters: v.optional(v.number()),
  originalDurationSeconds: v.optional(v.number()),
  newType: v.string(),
  newName: v.string(),
  newDistanceMeters: v.optional(v.number()),
  newDurationSeconds: v.optional(v.number()),
  // Populated by the notification-generation action after Haiku returns.
  // Absent until then so the cron fan-out doesn't block on the LLM.
  notificationTitle: v.optional(v.string()),
  notificationBody: v.optional(v.string()),
  revertedAt: v.optional(v.number()),
  // Future: filled by a post-session job comparing the actual run against
  // the modified plan. Out of MVP scope.
  outcomeMetrics: v.optional(v.any()),
};

export const coachInterventions = defineTable(documentSchema)
  .index("by_userId_firedAt", ["userId", "firedAt"])
  .index("by_workoutId", ["workoutId"]);
