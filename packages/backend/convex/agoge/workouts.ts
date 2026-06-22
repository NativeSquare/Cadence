import { workoutsValidator } from "@nativesquare/agoge/schema";
import { ConvexError, type Infer, v } from "convex/values";
import { components } from "../_generated/api";
import {
  validateMoveAgainstRules,
  validateSwapAgainstRules,
} from "../engine/rules";
import { daysBetweenYmd } from "./periodization";
import {
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
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

  return result(errors);
}

const rescheduleArgs = v.object({
  workoutId: v.string(),
  date: v.string(),
});

// Manual ±1-day reschedule — the only reschedule path. User-facing, so it
// carries product constraints (one day only, no past day, target day must be
// empty) plus the deterministic coaching caps. The richer `reason` lets the UI
// localize why a candidate day is disabled.
const adjacentReasonValidator = v.union(
  v.literal("not_authorized"),
  v.literal("invalid_state"),
  v.literal("invalid_date"),
  v.literal("out_of_range"),
  v.literal("past"),
  v.literal("occupied"),
  v.literal("cap"),
);
export type AdjacentReason = Infer<typeof adjacentReasonValidator>;

const adjacentResultValidator = v.union(
  v.object({ ok: v.literal(true) }),
  v.object({
    ok: v.literal(false),
    reason: adjacentReasonValidator,
    message: v.string(),
  }),
);
type AdjacentResult = Infer<typeof adjacentResultValidator>;

function todayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function validateRescheduleAdjacent(
  ctx: QueryCtx | MutationCtx,
  args: typeof rescheduleArgs.type,
): Promise<AdjacentResult> {
  const owned = await loadOwnedWorkout(ctx, args.workoutId);
  if (!owned)
    return { ok: false, reason: "not_authorized", message: "Not authorized" };
  const { workout } = owned;
  const planned = workout.planned;
  if (!planned)
    return {
      ok: false,
      reason: "invalid_state",
      message: "Cannot reschedule a workout without a planned face",
    };
  if (workout.status === "completed")
    return {
      ok: false,
      reason: "invalid_state",
      message: "Cannot reschedule a completed workout",
    };
  if (workout.type === "race")
    return {
      ok: false,
      reason: "invalid_state",
      message: "Race day is fixed and cannot be rescheduled.",
    };

  const dateErr = validateIsoInstantDate(args.date, "date");
  if (dateErr)
    return { ok: false, reason: "invalid_date", message: dateErr.message };

  const plannedYmd = planned.date.slice(0, 10);
  const targetYmd = args.date.slice(0, 10);
  if (Math.abs(daysBetweenYmd(plannedYmd, targetYmd)) !== 1)
    return {
      ok: false,
      reason: "out_of_range",
      message: "A workout can only be rescheduled by one day.",
    };

  if (targetYmd < todayYmdUtc())
    return {
      ok: false,
      reason: "past",
      message: "Cannot reschedule to a past day.",
    };

  // Target day must be empty — manual reschedule never swaps (Swap is its own
  // explicit action).
  const sameDay = await ctx.runQuery(
    components.agoge.public.getPlannedWorkoutsByAthlete,
    {
      athleteId: workout.athleteId,
      startDate: `${targetYmd}T00:00:00.000Z`,
      endDate: `${targetYmd}T23:59:59.999Z`,
    },
  );
  if (sameDay.some((w) => w._id !== args.workoutId))
    return {
      ok: false,
      reason: "occupied",
      message: "That day already has a workout.",
    };

  const blockErr = await validatePlannedDateInBlock(
    ctx,
    args.date,
    workout.blockId,
  );
  if (blockErr)
    return { ok: false, reason: "out_of_range", message: blockErr.message };

  const ruleErr = await validateMoveAgainstRules(ctx, {
    workoutId: args.workoutId,
    workoutType: workout.type,
    athleteId: workout.athleteId,
    proposedDate: args.date,
  });
  if (ruleErr) return { ok: false, reason: "cap", message: ruleErr.message };

  return { ok: true };
}

const updateWorkoutArgs = workoutsValidator
  .omit("athleteId", "planId", "blockId", "templateId")
  .partial()
  .extend({
    workoutId: v.string(),
    blockId: v.optional(v.union(v.string(), v.null())),
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
  if (a.workout.type === "race" || b.workout.type === "race") {
    push(errors, {
      code: "INVALID_STATE",
      message: "Race day is fixed and cannot be swapped.",
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

  // Deterministic coaching caps (quality-per-week, weekly volume) — same rules
  // the Engine applies to its own moves. Only worth running once the Agoge
  // domain checks pass.
  if (errors.length === 0) {
    const ruleErr = await validateSwapAgainstRules(ctx, {
      athleteId: a.workout.athleteId,
      a: {
        _id: a.workout._id,
        type: a.workout.type,
        plannedDate: a.workout.planned.date,
      },
      b: {
        _id: b.workout._id,
        type: b.workout.type,
        plannedDate: b.workout.planned.date,
      },
    });
    if (ruleErr) push(errors, { code: "CONFLICT", message: ruleErr.message });
  }

  return result(errors);
}

export const dryRunCreateWorkout = query({
  args: createWorkoutArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => validateCreateWorkout(ctx, args),
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

export const dryRunRescheduleAdjacent = query({
  args: rescheduleArgs.fields,
  returns: adjacentResultValidator,
  handler: (ctx, args) => validateRescheduleAdjacent(ctx, args),
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

    // Resolve the plan's race format (plan → goal → race) so the client can show
    // format-specific guidance (e.g. the marathon fueling note on long runs). Two
    // cheap extra reads, only when the workout belongs to a plan with a race goal.
    let raceFormat: string | null = null;
    if (plan?.goalId) {
      const goal = await ctx.runQuery(components.agoge.public.getGoal, {
        goalId: plan.goalId,
      });
      if (goal?.raceId) {
        const race = await ctx.runQuery(components.agoge.public.getRace, {
          raceId: goal.raceId,
        });
        raceFormat = race?.format ?? null;
      }
    }

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
      raceFormat,
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

export const rescheduleWorkoutAdjacent = mutation({
  args: rescheduleArgs.fields,
  handler: async (ctx, args) => {
    const validation = await validateRescheduleAdjacent(ctx, args);
    if (!validation.ok)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        reason: validation.reason,
        message: validation.message,
      });

    const { workoutId, date } = args;
    const owned = await loadOwnedWorkout(ctx, workoutId);
    if (!owned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        reason: "not_authorized",
        message: "Not authorized",
      });
    const planned = owned.workout.planned;
    if (!planned)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        reason: "invalid_state",
        message: "Cannot reschedule a workout without a planned face",
      });

    await ctx.runMutation(components.agoge.public.updateWorkout, {
      workoutId,
      planned: { ...planned, date },
    });
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
