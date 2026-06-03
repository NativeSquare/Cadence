/**
 * Engine: weekly review — the Convex wrapper around the pure core.
 *
 * Runs once a week (Monday cron, per-user fan-out). The Engine owns the
 * decision and the plan writes; the Coach narrates after the fact
 * (see coach/narrations/weeklyReview.ts). This is the single proactive
 * heartbeat — there is no daily ruleset anymore.
 *
 * Flow:
 *   1. guard (onboarded, interventions enabled, has an athlete, once-per-week)
 *   2. reconcile the closed week — flip past-due `planned` → `missed`
 *      (the time boundary IS the confirmed signal; mid-week stays invisible)
 *   3. grade adherence + load via `evaluateWeeklyReview`
 *   4. reshape ONLY the upcoming week — scale kept sessions, drop filler on a deload
 *   5. journal the decision; return the review id iff something changed (→ narrate)
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import {
  type Locale,
  summarizeStructure,
  workoutName,
} from "../agoge/periodization";
import {
  evaluateWeeklyReview,
  type RawClosedWorkout,
  reconcileClosedWeek,
  scaleStructure,
  type UpcomingSession,
} from "./weeklyReview.core";

const RULE_ID = "weekly_review_v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Monday 00:00:00 UTC of the ISO week containing `t` (inclusive lower bound). */
function isoWeekStartUtcMs(t: number): number {
  const d = new Date(t);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.getTime();
}

type AgogeWorkout = {
  _id: string;
  type: string;
  status: string;
  planned?: { date: string; structure?: unknown } | null;
};

