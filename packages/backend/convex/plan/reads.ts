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

export const getAthletePlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return null;
    const plans = await ctx.runQuery(
      components.agoge.public.getPlansByAthleteAndStatus,
      { athleteId: athlete._id, status: "active" as const },
    );
    return plans[0] ?? null;
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
    return await ctx.runQuery(components.agoge.public.getWorkoutsByAthlete, {
      athleteId: athlete._id,
      startDate,
      endDate,
    });
  },
});

export const listBlocks = query({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    return await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      planId: planId as any,
    });
  },
});

