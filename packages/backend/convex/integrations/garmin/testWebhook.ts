/**
 * Mock Garmin Webhook — E2E Test Action
 *
 * Run from the Convex dashboard to simulate a Garmin activity webhook for a
 * real user. Auto-discovers the garmin userId, runner, and next eligible
 * session, then fires the exact same pipeline as a real webhook:
 *   Soma ingestion → session matching → push notification
 */

import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalAction, internalQuery } from "../../_generated/server";

// ─── Read-only context lookup ────────────────────────────────────────────────

export const getTestContext = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      garminUserId: v.string(),
      runnerId: v.id("runners"),
      sessionId: v.id("plannedSessions"),
      sessionType: v.string(),
      targetDurationSeconds: v.optional(v.number()),
      targetDistanceMeters: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // 1. Look up garmin mapping
    const mapping = await ctx.db
      .query("garminUserMappings")
      .filter((q) => q.eq(q.field("cadenceUserId"), args.userId))
      .first();

    if (!mapping) {
      console.error("[test:webhook] No garminUserMappings entry for this user");
      return null;
    }

    // 2. Look up runner
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!runner) {
      console.error("[test:webhook] No runner found for this user");
      return null;
    }

    // 3. Find next eligible session (24h back, 3h forward — same window as webhook)
    const now = Date.now();
    const windowStart = now - 24 * 60 * 60 * 1000;
    const windowEnd = now + 3 * 60 * 60 * 1000;

    const sessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_date", (q) =>
        q
          .eq("runnerId", runner._id)
          .gte("scheduledDate", windowStart)
          .lte("scheduledDate", windowEnd),
      )
      .collect();

    const eligible = sessions.filter(
      (s) => s.status === "scheduled" && !s.isRestDay,
    );

    if (eligible.length === 0) {
      console.error(
        "[test:webhook] No eligible scheduled sessions in the matching window",
      );
      return null;
    }

    // Pick the one closest to now
    const best = eligible.reduce((a, b) =>
      Math.abs(now - a.scheduledDate) < Math.abs(now - b.scheduledDate) ? a : b,
    );

    return {
      garminUserId: mapping.garminUserId,
      runnerId: runner._id,
      sessionId: best._id,
      sessionType: best.sessionTypeDisplay,
      targetDurationSeconds: best.targetDurationSeconds,
      targetDistanceMeters: best.targetDistanceMeters,
    };
  },
});

// ─── Main test action ────────────────────────────────────────────────────────

export const simulateGarminActivityWebhook = internalAction({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      success: v.boolean(),
      garminUserId: v.string(),
      sessionId: v.string(),
      sessionType: v.string(),
      mockSummaryId: v.string(),
      durationSeconds: v.number(),
      distanceMeters: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args): Promise<{
    success: boolean;
    garminUserId: string;
    sessionId: string;
    sessionType: string;
    mockSummaryId: string;
    durationSeconds: number;
    distanceMeters: number;
  } | null> => {
    const context = await ctx.runQuery(
      internal.integrations.garmin.testWebhook.getTestContext,
      { userId: args.userId },
    );

    if (!context) {
      console.error(
        "[test:webhook] Could not resolve test context — check logs above",
      );
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const mockSummaryId = `test-e2e-${now}`;
    const durationSeconds = context.targetDurationSeconds ?? 2700; // 45 min default
    const distanceMeters = context.targetDistanceMeters ?? 8000; // 8 km default

    // Garmin push-mode payload — token is ignored, userId must match Soma connection
    const payload = [
      {
        userId: context.garminUserId,
        userAccessToken: "test-mock",
        summaryId: mockSummaryId,
        activityId: now,
        activityType: "RUNNING",
        startTimeInSeconds: now - 1800, // 30 min ago
        startTimeOffsetInSeconds: 0,
        durationInSeconds: durationSeconds,
        distanceInMeters: distanceMeters,
        activeKilocalories: 450,
        averageHeartRateInBeatsPerMinute: 155,
        maxHeartRateInBeatsPerMinute: 178,
        averageSpeedInMetersPerSecond:
          durationSeconds > 0 ? distanceMeters / durationSeconds : 2.5,
        maxSpeedInMetersPerSecond: 3.5,
        steps: Math.round(distanceMeters * 0.85),
      },
    ];

    console.log(
      `[test:webhook] Firing mock webhook for garmin user "${context.garminUserId}"`,
    );
    console.log(
      `[test:webhook] Target session: ${context.sessionId} (${context.sessionType})`,
    );
    console.log(`[test:webhook] Mock summaryId: ${mockSummaryId}`);

    // Fire the exact same pipeline as a real Garmin webhook
    await ctx.runAction(
      internal.integrations.garmin.webhook.processActivityWebhook,
      { payload },
    );

    return {
      success: true,
      garminUserId: context.garminUserId,
      sessionId: context.sessionId,
      sessionType: context.sessionType,
      mockSummaryId,
      durationSeconds,
      distanceMeters,
    };
  },
});