function plannedDateMs(w: AgogeWorkout): number | null {
  const iso = w.planned?.date;
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function plannedKm(w: AgogeWorkout): number {
  const s = w.planned?.structure;
  if (!s) return 0;
  return summarizeStructure(s as WorkoutStructure).distanceMeters / 1000;
}

// ---------------------------------------------------------------------------
// Host-DB helpers (the action has no ctx.db)
// ---------------------------------------------------------------------------

const signalsValidator = v.object({
  keyTotal: v.number(),
  keyMissed: v.number(),
  completionRatio: v.number(),
  baseTier: v.number(),
  streakEscalated: v.boolean(),
});

export const reviewForWeek = internalQuery({
  args: { userId: v.id("users"), upcomingWeekStart: v.string() },
  handler: async (ctx, { userId, upcomingWeekStart }) => {
    return await ctx.db
      .query("weeklyReviews")
      .withIndex("by_userId_upcomingWeekStart", (q) =>
        q.eq("userId", userId).eq("upcomingWeekStart", upcomingWeekStart),
      )
      .first();
  },
});

export const recordReview = internalMutation({
  args: {
    userId: v.id("users"),
    upcomingWeekStart: v.string(),
    tier: v.number(),
    signals: signalsValidator,
    scaleFactor: v.number(),
    scaledWorkoutIds: v.array(v.string()),
    droppedWorkoutIds: v.array(v.string()),
    autoMissedWorkoutIds: v.array(v.string()),
    changed: v.boolean(),
  },
  returns: v.id("weeklyReviews"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("weeklyReviews", {
      ...args,
      ranAt: Date.now(),
      ruleId: RULE_ID,
    });
  },
});

export const setReviewNotificationText = internalMutation({
  args: { reviewId: v.id("weeklyReviews"), body: v.string() },
  handler: async (ctx, { reviewId, body }) => {
    await ctx.db.patch(reviewId, { notificationBody: body });
  },
});

export const getReview = internalQuery({
  args: { reviewId: v.id("weeklyReviews") },
  handler: async (ctx, { reviewId }): Promise<Doc<"weeklyReviews"> | null> => {
    return await ctx.db.get(reviewId);
  },
});

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export const runForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.id("weeklyReviews")),
  handler: async (ctx, { userId }): Promise<Id<"weeklyReviews"> | null> => {
    const now = Date.now();
    const upcomingStartMs = isoWeekStartUtcMs(now);
    const closedStartMs = upcomingStartMs - WEEK_MS;
    const upcomingStartIso = new Date(upcomingStartMs).toISOString();
    const closedStartIso = new Date(closedStartMs).toISOString();
    const upcomingEndIso = new Date(upcomingStartMs + WEEK_MS).toISOString();

    const log = (outcome: string, extra: Record<string, unknown> = {}) =>
      console.log(
        `[weeklyReview] ${JSON.stringify({ outcome, userId, upcomingStartIso, ...extra })}`,
      );

    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    if (!user) return log("skipped", { reason: "user_not_found" }), null;
    if (user.coachInterventionsEnabled === false)
      return log("skipped", { reason: "coach_interventions_disabled" }), null;
    if (!user.hasCompletedOnboarding)
      return log("skipped", { reason: "not_onboarded" }), null;

    // Idempotency: one review per upcoming week (handles manual re-runs / retries).
    const existing = await ctx.runQuery(internal.engine.weeklyReview.reviewForWeek, {
      userId,
      upcomingWeekStart: upcomingStartIso,
    });
    if (existing) return log("skipped", { reason: "already_reviewed" }), null;

    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return log("skipped", { reason: "no_athlete" }), null;

    const locale: Locale = user.locale === "fr" ? "fr" : "en";

    // --- Gather the closed week (planned-face + completed), dedup by id ------
    const [closedPlanned, closedCompleted] = await Promise.all([
      ctx.runQuery(components.agoge.public.getPlannedWorkoutsByAthlete, {
        athleteId: athlete._id,
        startDate: closedStartIso,
        endDate: upcomingStartIso,
      }),
      ctx.runQuery(components.agoge.public.getCompletedWorkoutsByAthlete, {
        athleteId: athlete._id,
        startDate: closedStartIso,
        endDate: upcomingStartIso,
      }),
    ]);

    // Merge planned-face + completed into raw rows (dedup by id, completed
    // wins), then let the pure core reconcile — auto-miss past-due `planned`
    // sessions, but hold those within the grace window as pending.
    const rawById = new Map<string, RawClosedWorkout>();
    for (const w of closedCompleted as AgogeWorkout[]) {
      rawById.set(w._id, {
        workoutId: w._id,
        type: w.type as WorkoutType,
        status: "completed",
        plannedDateMs: plannedDateMs(w),
        plannedKm: plannedKm(w),
      });
    }
    for (const w of closedPlanned as AgogeWorkout[]) {
      if (rawById.has(w._id)) continue;
      rawById.set(w._id, {
        workoutId: w._id,
        type: w.type as WorkoutType,
        status: w.status,
        plannedDateMs: plannedDateMs(w),
        plannedKm: plannedKm(w),
      });
    }
    const { closed, autoMissedWorkoutIds } = reconcileClosedWeek(
      [...rawById.values()],
      now,
    );

    // --- Gather the upcoming week (only adjustable `planned`, never the race) -
    const upcomingRaw = (await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: athlete._id,
        startDate: upcomingStartIso,
        endDate: upcomingEndIso,
      },
    )) as AgogeWorkout[];
    const upcomingWorkouts = upcomingRaw.filter(
      (w) => w.status === "planned" && w.type !== "race",
    );
    const upcoming: UpcomingSession[] = upcomingWorkouts.map((w) => ({
      workoutId: w._id,
      type: w.type as WorkoutType,
      plannedKm: plannedKm(w),
    }));

    // --- Streak: did last week's review land on Tier ≥ 1? -------------------
    const prevReview = await ctx.runQuery(
      internal.engine.weeklyReview.reviewForWeek,
      { userId, upcomingWeekStart: closedStartIso },
    );
    const prevWeekAdjusted = (prevReview?.tier ?? 0) >= 1;

    const decision = evaluateWeeklyReview({ closed, upcoming, prevWeekAdjusted });

    // --- Apply the reconciliation + reshape ---------------------------------
    // Auto-miss first (independent of tier — it's just truth reconciliation).
    for (const id of autoMissedWorkoutIds) {
      await ctx.runMutation(components.agoge.public.updateWorkout, {
        workoutId: id,
        status: "missed",
      });
    }

    const dropSet = new Set(decision.dropWorkoutIds);
    const droppedWorkoutIds: string[] = [];
    const scaledWorkoutIds: string[] = [];

    if (decision.tier > 0) {
      for (const w of upcomingWorkouts) {
        if (dropSet.has(w._id)) {
          await ctx.runMutation(components.agoge.public.deleteWorkout, {
            workoutId: w._id,
          });
          droppedWorkoutIds.push(w._id);
          continue;
        }
        if (decision.scaleFactor < 1 && w.planned?.structure) {
          const scaled = scaleStructure(
            w.planned.structure as WorkoutStructure,
            decision.scaleFactor,
          );
          const name = workoutName({
            type: w.type as WorkoutType,
            distanceMeters: summarizeStructure(scaled).distanceMeters,
            structure: scaled,
            locale,
          });
          await ctx.runMutation(components.agoge.public.updateWorkout, {
            workoutId: w._id,
            name,
            planned: { date: w.planned.date, structure: scaled },
          });
          scaledWorkoutIds.push(w._id);
        }
      }
    }

    const changed = droppedWorkoutIds.length > 0 || scaledWorkoutIds.length > 0;

    const reviewId = await ctx.runMutation(
      internal.engine.weeklyReview.recordReview,
      {
        userId,
        upcomingWeekStart: upcomingStartIso,
        tier: decision.tier,
        signals: decision.signals,
        scaleFactor: decision.scaleFactor,
        scaledWorkoutIds,
        droppedWorkoutIds,
        autoMissedWorkoutIds,
        changed,
      },
    );

    log("done", {
      tier: decision.tier,
      changed,
      autoMissed: autoMissedWorkoutIds.length,
      scaled: scaledWorkoutIds.length,
      dropped: droppedWorkoutIds.length,
    });

    // Narrate only when the plan actually changed — no weekly noise otherwise.
    return changed ? reviewId : null;
  },
});
