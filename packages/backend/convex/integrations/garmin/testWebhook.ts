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
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../../_generated/server";

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
    const TAG = "[Test Setup]";

    console.log(`${TAG} Looking up test context for user ${args.userId}...`);

    // 1. Look up garmin mapping
    const mapping = await ctx.db
      .query("garminUserMappings")
      .filter((q) => q.eq(q.field("cadenceUserId"), args.userId))
      .first();

    if (!mapping) {
      console.error(`${TAG} ✗ No garminUserMappings entry for this user. Connect Garmin first.`);
      return null;
    }
    console.log(`${TAG} ✓ Garmin mapping found → garminUserId: ${mapping.garminUserId}`);

    // 2. Look up runner
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!runner) {
      console.error(`${TAG} ✗ No runner profile found for this user.`);
      return null;
    }
    console.log(`${TAG} ✓ Runner found: ${runner._id}`);

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

    console.log(
      `${TAG} Sessions in window: ${sessions.length} total, ${eligible.length} eligible`,
    );

    if (eligible.length === 0) {
      console.error(
        `${TAG} ✗ No eligible scheduled sessions in the matching window (24h back → 3h forward). Make sure there's a session with status="scheduled" for today.`,
      );
      return null;
    }

    // Pick the one closest to now
    const best = eligible.reduce((a, b) =>
      Math.abs(now - a.scheduledDate) < Math.abs(now - b.scheduledDate) ? a : b,
    );

    console.log(
      `${TAG} ✓ Best session: "${best.sessionTypeDisplay}" — target ${best.targetDurationSeconds ? Math.round(best.targetDurationSeconds / 60) + " min" : "—"} / ${best.targetDistanceMeters ? (best.targetDistanceMeters / 1000).toFixed(1) + " km" : "—"}`,
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
    const avgSpeed =
      durationSeconds > 0 ? distanceMeters / durationSeconds : 2.5;
    const paceSecPerKm = distanceMeters > 0 ? durationSeconds / (distanceMeters / 1000) : 0;
    const paceMin = Math.floor(paceSecPerKm / 60);
    const paceSec = Math.round(paceSecPerKm % 60);

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
        averageSpeedInMetersPerSecond: avgSpeed,
        maxSpeedInMetersPerSecond: 3.5,
        steps: Math.round(distanceMeters * 0.85),
      },
    ];

    const durMin = Math.floor(durationSeconds / 60);
    const durSec = durationSeconds % 60;

    console.log(
      `\n${"╔".padEnd(60, "═")}╗\n` +
        `  GARMIN WEBHOOK TEST — SIMULATING ACTIVITY\n` +
        `${"╚".padEnd(60, "═")}╝\n` +
        `\n  Garmin user:    ${context.garminUserId}` +
        `\n  Target session: ${context.sessionType} (${context.sessionId})` +
        `\n  Mock summary:   ${mockSummaryId}` +
        `\n` +
        `\n  Simulated activity:` +
        `\n    Duration: ${durMin}:${durSec.toString().padStart(2, "0")}` +
        `\n    Distance: ${(distanceMeters / 1000).toFixed(2)} km` +
        `\n    Pace:     ${paceMin}:${paceSec.toString().padStart(2, "0")} /km` +
        `\n    HR:       avg 155 bpm  |  max 178 bpm` +
        `\n` +
        `\n  Firing webhook pipeline now...\n`,
    );

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

// ─── Seed a test session for today ──────────────────────────────────────────

/**
 * Creates a scheduled Tempo session for right now so there's something
 * for the webhook to match against. Run this from the dashboard before
 * simulateGarminActivityWebhook if you don't have a session for today.
 */
export const seedTestSession = internalMutation({
  args: { userId: v.id("users") },
  returns: v.union(v.id("plannedSessions"), v.null()),
  handler: async (ctx, args) => {
    const TAG = "[Seed]";

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!runner) {
      console.error(`${TAG} ✗ No runner profile for this user.`);
      return null;
    }

    // Find or create an ad-hoc plan
    let plan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!plan) {
      const now = Date.now();
      const oneYear = 52 * 7 * 24 * 60 * 60 * 1000;
      const planId = await ctx.db.insert("trainingPlans", {
        runnerId: runner._id,
        userId: args.userId,
        name: "My Runs",
        goalType: "ad_hoc",
        startDate: now,
        endDate: now + oneYear,
        durationWeeks: 52,
        status: "active",
        seasonView: {
          coachSummary: "Ad-hoc plan for testing.",
          periodizationJustification: "User-directed training",
          volumeStrategyJustification: "User-directed volume",
          keyMilestones: [],
          identifiedRisks: [],
          expectedOutcomes: {
            primaryGoal: "Testing",
            confidenceLevel: 100,
            confidenceReason: "Test plan",
            secondaryOutcomes: [],
          },
        },
        weeklyPlan: [],
        runnerSnapshot: {
          capturedAt: now,
          profileRadar: [],
          fitnessIndicators: {},
          planInfluencers: ["Test seed"],
        },
        generatedAt: now,
        generatorVersion: "test_seed_v1",
        createdAt: now,
        updatedAt: now,
      });
      plan = (await ctx.db.get(planId))!;
      console.log(`${TAG} Created ad-hoc training plan: ${planId}`);
    }

    const now = Date.now();
    const date = new Date(now);
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const sessionId = await ctx.db.insert("plannedSessions", {
      planId: plan._id,
      runnerId: runner._id,
      weekNumber: 1,
      dayOfWeek: days[date.getUTCDay()],
      dayOfWeekShort: daysShort[date.getUTCDay()],
      scheduledDate: now,
      sessionType: "tempo",
      sessionTypeDisplay: "Tempo",
      sessionSubtype: "user_planned",
      isKeySession: true,
      isRestDay: false,
      targetDurationSeconds: 2700,
      targetDurationDisplay: "45 min",
      targetDistanceMeters: 8000,
      effortLevel: 7,
      effortDisplay: "7/10",
      description:
        "Tempo run — 45 min, 8 km. Seed session for webhook testing.",
      justification: "Test seed session",
      physiologicalTarget: "lactate_threshold",
      isMoveable: true,
      status: "scheduled",
    });

    console.log(
      `${TAG} ✓ Created test session for today:\n` +
        `    ID: ${sessionId}\n` +
        `    Type: Tempo — 45 min / 8.0 km\n` +
        `    Scheduled: ${date.toLocaleString()}\n` +
        `\n${TAG} You can now run simulateGarminActivityWebhook!`,
    );

    return sessionId;
  },
});
