/**
 * Engine: daily evaluation — one deterministic ruleset that integrates all
 * proactive plan-adjustment signals (HRV readiness, weekly adherence, …) and
 * fires at most one workout modification per ISO week.
 *
 * Runs nightly via cron. The Engine owns the decision and the plan write;
 * the Coach narrates in user voice (see coach/narrations/dailyEvaluation.ts).
 *
 * Rules, evaluated in order — first match wins:
 *   R0  Already acted this ISO week                            → none
 *   R1  HRV ≤ -1σ vs 14d baseline AND next quality ≤ 36h away   → soften (0.8×)
 *   R2  ≥2 confirmed-missed quality sessions this ISO week     → soften (1.0×)
 *   ——  otherwise                                              → none
 *
 * Quality = workout type in HIGH_INTENSITY_TYPES. R2 only counts workouts the
 * user has explicitly marked `missed`; stale `planned` rows past their date
 * are invisible to the Engine ([[no-plan-changes-on-uncertain-signals]]).
 */

import { v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";

const RULE_HRV_LOW = "hrv_low_v1";
const RULE_ADHERENCE_LOW = "adherence_low_v1";

const HRV_Z_THRESHOLD = -1.0;
const HRV_LOOKAHEAD_HOURS = 36;
const ADHERENCE_MIN_MISSED = 2;

const HRV_DURATION_SCALE = 0.8; // deload under-recovered athlete
const ADHERENCE_DURATION_SCALE = 1.0; // keep volume, drop intensity only

const HIGH_INTENSITY_TYPES = new Set([
  "threshold",
  "intervals",
  "race_pace",
  "test",
]);

const MS_PER_HOUR = 60 * 60 * 1000;

/** Monday 00:00:00 UTC of the ISO week containing `t` (inclusive lower bound). */
function isoWeekStartUtcMs(t: number): number {
  const d = new Date(t);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.getTime();
}

/** Next Monday 00:00:00 UTC (exclusive upper bound). */
function isoWeekEndUtcMs(t: number): number {
  return isoWeekStartUtcMs(t) + 7 * 24 * 60 * 60 * 1000;
}

type WeekWorkout = {
  _id: string;
  type: string;
  status: string;
  planned?: { date: string } | null | undefined;
};

function plannedDateMs(w: WeekWorkout): number | null {
  const iso = w.planned?.date;
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

export const runForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.id("coachInterventions")),
  handler: async (
    ctx,
    { userId },
  ): Promise<Id<"coachInterventions"> | null> => {
    const now = Date.now();
    const weekStart = isoWeekStartUtcMs(now);
    const weekEnd = isoWeekEndUtcMs(now);

    // Accumulate one structured trace across all decision points and emit a
    // single log line at the terminal path. One row per run in the dashboard.
    const trace: Record<string, unknown> = {
      userId,
      isoWeekStart: new Date(weekStart).toISOString(),
      isoWeekEnd: new Date(weekEnd).toISOString(),
    };
    const emit = (outcome: string, extra: Record<string, unknown> = {}) => {
      console.log(
        `[dailyEval] ${JSON.stringify({ outcome, ...trace, ...extra })}`,
      );
    };

    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    if (!user) return emit("skipped", { reason: "user_not_found" }), null;
    if (user.coachInterventionsEnabled === false)
      return emit("skipped", { reason: "coach_interventions_disabled" }), null;
    if (!user.hasCompletedOnboarding)
      return emit("skipped", { reason: "not_onboarded" }), null;

    // R0 — already acted this ISO week? Bail before doing any further reads.
    const alreadyActed = await ctx.runQuery(
      internal.engine.interventions.interventionFiredSince,
      { userId, sinceMs: weekStart },
    );
    if (alreadyActed)
      return emit("skipped", { reason: "already_acted_this_week" }), null;

    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return emit("skipped", { reason: "no_athlete" }), null;

    // Single bundled read of this week's workouts. Both rules read from it.
    const weekWorkouts: WeekWorkout[] = await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: athlete._id,
        startDate: new Date(weekStart).toISOString(),
        endDate: new Date(weekEnd).toISOString(),
      },
    );

    const quality = weekWorkouts.filter((w) =>
      HIGH_INTENSITY_TYPES.has(w.type),
    );

    // Next remaining quality session in this ISO week (status=planned, date>now),
    // chronologically first. Used by R1 (with 36h gate) and R2.
    const nextQuality = quality
      .filter((w) => {
        if (w.status !== "planned") return false;
        const t = plannedDateMs(w);
        return t !== null && t > now;
      })
      .sort((a, b) => (plannedDateMs(a) ?? 0) - (plannedDateMs(b) ?? 0))[0];

    const missedQualityCount = quality.filter(
      (w) => w.status === "missed",
    ).length;

    const readiness = await ctx.runQuery(
      internal.soma.index.getHrvReadiness,
      { userId },
    );

    const nextQualityHoursAway =
      nextQuality && plannedDateMs(nextQuality) !== null
        ? Math.round(
            ((plannedDateMs(nextQuality) as number) - now) / MS_PER_HOUR,
          )
        : null;

    trace.signals = {
      weekWorkoutCount: weekWorkouts.length,
      qualityWorkoutCount: quality.length,
      missedQualityCount,
      nextQualityWorkoutId: nextQuality?._id ?? null,
      nextQualityType: nextQuality?.type ?? null,
      nextQualityHoursAway,
      hrvZScore: readiness?.hrvZScore ?? null,
      hrvToday: readiness?.hrvToday ?? null,
      hrvBaseline14d: readiness?.hrvBaseline14d ?? null,
    };

    // R1 — HRV-driven softening, only if quality is imminent.
    const r1HrvLow =
      readiness != null && readiness.hrvZScore <= HRV_Z_THRESHOLD;
    const r1QualityImminent =
      nextQualityHoursAway !== null &&
      nextQualityHoursAway <= HRV_LOOKAHEAD_HOURS;
    trace.R1 = {
      hrvAvailable: readiness != null,
      hrvLow: r1HrvLow,
      qualityImminent: r1QualityImminent,
    };
    if (r1HrvLow && r1QualityImminent && nextQuality) {
      const interventionId = await ctx.runMutation(
        internal.engine.interventions.applyModificationAndRecord,
        {
          userId,
          workoutId: nextQuality._id,
          ruleId: RULE_HRV_LOW,
          signals: {
            hrvToday: readiness!.hrvToday,
            hrvBaseline14d: readiness!.hrvBaseline14d,
            hrvZScore: readiness!.hrvZScore,
            sleepHoursLastNight: readiness!.sleepHoursLastNight,
            rhrToday: readiness!.rhrToday,
          },
          durationScale: HRV_DURATION_SCALE,
        },
      );
      emit("acted", {
        rule: RULE_HRV_LOW,
        interventionId,
        workoutId: nextQuality._id,
      });
      return interventionId;
    }

    // R2 — adherence-driven softening when the user has confirmed missing
    // quality sessions this week. Only counts explicit `missed` status, per
    // [[no-plan-changes-on-uncertain-signals]].
    trace.R2 = {
      missedQualityCount,
      threshold: ADHERENCE_MIN_MISSED,
      hasNextQuality: nextQuality != null,
    };
    if (missedQualityCount >= ADHERENCE_MIN_MISSED && nextQuality) {
      const interventionId = await ctx.runMutation(
        internal.engine.interventions.applyModificationAndRecord,
        {
          userId,
          workoutId: nextQuality._id,
          ruleId: RULE_ADHERENCE_LOW,
          signals: { weekMissedQualityCount: missedQualityCount },
          durationScale: ADHERENCE_DURATION_SCALE,
        },
      );
      emit("acted", {
        rule: RULE_ADHERENCE_LOW,
        interventionId,
        workoutId: nextQuality._id,
      });
      return interventionId;
    }

    emit("none", { reason: "no_rule_matched" });
    return null;
  },
});
