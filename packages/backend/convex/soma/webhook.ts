/**
 * Soma Activity Webhook Handler
 *
 * Called by Soma's registerRoutes after activity ingestion completes.
 * Receives affected Cadence userIds and runs session matching:
 * 1. For each affected user, matches the latest activity to a planned session
 * 2. Marks the session as completed with actual metrics
 * 3. Sends a congratulatory push notification
 */

import type { SomaActivity } from "@nativesquare/soma/validators";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
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

// ─── Webhook Callback Entry Point ─────────────────────────────────────────────

/**
 * Called by the registerRoutes `activities` callback after Soma ingests
 * activity data. Receives the Cadence userIds of affected users and runs
 * session matching for each.
 */
export const handleActivityIngested = internalAction({
  args: { affectedUserIds: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(
      `\n${"═".repeat(60)}\n` +
      `  ACTIVITY INGESTED (via Soma)\n` +
      `  ${args.affectedUserIds.length} affected user${args.affectedUserIds.length === 1 ? "" : "s"}\n` +
      `  ${new Date().toLocaleString()}\n` +
      `${"═".repeat(60)}`,
    );

    for (const userId of args.affectedUserIds) {
      console.log(`\n[Match] Running session matching for user ${userId}...`);

      await ctx.runMutation(
        internal.soma.webhook.matchActivityToSession,
        { cadenceUserId: userId as any },
      );
    }

    console.log(
      `\n${"═".repeat(60)}\n` +
      `  SESSION MATCHING COMPLETE\n` +
      `${"═".repeat(60)}\n`,
    );

    return null;
  },
});

/**
 * Match an incoming activity to a planned session using tiered matching:
 *
 * Tier 1 — Exported workout match (high confidence):
 *   Query Soma planned workouts for the activity date. Find ones with
 *   provider_workout_id set (actually pushed to Garmin). Their metadata.id
 *   is the Cadence session._id → direct lookup. If multiple, pick closest
 *   by time.
 *
 * Tier 2 — Non-exported session match (medium confidence):
 *   Fallback for ad-hoc runs: find any scheduled sessions for the day and
 *   match closest by time.
 *
 * Tier 3 — No match:
 *   Activity is stored in Soma but not linked to a session.
 */
