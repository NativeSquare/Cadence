import { v } from "convex/values";
import {
  activityLevelSample,
  breathSample,
  calorieSample,
  distanceSample,
  elevationSample,
  floorsClimbedSample,
  stepSample,
  metSample,
  oxygenSaturationSample,
  vo2MaxSample,
  stressSample,
  bodyBatterySample,
  tagEntry,
} from "./samples.js";
import {
  deviceData,
  heartRateData,
  elevation,
  swimming,
  dataContributor,
} from "./shared.js";

// ─── Daily ───────────────────────────────────────────────────────────────────
// Summary of daily activity metrics.
// Maps 1:1 to Terra's Daily data model.
// Uniquely identified by metadata.start_time + metadata.end_time.
export const dailyValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),

  // ── active_durations_data ────────────────────────────────────────────────
  active_durations_data: v.optional(
    v.object({
      activity_levels_samples: v.optional(v.array(activityLevelSample)),
      activity_seconds: v.optional(v.number()),
      inactivity_seconds: v.optional(v.number()),
      low_intensity_seconds: v.optional(v.number()),
      moderate_intensity_seconds: v.optional(v.number()),
      num_continuous_inactive_periods: v.optional(v.number()),
      rest_seconds: v.optional(v.number()),
      standing_hours_count: v.optional(v.number()),
      standing_seconds: v.optional(v.number()),
      vigorous_intensity_seconds: v.optional(v.number()),
    }),
  ),

  // ── calories_data ────────────────────────────────────────────────────────
  calories_data: v.optional(
    v.object({
      BMR_calories: v.optional(v.number()),
      calorie_samples: v.optional(v.array(calorieSample)),
      net_activity_calories: v.optional(v.number()),
      net_intake_calories: v.optional(v.number()),
      total_burned_calories: v.optional(v.number()),
    }),
  ),

  // ── data_enrichment ──────────────────────────────────────────────────────
  data_enrichment: v.optional(
    v.object({
      cardiovascular_contributors: v.optional(v.array(dataContributor)),
      cardiovascular_score: v.optional(v.number()),
      immune_contributors: v.optional(v.array(dataContributor)),
      immune_index: v.optional(v.number()),
      readiness_contributors: v.optional(v.array(dataContributor)),
      readiness_score: v.optional(v.number()),
      respiratory_contributors: v.optional(v.array(dataContributor)),
      respiratory_score: v.optional(v.number()),
      start_time: v.optional(v.string()),
      stress_contributors: v.optional(v.array(dataContributor)),
      total_stress_score: v.optional(v.number()),
    }),
  ),

  // ── device_data ──────────────────────────────────────────────────────────
  device_data: v.optional(deviceData),

  // ── distance_data ────────────────────────────────────────────────────────
  distance_data: v.optional(
    v.object({
      detailed: v.optional(
        v.object({
          distance_samples: v.optional(v.array(distanceSample)),
          elevation_samples: v.optional(v.array(elevationSample)),
          floors_climbed_samples: v.optional(v.array(floorsClimbedSample)),
          step_samples: v.optional(v.array(stepSample)),
        }),
      ),
      distance_meters: v.optional(v.number()),
      elevation: v.optional(elevation),
      floors_climbed: v.optional(v.number()),
      steps: v.optional(v.number()),
      swimming: v.optional(swimming),
    }),
  ),

  // ── heart_rate_data ──────────────────────────────────────────────────────
  heart_rate_data: v.optional(heartRateData),

  // ── MET_data ─────────────────────────────────────────────────────────────
  MET_data: v.optional(
    v.object({
      MET_samples: v.optional(v.array(metSample)),
      avg_level: v.optional(v.number()),
      num_high_intensity_minutes: v.optional(v.number()),
      num_inactive_minutes: v.optional(v.number()),
      num_low_intensity_minutes: v.optional(v.number()),
      num_moderate_intensity_minutes: v.optional(v.number()),
    }),
  ),

  // ── metadata ─────────────────────────────────────────────────────────────
  metadata: v.object({
    end_time: v.string(),
    start_time: v.string(),
    timestamp_localization: v.optional(v.number()),
    upload_type: v.number(), // UploadType enum
  }),

  // ── respiration_data ────────────────────────────────────────────────────
  respiration_data: v.optional(
    v.object({
      breaths_data: v.optional(
        v.object({
          avg_breaths_per_min: v.optional(v.number()),
          max_breaths_per_min: v.optional(v.number()),
          min_breaths_per_min: v.optional(v.number()),
          samples: v.optional(v.array(breathSample)),
        }),
      ),
    }),
  ),

  // ── oxygen_data ──────────────────────────────────────────────────────────
  oxygen_data: v.optional(
    v.object({
      avg_saturation_percentage: v.optional(v.number()),
      saturation_samples: v.optional(v.array(oxygenSaturationSample)),
      vo2_samples: v.optional(v.array(vo2MaxSample)),
      vo2max_ml_per_min_per_kg: v.optional(v.number()),
    }),
  ),

  // ── scores ───────────────────────────────────────────────────────────────
  scores: v.optional(
    v.object({
      activity: v.optional(v.number()),
      recovery: v.optional(v.number()),
      sleep: v.optional(v.number()),
      biological_age: v.optional(v.number()),
    }),
  ),

  // ── strain_data ──────────────────────────────────────────────────────────
  strain_data: v.optional(
    v.object({
      strain_level: v.optional(v.number()),
    }),
  ),

  // ── stress_data ──────────────────────────────────────────────────────────
  stress_data: v.optional(
    v.object({
      activity_stress_duration_seconds: v.optional(v.number()),
      avg_stress_level: v.optional(v.number()),
      body_battery_samples: v.optional(v.array(bodyBatterySample)),
      high_stress_duration_seconds: v.optional(v.number()),
      low_stress_duration_seconds: v.optional(v.number()),
      max_stress_level: v.optional(v.number()),
      medium_stress_duration_seconds: v.optional(v.number()),
      rest_stress_duration_seconds: v.optional(v.number()),
      samples: v.optional(v.array(stressSample)),
      stress_duration_seconds: v.optional(v.number()),
      stress_rating: v.optional(v.number()),
    }),
  ),

  // ── tag_data ─────────────────────────────────────────────────────────────
  tag_data: v.optional(
    v.object({
      tags: v.optional(v.array(tagEntry)),
    }),
  ),
};
