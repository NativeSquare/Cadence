/**
 * Soma - Centralized integration layer
 *
 * Single Soma instance and shared operations used across all providers.
 * Provider-specific operations live in their own files (garmin.ts, strava.ts).
 */

import { Soma } from "@nativesquare/soma";
import { plannedWorkoutValidator } from "@nativesquare/soma/validators";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import {
  internalMutation,
  internalQuery,
  query,
} from "../_generated/server";

export const soma = new Soma(components.soma);

// ---- Internal Helpers -------------------------------------------------------

/**
 * Get the authenticated user's ID. Used by actions that can't
 * call getAuthUserId directly (Convex actions lack query context).
 */
export const getAuthenticatedUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

// ---- Connections ------------------------------------------------------------

/**
 * List all Soma connections for the authenticated user.
 * Callers map / filter by provider as needed.
 */
export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await soma.listConnections(ctx, { userId });
  },
});

/**
 * Fetch a single connection by provider for a given user. Internal-only —
 * actions use it via `ctx.runQuery` before dispatching provider-specific calls.
 */
export const getConnectionByProvider = internalQuery({
  args: { userId: v.string(), provider: v.string() },
  handler: async (ctx, args) => {
    return await soma.getConnectionByProvider(ctx, {
      userId: args.userId,
      provider: args.provider,
    });
  },
});

// ---- Planned Workout ---------------------------------------------

/**
 * Ingest a SomaPlannedWorkout into the Soma component. Provider-agnostic —
 * garmin/strava export flows call it with the same validator-shaped payload.
 */
export const ingestPlannedWorkout = internalMutation({
  args: plannedWorkoutValidator,
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    return await soma.ingestPlannedWorkout(ctx, args);
  },
});

// ---- Readiness signals -----------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HRV_BASELINE_WINDOW_DAYS = 14;
const HRV_MIN_SAMPLES = 7;

/**
 * Compute today's HRV vs the user's 14-day personal baseline, plus companion
 * readiness signals (last night's sleep, today's resting HR). Returns null
 * when there isn't enough HRV history to compute a meaningful z-score —
 * the cron consumer should treat null as "skip, not enough signal yet."
 */
export const getHrvReadiness = internalQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      hrvToday: v.number(),
      hrvBaseline14d: v.number(),
      hrvStdDev: v.number(),
      hrvZScore: v.number(),
      sleepHoursLastNight: v.optional(v.number()),
      rhrToday: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const startTime = new Date(
      now - HRV_BASELINE_WINDOW_DAYS * MS_PER_DAY,
    ).toISOString();
    const endTime = new Date(now).toISOString();

    const dailies = await soma.listDaily(ctx, {
      userId,
      startTime,
      endTime,
      order: "asc",
    });

    const hrvSeries: { ts: number; value: number }[] = [];
    let rhrToday: number | undefined;
    for (const d of dailies) {
      const hrv = d.heart_rate_data?.summary?.avg_hrv_rmssd;
      if (typeof hrv === "number" && Number.isFinite(hrv) && hrv > 0) {
        const ts = Date.parse(d.metadata.start_time);
        if (Number.isFinite(ts)) hrvSeries.push({ ts, value: hrv });
      }
    }
    if (hrvSeries.length < HRV_MIN_SAMPLES) return null;

    // The last entry is "today's" reading. The baseline excludes it so a
    // single outlier day isn't smeared back into its own reference.
    const today = hrvSeries[hrvSeries.length - 1];
    const baseline = hrvSeries.slice(0, -1);
    if (baseline.length < HRV_MIN_SAMPLES - 1) return null;

    const mean =
      baseline.reduce((acc, s) => acc + s.value, 0) / baseline.length;
    const variance =
      baseline.reduce((acc, s) => acc + (s.value - mean) ** 2, 0) /
      baseline.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev <= 0) return null;
    const zScore = (today.value - mean) / stdDev;

    // Today's resting HR — from the same daily record as today's HRV.
    const todayDaily = dailies[dailies.length - 1];
    const rhrCandidate =
      todayDaily?.heart_rate_data?.summary?.resting_hr_bpm;
    if (typeof rhrCandidate === "number" && rhrCandidate > 0) {
      rhrToday = rhrCandidate;
    }

    // Last night's sleep — the most recent sleep record overlapping the
    // window between yesterday morning and now.
    let sleepHoursLastNight: number | undefined;
    const sleepStart = new Date(now - 36 * 60 * 60 * 1000).toISOString();
    const sleeps = await soma.listSleep(ctx, {
      userId,
      startTime: sleepStart,
      endTime,
      order: "desc",
      limit: 5,
    });
    for (const s of sleeps) {
      if (s.metadata.is_nap) continue;
      const sec = s.sleep_durations_data?.asleep?.duration_asleep_state_seconds;
      if (typeof sec === "number" && sec > 0) {
        sleepHoursLastNight = sec / 3600;
        break;
      }
    }

    return {
      hrvToday: today.value,
      hrvBaseline14d: mean,
      hrvStdDev: stdDev,
      hrvZScore: zScore,
      sleepHoursLastNight,
      rhrToday,
    };
  },
});

// ---- Dev seeding -----------------------------------------------------------

/**
 * DEV-ONLY helper: populate a controlled HRV history for a user so the
 * `hrv_low_v1` trigger can be exercised end-to-end without a real Garmin
 * connection feeding live data. Creates (or re-activates) a "GARMIN"
 * connection for the user, then writes `days` daily records — the last one
 * carrying today's date, with HRV set to a low value if `lowHrvToday` is true.
 *
 * Invocable from the Convex dashboard. DELETE THIS BEFORE LAUNCH (or gate
 * behind an admin role).
 */
