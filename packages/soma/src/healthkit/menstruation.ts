// ─── Menstruation Transformer ─────────────────────────────────────────────────
// Transforms Apple HealthKit menstrual flow samples into the Soma Menstruation schema.

import type { HKCategorySample } from "./types.js";
import { mapMenstruationFlow } from "./maps/menstruation-flow.js";
import { sampleTimeRange } from "./utils.js";

/**
 * The output shape of {@link transformMenstruation}.
 */
export type MenstruationData = ReturnType<typeof transformMenstruation>;

/**
 * Transform an array of HealthKit menstrual flow category samples into a
 * Soma Menstruation document shape.
 *
 * @param samples - Array of HKCategorySample with sampleType "HKCategoryTypeIdentifierMenstrualFlow"
 * @param timeRange - Optional explicit time range; auto-detected from samples if omitted
 * @returns Soma Menstruation fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformMenstruation(hkMenstrualSamples);
 * await soma.ingestMenstruation(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformMenstruation(
  samples: HKCategorySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  if (samples.length === 0) {
    throw new Error(
      "transformMenstruation requires at least one menstrual flow sample",
    );
  }

  const range = timeRange ?? sampleTimeRange(samples);

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
    },

    menstruation_data: {
      menstruation_flow: samples.map((s) => ({
        timestamp: s.startDate,
        flow: mapMenstruationFlow(s.value),
      })),
    },
  };
}
