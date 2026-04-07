import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

// =============================================================================
// Types (matching UI component props) - Exported for frontend consumption
// =============================================================================

export interface RadarChartData {
  data: {
    label: string;
    value: number;
    uncertain: boolean;
  }[];
}

export interface ProgressionData {
  weeks: {
    week: number;
    volume: number;
    intensity: number;
    recovery?: boolean;
    label?: string;
  }[];
  currentWeek?: number;
}

export interface SessionCardData {
  type: string;
  dur: string;
  effort: string;
  key: boolean;
  rest: boolean; // isRestDay - AC3 requirement
  pace?: string;
  desc?: string;
  structure?: string;
  why?: string;
  day: string;
  scheduledDate: number;
  status: string;
}

export interface WeekSessionsData {
  weekNumber: number;
  sessions: SessionCardData[];
}

export interface DecisionAuditData {
  decisions: {
    category: string;
    decision: string;
    reasoning: string;
    alternatives?: string[];
  }[];
  safeguardApplications: {
    safeguardId: string;
    applied: boolean;
    reason?: string;
  }[];
}

export interface ExpectedOutcomesData {
  primaryGoal: string;
  confidenceLevel: number;
  confidenceReason: string;
  secondaryOutcomes: string[];
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get radar chart data for a plan
 * Returns only the profileRadar array needed by RadarChart component
 * AC #1: RadarChart Query
 */
export const getRadarChartData = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(
    v.null(),
    v.object({
      data: v.array(
        v.object({
          label: v.string(),
          value: v.number(),
          uncertain: v.boolean(),
        })
      ),
    })
  ),
  handler: async (ctx, args): Promise<RadarChartData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    return {
      data: plan.runnerSnapshot.profileRadar,
    };
  },
});

/**
 * Get progression chart data for a plan
 * Returns weeklyPlan mapped to ProgressionChart format
 * AC #2: ProgressionChart Query
 */
export const getProgressionChartData = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(
    v.null(),
    v.object({
      weeks: v.array(
        v.object({
          week: v.number(),
          volume: v.number(),
          intensity: v.number(),
          recovery: v.optional(v.boolean()),
          label: v.optional(v.string()),
        })
      ),
      currentWeek: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args): Promise<ProgressionData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    // Calculate current week based on plan start date
    const now = Date.now();
    const planStart = plan.startDate;
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.floor((now - planStart) / msPerWeek) + 1;

    return {
      weeks: plan.weeklyPlan.map((w) => ({
        week: w.weekNumber,
        volume: w.volumeKm,
        intensity: w.intensityScore,
        recovery: w.isRecoveryWeek || undefined,
        label: w.weekLabel || undefined,
      })),
      currentWeek:
        currentWeek > 0 && currentWeek <= plan.durationWeeks
          ? currentWeek
          : undefined,
    };
  },
});

/**
 * Get sessions for a specific week
 * Returns display fields only, optimized for CalendarWidget
 * AC #3: CalendarWidget Query
 */
export const getWeekSessions = query({
  args: {
    planId: v.id("trainingPlans"),
    weekNumber: v.number(),
  },
  returns: v.object({
    weekNumber: v.number(),
    sessions: v.array(
      v.object({
        type: v.string(),
        dur: v.string(),
        effort: v.string(),
        key: v.boolean(),
        rest: v.boolean(),
        pace: v.optional(v.string()),
        desc: v.optional(v.string()),
        structure: v.optional(v.string()),
        why: v.optional(v.string()),
        day: v.string(),
        scheduledDate: v.number(),
        status: v.string(),
      })
    ),
  }),
  handler: async (ctx, args): Promise<WeekSessionsData> => {
    // Use by_week index for efficient lookup
    const sessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .collect();

    // Return empty sessions array instead of null for empty weeks (M2 fix)
    return {
      weekNumber: args.weekNumber,
      sessions: sessions.map((s) => ({
        type: s.sessionTypeDisplay,
        dur: s.targetDurationDisplay,
        effort: s.effortDisplay,
        key: s.isKeySession,
        rest: s.isRestDay, // H2 fix: AC3 requires isRestDay
        pace: s.targetPaceDisplay || undefined,
        desc: s.description.length > 100 ? s.description.slice(0, 97) + "..." : s.description, // L1 fix: ellipsis
        structure: s.structureDisplay || undefined,
        why: s.justification,
        day: s.dayOfWeekShort,
        scheduledDate: s.scheduledDate,
        status: s.status,
      })),
    };
  },
});

/**
 * Get sessions for multiple weeks (calendar view)
 * Supports pagination for multi-week views
 * AC #3: CalendarWidget multi-week support
 * M1 fix: Single query with filter instead of N+1 loop
 */
