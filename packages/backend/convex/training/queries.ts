import { query } from "../_generated/server";
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
