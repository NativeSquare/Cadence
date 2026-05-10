import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import { type ActionCtx, action, internalAction } from "../_generated/server";
import { soma } from "../soma";

export const syncWorkoutToProviders = internalAction({
  args: {
    userId: v.string(),
    workoutId: v.string(),
    operation: v.union(v.literal("upsert"), v.literal("delete")),
    deletePayload: v.optional(
      v.object({
        externalWorkoutId: v.string(),
        externalScheduleId: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { userId, workoutId, operation, deletePayload }) => {
    const tag = `[agoge.sync ${operation} workout=${workoutId} user=${userId}]`;

    if (operation === "upsert") {
      try {
        await upsertGarmin(ctx, { userId, workoutId });
        // future: await upsertCoros(ctx, { userId, workoutId });
      } catch (error) {
        console.error(`${tag} upsert failed`, error);
      }
      return null;
    }

    if (!deletePayload) {
      console.error(`${tag} delete called without deletePayload`);
      return null;
    }

    const connection = await ctx.runQuery(
      internal.soma.index.getConnectionByProvider,
      { userId, provider: "GARMIN" },
    );
    if (!connection) {
      return null;
    }

    let accessToken: string;
    try {
      const token = await soma.garmin.getAccessToken(ctx, { userId });
      accessToken = token.accessToken;
    } catch (error) {
      console.error(`${tag} getAccessToken failed`, error);
      return null;
    }

    try {
      await syncDelete(ctx, {
        workoutId,
        accessToken,
        ...deletePayload,
      });
    } catch (error) {
      console.error(`${tag} failed`, error);
    }

    return null;
  },
});

async function upsertGarmin(
  ctx: ActionCtx,
  { userId, workoutId }: { userId: string; workoutId: string },
): Promise<{
  garminWorkoutId: number;
  garminScheduleId: number | null;
} | null> {
  const tag = `[agoge.upsertGarmin workout=${workoutId} user=${userId}]`;

  const connection = await ctx.runQuery(
    internal.soma.index.getConnectionByProvider,
    { userId, provider: "GARMIN" },
  );
  if (!connection) {
    return null;
  }

  let accessToken: string;
  try {
    const token = await soma.garmin.getAccessToken(ctx, { userId });
    accessToken = token.accessToken;
  } catch (error) {
    console.error(`${tag} getAccessToken failed`, error);
    return null;
  }

  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    workoutId,
  });
  if (!workout) {
    console.error(`${tag} workout missing`);
    return null;
  }

  const structure = workout.planned?.structure ?? workout.actual?.structure;
  if (!structure) {
    return null;
  }

  const scheduleDate = workout.planned?.date ?? workout.actual?.date;
  if (!scheduleDate) {
    return null;
  }

  const ref = await ctx.runQuery(
    components.agoge.public.getWorkoutProviderRef,
    { workoutId, provider: "garmin" },
  );

  if (!ref) {
    const { workoutId: garminWorkoutId } = await ctx.runAction(
      components.agoge.garmin.public.createWorkout,
      { accessToken, workout: structure },
    );

    let garminScheduleId: number | null = null;
    try {
      const scheduled = await ctx.runAction(
        components.agoge.garmin.public.createSchedule,
        {
          accessToken,
          schedule: {
            workoutId: garminWorkoutId,
            date: scheduleDate,
          },
        },
      );
      garminScheduleId = scheduled.scheduleId;
    } catch (error) {
      console.error(`${tag} createSchedule failed`, error);
    }

    await ctx.runMutation(components.agoge.public.upsertWorkoutProviderRef, {
      workoutId,
      provider: "garmin",
      externalWorkoutId: String(garminWorkoutId),
      externalScheduleId:
        garminScheduleId !== null ? String(garminScheduleId) : undefined,
      syncedAt: Date.now(),
    });
    return { garminWorkoutId, garminScheduleId };
  }

  const externalWorkoutId = Number(ref.externalWorkoutId);
  await ctx.runAction(components.agoge.garmin.public.updateWorkout, {
    accessToken,
    workoutId: externalWorkoutId,
    workout: structure,
  });

  const garminScheduleId: number | null = ref.externalScheduleId
    ? Number(ref.externalScheduleId)
    : null;
  if (ref.externalScheduleId) {
    await ctx.runAction(components.agoge.garmin.public.updateSchedule, {
      accessToken,
      scheduleId: Number(ref.externalScheduleId),
      schedule: {
        workoutId: externalWorkoutId,
        date: scheduleDate,
      },
    });
  }

  await ctx.runMutation(components.agoge.public.upsertWorkoutProviderRef, {
    workoutId,
    provider: "garmin",
    externalWorkoutId: ref.externalWorkoutId,
    externalScheduleId: ref.externalScheduleId,
    syncedAt: Date.now(),
  });
  return { garminWorkoutId: externalWorkoutId, garminScheduleId };
}

export const upsertWorkoutToGarmin = action({
  args: { workoutId: v.string() },
  returns: v.object({
    garminWorkoutId: v.number(),
    garminScheduleId: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, { workoutId }) => {
    const userId = await ctx.runQuery(
      internal.soma.index.getAuthenticatedUserId,
    );
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Not signed in",
      });
    }
    const result = await upsertGarmin(ctx, { userId, workoutId });
    if (!result) {
      throw new ConvexError({
        code: "EXPORT_SKIPPED",
        message:
          "Could not export to Garmin. Check that Garmin is connected and the workout has a structured plan.",
      });
    }
    return result;
  },
});

async function syncDelete(
  ctx: ActionCtx,
  args: {
    workoutId: string;
    accessToken: string;
    externalWorkoutId: string;
    externalScheduleId?: string;
  },
): Promise<void> {
  if (args.externalScheduleId) {
    await ctx.runAction(components.agoge.garmin.public.deleteSchedule, {
      accessToken: args.accessToken,
      scheduleId: Number(args.externalScheduleId),
    });
  }
  await ctx.runAction(components.agoge.garmin.public.deleteWorkout, {
    accessToken: args.accessToken,
    workoutId: Number(args.externalWorkoutId),
  });

  await ctx.runMutation(components.agoge.public.deleteWorkoutProviderRef, {
    workoutId: args.workoutId,
    provider: "garmin",
  });
}