export const getMultiWeekSessions = query({
  args: {
    planId: v.id("trainingPlans"),
    startWeek: v.number(),
    endWeek: v.number(),
  },
  returns: v.array(
    v.object({
      weekNumber: v.number(),
      sessions: v.array(
        v.object({
          type: v.string(),
          dur: v.string(),
          effort: v.string(),
          key: v.boolean(),
          rest: v.boolean(),
          pace: v.optional(v.string()),
          desc: v.optional(v.string()),
          structure: v.optional(v.string()),
          why: v.optional(v.string()),
          day: v.string(),
          scheduledDate: v.number(),
          status: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args): Promise<WeekSessionsData[]> => {
    // M1 fix: Fetch all sessions for plan in ONE query, then filter/group in memory
    const allSessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();

    // Filter to requested week range and group by week
    const sessionsByWeek = new Map<number, typeof allSessions>();
    for (const session of allSessions) {
      if (session.weekNumber >= args.startWeek && session.weekNumber <= args.endWeek) {
        const weekSessions = sessionsByWeek.get(session.weekNumber) || [];
        weekSessions.push(session);
        sessionsByWeek.set(session.weekNumber, weekSessions);
      }
    }

    // Build result array with all weeks in range (including empty ones)
    const weeks: WeekSessionsData[] = [];
    for (let week = args.startWeek; week <= args.endWeek; week++) {
      const sessions = sessionsByWeek.get(week) || [];
      weeks.push({
        weekNumber: week,
        sessions: sessions.map((s) => ({
          type: s.sessionTypeDisplay,
          dur: s.targetDurationDisplay,
          effort: s.effortDisplay,
          key: s.isKeySession,
          rest: s.isRestDay,
          pace: s.targetPaceDisplay || undefined,
          desc: s.description.length > 100 ? s.description.slice(0, 97) + "..." : s.description,
          structure: s.structureDisplay || undefined,
          why: s.justification,
          day: s.dayOfWeekShort,
          scheduledDate: s.scheduledDate,
          status: s.status,
        })),
      });
    }

    return weeks;
  },
});

/**
 * Get decision audit data for plan transparency
 * AC #4: DecisionAudit Query
 */
export const getDecisionAudit = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(
    v.null(),
    v.object({
      decisions: v.array(
        v.object({
          category: v.string(),
          decision: v.string(),
          reasoning: v.string(),
          alternatives: v.optional(v.array(v.string())),
        })
      ),
      safeguardApplications: v.array(
        v.object({
          safeguardId: v.string(),
          applied: v.boolean(),
          reason: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args): Promise<DecisionAuditData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    return {
      decisions: (plan.decisions ?? []).map((d) => ({
        category: d.category,
        decision: d.decision,
        reasoning: d.reasoning,
        alternatives: d.alternatives,
      })),
      safeguardApplications: (plan.safeguardApplications ?? []).map((s) => ({
        safeguardId: s.safeguardId,
        applied: s.applied,
        reason: s.reason,
      })),
    };
  },
});

/**
 * Get expected outcomes for verdict display
 * AC #5: Verdict Query
 */
export const getExpectedOutcomes = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(
    v.null(),
    v.object({
      primaryGoal: v.string(),
      confidenceLevel: v.number(),
      confidenceReason: v.string(),
      secondaryOutcomes: v.array(v.string()),
    })
  ),
  handler: async (ctx, args): Promise<ExpectedOutcomesData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    return plan.seasonView.expectedOutcomes;
  },
});

/**
 * Get active plan ID for a runner
 * Returns the most recent active plan, or falls back to most recently created plan
 */
export const getActivePlanForRunner = query({
  args: { runnerId: v.id("runners") },
  returns: v.union(v.null(), v.id("trainingPlans")),
  handler: async (ctx, args) => {
    // First try to find an active plan using the by_runnerId index
    const activePlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", args.runnerId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (activePlan) return activePlan._id;

    // M3 fix: Explicit documentation - "desc" orders by _creationTime (Convex default)
    // This returns the most recently CREATED plan as fallback when no active plan exists
    const anyPlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", args.runnerId))
      .order("desc") // Orders by _creationTime descending
      .first();

    return anyPlan?._id ?? null;
  },
});

/**
 * Composite query: Get all data needed for plan overview screen
 * Combines multiple queries in one round-trip
 * AC #6: Query Optimization - minimal round trips
 */
export const getPlanOverview = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(
    v.null(),
    v.object({
      // Plan metadata
      name: v.string(),
      goalType: v.string(),
      targetDate: v.optional(v.number()),
      status: v.string(),
      durationWeeks: v.number(),

      // RadarChart data
      radarChart: v.object({
        data: v.array(
          v.object({
            label: v.string(),
            value: v.number(),
            uncertain: v.boolean(),
          })
        ),
      }),

      // ProgressionChart data
      progressionChart: v.object({
        weeks: v.array(
          v.object({
            week: v.number(),
            volume: v.number(),
            intensity: v.number(),
            recovery: v.optional(v.boolean()),
            label: v.optional(v.string()),
          })
        ),
        currentWeek: v.optional(v.number()),
      }),

      // Verdict data
      expectedOutcomes: v.object({
        primaryGoal: v.string(),
        confidenceLevel: v.number(),
        confidenceReason: v.string(),
        secondaryOutcomes: v.array(v.string()),
      }),

      // Coach summary
      coachSummary: v.string(),

      // Current week sessions
      currentWeekSessions: v.array(
        v.object({
          type: v.string(),
          dur: v.string(),
          effort: v.string(),
          key: v.boolean(),
          rest: v.boolean(),
          day: v.string(),
          status: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    // Calculate current week
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.floor((now - plan.startDate) / msPerWeek) + 1;

    // Get current week's sessions
    const currentSessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", currentWeek)
      )
      .collect();

    return {
      // Plan metadata
      name: plan.name,
      goalType: plan.goalType,
      targetDate: plan.targetDate,
      status: plan.status,
      durationWeeks: plan.durationWeeks,

      // RadarChart data
      radarChart: {
        data: plan.runnerSnapshot.profileRadar,
      },

      // ProgressionChart data
      progressionChart: {
        weeks: plan.weeklyPlan.map((w) => ({
          week: w.weekNumber,
          volume: w.volumeKm,
          intensity: w.intensityScore,
          recovery: w.isRecoveryWeek || undefined,
          label: w.weekLabel || undefined,
        })),
        currentWeek:
          currentWeek > 0 && currentWeek <= plan.durationWeeks
            ? currentWeek
            : undefined,
      },

      // Verdict data
      expectedOutcomes: plan.seasonView.expectedOutcomes,

      // Coach summary
      coachSummary: plan.seasonView.coachSummary,

      // Current week sessions
      currentWeekSessions: currentSessions.map((s) => ({
        type: s.sessionTypeDisplay,
        dur: s.targetDurationDisplay,
        effort: s.effortDisplay,
        key: s.isKeySession,
        rest: s.isRestDay,
        day: s.dayOfWeekShort,
        status: s.status,
      })),
    };
  },
});

// =============================================================================
// Analytics Queries
// =============================================================================

const PLACEMENT_RUN_THRESHOLD = 10;

/**
 * Count completed runs for the current user and determine analytics unlock status.
 * Analytics are gated behind 10 completed runs ("placement runs").
 */
export const getCompletedRunCount = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      completedRuns: v.number(),
      threshold: v.number(),
      isUnlocked: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const activities = await ctx.runQuery(
      components.soma.public.listActivities,
      {
        userId: userId as string,
        limit: PLACEMENT_RUN_THRESHOLD,
        order: "desc",
      }
    );

    const completedRuns = activities.length;
    return {
      completedRuns,
      threshold: PLACEMENT_RUN_THRESHOLD,
      isUnlocked: completedRuns >= PLACEMENT_RUN_THRESHOLD,
    };
  },
});

// VDOT-to-race-time lookup table (seconds). Based on Daniels' Running Formula.
const VDOT_TABLE = [
  { vdot: 30, fiveK: 1620, tenK: 3374, half: 7453, marathon: 15487 },
  { vdot: 35, fiveK: 1389, tenK: 2890, half: 6396, marathon: 13308 },
  { vdot: 40, fiveK: 1207, tenK: 2510, half: 5567, marathon: 11551 },
  { vdot: 45, fiveK: 1062, tenK: 2210, half: 4898, marathon: 10162 },
  { vdot: 50, fiveK: 946, tenK: 1968, half: 4343, marathon: 9041 },
  { vdot: 55, fiveK: 850, tenK: 1769, half: 3878, marathon: 8112 },
  { vdot: 60, fiveK: 770, tenK: 1603, half: 3498, marathon: 7338 },
  { vdot: 65, fiveK: 703, tenK: 1464, half: 3182, marathon: 6678 },
  { vdot: 70, fiveK: 647, tenK: 1345, half: 2917, marathon: 6111 },
] as const;

type VdotEntry = (typeof VDOT_TABLE)[number];
type RaceKey = "fiveK" | "tenK" | "half" | "marathon";

function interpolateTime(vdot: number, key: RaceKey): number {
  if (vdot <= VDOT_TABLE[0].vdot) return VDOT_TABLE[0][key];
  if (vdot >= VDOT_TABLE[VDOT_TABLE.length - 1].vdot)
    return VDOT_TABLE[VDOT_TABLE.length - 1][key];

  let lower: VdotEntry = VDOT_TABLE[0];
  let upper: VdotEntry = VDOT_TABLE[1];
  for (let i = 0; i < VDOT_TABLE.length - 1; i++) {
    if (vdot >= VDOT_TABLE[i].vdot && vdot <= VDOT_TABLE[i + 1].vdot) {
      lower = VDOT_TABLE[i];
      upper = VDOT_TABLE[i + 1];
      break;
    }
  }

  const ratio = (vdot - lower.vdot) / (upper.vdot - lower.vdot);
  return Math.round(lower[key] + ratio * (upper[key] - lower[key]));
}

function formatRaceTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Get race time predictions based on the runner's estimated VDOT.
 * Returns predicted times for 5K, 10K, Half Marathon, and Marathon.
 */
export const getRacePredictions = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      vdot: v.number(),
      predictions: v.array(
        v.object({
          distance: v.string(),
          timeSeconds: v.number(),
          timeFormatted: v.string(),
          pacePerKm: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) return null;

    const vdot = runner.currentState?.estimatedVdot;
    if (!vdot) {
      // Try from active plan snapshot
      const plan = await ctx.db
        .query("trainingPlans")
        .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      const planVdot = plan?.runnerSnapshot?.fitnessIndicators?.estimatedVdot;
      if (!planVdot) return null;

      return buildPredictions(planVdot);
    }

    return buildPredictions(vdot);
  },
});

function buildPredictions(vdot: number) {
  const distances: Array<{ key: RaceKey; label: string; distanceKm: number }> =
    [
      { key: "fiveK", label: "5K", distanceKm: 5 },
      { key: "tenK", label: "10K", distanceKm: 10 },
      { key: "half", label: "Half Marathon", distanceKm: 21.0975 },
      { key: "marathon", label: "Marathon", distanceKm: 42.195 },
    ];

  return {
    vdot: Math.round(vdot * 10) / 10,
    predictions: distances.map((d) => {
      const timeSeconds = interpolateTime(vdot, d.key);
      const paceSeconds = Math.round(timeSeconds / d.distanceKm);
      const paceMin = Math.floor(paceSeconds / 60);
      const paceSec = paceSeconds % 60;
      return {
        distance: d.label,
        timeSeconds,
        timeFormatted: formatRaceTime(timeSeconds),
        pacePerKm: `${paceMin}:${String(paceSec).padStart(2, "0")}/km`,
      };
    }),
  };
}

/**
 * Get health metrics for the current runner from their currentState.
 */
export const getHealthMetrics = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      restingHr: v.optional(v.number()),
      hrv: v.optional(v.number()),
      sleepScore: v.optional(v.number()),
      readinessScore: v.optional(v.number()),
      weight: v.optional(v.number()),
      dataQuality: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner?.currentState) return null;

    return {
      restingHr: runner.currentState.latestRestingHr,
      hrv: runner.currentState.latestHrv,
      sleepScore: runner.currentState.latestSleepScore,
      readinessScore: runner.currentState.readinessScore,
      weight: runner.currentState.latestWeight,
      dataQuality: runner.currentState.dataQuality,
    };
  },
});

