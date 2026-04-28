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
import { fromSoma } from "./adapter";

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
    const inferenceActivity = fromSoma.activity(latestActivity);

    console.log(
      `${TAG} ✓ Latest activity:\n` +
        `    Soma ID: ${latestActivity._id}\n` +
        `    Type: ${inferenceActivity.sessionType}  |  Started: ${new Date(inferenceActivity.startTime).toLocaleString()}\n` +
        `    Duration: ${fmtDuration(inferenceActivity.durationSeconds)}  |  Distance: ${fmtKm(inferenceActivity.distanceMeters)}  |  Pace: ${fmtPace(inferenceActivity.durationSeconds, inferenceActivity.distanceMeters)}\n` +
        `    HR: avg ${inferenceActivity.avgHeartRate ?? "—"} bpm  |  max ${inferenceActivity.maxHeartRate ?? "—"} bpm`,
    );

    const runningTypes = [
      "easy",
      "tempo",
      "intervals",
      "long_run",
      "race",
      "unstructured",
    ];
    if (
      inferenceActivity.sessionType &&
      !runningTypes.includes(inferenceActivity.sessionType)
    ) {
      console.log(
        `${TAG} ✗ Activity type "${inferenceActivity.sessionType}" is not running. Skipping.`,
      );
      return null;
    }

    const activityStartMs = inferenceActivity.startTime;

    // ── Step 3: Find eligible planned workouts ──────────────────────────────
    const windowStartMs = now - 24 * 60 * 60 * 1000;
    const windowEndMs = now + 3 * 60 * 60 * 1000;

    type AgogeWorkout = {
      _id: string;
      name: string;
      scheduledDate: string;
      status: "planned" | "completed" | "missed" | "skipped";
    };
    const candidates = (await ctx.runQuery(
      components.agoge.public.getWorkoutsByAthlete,
      {
        athleteId: athlete._id,
        startDate: toIsoDate(windowStartMs),
        endDate: toIsoDate(windowEndMs),
      },
    )) as AgogeWorkout[];

    const eligible = candidates.filter((w) => w.status === "planned");

    console.log(
      `${TAG} Found ${candidates.length} workouts in window, ${eligible.length} eligible (status=planned)`,
    );

    if (eligible.length === 0) {
      console.log(`${TAG} ✗ No eligible workouts.`);
      return null;
    }

    // ── Match: closest by scheduled date ────────────────────────────────────
    const matched = findClosestByDate(eligible, activityStartMs);
    if (!matched) {
      console.log(`${TAG} ✗ No match.`);
      return null;
    }

    const deltaH = (
      Math.abs(activityStartMs - Date.parse(matched.scheduledDate)) /
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
        durationSeconds: inferenceActivity.durationSeconds,
        distanceMeters: inferenceActivity.distanceMeters,
        avgPaceMps:
          inferenceActivity.distanceMeters && inferenceActivity.durationSeconds
            ? inferenceActivity.distanceMeters / inferenceActivity.durationSeconds
            : undefined,
        avgHr: inferenceActivity.avgHeartRate,
        maxHr: inferenceActivity.maxHeartRate,
        load: inferenceActivity.trainingLoad,
        notes: `externalRef:${latestActivity._id}`,
      },
    });

    console.log(
      `\n${TAG} ✓ Workout "${matched.name}" marked COMPLETED (externalRef=${latestActivity._id})`,
    );

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendSessionCompleteNotification,
      {
        userId: args.cadenceUserId as unknown as import("../_generated/dataModel").Id<"users">,
        workoutId: matched._id,
        sessionType: matched.name,
      },
    );

    console.log(`${TAG} ✓ Push notification scheduled`);

    return null;
  },
});

// ─── Matching Helpers ─────────────────────────────────────────────────────────

function findClosestByDate<T extends { scheduledDate: string }>(
  workouts: readonly T[],
  targetMs: number,
): T | null {
  if (workouts.length === 0) return null;
  let best = workouts[0];
  let bestDiff = Math.abs(targetMs - Date.parse(best.scheduledDate));
  for (const w of workouts.slice(1)) {
    const diff = Math.abs(targetMs - Date.parse(w.scheduledDate));
    if (diff < bestDiff) {
      best = w;
      bestDiff = diff;
    }
  }
  return best;
}
