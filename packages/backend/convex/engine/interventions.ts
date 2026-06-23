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
import { buildEasedWorkout } from "@packages/shared/ease";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type MutationCtx, mutation } from "../_generated/server";

/**
 * Swap a workout to a single easy step, keeping time-on-feet (intensity drops to
 * RPE 3, volume holds). The reshape only — no record is written; the eased
 * choice already lives on the debrief journal entry's `decision` field.
 *
 * The eased shape comes from the shared `buildEasedWorkout` core, the same one
 * that feeds the white-box preview in the Mark Done sheet — so what the runner
 * previews is exactly what this mutation applies.
 */
async function applyEase(
  ctx: MutationCtx,
  { userId, workoutId }: { userId: Id<"users">; workoutId: string },
): Promise<void> {
  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    workoutId,
  });
  if (!workout || !workout.planned?.structure) return;

  const user = await ctx.db.get(userId);
  const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";

  const eased = buildEasedWorkout(
    workout.planned.structure as WorkoutStructure,
    locale,
  );

  await ctx.runMutation(components.agoge.public.updateWorkout, {
    workoutId,
    type: eased.type,
    name: eased.name,
    planned: { date: workout.planned.date, structure: eased.structure },
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
