/**
 * Coaching Philosophy validate queries — one per writing trigger. Mirror the
 * arg shapes Agoge's `validate*` queries accept so the writing-tool callers
 * can pass the same args object to both layers.
 *
 * Surface is now limited to:
 *   - validateWorkoutUpdate      — fires for markWorkoutStatus, correctActual
 *   - validateWorkoutReschedule  — fires inside the Engine reschedule
 *
 * Block CRUD, workout creation and workout deletion are Engine-owned (or
 * forbidden to the Coach entirely) so their validators have been removed.
 *
 * On unauth, short-circuit with `{ ok: true, warnings: [] }` — Agoge already
 * gates auth so we just stay out of the way.
 */

import { workoutsValidator } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { loadPhilosophyContext } from "./context";
import { rulesByTrigger } from "./registry";
import { runRules } from "./runner";
import { philosophyResultValidator, type PhilosophyResult } from "./types";

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

const okEmpty: PhilosophyResult = { ok: true, warnings: [] };

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
