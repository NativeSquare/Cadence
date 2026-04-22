/**
 * Auth-wrapped passthrough queries over the Agoge component.
 *
 * Frontend uses these via `api.plan.reads.*`. Each resolves the authed user,
 * looks up the agoge athlete, and forwards to `components.agoge.public.*`.
 * No sidecar joining — agoge is the authority.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { query } from "../_generated/server";

export const getAthlete = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.runQuery(components.agoge.public.getAthleteByUserId, {
      userId,
    });
  },
});

export const getActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return null;
    const plans = await ctx.runQuery(components.agoge.public.listPlans, {
      athleteId: athlete._id,
      status: "active",
    });
    return plans[0] ?? null;
  },
});

export const getWorkoutById = query({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
    });
    if (!workout) return null;
    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: workout.athleteId,
    });
    if (!athlete || athlete.userId !== userId) return null;
    return workout;
  },
});

export const listWorkoutsInRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    return await ctx.runQuery(components.agoge.public.listWorkoutsByDate, {
      athleteId: athlete._id,
      startDate,
      endDate,
    });
  },
});

export const listPlanWorkouts = query({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.runQuery(components.agoge.public.listWorkoutsByPlan, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      planId: planId as any,
    });
  },
});

export const listBlocks = query({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    return await ctx.runQuery(components.agoge.public.listBlocks, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      planId: planId as any,
    });
  },
});

export const listEvents = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    return await ctx.runQuery(components.agoge.public.listEvents, {
      athleteId: athlete._id,
      startDate,
      endDate,
    });
  },
});

export const listZones = query({
  args: { kind: v.optional(v.union(v.literal("hr"), v.literal("pace"))) },
  handler: async (ctx, { kind }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    return await ctx.runQuery(components.agoge.public.listZones, {
      athleteId: athlete._id,
      kind,
    });
  },
});
