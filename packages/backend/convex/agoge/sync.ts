import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { type ActionCtx, internalAction } from "../_generated/server";
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
    console.log(`${tag} start`);

    const connection = await ctx.runQuery(
      internal.soma.index.getConnectionByProvider,
      { userId, provider: "GARMIN" },
    );
    if (!connection) {
      console.log(`${tag} skip: no Garmin connection`);
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

    if (operation === "delete" && !deletePayload) {
      console.error(`${tag} delete called without deletePayload`);
      return null;
    }

    try {
      if (operation === "upsert") {
        await syncUpsert(ctx, { tag, workoutId, accessToken });
      } else if (deletePayload) {
        await syncDelete(ctx, {
          tag,
          workoutId,
          accessToken,
          ...deletePayload,
        });
      }
      console.log(`${tag} done`);
    } catch (error) {
      console.error(`${tag} failed`, error);
    }

    return null;
  },
});

async function syncUpsert(
  ctx: ActionCtx,
  {
    tag,
    workoutId,
    accessToken,
  }: { tag: string; workoutId: string; accessToken: string },
): Promise<void> {
  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    workoutId,
  });
  if (!workout) {
    console.error(`${tag} workout missing on upsert`);
    return;
  }

  const structure = workout.planned?.structure ?? workout.actual?.structure;
  if (!structure) {
    console.log(`${tag} skip: no structured plan to sync`);
    return;
  }

  const scheduleDate = workout.planned?.date ?? workout.actual?.date;
  if (!scheduleDate) {
    console.log(`${tag} skip: no date on either face`);
    return;
  }

  const ref = await ctx.runQuery(
    components.agoge.public.getWorkoutProviderRef,
    { workoutId, provider: "garmin" },
  );

  if (!ref) {
    console.log(`${tag} create path: no existing Garmin ref`);
    const { workoutId: garminWorkoutId } = await ctx.runAction(
      components.agoge.garmin.public.createWorkout,
      { accessToken, workout: structure },
    );
    console.log(`${tag} created Garmin workout id=${garminWorkoutId}`);

    let garminScheduleId: number | undefined;
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
      console.log(
        `${tag} created Garmin schedule id=${garminScheduleId} date=${scheduleDate}`,
      );
    } catch (error) {
      console.error(`${tag} createSchedule failed`, error);
    }

    await ctx.runMutation(components.agoge.public.upsertWorkoutProviderRef, {
      workoutId,
      provider: "garmin",
      externalWorkoutId: String(garminWorkoutId),
      externalScheduleId:
        garminScheduleId !== undefined ? String(garminScheduleId) : undefined,
      syncedAt: Date.now(),
    });
    console.log(`${tag} provider ref persisted (create)`);
    return;
  }

  console.log(
    `${tag} update path: workout=${ref.externalWorkoutId} schedule=${ref.externalScheduleId ?? "none"}`,
  );
  const externalWorkoutId = Number(ref.externalWorkoutId);
  await ctx.runAction(components.agoge.garmin.public.updateWorkout, {
    accessToken,
    workoutId: externalWorkoutId,
    workout: structure,
  });
  console.log(`${tag} updated Garmin workout id=${externalWorkoutId}`);

  if (ref.externalScheduleId) {
    await ctx.runAction(components.agoge.garmin.public.updateSchedule, {
      accessToken,
      scheduleId: Number(ref.externalScheduleId),
      schedule: {
        workoutId: externalWorkoutId,
        date: scheduleDate,
      },
    });
    console.log(
      `${tag} updated Garmin schedule id=${ref.externalScheduleId} date=${scheduleDate}`,
    );
  } else {
    console.log(`${tag} no externalScheduleId to update — skipping schedule`);
  }

  await ctx.runMutation(components.agoge.public.upsertWorkoutProviderRef, {
    workoutId,
    provider: "garmin",
    externalWorkoutId: ref.externalWorkoutId,
    externalScheduleId: ref.externalScheduleId,
    syncedAt: Date.now(),
  });
  console.log(`${tag} provider ref persisted (update)`);
}

async function syncDelete(
  ctx: ActionCtx,
  args: {
    tag: string;
    workoutId: string;
    accessToken: string;
    externalWorkoutId: string;
    externalScheduleId?: string;
  },
): Promise<void> {
  const { tag } = args;
  if (args.externalScheduleId) {
    await ctx.runAction(components.agoge.garmin.public.deleteSchedule, {
      accessToken: args.accessToken,
      scheduleId: Number(args.externalScheduleId),
    });
    console.log(`${tag} deleted Garmin schedule id=${args.externalScheduleId}`);
  } else {
    console.log(`${tag} no externalScheduleId — skipping schedule delete`);
  }
  await ctx.runAction(components.agoge.garmin.public.deleteWorkout, {
    accessToken: args.accessToken,
    workoutId: Number(args.externalWorkoutId),
  });
  console.log(`${tag} deleted Garmin workout id=${args.externalWorkoutId}`);

  await ctx.runMutation(components.agoge.public.deleteWorkoutProviderRef, {
    workoutId: args.workoutId,
    provider: "garmin",
  });
  console.log(`${tag} provider ref deleted`);
}
