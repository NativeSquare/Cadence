/**
 * Event/race mutations/queries used by the account flow and the AI coach.
 *
 * In Agoge 1.2.0, an "event" is a calendar occurrence (name + date + location)
 * and a "race" is the runner's entry into that event (distance, priority,
 * status, result). From the user's point of view the two are one thing, so we
 * expose a flattened shape: `{ ...event, raceId, priority, distanceMeters,
 * status, ...raceFields, result }` and write to both tables in lockstep.
 *
 * The native UI surface for these calls is called "Races"
 * (apps/native/src/app/(app)/account/races/). The Convex function names keep
 * the "event" prefix for historical reasons and to avoid churning
 * TransitionScreen.tsx and the generated API types.
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
const courseType = v.union(
  v.literal("loop"),
  v.literal("point_to_point"),
  v.literal("out_and_back"),
  v.literal("laps"),
  v.literal("other"),
);
const surface = v.union(
  v.literal("pavement"),
  v.literal("mixed"),
  v.literal("trail"),
  v.literal("technical_trail"),
  v.literal("track"),
  v.literal("other"),
);
const locationArg = v.object({
  city: v.optional(v.string()),
  country: v.optional(v.string()),
  venue: v.optional(v.string()),
});
const resultArg = v.object({
  finishTime: v.optional(v.string()),
  finishTimeSec: v.optional(v.number()),
  placement: v.optional(v.number()),
  notes: v.optional(v.string()),
});

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

type EventDoc = {
  _id: string;
  athleteId: string;
  name: string;
  date: string;
  location?: {
    city?: string;
    country?: string;
    venue?: string;
    lat?: number;
    lng?: number;
  };
  notes?: string;
};
type RaceDoc = {
  _id: string;
  eventId: string;
  priority: "A" | "B" | "C";
  distanceMeters: number;
  status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
  elevationGainMeters?: number;
  courseType?: "loop" | "point_to_point" | "out_and_back" | "laps" | "other";
  surface?:
    | "pavement"
    | "mixed"
    | "trail"
    | "technical_trail"
    | "track"
    | "other";
  bibNumber?: string;
  registrationUrl?: string;
  result?: {
    finishTime?: string;
    finishTimeSec?: number;
    placement?: number;
    notes?: string;
  };
};

function flatten(event: EventDoc & Record<string, unknown>, race: RaceDoc | null) {
  return {
    ...event,
    raceId: race?._id ?? null,
    priority: (race?.priority ?? "B") as "A" | "B" | "C",
    distanceMeters: race?.distanceMeters,
    status: (race?.status ?? "upcoming") as RaceDoc["status"],
    elevationGainMeters: race?.elevationGainMeters,
    courseType: race?.courseType,
    surface: race?.surface,
    bibNumber: race?.bibNumber,
    registrationUrl: race?.registrationUrl,
    result: race?.result,
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
    status: v.optional(raceStatus),
    location: v.optional(locationArg),
    notes: v.optional(v.string()),
    elevationGainMeters: v.optional(v.number()),
    courseType: v.optional(courseType),
    surface: v.optional(surface),
    bibNumber: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      name,
      date,
      priority,
      distanceMeters,
      status,
      location,
      notes,
      elevationGainMeters,
      courseType: courseTypeArg,
      surface: surfaceArg,
      bibNumber,
      registrationUrl,
    },
  ) => {
    const athlete = await requireAthlete(ctx);
    const eventId = await ctx.runMutation(components.agoge.public.createEvent, {
      athleteId: athlete._id,
      sport: "run" as const,
      type: "race" as const,
      name,
      date,
      location,
      notes,
    });
    if (distanceMeters != null) {
      await ctx.runMutation(components.agoge.public.createRace, {
        athleteId: athlete._id,
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        eventId: eventId as any,
        priority,
        distanceMeters,
        status: status ?? "upcoming",
        elevationGainMeters,
        courseType: courseTypeArg,
        surface: surfaceArg,
        bibNumber,
        registrationUrl,
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
    location: v.optional(locationArg),
    notes: v.optional(v.string()),
    status: v.optional(raceStatus),
    elevationGainMeters: v.optional(v.number()),
    courseType: v.optional(courseType),
    surface: v.optional(surface),
    bibNumber: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
    result: v.optional(resultArg),
  },
  handler: async (ctx, args) => {
    const {
      eventId,
      priority,
      distanceMeters,
      status,
      elevationGainMeters,
      courseType: courseTypeArg,
      surface: surfaceArg,
      bibNumber,
      registrationUrl,
      result,
      ...eventPatch
    } = args;
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
    });

    const racePatch = {
      ...(priority !== undefined ? { priority } : {}),
      ...(distanceMeters !== undefined ? { distanceMeters } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(elevationGainMeters !== undefined ? { elevationGainMeters } : {}),
      ...(courseTypeArg !== undefined ? { courseType: courseTypeArg } : {}),
      ...(surfaceArg !== undefined ? { surface: surfaceArg } : {}),
      ...(bibNumber !== undefined ? { bibNumber } : {}),
      ...(registrationUrl !== undefined ? { registrationUrl } : {}),
      ...(result !== undefined ? { result } : {}),
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
        elevationGainMeters,
        courseType: courseTypeArg,
        surface: surfaceArg,
        bibNumber,
        registrationUrl,
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
