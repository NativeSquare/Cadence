/**
 * Thin Cadence-owned mutations the AI coach tool-calls into.
 *
 * Each resolves the authed user, verifies ownership of the target workout
 * through its parent athlete, then forwards to `components.agoge.public.*`.
 * The AI produces the write; Cadence just validates auth.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { subSport, workoutType } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { type MutationCtx, mutation, query } from "../_generated/server";
import { ensureAthletePlan } from "./plans";

const workoutFaceArgs = v.object({
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

export const listWorkoutsInRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return [];
    return await ctx.runQuery(components.agoge.public.getWorkoutsByAthlete, {
      athleteId: athlete._id,
      startDate,
      endDate,
    });
  },
});

export const getWorkout = query({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
    });
    if (!workout) return null;
    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: workout.athleteId,
    });
    if (!athlete || athlete.userId !== userId) return null;
    return workout;
  },
});

async function assertWorkoutOwnership(
  ctx: MutationCtx,
  workoutId: string,
): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
    workoutId: workoutId as any,
  });
  if (!workout) throw new Error("Workout not found");
  const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
    athleteId: workout.athleteId,
  });
  if (!athlete || athlete.userId !== userId) {
    throw new Error("Not authorized");
  }
}

export const createWorkout = mutation({
  args: {
    scheduledDate: v.string(),
    name: v.string(),
    type: workoutType,
    status: v.union(v.literal("planned"), v.literal("completed")),
    subSport: v.optional(subSport),
    description: v.optional(v.string()),
    planned: v.optional(workoutFaceArgs),
    actual: v.optional(workoutFaceArgs),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) throw new Error("Athlete not found");

    if (args.status === "completed" && !args.actual) {
      throw new Error("A completed workout must include an `actual` face");
    }

    let templateId: string | undefined;
    if (args.templateId) {
      const template = await ctx.runQuery(
        components.agoge.public.getWorkoutTemplate,
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        { templateId: args.templateId as any },
      );
      if (!template || template.athleteId !== athlete._id) {
        throw new Error("Template not found");
      }
      templateId = args.templateId;
    }

    const plan = await ensureAthletePlan(ctx, athlete._id);

    return await ctx.runMutation(components.agoge.public.createWorkout, {
      athleteId: athlete._id,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      planId: plan._id as any,
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      templateId: templateId as any,
      scheduledDate: args.scheduledDate,
      name: args.name,
      description: args.description,
      type: args.type,
      sport: "run" as const,
      subSport: args.subSport,
      status: args.status,
      planned: args.planned,
      actual: args.actual,
    });
  },
});

export const rescheduleWorkout = mutation({
  args: { workoutId: v.string(), scheduledDate: v.string() },
  handler: async (ctx, { workoutId, scheduledDate }) => {
    await assertWorkoutOwnership(ctx, workoutId);
    await ctx.runMutation(components.agoge.public.updateWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
      scheduledDate,
    });
  },
});

export const modifyWorkout = mutation({
  args: {
    workoutId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledDate: v.optional(v.string()),
    type: v.optional(workoutType),
    subSport: v.optional(subSport),
    status: v.optional(
      v.union(v.literal("planned"), v.literal("completed")),
    ),
    planned: v.optional(workoutFaceArgs),
    actual: v.optional(workoutFaceArgs),
  },
  handler: async (ctx, args) => {
    await assertWorkoutOwnership(ctx, args.workoutId);
    const { workoutId, ...patch } = args;
    await ctx.runMutation(components.agoge.public.updateWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
      ...patch,
    });
  },
});

export const swapWorkouts = mutation({
  args: { workoutAId: v.string(), workoutBId: v.string() },
  handler: async (ctx, { workoutAId, workoutBId }) => {
    await assertWorkoutOwnership(ctx, workoutAId);
    await assertWorkoutOwnership(ctx, workoutBId);
    const [a, b] = await Promise.all([
      ctx.runQuery(components.agoge.public.getWorkout, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        workoutId: workoutAId as any,
      }),
      ctx.runQuery(components.agoge.public.getWorkout, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        workoutId: workoutBId as any,
      }),
    ]);
    if (!a || !b) throw new Error("Workout not found");
    await Promise.all([
      ctx.runMutation(components.agoge.public.updateWorkout, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        workoutId: workoutAId as any,
        scheduledDate: b.scheduledDate,
      }),
      ctx.runMutation(components.agoge.public.updateWorkout, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
        workoutId: workoutBId as any,
        scheduledDate: a.scheduledDate,
      }),
    ]);
  },
});

export const skipWorkout = mutation({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    await assertWorkoutOwnership(ctx, workoutId);
    await ctx.runMutation(components.agoge.public.updateWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
      status: "skipped" as const,
    });
  },
});

export const deleteWorkout = mutation({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    await assertWorkoutOwnership(ctx, workoutId);
    await ctx.runMutation(components.agoge.public.deleteWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
    });
  },
});
