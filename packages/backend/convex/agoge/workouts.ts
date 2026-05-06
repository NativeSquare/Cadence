import { workoutsValidator } from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import {
  fail,
  loadActiveAthletePlan,
  loadAthlete,
  loadOwnedWorkout,
  noActivePlanError,
  push,
  requireAuthError,
  result,
  validateActualDateNotInFuture,
  validateActualFace,
  validatePlannedDateInBlock,
  validatePlannedDateNotAfterActual,
  validatePlannedFace,
  validateStructureSportMatchesWorkout,
  validateUtcDate,
  validateWorkoutStructure,
  validateWorkoutTemplateOwnership,
  validateZonesAvailableForStructure,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Reads
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
// Validators (shared between dry-run query and write-time mutation)
// ---------------------------------------------------------------------------

const createWorkoutArgs = workoutsValidator
  .omit("athleteId", "planId", "blockId", "templateId")
  .extend({
    blockId: v.optional(v.string()),
    templateId: v.optional(v.string()),
  });

async function checkCreateWorkout(
  ctx: QueryCtx | MutationCtx,
  args: typeof createWorkoutArgs.type,
  userIdOverride?: string,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx, userIdOverride);
  if (!auth) return fail([requireAuthError]);

  const plan = await loadActiveAthletePlan(ctx, auth.athlete._id);
  if (!plan) return fail([noActivePlanError]);

  const errors: ValidationError[] = [];
  push(errors, validateUtcDate(args.planned?.date, "planned.date"));
  push(errors, validateUtcDate(args.actual?.date, "actual.date"));
  push(errors, validatePlannedFace(args.status, args.planned));
  push(errors, validateActualFace(args.status, args.actual));
  push(
    errors,
    validatePlannedDateNotAfterActual(args.planned, args.actual),
  );
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
  if (args.actual?.structure !== undefined) {
    const r = validateWorkoutStructure(args.actual.structure);
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

async function checkRescheduleWorkout(
  ctx: QueryCtx | MutationCtx,
  args: typeof rescheduleArgs.type,
  userIdOverride?: string,
): Promise<ValidationResult> {
  const owned = await loadOwnedWorkout(ctx, args.workoutId, userIdOverride);
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
  push(errors, validateUtcDate(args.date, "date"));
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

async function checkUpdateWorkout(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateWorkoutArgs.type,
  userIdOverride?: string,
): Promise<ValidationResult> {
  const { workoutId, blockId, ...rest } = args;
  const owned = await loadOwnedWorkout(ctx, workoutId, userIdOverride);
  if (!owned) return fail([requireAuthError]);
  const { workout: existing } = owned;

  const errors: ValidationError[] = [];
  push(errors, validateUtcDate(rest.planned?.date, "planned.date"));
  push(errors, validateUtcDate(rest.actual?.date, "actual.date"));

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
  if (rest.actual?.structure !== undefined) {
    const r = validateWorkoutStructure(rest.actual.structure);
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

async function checkSwapWorkouts(
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

// ---------------------------------------------------------------------------
// Validate queries (AI-tool-callable dry-runs)
// ---------------------------------------------------------------------------

export const validateCreate = query({
  args: createWorkoutArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkCreateWorkout(ctx, args),
});

export const validateReschedule = query({
  args: rescheduleArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkRescheduleWorkout(ctx, args),
});

export const validateUpdate = query({
  args: updateWorkoutArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkUpdateWorkout(ctx, args),
});

export const validateSwap = query({
  args: swapArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkSwapWorkouts(ctx, args),
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function throwIfInvalid(validation: ValidationResult): void {
  if (!validation.ok) {
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: validation.errors,
    });
  }
}

async function performCreateWorkout(
  ctx: MutationCtx,
  args: typeof createWorkoutArgs.type,
  userIdOverride?: string,
): Promise<string> {
  throwIfInvalid(await checkCreateWorkout(ctx, args, userIdOverride));

  const auth = await loadAthlete(ctx, userIdOverride);
  if (!auth) throw new ConvexError({ code: "VALIDATION_FAILED", errors: [requireAuthError] });
  const plan = await loadActiveAthletePlan(ctx, auth.athlete._id);
  if (!plan) throw new ConvexError({ code: "VALIDATION_FAILED", errors: [noActivePlanError] });

  const workoutId = await ctx.runMutation(
    components.agoge.public.createWorkout,
    {
      ...args,
      athleteId: auth.athlete._id,
      planId: plan._id,
    },
  );

  await ctx.scheduler.runAfter(
    0,
    internal.agoge.sync.syncWorkoutToProviders,
    { userId: auth.userId, workoutId, operation: "upsert" },
  );
  return workoutId;
}

async function performRescheduleWorkout(
  ctx: MutationCtx,
  args: typeof rescheduleArgs.type,
  userIdOverride?: string,
): Promise<void> {
  throwIfInvalid(await checkRescheduleWorkout(ctx, args, userIdOverride));

  const { workoutId, date } = args;
  const owned = await loadOwnedWorkout(ctx, workoutId, userIdOverride);
  if (!owned) throw new ConvexError({ code: "VALIDATION_FAILED", errors: [requireAuthError] });
  const { userId, workout } = owned;
  const planned = workout.planned;
  if (!planned) {
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [{ code: "INVALID_STATE", message: "Cannot reschedule a workout without a planned face" }],
    });
  }

  await ctx.runMutation(components.agoge.public.updateWorkout, {
    workoutId,
    planned: { ...planned, date },
  });
  await ctx.scheduler.runAfter(
    0,
    internal.agoge.sync.syncWorkoutToProviders,
    { userId, workoutId, operation: "upsert" },
  );
}

async function performUpdateWorkout(
  ctx: MutationCtx,
  args: typeof updateWorkoutArgs.type,
  userIdOverride?: string,
): Promise<void> {
  throwIfInvalid(await checkUpdateWorkout(ctx, args, userIdOverride));

  const { workoutId, blockId, ...rest } = args;
  const owned = await loadOwnedWorkout(ctx, workoutId, userIdOverride);
  if (!owned) throw new ConvexError({ code: "VALIDATION_FAILED", errors: [requireAuthError] });
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
  await ctx.scheduler.runAfter(
    0,
    internal.agoge.sync.syncWorkoutToProviders,
    { userId, workoutId, operation: "upsert" },
  );
}

export const createWorkout = mutation({
  args: createWorkoutArgs.fields,
  handler: async (ctx, args) => performCreateWorkout(ctx, args),
});

export const rescheduleWorkout = mutation({
  args: rescheduleArgs.fields,
  handler: async (ctx, args) => performRescheduleWorkout(ctx, args),
});

export const updateWorkout = mutation({
  args: updateWorkoutArgs.fields,
  handler: async (ctx, args) => performUpdateWorkout(ctx, args),
});

export const swapWorkouts = mutation({
  args: swapArgs.fields,
  handler: async (ctx, { workoutAId, workoutBId }) => {
    throwIfInvalid(await checkSwapWorkouts(ctx, { workoutAId, workoutBId }));

    const [a, b] = await Promise.all([
      loadOwnedWorkout(ctx, workoutAId),
      loadOwnedWorkout(ctx, workoutBId),
    ]);
    if (!a || !b) throw new ConvexError({ code: "VALIDATION_FAILED", errors: [requireAuthError] });
    const plannedA = a.workout.planned;
    const plannedB = b.workout.planned;
    if (!plannedA || !plannedB) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [{ code: "INVALID_STATE", message: "Both workouts must have a planned face to be swapped" }],
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
    await Promise.all([
      ctx.scheduler.runAfter(0, internal.agoge.sync.syncWorkoutToProviders, {
        userId: a.userId,
        workoutId: workoutAId,
        operation: "upsert",
      }),
      ctx.scheduler.runAfter(0, internal.agoge.sync.syncWorkoutToProviders, {
        userId: a.userId,
        workoutId: workoutBId,
        operation: "upsert",
      }),
    ]);
  },
});

async function performDeleteWorkout(
  ctx: MutationCtx,
  userId: string,
  workoutId: string,
): Promise<void> {
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) {
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [requireAuthError],
    });
  }
  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    workoutId,
  });
  if (!workout || workout.athleteId !== athlete._id) {
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: [requireAuthError],
    });
  }
  const ref = await ctx.runQuery(
    components.agoge.public.getWorkoutProviderRef,
    { workoutId, provider: "garmin" },
  );
  await ctx.runMutation(components.agoge.public.deleteWorkout, { workoutId });
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
}

