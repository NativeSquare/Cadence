// ─── Pulse Ox Transformer ────────────────────────────────────────────────────
// Transforms Garmin pulse ox data into fields that enrich a Soma Daily record.

import type { GarminPulseOx } from "./types.js";

export type PulseOxData = ReturnType<typeof transformPulseOx>;

/**
 * Transform a Garmin pulse ox record into oxygen data fields for a Soma Daily.
 *
 * This produces a partial daily shape that can be merged into a matching
 * daily record by date.
 *
 * @param pulseOx - The Garmin pulse ox data from the Health API
 * @returns Partial Soma Daily oxygen_data fields
 */
export function transformPulseOx(pulseOx: GarminPulseOx) {
  const hasSamples =
    pulseOx.timeOffsetSpo2Values != null &&
    Object.keys(pulseOx.timeOffsetSpo2Values).length > 0;

  if (!hasSamples) {
    return {
      calendar_date: pulseOx.calendarDate,
      oxygen_data: undefined,
    };
  }

  const startTime = pulseOx.startTimeInSeconds ?? 0;
  const samples = Object.entries(pulseOx.timeOffsetSpo2Values!).map(
    ([offset, percentage]) => ({
      timestamp: new Date(
        (startTime + parseInt(offset, 10)) * 1000,
      ).toISOString(),
      percentage,
    }),
  );

  return {
    calendar_date: pulseOx.calendarDate,
    oxygen_data: {
      saturation_samples: samples.length > 0 ? samples : undefined,
    },
  };
}
