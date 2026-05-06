/**
 * Writing tools — Agoge mutations the coach can propose to the user.
 *
 * # Deterministic preflight via `needsApproval` as a function
 *
 * The framework treats `needsApproval` as a server-side gate that runs BEFORE
 * any approval card is shown to the user. We use it as a validation preflight:
 *
 *   needsApproval(ctx, input) → runs the matching `validate*` query
 *     ├─ validation.ok === true  → returns true → approval card streamed to UI
 *     └─ validation.ok === false → returns false → no card; execute() runs
 *                                                  immediately, the mutation
 *                                                  throws, we catch and return
 *                                                  structured errors so the
 *                                                  LLM can retry with corrected
 *                                                  args (silent retry loop).
 *
 * This makes the "card never shows for invalid args" property 100% deterministic
 * (server-controlled) rather than depending on the LLM following protocol.
 *
 * `execute()` therefore performs the real DB write only on the approved path,
 * and acts as a structured-error converter on the silent-retry path. The Agoge
 * mutations re-validate server-side as defense-in-depth, throwing
 * `ConvexError({code:"VALIDATION_FAILED", errors})` on stale-state races; we
 * catch and convert.
 *
 * Tools without a matching `validate*` query (deletes) keep
 * `needsApproval: true` — there's nothing to validate, the question is just
 * "do you want to delete this?".
 */

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { ConvexError } from "convex/values";
import { api } from "../../_generated/api";

type WriteResult<T = null> =
  | { ok: true; result: T }
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
    if (Array.isArray(data.errors)) {
      return { ok: false, errors: data.errors };
    }
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

// ---------------------------------------------------------------------------
// Reusable schemas — zod mirrors of the Agoge validators (loose where the
// underlying validator is too dense to mirror; the mutation re-validates
// strictly server-side, so a permissive tool schema only affects how the LLM
// formats its proposal).
// ---------------------------------------------------------------------------

const workoutFaceSchema = z
  .object({
    date: z
      .string()
      .describe("UTC ISO 8601 timestamp for the planned/actual date."),
    durationSeconds: z.number().int().positive().optional(),
    distanceMeters: z.number().positive().optional(),
    elevationGainMeters: z.number().nonnegative().optional(),
    avgHr: z.number().int().positive().optional(),
    maxHr: z.number().int().positive().optional(),
    avgPaceMps: z.number().positive().optional(),
    load: z.number().nonnegative().optional(),
    rpe: z.number().min(0).max(10).optional(),
    notes: z.string().optional(),
    structure: z
      .any()
      .optional()
      .describe(
        "Optional structured workout (steps, repeats, intervals). Pass " +
          "through verbatim if cloning from a template; otherwise omit.",
      ),
  })
  .describe("One face of a workout — same shape for planned and actual.");

const workoutTypeSchema = z.enum([
  "easy",
  "long",
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "fartlek",
  "progression",
  "race_pace",
  "recovery",
  "strides",
  "hills",
  "race",
  "test",
  "cross_training",
  "strength",
  "rest",
  "other",
]);

const workoutStatusSchema = z.enum([
  "planned",
  "completed",
  "missed",
  "skipped",
]);

