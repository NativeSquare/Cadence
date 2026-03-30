// ─── Daily Transformer ───────────────────────────────────────────────────────
// Transforms a Garmin daily wellness summary into the Soma Daily schema shape.

import type { GarminDailySummary } from "./types.js";

// GarminDailySummary is an alias for GarminDailyExtended which includes
// both spec fields and additional fields the API returns (stress time-series,
// SpO2, body battery, respiration).

export type DailyData = ReturnType<typeof transformDaily>;

/**
 * Transform a Garmin daily summary into a Soma Daily document shape.
 *
 * @param daily - The Garmin daily summary from the Health API
 * @returns Soma Daily fields (without connectionId/userId)
 */
export function transformDaily(daily: GarminDailySummary) {
  const startMs = (daily.startTimeInSeconds ?? 0) * 1000;
  const endMs = startMs + (daily.durationInSeconds ?? 0) * 1000;

  return {
    metadata: {
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      upload_type: 1, // Automatic
    },

    active_durations_data: buildActiveDurationsData(daily),

    calories_data: buildCaloriesData(daily),

    distance_data: buildDistanceData(daily),

    heart_rate_data: buildHeartRateData(daily),

    oxygen_data: buildOxygenData(daily),

    stress_data: buildStressData(daily),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildActiveDurationsData(daily: GarminDailySummary) {
  if (
    daily.activeTimeInSeconds == null &&
    daily.moderateIntensityDurationInSeconds == null &&
    daily.vigorousIntensityDurationInSeconds == null
  ) {
    return undefined;
  }

  return {
    activity_seconds: daily.activeTimeInSeconds,
    moderate_intensity_seconds: daily.moderateIntensityDurationInSeconds,
    vigorous_intensity_seconds: daily.vigorousIntensityDurationInSeconds,
  };
}

function buildCaloriesData(daily: GarminDailySummary) {
  if (daily.activeKilocalories == null && daily.bmrKilocalories == null) {
    return undefined;
  }

  const total =
    (daily.activeKilocalories ?? 0) + (daily.bmrKilocalories ?? 0);

  return {
    net_activity_calories: daily.activeKilocalories,
    BMR_calories: daily.bmrKilocalories,
    total_burned_calories: total || undefined,
  };
}

function buildDistanceData(daily: GarminDailySummary) {
  if (
    daily.distanceInMeters == null &&
    daily.steps == null &&
    daily.floorsClimbed == null
  ) {
    return undefined;
  }

  return {
    distance_meters: daily.distanceInMeters,
    steps: daily.steps,
    floors_climbed: daily.floorsClimbed,
  };
}

function buildHeartRateData(daily: GarminDailySummary) {
  const hasSummary =
    daily.averageHeartRateInBeatsPerMinute != null ||
    daily.maxHeartRateInBeatsPerMinute != null ||
    daily.restingHeartRateInBeatsPerMinute != null;
  const hasSamples =
    daily.timeOffsetHeartRateSamples != null &&
    Object.keys(daily.timeOffsetHeartRateSamples).length > 0;

  if (!hasSummary && !hasSamples) return undefined;

  const hrSamples = hasSamples
    ? buildTimeOffsetSamples(
        daily.startTimeInSeconds,
        daily.timeOffsetHeartRateSamples!,
        (bpm) => ({ bpm }),
      )
    : undefined;

  return {
    summary: hasSummary
      ? {
          avg_hr_bpm: daily.averageHeartRateInBeatsPerMinute,
          max_hr_bpm: daily.maxHeartRateInBeatsPerMinute,
          min_hr_bpm: daily.minHeartRateInBeatsPerMinute,
          resting_hr_bpm: daily.restingHeartRateInBeatsPerMinute,
        }
      : undefined,
    detailed:
      hrSamples && hrSamples.length > 0
        ? { hr_samples: hrSamples }
        : undefined,
  };
}

function buildOxygenData(daily: GarminDailySummary) {
  if (daily.averageSpo2Value == null && daily.timeOffsetSpo2Values == null) {
    return undefined;
  }

  const samples =
    daily.timeOffsetSpo2Values != null
      ? buildTimeOffsetSamples(
          daily.startTimeInSeconds,
          daily.timeOffsetSpo2Values,
          (pct) => ({ percentage: pct }),
        )
      : undefined;

  return {
    avg_saturation_percentage: daily.averageSpo2Value,
    saturation_samples:
      samples && samples.length > 0 ? samples : undefined,
  };
}

function buildStressData(daily: GarminDailySummary) {
  const hasStress =
    daily.averageStressLevel != null ||
    daily.maxStressLevel != null ||
    daily.stressDurationInSeconds != null;
  const hasStressSamples =
    daily.timeOffsetStressLevelValues != null &&
    Object.keys(daily.timeOffsetStressLevelValues).length > 0;
  const hasBodyBatterySamples =
    daily.timeOffsetBodyBatteryValues != null &&
    Object.keys(daily.timeOffsetBodyBatteryValues).length > 0;

  if (!hasStress && !hasStressSamples && !hasBodyBatterySamples) {
    return undefined;
  }

  const stressSamples = hasStressSamples
    ? buildTimeOffsetSamples(
        daily.startTimeInSeconds,
        daily.timeOffsetStressLevelValues!,
        (level) => ({ level }),
      )
    : undefined;

  const bodyBatterySamples = hasBodyBatterySamples
    ? buildTimeOffsetSamples(
        daily.startTimeInSeconds,
        daily.timeOffsetBodyBatteryValues!,
        (level) => ({ level }),
      )
    : undefined;

  return {
    avg_stress_level: daily.averageStressLevel,
    max_stress_level: daily.maxStressLevel,
    stress_duration_seconds: daily.stressDurationInSeconds,
    rest_stress_duration_seconds: daily.restStressDurationInSeconds,
    activity_stress_duration_seconds: daily.activityStressDurationInSeconds,
    low_stress_duration_seconds: daily.lowStressDurationInSeconds,
    medium_stress_duration_seconds: daily.mediumStressDurationInSeconds,
    high_stress_duration_seconds: daily.highStressDurationInSeconds,
    samples:
      stressSamples && stressSamples.length > 0 ? stressSamples : undefined,
    body_battery_samples:
      bodyBatterySamples && bodyBatterySamples.length > 0
        ? bodyBatterySamples
        : undefined,
  };
}

/**
 * Convert Garmin offset-keyed time-series data into timestamped samples.
 *
 * Garmin sends time-series as `{ [offsetSeconds]: value }` maps.
 * This converts to `{ timestamp: ISO-8601, ...fields }[]`.
 */
function buildTimeOffsetSamples<T extends Record<string, unknown>>(
  startTimeInSeconds: number | undefined,
  offsets: Record<string, number>,
  mapValue: (value: number) => T,
): Array<{ timestamp: string } & T> {
  return Object.entries(offsets).map(([offset, value]) => ({
    timestamp: new Date(
      ((startTimeInSeconds ?? 0) + parseInt(offset, 10)) * 1000,
    ).toISOString(),
    ...mapValue(value),
  }));
}
