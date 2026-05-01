import { workoutTemplatesValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import {
  assertAthlete,
  assertWorkoutStructure,
  assertWorkoutTemplateOwnership,
  loadAthlete,
  loadOwnedWorkoutTemplate,
} from "./helpers";

export const listMyWorkoutTemplates = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    return await ctx.runQuery(
      components.agoge.public.getWorkoutTemplatesByAthlete,
      { athleteId: auth.athlete._id },
    );
  },
});

export const getMyWorkoutTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const result = await loadOwnedWorkoutTemplate(ctx, templateId);
    return result?.template ?? null;
  },
});

export const createWorkoutTemplate = mutation({
  args: workoutTemplatesValidator
    .omit("athleteId", "sport"),
  handler: async (ctx, args) => {
    const { athlete } = await assertAthlete(ctx);
    assertWorkoutStructure(args.content.structure)
    return await ctx.runMutation(
      components.agoge.public.createWorkoutTemplate,
      {
        ...args,
        athleteId: athlete._id,
        sport: "run",
      },
    );
  },
});

export const updateWorkoutTemplate = mutation({
  args: workoutTemplatesValidator
    .omit("athleteId", "sport")
    .partial()
    .extend({
      templateId: v.string(),
    }),
  handler: async (ctx, args) => {
    const { templateId, ...patch } = args;
    const { athlete } = await assertAthlete(ctx);
    await assertWorkoutTemplateOwnership(ctx, templateId, athlete._id);
    if (patch.content?.structure !== undefined) {
      assertWorkoutStructure(patch.content.structure);
    }
    await ctx.runMutation(components.agoge.public.updateWorkoutTemplate, {
      templateId,
      ...patch,
    });
    return null;
  },
});

export const deleteWorkoutTemplate = mutation({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const { athlete } = await assertAthlete(ctx);
    await assertWorkoutTemplateOwnership(ctx, templateId, athlete._id);
    await ctx.runMutation(components.agoge.public.deleteWorkoutTemplate, {
      templateId,
    });
    return null;
  },
});
