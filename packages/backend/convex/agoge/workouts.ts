import { workoutsValidator } from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import {
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import { recordVdotFromCompletedTest } from "../engine/baselineTest";
import {
  fail,
  loadAthlete,
  loadCurrentAthletePlan,
  loadOwnedWorkout,
  push,
  requireAuthError,
  result,
  validateActualDateNotInFuture,
  validateActualFace,
  validateIsoInstantDate,
  validatePlannedDateInBlock,
  validatePlannedDateNotAfterActual,
  validatePlannedFace,
  validateStructureSportMatchesWorkout,
  validateWorkoutStructure,
  validateWorkoutTemplateOwnership,
  validateZonesAvailableForStructure,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const createWorkoutArgs = workoutsValidator
  .omit("athleteId", "planId", "blockId", "templateId")
  .extend({
    blockId: v.optional(v.string()),
    templateId: v.optional(v.string()),
  });

async function validateCreateWorkout(
  ctx: QueryCtx | MutationCtx,
  args: typeof createWorkoutArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);

  const errors: ValidationError[] = [];
  push(errors, validateIsoInstantDate(args.planned?.date, "planned.date"));
  push(errors, validateIsoInstantDate(args.actual?.date, "actual.date"));
  push(errors, validatePlannedFace(args.status, args.planned));
  push(errors, validateActualFace(args.status, args.actual));
  push(errors, validatePlannedDateNotAfterActual(args.planned, args.actual));
  push(errors, validateActualDateNotInFuture(args.actual));
  push(
    errors,
    await validatePlannedDateInBlock(ctx, args.planned?.date, args.blockId),
  );

  if (args.planned?.structure !== undefined) {
    const r = validateWorkoutStructure(args.planned.structure);
    if (!r.ok) push(errors, r.error);
    else {
      push(
        errors,
        validateStructureSportMatchesWorkout(r.structure, args.sport),
      );
      push(
        errors,
        await validateZonesAvailableForStructure(
          ctx,
          auth.athlete._id,
          r.structure,
        ),
      );
    }
  }

  if (args.templateId) {
    push(
      errors,
      await validateWorkoutTemplateOwnership(
        ctx,
        args.templateId,
        auth.athlete._id,
      ),
    );
  }

  return result(errors);
}

const rescheduleArgs = v.object({
  workoutId: v.string(),
  date: v.string(),
});

async function validateRescheduleWorkout(
  ctx: QueryCtx | MutationCtx,
  args: typeof rescheduleArgs.type,
): Promise<ValidationResult> {
  const owned = await loadOwnedWorkout(ctx, args.workoutId);
  if (!owned) return fail([requireAuthError]);
  const { workout } = owned;

  const errors: ValidationError[] = [];
  if (!workout.planned) {
    push(errors, {
      code: "INVALID_STATE",
      message: "Cannot reschedule a workout without a planned face",
    });
  }
  if (workout.status === "completed") {
    push(errors, {
      code: "INVALID_STATE",
      message: "Cannot reschedule a completed workout",
    });
  }
  push(errors, validateIsoInstantDate(args.date, "date"));
  push(
    errors,
    validatePlannedDateNotAfterActual({ date: args.date }, workout.actual),
  );
  push(
    errors,
    await validatePlannedDateInBlock(ctx, args.date, workout.blockId),
  );

  return result(errors);
}

const updateWorkoutArgs = workoutsValidator
  .omit("athleteId", "planId", "blockId", "templateId")
  .partial()
  .extend({
    workoutId: v.string(),
    blockId: v.optional(v.union(v.string(), v.null())),
    templateId: v.optional(v.string()),
  });

async function validateUpdateWorkout(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateWorkoutArgs.type,
): Promise<ValidationResult> {
  const { workoutId, blockId, ...rest } = args;
  const owned = await loadOwnedWorkout(ctx, workoutId);
  if (!owned) return fail([requireAuthError]);
  const { workout: existing } = owned;

  const errors: ValidationError[] = [];
  push(errors, validateIsoInstantDate(rest.planned?.date, "planned.date"));
  push(errors, validateIsoInstantDate(rest.actual?.date, "actual.date"));

  const nextSport = rest.sport ?? existing.sport;

  if (rest.planned?.structure !== undefined) {
    const r = validateWorkoutStructure(rest.planned.structure);
    if (!r.ok) push(errors, r.error);
    else {
      push(
        errors,
        validateStructureSportMatchesWorkout(r.structure, nextSport),
      );
      push(
        errors,
        await validateZonesAvailableForStructure(
          ctx,
          existing.athleteId,
          r.structure,
        ),
      );
    }
  }

  if (rest.templateId) {
    push(
      errors,
      await validateWorkoutTemplateOwnership(
        ctx,
        rest.templateId,
        existing.athleteId,
      ),
    );
  }

  const nextStatus = rest.status ?? existing.status;
  const nextPlanned = rest.planned ?? existing.planned;
  const nextActual = rest.actual ?? existing.actual;
  const nextBlockId =
    blockId === undefined
      ? existing.blockId
      : blockId === null
        ? undefined
        : blockId;

  push(errors, validatePlannedFace(nextStatus, nextPlanned));
  push(errors, validateActualFace(nextStatus, nextActual));
  push(errors, validatePlannedDateNotAfterActual(nextPlanned, nextActual));
  push(errors, validateActualDateNotInFuture(nextActual));
  push(
    errors,
    await validatePlannedDateInBlock(ctx, nextPlanned?.date, nextBlockId),
  );

  return result(errors);
}

const swapArgs = v.object({
  workoutAId: v.string(),
  workoutBId: v.string(),
});

async function validateSwapWorkouts(
  ctx: QueryCtx | MutationCtx,
  args: typeof swapArgs.type,
): Promise<ValidationResult> {
  const [a, b] = await Promise.all([
    loadOwnedWorkout(ctx, args.workoutAId),
    loadOwnedWorkout(ctx, args.workoutBId),
  ]);
  if (!a || !b) return fail([requireAuthError]);

  const errors: ValidationError[] = [];
  if (!a.workout.planned || !b.workout.planned) {
    push(errors, {
      code: "INVALID_STATE",
      message: "Both workouts must have a planned face to be swapped",
    });
    return result(errors);
  }

  push(
    errors,
    validatePlannedDateNotAfterActual(
      { date: b.workout.planned.date },
      a.workout.actual,
    ),
  );
  push(
    errors,
    validatePlannedDateNotAfterActual(
      { date: a.workout.planned.date },
      b.workout.actual,
    ),
  );
  push(
    errors,
    await validatePlannedDateInBlock(
      ctx,
      b.workout.planned.date,
      a.workout.blockId,
    ),
  );
  push(
    errors,
    await validatePlannedDateInBlock(
      ctx,
      a.workout.planned.date,
      b.workout.blockId,
    ),
  );

  return result(errors);
}

export const dryRunCreateWorkout = query({
  args: createWorkoutArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateCreateWorkout(ctx, args),
});

export const dryRunRescheduleWorkout = query({
  args: rescheduleArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateRescheduleWorkout(ctx, args),
});

export const dryRunUpdateWorkout = query({
  args: updateWorkoutArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateUpdateWorkout(ctx, args),
});

export const dryRunSwapWorkouts = query({
  args: swapArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateSwapWorkouts(ctx, args),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

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
    const merged = Array.from(byId.values());
    const refsPerWorkout = await Promise.all(
      merged.map((w) =>
        ctx.runQuery(
          components.agoge.public.getWorkoutProviderRefsByWorkout,
          { workoutId: w._id },
        ),
      ),
    );
    return merged.map((w, i) => ({
      ...w,
      providerRefs: refsPerWorkout[i].map((r) => ({
        provider: r.provider,
        syncedAt: r.syncedAt,
      })),
    }));
  },
});

