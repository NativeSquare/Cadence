/**
 * Goal mutations/queries.
 *
 * Goals live in the Agoge component and carry an optional `raceId` — they may
 * be standalone or attached to a race. Cadence exposes both shapes: the race
 * detail screen lists race-attached goals, and the top-level Goals screen
 * lists every goal the athlete owns.
 */

import { goalsValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import {
  assertAthlete,
  assertGoalOwnership,
  assertRaceOwnership,
  loadAthlete,
  loadOwnedRace,
} from "./helpers";

const GOAL_STATUSES = [
  "active",
  "achieved",
  "missed",
  "abandoned",
  "paused",
] as const;

export const listMyGoals = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const buckets = await Promise.all(
      GOAL_STATUSES.map((status) =>
        ctx.runQuery(components.agoge.public.getGoalsByAthleteAndStatus, {
          athleteId: auth.athlete._id,
          status,
        }),
      ),
    );
    return buckets.flat();
  },
});

export const listGoalsForRace = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const result = await loadOwnedRace(ctx, raceId);
    if (!result) return [];
    return await ctx.runQuery(components.agoge.public.getGoalsByRace, {
      raceId,
    });
  },
});

export const createGoal = mutation({
  args: goalsValidator
    .omit("athleteId", "raceId")
    .extend({ raceId: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const { athlete } = await assertAthlete(ctx);
    if (args.raceId) {
      await assertRaceOwnership(ctx, args.raceId, athlete._id);
    }
    return await ctx.runMutation(components.agoge.public.createGoal, {
      ...args,
      athleteId: athlete._id,
    });
  },
});

export const updateGoal = mutation({
  args: goalsValidator
    .omit("athleteId", "raceId")
    .partial()
    .extend({ goalId: v.string() }),
  handler: async (ctx, args) => {
    const { goalId, ...patch } = args;
    const { athlete } = await assertAthlete(ctx);
    await assertGoalOwnership(ctx, goalId, athlete._id);
    await ctx.runMutation(components.agoge.public.updateGoal, {
      goalId,
      ...patch,
    });
    return null;
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.string() },
  handler: async (ctx, { goalId }) => {
    const { athlete } = await assertAthlete(ctx);
    await assertGoalOwnership(ctx, goalId, athlete._id);
    await ctx.runMutation(components.agoge.public.deleteGoal, { goalId });
    return null;
  },
});
