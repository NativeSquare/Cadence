import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

// =============================================================================
// Runner Object Schema
// =============================================================================
// Matches UX V6 Runner Object Model specification

// Identity Section
const identitySchema = v.object({
  name: v.string(),
  nameConfirmed: v.boolean(),
});

// Physical Profile
const physicalSchema = v.optional(
  v.object({
    age: v.optional(v.number()),
    weight: v.optional(v.number()),
    height: v.optional(v.number()),
  })
);

// Running Profile
const runningSchema = v.optional(
  v.object({
    experienceLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("returning"),
        v.literal("casual"),
        v.literal("serious")
      )
    ),
    monthsRunning: v.optional(v.number()),
    currentFrequency: v.optional(v.number()), // Days per week
    currentVolume: v.optional(v.number()), // Weekly km
    easyPace: v.optional(v.string()), // Format: "5:40/km"
    longestRecentRun: v.optional(v.number()),
    trainingConsistency: v.optional(
      v.union(v.literal("high"), v.literal("moderate"), v.literal("low"))
    ),
  })
);

// Goals
const goalsSchema = v.optional(
  v.object({
    goalType: v.optional(
      v.union(
        v.literal("race"),
        v.literal("speed"),
        v.literal("base_building"),
        v.literal("return_to_fitness"),
        v.literal("general_health")
      )
    ),
    raceDistance: v.optional(v.number()),
    raceDate: v.optional(v.number()), // Unix timestamp
    targetTime: v.optional(v.number()), // Duration in seconds
    targetPace: v.optional(v.string()),
    targetVolume: v.optional(v.number()),
  })
);

// Schedule & Life
const scheduleSchema = v.optional(
  v.object({
    availableDays: v.optional(v.number()),
    blockedDays: v.optional(v.array(v.string())), // ["monday", "wednesday"]
    preferredTime: v.optional(
      v.union(
        v.literal("morning"),
        v.literal("midday"),
        v.literal("evening"),
        v.literal("varies")
      )
    ),
    calendarConnected: v.optional(v.boolean()),
  })
);

// Health & Risk
const healthSchema = v.optional(
  v.object({
    pastInjuries: v.optional(v.array(v.string())), // ["shin_splints", "itbs", "plantar"]
    currentPain: v.optional(v.array(v.string())),
    recoveryStyle: v.optional(
      v.union(
        v.literal("quick"),
        v.literal("slow"),
        v.literal("push_through"),
        v.literal("no_injuries")
      )
    ),
    sleepQuality: v.optional(
      v.union(v.literal("solid"), v.literal("inconsistent"), v.literal("poor"))
    ),
    stressLevel: v.optional(
      v.union(
        v.literal("low"),
        v.literal("moderate"),
        v.literal("high"),
        v.literal("survival")
      )
    ),
  })
);

// Coaching Preferences
const coachingSchema = v.optional(
  v.object({
    coachingVoice: v.optional(
      v.union(
        v.literal("tough_love"),
        v.literal("encouraging"),
        v.literal("analytical"),
        v.literal("minimalist")
      )
    ),
    dataOrientation: v.optional(
      v.union(
        v.literal("data_driven"),
        v.literal("curious"),
        v.literal("feel_based")
      )
    ),
    biggestChallenge: v.optional(v.string()),
    skipTriggers: v.optional(v.array(v.string())),
  })
);

// Data Connections
const connectionsSchema = v.object({
  stravaConnected: v.boolean(),
  wearableConnected: v.boolean(),
  wearableType: v.optional(
    v.union(
      v.literal("garmin"),
      v.literal("coros"),
      v.literal("apple_watch"),
      v.literal("polar"),
      v.literal("none")
    )
  ),
  calendarConnected: v.boolean(),
});

// Inferred Data (from wearable analysis)
const inferredSchema = v.optional(
  v.object({
    avgWeeklyVolume: v.optional(v.number()),
    volumeConsistency: v.optional(v.number()), // % variance
    easyPaceActual: v.optional(v.string()),
    longRunPattern: v.optional(v.string()),
    restDayFrequency: v.optional(v.number()),
    trainingLoadTrend: v.optional(
      v.union(
        v.literal("building"),
        v.literal("maintaining"),
        v.literal("declining"),
        v.literal("erratic")
      )
    ),
    estimatedFitness: v.optional(v.number()),
    injuryRiskFactors: v.optional(v.array(v.string())),
  })
);