export const listWorkoutsByBlock = query({
  args: { blockId: v.string() },
  handler: async (ctx, { blockId }) => {
    const result = await loadAthlete(ctx);
    if (!result) return [];
    const block = await ctx.runQuery(components.agoge.public.getBlock, {
      blockId,
    });
    if (!block) return [];
    const plan = await ctx.runQuery(components.agoge.public.getPlan, {
      planId: block.planId,
    });
    if (!plan || plan.athleteId !== result.athlete._id) return [];
    return await ctx.runQuery(components.agoge.public.getWorkoutsByBlock, {
      blockId,
    });
  },
});

export const getWorkout = query({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const result = await loadOwnedWorkout(ctx, workoutId);
    if (!result) return null;
    const { workout } = result;
    const [block, plan, refs] = await Promise.all([
      workout.blockId
        ? ctx.runQuery(components.agoge.public.getBlock, {
            blockId: workout.blockId,
          })
        : null,
      workout.planId
        ? ctx.runQuery(components.agoge.public.getPlan, {
            planId: workout.planId,
          })
        : null,
      ctx.runQuery(components.agoge.public.getWorkoutProviderRefsByWorkout, {
        workoutId: workout._id,
      }),
    ]);
    return {
      workout: {
        ...workout,
        providerRefs: refs.map((r) => ({
          provider: r.provider,
          syncedAt: r.syncedAt,
        })),
      },
      block,
      plan,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createWorkout = mutation({
  args: createWorkoutArgs.fields,
  handler: async (ctx, args): Promise<string> => {
    const validation = await validateCreateWorkout(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });

    // Attach to the current plan only if the workout date sits inside its
    // window. Off-window workouts stay planId-less ("free workouts").
    const current = await loadCurrentAthletePlan(ctx, auth.athlete._id);
    const plannedYmd = args.planned?.date?.slice(0, 10);
    const planId =
      current &&
      plannedYmd &&
      plannedYmd >= current.plan.startDate &&
      plannedYmd <= current.race.date.slice(0, 10)
        ? current.plan._id
        : undefined;

    // Infer block from the planned date when caller didn't pass one. Lets
    // the schedule UI stay block-free while still slotting workouts into the
    // right training block.
    let blockId = args.blockId;
    if (planId && !blockId && plannedYmd) {
      const blocks = await ctx.runQuery(
        components.agoge.public.getBlocksByPlan,
        { planId },
      );
      const containing = blocks.find(
        (b) => plannedYmd >= b.startDate && plannedYmd <= b.endDate,
      );
      if (containing) blockId = containing._id;
    }

    const workoutId = await ctx.runMutation(
      components.agoge.public.createWorkout,
      {
        ...args,
        athleteId: auth.athlete._id,
        planId,
        blockId,
      },
    );

    // Auto-sync to providers disabled — re-enable when ready.
    // await ctx.scheduler.runAfter(
    //   0,
    //   internal.agoge.sync.syncWorkoutToProviders,
    //   { userId: auth.userId, workoutId, operation: "upsert" },
    // );
    return workoutId;
  },
});

export const rescheduleWorkout = mutation({
  args: rescheduleArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateRescheduleWorkout(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const { workoutId, date } = args;
    const owned = await loadOwnedWorkout(ctx, workoutId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    const { userId, workout } = owned;
    const planned = workout.planned;
    if (!planned) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_STATE",
            message: "Cannot reschedule a workout without a planned face",
          },
        ],
      });
    }

    await ctx.runMutation(components.agoge.public.updateWorkout, {
      workoutId,
      planned: { ...planned, date },
    });
    // Auto-sync to providers disabled — re-enable when ready.
    // await ctx.scheduler.runAfter(
    //   0,
    //   internal.agoge.sync.syncWorkoutToProviders,
    //   { userId, workoutId, operation: "upsert" },
    // );
  },
});

