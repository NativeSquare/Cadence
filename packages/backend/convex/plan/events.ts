/**
 * Event mutations/queries used by the account flow and the AI coach.
 * Thin wrappers that resolve auth + verify ownership and forward to agoge's
 * events API.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const eventPriority = v.union(v.literal("A"), v.literal("B"), v.literal("C"));

async function requireAthlete(
  // biome-ignore lint/suspicious/noExplicitAny: context union is verbose
  ctx: any,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) throw new Error("Athlete not found");
  return athlete;
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
    return await ctx.runQuery(components.agoge.public.listEvents, {
      athleteId: athlete._id,
    });
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
    return event;
  },
});

export const createMyEvent = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    priority: eventPriority,
    distanceMeters: v.optional(v.number()),
    goalTimeSeconds: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, patch) => {
    const athlete = await requireAthlete(ctx);
    return await ctx.runMutation(components.agoge.public.createEvent, {
      athleteId: athlete._id,
      sport: "run" as const,
      ...patch,
    });
  },
});

export const updateMyEvent = mutation({
  args: {
    eventId: v.string(),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    priority: v.optional(eventPriority),
    distanceMeters: v.optional(v.number()),
    goalTimeSeconds: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, ...patch }) => {
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
      ...patch,
    });
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
    await ctx.runMutation(components.agoge.public.deleteEvent, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      eventId: eventId as any,
    });
    return null;
  },
});