// =============================================================================
// Current State (Story 5.2)
// =============================================================================
// Calculated by Inference Engine from historical data tables.
// NEVER directly written by user input tools - only by inference engine.
// Read by Plan Generator for decision-making.

const currentStateSchema = v.optional(
  v.object({
    // Training load metrics (PMC - Performance Management Chart)
    acuteTrainingLoad: v.optional(v.number()), // ATL - 7 day exponentially weighted
    chronicTrainingLoad: v.optional(v.number()), // CTL - 42 day exponentially weighted
    trainingStressBalance: v.optional(v.number()), // TSB = CTL - ATL (form/freshness)
    trainingLoadTrend: v.optional(
      v.union(
        v.literal("building"), // ATL > CTL, fitness building
        v.literal("maintaining"), // ATL ≈ CTL
        v.literal("declining"), // ATL < CTL, detraining
        v.literal("erratic") // High variance
      )
    ),

    // Freshness/readiness assessment
    readinessScore: v.optional(v.number()), // 0-100 composite score
    readinessFactors: v.optional(v.array(v.string())), // ["good_sleep", "low_hrv", "high_tsb"]

    // Recent training patterns (rolling windows)
    last7DaysVolume: v.optional(v.number()), // km
    last7DaysRunCount: v.optional(v.number()),
    last7DaysTrainingLoad: v.optional(v.number()),
    last28DaysVolume: v.optional(v.number()), // km
    last28DaysRunCount: v.optional(v.number()),
    last28DaysAvgVolume: v.optional(v.number()), // Weekly average over 4 weeks

    // Risk assessment
    injuryRiskLevel: v.optional(
      v.union(
        v.literal("low"),
        v.literal("moderate"),
        v.literal("elevated"),
        v.literal("high")
      )
    ),
    injuryRiskFactors: v.optional(v.array(v.string())), // ["volume_spike", "low_recovery", "injury_history"]
    overtrainingRisk: v.optional(
      v.union(
        v.literal("none"),
        v.literal("watch"),
        v.literal("caution"),
        v.literal("high")
      )
    ),

    // Volume progression safety
    volumeChangePercent: v.optional(v.number()), // % change week over week
    volumeWithinSafeRange: v.optional(v.boolean()),

    // Latest biometrics (pulled from dailySummaries/sleepSessions)
    latestRestingHr: v.optional(v.number()),
    latestHrv: v.optional(v.number()),
    latestWeight: v.optional(v.number()), // kg
    latestSleepScore: v.optional(v.number()), // 0-100
    latestReadinessScore: v.optional(v.number()), // 0-100 from wearable

    // Fitness estimates
    estimatedVdot: v.optional(v.number()), // VDOT score
    estimatedMaxHr: v.optional(v.number()),
    estimatedRestingHr: v.optional(v.number()),

    // HR zones (calculated from max HR or lactate threshold)
    hrZones: v.optional(
      v.object({
        zone1: v.optional(v.object({ min: v.number(), max: v.number() })),
        zone2: v.optional(v.object({ min: v.number(), max: v.number() })),
        zone3: v.optional(v.object({ min: v.number(), max: v.number() })),
        zone4: v.optional(v.object({ min: v.number(), max: v.number() })),
        zone5: v.optional(v.object({ min: v.number(), max: v.number() })),
      })
    ),

    // Pace zones (calculated from VDOT or recent performances)
    paceZones: v.optional(
      v.object({
        easy: v.optional(v.string()), // "5:30-6:00/km"
        marathon: v.optional(v.string()),
        threshold: v.optional(v.string()),
        interval: v.optional(v.string()),
        repetition: v.optional(v.string()),
      })
    ),

    // Metadata
    lastCalculatedAt: v.optional(v.number()), // When inference engine last ran
    dataQuality: v.optional(
      v.union(
        v.literal("high"), // 4+ weeks data, consistent
        v.literal("medium"), // 2-4 weeks or gaps
        v.literal("low"), // <2 weeks or sparse
        v.literal("insufficient") // Not enough to calculate
      )
    ),
  })
);

