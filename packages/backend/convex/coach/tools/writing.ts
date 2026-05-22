/**
 * Writing tools — Coach-side mutations.
 *
 * # No approval cards
 *
 * The Coach acts authoritatively: tools write directly and the user reverts
 * after the fact if needed (future Undo PR). Every tool sets
 * `needsApproval: false` and performs validation inline at the top of
 * `execute()`. On validation failure we return `{ ok: false, errors }` so the
 * LLM silently retries with corrected args; on success we write and return
 * `{ ok: true, result, before }`. The `before` field captures pre-mutation
 * state for the future Undo flow — schemas stay stable today.
 *
 * # Scope
 *
 * The Coach does NOT own plan structure. Block CRUD, workout creation, and
 * workout deletion are intentionally absent — those are the deterministic
 * Engine's territory. The Coach surfaces three narrow shapes:
 *
 *   - markWorkoutStatus  — record reality (completed / missed / skipped) and
 *                          optionally the actual face for completed sessions.
 *                          Test completions still record VDOT via Agoge.
 *   - correctActual      — fix bad sensor data on an already-completed workout.
 *   - requestReschedule  — ask the Engine to move a workout to a date. The
 *                          Engine picks "simple move" vs "swap" vs "reject".
 *
 * Agoge's `validate*` queries fence domain invariants; the Philosophy layer
 * (`api.coach.philosophy.validate.*`) fences Coach-only policy and runs only
 * on the Coach's write path — direct user CRUD bypasses it.
 */

import { createTool } from "@convex-dev/agent";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { api, internal } from "../../_generated/api";

type WriteResult<T = null> =
  | { ok: true; result: T; before: unknown }
  | { ok: false; errors: { code: string; message: string }[] };

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

const actualFaceSchema = z
  .object({
    date: z
      .string()
      .describe("UTC ISO 8601 timestamp for when the actual was run."),
    durationSeconds: z.number().int().positive().optional(),
    distanceMeters: z.number().positive().optional(),
    elevationGainMeters: z.number().nonnegative().optional(),
    avgHr: z.number().int().positive().optional(),
    maxHr: z.number().int().positive().optional(),
    rpe: z.number().min(0).max(10).optional(),
    notes: z.string().optional(),
  })
  .describe("Actual face — what the athlete actually did.");

const completedStatusSchema = z
  .enum(["completed", "missed"])
  .describe(
    "Status to set. 'completed' must be paired with an `actual` face. " +
      "'missed' records that the planned session did not happen.",
  );

export const writingTools = {
  markWorkoutStatus: createTool({
    description:
      "Record reality on a planned workout: mark it as completed (with the " +
      "actual face), missed, or skipped. Use this when the athlete tells you " +
      "what actually happened. For 'completed', include `actual` with at " +
      "least date + distance or duration. For 'missed'/'skipped', omit " +
      "`actual`. If the workout is a baseline test and you mark it completed, " +
      "Agoge will derive VDOT from the actual face — that side effect is " +
      "intentional.",
    inputSchema: z.object({
      workoutId: z.string(),
      status: completedStatusSchema,
      actual: actualFaceSchema.optional(),
    }),
    needsApproval: false,
    execute: async (
      ctx,
      args,
    ): Promise<WriteResult<{ workoutId: string }>> => {
      const agoge = await ctx.runQuery(
        api.agoge.workouts.dryRunUpdateWorkout,
        args,
      );
      if (!agoge.ok) return { ok: false, errors: agoge.errors };

      const philosophy = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutUpdate,
        args,
      );
      if (!philosophy.ok) return { ok: false, errors: philosophy.errors };

      const existing = await ctx.runQuery(api.agoge.workouts.getWorkout, {
        workoutId: args.workoutId,
      });
      const before = existing
        ? {
            workoutId: args.workoutId,
            status: existing.workout.status,
            actual: existing.workout.actual ?? null,
          }
        : { workoutId: args.workoutId };

      try {
        await ctx.runMutation(api.agoge.workouts.updateWorkout, args);
        return {
          ok: true,
          result: { workoutId: args.workoutId },
          before,
        };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  correctActual: createTool({
    description:
      "Correct the recorded `actual` on an already-completed workout. Use " +
      "this only to fix bad sensor data (watch lost GPS, autopopulated wrong " +
      "session, etc.) — not to change what the athlete actually did. Provide " +
      "the full corrected actual face. `reason` is a short human-readable " +
      "string the athlete will see in the change log.",
    inputSchema: z.object({
      workoutId: z.string(),
      actual: actualFaceSchema,
      reason: z
        .string()
        .min(1)
        .max(280)
        .describe("Short explanation of why the correction is being made."),
    }),
    needsApproval: false,
    execute: async (
      ctx,
      args,
    ): Promise<WriteResult<{ workoutId: string }>> => {
      const updateArgs = { workoutId: args.workoutId, actual: args.actual };

      const agoge = await ctx.runQuery(
        api.agoge.workouts.dryRunUpdateWorkout,
        updateArgs,
      );
      if (!agoge.ok) return { ok: false, errors: agoge.errors };

      const philosophy = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutUpdate,
        updateArgs,
      );
      if (!philosophy.ok) return { ok: false, errors: philosophy.errors };

      const existing = await ctx.runQuery(api.agoge.workouts.getWorkout, {
        workoutId: args.workoutId,
      });
      const before = existing
        ? {
            workoutId: args.workoutId,
            actual: existing.workout.actual ?? null,
          }
        : { workoutId: args.workoutId };

      try {
        await ctx.runMutation(api.agoge.workouts.updateWorkout, updateArgs);
        return {
          ok: true,
          result: { workoutId: args.workoutId },
          before,
        };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  requestReschedule: createTool({
    description:
      "Ask the Engine to move a workout to a new date. You do NOT pick the " +
      "implementation strategy — the Engine decides whether the move is a " +
      "simple reschedule (empty slot), a swap (same-week collision), or a " +
      "rejection (cross-week collision). Pass `toDate` as a UTC ISO 8601 " +
      "timestamp. If the Engine rejects with SLOT_OCCUPIED, retry with a " +
      "different date.",
    inputSchema: z.object({
      workoutId: z.string(),
      toDate: z
        .string()
        .describe("Target date as a UTC ISO 8601 timestamp."),
    }),
    needsApproval: false,
    execute: async (
      ctx,
      args,
    ): Promise<
      | {
          ok: true;
          result: { action: "moved" | "swapped" };
          before: unknown;
        }
      | { ok: false; errors: { code: string; message: string }[] }
    > => {
      try {
        const engineResult = await ctx.runMutation(
          internal.engine.reschedule.reschedule,
          args,
        );
        if (!engineResult.ok) {
          return { ok: false, errors: engineResult.errors };
        }
        return {
          ok: true,
          result: { action: engineResult.action },
          before: engineResult.before,
        };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),
};
