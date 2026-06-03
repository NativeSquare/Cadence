import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Decision log of the weekly plan review.
 *
 * Once a week the Engine reconciles the week that just closed (auto-missing
 * past-due planned sessions), grades adherence + load, and reshapes ONLY the
 * upcoming week (scale the kept sessions, drop filler on a deload). Unlike
 * `coachInterventions`, a review touches several workouts at once and is not
 * revertible — the athlete is told what changed via the coach chat, after the
 * fact.
 *
 * One row per review run. The signals + the applied reshape + the eventual
 * outcome (did the athlete then complete the easier week?) are the labelled
 * dataset future tuning will draw from.
 */
const signals = v.object({
  keyTotal: v.number(),
  keyMissed: v.number(),
  completionRatio: v.number(),
  baseTier: v.number(),
  streakEscalated: v.boolean(),
});

const documentSchema = {
  userId: v.id("users"),
  ranAt: v.number(),
  // Monday (noon-UTC ISO) of the week this review reshapes — the upcoming week.
  // Used for idempotency (one review per week) and streak lookups.
  upcomingWeekStart: v.string(),
  // Versioned rule identifier — `weekly_review_v1` for this slice.
  ruleId: v.string(),
  tier: v.number(), // 0 = on track, 1 = slip, 2 = deload
  signals,
  // The reshape that was applied to the upcoming week.
  scaleFactor: v.number(),
  scaledWorkoutIds: v.array(v.string()),
  droppedWorkoutIds: v.array(v.string()),
  // Past-due `planned` sessions of the closed week flipped to `missed`.
  autoMissedWorkoutIds: v.array(v.string()),
  // True when the review actually wrote to the plan (drives whether the coach
  // narrates). A Tier 0 week, or a tiered week with nothing left to reshape,
  // is recorded but silent.
  changed: v.boolean(),
  // Filled by the narration action after Haiku returns; absent until then.
  notificationBody: v.optional(v.string()),
  // Future: filled by a post-week job comparing the reshaped week's adherence.
  outcomeMetrics: v.optional(v.any()),
};

export const weeklyReviews = defineTable(documentSchema).index(
  "by_userId_upcomingWeekStart",
  ["userId", "upcomingWeekStart"],
);
