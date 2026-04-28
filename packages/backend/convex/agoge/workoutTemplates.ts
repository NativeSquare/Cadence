/**
 * Workout-template queries/mutations for the account flow.
 *
 * The athlete owns their templates end-to-end here: list, read, create, update
 * (metadata + step tree), delete. Because Agoge stores `content.structure` as
 * v.any() with no DB-level enforcement, every write runs through
 * safeParseWorkout (Agoge's canonical Zod schema) and throws
 * ConvexError({ code: "INVALID_STRUCTURE" }) on failure.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { safeParseWorkout, type Workout } from "@nativesquare/agoge";
import { subSport, workoutType } from "@nativesquare/agoge/schema";
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

function validateStructure(raw: unknown): Workout {
  const result = safeParseWorkout(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".") ?? "structure";
    throw new ConvexError({
      code: "INVALID_STRUCTURE",
      message: `${path}: ${first?.message ?? "invalid workout structure"}`,
    });
  }
  return result.data;
}

const contentValidator = v.object({
  structure: v.optional(v.any()),
  durationSeconds: v.optional(v.number()),
  distanceMeters: v.optional(v.number()),
  load: v.optional(v.number()),
  avgPaceMps: v.optional(v.number()),
  avgHr: v.optional(v.number()),
  maxHr: v.optional(v.number()),
  elevationGainMeters: v.optional(v.number()),
  rpe: v.optional(v.number()),
  notes: v.optional(v.string()),
});

export const listMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    return await ctx.runQuery(
      components.agoge.public.getWorkoutTemplatesByAthlete,
      { athleteId: athlete._id },
    );
  },
});

export const getMyTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const template = await ctx.runQuery(
      components.agoge.public.getWorkoutTemplate,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      { templateId: templateId as any },
    );
    if (!template) return null;
    if (template.athleteId == null) return template;
    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: template.athleteId,
    });
    if (!athlete || athlete.userId !== userId) return null;
    return template;
  },
});

export const createMyTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: workoutType,
    typeNotes: v.optional(v.string()),
    subSport: v.optional(subSport),
    content: contentValidator,
  },
  handler: async (ctx, args) => {
    const athlete = await requireAthlete(ctx);
    const validatedStructure =
      args.content.structure !== undefined
        ? validateStructure(args.content.structure)
        : undefined;
    return await ctx.runMutation(
      components.agoge.public.createWorkoutTemplate,
      {
        athleteId: athlete._id,
        name: args.name,
        description: args.description,
        type: args.type,
        typeNotes: args.typeNotes,
        sport: "run",
        subSport: args.subSport,
        content: { ...args.content, structure: validatedStructure },
      },
    );
  },
});

export const updateMyTemplate = mutation({
  args: {
    templateId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(workoutType),
    typeNotes: v.optional(v.string()),
    subSport: v.optional(subSport),
    content: v.optional(contentValidator),
  },
  handler: async (ctx, { templateId, ...patch }) => {
    const athlete = await requireAthlete(ctx);
    const template = await ctx.runQuery(
      components.agoge.public.getWorkoutTemplate,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      { templateId: templateId as any },
    );
    if (!template || template.athleteId !== athlete._id) {
      throw new Error("Template not found");
    }
    const nextContent =
      patch.content !== undefined
        ? {
            ...patch.content,
            structure:
              patch.content.structure !== undefined
                ? validateStructure(patch.content.structure)
                : undefined,
          }
        : undefined;
    await ctx.runMutation(components.agoge.public.updateWorkoutTemplate, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      templateId: templateId as any,
      ...patch,
      content: nextContent,
    });
    return null;
  },
});

export const deleteMyTemplate = mutation({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const athlete = await requireAthlete(ctx);
    const template = await ctx.runQuery(
      components.agoge.public.getWorkoutTemplate,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      { templateId: templateId as any },
    );
    if (!template || template.athleteId !== athlete._id) {
      throw new Error("Template not found");
    }
    await ctx.runMutation(components.agoge.public.deleteWorkoutTemplate, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      templateId: templateId as any,
    });
    return null;
  },
});
