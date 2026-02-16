import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Training Plans Schema (Story 6.1)
// =============================================================================
// Multi-level zoom structure: Season (Macro) → Weekly (Meso) → Daily (Micro)
// Designed to feed UI components: RadarChart, ProgressionChart, Decision Audit

// Plan status values
export const planStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("abandoned")
);

// =============================================================================
// ZOOM LEVEL 1: Season / Macro View (AC #1)
// =============================================================================

const keyMilestoneSchema = v.object({
  weekNumber: v.number(),
  milestone: v.string(),
  significance: v.string(),
});

const identifiedRiskSchema = v.object({
  risk: v.string(),
  mitigation: v.string(),
  monitoringSignals: v.array(v.string()),
});

const expectedOutcomesSchema = v.object({
  primaryGoal: v.string(),
  confidenceLevel: v.number(), // 0-100
  confidenceReason: v.string(),
  secondaryOutcomes: v.array(v.string()),
});

const seasonViewSchema = v.object({
  coachSummary: v.string(), // 2-3 sentence overview
  periodizationJustification: v.string(), // why this approach
  volumeStrategyJustification: v.string(), // why these numbers
  keyMilestones: v.array(keyMilestoneSchema),
  identifiedRisks: v.array(identifiedRiskSchema),
  expectedOutcomes: expectedOutcomesSchema,
});

// =============================================================================
// ZOOM LEVEL 2: Weekly / Meso View (AC #2)
// =============================================================================

const weeklyPlanItemSchema = v.object({
  weekNumber: v.number(),
  weekStartDate: v.number(), // Unix timestamp ms
  weekEndDate: v.number(), // Unix timestamp ms
  phaseName: v.string(), // "Base", "Build", "Peak", "Taper"
  phaseWeekNumber: v.number(),
  volumeKm: v.number(), // For ProgressionChart
  intensityScore: v.number(), // 0-100 scale, for ProgressionChart
  isRecoveryWeek: v.boolean(),
  weekLabel: v.optional(v.string()), // "Recovery", "Race"
  keySessions: v.number(),
  easyRuns: v.number(),
  restDays: v.number(),
  weekFocus: v.string(),
  weekJustification: v.string(),
  coachNotes: v.optional(v.string()),
  volumeChangePercent: v.optional(v.number()),
  warningSignals: v.optional(v.array(v.string())),
});

// =============================================================================
// RUNNER SNAPSHOT (AC #3)
// =============================================================================
// Captured at plan creation for RadarChart display

const profileRadarItemSchema = v.object({
  label: v.string(), // "Endurance" | "Speed" | "Recovery" | "Consistency" | "Injury Risk" | "Race Ready"
  value: v.number(), // 0-100
  uncertain: v.boolean(),
});

const fitnessIndicatorsSchema = v.object({
  estimatedVdot: v.optional(v.number()),
  recentVolume: v.optional(v.number()), // km
  consistencyScore: v.optional(v.number()), // 0-100
});

const runnerSnapshotSchema = v.object({
  capturedAt: v.number(), // Unix timestamp ms
  profileRadar: v.array(profileRadarItemSchema),
  fitnessIndicators: fitnessIndicatorsSchema,
  planInfluencers: v.array(v.string()), // Factors that shaped the plan
});

// =============================================================================
// PLAN GENERATION METADATA (optional, for audit trail)
// =============================================================================

const phaseSchema = v.object({
  name: v.string(),
  startWeek: v.number(),
  endWeek: v.number(),
  focus: v.string(),
});

const loadParametersSchema = v.object({
  startingVolume: v.optional(v.number()),
  peakVolume: v.optional(v.number()),
  weeklyIncrease: v.optional(v.number()), // percentage
  estimatedVdot: v.optional(v.number()),
});

const targetPacesSchema = v.object({
  easy: v.optional(v.string()), // "5:40/km"
  marathon: v.optional(v.string()),
  threshold: v.optional(v.string()),
  interval: v.optional(v.string()),
  repetition: v.optional(v.string()),
});

const decisionSchema = v.object({
  category: v.string(),
  decision: v.string(),
  reasoning: v.string(),
  alternatives: v.optional(v.array(v.string())),
  knowledgeBaseRefs: v.optional(v.array(v.string())),
});

const safeguardApplicationSchema = v.object({
  safeguardId: v.string(),
  applied: v.boolean(),
  originalValue: v.optional(v.number()),
  adjustedValue: v.optional(v.number()),
  reason: v.optional(v.string()),
});

// =============================================================================
// Table Definition
// =============================================================================

export const trainingPlans = defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // PLAN METADATA
  name: v.string(), // "Half Marathon - 12 Week Plan"
  goalType: v.string(),
  targetEvent: v.optional(v.string()), // "Boston Marathon"
  targetDate: v.optional(v.number()), // Unix timestamp ms
  targetTime: v.optional(v.number()), // Seconds
  startDate: v.number(), // Unix timestamp ms
  endDate: v.number(), // Unix timestamp ms
  durationWeeks: v.number(),
  status: planStatus,

  // ZOOM LEVEL 1: SEASON / MACRO VIEW (AC #1)
  seasonView: seasonViewSchema,

  // ZOOM LEVEL 2: WEEKLY / MESO VIEW (AC #2)
  weeklyPlan: v.array(weeklyPlanItemSchema),

  // RUNNER SNAPSHOT AT PLAN CREATION (AC #3)
  runnerSnapshot: runnerSnapshotSchema,

  // Plan generation metadata (optional)
  templateId: v.optional(v.string()),
  periodizationModel: v.optional(v.string()),
  phases: v.optional(v.array(phaseSchema)),
  loadParameters: v.optional(loadParametersSchema),
  targetPaces: v.optional(targetPacesSchema),

  // Decision audit trail
  decisions: v.optional(v.array(decisionSchema)),
  safeguardApplications: v.optional(v.array(safeguardApplicationSchema)),

  // Timestamps
  generatedAt: v.number(),
  generatorVersion: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_runnerId", ["runnerId"])
  .index("by_userId", ["userId"])
  .index("by_status", ["userId", "status"]);

// =============================================================================
// Exported Types for Frontend Consumption (Task 3)
// =============================================================================

export type TrainingPlan = typeof trainingPlans.validator.type;
export type SeasonView = typeof seasonViewSchema.type;
export type WeeklyPlanItem = typeof weeklyPlanItemSchema.type;
export type RunnerSnapshot = typeof runnerSnapshotSchema.type;
export type ProfileRadarItem = typeof profileRadarItemSchema.type;
export type KeyMilestone = typeof keyMilestoneSchema.type;
export type IdentifiedRisk = typeof identifiedRiskSchema.type;
export type ExpectedOutcomes = typeof expectedOutcomesSchema.type;
export type Decision = typeof decisionSchema.type;
export type SafeguardApplication = typeof safeguardApplicationSchema.type;
export type PlanStatus = typeof planStatus.type;
