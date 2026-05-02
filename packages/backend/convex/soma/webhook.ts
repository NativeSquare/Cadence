/**
 * Soma Activity Webhook Handler
 *
 * Called by Soma's registerRoutes after activity ingestion completes.
 * Matches the latest activity to an agoge planned workout by date/time,
 * flips its status to "completed" with the `actual` workoutFace populated,
 * and fires a push notification.
 */

import type { SomaActivity } from "@nativesquare/soma/validators";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

// Terra activity-type ids we treat as running.
// 8 = running, 97/98 = racing variants, 0 = unstructured/unknown.
// https://docs.tryterra.co/reference/enums#activity-types
const RUNNING_TERRA_TYPES = new Set([0, 8, 97, 98]);

// ─── Formatting helpers ──────────────────────────────────────────────────────

function fmtDuration(sec?: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtKm(meters?: number): string {
  if (!meters) return "—";
  return `${(meters / 1000).toFixed(2)} km`;
}

function fmtPace(sec?: number, meters?: number): string {
  if (!sec || !meters || meters === 0) return "—";
  const paceSecPerKm = sec / (meters / 1000);
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.round(paceSecPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// ─── Webhook Callback Entry Point ─────────────────────────────────────────────

export const handleActivityIngested = internalAction({
  args: { affectedUserIds: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    console.log(
      `\n${"═".repeat(60)}\n` +
        `  ACTIVITY INGESTED (via Soma)\n` +
        `  ${args.affectedUserIds.length} affected user${args.affectedUserIds.length === 1 ? "" : "s"}\n` +
        `  ${new Date().toLocaleString()}\n` +
        `${"═".repeat(60)}`,
    );

    for (const userId of args.affectedUserIds) {
      console.log(`\n[Match] Running workout matching for user ${userId}...`);
      await ctx.runAction(internal.soma.webhook.matchActivityToWorkout, {
        cadenceUserId: userId,
      });
    }

    console.log(
      `\n${"═".repeat(60)}\n` +
        `  WORKOUT MATCHING COMPLETE\n` +
        `${"═".repeat(60)}\n`,
    );

    return null;
  },
});

/**
 * Match an incoming activity to an agoge planned workout (closest scheduled
 * planned workout by time, within ±24h/+3h window). If matched, flip the
 * workout's status to "completed" with the `actual` workoutFace populated.
 */
export const matchActivityToWorkout = internalAction({
  args: { cadenceUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const TAG = "[Match]";

    console.log(
      `\n${"─".repeat(50)}\n` +
        `  WORKOUT MATCHING for user ${args.cadenceUserId}\n` +
        `${"─".repeat(50)}`,
    );

    // ── Step 1: Get athlete ────────────────────────────────────────────────
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId: args.cadenceUserId },
    );
    if (!athlete) {
      console.warn(`${TAG} ✗ No agoge athlete for this user. Cannot match.`);
      return null;
    }
    console.log(`${TAG} ✓ Athlete found: ${athlete._id}`);

    // ── Step 2: Fetch recent Soma activities ────────────────────────────────
    const now = Date.now();
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000).toISOString();

    const recentActivities = (await ctx.runQuery(
      components.soma.public.listActivities,
      {
        userId: args.cadenceUserId,
        startTime: sixHoursAgo,
        order: "desc" as const,
      },
    )) as Array<SomaActivity & { _id: string }>;

    if (recentActivities.length === 0) {
      console.log(`${TAG} ✗ No activities found in last 6 hours.`);
      return null;
    }

    const latestActivity = recentActivities[0];

    const startTimeMs = new Date(latestActivity.metadata.start_time).getTime();
    const endTimeMs = new Date(latestActivity.metadata.end_time).getTime();
    const computedDuration = Math.round((endTimeMs - startTimeMs) / 1000);
    const durationSeconds = computedDuration > 0 ? computedDuration : undefined;
    const distanceMeters = latestActivity.distance_data?.summary?.distance_meters;
    const avgHeartRate = latestActivity.heart_rate_data?.summary?.avg_hr_bpm;
    const maxHeartRate = latestActivity.heart_rate_data?.summary?.max_hr_bpm;
    const trainingLoad = latestActivity.TSS_data?.TSS_samples?.[0]?.actual;
    const terraType = latestActivity.metadata.type;

    console.log(
      `${TAG} ✓ Latest activity:\n` +
        `    Soma ID: ${latestActivity._id}\n` +
        `    Terra type: ${terraType ?? "—"}  |  Started: ${new Date(startTimeMs).toLocaleString()}\n` +
        `    Duration: ${fmtDuration(durationSeconds)}  |  Distance: ${fmtKm(distanceMeters)}  |  Pace: ${fmtPace(durationSeconds, distanceMeters)}\n` +
        `    HR: avg ${avgHeartRate ?? "—"} bpm  |  max ${maxHeartRate ?? "—"} bpm`,
    );

    if (terraType !== undefined && !RUNNING_TERRA_TYPES.has(terraType)) {
      console.log(
        `${TAG} ✗ Activity Terra type ${terraType} is not running. Skipping.`,
      );
      return null;
    }

    const activityStartMs = startTimeMs;

    // ── Step 3: Find eligible planned workouts ──────────────────────────────
    const windowStartMs = now - 24 * 60 * 60 * 1000;
    const windowEndMs = now + 3 * 60 * 60 * 1000;

    type AgogeWorkout = {
      _id: string;
      name: string;
      planned?: { date: string };
      status: "planned" | "completed" | "missed" | "skipped";
    };
    const candidates = (await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: athlete._id,
        startDate: toIsoDate(windowStartMs),
        endDate: toIsoDate(windowEndMs),
      },
    )) as AgogeWorkout[];

    const eligible = candidates.filter(
      (w) => w.status === "planned" && !!w.planned?.date,
    );

    console.log(
      `${TAG} Found ${candidates.length} workouts in window, ${eligible.length} eligible (status=planned)`,
    );

    if (eligible.length === 0) {
      console.log(`${TAG} ✗ No eligible workouts.`);
      return null;
    }

    // ── Match: closest by planned date ──────────────────────────────────────
    const matched = findClosestByDate(eligible, activityStartMs);
    if (!matched || !matched.planned?.date) {
      console.log(`${TAG} ✗ No match.`);
      return null;
    }

    const deltaH = (
      Math.abs(activityStartMs - Date.parse(matched.planned.date)) /
      (1000 * 60 * 60)
    ).toFixed(1);
    console.log(
      `${TAG} ✓ Match! "${matched.name}" (${deltaH}h from scheduled) — id: ${matched._id}`,
    );

    // ── Complete the workout in agoge ───────────────────────────────────────
    await ctx.runMutation(components.agoge.public.updateWorkout, {
      workoutId: matched._id,
      status: "completed" as const,
      actual: {
        date: toIsoDate(activityStartMs),
        durationSeconds,
        distanceMeters,
        avgPaceMps:
          distanceMeters && durationSeconds
            ? distanceMeters / durationSeconds
            : undefined,
        avgHr: avgHeartRate,
        maxHr: maxHeartRate,
        load: trainingLoad,
        notes: `externalRef:${latestActivity._id}`,
      },
    });

    console.log(
      `\n${TAG} ✓ Workout "${matched.name}" marked COMPLETED (externalRef=${latestActivity._id})`,
    );

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendWorkoutCompleteNotification,
      {
        userId: args.cadenceUserId as unknown as import("../_generated/dataModel").Id<"users">,
        workoutId: matched._id,
        workoutType: matched.name,
      },
    );

    console.log(`${TAG} ✓ Push notification scheduled`);

    return null;
  },
});

// ─── Matching Helpers ─────────────────────────────────────────────────────────

function findClosestByDate<T extends { planned?: { date: string } }>(
  workouts: readonly T[],
  targetMs: number,
): T | null {
  if (workouts.length === 0) return null;
  let best = workouts[0];
  let bestDiff = best.planned?.date
    ? Math.abs(targetMs - Date.parse(best.planned.date))
    : Number.POSITIVE_INFINITY;
  for (const w of workouts.slice(1)) {
    if (!w.planned?.date) continue;
    const diff = Math.abs(targetMs - Date.parse(w.planned.date));
    if (diff < bestDiff) {
      best = w;
      bestDiff = diff;
    }
  }
  return best;
}
