/**
 * Shared helpers + frontend-facing surface for the coach intervention
 * decision log. Rule modules call `applyModificationAndRecord` to swap a
 * workout to easy and record the row; the frontend reads `activeForWorkout`
 * and calls `revertIntervention`.
 *
 * Engine acts, Coach tells, user can one-tap revert.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, type Infer, v } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  query,
} from "../_generated/server";
import { summarizeStructure } from "../agoge/periodization";

const SIGNALS_SHAPE = v.object({
  hrvToday: v.optional(v.number()),
  hrvBaseline14d: v.optional(v.number()),
  hrvZScore: v.optional(v.number()),
  sleepHoursLastNight: v.optional(v.number()),
  rhrToday: v.optional(v.number()),
  weekMissedQualityCount: v.optional(v.number()),
});

function round5min(seconds: number): number {
  const min = Math.max(20, Math.round(seconds / 60));
  return Math.round(min / 5) * 5 * 60;
}

function easyName(locale: "en" | "fr", durationSec: number): string {
  const min = Math.round(durationSec / 60);
  return locale === "fr" ? `Facile ${min} min` : `Easy ${min} min`;
}

export const interventionFiredSince = internalQuery({
  args: { userId: v.id("users"), sinceMs: v.number() },
  handler: async (ctx, { userId, sinceMs }) => {
    const row = await ctx.db
      .query("coachInterventions")
      .withIndex("by_userId_firedAt", (q) =>
        q.eq("userId", userId).gte("firedAt", sinceMs),
      )
      .first();
    return row != null;
  },
});

/**
 * Swap a workout to an easy run (scaled by `durationScale`) and record a
 * revertible `coachInterventions` row. Shared by the autonomous rules (via the
 * `applyModificationAndRecord` internal mutation) and the runner-initiated
 * post-session ease (via the `easeConflictingSession` public mutation) — same
 * reshape, same revert path, same detail-page card. A plain helper rather than
 * a function reference so callers run it inside their own transaction.
 */
async function applyEaseAndRecord(
  ctx: MutationCtx,
  {
    userId,
    workoutId,
    ruleId,
    signals,
    durationScale,
  }: {
    userId: Id<"users">;
    workoutId: string;
    ruleId: string;
    signals: Infer<typeof SIGNALS_SHAPE>;
    durationScale: number;
  },
): Promise<Id<"coachInterventions"> | null> {
  const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
    workoutId,
  });
  if (!workout || !workout.planned) return null;

  const user = await ctx.db.get(userId);
  const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";

  const originalPlanned = workout.planned;
  const originalSummary = originalPlanned.structure
    ? summarizeStructure(originalPlanned.structure as WorkoutStructure)
    : undefined;
  const originalDistance = originalSummary?.distanceMeters;
  const originalDuration = originalSummary?.durationSeconds;

  const newDuration =
    originalDuration && originalDuration > 0
      ? round5min(originalDuration * durationScale)
      : undefined;
  const newDistance =
    originalDistance && originalDistance > 0
      ? Math.round(originalDistance * durationScale)
      : undefined;

  const newName = easyName(locale, newDuration ?? 30 * 60);

  // Single easy step — distance-anchored if known, otherwise time. An easy
  // run is one continuous work step at RPE 3.
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

  return await ctx.db.insert("coachInterventions", {
    userId,
    workoutId,
    ruleId,
    firedAt: Date.now(),
    signals,
    originalType: workout.type,
    originalName: workout.name,
    originalPlanned,
    originalDistanceMeters: originalDistance ?? undefined,
    originalDurationSeconds: originalDuration ?? undefined,
    newType: "easy",
    newName,
    newDistanceMeters: newDistance,
    newDurationSeconds: newDuration,
  });
}

export const applyModificationAndRecord = internalMutation({
  args: {
    userId: v.id("users"),
    workoutId: v.string(),
    ruleId: v.string(),
    signals: SIGNALS_SHAPE,
    // 0.8 for HRV-deload (drop both intensity and volume); 1.0 for
    // adherence-substitute (drop intensity only, keep volume to maintain
    // rhythm for the under-loaded athlete).
    durationScale: v.number(),
  },
  returns: v.union(v.null(), v.id("coachInterventions")),
  handler: (ctx, args) => applyEaseAndRecord(ctx, args),
});

/**
 * Runner-initiated ease of an upcoming hard session, from the post-session
 * "we heard you" decision prompt (Mark Done sheet, `concern: "act"`). Keeps
 * time-on-feet (durationScale 1.0), just drops the intensity — and is fully
 * revertible from the session detail page like any other intervention.
 */
export const easeConflictingSession = mutation({
  args: { workoutId: v.string() },
  returns: v.union(v.null(), v.id("coachInterventions")),
  handler: async (ctx, { workoutId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    return await applyEaseAndRecord(ctx, {
      userId,
      workoutId,
      ruleId: "post_session_ease",
      signals: {},
      durationScale: 1.0,
    });
  },
});

export const setInterventionNotificationText = internalMutation({
  args: {
    interventionId: v.id("coachInterventions"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interventionId, {
      notificationBody: args.body,
    });
  },
});

export const getIntervention = internalQuery({
  args: { interventionId: v.id("coachInterventions") },
  handler: async (ctx, { interventionId }) => {
    return await ctx.db.get(interventionId);
  },
});

export const activeForWorkout = query({
  args: { workoutId: v.string() },
  handler: async (
    ctx,
    { workoutId },
  ): Promise<Doc<"coachInterventions"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const rows = await ctx.db
      .query("coachInterventions")
      .withIndex("by_workoutId", (q) => q.eq("workoutId", workoutId))
      .order("desc")
      .collect();
    for (const r of rows) {
      if (r.userId !== userId) continue;
      return r;
    }
    return null;
  },
});

/**
 * Workout ids with an active (non-reverted) intervention for the current user.
 * Interventions are infrequent, so the row scan is cheap and the result small —
 * the calendar uses it to badge every reshaped session at once without a query
 * per cell.
 */
export const activeInterventionWorkoutIds = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx): Promise<string[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("coachInterventions")
      .withIndex("by_userId_firedAt", (q) => q.eq("userId", userId))
      .collect();
    const ids = new Set<string>();
    for (const r of rows) {
      if (r.revertedAt == null) ids.add(r.workoutId);
    }
    return [...ids];
  },
});

export const revertIntervention = mutation({
  args: { interventionId: v.id("coachInterventions") },
  handler: async (ctx, { interventionId }) => {
    const userId: Id<"users"> | null = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    const row = await ctx.db.get(interventionId);
    if (!row || row.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Intervention not found",
      });
    }
    if (row.revertedAt) return;

    await ctx.runMutation(components.agoge.public.updateWorkout, {
      workoutId: row.workoutId,
      type: row.originalType as
        | "threshold"
        | "race"
        | "easy"
        | "intervals"
        | "long"
        | "race_pace"
        | "recovery"
        | "test",
      name: row.originalName,
      planned: row.originalPlanned,
    });
    await ctx.db.patch(interventionId, { revertedAt: Date.now() });
  },
});
