// ─── HK Menstrual Flow → Terra MenstruationFlow ─────────────────────────────
// Maps Apple HealthKit menstrual flow category values to Terra's MenstruationFlow enum.
//
// HK values: https://developer.apple.com/documentation/healthkit/hkcategoryvaluemenstrualflow
// Terra MenstruationFlow: 0=UNKNOWN, 1=NONE, 2=LIGHT, 3=MEDIUM, 4=HEAVY, 5=HAD

import { HKMenstrualFlowCategory } from "../types.js";

const menstruationFlowMap: Record<number, number> = {
  [HKMenstrualFlowCategory.Unspecified]: 5, // Unspecified → HAD (flow occurred, amount unknown)
  [HKMenstrualFlowCategory.Light]: 2, // Light → LIGHT
  [HKMenstrualFlowCategory.Medium]: 3, // Medium → MEDIUM
  [HKMenstrualFlowCategory.Heavy]: 4, // Heavy → HEAVY
  [HKMenstrualFlowCategory.None]: 1, // None → NONE
};

/**
 * Map an HKCategoryValueMenstrualFlow value to the Terra MenstruationFlow enum.
 * Returns 0 (UNKNOWN) for unrecognized values.
 */
export function mapMenstruationFlow(hkFlowValue: number): number {
  return menstruationFlowMap[hkFlowValue] ?? 0;
}
