// ─── User Metrics Transformer ────────────────────────────────────────────────
// Transforms Garmin user metrics into the Soma Body schema shape.

import type { GarminUserMetrics } from "./types.js";

export type UserMetricsData = ReturnType<typeof transformUserMetrics>;

/**
 * Transform Garmin user metrics into a Soma Body document shape.
 *
 * Maps VO2 Max and fitness age into oxygen_data and scores fields.
 *
 * @param metrics - The Garmin user metrics from the Health API
 * @returns Soma Body fields (without connectionId/userId)
 */
export function transformUserMetrics(metrics: GarminUserMetrics) {
  const dateStr = metrics.calendarDate;
  const startTime = dateStr
    ? `${dateStr}T00:00:00.000Z`
    : new Date(0).toISOString();
  const endTime = dateStr
    ? `${dateStr}T23:59:59.999Z`
    : new Date(0).toISOString();

  const hasVo2 = metrics.vo2Max != null || metrics.vo2MaxCycling != null;
  const hasFitnessAge = metrics.fitnessAge != null;

  if (!hasVo2 && !hasFitnessAge) {
    return {
      metadata: { start_time: startTime, end_time: endTime },
      oxygen_data: undefined,
      scores: undefined,
    };
  }

  return {
    metadata: {
      start_time: startTime,
      end_time: endTime,
    },

    oxygen_data: hasVo2
      ? { vo2max_ml_per_min_per_kg: metrics.vo2Max ?? metrics.vo2MaxCycling }
      : undefined,

    scores: hasFitnessAge
      ? { biological_age: metrics.fitnessAge }
      : undefined,
  };
}
