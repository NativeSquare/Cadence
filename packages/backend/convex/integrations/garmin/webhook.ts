/**
 * Garmin Activity Webhook Handler
 *
 * Processes incoming Garmin webhook payloads:
 * 1. Delegates ingestion to Soma (which normalizes + stores the activity)
 * 2. Resolves Garmin userId → Cadence userId via garminUserMappings
 * 3. Matches the new activity to a planned session for today
 * 4. Marks the session as completed with actual metrics
 * 5. Sends a congratulatory push notification
 */

import { Soma } from "@nativesquare/soma";
import { v } from "convex/values";
import { components, internal } from "../../_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../../_generated/server";
import {
  transformSomaActivity,
  type SomaActivity,
} from "../../lib/somaAdapter";

const soma = new Soma(components.soma);

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface GarminWebhookActivityItem {
  userId: string;
  summaryId: string;
  [key: string]: unknown;
}

// ─── Webhook Entry Point ──────────────────────────────────────────────────────

/**
 * Process a Garmin activities webhook payload.
 *
 * Called from http.ts when Garmin POSTs to /api/garmin/webhook/activities.
 */
export const processActivityWebhook = internalAction({
  args: { payload: v.any() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payload = args.payload;
    const items: GarminWebhookActivityItem[] = Array.isArray(payload)
      ? payload
      : [];

    console.log(
      `\n${"═".repeat(60)}\n` +
      `  GARMIN WEBHOOK RECEIVED\n` +
      `  ${items.length} activit${items.length === 1 ? "y" : "ies"} in payload\n` +
      `  ${new Date().toLocaleString()}\n` +
      `${"═".repeat(60)}`,
    );

    for (const item of items) {
      const dur = item.durationInSeconds as number | undefined;
      const dist = item.distanceInMeters as number | undefined;
      console.log(
        `  ► Activity "${item.summaryId}"\n` +
        `    garminUserId: ${item.userId}\n` +
        `    type: ${item.activityType ?? "unknown"}  |  duration: ${fmtDuration(dur)}  |  distance: ${fmtKm(dist)}  |  pace: ${fmtPace(dur, dist)}\n` +
        `    avgHR: ${item.averageHeartRateInBeatsPerMinute ?? "—"} bpm  |  maxHR: ${item.maxHeartRateInBeatsPerMinute ?? "—"} bpm`,
      );
    }

    // ── Step 1: Soma ingestion ──────────────────────────────────────────────
    console.log(`\n[Step 1/3] Sending payload to Soma for ingestion...`);
    const garminApi = components.soma.garmin;
    try {
      await ctx.runAction(garminApi.handleGarminWebhookActivities, {
        payload,
      });
      console.log(`[Step 1/3] ✓ Soma ingested ${items.length} activit${items.length === 1 ? "y" : "ies"} successfully`);
    } catch (err) {
      console.error(
        `[Step 1/3] ✗ Soma ingestion error: ${err instanceof Error ? err.message : err}`,
      );
      console.log(`[Step 1/3]   Continuing to session matching anyway...`);
    }

    // ── Step 2: Extract Garmin userIds ───────────────────────────────────────
    const garminUserIds = [
      ...new Set(items.map((item) => item.userId).filter(Boolean)),
    ];

    if (garminUserIds.length === 0) {
      console.log(`[Step 2/3] ✗ No userIds found in payload — nothing to match`);
      return null;
    }

    console.log(
      `\n[Step 2/3] Found ${garminUserIds.length} unique Garmin user${garminUserIds.length === 1 ? "" : "s"}: ${garminUserIds.join(", ")}`,
    );

    // ── Step 3: Resolve & match for each user ───────────────────────────────
    for (const garminUserId of garminUserIds) {
      console.log(`\n[Step 3/3] Resolving Garmin user "${garminUserId}" → Cadence user...`);

      const mapping = await ctx.runQuery(
        internal.integrations.garmin.webhook.lookupGarminMapping,
        { garminUserId },
      );

      if (!mapping) {
        console.warn(
          `[Step 3/3] ✗ No mapping found in garminUserMappings — this Garmin user is not linked to any Cadence account. Skipping.`,
        );
        continue;
      }

      console.log(
        `[Step 3/3] ✓ Mapped to Cadence user: ${mapping.cadenceUserId}`,
      );
      console.log(`[Step 3/3] Starting session matching...`);

      await ctx.runMutation(
        internal.integrations.garmin.webhook.matchActivityToSession,
        { cadenceUserId: mapping.cadenceUserId },
      );
    }

    console.log(
      `\n${"═".repeat(60)}\n` +
      `  WEBHOOK PROCESSING COMPLETE\n` +
      `${"═".repeat(60)}\n`,
    );

    return null;
  },
});

// ─── Internal Helpers ─────────────────────────────────────────────────────────

export const lookupGarminMapping = internalQuery({
  args: { garminUserId: v.string() },
  returns: v.union(
    v.object({ cadenceUserId: v.id("users") }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("garminUserMappings")
      .withIndex("by_garminUserId", (q) =>
        q.eq("garminUserId", args.garminUserId),
      )
      .first();

    if (!mapping) return null;
    return { cadenceUserId: mapping.cadenceUserId };
  },
});

/**
 * Match an incoming Garmin activity to a planned session using tiered matching:
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
    )) as SomaActivity[];

    if (recentActivities.length === 0) {
      console.log(`${TAG} ✗ No activities found in last 6 hours. Nothing to match.`);
      return null;
    }

    const latestActivity = recentActivities[0];
    const inferenceActivity = transformSomaActivity(latestActivity);

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
