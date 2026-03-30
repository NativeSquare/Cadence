// ─── Body Transformer ────────────────────────────────────────────────────────
// Transforms Garmin body composition data into the Soma Body schema shape.

import type { GarminBodyComposition } from "./types.js";

export type BodyData = ReturnType<typeof transformBody>;

/**
 * Transform a Garmin body composition record into a Soma Body document shape.
 *
 * @param body - The Garmin body composition data from the Health API
 * @returns Soma Body fields (without connectionId/userId)
 */
export function transformBody(body: GarminBodyComposition) {
  const measurementMs = (body.measurementTimeInSeconds ?? 0) * 1000;
  const timestamp = new Date(measurementMs).toISOString();

  return {
    metadata: {
      start_time: timestamp,
      end_time: timestamp,
    },

    measurements_data: buildMeasurementsData(body, timestamp),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMeasurementsData(
  body: GarminBodyComposition,
  timestamp: string,
) {
  if (
    body.weightInGrams == null &&
    body.bodyFatInPercent == null &&
    body.bodyMassIndex == null &&
    body.muscleMassInGrams == null &&
    body.boneMassInGrams == null &&
    body.bodyWaterInPercent == null
  ) {
    return undefined;
  }

  return {
    measurements: [
      {
        measurement_time: timestamp,
        weight_kg:
          body.weightInGrams != null ? body.weightInGrams / 1000 : undefined,
        BMI: body.bodyMassIndex,
        bodyfat_percentage: body.bodyFatInPercent,
        muscle_mass_g: body.muscleMassInGrams,
        bone_mass_g: body.boneMassInGrams,
        water_percentage: body.bodyWaterInPercent,
      },
    ],
  };
}