// Legal Consent (Story 1.3, 1.4)
const legalSchema = v.optional(
  v.object({
    termsAcceptedAt: v.optional(v.number()),
    privacyAcceptedAt: v.optional(v.number()),
    healthConsentAt: v.optional(v.number()),
    consentVersion: v.optional(v.string()),
  })
);

// Conversation State (meta-tracking)
const conversationStateSchema = v.object({
  dataCompleteness: v.number(), // 0-100 percentage
  readyForPlan: v.boolean(),
  currentPhase: v.union(
    v.literal("intro"),
    v.literal("data_bridge"),
    v.literal("profile"),
    v.literal("goals"),
    v.literal("schedule"),
    v.literal("health"),
    v.literal("coaching"),
    v.literal("analysis")
  ),
  fieldsToConfirm: v.array(v.string()),
  fieldsMissing: v.array(v.string()),
});

// =============================================================================
// Data Completeness Calculator (Story 1.6)
// =============================================================================

/**
 * Required fields for data completeness calculation.
 * Based on UX V6 Runner Object Model specification.
 */
const REQUIRED_FIELDS: string[] = [
  // Identity (5%)
  "identity.nameConfirmed",

  // Running Profile (20%)
  "running.experienceLevel",
  "running.currentFrequency",
  "running.currentVolume",

  // Goals (20%) - base fields
  "goals.goalType",

  // Schedule (15%)
  "schedule.availableDays",
  "schedule.blockedDays",

  // Health (20%)
  "health.pastInjuries",
  "health.recoveryStyle",
  "health.sleepQuality",
  "health.stressLevel",

  // Coaching (20%)
  "coaching.coachingVoice",
  "coaching.biggestChallenge",
];

/**
 * Conditionally required fields based on goal type.
 */
const CONDITIONAL_FIELDS: Record<string, string[]> = {
  race: ["goals.raceDistance", "goals.raceDate"],
};

type RunnerDocument = {
  identity?: { name?: string; nameConfirmed?: boolean };
  running?: {
    experienceLevel?: string;
    currentFrequency?: number;
    currentVolume?: number;
  };
  goals?: {
    goalType?: string;
    raceDistance?: number;
    raceDate?: number;
  };
  schedule?: {
    availableDays?: number;
    blockedDays?: string[];
  };
  health?: {
    pastInjuries?: string[];
    recoveryStyle?: string;
    sleepQuality?: string;
    stressLevel?: string;
  };
  coaching?: {
    coachingVoice?: string;
    biggestChallenge?: string;
  };
};

/**
 * Get a nested field value from a runner document using dot notation.
 */
function getFieldValue(
  runner: RunnerDocument,
  fieldPath: string
): unknown {
  const parts = fieldPath.split(".");
  let value: unknown = runner;

  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[part];
  }

  return value;
}

/**
 * Check if a field has a valid value (not undefined, not null, not empty).
 */
function isFieldFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Calculate data completeness percentage for a runner.
 * Returns a value from 0-100 rounded to nearest integer.
 */
export function calculateDataCompleteness(runner: RunnerDocument): number {
  const goalType = runner.goals?.goalType;

  // Build list of required fields based on goal type
  const requiredFields = [...REQUIRED_FIELDS];
  if (goalType === "race") {
    requiredFields.push(...CONDITIONAL_FIELDS.race);
  }

  // Count filled fields
  const filledCount = requiredFields.filter((field) => {
    const value = getFieldValue(runner, field);
    return isFieldFilled(value);
  }).length;

  // Calculate percentage
  const completeness = Math.round((filledCount / requiredFields.length) * 100);
  return completeness;
}

/**
 * Get list of missing required fields for a runner.
 */
export function getMissingFields(runner: RunnerDocument): string[] {
  const goalType = runner.goals?.goalType;

  // Build list of required fields based on goal type
  const requiredFields = [...REQUIRED_FIELDS];
  if (goalType === "race") {
    requiredFields.push(...CONDITIONAL_FIELDS.race);
  }

  // Find missing fields
  return requiredFields.filter((field) => {
    const value = getFieldValue(runner, field);
    return !isFieldFilled(value);
  });
}

/**
 * Determine current phase based on filled fields.
 */
