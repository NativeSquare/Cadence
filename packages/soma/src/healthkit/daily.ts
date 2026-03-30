// ─── Daily Transformer ───────────────────────────────────────────────────────
// Transforms Apple HealthKit daily activity data into the Soma Daily schema.

import type { HKQuantitySample, HKActivitySummary } from "./types.js";
import {
  filterByType,
  sumValues,
  avgValue,
  dayRange,
  sampleTimeRange,
  buildDeviceData,
} from "./utils.js";

/**
 * The output shape of {@link transformDaily} and {@link transformDailyFromSummary}.
 */
export type DailyData =
  | ReturnType<typeof transformDaily>
  | ReturnType<typeof transformDailyFromSummary>;

/**
 * Transform an array of HealthKit quantity samples for a single day into a
 * Soma Daily document shape.
 *
 * Accepts samples of multiple types: step count, distance, active/basal
 * energy, flights climbed, exercise time, stand time, VO2 max, heart rate,
 * and HRV.
 *
 * @param samples - Array of HKQuantitySample for the desired day
 * @param timeRange - Optional explicit time range; auto-detected from samples if omitted
 * @returns Soma Daily fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformDaily(todaySamples);
 * await soma.ingestDaily(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformDaily(
  samples: HKQuantitySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  const range = timeRange ?? sampleTimeRange(samples);

  // ── Activity samples ───────────────────────────────────────────────────
  const stepSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierStepCount",
  );
  const walkRunDistSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierDistanceWalkingRunning",
  );
  const cyclingDistSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierDistanceCycling",
  );
  const swimmingDistSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierDistanceSwimming",
  );
  const activeEnergySamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierActiveEnergyBurned",
  );
  const basalEnergySamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBasalEnergyBurned",
  );
  const flightsSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierFlightsClimbed",
  );
  const exerciseTimeSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierAppleExerciseTime",
  );
  const standTimeSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierAppleStandTime",
  );

  // ── Heart rate ─────────────────────────────────────────────────────────
  const hrSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierHeartRate",
  );
  const hrvSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  );
  const restingHrSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierRestingHeartRate",
  );

  // ── VO2 Max ────────────────────────────────────────────────────────────
  const vo2Samples = filterByType(
    samples,
    "HKQuantityTypeIdentifierVO2Max",
  );

  // ── Aggregate ──────────────────────────────────────────────────────────
  const totalSteps = sumValues(stepSamples);
  const totalDistanceMeters =
    sumValues(walkRunDistSamples) +
    sumValues(cyclingDistSamples) +
    sumValues(swimmingDistSamples);
  const activeCalories = sumValues(activeEnergySamples);
  const basalCalories = sumValues(basalEnergySamples);
  const floorsClimbed = sumValues(flightsSamples);
  const exerciseMinutes = sumValues(exerciseTimeSamples);
  const standMinutes = sumValues(standTimeSamples);

  const firstSample = samples[0] as HKQuantitySample | undefined;

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
      upload_type: 1 as const, // Automatic
    },

    device_data: buildDeviceData(firstSample?.source, firstSample?.device),

    active_durations_data: {
      activity_seconds: exerciseMinutes * 60,
      standing_seconds: standMinutes * 60,
    },

    calories_data: {
      BMR_calories: basalCalories > 0 ? basalCalories : undefined,
      net_activity_calories: activeCalories > 0 ? activeCalories : undefined,
      total_burned_calories:
        activeCalories + basalCalories > 0
          ? activeCalories + basalCalories
          : undefined,
    },

    distance_data: {
      steps: totalSteps > 0 ? totalSteps : undefined,
      distance_meters: totalDistanceMeters > 0 ? totalDistanceMeters : undefined,
      floors_climbed: floorsClimbed > 0 ? floorsClimbed : undefined,
      detailed:
        stepSamples.length > 0
          ? {
              step_samples: stepSamples.map((s) => ({
                timestamp: s.startDate,
                steps: s.value,
              })),
              distance_samples:
                walkRunDistSamples.length > 0
                  ? walkRunDistSamples.map((s) => ({
                      timestamp: s.startDate,
                      distance_meters: s.value,
                    }))
                  : undefined,
              floors_climbed_samples:
                flightsSamples.length > 0
                  ? flightsSamples.map((s) => ({
                      timestamp: s.startDate,
                      floors_climbed: s.value,
                    }))
                  : undefined,
            }
          : undefined,
    },

    heart_rate_data:
      hrSamples.length > 0
        ? {
            detailed: {
              hr_samples: hrSamples.map((s) => ({
                timestamp: s.startDate,
                bpm: s.value,
              })),
              hrv_samples_sdnn:
                hrvSamples.length > 0
                  ? hrvSamples.map((s) => ({
                      timestamp: s.startDate,
                      hrv_sdnn: s.value,
                    }))
                  : undefined,
            },
            summary: {
              avg_hr_bpm: avgValue(hrSamples),
              max_hr_bpm:
                hrSamples.length > 0
                  ? Math.max(...hrSamples.map((s) => s.value))
                  : undefined,
              min_hr_bpm:
                hrSamples.length > 0
                  ? Math.min(...hrSamples.map((s) => s.value))
                  : undefined,
              resting_hr_bpm: avgValue(restingHrSamples),
              avg_hrv_sdnn: avgValue(hrvSamples),
            },
          }
        : undefined,

    oxygen_data:
      vo2Samples.length > 0
        ? {
            vo2max_ml_per_min_per_kg:
              vo2Samples[vo2Samples.length - 1].value,
            vo2_samples: vo2Samples.map((s) => ({
              timestamp: s.startDate,
              vo2max_ml_per_min_per_kg: s.value,
            })),
          }
        : undefined,
  };
}

/**
 * Transform an HKActivitySummary (Apple's daily activity rings) into a
 * Soma Daily document shape.
 *
 * Lighter-weight alternative to {@link transformDaily} when only the
 * summary ring data is available (no individual samples).
 *
 * @param summary - The HKActivitySummary from HealthKit
 * @returns Soma Daily fields (without connectionId/userId)
 */
export function transformDailyFromSummary(summary: HKActivitySummary) {
  const range = dayRange(summary.dateComponents);

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
      upload_type: 1 as const, // Automatic
    },

    active_durations_data: {
      activity_seconds: summary.appleExerciseTime * 60,
      standing_hours_count: summary.appleStandHours,
    },

    calories_data: {
      net_activity_calories: summary.activeEnergyBurned,
      total_burned_calories: summary.activeEnergyBurned,
    },
  };
}
