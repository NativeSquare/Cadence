/**
 * Coaching Philosophy validate queries — one per writing trigger. Mirror the
 * arg shapes Agoge's `validate*` queries accept so the writing-tool callers
 * can pass the same args object to both layers.
 *
 * Each query: load context → run trigger's rules → return PhilosophyResult.
 *
 * On unauth, short-circuit with `{ ok: true, warnings: [] }` — Agoge already
 * gates auth so we just stay out of the way.
 */

import { blocksValidator, workoutsValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { loadPhilosophyContext } from "./context";
import { rulesByTrigger } from "./registry";
import { runRules } from "./runner";
import { philosophyResultValidator, type PhilosophyResult } from "./types";

const createWorkoutArgs = workoutsValidator
  .omit("athleteId", "planId", "blockId", "templateId")
  .extend({
    blockId: v.optional(v.string()),
    templateId: v.optional(v.string()),
  });

const updateWorkoutArgs = workoutsValidator
  .omit("athleteId", "planId", "blockId", "templateId")
  .partial()
  .extend({
    workoutId: v.string(),
    blockId: v.optional(v.union(v.string(), v.null())),
    templateId: v.optional(v.string()),
  });

const rescheduleArgs = v.object({
  workoutId: v.string(),
  date: v.string(),
});

const deleteWorkoutArgs = v.object({
  workoutId: v.string(),
});

const createBlockArgs = blocksValidator.omit("planId");

const updateBlockArgs = blocksValidator
  .omit("planId")
  .partial()
  .extend({ blockId: v.string() });

const deleteBlockArgs = v.object({
  blockId: v.string(),
});

const okEmpty: PhilosophyResult = { ok: true, warnings: [] };

export const validateWorkoutCreate = query({
  args: createWorkoutArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(ctx, "workout.create", args);
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["workout.create"] ?? [],
      args,
      context,
      ctx,
    );
  },
});

export const validateWorkoutUpdate = query({
  args: updateWorkoutArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(ctx, "workout.update", args);
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["workout.update"] ?? [],
      args,
      context,
      ctx,
    );
  },
});

export const validateWorkoutReschedule = query({
  args: rescheduleArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(
      ctx,
      "workout.reschedule",
      args,
    );
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["workout.reschedule"] ?? [],
      args,
      context,
      ctx,
    );
  },
});

export const validateWorkoutDelete = query({
  args: deleteWorkoutArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(ctx, "workout.delete", args);
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["workout.delete"] ?? [],
      args,
      context,
      ctx,
    );
  },
});

export const validateBlockCreate = query({
  args: createBlockArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(ctx, "block.create", args);
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["block.create"] ?? [],
      args,
      context,
      ctx,
    );
  },
});

export const validateBlockUpdate = query({
  args: updateBlockArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(ctx, "block.update", args);
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["block.update"] ?? [],
      args,
      context,
      ctx,
    );
  },
});

export const validateBlockDelete = query({
  args: deleteBlockArgs.fields,
  returns: philosophyResultValidator,
  handler: async (ctx, args): Promise<PhilosophyResult> => {
    const context = await loadPhilosophyContext(ctx, "block.delete", args);
    if (!context) return okEmpty;
    return runRules(
      rulesByTrigger["block.delete"] ?? [],
      args,
      context,
      ctx,
    );
  },
});
