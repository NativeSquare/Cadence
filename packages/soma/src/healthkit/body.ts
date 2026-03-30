// ─── Body Transformer ────────────────────────────────────────────────────────
// Transforms Apple HealthKit body-related quantity samples into the Soma Body schema.

import type { HKQuantitySample } from "./types.js";
import {
  filterByType,
  avgValue,
  minValue,
  maxValue,
  sampleTimeRange,
  buildDeviceData,
} from "./utils.js";

/**
 * The output shape of {@link transformBody}.
 */
export type BodyData = ReturnType<typeof transformBody>;

/**
 * Transform a mixed array of HealthKit body-related quantity samples into a
 * Soma Body document shape.
 *
 * Accepts samples of multiple types (heart rate, HRV, blood pressure, SpO2,
 * blood glucose, body temperature, weight, height, BMI, body fat, lean mass)
 * and bins them into the correct Body sub-objects.
 *
 * @param samples - Array of HKQuantitySample covering the desired time range
 * @param timeRange - Optional explicit time range; auto-detected from samples if omitted
 * @returns Soma Body fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformBody(hkBodySamples);
 * await soma.ingestBody(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformBody(
  samples: HKQuantitySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  const range = timeRange ?? sampleTimeRange(samples);

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

  const hasHeartData =
    hrSamples.length > 0 || hrvSamples.length > 0 || restingHrSamples.length > 0;

  // ── Blood pressure ─────────────────────────────────────────────────────
  const systolicSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBloodPressureSystolic",
  );
  const diastolicSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBloodPressureDiastolic",
  );

  // Pair systolic/diastolic by timestamp
  const bpSamples: Array<{
    timestamp?: string;
    systolic_bp?: number;
    diastolic_bp?: number;
  }> = [];
  for (const sys of systolicSamples) {
    const dia = diastolicSamples.find(
      (d) => d.startDate === sys.startDate,
    );
    bpSamples.push({
      timestamp: sys.startDate,
      systolic_bp: sys.value,
      diastolic_bp: dia?.value,
    });
  }

  // ── Oxygen saturation ──────────────────────────────────────────────────
  const spo2Samples = filterByType(
    samples,
    "HKQuantityTypeIdentifierOxygenSaturation",
  );
  const vo2Samples = filterByType(
    samples,
    "HKQuantityTypeIdentifierVO2Max",
  );

  const hasOxygenData = spo2Samples.length > 0 || vo2Samples.length > 0;

  // ── Temperature ────────────────────────────────────────────────────────
  const tempSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBodyTemperature",
  );

  // ── Blood glucose ──────────────────────────────────────────────────────
  const glucoseSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBloodGlucose",
  );

  // ── Measurements (weight, height, BMI, body fat, lean mass) ────────────
  const weightSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBodyMass",
  );
  const heightSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierHeight",
  );
  const bmiSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBodyMassIndex",
  );
  const bodyFatSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierBodyFatPercentage",
  );
  const leanMassSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierLeanBodyMass",
  );

  const hasMeasurements =
    weightSamples.length > 0 ||
    heightSamples.length > 0 ||
    bmiSamples.length > 0 ||
    bodyFatSamples.length > 0 ||
    leanMassSamples.length > 0;

  const firstSample = samples[0] as HKQuantitySample | undefined;

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
    },

    device_data: buildDeviceData(firstSample?.source, firstSample?.device),

    heart_data: hasHeartData
      ? {
          heart_rate_data: hrSamples.length > 0
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
                  max_hr_bpm: maxValue(hrSamples),
                  min_hr_bpm: minValue(hrSamples),
                  resting_hr_bpm: avgValue(restingHrSamples),
                  avg_hrv_sdnn: avgValue(hrvSamples),
                },
              }
            : undefined,
        }
      : undefined,

    blood_pressure_data:
      bpSamples.length > 0
        ? { blood_pressure_samples: bpSamples }
        : undefined,

    oxygen_data: hasOxygenData
      ? {
          avg_saturation_percentage: avgValue(spo2Samples) != null
            ? avgValue(spo2Samples)! * 100 // HealthKit returns 0-1, Terra expects 0-100
            : undefined,
          saturation_samples:
            spo2Samples.length > 0
              ? spo2Samples.map((s) => ({
                  timestamp: s.startDate,
                  percentage: s.value * 100,
                }))
              : undefined,
          vo2_samples:
            vo2Samples.length > 0
              ? vo2Samples.map((s) => ({
                  timestamp: s.startDate,
                  vo2max_ml_per_min_per_kg: s.value,
                }))
              : undefined,
          vo2max_ml_per_min_per_kg: vo2Samples.length > 0
            ? vo2Samples[vo2Samples.length - 1].value
            : undefined,
        }
      : undefined,

    temperature_data:
      tempSamples.length > 0
        ? {
            body_temperature_samples: tempSamples.map((s) => ({
              timestamp: s.startDate,
              temperature_celsius: s.value,
            })),
          }
        : undefined,

    glucose_data:
      glucoseSamples.length > 0
        ? {
            blood_glucose_samples: glucoseSamples.map((s) => ({
              timestamp: s.startDate,
              blood_glucose_mg_per_dL: s.value,
            })),
            day_avg_blood_glucose_mg_per_dL: avgValue(glucoseSamples),
          }
        : undefined,

    measurements_data: hasMeasurements
      ? {
          measurements: [
            {
              measurement_time: (
                weightSamples[0] ??
                heightSamples[0] ??
                bmiSamples[0] ??
                bodyFatSamples[0] ??
                leanMassSamples[0]
              )?.startDate,
              weight_kg:
                weightSamples.length > 0
                  ? weightSamples[weightSamples.length - 1].value
                  : undefined,
              height_cm:
                heightSamples.length > 0
                  ? heightSamples[heightSamples.length - 1].value * 100 // HealthKit m → cm
                  : undefined,
              BMI:
                bmiSamples.length > 0
                  ? bmiSamples[bmiSamples.length - 1].value
                  : undefined,
              bodyfat_percentage:
                bodyFatSamples.length > 0
                  ? bodyFatSamples[bodyFatSamples.length - 1].value * 100 // 0-1 → %
                  : undefined,
              lean_mass_g:
                leanMassSamples.length > 0
                  ? leanMassSamples[leanMassSamples.length - 1].value * 1000 // kg → g
                  : undefined,
            },
          ],
        }
      : undefined,
  };
}
