/**
 * Zone mutations/queries used by the account flow and the AI coach.
 * Thin wrappers that resolve auth and forward to agoge's zones API.
 *
 * Same-day re-saves patch the existing record instead of creating history rows.
 * Boundaries are always derived from `threshold` using the fixed 5-zone
 * methodology per kind (coggan-hr for HR, coggan-pace for pace).
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { computeZoneBoundaries, type ZoneMethod } from "@nativesquare/agoge";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const zoneKind = v.union(v.literal("hr"), v.literal("pace"));

function methodForKind(kind: "hr" | "pace"): ZoneMethod {
  return kind === "hr" ? "coggan-hr" : "coggan-pace";
}

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
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: athlete._id,
        kind: "hr" as const,
      }),
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: athlete._id,
        kind: "pace" as const,
      }),
    ]);
    return { hr, pace };
  },
});

export const upsertZones = mutation({
  args: {
    kind: zoneKind,
    threshold: v.number(),
    source: v.optional(v.string()),
    maxHr: v.optional(v.number()),
    restingHr: v.optional(v.number()),
  },
  handler: async (ctx, { kind, threshold, source, maxHr, restingHr }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete not found");

    const resolvedBoundaries = computeZoneBoundaries(
      kind,
      threshold,
      methodForKind(kind),
    ).boundaries;
    const resolvedSource = source ?? "manual";

    const today = new Date().toISOString().slice(0, 10);
    const todaysRecord = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteEffectiveFrom,
      {
        athleteId: athlete._id,
        kind,
        effectiveFrom: today,
      },
    );
    if (todaysRecord && todaysRecord.effectiveFrom === today) {
      await ctx.runMutation(components.agoge.public.updateZone, {
        zoneId: todaysRecord._id,
        boundaries: resolvedBoundaries,
        threshold,
        source: resolvedSource,
        maxHr: maxHr ?? todaysRecord.maxHr,
        restingHr: restingHr ?? todaysRecord.restingHr,
      });
      return todaysRecord._id;
    }
    // Carry forward maxHr/restingHr from the latest prior record if not provided.
    const previous = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId: athlete._id, kind },
    );
    return await ctx.runMutation(components.agoge.public.createZone, {
      athleteId: athlete._id,
      sport: "run",
      kind,
      boundaries: resolvedBoundaries,
      threshold,
      source: resolvedSource,
      maxHr: maxHr ?? previous?.maxHr,
      restingHr: restingHr ?? previous?.restingHr,
      effectiveFrom: today,
    });
  },
});
