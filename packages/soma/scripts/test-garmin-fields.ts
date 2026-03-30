/**
 * Test script: verify whether the Garmin API returns fields beyond the OpenAPI spec.
 *
 * Usage:
 *   GARMIN_ACCESS_TOKEN=<token> npx tsx scripts/test-garmin-fields.ts
 *
 * This makes raw fetch calls (no openapi-fetch) and logs every key in the
 * response so we can compare against the generated spec types.
 */

const BASE = "https://apis.garmin.com/wellness-api";

const token = process.env.GARMIN_ACCESS_TOKEN;
if (!token) {
  console.error("Set GARMIN_ACCESS_TOKEN env var");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
};

// Last 24h in epoch seconds (Garmin max is 86400s)
const now = Math.floor(Date.now() / 1000);
const oneDayAgo = now - 86400;
// Garmin pull API requires token as query param
const qs = `uploadStartTimeInSeconds=${oneDayAgo}&uploadEndTimeInSeconds=${now}&token=${token}`;

async function fetchEndpoint(path: string): Promise<unknown> {
  const url = `${BASE}${path}?${qs}`;
  console.log(`\n${"═".repeat(70)}`);
  console.log(`GET ${path}`);
  console.log("═".repeat(70));

  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.log(`  ❌ ${res.status} ${res.statusText}`);
    const body = await res.text();
    if (body) console.log(`  ${body.slice(0, 200)}`);
    return null;
  }

  const json = await res.json();

  // If array, show count + keys of first item
  if (Array.isArray(json)) {
    console.log(`  ✅ ${json.length} item(s)`);
    if (json.length > 0) {
      const first = json[0];
      const keys = Object.keys(first).sort();
      console.log(`  Keys (${keys.length}): ${keys.join(", ")}`);

      // Show nested object keys for interesting fields
      for (const key of keys) {
        const val = first[key];
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const subKeys = Object.keys(val);
          if (subKeys.length <= 20) {
            console.log(`    ${key}: { ${subKeys.join(", ")} }`);
          } else {
            console.log(`    ${key}: { ${subKeys.length} keys }`);
          }
        }
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
          console.log(`    ${key}[0]: { ${Object.keys(val[0]).join(", ")} }`);
        }
      }

      // Dump full first item for inspection
      console.log(`\n  First item (full):`);
      console.log(JSON.stringify(first, null, 2).split("\n").map(l => `  ${l}`).join("\n"));
    }
  } else if (json && typeof json === "object") {
    const keys = Object.keys(json).sort();
    console.log(`  ✅ Object with keys: ${keys.join(", ")}`);
    console.log(JSON.stringify(json, null, 2).split("\n").map(l => `  ${l}`).join("\n"));
  }

  return json;
}

// Spec-documented fields for comparison
const specFields: Record<string, string[]> = {
  "/rest/dailies": [
    "activeKilocalories", "activeTimeInSeconds", "activityStressPercentage",
    "activityType", "averageHeartRateInBeatsPerMinute", "averageStressLevel",
    "bmrKilocalories", "bodyBatteryChargedValue", "bodyBatteryDrainedValue",
    "bodyBatteryHighestValue", "bodyBatteryLowestValue",
    "bodyBatteryMostRecentValue", "bodyBatteryVersion",
    "calendarDate", "calendarDateFormatted", "caloriesConsumedInKilocalories",
    "consumedCaloriesInKilocalories", "dailyStepGoal", "description",
    "deviceName", "distanceInMeters", "durationInSeconds",
    "endTimestampGMT", "endTimestampLocal", "floorsClimbed",
    "floorsClimbedGoal", "floorsDescended", "highStressPercentage",
    "intensityDurationGoalInSeconds", "lowStressPercentage",
    "maxHeartRateInBeatsPerMinute", "maxStressLevel",
    "measurableActiveTimeInSeconds", "measurableAsleepTimeInSeconds",
    "mediumStressPercentage", "minHeartRateInBeatsPerMinute",
    "moderateIntensityDurationInSeconds", "netCaloriesGoalInKilocalories",
    "netCaloriesKilocalories", "pushDistanceInMeters", "pushes",
    "restStressPercentage", "restingHeartRateInBeatsPerMinute",
    "startTimestampGMT", "startTimestampLocal", "stepsGoal",
    "stressQualifier", "summaryId",
    "timeOffsetHeartRateSamples", "totalDistanceInMeters", "steps",
    "totalKilocalories", "totalStepGoal", "totalSteps",
    "userAccessToken", "userFloorsClimbedGoal",
    "userIntensityDurationGoalInSeconds",
    "vigorousIntensityDurationInSeconds", "wellnessActiveKilocalories",
    "wellnessDistanceInMeters", "wellnessKilocalories",
  ],
  "/rest/sleeps": [
    "autoSleepEndTimestampGMT", "autoSleepStartTimestampGMT",
    "calendarDate", "deepSleepDurationInSeconds",
    "durationInSeconds", "lightSleepDurationInSeconds",
    "overallSleepScore", "remSleepInSeconds",
    "restlessMomentCount", "retro", "sleepLevelsMap",
    "sleepScores", "naps",
    "sleepWindowConfirmationType", "startTimestampGMT",
    "startTimestampLocal", "summaryId",
    "timeOffsetSleepSpo2", "unmeasurableSleepInSeconds",
    "userAccessToken", "validation",
    "awakeDurationInSeconds",
  ],
};

async function main() {
  const endpoints = [
    "/rest/dailies",
    "/rest/activities",
    "/rest/sleeps",
    "/rest/bodyComps",
    "/rest/bloodPressures",
    "/rest/skinTemp",
    "/rest/userMetrics",
    "/rest/stressDetails",
    "/rest/pulseOx",
    "/rest/respiration",
    "/rest/hrv",
    "/rest/epochs",
  ];

  for (const endpoint of endpoints) {
    const result = await fetchEndpoint(endpoint);

    // Compare against spec if we have the field list
    if (Array.isArray(result) && result.length > 0 && specFields[endpoint]) {
      const actual = new Set(Object.keys(result[0]));
      const expected = new Set(specFields[endpoint]);

      const extra = [...actual].filter(k => !expected.has(k)).sort();
      const missing = [...expected].filter(k => !actual.has(k)).sort();

      if (extra.length > 0) {
        console.log(`\n  🔍 EXTRA fields (not in spec): ${extra.join(", ")}`);
      }
      if (missing.length > 0) {
        console.log(`  📭 MISSING fields (in spec but not returned): ${missing.join(", ")}`);
      }
      if (extra.length === 0 && missing.length === 0) {
        console.log(`\n  ✅ Response matches spec exactly`);
      }
    }
  }
}

main().catch(console.error);
