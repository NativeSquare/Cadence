/**
 * Engine: reschedule
 *
 * Deterministic policy for "move workout X to date Y." The Engine — not the
 * AI Coach — owns the decision of *how* to realize the move:
 *
 *   - target slot empty                 → simple reschedule
 *   - target slot occupied, same week   → swap with the workout sitting there
 *   - target slot occupied, other week  → reject
 *
 * Same-week is the ISO week (Mon–Sun) containing the source's planned date.
 * Athletes mentally batch by week, so a same-week swap reads as "moving things
 * around"; crossing weeks would silently restructure the load.
 *
 * Both the Agoge domain validators and the Coach-Philosophy layer run before
 * any write. Rejections come back as `{ ok: false, errors }` so the calling
 * Coach tool can surface a structured failure (and the LLM can retry with a
 * different target date).
 *
 * Coach tools call this via `ctx.runMutation(internal.engine.reschedule.reschedule, …)`.
 * It is not a public mutation — direct user invocation goes through Agoge.
 */

import { type Infer, ConvexError, v } from "convex/values";
import { api, components } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { loadOwnedWorkout, validateIsoInstantDate } from "../agoge/helpers";

const errorValidator = v.object({ code: v.string(), message: v.string() });

const beforeValidator = v.object({
  workoutId: v.string(),
  plannedDate: v.string(),
  swappedWith: v.optional(
    v.object({
      workoutId: v.string(),
      plannedDate: v.string(),
    }),
  ),
});

const rescheduleResultValidator = v.union(
  v.object({
    ok: v.literal(true),
    action: v.union(v.literal("moved"), v.literal("swapped")),
    before: beforeValidator,
  }),
  v.object({
    ok: v.literal(false),
    errors: v.array(errorValidator),
  }),
);

export type RescheduleResult = Infer<typeof rescheduleResultValidator>;

function ymd(iso: string): string {
  return iso.slice(0, 10);
}

function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay() || 7; // 1..7, Mon..Sun
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function fromConvexError(err: unknown): {
  ok: false;
  errors: { code: string; message: string }[];
} {
  if (err instanceof ConvexError && typeof err.data === "object" && err.data) {
    const data = err.data as {
      code?: string;
      errors?: { code: string; message: string }[];
    };
    if (Array.isArray(data.errors)) return { ok: false, errors: data.errors };
    return {
      ok: false,
      errors: [
        {
          code: data.code ?? "UNKNOWN",
          message:
            typeof err.message === "string" ? err.message : "Mutation failed",
        },
      ],
    };
  }
  return {
    ok: false,
    errors: [
      {
        code: "UNKNOWN",
        message: err instanceof Error ? err.message : String(err),
      },
    ],
  };
}

export const reschedule = internalMutation({
  args: {
    workoutId: v.string(),
    toDate: v.string(),
  },
  returns: rescheduleResultValidator,
  handler: async (ctx, { workoutId, toDate }): Promise<RescheduleResult> => {
    const owned = await loadOwnedWorkout(ctx, workoutId);
    if (!owned) {
      return {
        ok: false as const,
        errors: [{ code: "NOT_AUTHORIZED", message: "Not authorized" }],
      };
    }
    const { workout } = owned;
    const planned = workout.planned;
    if (!planned) {
      return {
        ok: false as const,
        errors: [
          {
            code: "INVALID_STATE",
            message: "Cannot reschedule a workout without a planned face",
          },
        ],
      };
    }
    if (workout.status === "completed") {
      return {
        ok: false as const,
        errors: [
          {
            code: "INVALID_STATE",
            message: "Cannot reschedule a completed workout",
          },
        ],
      };
    }

    const dateErr = validateIsoInstantDate(toDate, "toDate");
    if (dateErr) return { ok: false as const, errors: [dateErr] };

    // Collision detection — any *other* planned workout sharing the target day?
    const dayPrefix = ymd(toDate);
    const dayStart = `${dayPrefix}T00:00:00.000Z`;
    const dayEnd = `${dayPrefix}T23:59:59.999Z`;
    const sameDay = await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: workout.athleteId,
        startDate: dayStart,
        endDate: dayEnd,
      },
    );
    const collision = sameDay.find((w) => w._id !== workoutId);

    if (collision) {
      const sourceWeek = isoWeekKey(planned.date);
      const targetWeek = isoWeekKey(toDate);
      if (sourceWeek !== targetWeek) {
        return {
          ok: false as const,
          errors: [
            {
              code: "SLOT_OCCUPIED",
              message: `Target date ${dayPrefix} is occupied by "${collision.name}" and falls in a different week from the source. Pick another date in the source's week to allow a swap, or pick an empty date.`,
            },
          ],
        };
      }

      const agoge = await ctx.runQuery(api.agoge.workouts.dryRunSwapWorkouts, {
        workoutAId: workoutId,
        workoutBId: collision._id,
      });
      if (!agoge.ok) return { ok: false as const, errors: agoge.errors };

      const phil1 = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutReschedule,
        { workoutId, date: toDate },
      );
      if (!phil1.ok) return { ok: false as const, errors: phil1.errors };
      const phil2 = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutReschedule,
        { workoutId: collision._id, date: planned.date },
      );
      if (!phil2.ok) return { ok: false as const, errors: phil2.errors };

      try {
        await ctx.runMutation(api.agoge.workouts.swapWorkouts, {
          workoutAId: workoutId,
          workoutBId: collision._id,
        });
      } catch (err) {
        return fromConvexError(err);
      }

      return {
        ok: true as const,
        action: "swapped" as const,
        before: {
          workoutId,
          plannedDate: planned.date,
          swappedWith: {
            workoutId: collision._id,
            plannedDate: collision.planned?.date ?? planned.date,
          },
        },
      };
    }

    const agoge = await ctx.runQuery(
      api.agoge.workouts.dryRunRescheduleWorkout,
      { workoutId, date: toDate },
    );
    if (!agoge.ok) return { ok: false as const, errors: agoge.errors };

    const phil = await ctx.runQuery(
      api.coach.philosophy.validate.validateWorkoutReschedule,
      { workoutId, date: toDate },
    );
    if (!phil.ok) return { ok: false as const, errors: phil.errors };

    try {
      await ctx.runMutation(api.agoge.workouts.rescheduleWorkout, {
        workoutId,
        date: toDate,
      });
    } catch (err) {
      return fromConvexError(err);
    }

    return {
      ok: true as const,
      action: "moved" as const,
      before: { workoutId, plannedDate: planned.date },
    };
  },
});
