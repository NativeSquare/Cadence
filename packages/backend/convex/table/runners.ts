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

    await ctx.db.patch(args.runnerId, args.fields);
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