// =============================================================================
// Session Detail Query
// =============================================================================

/**
 * Get a single session by ID with plan context.
 * Used by the unified Session Detail page.
 */
export const getSessionById = query({
  args: { sessionId: v.id("plannedSessions") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("plannedSessions"),
      planId: v.id("trainingPlans"),
      runnerId: v.id("runners"),
      weekNumber: v.number(),
      dayOfWeek: v.string(),
      dayOfWeekShort: v.string(),
      scheduledDate: v.number(),
      sessionType: v.string(),
      sessionTypeDisplay: v.string(),
      sessionSubtype: v.optional(v.string()),
      isKeySession: v.boolean(),
      isRestDay: v.boolean(),
      targetDurationSeconds: v.optional(v.number()),
      targetDurationDisplay: v.string(),
      targetDistanceMeters: v.optional(v.number()),
      effortLevel: v.optional(v.number()),
      effortDisplay: v.string(),
      targetPaceMin: v.optional(v.string()),
      targetPaceMax: v.optional(v.string()),
      targetPaceDisplay: v.optional(v.string()),
      targetHeartRateZone: v.optional(v.number()),
      targetHeartRateMin: v.optional(v.number()),
      targetHeartRateMax: v.optional(v.number()),
      description: v.string(),
      structureDisplay: v.optional(v.string()),
      structureSegments: v.optional(
        v.array(
          v.object({
            segmentType: v.string(),
            durationSeconds: v.optional(v.number()),
            distanceMeters: v.optional(v.number()),
            targetPace: v.optional(v.string()),
            targetHeartRate: v.optional(v.number()),
            targetEffort: v.optional(v.number()),
            repetitions: v.optional(v.number()),
            recoverySeconds: v.optional(v.number()),
            notes: v.optional(v.string()),
          })
        )
      ),
      justification: v.string(),
      physiologicalTarget: v.string(),
      placementRationale: v.optional(v.string()),
      keyPoints: v.optional(v.array(v.string())),
      isMoveable: v.boolean(),
      canBeSplit: v.optional(v.boolean()),
      alternatives: v.optional(
        v.array(
          v.object({
            sessionType: v.string(),
            description: v.string(),
            whenToUse: v.string(),
          })
        )
      ),
      status: v.string(),
      completedActivityId: v.optional(v.string()),
      completedAt: v.optional(v.number()),
      adherenceScore: v.optional(v.number()),
      skipReason: v.optional(v.string()),
      modificationNotes: v.optional(v.string()),
      actualDurationSeconds: v.optional(v.number()),
      actualDistanceMeters: v.optional(v.number()),
      userFeedback: v.optional(v.string()),
      userRating: v.optional(v.number()),
      debriefTags: v.optional(v.array(v.string())),
      planName: v.string(),
      planCurrentWeek: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner || session.runnerId !== runner._id) return null;

    const plan = await ctx.db.get(session.planId);
    if (!plan) return null;

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.max(
      1,
      Math.min(
        plan.durationWeeks,
        Math.floor((Date.now() - plan.startDate) / msPerWeek) + 1
      )
    );

    return {
      _id: session._id,
      planId: session.planId,
      runnerId: session.runnerId,
      weekNumber: session.weekNumber,
      dayOfWeek: session.dayOfWeek,
      dayOfWeekShort: session.dayOfWeekShort,
      scheduledDate: session.scheduledDate,
      sessionType: session.sessionType,
      sessionTypeDisplay: session.sessionTypeDisplay,
      sessionSubtype: session.sessionSubtype,
      isKeySession: session.isKeySession,
      isRestDay: session.isRestDay,
      targetDurationSeconds: session.targetDurationSeconds,
      targetDurationDisplay: session.targetDurationDisplay,
      targetDistanceMeters: session.targetDistanceMeters,
      effortLevel: session.effortLevel,
      effortDisplay: session.effortDisplay,
      targetPaceMin: session.targetPaceMin,
      targetPaceMax: session.targetPaceMax,
      targetPaceDisplay: session.targetPaceDisplay,
      targetHeartRateZone: session.targetHeartRateZone,
      targetHeartRateMin: session.targetHeartRateMin,
      targetHeartRateMax: session.targetHeartRateMax,
      description: session.description,
      structureDisplay: session.structureDisplay,
      structureSegments: session.structureSegments,
      justification: session.justification,
      physiologicalTarget: session.physiologicalTarget,
      placementRationale: session.placementRationale,
      keyPoints: session.keyPoints,
      isMoveable: session.isMoveable,
      canBeSplit: session.canBeSplit,
      alternatives: session.alternatives,
      status: session.status,
      completedActivityId: session.completedActivityId,
      completedAt: session.completedAt,
      adherenceScore: session.adherenceScore,
      skipReason: session.skipReason,
      modificationNotes: session.modificationNotes,
      actualDurationSeconds: session.actualDurationSeconds,
      actualDistanceMeters: session.actualDistanceMeters,
      userFeedback: session.userFeedback,
      userRating: session.userRating,
      debriefTags: session.debriefTags,
      planName: plan.name,
      planCurrentWeek: currentWeek,
    };
  },
});

