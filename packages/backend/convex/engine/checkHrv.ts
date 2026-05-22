/**
 * Engine: HRV-low readiness check (rule `hrv_low_v1`).
 *
 * Deterministic adaptation evaluated by the nightly cron. When today's HRV is
 * more than one standard deviation below the user's 14-day baseline AND a
 * high-intensity workout sits within the next 36h, the workout is auto-
 * modified to an easy Z2 at 0.8× the original duration. The Engine owns the
 * decision and the plan write; the Coach owns telling the athlete what
 * happened (see coach/narrations/hrvLowReadiness.ts).
 *
 * `runForUser` returns the new intervention id (or null). The cron
 * orchestrator hands a non-null id to the narration helper.
 *
 * No accept/deny in v1 — the Engine acts and the Coach tells, then offers a
 * one-tap revert from the workout detail card.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { summarizeStructure } from "../agoge/periodization";

const RULE_ID = "hrv_low_v1";
const HRV_Z_THRESHOLD = -1.0;
const LOOKAHEAD_MS = 36 * 60 * 60 * 1000;
const COOLDOWN_MS = 72 * 60 * 60 * 1000;
const DURATION_SCALE = 0.8;
const HIGH_INTENSITY_TYPES = new Set([
  "threshold",
  "intervals",
  "race_pace",
  "test",
]);

function round5min(seconds: number): number {
  const min = Math.max(20, Math.round(seconds / 60));
  return Math.round(min / 5) * 5 * 60;
}

function easyName(locale: "en" | "fr", durationSec: number): string {
  const min = Math.round(durationSec / 60);
  return locale === "fr" ? `Facile ${min} min` : `Easy ${min} min`;
}

export const recentInterventionForUser = internalQuery({
  args: { userId: v.id("users"), withinMs: v.number() },
  handler: async (ctx, { userId, withinMs }) => {
    const since = Date.now() - withinMs;
    const row = await ctx.db
      .query("coachInterventions")
      .withIndex("by_userId_firedAt", (q) =>
        q.eq("userId", userId).gte("firedAt", since),
      )
      .first();
    return row != null;
  },
});

export const applyModificationAndRecord = internalMutation({
  args: {
    userId: v.id("users"),
    workoutId: v.string(),
    signals: v.object({
      hrvToday: v.number(),
      hrvBaseline14d: v.number(),
      hrvZScore: v.number(),
      sleepHoursLastNight: v.optional(v.number()),
      rhrToday: v.optional(v.number()),
    }),
  },
  returns: v.union(v.null(), v.id("coachInterventions")),
  handler: async (ctx, { userId, workoutId, signals }) => {
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

    // 0.8× duration (or distance if no duration is known), rounded to a
    // friendly 5-minute boundary. We deliberately clear structure: an easy
    // run carries its volume in distance/duration, not in steps.
    const newDuration =
      originalDuration && originalDuration > 0
        ? round5min(originalDuration * DURATION_SCALE)
        : undefined;
    const newDistance =
      originalDistance && originalDistance > 0
        ? Math.round(originalDistance * DURATION_SCALE)
        : undefined;

    const newName = easyName(locale, newDuration ?? 30 * 60);

    // Single easy step — distance-anchored if we have it, otherwise time. The
    // planned face requires a structure; an easy run is just one continuous
    // work step at RPE 3.
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

    const interventionId = await ctx.db.insert("coachInterventions", {
      userId,
      workoutId,
      ruleId: RULE_ID,
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
    return interventionId;
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

export const runForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.id("coachInterventions")),
  handler: async (
    ctx,
    { userId },
  ): Promise<Id<"coachInterventions"> | null> => {
    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    if (!user) return null;
    if (user.coachInterventionsEnabled === false) return null;
    if (!user.hasCompletedOnboarding) return null;

    const onCooldown = await ctx.runQuery(
      internal.engine.checkHrv.recentInterventionForUser,
      { userId, withinMs: COOLDOWN_MS },
    );
    if (onCooldown) return null;

    const readiness = await ctx.runQuery(
      internal.soma.index.getHrvReadiness,
      { userId },
    );
    if (!readiness) return null;
    if (readiness.hrvZScore >= HRV_Z_THRESHOLD) return null;

    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return null;

    const now = Date.now();
    const start = new Date(now).toISOString();
    const end = new Date(now + LOOKAHEAD_MS).toISOString();
    const upcoming = await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      { athleteId: athlete._id, startDate: start, endDate: end },
    );
    const target = upcoming
      .filter(
        (w) => w.status === "planned" && HIGH_INTENSITY_TYPES.has(w.type),
      )
      .sort((a, b) => {
        const ad = a.planned?.date ?? "";
        const bd = b.planned?.date ?? "";
        return ad.localeCompare(bd);
      })[0];
    if (!target) return null;

    const interventionId = await ctx.runMutation(
      internal.engine.checkHrv.applyModificationAndRecord,
      { userId, workoutId: target._id, signals: readiness },
    );
    return interventionId;
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
