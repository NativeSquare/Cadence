/**
 * Plan reads + creation.
 * Plan is the lifetime container in Cadence — one per athlete, status `active`.
 * Blocks/workouts hang off it.
 */

import { plansValidator } from "@nativesquare/agoge/schema";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import { assertAthlete, loadAthlete } from "./helpers";

export const getAthletePlan = query({
  args: {},
  handler: async (ctx) => {
    const result = await loadAthlete(ctx);
    if (!result) return null;
    const plans = await ctx.runQuery(
      components.agoge.public.getPlansByAthleteAndStatus,
      { athleteId: result.athlete._id, status: "active" },
    );
    return plans[0] ?? null;
  },
});

export const createPlan = mutation({
  args: plansValidator.omit("athleteId"),
  handler: async (ctx, args): Promise<string> => {
    const { athlete } = await assertAthlete(ctx);
    return await ctx.runMutation(components.agoge.public.createPlan, {
      ...args,
      athleteId: athlete._id,
    });
  },
});
