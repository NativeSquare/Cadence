// ─── Blood Pressure Transformer ──────────────────────────────────────────────
// Transforms Garmin blood pressure data into the Soma Body schema shape.

import type { GarminBloodPressure } from "./types.js";

export type BloodPressureData = ReturnType<typeof transformBloodPressure>;

/**
 * Transform a Garmin blood pressure record into a Soma Body document shape.
 *
 * @param bp - The Garmin blood pressure data from the Health API
 * @returns Soma Body fields (without connectionId/userId)
 */
export function transformBloodPressure(bp: GarminBloodPressure) {
  const measurementMs = (bp.measurementTimeInSeconds ?? 0) * 1000;
  const timestamp = new Date(measurementMs).toISOString();

  if (bp.systolic == null && bp.diastolic == null) {
    return {
      metadata: { start_time: timestamp, end_time: timestamp },
      blood_pressure_data: undefined,
    };
  }

  return {
    metadata: {
      start_time: timestamp,
      end_time: timestamp,
    },

    blood_pressure_data: {
      blood_pressure_samples: [
        {
          timestamp,
          diastolic_bp: bp.diastolic,
          systolic_bp: bp.systolic,
        },
      ],
    },
  };
}
