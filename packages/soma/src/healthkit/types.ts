// ─── Apple HealthKit Input Types ──────────────────────────────────────────────
// Library-agnostic TypeScript interfaces representing HealthKit data shapes.
// Compatible with @kingstinct/react-native-healthkit, react-native-health,
// expo-health, or any custom native module.
//
// These types define the CONTRACT that the host app must satisfy when passing
// HealthKit data to Soma's transformer functions. They intentionally do NOT
// depend on any specific React Native library.

// ─── Device ──────────────────────────────────────────────────────────────────

export interface HKDevice {
  name?: string;
  manufacturer?: string;
  model?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
}

// ─── Source ──────────────────────────────────────────────────────────────────

export interface HKSource {
  name: string;
  bundleIdentifier: string;
}

// ─── Quantity Sample ─────────────────────────────────────────────────────────
// Represents a numeric measurement from HealthKit (heart rate, steps, etc.)

export interface HKQuantitySample {
  uuid: string;
  sampleType: HKQuantityTypeIdentifier;
  startDate: string; // ISO-8601
  endDate: string; // ISO-8601
  value: number;
  unit: string; // "count", "count/min", "kcal", "m", "mg/dL", etc.
  source?: HKSource;
  device?: HKDevice;
}

// ─── Category Sample ─────────────────────────────────────────────────────────
// Represents a categorized observation (sleep stage, menstrual flow, etc.)

export interface HKCategorySample {
  uuid: string;
  sampleType: HKCategoryTypeIdentifier;
  startDate: string; // ISO-8601
  endDate: string; // ISO-8601
  value: number; // Category-specific enum value
  source?: HKSource;
  device?: HKDevice;
}

// ─── Workout ─────────────────────────────────────────────────────────────────

export interface HKWorkoutRoute {
  locations: Array<{
    latitude: number;
    longitude: number;
    altitude?: number;
    timestamp: string; // ISO-8601
  }>;
}

export interface HKWorkout {
  uuid: string;
  workoutActivityType: number; // HKWorkoutActivityType raw value
  startDate: string; // ISO-8601
  endDate: string; // ISO-8601
  duration: number; // seconds
  totalEnergyBurned?: number; // kcal
  totalDistance?: number; // meters
  totalSwimmingStrokeCount?: number;
  totalFlightsClimbed?: number;
  source?: HKSource;
  device?: HKDevice;
  // Associated samples (queried separately in HealthKit, attached by host app)
  heartRateSamples?: HKQuantitySample[];
  routeData?: HKWorkoutRoute[];
}

// ─── Activity Summary ────────────────────────────────────────────────────────
// Daily activity ring data from HealthKit

export interface HKActivitySummary {
  activeEnergyBurned: number; // kcal
  activeEnergyBurnedGoal: number; // kcal
  appleExerciseTime: number; // minutes
  appleExerciseTimeGoal: number; // minutes
  appleStandHours: number; // count
  appleStandHoursGoal: number; // count
  dateComponents: { year: number; month: number; day: number };
}

// ─── User Characteristics ────────────────────────────────────────────────────
// Static user profile data from HealthKit

export interface HKCharacteristics {
  biologicalSex?: HKBiologicalSex;
  dateOfBirth?: string; // ISO-8601 date
  bloodType?: string;
  fitzpatrickSkinType?: number;
  wheelchairUse?: boolean;
}

export type HKBiologicalSex = "female" | "male" | "other" | "notSet";

// ─── HealthKit Quantity Type Identifiers ─────────────────────────────────────
// Subset covering types that map to the Soma schema.

