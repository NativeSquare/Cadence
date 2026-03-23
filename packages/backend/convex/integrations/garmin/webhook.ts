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
import { ConvexError, v } from "convex/values";
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

    // 1. Let Soma handle ingestion (same pattern as registerRoutes)
    const garminApi = (components.soma as any).garmin;
    try {
      await ctx.runAction(garminApi.handleGarminWebhookActivities, {
        payload,
      });
    } catch (err) {
      console.error(
        "[garmin:webhook] Soma ingestion error:",
        err instanceof Error ? err.message : err,
      );
      // Continue — we still try to match if possible
    }

    // 2. Extract Garmin userIds from the payload
    const items: GarminWebhookActivityItem[] = Array.isArray(payload)
      ? payload
      : [];
    const garminUserIds = [
      ...new Set(items.map((item) => item.userId).filter(Boolean)),
    ];

    if (garminUserIds.length === 0) {
      console.log("[garmin:webhook] No userIds in payload, skipping match");
      return null;
    }

    // 3. Resolve each Garmin userId → Cadence userId and match
    for (const garminUserId of garminUserIds) {
      const mapping = await ctx.runQuery(
        internal.integrations.garmin.webhook.lookupGarminMapping,
        { garminUserId },
      );

      if (!mapping) {
        console.warn(
          `[garmin:webhook] No mapping for Garmin userId "${garminUserId}", skipping notification`,
        );
        continue;
      }

      await ctx.runMutation(
        internal.integrations.garmin.webhook.matchActivityToSession,
        { cadenceUserId: mapping.cadenceUserId },
      );
    }

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
 * Find today's scheduled session for this user and match it against
 * the most recent Soma activity.
 */
export const matchActivityToSession = internalMutation({
  args: { cadenceUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get runner for this user
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.cadenceUserId))
      .first();

    if (!runner) {
      console.warn("[garmin:webhook] No runner found for user", args.cadenceUserId);
      return null;
    }

    // 2. Get today's scheduled sessions (±3 hour window)
    const now = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    const windowStart = now - 24 * 60 * 60 * 1000; // look back 24h
    const windowEnd = now + threeHoursMs;

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

    if (scheduledSessions.length === 0) {
      console.log("[garmin:webhook] No scheduled sessions found for today");
      return null;
    }

    // 3. Query recent Soma activities for this user (last 6 hours)
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000).toISOString();
    const recentActivities = (await ctx.runQuery(
      components.soma.public.listActivities,
      {
        userId: args.cadenceUserId,
        startTime: sixHoursAgo,
        order: "desc" as const,
      },
    )) as SomaActivity[];

    if (recentActivities.length === 0) {
      console.log("[garmin:webhook] No recent Soma activities found");
      return null;
    }

    // 4. Find the best match: most recent running activity → closest scheduled session
    const latestActivity = recentActivities[0];
    const inferenceActivity = transformSomaActivity(latestActivity);

    // Only match running-type activities
    const runningTypes = ["easy", "tempo", "intervals", "long_run", "race", "unstructured"];
    if (
      inferenceActivity.sessionType &&
      !runningTypes.includes(inferenceActivity.sessionType)
    ) {
      console.log("[garmin:webhook] Activity is not a running type, skipping");
      return null;
    }

    // Find the closest scheduled session by time
    const activityStartMs = inferenceActivity.startTime;
    let bestSession = scheduledSessions[0];
    let bestDiff = Math.abs(activityStartMs - bestSession.scheduledDate);

    for (const session of scheduledSessions.slice(1)) {
      const diff = Math.abs(activityStartMs - session.scheduledDate);
      if (diff < bestDiff) {
        bestSession = session;
        bestDiff = diff;
      }
    }

    // 5. Calculate adherence score
    const adherenceScore = calculateAdherence(
      bestSession,
      inferenceActivity.durationSeconds,
      inferenceActivity.distanceMeters,
    );

    // 6. Patch the session as completed
    await ctx.db.patch(bestSession._id, {
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
      `[garmin:webhook] Matched activity to session "${bestSession.sessionTypeDisplay}" (adherence: ${adherenceScore?.toFixed(2)})`,
    );

    // 7. Schedule push notification
    await ctx.scheduler.runAfter(
      0,
      internal.integrations.notifications.sendSessionCompleteNotification,
      {
        userId: args.cadenceUserId,
        sessionId: bestSession._id,
        sessionType: bestSession.sessionTypeDisplay,
      },
    );

    return null;
  },
});

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
