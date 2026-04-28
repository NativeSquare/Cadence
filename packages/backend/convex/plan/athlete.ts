/**
 * Athlete-profile mutations used during onboarding and the account flow.
 * Thin wrappers that resolve auth and forward to agoge's athletes API.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { type MutationCtx, mutation } from "../_generated/server";

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

/**
 * Idempotently ensures the authed user has an active Plan row, creating an
 * empty one if absent. Used by the (app) layout on entry so every authenticated
 * user has a plan container — blocks/workouts can be added later.
 */
export const ensurePlan = mutation({
  args: {},
  handler: async (ctx): Promise<{ planId: string; athleteId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete not found");
    const plan = await ensureAthletePlan(ctx, athlete._id);
    return { planId: plan._id, athleteId: athlete._id };
  },
});

/**
 * Idempotently returns the athlete's lifetime Plan row, creating one if absent.
 * Plan is the lifetime container in Cadence — one per athlete, status `active`,
 * no `endDate`. Called from inside reflection's apply mutation.
 */
export async function ensureAthletePlan(
  ctx: MutationCtx,
  athleteId: string,
): Promise<{ _id: string }> {
  const existing = await ctx.runQuery(
    components.agoge.public.getPlansByAthleteAndStatus,
    {
      athleteId: athleteId,
      status: "active",
    },
  );
  if (existing.length > 0) return { _id: existing[0]._id };

  const today = new Date().toISOString().slice(0, 10);
  const planId = await ctx.runMutation(components.agoge.public.createPlan, {
    athleteId: athleteId,
    name: "Cadence",
    startDate: today,
    status: "active",
  });
  return { _id: planId };
}
