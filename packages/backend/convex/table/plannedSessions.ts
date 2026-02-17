import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Planned Sessions Schema (Story 6.2)
// =============================================================================
// Individual sessions within a training plan - the "Daily / Micro" zoom level
// Designed to feed CalendarWidget with full coach reasoning

// Session status values
export const sessionStatus = v.union(
  v.literal("scheduled"),
  v.literal("completed"),
  v.literal("skipped"),
  v.literal("modified"),
  v.literal("rescheduled")
);

// =============================================================================
// STRUCTURE SEGMENTS (for detailed workout breakdown)
// =============================================================================

const structureSegmentSchema = v.object({
  segmentType: v.string(), // "warmup" | "main" | "cooldown" | "recovery" | "work"
  durationSeconds: v.optional(v.number()),
  distanceMeters: v.optional(v.number()),
  targetPace: v.optional(v.string()),
  targetHeartRate: v.optional(v.number()),
  targetEffort: v.optional(v.number()), // 1-10
  repetitions: v.optional(v.number()), // For intervals: 6 x 800m
  recoverySeconds: v.optional(v.number()), // Recovery between reps
  notes: v.optional(v.string()),
});

// =============================================================================
// ALTERNATIVES (backup session options)
// =============================================================================

const alternativeSchema = v.object({
  sessionType: v.string(),
  description: v.string(),
  whenToUse: v.string(), // "If legs are heavy" | "If short on time"
});

// =============================================================================
// Table Definition
// =============================================================================

export const plannedSessions = defineTable({
  // Foreign keys
  planId: v.id("trainingPlans"),
  runnerId: v.id("runners"),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════════════════════════════════════════
  weekNumber: v.number(), // Week 1, 2, 3...
  dayOfWeek: v.string(), // "monday", "tuesday", etc.
  dayOfWeekShort: v.string(), // "Mon", "Tue", etc. (for UI)
  scheduledDate: v.number(), // Unix timestamp ms

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION TYPE & CLASSIFICATION (AC #1: sessionTypeDisplay)
  // ═══════════════════════════════════════════════════════════════════════════
  sessionType: v.string(), // "tempo" | "easy" | "intervals" | "long_run" | "rest" | "recovery" | "race"
  sessionTypeDisplay: v.string(), // "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest" (for UI)
  sessionSubtype: v.optional(v.string()), // "progression" | "fartlek" | "hills" | "track"
  isKeySession: v.boolean(), // true for quality sessions
  isRestDay: v.boolean(), // true for rest days

  // ═══════════════════════════════════════════════════════════════════════════
  // DURATION & EFFORT (AC #1: targetDurationDisplay, effortDisplay)
  // ═══════════════════════════════════════════════════════════════════════════
  targetDurationSeconds: v.optional(v.number()), // Stored as seconds for calculations
  targetDurationDisplay: v.string(), // "50 min" | "90 min" | "-" (for UI)
  targetDistanceMeters: v.optional(v.number()), // Alternative to duration
  effortLevel: v.optional(v.number()), // 0-10 numeric
  effortDisplay: v.string(), // "7/10" | "3/10" | "0/10" (for UI)

  // ═══════════════════════════════════════════════════════════════════════════
  // PACE TARGETS (AC #1: targetPaceDisplay)
  // ═══════════════════════════════════════════════════════════════════════════
  targetPaceMin: v.optional(v.string()), // "4:55/km" - faster end of range
  targetPaceMax: v.optional(v.string()), // "5:05/km" - slower end of range
  targetPaceDisplay: v.optional(v.string()), // "4:55-5:05/km" (for UI)
  targetHeartRateZone: v.optional(v.number()), // 1-5
  targetHeartRateMin: v.optional(v.number()), // BPM
  targetHeartRateMax: v.optional(v.number()), // BPM

  // ═══════════════════════════════════════════════════════════════════════════
  // DESCRIPTION (for UI)
  // ═══════════════════════════════════════════════════════════════════════════
  description: v.string(), // Full description of what this session is

  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURE (AC #1: structureDisplay)
  // ═══════════════════════════════════════════════════════════════════════════
  structureDisplay: v.optional(v.string()), // "10 min warm-up -> 30 min tempo -> 10 min cool-down"
  structureSegments: v.optional(v.array(structureSegmentSchema)), // Detailed breakdown

  // ═══════════════════════════════════════════════════════════════════════════
  // JUSTIFICATION - THE "WHY" (AC #2) - CRITICAL FOR TRUST
  // ═══════════════════════════════════════════════════════════════════════════
  justification: v.string(), // WHY this session is placed here
  physiologicalTarget: v.string(), // "aerobic_base" | "lactate_threshold" | "vo2max" | "economy" | "recovery"
  placementRationale: v.optional(v.string()), // Why THIS day specifically
  keyPoints: v.optional(v.array(v.string())), // What to focus on during the session
  relatedKnowledgeIds: v.optional(v.array(v.string())), // Which KB entries informed this
  relatedSafeguardIds: v.optional(v.array(v.string())), // Which safeguards were checked

  // ═══════════════════════════════════════════════════════════════════════════
  // FLEXIBILITY & ALTERNATIVES (AC #3)
  // ═══════════════════════════════════════════════════════════════════════════
  isMoveable: v.boolean(), // Can be rescheduled within the week
  canBeSplit: v.optional(v.boolean()), // Can be split into two sessions
  alternatives: v.optional(v.array(alternativeSchema)),

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTION TRACKING (AC #4)
  // ═══════════════════════════════════════════════════════════════════════════
  status: sessionStatus,
  completedActivityId: v.optional(v.string()), // Soma activity ID (string, not Convex ID)
  completedAt: v.optional(v.number()),
  adherenceScore: v.optional(v.number()), // 0-1 how well did execution match plan

  // If modified or skipped
  skipReason: v.optional(v.string()),
  modificationNotes: v.optional(v.string()),
  actualDurationSeconds: v.optional(v.number()),
  actualDistanceMeters: v.optional(v.number()),
  userFeedback: v.optional(v.string()), // How did it feel?
  userRating: v.optional(v.number()), // 1-5 satisfaction

  // ═══════════════════════════════════════════════════════════════════════════
  // UI STYLING
  // ═══════════════════════════════════════════════════════════════════════════
  colorTheme: v.optional(v.string()), // "lime" | "gray" - for UI styling
})
  .index("by_planId", ["planId"])
  .index("by_runnerId", ["runnerId"])
  .index("by_date", ["runnerId", "scheduledDate"])
  .index("by_week", ["planId", "weekNumber"])
  .index("by_status", ["runnerId", "status"]);

// =============================================================================
// Exported Types for Frontend Consumption
// =============================================================================

export type PlannedSession = typeof plannedSessions.validator.type;
export type StructureSegment = typeof structureSegmentSchema.type;
export type SessionAlternative = typeof alternativeSchema.type;
export type SessionStatus = typeof sessionStatus.type;
