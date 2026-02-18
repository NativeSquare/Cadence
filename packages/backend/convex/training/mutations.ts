/**
 * Training Plan Mutations (Story 6.5 - Operational Layer)
 *
 * This module provides the operational layer for plan generation.
 * It orchestrates:
 * 1. Fetching runner data
 * 2. Providing KB and Safeguards interfaces
 * 3. Calling the pure generatePlan function
 * 4. Persisting results to trainingPlans and plannedSessions
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import {
  generatePlan,
  type GoalType,
  type KBQueryContext,
  type KBEntry,
  type PlanGeneratorInput,
} from "./planGenerator";
import type { Doc } from "../_generated/dataModel";

// =============================================================================
// Goal Type Mapping
// =============================================================================

const GOAL_TYPE_MAP: Record<string, GoalType> = {
  "5k": "5k",
  "5K": "5k",
  "10k": "10k",
  "10K": "10k",
  half_marathon: "half_marathon",
  halfMarathon: "half_marathon",
  marathon: "marathon",
  base_building: "base_building",
  baseBuilding: "base_building",
  general_health: "base_building", // Map general health to base building
  general_fitness: "base_building",
};

// =============================================================================
// Duration Calculation
// =============================================================================

function calculatePlanDuration(targetDate: number | undefined, goalType: GoalType): number {
  // Default durations per goal type
  const defaultDurations: Record<GoalType, number> = {
    "5k": 8,
    "10k": 10,
    half_marathon: 12,
    marathon: 16,
    base_building: 8,
  };

  if (!targetDate) {
    return defaultDurations[goalType];
  }

  // Calculate weeks until target date
  const now = Date.now();
  const weeksUntilTarget = Math.floor((targetDate - now) / (7 * 24 * 60 * 60 * 1000));

  // Clamp to reasonable range
  const minWeeks = 4;
  const maxWeeks = 24;

  if (weeksUntilTarget < minWeeks) {
    console.warn(
      `[PlanGen] Target date too soon (${weeksUntilTarget} weeks), using minimum ${minWeeks}`
    );
    return minWeeks;
  }

  if (weeksUntilTarget > maxWeeks) {
    console.warn(
      `[PlanGen] Target date too far (${weeksUntilTarget} weeks), using maximum ${maxWeeks}`
    );
    return maxWeeks;
  }

  return weeksUntilTarget;
}

// =============================================================================
// Main Mutation
// =============================================================================

/**
 * Generate and persist a training plan for the current user's runner.
 *
 * This is the operational layer that:
 * 1. Fetches the authenticated user's runner
 * 2. Creates KB and Safeguards query interfaces
 * 3. Calls the pure generatePlan function
 * 4. Persists the plan and sessions to the database
 * 5. Returns the new plan ID
 */