// =============================================================================
// Plan Screen Composite Query
// =============================================================================

const planScreenSessionValidator = v.object({
  _id: v.id("plannedSessions"),
  weekNumber: v.number(),
  sessionTypeDisplay: v.string(),
  targetDurationDisplay: v.string(),
  targetDurationSeconds: v.optional(v.number()),
  targetDistanceMeters: v.optional(v.number()),
  description: v.string(),
  scheduledDate: v.number(),
  isKeySession: v.boolean(),
  isRestDay: v.boolean(),
  effortLevel: v.optional(v.number()),
  effortDisplay: v.string(),
  targetPaceDisplay: v.optional(v.string()),
  structureDisplay: v.optional(v.string()),
  status: v.string(),
  dayOfWeekShort: v.string(),
  actualDurationSeconds: v.optional(v.number()),
  actualDistanceMeters: v.optional(v.number()),
  adherenceScore: v.optional(v.number()),
});

const planScreenWeekValidator = v.object({
  weekNumber: v.number(),
  phaseName: v.string(),
  volumeKm: v.number(),
  isRecoveryWeek: v.boolean(),
  weekLabel: v.optional(v.string()),
});

const planScreenPlanValidator = v.object({
  _id: v.id("trainingPlans"),
  name: v.string(),
  goalType: v.string(),
  targetEvent: v.optional(v.string()),
  targetDate: v.optional(v.number()),
  targetTime: v.optional(v.number()),
  startDate: v.number(),
  durationWeeks: v.number(),
  currentWeek: v.number(),
  coachSummary: v.string(),
  weeklyPlan: v.array(planScreenWeekValidator),
});

