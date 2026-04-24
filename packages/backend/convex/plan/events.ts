/**
 * Event/race mutations/queries used by the account flow and the AI coach.
 *
 * In Agoge 1.2.0, an "event" is a calendar occurrence (name + date + location)
 * and a "race" is the runner's entry into that event (distance, priority,
 * status, result). From the user's point of view the two are one thing, so we
 * expose a flattened shape: `{ ...event, raceId, priority, distanceMeters,
 * status }` and write to both tables in lockstep.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import {
  type MutationCtx,
  type QueryCtx,
  mutation,
  query,
} from "../_generated/server";

const racePriority = v.union(v.literal("A"), v.literal("B"), v.literal("C"));
const raceStatus = v.union(
  v.literal("upcoming"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("dnf"),
  v.literal("dns"),
);

async function requireAthlete(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) throw new Error("Athlete not found");
  return athlete;
}

type EventDoc = { _id: string; athleteId: string; name: string; date: string };
type RaceDoc = {
  _id: string;
  eventId: string;
  priority: "A" | "B" | "C";
  distanceMeters: number;
  status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
};

function flatten(event: EventDoc & Record<string, unknown>, race: RaceDoc | null) {
  return {
    ...event,
    raceId: race?._id ?? null,
    priority: (race?.priority ?? "B") as "A" | "B" | "C",
    distanceMeters: race?.distanceMeters,
    status: (race?.status ?? "upcoming") as RaceDoc["status"],
  };
}

export const listMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    const events = (await ctx.runQuery(
      components.agoge.public.getEventsByAthlete,
      { athleteId: athlete._id },
    )) as Array<EventDoc & Record<string, unknown>>;
    return await Promise.all(
      events.map(async (event) => {
        const races = (await ctx.runQuery(
          components.agoge.public.getRacesByEvent,
          { eventId: event._id },
        )) as RaceDoc[];
        return flatten(event, races[0] ?? null);
      }),
    );
  },
});

export const getMyEvent = query({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const event = await ctx.runQuery(components.agoge.public.getEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
    });
    if (!event) return null;
    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: event.athleteId,
    });
    if (!athlete || athlete.userId !== userId) return null;
    const races = (await ctx.runQuery(
      components.agoge.public.getRacesByEvent,
      { eventId: event._id },
    )) as RaceDoc[];
    return flatten(event, races[0] ?? null);
  },
});

export const createMyEvent = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    priority: racePriority,
    distanceMeters: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { name, date, priority, distanceMeters, location, notes },
  ) => {
    const athlete = await requireAthlete(ctx);
    const eventId = await ctx.runMutation(components.agoge.public.createEvent, {
      athleteId: athlete._id,
      sport: "run" as const,
      type: "race" as const,
      name,
      date,
      location: location ? { city: location } : undefined,
      notes,
    });
    if (distanceMeters != null) {
      await ctx.runMutation(components.agoge.public.createRace, {
        athleteId: athlete._id,
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        eventId: eventId as any,
        priority,
        distanceMeters,
        status: "upcoming" as const,
      });
    }
    return eventId;
  },
});

export const updateMyEvent = mutation({
  args: {
    eventId: v.string(),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    priority: v.optional(racePriority),
    distanceMeters: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(raceStatus),
  },
  handler: async (ctx, args) => {
    const { eventId, priority, distanceMeters, status, location, ...eventPatch } =
      args;
    const athlete = await requireAthlete(ctx);
    const event = await ctx.runQuery(components.agoge.public.getEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
    });
    if (!event || event.athleteId !== athlete._id) {
      throw new Error("Event not found");
    }
    await ctx.runMutation(components.agoge.public.updateEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
      ...eventPatch,
      location: location !== undefined ? { city: location } : undefined,
    });

    const racePatch = {
      ...(priority !== undefined ? { priority } : {}),
      ...(distanceMeters !== undefined ? { distanceMeters } : {}),
      ...(status !== undefined ? { status } : {}),
    };
    if (Object.keys(racePatch).length === 0) return null;

    const races = (await ctx.runQuery(
      components.agoge.public.getRacesByEvent,
      { eventId: event._id },
    )) as RaceDoc[];
    const existingRace = races[0];
    if (existingRace) {
      await ctx.runMutation(components.agoge.public.updateRace, {
        raceId: existingRace._id,
        ...racePatch,
      });
    } else if (distanceMeters !== undefined) {
      await ctx.runMutation(components.agoge.public.createRace, {
        athleteId: athlete._id,
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        eventId: eventId as any,
        priority: priority ?? "B",
        distanceMeters,
        status: status ?? "upcoming",
      });
    }
    return null;
  },
});

export const deleteMyEvent = mutation({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const athlete = await requireAthlete(ctx);
    const event = await ctx.runQuery(components.agoge.public.getEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
    });
    if (!event || event.athleteId !== athlete._id) {
      throw new Error("Event not found");
    }
    // cascadeDeleteEvent removes attached races/goals/plans references.
    await ctx.runMutation(components.agoge.public.deleteEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
    });
    return null;
  },
});
