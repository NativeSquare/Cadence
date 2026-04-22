/**
 * Plan generation — LLM-driven action that materialises a training plan
 * directly into the Agoge component.
 *
 * Flow: load athlete + onboarding transcript + (optional) target event →
 * build a system prompt and tool factory → call Claude with four write-tools
 * (createPlan, createBlock, createWorkout, finalizePlan) → return the planId.
 * The plan is born in `draft` status; finalizePlan flips it to `active`,
 * giving us partial-state safety — a mid-generation failure leaves the plan
 * in draft, invisible to getActivePlan.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText, hasToolCall, stepCountIs } from "ai";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { action, internalQuery } from "../_generated/server";
import { buildPlanGeneratorPrompt, type GoalType } from "../ai/prompts/plan_generator";
import { buildPlanGenerationTools } from "./tools";

export const getAuthenticatedUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

const GOAL_DISTANCE_METERS: Record<Exclude<GoalType, "base_building">, number> = {
  "5k": 5000,
  "10k": 10000,
  half_marathon: 21097,
  marathon: 42195,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const generatePlan = action({
  args: {
    goalType: v.union(
      v.literal("5k"),
      v.literal("10k"),
      v.literal("half_marathon"),
      v.literal("marathon"),
      v.literal("base_building"),
    ),
    targetDate: v.optional(v.string()),
    targetTimeSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ planId: string }> => {
    const userId = await ctx.runQuery(
      internal.plan.generate.getAuthenticatedUserId,
    );
    if (!userId) throw new Error("Not authenticated");

    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete profile missing");

    const today = todayIso();

    // ── Resolve target event for race goals ────────────────────────────────
    let targetDate = args.targetDate;
    let targetTimeSeconds = args.targetTimeSeconds;
    let targetEventId: string | undefined;

    if (args.goalType !== "base_building") {
      const goalDistance = GOAL_DISTANCE_METERS[args.goalType];
      const futureEvents = await ctx.runQuery(
        components.agoge.public.listEvents,
        { athleteId: athlete._id, startDate: today },
      );
      const matchingEvent = futureEvents
        .filter((e) =>
          e.distanceMeters !== undefined
            ? Math.abs(e.distanceMeters - goalDistance) < 500
            : true,
        )
        .sort((a, b) => a.date.localeCompare(b.date))[0];

      targetDate = targetDate ?? matchingEvent?.date;
      targetTimeSeconds = targetTimeSeconds ?? matchingEvent?.goalTimeSeconds;
      targetEventId = matchingEvent?._id;

      if (!targetDate) {
        throw new Error(
          `Goal ${args.goalType} requires a target date. Provide targetDate or create a future event for this athlete.`,
        );
      }
      if (targetDate <= today) {
        throw new Error(
          `Target date ${targetDate} is not in the future (today: ${today}).`,
        );
      }
    }

    // ── Load onboarding transcript (best-effort) ───────────────────────────
    const transcript = await ctx.runQuery(
      internal.plan.transcript.getOnboardingTranscript,
      { userId },
    );

    // ── Build prompt + tools ───────────────────────────────────────────────
    const systemPrompt = buildPlanGeneratorPrompt({
      goalType: args.goalType,
      athlete: {
        _id: athlete._id,
        name: athlete.name,
        sex: athlete.sex,
        dateOfBirth: athlete.dateOfBirth,
        weightKg: athlete.weightKg,
        heightCm: athlete.heightCm,
        maxHr: athlete.maxHr,
        restingHr: athlete.restingHr,
        thresholdPaceMps: athlete.thresholdPaceMps,
        thresholdHr: athlete.thresholdHr,
      },
      transcript,
      today,
      targetDate,
      targetTimeSeconds,
    });

    const { tools, getState } = buildPlanGenerationTools(ctx, {
      athleteId: athlete._id,
      targetEventId,
    });

    // ── Run the LLM generation loop ────────────────────────────────────────
    try {
      await generateText({
        model: anthropic("claude-sonnet-4-6"),
        system: systemPrompt,
        prompt:
          "Generate the plan now using tool calls. End with finalizePlan.",
        tools,
        stopWhen: [hasToolCall("finalizePlan"), stepCountIs(60)],
      });
    } catch (error) {
      console.error("[generatePlan] LLM generation error:", error);
      throw error;
    }

    const state = getState();
    if (!state.finalized || !state.planId) {
      throw new Error(
        `Plan generation did not complete: finalized=${state.finalized}, blockCount=${state.blockCount}, workoutCount=${state.workoutCount}. The plan remains in draft status.`,
      );
    }

    console.log(
      `[generatePlan] Plan ${state.planId} created for user ${userId}: ${state.blockCount} blocks, ${state.workoutCount} workouts.`,
    );

    return { planId: state.planId };
  },
});
