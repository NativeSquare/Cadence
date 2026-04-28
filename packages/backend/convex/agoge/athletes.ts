/**
 * Athlete reads + profile mutations.
 * Thin wrappers that resolve auth and forward to agoge's athletes API.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const athleteProfileFields = {
  name: v.optional(v.string()),
  sex: v.optional(
    v.union(v.literal("male"), v.literal("female"), v.literal("other")),
  ),
  dateOfBirth: v.optional(v.string()),
  weightKg: v.optional(v.number()),
  heightCm: v.optional(v.number()),
  experienceLevel: v.optional(v.string()),
  yearsRunning: v.optional(v.number()),
  injuryStatus: v.optional(v.string()),
};

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

export const upsertAthlete = mutation({
  args: athleteProfileFields,
  handler: async (ctx, patch): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (existing) {
      await ctx.runMutation(components.agoge.public.updateAthlete, {
        athleteId: existing._id,
        ...patch,
      });
      return existing._id;
    }
    return await ctx.runMutation(components.agoge.public.createAthlete, {
      userId,
      ...patch,
    });
  },
});