export const deleteWorkout = mutation({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const auth = await loadAthlete(ctx);
    if (!auth) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    }
    await performDeleteWorkout(ctx, auth.userId, workoutId);
  },
});

// Variants called from the coach agent's tool execution path. The agent's
// post-approval continuation runs as a scheduled internalAction, which has no
// auth identity — so getAuthUserId would return null and trigger NOT_AUTHORIZED.
// The agent framework provides ctx.userId on the tool ctx (bound to the thread
// at streamText time), and we trust that here instead of re-deriving from auth.

export const createWorkoutAsUser = internalMutation({
  args: { ...createWorkoutArgs.fields, userId: v.string() },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    return await performCreateWorkout(ctx, rest, userId);
  },
});

export const updateWorkoutAsUser = internalMutation({
  args: { ...updateWorkoutArgs.fields, userId: v.string() },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    await performUpdateWorkout(ctx, rest, userId);
  },
});

export const rescheduleWorkoutAsUser = internalMutation({
  args: { ...rescheduleArgs.fields, userId: v.string() },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    await performRescheduleWorkout(ctx, rest, userId);
  },
});

export const deleteWorkoutAsUser = internalMutation({
  args: { userId: v.string(), workoutId: v.string() },
  handler: async (ctx, { userId, workoutId }) => {
    await performDeleteWorkout(ctx, userId, workoutId);
  },
});
