/**
 * Goal mutations/queries for race-attached goals.
 *
 * Goals live in the Agoge component and carry an optional `raceId`. Cadence
 * exposes them only as race-scoped objectives — created from, listed on, and
 * deleted with their parent race. Standalone (race-less) goals are not exposed
 * in the UI yet.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import {
  type Goal,
  goalRank,
  goalStatus,
  goalType,
} from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import {
  type MutationCtx,
  type QueryCtx,
  mutation,
  query,
} from "../_generated/server";

async function requireAthlete(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) throw new Error("Athlete not found");
  return athlete;
}

type GoalDoc = Goal & { _id: string };

export const listGoalsForRace = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      raceId: raceId as any,
    });
    if (!race || race.athleteId !== athlete._id) return [];
    const goals = (await ctx.runQuery(
      components.agoge.public.getGoalsByRace,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      { raceId: raceId as any },
    )) as GoalDoc[];
    return goals;
  },
});

export const createGoalForRace = mutation({
  args: {
    raceId: v.string(),
    type: goalType,
    title: v.string(),
    targetValue: v.string(),
    description: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    rank: v.optional(goalRank),
    status: v.optional(goalStatus),
  },
  handler: async (ctx, args) => {
    const athlete = await requireAthlete(ctx);
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      raceId: args.raceId as any,
    });
    if (!race || race.athleteId !== athlete._id) {
      throw new Error("Race not found");
    }
    return await ctx.runMutation(components.agoge.public.createGoal, {
      athleteId: athlete._id,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      raceId: args.raceId as any,
      type: args.type,
      title: args.title,
      targetValue: args.targetValue,
      description: args.description,
      targetDate: args.targetDate,
      rank: args.rank,
      status: args.status ?? "active",
    });
  },
});

export const updateGoal = mutation({
  args: {
    goalId: v.string(),
    type: v.optional(goalType),
    title: v.optional(v.string()),
    targetValue: v.optional(v.string()),
    description: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    rank: v.optional(goalRank),
    status: v.optional(goalStatus),
  },
  handler: async (ctx, { goalId, ...patch }) => {
    const athlete = await requireAthlete(ctx);
    const goal = (await ctx.runQuery(components.agoge.public.getGoal, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      goalId: goalId as any,
    })) as GoalDoc | null;
    if (!goal || goal.athleteId !== athlete._id) {
      throw new Error("Goal not found");
    }
    await ctx.runMutation(components.agoge.public.updateGoal, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      goalId: goalId as any,
      ...patch,
    });
    return null;
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.string() },
  handler: async (ctx, { goalId }) => {
    const athlete = await requireAthlete(ctx);
    const goal = (await ctx.runQuery(components.agoge.public.getGoal, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      goalId: goalId as any,
    })) as GoalDoc | null;
    if (!goal || goal.athleteId !== athlete._id) {
      throw new Error("Goal not found");
    }
    await ctx.runMutation(components.agoge.public.deleteGoal, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      goalId: goalId as any,
    });
    return null;
  },
});
