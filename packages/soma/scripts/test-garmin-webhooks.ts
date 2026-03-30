/**
 * Test Garmin webhook endpoints against a running Convex deployment.
 *
 * This script can:
 *   1. Send simulated PUSH payloads (full data) to webhook endpoints
 *   2. Send simulated PING payloads (notification only) to webhook endpoints
 *   3. Trigger a real Garmin backfill (which makes Garmin POST to your webhooks)
 *
 * Prerequisites:
 *   - A running Convex deployment with `registerRoutes` configured
 *   - A connected Garmin user (with providerUserId set on the connection)
 *
 * Usage:
 *   # Simulate a push-mode activity webhook
 *   npx tsx scripts/test-garmin-webhooks.ts push activities
 *
 *   # Simulate a ping-mode activity webhook
 *   npx tsx scripts/test-garmin-webhooks.ts ping activities
 *
 *   # Trigger a real backfill via the Garmin API (sends to your configured webhooks)
 *   npx tsx scripts/test-garmin-webhooks.ts backfill activities
 *
 * Environment variables:
 *   CONVEX_SITE_URL  - Your Convex HTTP site URL (e.g. https://your-app.convex.site)
 *   GARMIN_USER_ID   - The Garmin userId for the connected user
 *   GARMIN_TOKEN     - A valid Garmin access token (for backfill mode)
 *   WEBHOOK_BASE     - Override webhook base path (default: /api/garmin/webhook)
 */

const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL;
const GARMIN_USER_ID = process.env.GARMIN_USER_ID || "test-garmin-user";
const GARMIN_TOKEN = process.env.GARMIN_TOKEN;
const WEBHOOK_BASE = process.env.WEBHOOK_BASE || "/api/garmin/webhook";

const [mode, dataType] = process.argv.slice(2);

if (!mode || !dataType) {
  console.log(`Usage: npx tsx scripts/test-garmin-webhooks.ts <mode> <type>

Modes:
  push      Send a simulated push-mode payload (full data)
  ping      Send a simulated ping-mode payload (notification only)
  backfill  Trigger a real Garmin backfill (requires GARMIN_TOKEN)
  all       Send push payloads to ALL webhook endpoints

Types:
  activities, dailies, sleeps, body, menstruation,
  blood-pressures, skin-temp, user-metrics,
  hrv, stress-details, pulse-ox, respiration

Environment variables:
  CONVEX_SITE_URL  Required. Your deployment's HTTP URL
  GARMIN_USER_ID   Garmin userId on the connection (default: test-garmin-user)
  GARMIN_TOKEN     Required for backfill mode
  WEBHOOK_BASE     Webhook base path (default: /api/garmin/webhook)`);
  process.exit(1);
}

if (!CONVEX_SITE_URL) {
  console.error("Set CONVEX_SITE_URL (e.g. https://your-app.convex.site)");
  process.exit(1);
}

// ─── Sample Payloads ─────────────────────────────────────────────────────────

const now = Math.floor(Date.now() / 1000);
const startOfDay = now - (now % 86400);

