/**
 * Cadence's Agoge integration surface. Agoge owns the training-domain tables
 * (athletes, events, races, plans, ...). This module wraps those primitives
 * with auth and Cadence-specific invariants (e.g. race date coherence).
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { Agoge } from "@nativesquare/agoge";
import {
  eventsValidator,
  racesValidator,
  type RaceStatus,
} from "@nativesquare/agoge/schema";
import { ConvexError } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalQuery, mutation } from "./_generated/server";

const agoge = new Agoge(components.agoge);

export const getAthleteByUserId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await agoge.getAthleteByUserId(ctx, { userId });
  },
});

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function assertDateStatusCoherent(date: string, status: RaceStatus) {
  const today = todayDateString();
  if (status === "upcoming" && date < today) {
    throw new ConvexError({
      message: "An upcoming race cannot have a past date.",
    });
  }
  if (
    (status === "completed" || status === "dnf" || status === "dns") &&
    date > today
  ) {
    throw new ConvexError({
      message: "A completed/DNF/DNS race must have a past or today's date.",
    });
  }
}

export const createRace = mutation({
  args: {
    ...eventsValidator.omit("athleteId", "sport", "type").fields,
    ...racesValidator.omit("athleteId", "eventId", "result").fields,
  },
  handler: async (ctx, args) => {
    const athlete = await ctx.runQuery(internal.agoge.getAthleteByUserId, {});
    if (!athlete) throw new Error("Athlete not found");

    assertDateStatusCoherent(args.date, args.status);

    const eventId = await agoge.createEvent(ctx, {
      athleteId: athlete._id,
      sport: "run",
      type: "race",
      name: args.name,
      date: args.date,
      location: args.location,
      notes: args.notes,
    });

    await agoge.createRace(ctx, {
      athleteId: athlete._id,
      eventId,
      priority: args.priority,
      discipline: args.discipline,
      format: args.format,
      distanceMeters: args.distanceMeters,
      status: args.status,
      elevationGainMeters: args.elevationGainMeters,
      elevationLossMeters: args.elevationLossMeters,
      courseType: args.courseType,
      surface: args.surface,
      itraCategory: args.itraCategory,
      bibNumber: args.bibNumber,
      registrationUrl: args.registrationUrl,
    });

    return eventId;
  },
});
