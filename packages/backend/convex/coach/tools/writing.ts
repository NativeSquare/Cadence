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
 * After Agoge passes, each tool also checks the coach-only Philosophy layer
 * (api.coach.philosophy.validate.*). The Philosophy layer is server-enforced
 * coaching policy ("no single workout > 50 km", etc.) and runs only on the
 * AI Coach's path — manual user CRUD bypasses it. Deletes have no Agoge
 * `validate*` query (the question is just "do you want to delete this?")
 * but still route through the Philosophy validator so future delete-time
 * policy rules can short-circuit before the approval card.
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
// Philosophy preflight — short-circuits execute() when a Philosophy rule
// blocks. The Agoge mutation does not know about Philosophy, so without this
// step a Philosophy-blocked + Agoge-passing payload would still write.
// ---------------------------------------------------------------------------

type PhilosophyBlock = {
  ok: false;
  errors: { code: string; message: string }[];
};

async function checkPhilosophy(
  ctx: {
    runQuery: (
      ref: any,
      args: any,
    ) => Promise<{
      ok: boolean;
      errors?: { code: string; message: string }[];
    }>;
  },
  queryRef: any,
  input: unknown,
): Promise<PhilosophyBlock | null> {
  const r = await ctx.runQuery(queryRef, input);
  if (!r.ok) return { ok: false, errors: r.errors ?? [] };
  return null;
}

// ---------------------------------------------------------------------------
// Reusable schemas — zod mirrors of the Agoge validators (loose where the
// underlying validator is too dense to mirror; the mutation re-validates
// strictly server-side, so a permissive tool schema only affects how the LLM
// formats its proposal).
// ---------------------------------------------------------------------------

const plannedFaceSchema = z
  .object({
    date: z
      .string()
      .describe("UTC ISO 8601 timestamp for the planned date."),
    structure: z
      .any()
      .optional()
      .describe(
        "Optional structured workout (steps, repeats, intervals). Pass " +
        "through verbatim if cloning from a template; otherwise omit. " +
        "Distance/duration/pace are derived from this on read.",
      ),
  })
  .describe("Planned face — what the athlete is meant to do.");

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

const workoutTypeSchema = z.enum([
  "easy",
  "threshold",
  "intervals",
  "long",
  "race_pace",
  "recovery",
  "race",
  "test",
]);

const workoutStatusSchema = z.enum([
  "planned",
  "completed",
  "missed",
]);

const blockTypeSchema = z.enum(["base", "build", "peak", "taper"]);

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
      planned: plannedFaceSchema.optional(),
      actual: actualFaceSchema.optional(),
      blockId: z.string().optional(),
      templateId: z.string().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const a = await ctx.runQuery(api.agoge.workouts.dryRunCreateWorkout, input);
      if (!a.ok) return false;
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutCreate,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult<{ workoutId: string }>> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateWorkoutCreate,
        args,
      );
      if (blocked) return blocked;
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
      planned: plannedFaceSchema.optional(),
      actual: actualFaceSchema.optional(),
      blockId: z.union([z.string(), z.null()]).optional(),
      templateId: z.string().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const a = await ctx.runQuery(api.agoge.workouts.dryRunUpdateWorkout, input);
      if (!a.ok) return false;
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutUpdate,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateWorkoutUpdate,
        args,
      );
      if (blocked) return blocked;
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
      const a = await ctx.runQuery(
        api.agoge.workouts.dryRunRescheduleWorkout,
        input,
      );
      if (!a.ok) return false;
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutReschedule,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateWorkoutReschedule,
        args,
      );
      if (blocked) return blocked;
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
      "— prefer rescheduling or marking as missed when the intent " +
      "is to keep training history intact.",
    inputSchema: z.object({
      workoutId: z.string(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateWorkoutDelete,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateWorkoutDelete,
        args,
      );
      if (blocked) return blocked;
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
      type: blockTypeSchema,
      startDate: z
        .string()
        .describe("UTC ISO 8601 timestamp for the block's first day."),
      endDate: z
        .string()
        .describe("UTC ISO 8601 timestamp for the block's last day."),
      focus: z.string().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const a = await ctx.runQuery(api.agoge.blocks.dryRunCreateBlock, input);
      if (!a.ok) return false;
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateBlockCreate,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult<{ blockId: string }>> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateBlockCreate,
        args,
      );
      if (blocked) return blocked;
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
      "Update fields on an existing block (type, dates, focus). Maps to " +
      "the user's 'Edit block' form. Args are validated server-side before " +
      "the approval card is shown — silent retry on { ok: false, errors }.",
    inputSchema: z.object({
      blockId: z.string(),
      type: blockTypeSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      focus: z.string().optional(),
    }),
    needsApproval: async (ctx, input): Promise<boolean> => {
      const a = await ctx.runQuery(api.agoge.blocks.dryRunUpdateBlock, input);
      if (!a.ok) return false;
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateBlockUpdate,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateBlockUpdate,
        args,
      );
      if (blocked) return blocked;
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
    needsApproval: async (ctx, input): Promise<boolean> => {
      const p = await ctx.runQuery(
        api.coach.philosophy.validate.validateBlockDelete,
        input,
      );
      return p.ok;
    },
    execute: async (ctx, args): Promise<WriteResult> => {
      const blocked = await checkPhilosophy(
        ctx,
        api.coach.philosophy.validate.validateBlockDelete,
        args,
      );
      if (blocked) return blocked;
      try {
        await ctx.runMutation(api.agoge.blocks.deleteBlock, args);
        return { ok: true, result: null };
      } catch (err) {
        return fromConvexError(err);
      }
    },
  }),
};