/** Push-mode payloads: full data objects as Garmin would send them. */
const pushPayloads: Record<string, unknown[]> = {
  activities: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-activity-${now}`,
      activityId: 100000 + now,
      activityType: "RUNNING",
      startTimeInSeconds: now - 3600,
      startTimeOffsetInSeconds: 0,
      durationInSeconds: 3600,
      activeKilocalories: 450,
      distanceInMeters: 8500,
      averageHeartRateInBeatsPerMinute: 155,
      maxHeartRateInBeatsPerMinute: 178,
      averageSpeedInMetersPerSecond: 2.36,
      maxSpeedInMetersPerSecond: 3.1,
      steps: 7200,
    },
  ],
  dailies: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-daily-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: startOfDay,
      startTimeOffsetInSeconds: 0,
      durationInSeconds: 86400,
      steps: 8500,
      distanceInMeters: 6200,
      activeKilocalories: 320,
      restingHeartRateInBeatsPerMinute: 58,
      maxHeartRateInBeatsPerMinute: 165,
      minHeartRateInBeatsPerMinute: 52,
      averageHeartRateInBeatsPerMinute: 72,
      averageStressLevel: 35,
      maxStressLevel: 75,
      floorsClimbed: 12,
    },
  ],
  sleeps: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-sleep-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: now - 28800,
      startTimeOffsetInSeconds: 0,
      durationInSeconds: 27000,
      deepSleepDurationInSeconds: 5400,
      lightSleepDurationInSeconds: 14400,
      remSleepInSeconds: 5400,
      awakeDurationInSeconds: 1800,
      sleepScores: {
        overall: { value: 82 },
        totalDuration: { value: 75 },
        stress: { value: 88 },
        awakeCount: { value: 90 },
      },
    },
  ],
  body: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-body-${now}`,
      measurementTimeInSeconds: now,
      measurementTimeOffsetInSeconds: 0,
      weightInGrams: 75000,
      bmi: 24.2,
      bodyFatPercentage: 18.5,
      muscleMassInGrams: 35000,
    },
  ],
  menstruation: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-mct-${now}`,
      startTimeInSeconds: startOfDay,
      periodStartDate: new Date().toISOString().slice(0, 10),
      cycleLength: 28,
      periodLength: 5,
      currentPhase: "MENSTRUAL",
    },
  ],
  "blood-pressures": [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-bp-${now}`,
      measurementTimeInSeconds: now,
      measurementTimeOffsetInSeconds: 0,
      systolic: 120,
      diastolic: 80,
      pulse: 72,
    },
  ],
  "skin-temp": [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-skin-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: startOfDay,
      startTimeOffsetInSeconds: 0,
      durationInSeconds: 86400,
      averageSkinTemperature: 33.5,
    },
  ],
  "user-metrics": [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-metrics-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: startOfDay,
      durationInSeconds: 86400,
      vo2Max: 48.5,
      fitnessAge: 28,
    },
  ],
  hrv: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-hrv-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: startOfDay,
      durationInSeconds: 86400,
      weeklyAvg: 52,
      lastNightAvg: 48,
      lastNight5MinHigh: 72,
      hrvAlgorithmVersion: "2.0",
    },
  ],
  "stress-details": [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-stress-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: startOfDay,
      startTimeOffsetInSeconds: 0,
      durationInSeconds: 86400,
      overallStressLevel: 35,
      restStressDurationInSeconds: 28800,
      activityStressDurationInSeconds: 14400,
      lowStressDurationInSeconds: 21600,
      mediumStressDurationInSeconds: 14400,
      highStressDurationInSeconds: 7200,
    },
  ],
  "pulse-ox": [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-spo2-${now}`,
      calendarDate: new Date().toISOString().slice(0, 10),
      startTimeInSeconds: startOfDay,
      durationInSeconds: 86400,
      averageSpo2: 97,
      lowestSpo2: 92,
    },
  ],
  respiration: [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      summaryId: `test-resp-${now}`,
      startTimeInSeconds: startOfDay,
      durationInSeconds: 86400,
      avgWakingRespirationValue: 16,
      highestRespirationValue: 22,
      lowestRespirationValue: 12,
    },
  ],
};

/** Ping-mode payloads: lightweight notifications. */
function makePingPayload(): unknown[] {
  return [
    {
      userId: GARMIN_USER_ID,
      userAccessToken: GARMIN_TOKEN || "test-token",
      uploadStartTimeInSeconds: now - 86400,
      uploadEndTimeInSeconds: now,
    },
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendWebhook(suffix: string, payload: unknown) {
  const url = `${CONVEX_SITE_URL}${WEBHOOK_BASE}${suffix}`;
  console.log(`\n→ POST ${url}`);
  console.log(`  Payload: ${JSON.stringify(payload).slice(0, 200)}...`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log(`  Status: ${res.status} ${res.statusText}`);
  if (text && text !== "OK") {
    console.log(`  Body: ${text.slice(0, 300)}`);
  }
  return res.ok;
}

async function triggerBackfill(summaryType: string) {
  if (!GARMIN_TOKEN) {
    console.error("GARMIN_TOKEN required for backfill mode");
    process.exit(1);
  }
  const params = `uploadStartTimeInSeconds=${now - 86400}&uploadEndTimeInSeconds=${now}`;
  const url = `https://apis.garmin.com/wellness-api/rest/backfill/${summaryType}?${params}`;
  console.log(`\n→ GET ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GARMIN_TOKEN}`,
      Accept: "application/json",
    },
  });
  console.log(`  Status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (text) console.log(`  Body: ${text.slice(0, 300)}`);
  return res.ok;
}

// Map dataType to Garmin backfill summaryType
const backfillMap: Record<string, string> = {
  activities: "activities",
  dailies: "dailies",
  sleeps: "sleeps",
  body: "bodyComps",
  menstruation: "mct",
  "blood-pressures": "bloodPressures",
  "skin-temp": "skinTemp",
  "user-metrics": "userMetrics",
  hrv: "hrv",
  "stress-details": "stressDetails",
  "pulse-ox": "pulseOx",
  respiration: "respiration",
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Garmin Webhook Tester`);
  console.log(`  Mode:     ${mode}`);
  console.log(`  Type:     ${dataType}`);
  console.log(`  Site URL: ${CONVEX_SITE_URL}`);
  console.log(`  User ID:  ${GARMIN_USER_ID}`);

  if (mode === "push") {
    const payload = pushPayloads[dataType];
    if (!payload) {
      console.error(`Unknown type: ${dataType}. Available: ${Object.keys(pushPayloads).join(", ")}`);
      process.exit(1);
    }
    const suffix = `/${dataType}`;
    await sendWebhook(suffix, payload);
  } else if (mode === "ping") {
    const suffix = `/${dataType}`;
    await sendWebhook(suffix, makePingPayload());
  } else if (mode === "backfill") {
    const summaryType = backfillMap[dataType];
    if (!summaryType) {
      console.error(`Unknown type: ${dataType}. Available: ${Object.keys(backfillMap).join(", ")}`);
      process.exit(1);
    }
    console.log(`\nTriggering Garmin backfill for "${summaryType}"...`);
    console.log("Garmin will POST data to your configured webhook URLs asynchronously.");
    await triggerBackfill(summaryType);
  } else if (mode === "all") {
    console.log("\nSending push payloads to ALL webhook endpoints...\n");
    let ok = 0;
    let fail = 0;
    for (const [type, payload] of Object.entries(pushPayloads)) {
      const success = await sendWebhook(`/${type}`, payload);
      if (success) ok++;
      else fail++;
    }
    console.log(`\n✓ ${ok} succeeded, ✗ ${fail} failed`);
  } else {
    console.error(`Unknown mode: ${mode}. Use: push, ping, backfill, all`);
    process.exit(1);
  }
}

main().catch(console.error);