export const updateWorkout = mutation({
  args: updateWorkoutArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateUpdateWorkout(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const { workoutId, blockId, ...rest } = args;
    const owned = await loadOwnedWorkout(ctx, workoutId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    const { userId, workout: existing } = owned;
    const nextBlockId =
      blockId === undefined
        ? existing.blockId
        : blockId === null
          ? undefined
          : blockId;

    await ctx.runMutation(components.agoge.public.updateWorkout, {
      ...rest,
      ...(blockId !== undefined ? { blockId: nextBlockId } : {}),
      workoutId,
    });

    // Baseline test completion → record VDOT metric, kick off plan generation.
    const effectiveStatus = rest.status ?? existing.status;
    const effectiveType = rest.type ?? existing.type;
    const justCompleted =
      existing.status !== "completed" && effectiveStatus === "completed";
    if (justCompleted && effectiveType === "test") {
      const effectiveActual = rest.actual ?? existing.actual;
      await recordVdotFromCompletedTest(ctx, {
        athleteId: existing.athleteId,
        planId: existing.planId,
        actual: effectiveActual,
      });
    }

    // Auto-sync to providers disabled — re-enable when ready.
    // await ctx.scheduler.runAfter(
    //   0,
    //   internal.agoge.sync.syncWorkoutToProviders,
    //   { userId, workoutId, operation: "upsert" },
    // );
  },
});

export const swapWorkouts = mutation({
  args: swapArgs.fields,
  handler: async (ctx, { workoutAId, workoutBId }) => {
    const validation = await validateSwapWorkouts(ctx, {
      workoutAId,
      workoutBId,
    });
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: validation.errors,
      });

    const [a, b] = await Promise.all([
      loadOwnedWorkout(ctx, workoutAId),
      loadOwnedWorkout(ctx, workoutBId),
    ]);
    if (!a || !b)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    const plannedA = a.workout.planned;
    const plannedB = b.workout.planned;
    if (!plannedA || !plannedB) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_STATE",
            message: "Both workouts must have a planned face to be swapped",
          },
        ],
      });
    }

    await Promise.all([
      ctx.runMutation(components.agoge.public.updateWorkout, {
        workoutId: workoutAId,
        planned: { ...plannedA, date: plannedB.date },
      }),
      ctx.runMutation(components.agoge.public.updateWorkout, {
        workoutId: workoutBId,
        planned: { ...plannedB, date: plannedA.date },
      }),
    ]);
    // Auto-sync to providers disabled — re-enable when ready.
    // await Promise.all([
    //   ctx.scheduler.runAfter(0, internal.agoge.sync.syncWorkoutToProviders, {
    //     userId: a.userId,
    //     workoutId: workoutAId,
    //     operation: "upsert",
    //   }),
    //   ctx.scheduler.runAfter(0, internal.agoge.sync.syncWorkoutToProviders, {
    //     userId: a.userId,
    //     workoutId: workoutBId,
    //     operation: "upsert",
    //   }),
    // ]);
  },
});

export const deleteWorkout = mutation({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const owned = await loadOwnedWorkout(ctx, workoutId);
    if (!owned) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    }
    await ctx.runMutation(components.agoge.public.deleteWorkout, { workoutId });
    // Auto-sync to providers disabled — re-enable when ready.
    // const { userId } = owned;
    // const ref = await ctx.runQuery(
    //   components.agoge.public.getWorkoutProviderRef,
    //   { workoutId, provider: "garmin" },
    // );
    // if (ref) {
    //   await ctx.scheduler.runAfter(
    //     0,
    //     internal.agoge.sync.syncWorkoutToProviders,
    //     {
    //       userId,
    //       workoutId,
    //       operation: "delete",
    //       deletePayload: {
    //         externalWorkoutId: ref.externalWorkoutId,
    //         externalScheduleId: ref.externalScheduleId,
    //       },
    //     },
    //   );
    // }
  },
});
