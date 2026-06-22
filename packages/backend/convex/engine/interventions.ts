/**
 * Runner-initiated ease of an upcoming hard session — the post-session reshape
 * from the "we heard you" decision prompt (Mark Done sheet,
 * `concern: "act"` with a conflicting hard session within ~3 days).
 *
 * The Engine acts only because the Runner decided. The choice itself is recorded
 * as `decision: "ease"` on the debrief journal entry (see table/journalEntry.ts);
 * this performs the plan mutation and stores nothing else — no snapshot, no
 * revert. The autonomous triggers that once shared this module (hrv_low_v1,
 * adherence) and the `coachInterventions` log were removed in ADR-0003 /
 * ADR-0002 addendum.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type MutationCtx, mutation } from "../_generated/server";
import { summarizeStructure } from "../agoge/periodization";

function round5min(seconds: number): number {
  const min = Math.max(20, Math.round(seconds / 60));
  return Math.round(min / 5) * 5 * 60;
}

function easyName(locale: "en" | "fr", durationSec: number): string {
  const min = Math.round(durationSec / 60);
  return locale === "fr" ? `Facile ${min} min` : `Easy ${min} min`;
}

/**
 * Swap a workout to a single easy step, keeping time-on-feet (intensity drops to
 * RPE 3, volume holds). The reshape only — no record is written; the eased
 * choice already lives on the debrief journal entry's `decision` field.
 */
async function applyEase(
  ctx: MutationCtx,
  { userId, workoutId }: { userId: Id<"users">; workoutId: string },
): Promise<void> {
  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    workoutId,
  });
  if (!workout || !workout.planned) return;

  const user = await ctx.db.get(userId);
  const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";

  const originalPlanned = workout.planned;
  const summary = originalPlanned.structure
    ? summarizeStructure(originalPlanned.structure as WorkoutStructure)
    : undefined;
  const originalDistance = summary?.distanceMeters;
  const originalDuration = summary?.durationSeconds;

  const newDuration =
    originalDuration && originalDuration > 0
      ? round5min(originalDuration)
      : undefined;
  const newDistance =
    originalDistance && originalDistance > 0
      ? Math.round(originalDistance)
      : undefined;

  const newName = easyName(locale, newDuration ?? 30 * 60);

  // Single easy step — distance-anchored if known, otherwise time. An easy run
  // is one continuous work step at RPE 3.
  const newStructure: WorkoutStructure = {
    schema_version: 1,
    discipline: "endurance",
    sport: "run",
    blocks: [
      {
        kind: "step",
        intent: "work",
        duration: newDistance
          ? { type: "distance", meters: newDistance }
          : { type: "time", seconds: newDuration ?? 30 * 60 },
        target: { type: "rpe", value: 3 },
      },
    ],
  };

  await ctx.runMutation(components.agoge.public.updateWorkout, {
    workoutId,
    type: "easy",
    name: newName,
    planned: { date: originalPlanned.date, structure: newStructure },
  });
}

/**
 * Runner-initiated ease of an upcoming hard session, from the post-session
 * decision prompt (Mark Done sheet, `concern: "act"`). Keeps time-on-feet, just
 * drops the intensity.
 */
export const easeConflictingSession = mutation({
  args: { workoutId: v.string() },
  returns: v.null(),
  handler: async (ctx, { workoutId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    await applyEase(ctx, { userId, workoutId });
    return null;
  },
});
