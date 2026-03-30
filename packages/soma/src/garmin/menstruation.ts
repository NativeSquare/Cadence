// ─── Menstruation Transformer ────────────────────────────────────────────────
// Transforms Garmin menstrual cycle data into the Soma Menstruation schema shape.

import type { GarminMenstrualCycle } from "./types.js";

export type MenstruationData = ReturnType<typeof transformMenstruation>;

/**
 * Transform a Garmin menstrual cycle record into a Soma Menstruation document shape.
 *
 * @param data - The Garmin menstrual cycle data from the Health API
 * @returns Soma Menstruation fields (without connectionId/userId)
 */
export function transformMenstruation(data: GarminMenstrualCycle) {
  // Spec uses periodStartDate (date string like "2021-01-04")
  const dateStr = data.periodStartDate;
  const startTime = dateStr
    ? `${dateStr}T00:00:00.000Z`
    : undefined;
  const endTime = dateStr
    ? `${dateStr}T23:59:59.999Z`
    : undefined;

  return {
    metadata: {
      start_time: startTime,
      end_time: endTime,
    },

    menstruation_data: {
      day_in_cycle: data.dayInCycle,
      // Spec has currentPhaseType (string) replacing deprecated currentPhase (int)
      current_phase: data.currentPhaseType?.toLowerCase(),
      length_of_current_phase_days: data.lengthOfCurrentPhase,
      days_until_next_phase: data.daysUntilNextPhase,
      period_length_days: data.periodLength,
      predicted_cycle_length_days: data.predictedCycleLength,
      cycle_length_days: data.cycleLength,
      is_predicted_cycle: data.isPredictedCycle != null
        ? String(data.isPredictedCycle)
        : undefined,
    },
  };
}
