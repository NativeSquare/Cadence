/**
 * Plan reads + idempotent plan provisioning.
 * Plan is the lifetime container in Cadence — one per athlete, status `active`,
 * no `endDate`. Blocks/workouts hang off it.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { components } from "../_generated/api";
import { type MutationCtx, mutation, query } from "../_generated/server";

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
 * Called from inside reflection's apply mutation.
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
