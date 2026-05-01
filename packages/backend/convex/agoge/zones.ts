import { zonesValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import {
  assertAthlete,
  assertZoneBoundariesExtremes,
  assertZoneBoundariesLength,
  assertZoneBoundariesOrder,
  assertZoneOwnership,
  loadAthlete,
} from "./helpers";

export const listAthleteZones = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    const [hr, pace] = await Promise.all([
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: auth.athlete._id,
        kind: "hr",
      }),
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: auth.athlete._id,
        kind: "pace",
      }),
    ]);
    return [hr, pace].filter((z): z is NonNullable<typeof z> => z !== null);
  },
});

export const createZone = mutation({
  args: zonesValidator.omit("athleteId", "sport"),
  handler: async (ctx, args) => {
    const { athlete } = await assertAthlete(ctx);
    assertZoneBoundariesLength(args.boundaries);
    assertZoneBoundariesExtremes(args.boundaries);
    assertZoneBoundariesOrder(args.boundaries);
    return await ctx.runMutation(components.agoge.public.createZone, {
      ...args,
      athleteId: athlete._id,
      sport: "run",
    });
  },
});

export const updateZone = mutation({
  args: zonesValidator
    .omit("athleteId", "sport")
    .partial()
    .extend({ zoneId: v.string() }),
  handler: async (ctx, args) => {
    const { zoneId, ...patch } = args;
    const { athlete } = await assertAthlete(ctx);
    await assertZoneOwnership(ctx, zoneId, athlete._id);
    if (patch.boundaries !== undefined) {
      assertZoneBoundariesLength(patch.boundaries);
      assertZoneBoundariesExtremes(patch.boundaries);
      assertZoneBoundariesOrder(patch.boundaries);
    }
    await ctx.runMutation(components.agoge.public.updateZone, {
      zoneId,
      ...patch,
    });
    return null;
  },
});

export const deleteZone = mutation({
  args: { zoneId: v.string() },
  handler: async (ctx, { zoneId }) => {
    const { athlete } = await assertAthlete(ctx);
    await assertZoneOwnership(ctx, zoneId, athlete._id);
    await ctx.runMutation(components.agoge.public.deleteZone, { zoneId });
    return null;
  },
});
