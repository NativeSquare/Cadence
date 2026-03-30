import { v } from "convex/values";

// ─── ActivityType ────────────────────────────────────────────────────────────
// Numeric enum mapping activity/workout types (0–148)
export const activityType = v.number();

// ─── ActivityLevel ───────────────────────────────────────────────────────────
// 0=Unknown, 1=Rest, 2=Inactive, 3=Low, 4=Medium, 5=High
export const activityLevel = v.number();

// ─── UploadType ──────────────────────────────────────────────────────────────
// 0=Unknown, 1=Automatic, 2=Manual, 3=Update, 4=Delete, 5=Pending, 6=ThirdParty
export const uploadType = v.number();

// ─── SleepUploadType ─────────────────────────────────────────────────────────
// 0=Unknown, 1=Manual, 2=Automatic, 3=Tentative, 4=Indeterminate
export const sleepUploadType = v.number();

// ─── SleepLevel ──────────────────────────────────────────────────────────────
// 0=Unknown, 1=Awake, 2=Sleeping, 3=OutOfBed, 4=Light, 5=Deep, 6=REM
export const sleepLevel = v.number();

// ─── HeartRateZone ───────────────────────────────────────────────────────────
// 0–5 = Zone 0–5, 6 = Other/custom
export const heartRateZone = v.number();

// ─── HeartRateContext ────────────────────────────────────────────────────────
// 0=NOT_SET, 1=ACTIVE, 2=NOT_ACTIVE
export const heartRateContext = v.number();

// ─── AFibFlag ────────────────────────────────────────────────────────────────
// 0=Negative, 1=Positive, 2=Inconclusive
export const afibFlag = v.number();

// ─── GlucoseFlag ─────────────────────────────────────────────────────────────
// 0=Normal, 1=High, 2=Low
export const glucoseFlag = v.number();

// ─── TrendArrow ──────────────────────────────────────────────────────────────
// 0=UNKNOWN, 1=FALLING_QUICKLY, 2=FALLING, 3=FLAT, 4=RISING, 5=RISING_QUICKLY
export const trendArrow = v.number();

// ─── RecoveryLevel ───────────────────────────────────────────────────────────
// 0=Unknown, 1=VeryPoor, 2=Poor, 3=Compromised, 4=Ok, 5=Good, 6=VeryGood
export const recoveryLevel = v.number();

// ─── StrokeType (string enum) ────────────────────────────────────────────────
export const strokeType = v.union(
  v.literal("other"),
  v.literal("freestyle"),
  v.literal("backstroke"),
  v.literal("breaststroke"),
  v.literal("butterfly"),
);

// ─── StrokeType (numeric, for planned workouts) ──────────────────────────────
// 0=BACKSTROKE, 1=BREASTSTROKE, 2=DRILL, 3=BUTTERFLY, 4=FREESTYLE, 5=MIXED, 6=IM
export const plannedStrokeType = v.number();

// ─── EquipmentType (planned workouts) ────────────────────────────────────────
// 0=NONE, 1=SWIM_FINS, 2=KICKBOARD, 3=PADDLES, 4=PULL_BUOY, 5=SNORKEL
export const equipmentType = v.number();

// ─── ExerciseType (planned workouts) ─────────────────────────────────────────
// 0=UNKNOWN, 1=BENCH_PRESS, ..., 35=CARDIO_SENSORS
export const exerciseType = v.number();

// ─── NutritionUnits ──────────────────────────────────────────────────────────
// 0=Unknown, 1=Gram, 2=Teaspoon, ..., 12=FluidOunce
export const nutritionUnits = v.number();

// ─── MenstruationFlow ────────────────────────────────────────────────────────
// 0=UNKNOWN, 1=NONE, 2=LIGHT, 3=MEDIUM, 4=HEAVY, 5=HAD
export const menstruationFlow = v.number();

// ─── MenstrualPhase (string enum) ────────────────────────────────────────────
export const menstrualPhase = v.union(
  v.literal("menstrual"),
  v.literal("follicular"),
  v.literal("ovulation"),
  v.literal("luteal"),
  v.literal("pms"),
  v.literal("fertile"),
  v.literal("first_trimester"),
  v.literal("second_trimester"),
  v.literal("third_trimester"),
  v.literal("unknown"),
);

// ─── MealType ────────────────────────────────────────────────────────────────
// 0=UNKNOWN, 1=BREAKFAST, 2=MORNING_SNACK, 3=LUNCH,
// 4=AFTERNOON_SNACK, 5=DINNER, 6=SNACK
export const mealType = v.number();

// ─── StressLevel ─────────────────────────────────────────────────────────────
// 0=NOT_ENOUGH_DATA, 1=REST, 2=LOW, 3=MEDIUM, 4=HIGH
export const stressLevel = v.number();

// ─── Timezone Localization ───────────────────────────────────────────────────
// 0=UTC, 1=LOCAL
export const timestampLocalization = v.number();

// ─── DeviceDataType (string enum) ────────────────────────────────────────────
export const deviceDataType = v.union(
  v.literal("STEPS"),
  v.literal("ACTIVE_MINUTES"),
  v.literal("BMR"),
  v.literal("CALORIES"),
  v.literal("DISTANCE"),
  v.literal("HEART_RATE"),
  v.literal("OXYGEN_SATURATION"),
  v.literal("SLEEP_TYPE"),
  v.literal("SPEED"),
  v.literal("CADENCE"),
);

// ─── Planned Workout Step Intensity ──────────────────────────────────────────
// 0=REST, 1=WARMUP, 2=COOLDOWN, 3=RECOVERY, 4=INTERVAL, 5=ACTIVE
export const stepIntensity = v.number();
