/**
 * Thin Cadence-owned mutations the AI coach tool-calls into.
 *
 * Each resolves the authed user, verifies ownership of the target workout
 * through its parent athlete, then forwards to `components.agoge.public.*`.
 * The AI produces the write; Cadence just validates auth.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { type MutationCtx, mutation } from "../_generated/server";

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
    structure: v.optional(v.any()),
    targetDurationSeconds: v.optional(v.number()),
    targetDistanceMeters: v.optional(v.number()),
    targetLoad: v.optional(v.number()),
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
    await ctx.runMutation(components.agoge.public.skipWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
    });
  },
});

export const completeWorkout = mutation({
  args: {
    workoutId: v.string(),
    startedAt: v.number(),
    durationSeconds: v.number(),
    distanceMeters: v.optional(v.number()),
    avgPaceMps: v.optional(v.number()),
    avgHr: v.optional(v.number()),
    maxHr: v.optional(v.number()),
    elevationGainMeters: v.optional(v.number()),
    load: v.optional(v.number()),
    rpe: v.optional(v.number()),
    feelNotes: v.optional(v.string()),
    externalRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertWorkoutOwnership(ctx, args.workoutId);
    const { workoutId, ...completed } = args;
    await ctx.runMutation(components.agoge.public.completeWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
      completed,
    });
  },
});

export const submitWorkoutDebrief = mutation({
  args: {
    workoutId: v.string(),
    rpe: v.optional(v.number()),
    feelNotes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { workoutId, rpe, feelNotes, tags }) => {
    await assertWorkoutOwnership(ctx, workoutId);
    const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
    });
    if (!workout?.completed) throw new Error("Workout not completed yet");
    const tagSuffix = tags?.length ? ` ${tags.map((t) => `#${t}`).join(" ")}` : "";
    const composedNotes = feelNotes
      ? `${feelNotes}${tagSuffix}`
      : tagSuffix.trim() || undefined;
    await ctx.runMutation(components.agoge.public.completeWorkout, {
      // biome-ignore lint/suspicious/noExplicitAny: agoge Id is a branded string
      workoutId: workoutId as any,
      completed: {
        ...workout.completed,
        rpe: rpe ?? workout.completed.rpe,
        feelNotes: composedNotes ?? workout.completed.feelNotes,
      },
    });
  },
});
