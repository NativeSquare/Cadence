/**
 * Engine: VDOT baseline.
 *
 * Plan generation needs a fitness baseline. Every goal is created with a
 * mandatory past race result, folded into `createMyRaceWithGoal`, which writes
 * a VDOT metric before the plan generator is scheduled — so "VDOT exists
 * before generation" is a server-side invariant (ADR-0006). A returning
 * athlete changing goals reuses their existing VDOT. The Fitness page reports
 * the metric; `setVdotFromRaceResult` lets the athlete refresh it later.
 */

import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import { mutation, type MutationCtx } from "../_generated/server";
import { loadAthlete, requireAuthError } from "../agoge/helpers";
import { computeVdot } from "../agoge/periodization";

/** Pure: (distance, time) → VDOT. Works for any pair. */
export function deriveVdot(distanceMeters: number, timeSeconds: number): number {
  return computeVdot(distanceMeters, timeSeconds);
}

export async function scheduleGenerate(
  ctx: MutationCtx,
  planId: string,
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.engine.generatePlan.generate, {
    planId,
  });
}

/**
 * Write a VDOT metric derived from a reported (distance, time) race result.
 * The single source of the athlete's fitness baseline — seeded at goal
 * creation and refreshable from the Fitness page.
 */
export async function recordVdotMetric(
  ctx: MutationCtx,
  athleteId: string,
  distanceMeters: number,
  timeSeconds: number,
): Promise<void> {
  await ctx.runMutation(components.agoge.public.createMetric, {
    athleteId,
    kind: "vdot",
    value: deriveVdot(distanceMeters, timeSeconds),
    source: "race",
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Refresh the current athlete's VDOT from a reported race result (Fitness
 * page). Any (distance, time) pair yields a valid VDOT.
 */
export const setVdotFromRaceResult = mutation({
  args: { distanceMeters: v.number(), timeSeconds: v.number() },
  handler: async (ctx, { distanceMeters, timeSeconds }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    if (!(distanceMeters > 0) || !(timeSeconds > 0)) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [
          {
            code: "INVALID_INPUT",
            message:
              "distanceMeters and timeSeconds must be positive numbers.",
          },
        ],
      });
    }

    await recordVdotMetric(ctx, auth.athlete._id, distanceMeters, timeSeconds);
  },
});
