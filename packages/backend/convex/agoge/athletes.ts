/**
 * Athlete reads + profile mutations.
 * Thin wrappers that resolve auth and forward to agoge's athletes API.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { athleteValidator } from "@nativesquare/agoge/schema";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import { loadAthlete } from "./helpers";

export const getAthlete = query({
  args: {},
  handler: async (ctx) => (await loadAthlete(ctx))?.athlete ?? null,
});

export const upsertAthlete = mutation({
  args: athleteValidator.omit("userId"),
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
