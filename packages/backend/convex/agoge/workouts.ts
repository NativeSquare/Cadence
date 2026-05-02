import { workoutsValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import {
  assertActualDateNotInFuture,
  assertActualFace,
  assertAthlete,
  assertAthletePlan,
  assertFaceDatesAreUtc,
  assertPlannedDateNotAfterActual,
  assertPlannedFace,
  assertStructureSportMatchesWorkout,
  assertUtcDate,
  assertWorkoutOwnership,
  assertWorkoutStructure,
  assertWorkoutTemplateOwnership,
  assertZonesAvailableForStructure,
  loadAthlete,
  loadOwnedWorkout,
} from "./helpers";

export const listWorkouts = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, { startDate, endDate }) => {
    const result = await loadAthlete(ctx);
    if (!result) return [];
    const { athlete } = result;
    const [planned, completed] = await Promise.all([
      ctx.runQuery(components.agoge.public.getPlannedWorkoutsByAthlete, {
        athleteId: athlete._id,
        startDate,
        endDate,
      }),
      ctx.runQuery(components.agoge.public.getCompletedWorkoutsByAthlete, {
        athleteId: athlete._id,
        startDate,
        endDate,
      }),
    ]);
    const byId = new Map<string, (typeof planned)[number]>();
    for (const w of planned) byId.set(w._id, w);
    for (const w of completed) byId.set(w._id, w);
    return Array.from(byId.values());
  },
});

export const getWorkout = query({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const result = await loadOwnedWorkout(ctx, workoutId);
    return result?.workout ?? null;
  },
});

export const createWorkout = mutation({
  args: workoutsValidator.omit("athleteId", "planId"),
  handler: async (ctx, args) => {
    const { userId, athlete } = await assertAthlete(ctx);
    const plan = await assertAthletePlan(ctx, athlete._id);

    assertPlannedFace(args.status, args.planned);
    assertActualFace(args.status, args.actual);
    assertFaceDatesAreUtc(args.planned, args.actual);
    assertPlannedDateNotAfterActual(args.planned, args.actual);
    assertActualDateNotInFuture(args.actual);

    if (args.planned?.structure !== undefined) {
      const parsed = assertWorkoutStructure(args.planned.structure);
      assertStructureSportMatchesWorkout(parsed, args.sport);
      await assertZonesAvailableForStructure(ctx, athlete._id, parsed);
    }
    if (args.actual?.structure !== undefined) {
      const parsed = assertWorkoutStructure(args.actual.structure);
      assertStructureSportMatchesWorkout(parsed, args.sport);
      await assertZonesAvailableForStructure(ctx, athlete._id, parsed);
    }

    if (args.templateId) {
      await assertWorkoutTemplateOwnership(ctx, args.templateId, athlete._id);
    }

    const workoutId = await ctx.runMutation(
      components.agoge.public.createWorkout,
      {
        ...args,
        athleteId: athlete._id,
        planId: plan._id,
      },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.agoge.sync.syncWorkoutToProviders,
      { userId, workoutId, operation: "upsert" },
    );
    return workoutId;
  },
});

export const rescheduleWorkout = mutation({
  args: { workoutId: v.string(), date: v.string() },
  handler: async (ctx, { workoutId, date }) => {
    const { userId, workout } = await assertWorkoutOwnership(ctx, workoutId);
    if (!workout.planned) {
      throw new Error("Cannot reschedule a workout without a planned face");
    }
    if (workout.status === "completed") {
      throw new Error("Cannot reschedule a completed workout");
    }
    assertUtcDate(date, "date");
    assertPlannedDateNotAfterActual({ date }, workout.actual);

    await ctx.runMutation(components.agoge.public.updateWorkout, {
      workoutId: workoutId,
      planned: { ...workout.planned, date },
    });
    await ctx.scheduler.runAfter(
      0,
      internal.agoge.sync.syncWorkoutToProviders,
      { userId, workoutId, operation: "upsert" },
    );
  },
});