const blockTypeSchema = z.enum([
  "base",
  "build",
  "peak",
  "taper",
  "recovery",
  "maintenance",
  "transition",
]);

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export const writingTools = {
  // ------- Workouts --------------------------------------------------------

  createWorkout: createTool({
    description:
      "Create a new workout (planned or already completed) for the athlete. " +
      "Maps to the user's 'Log/schedule workout' UI action. The user must " +
      "Accept the proposal before the workout is created. Args are validated " +
      "server-side before the approval card is shown — if validation fails, " +
      "the tool returns { ok: false, errors } silently and you should retry " +
      "with corrected args.",
    inputSchema: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      sport: z.literal("run"),
      type: workoutTypeSchema,
      status: workoutStatusSchema,
      planned: workoutFaceSchema.optional(),
      actual: workoutFaceSchema.optional(),
      blockId: z.string().optional(),
      templateId: z.string().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const v = await ctx.runQuery(api.agoge.workouts.validateCreate, input);
      return v.ok;
    },
    execute: async (ctx, args): Promise<WriteResult<{ workoutId: string }>> => {
      try {
        const workoutId = await ctx.runMutation(
          api.agoge.workouts.createWorkout,
          args,
        );
        return { ok: true, result: { workoutId } };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  updateWorkout: createTool({
    description:
      "Update fields on an existing workout (any subset of name, type, " +
      "status, planned, actual, blockId, etc.). Maps to the user's 'Edit " +
      "workout' UI action. Pass blockId: null to detach the workout from " +
      "its block. Args are validated server-side before the approval card " +
      "is shown — silent retry on { ok: false, errors }.",
    inputSchema: z.object({
      workoutId: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      sport: z.literal("run").optional(),
      type: workoutTypeSchema.optional(),
      status: workoutStatusSchema.optional(),
      planned: workoutFaceSchema.optional(),
      actual: workoutFaceSchema.optional(),
      blockId: z.union([z.string(), z.null()]).optional(),
      templateId: z.string().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const v = await ctx.runQuery(api.agoge.workouts.validateUpdate, input);
      return v.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      try {
        await ctx.runMutation(api.agoge.workouts.updateWorkout, args);
        return { ok: true, result: null };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  rescheduleWorkout: createTool({
    description:
      "Move a workout's planned date to a new date. Maps to the user's " +
      "'Reschedule' button. Cannot be used on completed workouts. Args are " +
      "validated server-side before the approval card is shown — silent " +
      "retry on { ok: false, errors }.",
    inputSchema: z.object({
      workoutId: z.string(),
      date: z
        .string()
        .describe("New planned date as a UTC ISO 8601 timestamp."),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const v = await ctx.runQuery(
        api.agoge.workouts.validateReschedule,
        input,
      );
      return v.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      try {
        await ctx.runMutation(api.agoge.workouts.rescheduleWorkout, args);
        return { ok: true, result: null };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  deleteWorkout: createTool({
    description:
      "Delete a workout. Maps to the user's 'Delete' action. Use sparingly " +
      "— prefer rescheduling or marking as skipped/missed when the intent " +
      "is to keep training history intact.",
    inputSchema: z.object({
      workoutId: z.string(),
    }),
    needsApproval: true,
    execute: async (ctx, args): Promise<WriteResult> => {
      try {
        await ctx.runMutation(api.agoge.workouts.deleteWorkout, args);
        return { ok: true, result: null };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  // ------- Blocks ----------------------------------------------------------

  createBlock: createTool({
    description:
      "Create a new training block in the athlete's active plan. Maps to " +
      "the user's 'New block' form. Args are validated server-side before " +
      "the approval card is shown — silent retry on { ok: false, errors }.",
    inputSchema: z.object({
      name: z.string().min(1),
      type: blockTypeSchema,
      startDate: z
        .string()
        .describe("UTC ISO 8601 timestamp for the block's first day."),
      endDate: z
        .string()
        .describe("UTC ISO 8601 timestamp for the block's last day."),
      focus: z.string().optional(),
      order: z
        .number()
        .int()
        .nonnegative()
        .describe("Sort order within the plan, 0-indexed."),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const v = await ctx.runQuery(api.agoge.blocks.validateCreate, input);
      return v.ok;
    },
    execute: async (ctx, args): Promise<WriteResult<{ blockId: string }>> => {
      try {
        const blockId = await ctx.runMutation(
          api.agoge.blocks.createBlock,
          args,
        );
        return { ok: true, result: { blockId } };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  updateBlock: createTool({
    description:
      "Update fields on an existing block (name, type, dates, focus, " +
      "order). Maps to the user's 'Edit block' form. Args are validated " +
      "server-side before the approval card is shown — silent retry on " +
      "{ ok: false, errors }.",
    inputSchema: z.object({
      blockId: z.string(),
      name: z.string().min(1).optional(),
      type: blockTypeSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      focus: z.string().optional(),
      order: z.number().int().nonnegative().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const v = await ctx.runQuery(api.agoge.blocks.validateUpdate, input);
      return v.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      try {
        await ctx.runMutation(api.agoge.blocks.updateBlock, args);
        return { ok: true, result: null };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),

  deleteBlock: createTool({
    description:
      "Delete a training block. Workouts attached to it become unblocked " +
      "(their blockId is unset) — they are not themselves deleted.",
    inputSchema: z.object({
      blockId: z.string(),
    }),
    needsApproval: true,
    execute: async (ctx, args): Promise<WriteResult> => {
      try {
        await ctx.runMutation(api.agoge.blocks.deleteBlock, args);
        return { ok: true, result: null };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),
};