export const seedHrvForTesting = internalMutation({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
    baselineHrv: v.optional(v.number()),
    lowHrvToday: v.optional(v.boolean()),
    todayHrvOverride: v.optional(v.number()),
  },
  returns: v.object({
    connectionId: v.string(),
    daysWritten: v.number(),
    todayHrv: v.number(),
    baselineMean: v.number(),
  }),
  handler: async (
    ctx,
    {
      userId,
      days = 14,
      baselineHrv = 55,
      lowHrvToday = true,
      todayHrvOverride,
    },
  ) => {
    // The id is branded against Soma's component namespace; from the host
    // app's perspective it's just a string we shuttle back into Soma APIs.
    const connectionId = await ctx.runMutation(
      components.soma.public.connect,
      { userId, provider: "GARMIN" },
    );

    // Cap raised to 120 so the Analytics 12-week HRV chart has data to render.
    const totalDays = Math.max(8, Math.min(120, days));
    const now = Date.now();
    let baselineSum = 0;
    let baselineCount = 0;
    let todayHrv = baselineHrv;

    for (let i = totalDays - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * MS_PER_DAY);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY - 1);

      const isToday = i === 0;
      // Slight day-to-day jitter so stddev > 0.
      const jitter = ((i * 7) % 9) - 4;
      let hrv: number;
      if (isToday) {
        hrv =
          todayHrvOverride ??
          (lowHrvToday
            ? Math.round(baselineHrv * 0.7)
            : baselineHrv + jitter);
        todayHrv = hrv;
      } else {
        hrv = baselineHrv + jitter;
        baselineSum += hrv;
        baselineCount += 1;
      }

      await soma.ingestDaily(ctx, {
        connectionId,
        userId,
        metadata: {
          start_time: dayStart.toISOString(),
          end_time: dayEnd.toISOString(),
          // 1 = automatic (matches Garmin's daily-record convention; the
          // value isn't read by the readiness query, but the validator
          // requires the field).
          upload_type: 1,
        },
        heart_rate_data: {
          summary: {
            avg_hrv_rmssd: hrv,
            resting_hr_bpm: 48 + (isToday && lowHrvToday ? 6 : 0),
          },
        },
      });
    }

    return {
      connectionId,
      daysWritten: totalDays,
      todayHrv,
      baselineMean: baselineCount > 0 ? baselineSum / baselineCount : baselineHrv,
    };
  },
});

/**
 * DEV-ONLY companion: wipe the seeded daily records for a user (by deleting
 * the GARMIN connection — Soma's disconnect leaves data in place, so this
 * helper deletes the connection row outright via deleteConnection).
 */
export const clearSeededHrv = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const conn = await soma.getConnectionByProvider(ctx, {
      userId,
      provider: "GARMIN",
    });
    if (!conn) return null;
    await ctx.runMutation(components.soma.public.deleteConnection, {
      connectionId: conn._id,
    });
    return null;
  },
});

/**
 * DEV-ONLY: insert a synthetic `coachInterventions` row so the HRV analytics
 * card has a marker to render without running the real trigger. The row uses
 * a fake workoutId — the workout-detail intervention card won't find it, but
 * the analytics dot + tap sheet will. Pair with `seedHrvForTesting` to also
 * have a chart for the dot to overlay.
 *
 * Invocable from the Convex dashboard. DELETE BEFORE LAUNCH.
 */
export const seedFakeInterventionForTesting = internalMutation({
  args: {
    userId: v.id("users"),
    daysAgo: v.optional(v.number()),
    notificationBody: v.optional(v.string()),
  },
  returns: v.id("coachInterventions"),
  handler: async (ctx, { userId, daysAgo = 5, notificationBody }) => {
    const firedAt = Date.now() - daysAgo * MS_PER_DAY;
    const user = await ctx.db.get(userId);
    const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";
    const body =
      notificationBody ??
      (locale === "fr"
        ? "HRV à 38 ms vs base 55. J'ai remplacé Tempo 8 km par un Z2 facile de 30 min — récupère bien aujourd'hui."
        : "HRV at 38 ms vs baseline 55. I swapped Tempo 8 km for an easy Z2 of 30 min — take it easy today.");
    return await ctx.db.insert("coachInterventions", {
      userId,
      workoutId: `seed-workout-${firedAt}`,
      ruleId: "hrv_low_v1",
      firedAt,
      signals: {
        hrvToday: 38,
        hrvBaseline14d: 55,
        hrvZScore: -1.4,
        sleepHoursLastNight: 5.8,
        rhrToday: 54,
      },
      originalType: "threshold",
      originalName: locale === "fr" ? "Tempo 8 km" : "Tempo 8 km",
      originalPlanned: {
        date: new Date(firedAt).toISOString().slice(0, 10),
        distanceMeters: 8000,
        durationSeconds: 2700,
      },
      originalDistanceMeters: 8000,
      originalDurationSeconds: 2700,
      newType: "easy",
      newName: locale === "fr" ? "Facile 30 min" : "Easy 30 min",
      newDistanceMeters: 5500,
      newDurationSeconds: 1800,
      notificationBody: body,
    });
  },
});

/**
 * DEV-ONLY: wipe every seeded intervention for this user. The seeded rows are
 * the ones with a `seed-workout-` prefix on `workoutId`.
 */
export const clearSeededInterventions = internalMutation({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("coachInterventions")
      .withIndex("by_userId_firedAt", (q) => q.eq("userId", userId))
      .collect();
    let deleted = 0;
    for (const r of rows) {
      if (!r.workoutId.startsWith("seed-workout-")) continue;
      await ctx.db.delete(r._id);
      deleted += 1;
    }
    return deleted;
  },
});