export const generateAndPersistPlan = mutation({
  args: {
    // Optional overrides (mainly for testing)
    goalTypeOverride: v.optional(v.string()),
    durationWeeksOverride: v.optional(v.number()),
    targetDateOverride: v.optional(v.number()),
  },
  returns: v.object({
    planId: v.id("trainingPlans"),
    sessionsCreated: v.number(),
    durationWeeks: v.number(),
    goalType: v.string(),
  }),
  handler: async (ctx, args) => {
    console.log("[PlanGen] Starting plan generation...");

    // 1. Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      console.error("[PlanGen] Not authenticated");
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Must be authenticated to generate a plan",
      });
    }
    console.log(`[PlanGen] User authenticated: ${userId}`);

    // 2. Get runner for this user
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) {
      console.error("[PlanGen] Runner not found for user");
      throw new ConvexError({
        code: "RUNNER_NOT_FOUND",
        message: "Runner profile not found. Complete onboarding first.",
      });
    }
    console.log(`[PlanGen] Runner found: ${runner._id}`);
    console.log(`[PlanGen] Runner goals: ${JSON.stringify(runner.goals)}`);
    console.log(`[PlanGen] Runner running: ${JSON.stringify(runner.running)}`);

    // 3. Determine goal type
    const rawGoalType = args.goalTypeOverride ?? runner.goals?.goalType ?? "base_building";
    const goalType = GOAL_TYPE_MAP[rawGoalType] ?? "base_building";
    console.log(`[PlanGen] Goal type: ${rawGoalType} -> ${goalType}`);

    // 4. Determine target date and duration
    const targetDate = args.targetDateOverride ?? runner.goals?.raceDate;
    const durationWeeks = args.durationWeeksOverride ?? calculatePlanDuration(targetDate, goalType);
    console.log(`[PlanGen] Duration: ${durationWeeks} weeks, Target date: ${targetDate}`);

    // 5. Create Knowledge Base query interface
    const queryKnowledgeBase = async (context: KBQueryContext): Promise<KBEntry[]> => {
      console.log(`[PlanGen] Querying KB with tags: ${context.tags?.join(", ")}`);

      let query = ctx.db.query("knowledgeBase").filter((q) => q.eq(q.field("isActive"), true));

      // We can't do complex filtering in Convex, so we fetch all and filter in memory
      const allEntries = await query.collect();
      console.log(`[PlanGen] KB entries found: ${allEntries.length}`);

      // Filter by tags if provided
      let filtered = allEntries;
      if (context.tags && context.tags.length > 0) {
        filtered = filtered.filter((entry) =>
          context.tags!.some((tag) => entry.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())))
        );
      }

      // Filter by category if provided
      if (context.category) {
        filtered = filtered.filter((entry) => entry.category === context.category);
      }

      console.log(`[PlanGen] KB entries after filtering: ${filtered.length}`);

      return filtered.map((entry) => ({
        id: entry._id,
        title: entry.title,
        content: entry.content,
        summary: entry.summary,
        confidence: entry.confidence as KBEntry["confidence"],
        applicableGoals: entry.applicableGoals,
        tags: entry.tags,
      }));
    };

    // 6. Create Safeguards query interface
    const getSafeguards = async (): Promise<Doc<"safeguards">[]> => {
      const safeguards = await ctx.db
        .query("safeguards")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      console.log(`[PlanGen] Safeguards found: ${safeguards.length}`);
      return safeguards;
    };

    // 7. Build input for plan generator
    const input: PlanGeneratorInput = {
      runner,
      goalType,
      targetDate,
      durationWeeks,
      queryKnowledgeBase,
      getSafeguards,
    };

    console.log("[PlanGen] Calling generatePlan...");

    // 8. Generate the plan
    let output;
    try {
      output = await generatePlan(input);
      console.log(`[PlanGen] Plan generated successfully!`);
      console.log(`[PlanGen] Plan name: ${output.plan.name}`);
      console.log(`[PlanGen] Sessions: ${output.sessions.length}`);
      console.log(`[PlanGen] Decisions: ${output.plan.decisions?.length ?? 0}`);
    } catch (error) {
      console.error("[PlanGen] Plan generation failed:", error);
      throw new ConvexError({
        code: "PLAN_GENERATION_FAILED",
        message: `Failed to generate plan: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // 9. Deactivate any existing active plans for this runner
    const existingPlans = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const existingPlan of existingPlans) {
      console.log(`[PlanGen] Deactivating existing plan: ${existingPlan._id}`);
      await ctx.db.patch(existingPlan._id, { status: "paused", updatedAt: Date.now() });
    }

    // 10. Insert the new plan
    console.log("[PlanGen] Inserting plan into database...");
    const planId = await ctx.db.insert("trainingPlans", {
      ...output.plan,
      status: "active", // Activate immediately
    });
    console.log(`[PlanGen] Plan inserted with ID: ${planId}`);

    // 11. Insert all sessions
    console.log(`[PlanGen] Inserting ${output.sessions.length} sessions...`);
    let sessionsCreated = 0;
    for (const session of output.sessions) {
      await ctx.db.insert("plannedSessions", {
        ...session,
        planId,
      });
      sessionsCreated++;
    }
    console.log(`[PlanGen] Inserted ${sessionsCreated} sessions`);

    // 12. Update runner readyForPlan flag (keep currentPhase as "analysis" - the last valid phase)
    await ctx.db.patch(runner._id, {
      conversationState: {
        ...runner.conversationState,
        readyForPlan: true,
      },
    });

    console.log("[PlanGen] Plan generation complete!");

    return {
      planId,
      sessionsCreated,
      durationWeeks,
      goalType,
    };
  },
});

/**
 * Check if the current user has an active plan.
 * Useful for determining if plan generation should be triggered.
 */
export const hasActivePlan = mutation({
  args: {},
  returns: v.object({
    hasActivePlan: v.boolean(),
    planId: v.union(v.id("trainingPlans"), v.null()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { hasActivePlan: false, planId: null };
    }

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!runner) {
      return { hasActivePlan: false, planId: null };
    }

    const activePlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return {
      hasActivePlan: !!activePlan,
      planId: activePlan?._id ?? null,
    };
  },
});

// Note: To regenerate a plan, simply call generateAndPersistPlan again.
// It automatically deactivates existing plans before creating a new one.
