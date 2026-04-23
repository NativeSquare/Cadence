/**
 * Workout-template queries/mutations for the account flow.
 *
 * Scope: list/read/rename/retag/describe/delete. Structure (step tree) is
 * authored through the AI coach's tools, not this UI, so no create/update
 * paths for `structure` are exposed here.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

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
    return await ctx.runQuery(components.agoge.public.listWorkoutTemplates, {
      athleteId: athlete._id,
    });
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
    // Global templates (no athleteId) are readable by anyone authed.
    if (template.athleteId == null) return template;
    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: template.athleteId,
    });
    if (!athlete || athlete.userId !== userId) return null;
    return template;
  },
});

export const updateMyTemplateMetadata = mutation({
  args: {
    templateId: v.string(),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
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
    await ctx.runMutation(components.agoge.public.updateWorkoutTemplate, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      templateId: templateId as any,
      ...patch,
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
