/**
 * Race mutations/queries used by the account flow and the AI coach.
 *
 * Since Agoge 1.6.0, a race is a single flat document carrying both the
 * calendar fields (name/date/location/notes) and the entry fields (priority,
 * distance, status, result). This module wraps Agoge's race CRUD with auth
 * and Cadence-specific invariants — the A-race uniqueness guard and the
 * date/status coherence check.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import {
  courseType,
  discipline,
  itraCategory,
  raceFormat,
  raceLocation,
  racePriority,
  raceResult,
  raceStatus,
  type RaceStatus,
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
  const races = await ctx.runQuery(
    components.agoge.public.getRacesByAthleteAndPriority,
    // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
    { athleteId: athleteId as any, priority: "A" as const },
  );
  return races
    .filter((r) => r.status === "upcoming")
    .map((r) => ({ raceId: r._id, name: r.name, date: r.date }));
}

export const listMyRaces = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    return await ctx.runQuery(components.agoge.public.getRacesByAthlete, {
      athleteId: athlete._id,
    });
  },
});

export const getMyRace = query({
  args: { raceId: v.string() },
  handler: async (ctx, { raceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      raceId: raceId as any,
    });
    if (!race) return null;
    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: race.athleteId,
    });
    if (!athlete || athlete.userId !== userId) return null;
    return race;
  },
});

export const createMyRace = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    priority: racePriority,
    discipline,
    format: v.optional(raceFormat),
    distanceMeters: v.number(),
    status: raceStatus,
    location: v.optional(raceLocation),
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
  handler: async (ctx, { demoteExistingARaceId, ...args }) => {
    const athlete = await requireAthlete(ctx);
    assertDateStatusCoherent(args.date, args.status);

    if (args.priority === "A" && args.status === "upcoming") {
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
        await ctx.runMutation(components.agoge.public.updateRace, {
          // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
          raceId: target.raceId as any,
          priority: "B",
        });
      }
    }

    return await ctx.runMutation(components.agoge.public.createRace, {
      athleteId: athlete._id,
      sport: "run" as const,
      ...args,
    });
  },
});

export const updateMyRace = mutation({
  args: {
    raceId: v.string(),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    priority: v.optional(racePriority),
    discipline: v.optional(discipline),
    format: v.optional(raceFormat),
    distanceMeters: v.optional(v.number()),
    status: v.optional(raceStatus),
    location: v.optional(raceLocation),
    notes: v.optional(v.string()),
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
  handler: async (ctx, { raceId, demoteExistingARaceId, ...patch }) => {
    const athlete = await requireAthlete(ctx);
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      raceId: raceId as any,
    });
    if (!race || race.athleteId !== athlete._id) {
      throw new Error("Race not found");
    }

    const effectiveDate = patch.date ?? race.date;
    const effectivePriority = patch.priority ?? race.priority;
    const effectiveStatus: RaceStatus = patch.status ?? race.status;
    assertDateStatusCoherent(effectiveDate, effectiveStatus);

    if (effectivePriority === "A" && effectiveStatus === "upcoming") {
      const conflicts = (await fetchUpcomingARaces(ctx, athlete._id)).filter(
        (c) => c.raceId !== race._id,
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
        await ctx.runMutation(components.agoge.public.updateRace, {
          // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
          raceId: target.raceId as any,
          priority: "B",
        });
      }
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
    const athlete = await requireAthlete(ctx);
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      raceId: raceId as any,
    });
    if (!race || race.athleteId !== athlete._id) {
      throw new Error("Race not found");
    }
    await ctx.runMutation(components.agoge.public.deleteRace, {
      raceId: race._id,
    });
    return null;
  },
});
