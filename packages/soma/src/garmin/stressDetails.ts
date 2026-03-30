// ─── Stress Details Transformer ──────────────────────────────────────────────
// Transforms Garmin stress detail data into fields that enrich a Soma Daily record.

import type { GarminStressDetail } from "./types.js";

export type StressDetailsData = ReturnType<typeof transformStressDetails>;

/**
 * Transform a Garmin stress detail record into stress data fields for a Soma Daily.
 *
 * This produces a partial daily shape that can be merged into a matching
 * daily record by date.
 *
 * @param stress - The Garmin stress detail data from the Health API
 * @returns Partial Soma Daily stress_data fields
 */
export function transformStressDetails(stress: GarminStressDetail) {
  const hasSummary =
    stress.averageStressLevel != null || stress.maxStressLevel != null;
  const hasStressSamples =
    stress.timeOffsetStressLevelValues != null &&
    Object.keys(stress.timeOffsetStressLevelValues).length > 0;
  const hasBodyBatterySamples =
    stress.timeOffsetBodyBatteryValues != null &&
    Object.keys(stress.timeOffsetBodyBatteryValues).length > 0;

  if (!hasSummary && !hasStressSamples && !hasBodyBatterySamples) {
    return {
      calendar_date: stress.calendarDate,
      stress_data: undefined,
    };
  }

  const startTime = stress.startTimeInSeconds ?? 0;

  const stressSamples = hasStressSamples
    ? Object.entries(stress.timeOffsetStressLevelValues!).map(
        ([offset, level]) => ({
          timestamp: new Date(
            (startTime + parseInt(offset, 10)) * 1000,
          ).toISOString(),
          level,
        }),
      )
    : undefined;

  const bodyBatterySamples = hasBodyBatterySamples
    ? Object.entries(stress.timeOffsetBodyBatteryValues!).map(
        ([offset, level]) => ({
          timestamp: new Date(
            (startTime + parseInt(offset, 10)) * 1000,
          ).toISOString(),
          level,
        }),
      )
    : undefined;

  return {
    calendar_date: stress.calendarDate,
    stress_data: {
      avg_stress_level: stress.averageStressLevel,
      max_stress_level: stress.maxStressLevel,
      samples:
        stressSamples && stressSamples.length > 0 ? stressSamples : undefined,
      body_battery_samples:
        bodyBatterySamples && bodyBatterySamples.length > 0
          ? bodyBatterySamples
          : undefined,
    },
  };
}