/**
 * Composite query returning everything the Plan screen needs in one round-trip:
 * active plan metadata, all planned sessions, and derived current week.
 */
export const getPlanScreenData = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      plan: planScreenPlanValidator,
      sessions: v.array(planScreenSessionValidator),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner) return null;

    const plan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (!plan) return null;

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.max(
      1,
      Math.min(
        plan.durationWeeks,
        Math.floor((Date.now() - plan.startDate) / msPerWeek) + 1
      )
    );

    const allSessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_planId", (q) => q.eq("planId", plan._id))
      .collect();

    return {
      plan: {
        _id: plan._id,
        name: plan.name,
        goalType: plan.goalType,
        targetEvent: plan.targetEvent,
        targetDate: plan.targetDate,
        targetTime: plan.targetTime,
        startDate: plan.startDate,
        durationWeeks: plan.durationWeeks,
        currentWeek,
        coachSummary: plan.seasonView.coachSummary,
        weeklyPlan: plan.weeklyPlan.map((w) => ({
          weekNumber: w.weekNumber,
          phaseName: w.phaseName,
          volumeKm: w.volumeKm,
          isRecoveryWeek: w.isRecoveryWeek,
          weekLabel: w.weekLabel,
        })),
      },
      sessions: allSessions.map((s) => ({
        _id: s._id,
        weekNumber: s.weekNumber,
        sessionTypeDisplay: s.sessionTypeDisplay,
        targetDurationDisplay: s.targetDurationDisplay,
        targetDurationSeconds: s.targetDurationSeconds,
        targetDistanceMeters: s.targetDistanceMeters,
        description: s.description,
        scheduledDate: s.scheduledDate,
        isKeySession: s.isKeySession,
        isRestDay: s.isRestDay,
        effortLevel: s.effortLevel,
        effortDisplay: s.effortDisplay,
        targetPaceDisplay: s.targetPaceDisplay ?? undefined,
        structureDisplay: s.structureDisplay ?? undefined,
        status: s.status,
        dayOfWeekShort: s.dayOfWeekShort,
        actualDurationSeconds: s.actualDurationSeconds,
        actualDistanceMeters: s.actualDistanceMeters,
        adherenceScore: s.adherenceScore,
      })),
    };
  },
});

// =============================================================================
// Activity Detail Query (Phase 2 — Session Detail Actual Data)
// =============================================================================

/** Lap data returned to the frontend */
const lapValidator = v.object({
  avgHrBpm: v.optional(v.number()),
  avgSpeedMps: v.optional(v.number()),
  distanceMeters: v.optional(v.number()),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
});

/** HR zone data returned to the frontend */
const hrZoneValidator = v.object({
  zone: v.optional(v.number()),
  durationSeconds: v.optional(v.number()),
  name: v.optional(v.string()),
});

/**
 * Fetch activity detail for a completed session.
 * Uses the session's completedActivityId + completedAt to find the matching
 * Soma activity and return laps, HR zones, and movement data.
 */
