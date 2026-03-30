// ─── @nativesquare/soma/healthkit ─────────────────────────────────────────────
// Apple HealthKit → Soma schema transformers.
//
// Pure TypeScript functions with zero runtime dependencies.
// Compatible with any HealthKit library (react-native-health, expo-health, etc.)

// ── Transformers ─────────────────────────────────────────────────────────────
export { transformWorkout } from "./activity.js";
export type { ActivityData } from "./activity.js";

export { transformSleep } from "./sleep.js";
export type { SleepData } from "./sleep.js";

export { transformBody } from "./body.js";
export type { BodyData } from "./body.js";

export { transformDaily, transformDailyFromSummary } from "./daily.js";
export type { DailyData } from "./daily.js";

export { transformNutrition } from "./nutrition.js";
export type { NutritionData } from "./nutrition.js";

export { transformMenstruation } from "./menstruation.js";
export type { MenstruationData } from "./menstruation.js";

export { transformAthlete } from "./athlete.js";
export type { AthleteData } from "./athlete.js";

// ── Enum Maps ────────────────────────────────────────────────────────────────
export { mapActivityType } from "./maps/activity-type.js";
export { mapSleepLevel, isAsleepCategory } from "./maps/sleep-level.js";
export { mapMenstruationFlow } from "./maps/menstruation-flow.js";

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  HKQuantitySample,
  HKCategorySample,
  HKWorkout,
  HKWorkoutRoute,
  HKActivitySummary,
  HKDevice,
  HKSource,
  HKCharacteristics,
  HKBiologicalSex,
  HKQuantityTypeIdentifier,
  HKCategoryTypeIdentifier,
  HKSleepCategoryValue,
  HKMenstrualFlowCategoryValue,
} from "./types.js";

export { HKSleepCategory, HKMenstrualFlowCategory } from "./types.js";

// ── Utilities ────────────────────────────────────────────────────────────────
export {
  diffSeconds,
  dayRange,
  sampleTimeRange,
  buildDeviceData,
} from "./utils.js";