export const updateWorkout = mutation({
  args: workoutsValidator
    .omit("athleteId", "planId")
    .partial()
    .extend({ workoutId: v.string() }),
  handler: async (ctx, args) => {
    const { workoutId, ...rest } = args;
    const { userId, workout: existing } = await assertWorkoutOwnership(
      ctx,
      workoutId,
    );

    assertFaceDatesAreUtc(rest.planned, rest.actual);

    const nextSport = rest.sport ?? existing.sport;

    if (rest.planned?.structure !== undefined) {
      const parsed = assertWorkoutStructure(rest.planned.structure);
      assertStructureSportMatchesWorkout(parsed, nextSport);
      await assertZonesAvailableForStructure(
        ctx,
        existing.athleteId,
        parsed,
      );
    }
    if (rest.actual?.structure !== undefined) {
      const parsed = assertWorkoutStructure(rest.actual.structure);
      assertStructureSportMatchesWorkout(parsed, nextSport);
      await assertZonesAvailableForStructure(
        ctx,
        existing.athleteId,
        parsed,
      );
    }

    if (rest.templateId) {
      await assertWorkoutTemplateOwnership(
        ctx,
        rest.templateId,
        existing.athleteId,
      );
    }

    const nextStatus = rest.status ?? existing.status;
    const nextPlanned = rest.planned ?? existing.planned;
    const nextActual = rest.actual ?? existing.actual;

    assertPlannedFace(nextStatus, nextPlanned);
    assertActualFace(nextStatus, nextActual);
    assertPlannedDateNotAfterActual(nextPlanned, nextActual);
    assertActualDateNotInFuture(nextActual);

    await ctx.runMutation(components.agoge.public.updateWorkout, {
      ...rest,
      workoutId,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.agoge.sync.syncWorkoutToProviders,
      { userId, workoutId, operation: "upsert" },
    );
  },
});

export const swapWorkouts = mutation({
  args: { workoutAId: v.string(), workoutBId: v.string() },
  handler: async (ctx, { workoutAId, workoutBId }) => {
    const [{ userId, workout: a }, { workout: b }] = await Promise.all([
      assertWorkoutOwnership(ctx, workoutAId),
      assertWorkoutOwnership(ctx, workoutBId),
    ]);
    if (!a.planned || !b.planned) {
      throw new Error("Both workouts must have a planned face to be swapped");
    }
    assertPlannedDateNotAfterActual({ date: b.planned.date }, a.actual);
    assertPlannedDateNotAfterActual({ date: a.planned.date }, b.actual);

    await Promise.all([
      ctx.runMutation(components.agoge.public.updateWorkout, {
        workoutId: workoutAId,
        planned: { ...a.planned, date: b.planned.date },
      }),
      ctx.runMutation(components.agoge.public.updateWorkout, {
        workoutId: workoutBId,
        planned: { ...b.planned, date: a.planned.date },
      }),
    ]);
    await Promise.all([
      ctx.scheduler.runAfter(
        0,
        internal.agoge.sync.syncWorkoutToProviders,
        { userId, workoutId: workoutAId, operation: "upsert" },
      ),
      ctx.scheduler.runAfter(
        0,
        internal.agoge.sync.syncWorkoutToProviders,
        { userId, workoutId: workoutBId, operation: "upsert" },
      ),
    ]);
  },
});

export const deleteWorkout = mutation({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const { userId } = await assertWorkoutOwnership(ctx, workoutId);
    const ref = await ctx.runQuery(
      components.agoge.public.getWorkoutProviderRef,
      { workoutId, provider: "garmin" },
    );
    await ctx.runMutation(components.agoge.public.deleteWorkout, {
      workoutId: workoutId,
    });
    if (ref) {
      await ctx.scheduler.runAfter(
        0,
        internal.agoge.sync.syncWorkoutToProviders,
        {
          userId,
          workoutId,
          operation: "delete",
          deletePayload: {
            externalWorkoutId: ref.externalWorkoutId,
            externalScheduleId: ref.externalScheduleId,
          },
        },
      );
    }
  },
});
