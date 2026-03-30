// ─── Respiration Transformer ─────────────────────────────────────────────────
// Transforms Garmin respiration data into fields that enrich a Soma Daily record.

import type { GarminRespiration } from "./types.js";

export type RespirationData = ReturnType<typeof transformRespiration>;

/**
 * Transform a Garmin respiration record into respiration data fields for a Soma Daily.
 *
 * This produces a partial daily shape that can be merged into a matching
 * daily record by date.
 *
 * @param resp - The Garmin respiration data from the Health API
 * @returns Partial Soma Daily respiration_data fields
 */
export function transformRespiration(resp: GarminRespiration) {
  const hasSamples =
    resp.timeOffsetEpochToBreaths != null &&
    Object.keys(resp.timeOffsetEpochToBreaths).length > 0;

  if (!hasSamples) {
    return {
      calendar_date: undefined,
      respiration_data: undefined,
    };
  }

  const startTime = resp.startTimeInSeconds ?? 0;
  const samples = Object.entries(resp.timeOffsetEpochToBreaths!).map(
    ([offset, breaths_per_min]) => ({
      timestamp: new Date(
        (startTime + parseInt(offset, 10)) * 1000,
      ).toISOString(),
      breaths_per_min,
    }),
  );

  // Compute summary stats from samples
  const values = samples.map((s) => s.breaths_per_min);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  return {
    // Respiration endpoint doesn't have calendarDate, derive from startTime
    calendar_date: new Date(startTime * 1000).toISOString().split("T")[0],
    respiration_data: {
      breaths_data: {
        avg_breaths_per_min: Math.round(avg * 10) / 10,
        min_breaths_per_min: Math.min(...values),
        max_breaths_per_min: Math.max(...values),
        samples: samples.length > 0 ? samples : undefined,
      },
    },
  };
}