export type HKQuantityTypeIdentifier =
  // Body measurements
  | "HKQuantityTypeIdentifierBodyMass"
  | "HKQuantityTypeIdentifierHeight"
  | "HKQuantityTypeIdentifierBodyMassIndex"
  | "HKQuantityTypeIdentifierBodyFatPercentage"
  | "HKQuantityTypeIdentifierLeanBodyMass"
  // Heart
  | "HKQuantityTypeIdentifierHeartRate"
  | "HKQuantityTypeIdentifierRestingHeartRate"
  | "HKQuantityTypeIdentifierHeartRateVariabilitySDNN"
  | "HKQuantityTypeIdentifierHeartRateRecoveryOneMinute"
  // Blood pressure
  | "HKQuantityTypeIdentifierBloodPressureSystolic"
  | "HKQuantityTypeIdentifierBloodPressureDiastolic"
  // Respiratory
  | "HKQuantityTypeIdentifierOxygenSaturation"
  | "HKQuantityTypeIdentifierVO2Max"
  | "HKQuantityTypeIdentifierRespiratoryRate"
  // Metabolic
  | "HKQuantityTypeIdentifierBloodGlucose"
  | "HKQuantityTypeIdentifierBodyTemperature"
  // Activity
  | "HKQuantityTypeIdentifierStepCount"
  | "HKQuantityTypeIdentifierDistanceWalkingRunning"
  | "HKQuantityTypeIdentifierDistanceCycling"
  | "HKQuantityTypeIdentifierDistanceSwimming"
  | "HKQuantityTypeIdentifierActiveEnergyBurned"
  | "HKQuantityTypeIdentifierBasalEnergyBurned"
  | "HKQuantityTypeIdentifierFlightsClimbed"
  | "HKQuantityTypeIdentifierAppleExerciseTime"
  | "HKQuantityTypeIdentifierAppleStandTime"
  // Nutrition (dietary)
  | "HKQuantityTypeIdentifierDietaryEnergyConsumed"
  | "HKQuantityTypeIdentifierDietaryProtein"
  | "HKQuantityTypeIdentifierDietaryCarbohydrates"
  | "HKQuantityTypeIdentifierDietaryFatTotal"
  | "HKQuantityTypeIdentifierDietaryFatSaturated"
  | "HKQuantityTypeIdentifierDietaryFatMonounsaturated"
  | "HKQuantityTypeIdentifierDietaryFatPolyunsaturated"
  | "HKQuantityTypeIdentifierDietaryCholesterol"
  | "HKQuantityTypeIdentifierDietarySodium"
  | "HKQuantityTypeIdentifierDietarySugar"
  | "HKQuantityTypeIdentifierDietaryFiber"
  | "HKQuantityTypeIdentifierDietaryWater"
  | "HKQuantityTypeIdentifierDietaryCalcium"
  | "HKQuantityTypeIdentifierDietaryIron"
  | "HKQuantityTypeIdentifierDietaryPotassium"
  | "HKQuantityTypeIdentifierDietaryVitaminA"
  | "HKQuantityTypeIdentifierDietaryVitaminB6"
  | "HKQuantityTypeIdentifierDietaryVitaminB12"
  | "HKQuantityTypeIdentifierDietaryVitaminC"
  | "HKQuantityTypeIdentifierDietaryVitaminD"
  | "HKQuantityTypeIdentifierDietaryVitaminE"
  | "HKQuantityTypeIdentifierDietaryVitaminK"
  | "HKQuantityTypeIdentifierDietaryZinc"
  | "HKQuantityTypeIdentifierDietaryMagnesium"
  | "HKQuantityTypeIdentifierDietaryManganese"
  | "HKQuantityTypeIdentifierDietaryCopper"
  | "HKQuantityTypeIdentifierDietarySelenium"
  | "HKQuantityTypeIdentifierDietaryChromium"
  | "HKQuantityTypeIdentifierDietaryFolate"
  | "HKQuantityTypeIdentifierDietaryBiotin"
  | "HKQuantityTypeIdentifierDietaryNiacin"
  | "HKQuantityTypeIdentifierDietaryPhosphorus"
  | "HKQuantityTypeIdentifierDietaryRiboflavin"
  | "HKQuantityTypeIdentifierDietaryThiamin"
  | "HKQuantityTypeIdentifierDietaryCaffeine"
  | "HKQuantityTypeIdentifierDietaryIodine"
  | "HKQuantityTypeIdentifierDietaryChloride"
  // Hydration
  | "HKQuantityTypeIdentifierDietaryPanthothenicAcid"
  // Catch-all for future types
  | (string & {});

// ─── HealthKit Category Type Identifiers ─────────────────────────────────────

export type HKCategoryTypeIdentifier =
  | "HKCategoryTypeIdentifierSleepAnalysis"
  | "HKCategoryTypeIdentifierMenstrualFlow"
  | "HKCategoryTypeIdentifierAppleStandHour"
  | (string & {});

// ─── HealthKit Sleep Category Values ─────────────────────────────────────────

export const HKSleepCategory = {
  InBed: 0,
  AsleepUnspecified: 1,
  Awake: 2,
  AsleepCore: 3,
  AsleepDeep: 4,
  AsleepREM: 5,
} as const;

export type HKSleepCategoryValue =
  (typeof HKSleepCategory)[keyof typeof HKSleepCategory];

// ─── HealthKit Menstrual Flow Values ─────────────────────────────────────────

export const HKMenstrualFlowCategory = {
  Unspecified: 1,
  Light: 2,
  Medium: 3,
  Heavy: 4,
  None: 5,
} as const;

export type HKMenstrualFlowCategoryValue =
  (typeof HKMenstrualFlowCategory)[keyof typeof HKMenstrualFlowCategory];