export function determinePhase(
  runner: RunnerDocument
): "intro" | "data_bridge" | "profile" | "goals" | "schedule" | "health" | "coaching" | "analysis" {
  // Check identity
  if (!runner.identity?.nameConfirmed) {
    return "intro";
  }

  // Check running profile
  const runningFields = ["running.experienceLevel", "running.currentFrequency", "running.currentVolume"];
  const runningComplete = runningFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!runningComplete) {
    return "profile";
  }

  // Check goals
  const goalType = runner.goals?.goalType;
  if (!goalType) {
    return "goals";
  }
  if (goalType === "race") {
    if (!runner.goals?.raceDistance || !runner.goals?.raceDate) {
      return "goals";
    }
  }

  // Check schedule
  const scheduleFields = ["schedule.availableDays", "schedule.blockedDays"];
  const scheduleComplete = scheduleFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!scheduleComplete) {
    return "schedule";
  }

  // Check health
  const healthFields = ["health.pastInjuries", "health.recoveryStyle", "health.sleepQuality", "health.stressLevel"];
  const healthComplete = healthFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!healthComplete) {
    return "health";
  }

  // Check coaching
  const coachingFields = ["coaching.coachingVoice", "coaching.biggestChallenge"];
  const coachingComplete = coachingFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!coachingComplete) {
    return "coaching";
  }

  // All complete
  return "analysis";
}

// =============================================================================
// Full Document Schema
// =============================================================================

const documentSchema = {
  userId: v.id("users"),
  identity: identitySchema,
  physical: physicalSchema,
  running: runningSchema,
  goals: goalsSchema,
  schedule: scheduleSchema,
  health: healthSchema,
  coaching: coachingSchema,
  connections: connectionsSchema,
  inferred: inferredSchema,
  currentState: currentStateSchema,
  legal: legalSchema,
  conversationState: conversationStateSchema,
};

// Partial schema for updates
const partialSchema = {
  userId: v.optional(v.id("users")),
  identity: v.optional(identitySchema),
  physical: physicalSchema,
  running: runningSchema,
  goals: goalsSchema,
  schedule: scheduleSchema,
  health: healthSchema,
  coaching: coachingSchema,
  connections: v.optional(connectionsSchema),
  inferred: inferredSchema,
  currentState: currentStateSchema,
  legal: legalSchema,
  conversationState: v.optional(conversationStateSchema),
};

// =============================================================================
// Table Definition
// =============================================================================

export const runners = defineTable(documentSchema).index("by_userId", [
  "userId",
]);

// =============================================================================
// Custom CRUD Operations with Auth
// =============================================================================

/**
 * Create a new Runner Object for the authenticated user.
 * Only creates if no runner exists for the user.
 */
export const createRunner = mutation({
  args: {
    identity: v.optional(identitySchema),
    connections: v.optional(connectionsSchema),
    conversationState: v.optional(conversationStateSchema),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    // Check if runner already exists
    const existing = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create with defaults
    const runnerId = await ctx.db.insert("runners", {
      userId,
      identity: args.identity ?? {
        name: "",
        nameConfirmed: false,
      },
      connections: args.connections ?? {
        stravaConnected: false,
        wearableConnected: false,
        calendarConnected: false,
      },
      conversationState: args.conversationState ?? {
        dataCompleteness: 0,
        readyForPlan: false,
        currentPhase: "intro",
        fieldsToConfirm: [],
        fieldsMissing: [],
      },
    });

    return runnerId;
  },
});

/**
 * Update specific fields on a Runner Object.
 * Automatically recalculates data_completeness, fields_missing, and current_phase.
 */
