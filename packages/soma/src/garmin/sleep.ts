// ─── Sleep Transformer ───────────────────────────────────────────────────────
// Transforms a Garmin sleep session into the Soma Sleep schema shape.

import type { GarminSleepExtended, GarminTimeRange } from "./types.js";
import { mapSleepLevel } from "./maps/sleep-level.js";

export type SleepData = ReturnType<typeof transformSleep>;

/**
 * Transform a Garmin sleep session into a Soma Sleep document shape.
 *
 * @param sleep - The Garmin sleep data from the Health API
 * @returns Soma Sleep fields (without connectionId/userId)
 */
export function transformSleep(sleep: GarminSleepExtended) {
  const startMs = (sleep.startTimeInSeconds ?? 0) * 1000;
  const endMs = startMs + (sleep.durationInSeconds ?? 0) * 1000;

  const uploadTypeMap: Record<string, number> = {
    ENHANCED_FINAL: 2,      // Automatic
    ENHANCED_TENTATIVE: 4,  // Indeterminate
    AUTO_FINAL: 2,          // Automatic
    AUTO_TENTATIVE: 4,      // Indeterminate
    MANUAL: 1,              // Manual
    DEVICE: 2,              // From device
  };

  return {
    metadata: {
      summary_id: sleep.summaryId,
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      upload_type: uploadTypeMap[sleep.validation ?? ""] ?? 0,
    },

    sleep_durations_data: buildSleepDurationsData(sleep),

    heart_rate_data: buildHeartRateData(sleep),

    respiration_data: buildRespirationData(sleep),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSleepDurationsData(sleep: GarminSleepExtended) {
  const totalAsleep =
    (sleep.deepSleepDurationInSeconds ?? 0) +
    (sleep.lightSleepDurationInSeconds ?? 0) +
    (sleep.remSleepInSeconds ?? 0);

  return {
    asleep: {
      duration_asleep_state_seconds: totalAsleep || undefined,
      duration_deep_sleep_state_seconds: sleep.deepSleepDurationInSeconds,
      duration_light_sleep_state_seconds: sleep.lightSleepDurationInSeconds,
      duration_REM_sleep_state_seconds: sleep.remSleepInSeconds,
    },
    awake: {
      duration_awake_state_seconds: sleep.awakeDurationInSeconds,
    },
    other: {
      duration_in_bed_seconds: sleep.durationInSeconds,
      duration_unmeasurable_sleep_seconds: sleep.unmeasurableSleepInSeconds,
    },
    hypnogram_samples: buildHypnogramSamples(sleep),
  };
}

function buildHypnogramSamples(sleep: GarminSleepExtended) {
  if (!sleep.sleepLevelsMap) return undefined;

  const samples: Array<{ timestamp: string; level: number }> = [];

  for (const [stage, levels] of Object.entries(sleep.sleepLevelsMap)) {
    if (!levels) continue;
    const terraLevel = mapSleepLevel(stage);

    for (const level of levels as GarminTimeRange[]) {
      if (level.startTimeInSeconds == null) continue;
      samples.push({
        timestamp: new Date(level.startTimeInSeconds * 1000).toISOString(),
        level: terraLevel,
      });
    }
  }

  samples.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return samples.length > 0 ? samples : undefined;
}

function buildHeartRateData(sleep: GarminSleepExtended) {
  if (
    !sleep.timeOffsetHeartRateSamples ||
    Object.keys(sleep.timeOffsetHeartRateSamples).length === 0
  ) {
    return undefined;
  }

  const startTime = sleep.startTimeInSeconds ?? 0;
  const hrSamples = Object.entries(sleep.timeOffsetHeartRateSamples).map(
    ([offset, bpm]) => ({
      timestamp: new Date(
        (startTime + parseInt(offset, 10)) * 1000,
      ).toISOString(),
      bpm,
    }),
  );

  return {
    detailed: { hr_samples: hrSamples },
  };
}

function buildRespirationData(sleep: GarminSleepExtended) {
  const hasBreathSummary =
    sleep.averageRespirationInBreathsPerMinute != null;
  const hasBreathSamples =
    sleep.timeOffsetSleepRespiration != null &&
    Object.keys(sleep.timeOffsetSleepRespiration).length > 0;
  // Check both spec field (timeOffsetSleepSpo2) and extended field
  const spo2Map = sleep.timeOffsetSleepSpo2 ?? sleep.timeOffsetSpo2Values;
  const hasSpO2Samples =
    spo2Map != null && Object.keys(spo2Map).length > 0;

  if (!hasBreathSummary && !hasBreathSamples && !hasSpO2Samples) {
    return undefined;
  }

  const startTime = sleep.startTimeInSeconds ?? 0;

  const breathSamples = hasBreathSamples
    ? Object.entries(sleep.timeOffsetSleepRespiration!).map(
        ([offset, rate]) => ({
          timestamp: new Date(
            (startTime + parseInt(offset, 10)) * 1000,
          ).toISOString(),
          breaths_per_min: rate,
        }),
      )
    : undefined;

  const spo2Samples = hasSpO2Samples
    ? Object.entries(spo2Map!).map(([offset, pct]) => ({
        timestamp: new Date(
          (startTime + parseInt(offset, 10)) * 1000,
        ).toISOString(),
        percentage: pct,
      }))
    : undefined;

  return {
    breaths_data:
      hasBreathSummary || (breathSamples && breathSamples.length > 0)
        ? {
            avg_breaths_per_min: sleep.averageRespirationInBreathsPerMinute,
            min_breaths_per_min: sleep.lowestRespirationInBreathsPerMinute,
            max_breaths_per_min: sleep.highestRespirationInBreathsPerMinute,
            samples:
              breathSamples && breathSamples.length > 0
                ? breathSamples
                : undefined,
          }
        : undefined,
    oxygen_saturation_data:
      spo2Samples && spo2Samples.length > 0
        ? {
            avg_saturation_percentage: sleep.averageSpo2Value,
            samples: spo2Samples,
          }
        : undefined,
  };
}