export const matchActivityToSession = internalMutation({
  args: { cadenceUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const TAG = "[Match]";

    console.log(
      `\n${"─".repeat(50)}\n` +
      `  SESSION MATCHING for user ${args.cadenceUserId}\n` +
      `${"─".repeat(50)}`,
    );

    // ── Step 1: Get runner ──────────────────────────────────────────────────
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.cadenceUserId))
      .first();

    if (!runner) {
      console.warn(`${TAG} ✗ No runner profile found for this user. Cannot match.`);
      return null;
    }
    console.log(`${TAG} ✓ Runner found: ${runner._id}`);

    // ── Step 2: Fetch recent Soma activities ────────────────────────────────
    const now = Date.now();
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000).toISOString();
    console.log(`${TAG} Querying Soma for activities since ${sixHoursAgo}...`);

    const recentActivities = (await ctx.runQuery(
      components.soma.public.listActivities,
      {
        userId: args.cadenceUserId,
        startTime: sixHoursAgo,
        order: "desc" as const,
      },
    )) as Array<SomaActivity & { _id: string }>;

    if (recentActivities.length === 0) {
      console.log(`${TAG} ✗ No activities found in last 6 hours. Nothing to match.`);
      return null;
    }

    const latestActivity = recentActivities[0];
    const inferenceActivity = fromSoma.activity(latestActivity);

    console.log(
      `${TAG} ✓ Found ${recentActivities.length} recent activit${recentActivities.length === 1 ? "y" : "ies"}. Using latest:\n` +
      `    Soma ID: ${latestActivity._id}\n` +
      `    Type: ${inferenceActivity.sessionType}  |  Started: ${new Date(inferenceActivity.startTime).toLocaleString()}\n` +
      `    Duration: ${fmtDuration(inferenceActivity.durationSeconds)}  |  Distance: ${fmtKm(inferenceActivity.distanceMeters)}  |  Pace: ${fmtPace(inferenceActivity.durationSeconds, inferenceActivity.distanceMeters)}\n` +
      `    HR: avg ${inferenceActivity.avgHeartRate ?? "—"} bpm  |  max ${inferenceActivity.maxHeartRate ?? "—"} bpm`,
    );

    // Only match running-type activities
    const runningTypes = ["easy", "tempo", "intervals", "long_run", "race", "unstructured"];
    if (
      inferenceActivity.sessionType &&
      !runningTypes.includes(inferenceActivity.sessionType)
    ) {
      console.log(
        `${TAG} ✗ Activity type "${inferenceActivity.sessionType}" is not a running type. Skipping match.`,
      );
      return null;
    }

    const activityStartMs = inferenceActivity.startTime;

    // ── Step 3: Find eligible planned sessions ──────────────────────────────
    const windowStart = now - 24 * 60 * 60 * 1000;
    const windowEnd = now + 3 * 60 * 60 * 1000;

    console.log(
      `\n${TAG} Searching planned sessions in window:\n` +
      `    From: ${new Date(windowStart).toLocaleString()} (24h ago)\n` +
      `    To:   ${new Date(windowEnd).toLocaleString()} (3h ahead)`,
    );

    const sessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_date", (q) =>
        q
          .eq("runnerId", runner._id)
          .gte("scheduledDate", windowStart)
          .lte("scheduledDate", windowEnd),
      )
      .collect();

    const scheduledSessions = sessions.filter(
      (s) => s.status === "scheduled" && !s.isRestDay,
    );

    console.log(
      `${TAG} Found ${sessions.length} total sessions, ${scheduledSessions.length} eligible (status=scheduled, not rest day)`,
    );

    if (scheduledSessions.length > 0) {
      for (const s of scheduledSessions) {
        console.log(
          `    • "${s.sessionTypeDisplay}" — target: ${fmtDuration(s.targetDurationSeconds)} / ${fmtKm(s.targetDistanceMeters)} — scheduled: ${new Date(s.scheduledDate).toLocaleString()} — id: ${s._id}`,
        );
      }
    }

    if (scheduledSessions.length === 0) {
      console.log(`${TAG} ✗ No eligible sessions in window. Activity will remain unmatched.`);
      return null;
    }

    // ── Tier 1: Match via exported Soma planned workouts ────────────────────
    const activityDate = new Date(activityStartMs).toISOString().slice(0, 10);

    console.log(
      `\n${TAG} ── Tier 1: Checking for exported workouts on ${activityDate}...`,
    );

    const plannedWorkouts = (await ctx.runQuery(
      components.soma.public.listPlannedWorkouts,
      {
        userId: args.cadenceUserId,
        startDate: activityDate,
        endDate: activityDate,
      },
    )) as Array<{ metadata: { id?: string; provider_workout_id?: string } }>;

    // Filter to workouts that were actually pushed to Garmin
    const exportedWorkouts = plannedWorkouts.filter(
      (pw) => pw.metadata.provider_workout_id,
    );

    console.log(
      `${TAG} Soma planned workouts for date: ${plannedWorkouts.length} total, ${exportedWorkouts.length} exported to Garmin`,
    );

    let matchedSession: (typeof scheduledSessions)[number] | null = null;
    let matchTier: 1 | 2 = 2;

    if (exportedWorkouts.length > 0) {
      const exportedSessionIds = new Set(
        exportedWorkouts
          .map((pw) => pw.metadata.id)
          .filter(Boolean) as string[],
      );

      const exportedSessions = scheduledSessions.filter((s) =>
        exportedSessionIds.has(s._id),
      );

      console.log(
        `${TAG} Exported session IDs: [${[...exportedSessionIds].join(", ")}]`,
      );
      console.log(
        `${TAG} Matches with eligible sessions: ${exportedSessions.length}`,
      );

      if (exportedSessions.length === 1) {
        matchedSession = exportedSessions[0];
        matchTier = 1;
      } else if (exportedSessions.length > 1) {
        matchedSession = findClosestByTime(exportedSessions, activityStartMs);
        matchTier = 1;
      }

      if (matchedSession) {
        console.log(
          `${TAG} ✓ Tier 1 match! Exported workout → "${matchedSession.sessionTypeDisplay}" (${matchedSession._id})`,
        );
      } else {
        console.log(
          `${TAG} No Tier 1 match — exported session IDs don't match any eligible sessions`,
        );
      }
    } else {
      console.log(`${TAG} No exported workouts found — skipping Tier 1`);
    }

    // ── Tier 2: Fallback to closest scheduled session by time ───────────────
    if (!matchedSession) {
      console.log(`\n${TAG} ── Tier 2: Matching by closest time...`);

      matchedSession = findClosestByTime(scheduledSessions, activityStartMs);
      matchTier = 2;

      if (matchedSession) {
        const delta = Math.abs(activityStartMs - matchedSession.scheduledDate);
        const deltaH = (delta / (1000 * 60 * 60)).toFixed(1);
        console.log(
          `${TAG} ✓ Tier 2 match! Closest session: "${matchedSession.sessionTypeDisplay}" (${deltaH}h apart)`,
        );
      }
    }

    // ── Tier 3: No match possible ───────────────────────────────────────────
    if (!matchedSession) {
      console.log(`\n${TAG} ✗ Tier 3: No match possible. Activity stored in Soma but unlinked.`);
      return null;
    }

    // ── Calculate adherence ─────────────────────────────────────────────────
    const adherenceScore = calculateAdherence(
      matchedSession,
      inferenceActivity.durationSeconds,
      inferenceActivity.distanceMeters,
    );

    console.log(
      `\n${TAG} ── Adherence Calculation ──\n` +
      `    Duration: actual ${fmtDuration(inferenceActivity.durationSeconds)} vs target ${fmtDuration(matchedSession.targetDurationSeconds)}\n` +
      `    Distance: actual ${fmtKm(inferenceActivity.distanceMeters)} vs target ${fmtKm(matchedSession.targetDistanceMeters)}\n` +
      `    Score: ${adherenceScore !== undefined ? `${(adherenceScore * 100).toFixed(0)}%` : "N/A (no targets to compare)"}`,
    );

    // ── Patch session as completed ──────────────────────────────────────────
    await ctx.db.patch(matchedSession._id, {
      status: "completed" as const,
      completedActivityId: latestActivity._id,
      completedAt: now,
      actualDurationSeconds: inferenceActivity.durationSeconds,
      actualDistanceMeters: inferenceActivity.distanceMeters
        ? Math.round(inferenceActivity.distanceMeters)
        : undefined,
      adherenceScore,
    });

    console.log(
      `\n${TAG} ✓ Session "${matchedSession.sessionTypeDisplay}" marked as COMPLETED\n` +
      `    Session ID: ${matchedSession._id}\n` +
      `    Linked to Soma activity: ${latestActivity._id}\n` +
      `    Match tier: ${matchTier} (${matchTier === 1 ? "exported workout" : "closest by time"})`,
    );

    // ── Schedule push notification ──────────────────────────────────────────
    console.log(`\n${TAG} Scheduling push notification → debrief screen...`);

    await ctx.scheduler.runAfter(
      0,
      internal.integrations.notifications.sendSessionCompleteNotification,
      {
        userId: args.cadenceUserId,
        sessionId: matchedSession._id,
        sessionType: matchedSession.sessionTypeDisplay,
      },
    );

    console.log(`${TAG} ✓ Push notification scheduled`);

    return null;
  },
});

