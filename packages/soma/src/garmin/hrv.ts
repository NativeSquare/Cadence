// ─── HRV Transformer ─────────────────────────────────────────────────────────
// Transforms Garmin HRV summary data into fields that enrich a Soma Daily record.

import type { GarminHRVSummary } from "./types.js";

export type HRVData = ReturnType<typeof transformHRV>;

/**
 * Transform a Garmin HRV summary into heart rate data fields for a Soma Daily.
 *
 * This produces a partial daily shape that can be merged into a matching
 * daily record by date.
 *
 * @param hrv - The Garmin HRV summary from the Health API
 * @returns Partial Soma Daily heart_rate_data fields
 */
export function transformHRV(hrv: GarminHRVSummary) {
  const startMs = (hrv.startTimeInSeconds ?? 0) * 1000;
  const endMs = startMs + (hrv.durationInSeconds ?? 0) * 1000;

  const hasSummary = hrv.lastNightAvg != null || hrv.lastNight5MinHigh != null;
  const hasSamples =
    hrv.hrvValues != null && Object.keys(hrv.hrvValues).length > 0;

  if (!hasSummary && !hasSamples) {
    return {
      calendar_date: hrv.calendarDate,
      heart_rate_data: undefined,
    };
  }

  const startTime = hrv.startTimeInSeconds ?? 0;
  const hrvSamples = hasSamples
    ? Object.entries(hrv.hrvValues!).map(([offset, rmssd]) => ({
        timestamp: new Date(
          (startTime + parseInt(offset, 10)) * 1000,
        ).toISOString(),
        hrv_rmssd: rmssd,
      }))
    : undefined;

  return {
    calendar_date: hrv.calendarDate,
    heart_rate_data: {
      summary: hasSummary
        ? {
            avg_hrv_rmssd: hrv.lastNightAvg,
            max_hrv_rmssd: hrv.lastNight5MinHigh,
          }
        : undefined,
      detailed:
        hrvSamples && hrvSamples.length > 0
          ? { hrv_samples_rmssd: hrvSamples }
          : undefined,
    },
  };
}
