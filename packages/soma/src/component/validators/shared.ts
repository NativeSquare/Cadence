import { v } from "convex/values";
import {
  heartRateDataSample,
  hrvSampleRmssd,
  hrvSampleSdnn,
  heartRateZoneData,
  oxygenSaturationSample,
  vo2MaxSample,
} from "./samples.js";

// ─── DataContributor ────────────────────────────────────────────────────────
// Shared across Daily and Sleep data_enrichment contributor arrays.
export const dataContributor = v.object({
  contributor_name: v.string(),
  contributor_score: v.number(),
});

// ─── OtherDeviceData ─────────────────────────────────────────────────────────
export const otherDeviceData = v.object({
  name: v.optional(v.string()),
  manufacturer: v.optional(v.string()),
  serial_number: v.optional(v.string()),
  software_version: v.optional(v.string()),
  hardware_version: v.optional(v.string()),
  last_upload_date: v.optional(v.string()),
  activation_timestamp: v.optional(v.string()),
  data_provided: v.optional(v.array(v.string())),
});

// ─── DeviceData ──────────────────────────────────────────────────────────────
// Shared across Activity, Body, Daily, Sleep
export const deviceData = v.object({
  activation_timestamp: v.optional(v.string()),
  data_provided: v.optional(v.array(v.string())),
  hardware_version: v.optional(v.string()),
  last_upload_date: v.optional(v.string()),
  manufacturer: v.optional(v.string()),
  name: v.optional(v.string()),
  other_devices: v.optional(v.array(otherDeviceData)),
  serial_number: v.optional(v.string()),
  sensor_state: v.optional(v.string()),
  software_version: v.optional(v.string()),
});

// ─── HeartRateData (detailed + summary) ──────────────────────────────────────
// Shared across Activity, Body, Daily, Sleep
export const heartRateData = v.object({
  detailed: v.optional(
    v.object({
      hr_samples: v.optional(v.array(heartRateDataSample)),
      hrv_samples_rmssd: v.optional(v.array(hrvSampleRmssd)),
      hrv_samples_sdnn: v.optional(v.array(hrvSampleSdnn)),
    }),
  ),
  summary: v.optional(
    v.object({
      avg_hr_bpm: v.optional(v.number()),
      avg_hrv_rmssd: v.optional(v.number()),
      avg_hrv_sdnn: v.optional(v.number()),
      hr_zone_data: v.optional(v.array(heartRateZoneData)),
      max_hr_bpm: v.optional(v.number()),
      min_hr_bpm: v.optional(v.number()),
      resting_hr_bpm: v.optional(v.number()),
      user_max_hr_bpm: v.optional(v.number()),
    }),
  ),
});

// ─── OxygenData ──────────────────────────────────────────────────────────────
// Shared across Activity, Body, Daily
export const oxygenData = v.object({
  avg_saturation_percentage: v.optional(v.number()),
  saturation_samples: v.optional(v.array(oxygenSaturationSample)),
  vo2_samples: v.optional(v.array(vo2MaxSample)),
  vo2max_ml_per_min_per_kg: v.optional(v.number()),
});

// ─── Elevation ───────────────────────────────────────────────────────────────
// Shared across Activity, Daily distance_data
export const elevation = v.object({
  avg_meters: v.optional(v.number()),
  gain_actual_meters: v.optional(v.number()),
  gain_planned_meters: v.optional(v.number()),
  loss_actual_meters: v.optional(v.number()),
  max_meters: v.optional(v.number()),
  min_meters: v.optional(v.number()),
});

// ─── Swimming ────────────────────────────────────────────────────────────────
export const swimming = v.object({
  num_laps: v.optional(v.number()),
  num_strokes: v.optional(v.number()),
  pool_length_meters: v.optional(v.number()),
});

// ─── Macros ──────────────────────────────────────────────────────────────────
// Shared across Nutrition summary and Meal
export const macros = v.object({
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
});

// ─── Micros ──────────────────────────────────────────────────────────────────
// Full micronutrients for Nutrition summary
export const micros = v.object({
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
});