// ─── Matching Helpers ─────────────────────────────────────────────────────────

function findClosestByTime<T extends { scheduledDate: number }>(
  sessions: T[],
  targetMs: number,
): T | null {
  if (sessions.length === 0) return null;
  let best = sessions[0];
  let bestDiff = Math.abs(targetMs - best.scheduledDate);
  for (const session of sessions.slice(1)) {
    const diff = Math.abs(targetMs - session.scheduledDate);
    if (diff < bestDiff) {
      best = session;
      bestDiff = diff;
    }
  }
  return best;
}

// ─── Adherence Calculation ────────────────────────────────────────────────────

function calculateAdherence(
  session: { targetDurationSeconds?: number; targetDistanceMeters?: number },
  actualDurationSeconds?: number,
  actualDistanceMeters?: number,
): number | undefined {
  const scores: number[] = [];

  if (
    session.targetDurationSeconds &&
    session.targetDurationSeconds > 0 &&
    actualDurationSeconds &&
    actualDurationSeconds > 0
  ) {
    scores.push(
      Math.min(
        actualDurationSeconds / session.targetDurationSeconds,
        session.targetDurationSeconds / actualDurationSeconds,
      ),
    );
  }

  if (
    session.targetDistanceMeters &&
    session.targetDistanceMeters > 0 &&
    actualDistanceMeters &&
    actualDistanceMeters > 0
  ) {
    scores.push(
      Math.min(
        actualDistanceMeters / session.targetDistanceMeters,
        session.targetDistanceMeters / actualDistanceMeters,
      ),
    );
  }

  if (scores.length === 0) return undefined;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