export const getActivityForSession = query({
  args: { sessionId: v.id("plannedSessions") },
  returns: v.union(
    v.null(),
    v.object({
      laps: v.array(lapValidator),
      hrZones: v.array(hrZoneValidator),
      avgHrBpm: v.optional(v.number()),
      maxHrBpm: v.optional(v.number()),
      avgPaceMinPerKm: v.optional(v.number()),
      avgCadenceRpm: v.optional(v.number()),
      elevationGainMeters: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (!session.completedActivityId || !session.completedAt) return null;

    // Verify ownership
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner || session.runnerId !== runner._id) return null;

    // Search activities in a ±3 hour window around completedAt
    const windowMs = 3 * 60 * 60 * 1000;
    const startTime = new Date(session.completedAt - windowMs).toISOString();
    const endTime = new Date(session.completedAt + windowMs).toISOString();

    const activities = await ctx.runQuery(
      components.soma.public.listActivities,
      {
        userId: userId as string,
        startTime,
        endTime,
        limit: 10,
        order: "desc" as const,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity = (activities as any[]).find(
      (a) => a._id === session.completedActivityId
    );
    if (!activity) return null;

    // Extract laps
    const laps = (activity.lap_data?.laps ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lap: any) => ({
        avgHrBpm: lap.avg_hr_bpm ?? undefined,
        avgSpeedMps: lap.avg_speed_meters_per_second ?? undefined,
        distanceMeters: lap.distance_meters ?? undefined,
        startTime: lap.start_time ?? undefined,
        endTime: lap.end_time ?? undefined,
      })
    );

    // Extract HR zones
    const hrZones = (
      activity.heart_rate_data?.summary?.hr_zone_data ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).map((z: any) => ({
      zone: z.zone ?? undefined,
      durationSeconds: z.duration_seconds ?? undefined,
      name: z.name ?? undefined,
    }));

    return {
      laps,
      hrZones,
      avgHrBpm: activity.heart_rate_data?.summary?.avg_hr_bpm ?? undefined,
      maxHrBpm: activity.heart_rate_data?.summary?.max_hr_bpm ?? undefined,
      avgPaceMinPerKm:
        activity.movement_data?.avg_pace_minutes_per_kilometer ?? undefined,
      avgCadenceRpm: activity.movement_data?.avg_cadence_rpm ?? undefined,
      elevationGainMeters:
        activity.distance_data?.summary?.elevation?.gain_actual_meters ??
        undefined,
    };
  },
});

// =============================================================================
// Adjacent Sessions Query (Yesterday / Tomorrow Context)
// =============================================================================

/**
 * Get the sessions immediately before and after a given session.
 * Used by the "Yesterday / Tomorrow" context card.
 */
export const getAdjacentSessions = query({
  args: { sessionId: v.id("plannedSessions") },
  returns: v.union(
    v.null(),
    v.object({
      yesterday: v.union(
        v.null(),
        v.object({
          sessionTypeDisplay: v.string(),
          targetDistanceMeters: v.optional(v.number()),
          isRestDay: v.boolean(),
          status: v.string(),
        })
      ),
      tomorrow: v.union(
        v.null(),
        v.object({
          sessionTypeDisplay: v.string(),
          targetDistanceMeters: v.optional(v.number()),
          isRestDay: v.boolean(),
          status: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner || session.runnerId !== runner._id) return null;

    const dayMs = 24 * 60 * 60 * 1000;
    const yesterdayStart = session.scheduledDate - dayMs;
    const tomorrowEnd = session.scheduledDate + 2 * dayMs;

    // Fetch sessions in a 3-day window
    const nearby = await ctx.db
      .query("plannedSessions")
      .withIndex("by_date", (q) =>
        q
          .eq("runnerId", runner._id)
          .gte("scheduledDate", yesterdayStart)
          .lt("scheduledDate", tomorrowEnd)
      )
      .collect();

    // Find yesterday and tomorrow (closest sessions in those date ranges)
    let yesterday = null;
    let tomorrow = null;

    for (const s of nearby) {
      if (s._id === session._id) continue;
      if (s.scheduledDate < session.scheduledDate) {
        yesterday = {
          sessionTypeDisplay: s.sessionTypeDisplay,
          targetDistanceMeters: s.targetDistanceMeters,
          isRestDay: s.isRestDay,
          status: s.status,
        };
      } else if (s.scheduledDate > session.scheduledDate) {
        if (!tomorrow) {
          tomorrow = {
            sessionTypeDisplay: s.sessionTypeDisplay,
            targetDistanceMeters: s.targetDistanceMeters,
            isRestDay: s.isRestDay,
            status: s.status,
          };
        }
      }
    }

    return { yesterday, tomorrow };
  },
});

// =============================================================================
// Upcoming Sessions (for AI Coach context)
// =============================================================================

/**
 * Fetch the next 14 days of sessions for the authenticated runner.
 * Used to inject schedule context into the AI coach's system prompt
 * so it can propose changes with full awareness of the runner's plan.
 */
export const getUpcomingSessions = query({
  args: {},
  returns: v.union(
    v.null(),
    v.array(
      v.object({
        _id: v.id("plannedSessions"),
        scheduledDate: v.number(),
        dayOfWeek: v.string(),
        dayOfWeekShort: v.string(),
        sessionType: v.string(),
        sessionTypeDisplay: v.string(),
        targetDurationDisplay: v.string(),
        effortDisplay: v.string(),
        isKeySession: v.boolean(),
        isRestDay: v.boolean(),
        isMoveable: v.boolean(),
        status: v.string(),
        description: v.string(),
      })
    )
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner) return null;

    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const sessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_date", (q) =>
        q
          .eq("runnerId", runner._id)
          .gte("scheduledDate", now)
          .lt("scheduledDate", now + fourteenDaysMs)
      )
      .collect();

    return sessions.map((s) => ({
      _id: s._id,
      scheduledDate: s.scheduledDate,
      dayOfWeek: s.dayOfWeek,
      dayOfWeekShort: s.dayOfWeekShort,
      sessionType: s.sessionType,
      sessionTypeDisplay: s.sessionTypeDisplay,
      targetDurationDisplay: s.targetDurationDisplay,
      effortDisplay: s.effortDisplay,
      isKeySession: s.isKeySession,
      isRestDay: s.isRestDay,
      isMoveable: s.isMoveable,
      status: s.status,
      description: s.description,
    }));
  },
});

// =============================================================================
// Read Planned Sessions for Coach (Story 11.2)
// =============================================================================

/**
 * Compute current ISO week (Monday-start) boundaries in UTC.
 *
 * TODO: This uses UTC for week boundaries. Runners in significantly offset
 * timezones (e.g., UTC-8 Pacific) will get week boundaries that don't match
 * their local Monday-Sunday. Should eventually use the runner's timezone
 * (stored in profile or inferred from device). Track as tech debt.
 */
function getCurrentWeekBounds(): { startMs: number; endMs: number } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { startMs: monday.getTime(), endMs: sunday.getTime() };
}

/**
 * Read planned sessions for the AI coach tool.
 *
 * RBAC: getAuthUserId → runners.by_userId → plannedSessions.by_date (scoped to runnerId)
 * Default: returns current ISO week (Mon-Sun) if no date filters provided.
 *
 * Source: Story 11.2 - AC#1, AC#2, AC#3
 */
export const readPlannedSessionsForCoach = query({
  args: {
    weekNumber: v.optional(v.number()),
    startDate: v.optional(v.string()), // ISO date string "YYYY-MM-DD"
    endDate: v.optional(v.string()), // ISO date string "YYYY-MM-DD"
    status: v.optional(v.string()), // "scheduled" | "completed" | "skipped" | "modified" | "rescheduled"
  },
  returns: v.union(
    v.null(),
    v.array(
      v.object({
        _id: v.id("plannedSessions"),
        scheduledDate: v.number(),
        dayOfWeek: v.string(),
        dayOfWeekShort: v.string(),
        sessionType: v.string(),
        sessionTypeDisplay: v.string(),
        targetDurationSeconds: v.union(v.number(), v.null()),
        targetDurationDisplay: v.string(),
        effortLevel: v.union(v.number(), v.null()),
        effortDisplay: v.string(),
        targetPaceDisplay: v.union(v.string(), v.null()),
        isKeySession: v.boolean(),
        isRestDay: v.boolean(),
        isMoveable: v.boolean(),
        status: v.string(),
        description: v.string(),
        justification: v.string(),
        structureDisplay: v.union(v.string(), v.null()),
        weekNumber: v.number(),
        physiologicalTarget: v.string(),
        placementRationale: v.union(v.string(), v.null()),
        keyPoints: v.union(v.array(v.string()), v.null()),
      })
    )
  ),
  handler: async (ctx, args) => {
    // RBAC: authenticate user and resolve runner
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner) return null;

    // Determine query strategy based on provided filters.
    // When weekNumber is provided without date filters, we skip the default
    // week bounds and use the by_runnerId index with in-memory weekNumber
    // filter. This avoids silently returning empty results when the plan
    // week doesn't overlap with the current calendar week.
    const hasDateFilters = args.startDate || args.endDate;
    const weekNumberOnly =
      args.weekNumber !== undefined && !hasDateFilters;

    let sessions;

    if (weekNumberOnly) {
      // weekNumber-only: broad scan filtered by weekNumber in-memory
      sessions = await ctx.db
        .query("plannedSessions")
        .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
        .take(100);

      sessions = sessions.filter(
        (s) => s.weekNumber === args.weekNumber
      );
    } else {
      // Compute date range for index query
      let startMs: number;
      let endMs: number;

      if (hasDateFilters) {
        // Parse ISO date strings to UTC timestamps
        if (args.startDate) {
          const d = new Date(args.startDate + "T00:00:00.000Z");
          if (isNaN(d.getTime())) return [];
          startMs = d.getTime();
        } else {
          // Only endDate provided: default to 90 days before endDate as
          // a reasonable lower bound instead of scanning from Unix epoch
          const endD = new Date(args.endDate! + "T23:59:59.999Z");
          if (isNaN(endD.getTime())) return [];
          startMs = endD.getTime() - 90 * 24 * 60 * 60 * 1000;
        }

        if (args.endDate) {
          const d = new Date(args.endDate + "T23:59:59.999Z");
          if (isNaN(d.getTime())) return [];
          endMs = d.getTime();
        } else {
          // Only startDate provided: scan up to 1 year ahead as a
          // reasonable upper bound instead of Number.MAX_SAFE_INTEGER
          endMs = startMs + 365 * 24 * 60 * 60 * 1000;
        }
      } else {
        // Default: current ISO week (Monday-Sunday)
        const bounds = getCurrentWeekBounds();
        startMs = bounds.startMs;
        endMs = bounds.endMs;
      }

      // Query using by_date index (scoped to runnerId), capped at 100 results
      sessions = await ctx.db
        .query("plannedSessions")
        .withIndex("by_date", (q) =>
          q
            .eq("runnerId", runner._id)
            .gte("scheduledDate", startMs)
            .lte("scheduledDate", endMs)
        )
        .take(100);

      // In-memory weekNumber filter (when combined with date filters)
      if (args.weekNumber !== undefined) {
        sessions = sessions.filter(
          (s) => s.weekNumber === args.weekNumber
        );
      }
    }

    // In-memory status filter
    if (args.status !== undefined) {
      sessions = sessions.filter((s) => s.status === args.status);
    }

    // Sort by scheduledDate ascending (index already returns in order, but be explicit)
    sessions.sort((a, b) => a.scheduledDate - b.scheduledDate);

    // Map to return shape
    return sessions.map((s) => ({
      _id: s._id,
      scheduledDate: s.scheduledDate,
      dayOfWeek: s.dayOfWeek,
      dayOfWeekShort: s.dayOfWeekShort,
      sessionType: s.sessionType,
      sessionTypeDisplay: s.sessionTypeDisplay,
      targetDurationSeconds: s.targetDurationSeconds ?? null,
      targetDurationDisplay: s.targetDurationDisplay,
      effortLevel: s.effortLevel ?? null,
      effortDisplay: s.effortDisplay,
      targetPaceDisplay: s.targetPaceDisplay ?? null,
      isKeySession: s.isKeySession,
      isRestDay: s.isRestDay,
      isMoveable: s.isMoveable,
      status: s.status,
      description: s.description,
      justification: s.justification,
      structureDisplay: s.structureDisplay ?? null,
      weekNumber: s.weekNumber,
      physiologicalTarget: s.physiologicalTarget,
      placementRationale: s.placementRationale ?? null,
      keyPoints: s.keyPoints ?? null,
    }));
  },
});

// =============================================================================
// Read Active Plan for Coach (Story 11.3)
// =============================================================================
// RBAC: getAuthUserId → runners.by_userId → trainingPlans.by_runnerId (status === "active")
// Returns full plan structure with computed currentWeek/currentPhase.

// Weekly plan item shape used in the returns validator
const weeklyPlanItemValidator = v.object({
  weekNumber: v.number(),
  phaseName: v.string(),
  phaseWeekNumber: v.number(),
  volumeKm: v.number(),
  intensityScore: v.number(),
  isRecoveryWeek: v.boolean(),
  weekLabel: v.union(v.string(), v.null()),
  keySessions: v.number(),
  easyRuns: v.number(),
  restDays: v.number(),
  weekFocus: v.string(),
});

export const getActivePlanForCoach = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      name: v.string(),
      goalType: v.string(),
      targetEvent: v.union(v.string(), v.null()),
      targetDate: v.union(v.number(), v.null()),
      targetTime: v.union(v.number(), v.null()),
      startDate: v.number(),
      endDate: v.number(),
      durationWeeks: v.number(),
      status: v.string(),
      seasonView: v.object({
        coachSummary: v.string(),
        periodizationJustification: v.string(),
        volumeStrategyJustification: v.string(),
        keyMilestones: v.array(
          v.object({
            weekNumber: v.number(),
            milestone: v.string(),
            significance: v.string(),
          }),
        ),
        identifiedRisks: v.array(
          v.object({
            risk: v.string(),
            mitigation: v.string(),
            monitoringSignals: v.array(v.string()),
          }),
        ),
        expectedOutcomes: v.object({
          primaryGoal: v.string(),
          confidenceLevel: v.number(),
          confidenceReason: v.string(),
          secondaryOutcomes: v.array(v.string()),
        }),
      }),
      weeklyPlan: v.array(weeklyPlanItemValidator),
      totalWeeks: v.number(),
      weeklyPlanTruncated: v.boolean(),
      runnerSnapshot: v.object({
        capturedAt: v.number(),
        profileRadar: v.array(
          v.object({
            label: v.string(),
            value: v.number(),
            uncertain: v.boolean(),
          }),
        ),
        fitnessIndicators: v.object({
          estimatedVdot: v.union(v.number(), v.null()),
          recentVolume: v.union(v.number(), v.null()),
          consistencyScore: v.union(v.number(), v.null()),
        }),
        planInfluencers: v.array(v.string()),
      }),
      currentWeek: v.union(v.number(), v.null()),
      currentPhase: v.union(v.string(), v.null()),
      currentPhaseWeekNumber: v.union(v.number(), v.null()),
      isRecoveryWeek: v.union(v.boolean(), v.null()),
      periodizationModel: v.union(v.string(), v.null()),
      phases: v.union(
        v.array(
          v.object({
            name: v.string(),
            startWeek: v.number(),
            endWeek: v.number(),
            focus: v.string(),
          }),
        ),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx) => {
    // RBAC: authenticate user and resolve runner
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner) return null;

    // Query active plan only (no fallback to draft/paused/completed)
    const plan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (!plan) return null;

    // Compute current week and phase (AC 3)
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const rawWeek = Math.floor((now - plan.startDate) / msPerWeek) + 1;
    const currentWeek =
      rawWeek >= 1 && rawWeek <= plan.durationWeeks ? rawWeek : null;
    const currentWeekEntry = currentWeek
      ? plan.weeklyPlan.find((w) => w.weekNumber === currentWeek)
      : null;

    // Truncate weeklyPlan to a window around current week to manage token budget.
    // Returns current week +/- 2 weeks of context. For plans outside the active
    // window (currentWeek is null), returns first 5 weeks as a reasonable default.
    // totalWeeks and weeklyPlanTruncated let the LLM know if data was omitted.
    const WEEK_WINDOW = 2;
    const MAX_WEEKS_FALLBACK = 5;
    const allWeeks = plan.weeklyPlan.map((w) => ({
      weekNumber: w.weekNumber,
      phaseName: w.phaseName,
      phaseWeekNumber: w.phaseWeekNumber,
      volumeKm: w.volumeKm,
      intensityScore: w.intensityScore,
      isRecoveryWeek: w.isRecoveryWeek,
      weekLabel: w.weekLabel ?? null,
      keySessions: w.keySessions,
      easyRuns: w.easyRuns,
      restDays: w.restDays,
      weekFocus: w.weekFocus,
    }));
    const totalWeeks = allWeeks.length;

    let weeklyPlan;
    if (currentWeek !== null) {
      const minWeek = Math.max(1, currentWeek - WEEK_WINDOW);
      const maxWeek = Math.min(plan.durationWeeks, currentWeek + WEEK_WINDOW);
      weeklyPlan = allWeeks.filter(
        (w) => w.weekNumber >= minWeek && w.weekNumber <= maxWeek,
      );
    } else {
      weeklyPlan = allWeeks.slice(0, MAX_WEEKS_FALLBACK);
    }
    const weeklyPlanTruncated = weeklyPlan.length < totalWeeks;

    return {
      // Plan metadata
      name: plan.name,
      goalType: plan.goalType,
      targetEvent: plan.targetEvent ?? null,
      targetDate: plan.targetDate ?? null,
      targetTime: plan.targetTime ?? null,
      startDate: plan.startDate,
      endDate: plan.endDate,
      durationWeeks: plan.durationWeeks,
      status: plan.status,

      // Season view (macro)
      // NOTE: volumeStrategyJustification is included for coaching context —
      // it helps the LLM explain WHY the volume was set the way it was.
      seasonView: {
        coachSummary: plan.seasonView.coachSummary,
        periodizationJustification:
          plan.seasonView.periodizationJustification,
        volumeStrategyJustification:
          plan.seasonView.volumeStrategyJustification,
        keyMilestones: plan.seasonView.keyMilestones,
        identifiedRisks: plan.seasonView.identifiedRisks,
        expectedOutcomes: plan.seasonView.expectedOutcomes,
      },

      // Weekly plan (meso) — truncated to current week +/- 2 for token budget
      weeklyPlan,
      totalWeeks,
      weeklyPlanTruncated,

      // Runner snapshot
      runnerSnapshot: {
        capturedAt: plan.runnerSnapshot.capturedAt,
        profileRadar: plan.runnerSnapshot.profileRadar,
        fitnessIndicators: {
          estimatedVdot:
            plan.runnerSnapshot.fitnessIndicators.estimatedVdot ?? null,
          recentVolume:
            plan.runnerSnapshot.fitnessIndicators.recentVolume ?? null,
          consistencyScore:
            plan.runnerSnapshot.fitnessIndicators.consistencyScore ?? null,
        },
        planInfluencers: plan.runnerSnapshot.planInfluencers,
      },

      // Computed current position (AC 3)
      currentWeek,
      currentPhase: currentWeekEntry?.phaseName ?? null,
      currentPhaseWeekNumber: currentWeekEntry?.phaseWeekNumber ?? null,
      isRecoveryWeek: currentWeekEntry?.isRecoveryWeek ?? null,

      // Periodization model and phases for context
      periodizationModel: plan.periodizationModel ?? null,
      phases: plan.phases ?? null,
    };
  },
});
