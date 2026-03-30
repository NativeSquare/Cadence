// ─── HK Sleep Category → Terra SleepLevel ────────────────────────────────────
// Maps Apple HealthKit sleep analysis category values to Terra's SleepLevel enum.
//
// HK values: https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis
// Terra SleepLevel: 0=Unknown, 1=Awake, 2=Sleeping, 3=OutOfBed, 4=Light, 5=Deep, 6=REM

import { HKSleepCategory } from "../types.js";

const sleepLevelMap: Record<number, number> = {
  [HKSleepCategory.InBed]: 2, // InBed → Sleeping (generic)
  [HKSleepCategory.AsleepUnspecified]: 2, // AsleepUnspecified → Sleeping
  [HKSleepCategory.Awake]: 1, // Awake → Awake
  [HKSleepCategory.AsleepCore]: 4, // AsleepCore → Light
  [HKSleepCategory.AsleepDeep]: 5, // AsleepDeep → Deep
  [HKSleepCategory.AsleepREM]: 6, // AsleepREM → REM
};

/**
 * Map an HKCategoryValueSleepAnalysis value to the Terra SleepLevel enum.
 * Returns 0 (Unknown) for unrecognized values.
 */
export function mapSleepLevel(hkSleepValue: number): number {
  return sleepLevelMap[hkSleepValue] ?? 0;
}

/**
 * Returns true if the HK sleep category represents an "asleep" state
 * (not awake, not just in bed).
 */
export function isAsleepCategory(hkSleepValue: number): boolean {
  return (
    hkSleepValue === HKSleepCategory.AsleepUnspecified ||
    hkSleepValue === HKSleepCategory.AsleepCore ||
    hkSleepValue === HKSleepCategory.AsleepDeep ||
    hkSleepValue === HKSleepCategory.AsleepREM
  );
}
