/**
 * Zone mutations/queries used by the account flow and the AI coach.
 * Thin wrappers that resolve auth and forward to agoge's zones API.
 *
 * Source semantics (Cadence policy):
 *   - "system": boundaries derived from threshold via computeZoneBoundaries.
 *     Threshold edits recompute boundaries.
 *   - "manual": user has explicitly overridden the boundaries.
 *     Threshold edits leave boundaries alone — re-sync to recompute.
 *
 * Same-day re-saves patch the existing record instead of creating history rows.
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

function isManual(zone: { source?: string } | null | undefined): boolean {
  return zone?.source === "manual";
}

function validateBoundaries(boundaries: readonly number[]): void {
  if (boundaries.length !== 6) {
    throw new Error("Zone boundaries must have 6 values (Z1 floor + 4 lower bounds + cap).");
  }
  if (boundaries[0] !== 0) {
    throw new Error("The first boundary must be 0.");
  }
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    if (!Number.isFinite(b) || b < 0) {
      throw new Error("Zone boundaries must be finite and non-negative.");
    }
    if (i > 0 && b <= boundaries[i - 1]) {
      throw new Error("Zone boundaries must be strictly ascending.");
    }
  }
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
    maxHr: v.optional(v.number()),
    restingHr: v.optional(v.number()),
  },
  handler: async (ctx, { kind, threshold, maxHr, restingHr }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete not found");

    const previous = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId: athlete._id, kind },
    );
    // Manual zones persist through threshold edits: keep boundaries + source.
    // System zones recompute from the new threshold.
    const manual = isManual(previous);
    const resolvedBoundaries = manual && previous
      ? previous.boundaries
      : computeZoneBoundaries(kind, threshold, methodForKind(kind)).boundaries;
    const resolvedSource = manual ? "manual" : "system";

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

export const updateZoneBoundaries = mutation({
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

    validateBoundaries(boundaries);

    const previous = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId: athlete._id, kind },
    );

    const today = new Date().toISOString().slice(0, 10);
    const todaysRecord = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteEffectiveFrom,
      { athleteId: athlete._id, kind, effectiveFrom: today },
    );
    if (todaysRecord && todaysRecord.effectiveFrom === today) {
      await ctx.runMutation(components.agoge.public.updateZone, {
        zoneId: todaysRecord._id,
        boundaries,
        source: "manual",
      });
      return todaysRecord._id;
    }
    return await ctx.runMutation(components.agoge.public.createZone, {
      athleteId: athlete._id,
      sport: "run",
      kind,
      boundaries,
      threshold: previous?.threshold,
      source: "manual",
      maxHr: previous?.maxHr,
      restingHr: previous?.restingHr,
      effectiveFrom: today,
    });
  },
});

export const resyncZonesFromThreshold = mutation({
  args: { kind: zoneKind },
  handler: async (ctx, { kind }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete not found");

    const previous = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId: athlete._id, kind },
    );
    if (!previous || previous.threshold === undefined) {
      throw new Error("Set a threshold before re-syncing zones.");
    }

    const resolvedBoundaries = computeZoneBoundaries(
      kind,
      previous.threshold,
      methodForKind(kind),
    ).boundaries;

    const today = new Date().toISOString().slice(0, 10);
    const todaysRecord = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteEffectiveFrom,
      { athleteId: athlete._id, kind, effectiveFrom: today },
    );
    if (todaysRecord && todaysRecord.effectiveFrom === today) {
      await ctx.runMutation(components.agoge.public.updateZone, {
        zoneId: todaysRecord._id,
        boundaries: resolvedBoundaries,
        source: "system",
      });
      return todaysRecord._id;
    }
    return await ctx.runMutation(components.agoge.public.createZone, {
      athleteId: athlete._id,
      sport: "run",
      kind,
      boundaries: resolvedBoundaries,
      threshold: previous.threshold,
      source: "system",
      maxHr: previous.maxHr,
      restingHr: previous.restingHr,
      effectiveFrom: today,
    });
  },
});
