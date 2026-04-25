/**
 * Event/race mutations/queries used by the account flow and the AI coach.
 *
 * In Agoge, an "event" is a calendar occurrence (name + date + location) and a
 * "race" is the runner's entry into that event (distance, priority, status,
 * result). From the user's point of view the two are one thing, so we expose a
 * flattened shape: `{ ...event, raceId, priority, distanceMeters, status,
 * ...raceFields, result }` and write to both tables in lockstep.
 *
 * The native UI surface for these calls is called "Races"
 * (apps/native/src/app/(app)/account/races/). The Convex function names keep
 * the "event" prefix for historical reasons and to avoid churning
 * TransitionScreen.tsx and the generated API types.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import {
  courseType,
  discipline,
  type Event,
  eventLocation,
  itraCategory,
  type Race,
  raceFormat,
  racePriority,
  raceResult,
  type RaceStatus,
  raceStatus,
  surface,
} from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import {
  type MutationCtx,
  type QueryCtx,
  mutation,
  query,
} from "../_generated/server";

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

async function fetchUpcomingARaces(
  ctx: MutationCtx,
  athleteId: string,
): Promise<Array<{ raceId: string; name: string; date: string }>> {
  const races = (await ctx.runQuery(
    components.agoge.public.getRacesByAthleteAndPriority,
    // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
    { athleteId: athleteId as any, priority: "A" as const },
  )) as RaceDoc[];
  const upcoming = races.filter((r) => r.status === "upcoming");
  return Promise.all(
    upcoming.map(async (race) => {
      const event = (await ctx.runQuery(components.agoge.public.getEvent, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        eventId: race.eventId as any,
      })) as EventDoc | null;
      return {
        raceId: race._id,
        name: event?.name ?? "",
        date: event?.date ?? "",
      };
    }),
  );
}

type EventDoc = Event & { _id: string };
type RaceDoc = Race & { _id: string };

function flatten(event: EventDoc & Record<string, unknown>, race: RaceDoc | null) {
  return {
    ...event,
    raceId: race?._id ?? null,
    priority: (race?.priority ?? "B") as "A" | "B" | "C",
    discipline: race?.discipline,
    format: race?.format,
    distanceMeters: race?.distanceMeters,
    status: (race?.status ?? "upcoming") as RaceDoc["status"],
    elevationGainMeters: race?.elevationGainMeters,
    elevationLossMeters: race?.elevationLossMeters,
    courseType: race?.courseType,
    surface: race?.surface,
    itraCategory: race?.itraCategory,
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
    discipline: v.optional(discipline),
    format: v.optional(raceFormat),
    distanceMeters: v.optional(v.number()),
    status: v.optional(raceStatus),
    location: v.optional(eventLocation),
    notes: v.optional(v.string()),
    elevationGainMeters: v.optional(v.number()),
    elevationLossMeters: v.optional(v.number()),
    courseType: v.optional(courseType),
    surface: v.optional(surface),
    itraCategory: v.optional(itraCategory),
    bibNumber: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
    demoteExistingARaceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      name,
      date,
      priority,
      discipline: disciplineArg,
      format: formatArg,
      distanceMeters,
      status,
      location,
      notes,
      elevationGainMeters,
      elevationLossMeters,
      courseType: courseTypeArg,
      surface: surfaceArg,
      itraCategory: itraCategoryArg,
      bibNumber,
      registrationUrl,
      demoteExistingARaceId,
    },
  ) => {
    const athlete = await requireAthlete(ctx);
    const effectiveStatus: RaceStatus = status ?? "upcoming";

    if (distanceMeters != null) {
      assertDateStatusCoherent(date, effectiveStatus);
    }

    let raceIdToDemote: string | null = null;
    if (
      distanceMeters != null &&
      priority === "A" &&
      effectiveStatus === "upcoming"
    ) {
      const conflicts = await fetchUpcomingARaces(ctx, athlete._id);
      if (conflicts.length > 0) {
        if (!demoteExistingARaceId) {
          throw new ConvexError({
            code: "A_RACE_CONFLICT",
            message: "Another upcoming A race already exists.",
            existing: conflicts,
          });
        }
        const target = conflicts.find(
          (c) => c.raceId === demoteExistingARaceId,
        );
        if (!target) {
          throw new ConvexError({
            message: "Race to demote is no longer an upcoming A race.",
          });
        }
        raceIdToDemote = target.raceId;
      }
    }

    if (raceIdToDemote) {
      await ctx.runMutation(components.agoge.public.updateRace, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        raceId: raceIdToDemote as any,
        priority: "B",
      });
    }

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
        discipline: disciplineArg ?? "road",
        format: formatArg,
        distanceMeters,
        status: effectiveStatus,
        elevationGainMeters,
        elevationLossMeters,
        courseType: courseTypeArg,
        surface: surfaceArg,
        itraCategory: itraCategoryArg,
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
    discipline: v.optional(discipline),
    format: v.optional(raceFormat),
    distanceMeters: v.optional(v.number()),
    location: v.optional(eventLocation),
    notes: v.optional(v.string()),
    status: v.optional(raceStatus),
    elevationGainMeters: v.optional(v.number()),
    elevationLossMeters: v.optional(v.number()),
    courseType: v.optional(courseType),
    surface: v.optional(surface),
    itraCategory: v.optional(itraCategory),
    bibNumber: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
    result: v.optional(raceResult),
    demoteExistingARaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      eventId,
      priority,
      discipline: disciplineArg,
      format: formatArg,
      distanceMeters,
      status,
      elevationGainMeters,
      elevationLossMeters,
      courseType: courseTypeArg,
      surface: surfaceArg,
      itraCategory: itraCategoryArg,
      bibNumber,
      registrationUrl,
      result,
      demoteExistingARaceId,
      ...eventPatch
    } = args;
    const athlete = await requireAthlete(ctx);
    const event = (await ctx.runQuery(components.agoge.public.getEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
    })) as EventDoc | null;
    if (!event || event.athleteId !== athlete._id) {
      throw new Error("Event not found");
    }

    const races = (await ctx.runQuery(
      components.agoge.public.getRacesByEvent,
      { eventId: event._id },
    )) as RaceDoc[];
    const existingRace = races[0];

    const effectiveDate = eventPatch.date ?? event.date;
    const effectivePriority = priority ?? existingRace?.priority ?? "B";
    const effectiveStatus: RaceStatus =
      status ?? existingRace?.status ?? "upcoming";

    if (existingRace || distanceMeters !== undefined) {
      assertDateStatusCoherent(effectiveDate, effectiveStatus);
    }

    let raceIdToDemote: string | null = null;
    if (
      (existingRace || distanceMeters !== undefined) &&
      effectivePriority === "A" &&
      effectiveStatus === "upcoming"
    ) {
      const allConflicts = await fetchUpcomingARaces(ctx, athlete._id);
      const conflicts = allConflicts.filter(
        (c) => c.raceId !== existingRace?._id,
      );
      if (conflicts.length > 0) {
        if (!demoteExistingARaceId) {
          throw new ConvexError({
            code: "A_RACE_CONFLICT",
            message: "Another upcoming A race already exists.",
            existing: conflicts,
          });
        }
        const target = conflicts.find(
          (c) => c.raceId === demoteExistingARaceId,
        );
        if (!target) {
          throw new ConvexError({
            message: "Race to demote is no longer an upcoming A race.",
          });
        }
        raceIdToDemote = target.raceId;
      }
    }

    if (raceIdToDemote) {
      await ctx.runMutation(components.agoge.public.updateRace, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        raceId: raceIdToDemote as any,
        priority: "B",
      });
    }

    await ctx.runMutation(components.agoge.public.updateEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
      ...eventPatch,
    });

    const racePatch = {
      ...(priority !== undefined ? { priority } : {}),
      ...(disciplineArg !== undefined ? { discipline: disciplineArg } : {}),
      ...(formatArg !== undefined ? { format: formatArg } : {}),
      ...(distanceMeters !== undefined ? { distanceMeters } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(elevationGainMeters !== undefined ? { elevationGainMeters } : {}),
      ...(elevationLossMeters !== undefined ? { elevationLossMeters } : {}),
      ...(courseTypeArg !== undefined ? { courseType: courseTypeArg } : {}),
      ...(surfaceArg !== undefined ? { surface: surfaceArg } : {}),
      ...(itraCategoryArg !== undefined
        ? { itraCategory: itraCategoryArg }
        : {}),
      ...(bibNumber !== undefined ? { bibNumber } : {}),
      ...(registrationUrl !== undefined ? { registrationUrl } : {}),
      ...(result !== undefined ? { result } : {}),
    };
    if (Object.keys(racePatch).length === 0) return null;

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
        discipline: disciplineArg ?? "road",
        format: formatArg,
        distanceMeters,
        status: status ?? "upcoming",
        elevationGainMeters,
        elevationLossMeters,
        courseType: courseTypeArg,
        surface: surfaceArg,
        itraCategory: itraCategoryArg,
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
