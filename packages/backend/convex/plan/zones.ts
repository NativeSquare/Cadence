/**
 * Zone mutations/queries used by the account flow and the AI coach.
 * Thin wrappers that resolve auth and forward to agoge's zones API.
 *
 * Same-day re-saves patch the existing record instead of creating history rows.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const zoneKind = v.union(v.literal("hr"), v.literal("pace"));

export const listCurrentZones = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return null;
    const [hr, pace] = await Promise.all([
      ctx.runQuery(components.agoge.public.listZones, {
        athleteId: athlete._id,
        kind: "hr" as const,
      }),
      ctx.runQuery(components.agoge.public.listZones, {
        athleteId: athlete._id,
        kind: "pace" as const,
      }),
    ]);
    return {
      hr: hr[0] ?? null,
      pace: pace[0] ?? null,
    };
  },
});

export const upsertZones = mutation({
  args: {
    kind: zoneKind,
    boundaries: v.array(v.number()),
  },
  handler: async (ctx, { kind, boundaries }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete not found");
    const today = new Date().toISOString().slice(0, 10);
    const existing = await ctx.runQuery(components.agoge.public.listZones, {
      athleteId: athlete._id,
      kind,
    });
    const todaysRecord = existing.find((z) => z.effectiveFrom === today);
    if (todaysRecord) {
      await ctx.runMutation(components.agoge.public.updateZones, {
        zonesId: todaysRecord._id,
        boundaries,
      });
      return todaysRecord._id;
    }
    return await ctx.runMutation(components.agoge.public.addZones, {
      athleteId: athlete._id,
      sport: "run",
      kind,
      boundaries,
      effectiveFrom: today,
    });
  },
});
