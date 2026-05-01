import { racesValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import {
  assertAthlete,
  assertNoUpcomingARaceConflict,
  assertRaceDateStatusCoherent,
  assertRaceOwnership,
  assertUtcDate,
  loadAthlete,
  loadOwnedRace,
} from "./helpers";

export const listMyRaces = query({
  args: {},
  handler: async (ctx) => {
    const result = await loadAthlete(ctx);
    if (!result) return [];
    return await ctx.runQuery(components.agoge.public.getRacesByAthlete, {
      athleteId: result.athlete._id,
    });
  },
});

export const getMyRace = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const result = await loadOwnedRace(ctx, raceId);
    return result?.race ?? null;
  },
});

export const createMyRace = mutation({
  args: racesValidator.omit("athleteId", "sport"),
  handler: async (ctx, args) => {
    const { athlete } = await assertAthlete(ctx);
    assertUtcDate(args.date, "date");
    assertRaceDateStatusCoherent(args.date, args.status);

    if (args.priority === "A" && args.status === "upcoming") {
      await assertNoUpcomingARaceConflict(ctx, athlete._id);
    }

    return await ctx.runMutation(components.agoge.public.createRace, {
      ...args,
      athleteId: athlete._id,
      sport: "run",
    });
  },
});

export const updateMyRace = mutation({
  args: racesValidator
    .omit("athleteId", "sport")
    .partial()
    .extend({ raceId: v.string() }),
  handler: async (ctx, args) => {
    const { raceId, ...patch } = args;
    const { athlete } = await assertAthlete(ctx);
    const race = await assertRaceOwnership(ctx, raceId, athlete._id);

    if (patch.date) assertUtcDate(patch.date, "date");

    const effectiveDate = patch.date ?? race.date;
    const effectivePriority = patch.priority ?? race.priority;
    const effectiveStatus = patch.status ?? race.status;
    assertRaceDateStatusCoherent(effectiveDate, effectiveStatus);

    if (effectivePriority === "A" && effectiveStatus === "upcoming") {
      await assertNoUpcomingARaceConflict(ctx, athlete._id, {
        excludeRaceId: race._id,
      });
    }

    await ctx.runMutation(components.agoge.public.updateRace, {
      raceId: race._id,
      ...patch,
    });
    return null;
  },
});

export const deleteMyRace = mutation({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const { athlete } = await assertAthlete(ctx);
    const race = await assertRaceOwnership(ctx, raceId, athlete._id);
    await ctx.runMutation(components.agoge.public.deleteRace, {
      raceId: race._id,
    });
    return null;
  },
});
