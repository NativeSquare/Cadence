import { v } from "convex/values";

// ─── HeartRateDataSample ─────────────────────────────────────────────────────
export const heartRateDataSample = v.object({
  timestamp: v.optional(v.string()),
  bpm: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
  context: v.optional(v.number()), // HeartRateContext enum
});

// ─── HeartRateVariabilityDataSampleRMSSD ─────────────────────────────────────
export const hrvSampleRmssd = v.object({
  timestamp: v.optional(v.string()),
  hrv_rmssd: v.optional(v.number()),
});

// ─── HeartRateVariabilityDataSampleSDNN ──────────────────────────────────────
export const hrvSampleSdnn = v.object({
  timestamp: v.optional(v.string()),
  hrv_sdnn: v.optional(v.number()),
});

// ─── HeartRateZoneData ───────────────────────────────────────────────────────
export const heartRateZoneData = v.object({
  zone: v.optional(v.number()), // HeartRateZone enum
  start_percentage: v.optional(v.number()),
  end_percentage: v.optional(v.number()),
  name: v.optional(v.string()),
  duration_seconds: v.optional(v.number()),
});

// ─── CalorieSample ───────────────────────────────────────────────────────────
export const calorieSample = v.object({
  timestamp: v.optional(v.string()),
  calories: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── DistanceSample ──────────────────────────────────────────────────────────
export const distanceSample = v.object({
  timestamp: v.optional(v.string()),
  distance_meters: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── StepSample ──────────────────────────────────────────────────────────────
export const stepSample = v.object({
  timestamp: v.optional(v.string()),
  steps: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── ElevationSample ─────────────────────────────────────────────────────────
export const elevationSample = v.object({
  timestamp: v.optional(v.string()),
  elev_meters: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── FloorsClimbedSample ─────────────────────────────────────────────────────
export const floorsClimbedSample = v.object({
  timestamp: v.optional(v.string()),
  floors_climbed: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── PositionSample ──────────────────────────────────────────────────────────
export const positionSample = v.object({
  timestamp: v.optional(v.string()),
  coords_lat_lng_deg: v.optional(v.array(v.number())), // [lat, lng]
  timer_duration_seconds: v.optional(v.number()),
});

// ─── SpeedSample ─────────────────────────────────────────────────────────────
export const speedSample = v.object({
  timestamp: v.optional(v.string()),
  speed_meters_per_second: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── CadenceSample ───────────────────────────────────────────────────────────
export const cadenceSample = v.object({
  timestamp: v.optional(v.string()),
  cadence_rpm: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── PowerSample ─────────────────────────────────────────────────────────────
export const powerSample = v.object({
  timestamp: v.optional(v.string()),
  watts: v.optional(v.number()),
  timer_duration_seconds: v.optional(v.number()),
});

// ─── TorqueSample ────────────────────────────────────────────────────────────
export const torqueSample = v.object({
  timestamp: v.optional(v.string()),
  timer_duration_seconds: v.optional(v.number()),
  torque_newton_meters: v.optional(v.number()),
});

// ─── ActivityLevelSample ─────────────────────────────────────────────────────
export const activityLevelSample = v.object({
  timestamp: v.optional(v.string()),
  level: v.optional(v.number()), // ActivityLevel enum
});

// ─── METSample ───────────────────────────────────────────────────────────────
export const metSample = v.object({
  timestamp: v.optional(v.string()),
  level: v.optional(v.number()),
});

// ─── TSSSample ───────────────────────────────────────────────────────────────
export const tssSample = v.object({
  planned: v.optional(v.number()),
  actual: v.optional(v.number()),
  method: v.optional(v.string()),
  intensity_factor_planned: v.optional(v.number()),
  intensity_factor_actual: v.optional(v.number()),
  normalized_power_watts: v.optional(v.number()),
});

// ─── LapSample ───────────────────────────────────────────────────────────────
export const lapSample = v.object({
  start_time: v.optional(v.string()),
  end_time: v.optional(v.string()),
  distance_meters: v.optional(v.number()),
  calories: v.optional(v.number()),
  total_strokes: v.optional(v.number()),
  stroke_type: v.optional(v.string()), // StrokeType string enum
  avg_speed_meters_per_second: v.optional(v.number()),
  avg_hr_bpm: v.optional(v.number()),
});

// ─── OxygenSaturationSample ──────────────────────────────────────────────────
export const oxygenSaturationSample = v.object({
  timestamp: v.optional(v.string()),
  percentage: v.optional(v.number()),
  type: v.optional(v.number()), // OxygenSaturationType enum (0=Blood, 1=Muscle)
});

// ─── Vo2MaxSample ────────────────────────────────────────────────────────────
export const vo2MaxSample = v.object({
  timestamp: v.optional(v.string()),
  vo2max_ml_per_min_per_kg: v.optional(v.number()),
});

// ─── GlucoseDataSample ───────────────────────────────────────────────────────
export const glucoseDataSample = v.object({
  timestamp: v.optional(v.string()),
  blood_glucose_mg_per_dL: v.optional(v.number()),
  glucose_level_flag: v.optional(v.number()), // GlucoseFlag enum
  trend_arrow: v.optional(v.number()), // TrendArrow enum
});

// ─── DailyPatternSample (BETA) ───────────────────────────────────────────────
export const dailyPatternSample = v.object({
  time_from_midnight: v.optional(v.number()),
  percentile_5: v.optional(v.number()),
  percentile_25: v.optional(v.number()),
  percentile_50: v.optional(v.number()),
  percentile_75: v.optional(v.number()),
  percentile_95: v.optional(v.number()),
});

// ─── BloodPressureSample ─────────────────────────────────────────────────────
export const bloodPressureSample = v.object({
  timestamp: v.optional(v.string()),
  diastolic_bp: v.optional(v.number()),
  systolic_bp: v.optional(v.number()),
});

// ─── ECGReading ──────────────────────────────────────────────────────────────
export const ecgReading = v.object({
  start_timestamp: v.optional(v.string()),
  avg_hr_bpm: v.optional(v.number()),
  afib_classification: v.optional(v.number()), // AFibFlag enum
  raw_signal: v.optional(
    v.array(
      v.object({
        potential_uV: v.optional(v.number()),
        timestamp: v.optional(v.string()),
      }),
    ),
  ),
});

// ─── AFibClassificationSample ────────────────────────────────────────────────
export const afibClassificationSample = v.object({
  timestamp: v.optional(v.string()),
  afib_classification: v.optional(v.number()), // AFibFlag enum
});

// ─── PulseVelocitySample ─────────────────────────────────────────────────────
export const pulseVelocitySample = v.object({
  timestamp: v.optional(v.string()),
  pulse_wave_velocity_meters_per_second: v.optional(v.number()),
});

// ─── RRInterval ──────────────────────────────────────────────────────────────
export const rrInterval = v.object({
  timestamp: v.optional(v.string()),
  rr_interval_ms: v.optional(v.number()),
  hr_bpm: v.optional(v.number()),
});

// ─── MeasurementDataSample ───────────────────────────────────────────────────
export const measurementDataSample = v.object({
  measurement_time: v.optional(v.string()),
  BMI: v.optional(v.number()),
  BMR: v.optional(v.number()),
  RMR: v.optional(v.number()),
  estimated_fitness_age: v.optional(v.string()),
  skin_fold_mm: v.optional(v.number()),
  bodyfat_percentage: v.optional(v.number()),
  weight_kg: v.optional(v.number()),
  height_cm: v.optional(v.number()),
  bone_mass_g: v.optional(v.number()),
  muscle_mass_g: v.optional(v.number()),
  lean_mass_g: v.optional(v.number()),
  water_percentage: v.optional(v.number()),
  insulin_units: v.optional(v.number()),
  insulin_type: v.optional(v.string()),
  urine_color: v.optional(v.string()),
  user_notes: v.optional(v.string()),
});

// ─── TemperatureSample ───────────────────────────────────────────────────────
export const temperatureSample = v.object({
  timestamp: v.optional(v.string()),
  temperature_celsius: v.optional(v.number()),
});

// ─── KetoneSample ────────────────────────────────────────────────────────────
export const ketoneSample = v.object({
  timestamp: v.optional(v.string()),
  ketone_mg_per_dL: v.optional(v.number()),
  sample_type: v.optional(v.number()),
});

// ─── HydrationLevelSample ────────────────────────────────────────────────────
export const hydrationLevelSample = v.object({
  timestamp: v.optional(v.string()),
  hydration_level: v.optional(v.number()),
});

// ─── HydrationMeasurementSample ──────────────────────────────────────────────
export const hydrationMeasurementSample = v.object({
  timestamp: v.optional(v.string()),
  hydration_kg: v.optional(v.number()),
});

// ─── SleepHypnogramSample ────────────────────────────────────────────────────
export const sleepHypnogramSample = v.object({
  timestamp: v.optional(v.string()),
  level: v.optional(v.number()), // SleepLevel enum
});

// ─── BreathSample ────────────────────────────────────────────────────────────
export const breathSample = v.object({
  timestamp: v.optional(v.string()),
  breaths_per_min: v.optional(v.number()),
});

// ─── SnoringSample ───────────────────────────────────────────────────────────
export const snoringSample = v.object({
  timestamp: v.optional(v.string()),
  duration_seconds: v.optional(v.number()),
});

// ─── StressSample ────────────────────────────────────────────────────────────
export const stressSample = v.object({
  timestamp: v.optional(v.string()),
  level: v.optional(v.number()),
});

// ─── BodyBatterySample ───────────────────────────────────────────────────────
export const bodyBatterySample = v.object({
  timestamp: v.optional(v.string()),
  level: v.optional(v.number()),
});

// ─── MenstruationFlowSample ──────────────────────────────────────────────────
export const menstruationFlowSample = v.object({
  timestamp: v.optional(v.string()),
  flow: v.optional(v.number()), // MenstruationFlow enum
});

// ─── DrinkSample ─────────────────────────────────────────────────────────────
export const drinkSample = v.object({
  timestamp: v.optional(v.string()),
  drink_volume: v.optional(v.number()),
  drink_unit: v.optional(v.string()),
  drink_name: v.optional(v.string()),
});

// ─── TagEntry ────────────────────────────────────────────────────────────────
export const tagEntry = v.object({
  timestamp: v.string(),
  tag_name: v.string(),
  notes: v.string(),
});

// ─── Meal ────────────────────────────────────────────────────────────────────
export const meal = v.object({
  name: v.string(),
  id: v.string(),
  timestamp: v.string(),
  type: v.number(), // MealType enum
  quantity: v.object({
    unit: v.number(), // NutritionUnits enum
    amount: v.number(),
  }),
  macros: v.object({
    alcohol_g: v.optional(v.number()),
    calories: v.optional(v.number()),
    carbohydrates_g: v.optional(v.number()),
    cholesterol_mg: v.optional(v.number()),
    fat_g: v.optional(v.number()),
    fiber_g: v.optional(v.number()),
    net_carbohydrates_g: v.optional(v.number()),
    protein_g: v.optional(v.number()),
    saturated_fat_g: v.optional(v.number()),
    sodium_mg: v.optional(v.number()),
    sugar_g: v.optional(v.number()),
    trans_fat_g: v.optional(v.number()),
  }),
  micros: v.object({
    biotin_mg: v.optional(v.number()),
    caffeine_mg: v.optional(v.number()),
    calcium_mg: v.optional(v.number()),
    chloride_mg: v.optional(v.number()),
    chromium_mg: v.optional(v.number()),
    copper_mg: v.optional(v.number()),
    folate_mg: v.optional(v.number()),
    folic_acid_mg: v.optional(v.number()),
    iodine_mg: v.optional(v.number()),
    iron_mg: v.optional(v.number()),
    magnesium_mg: v.optional(v.number()),
    manganese_mg: v.optional(v.number()),
    molybdenum_mg: v.optional(v.number()),
    niacin_mg: v.optional(v.number()),
    pantothenic_acid_mg: v.optional(v.number()),
    phosphorus_mg: v.optional(v.number()),
    potassium_mg: v.optional(v.number()),
    riboflavin_mg: v.optional(v.number()),
    selenium_mg: v.optional(v.number()),
    thiamin_mg: v.optional(v.number()),
    vitamin_A_mg: v.optional(v.number()),
    vitamin_B12_mg: v.optional(v.number()),
    vitamin_B6_mg: v.optional(v.number()),
    vitamin_C_mg: v.optional(v.number()),
    vitamin_D_mg: v.optional(v.number()),
    vitamin_D2_mg: v.optional(v.number()),
    vitamin_D3_mg: v.optional(v.number()),
    vitamin_E_mg: v.optional(v.number()),
    vitamin_K_mg: v.optional(v.number()),
    zinc_mg: v.optional(v.number()),
    // Amino acids
    cystine_g: v.optional(v.number()),
    histidine_g: v.optional(v.number()),
    isoleucine_g: v.optional(v.number()),
    leucine_g: v.optional(v.number()),
    lysine_g: v.optional(v.number()),
    methionine_g: v.optional(v.number()),
    phenylalanine_g: v.optional(v.number()),
    threonine_g: v.optional(v.number()),
    tryptophan_g: v.optional(v.number()),
    tyrosine_g: v.optional(v.number()),
    valine_g: v.optional(v.number()),
    // Fats & fatty acids
    monounsaturated_fat_g: v.optional(v.number()),
    polyunsaturated_fat_g: v.optional(v.number()),
    omega3_g: v.optional(v.number()),
    omega6_g: v.optional(v.number()),
    // Carbohydrates
    starch_g: v.optional(v.number()),
  }),
});