export const updateRunner = mutation({
  args: {
    runnerId: v.id("runners"),
    fields: v.object(partialSchema),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const runner = await ctx.db.get(args.runnerId);
    if (!runner) {
      throw new ConvexError({ code: "RUNNER_NOT_FOUND", message: "Runner not found" });
    }

    // Verify ownership
    if (runner.userId !== userId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authorized to update this runner" });
    }

    // Merge existing runner data with new fields
    const mergedRunner = {
      ...runner,
      ...args.fields,
      identity: args.fields.identity ?? runner.identity,
      running: { ...runner.running, ...args.fields.running },
      goals: { ...runner.goals, ...args.fields.goals },
      schedule: { ...runner.schedule, ...args.fields.schedule },
      health: { ...runner.health, ...args.fields.health },
      coaching: { ...runner.coaching, ...args.fields.coaching },
    };

    // Recalculate completeness, missing fields, and phase
    const dataCompleteness = calculateDataCompleteness(mergedRunner);
    const fieldsMissing = getMissingFields(mergedRunner);
    const currentPhase = determinePhase(mergedRunner);
    const readyForPlan = dataCompleteness === 100;

    // Build the update with recalculated conversation state
    const update = {
      ...args.fields,
      conversationState: {
        ...runner.conversationState,
        ...args.fields.conversationState,
        dataCompleteness,
        fieldsMissing,
        currentPhase,
        readyForPlan,
      },
    };

    await ctx.db.patch(args.runnerId, update);
    return args.runnerId;
  },
});

/**
 * Get a Runner Object by its ID.
 */
export const getRunner = query({
  args: {
    runnerId: v.id("runners"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.runnerId);
  },
});

/**
 * Get a Runner Object by userId.
 */
export const getRunnerByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Get the Runner Object for the currently authenticated user.
 * Convenience query that combines auth + lookup.
 */
export const getCurrentRunner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Confirm or update user name (Story 1.5)
 * Automatically recalculates data completeness after name confirmation.
 * Creates a runner if one doesn't exist yet.
 *
 * Source of truth: runners.identity.name
 * No sync to users table - read from runner, fallback to user if runner doesn't exist.
 */
export const confirmName = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    // Get user to fetch current name if not provided
    const user = await ctx.db.get(userId);
    const nameToUse = args.name ?? user?.name ?? "";

    let runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Create runner if it doesn't exist
    if (!runner) {
      const newIdentity = {
        name: nameToUse,
        nameConfirmed: true,
      };

      const dataCompleteness = calculateDataCompleteness({ identity: newIdentity });
      const fieldsMissing = getMissingFields({ identity: newIdentity });
      const currentPhase = determinePhase({ identity: newIdentity });

      const runnerId = await ctx.db.insert("runners", {
        userId,
        identity: newIdentity,
        connections: {
          stravaConnected: false,
          wearableConnected: false,
          calendarConnected: false,
        },
        conversationState: {
          dataCompleteness,
          readyForPlan: false,
          currentPhase,
          fieldsToConfirm: [],
          fieldsMissing,
        },
      });

      return runnerId;
    }

    // Build merged runner with confirmed name
    const finalName = args.name ?? runner.identity.name;
    const mergedRunner = {
      ...runner,
      identity: {
        name: finalName,
        nameConfirmed: true,
      },
    };

    // Recalculate completeness and phase
    const dataCompleteness = calculateDataCompleteness(mergedRunner);
    const fieldsMissing = getMissingFields(mergedRunner);
    const currentPhase = determinePhase(mergedRunner);

    await ctx.db.patch(runner._id, {
      identity: mergedRunner.identity,
      conversationState: {
        ...runner.conversationState,
        dataCompleteness,
        fieldsMissing,
        currentPhase,
      },
    });

    return runner._id;
  },
});

/**
 * Skip wearable connection (Story 2.7)
 * Sets connection fields to indicate user skipped wearable setup.
 * Automatically transitions phase to "profile" via determinePhase.
 */
export const skipWearableConnection = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) {
      throw new ConvexError({ code: "RUNNER_NOT_FOUND", message: "Runner not found" });
    }

    // Update connections to reflect skip
    const updatedConnections = {
      stravaConnected: false,
      wearableConnected: false,
      wearableType: "none" as const,
      calendarConnected: runner.connections.calendarConnected,
    };

    // Build merged runner for phase calculation
    const mergedRunner = {
      ...runner,
      connections: updatedConnections,
    };

    // Recalculate completeness and phase
    const dataCompleteness = calculateDataCompleteness(mergedRunner);
    const fieldsMissing = getMissingFields(mergedRunner);
    const currentPhase = determinePhase(mergedRunner);

    await ctx.db.patch(runner._id, {
      connections: updatedConnections,
      conversationState: {
        ...runner.conversationState,
        dataCompleteness,
        fieldsMissing,
        currentPhase,
      },
    });

    return runner._id;
  },
});
