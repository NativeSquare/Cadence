// ─── Skin Temperature Transformer ────────────────────────────────────────────
// Transforms Garmin skin temperature data into the Soma Body schema shape.

import type { GarminSkinTemperature } from "./types.js";

export type SkinTempData = ReturnType<typeof transformSkinTemp>;

/**
 * Transform a Garmin skin temperature record into a Soma Body document shape.
 *
 * @param skinTemp - The Garmin skin temperature data from the Health API
 * @returns Soma Body fields (without connectionId/userId)
 */
export function transformSkinTemp(skinTemp: GarminSkinTemperature) {
  const startMs = (skinTemp.startTimeInSeconds ?? 0) * 1000;
  const endMs = startMs + (skinTemp.durationInSeconds ?? 0) * 1000;
  const startTime = new Date(startMs).toISOString();
  const endTime = new Date(endMs).toISOString();

  if (skinTemp.avgDeviationCelsius == null) {
    return {
      metadata: { start_time: startTime, end_time: endTime },
      temperature_data: undefined,
    };
  }

  return {
    metadata: {
      start_time: startTime,
      end_time: endTime,
    },

    temperature_data: {
      skin_temperature_samples: [
        {
          timestamp: startTime,
          temperature_celsius: skinTemp.avgDeviationCelsius,
        },
      ],
    },
  };
}
