import { v } from "convex/values";
import {
  calorieSample,
  distanceSample,
  elevationSample,
  floorsClimbedSample,
  stepSample,
  speedSample,
  cadenceSample,
  torqueSample,
  activityLevelSample,
  metSample,
  tssSample,
  lapSample,
  powerSample,
  positionSample,
  oxygenSaturationSample,
  vo2MaxSample,
} from "./samples.js";
import { deviceData, heartRateData, elevation, swimming } from "./shared.js";

// ─── Activity ────────────────────────────────────────────────────────────────
// Workouts/activities performed during a time period.
// Maps 1:1 to Terra's Activity data model.
// Uniquely identified by metadata.summary_id.
export const activityValidator = {
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

  // ── cheat_detection ────────────────────────────────────────────────────
  cheat_detection: v.optional(v.number()),

  // ── data_enrichment ──────────────────────────────────────────────────────
  data_enrichment: v.optional(
    v.object({
      stress_score: v.optional(v.number()),
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
      summary: v.optional(
        v.object({
          distance_meters: v.optional(v.number()),
          elevation: v.optional(elevation),
          floors_climbed: v.optional(v.number()),
          steps: v.optional(v.number()),
          swimming: v.optional(swimming),
        }),
      ),
    }),
  ),

  // ── energy_data ──────────────────────────────────────────────────────────
  energy_data: v.optional(
    v.object({
      energy_kilojoules: v.optional(v.number()),
      energy_planned_kilojoules: v.optional(v.number()),
    }),
  ),

  // ── heart_rate_data ──────────────────────────────────────────────────────
  heart_rate_data: v.optional(heartRateData),

  // ── lap_data ─────────────────────────────────────────────────────────────
  lap_data: v.optional(
    v.object({
      laps: v.optional(v.array(lapSample)),
    }),
  ),

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
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    end_time: v.string(),
    name: v.optional(v.string()),
    start_time: v.string(),
    state: v.optional(v.string()),
    summary_id: v.string(),
    timestamp_localization: v.optional(v.number()),
    type: v.number(), // ActivityType enum
    upload_type: v.number(), // UploadType enum
  }),

  // ── movement_data ────────────────────────────────────────────────────────
  movement_data: v.optional(
    v.object({
      adjusted_max_speed_meters_per_second: v.optional(v.number()),
      avg_cadence_rpm: v.optional(v.number()),
      avg_pace_minutes_per_kilometer: v.optional(v.number()),
      avg_speed_meters_per_second: v.optional(v.number()),
      avg_torque_newton_meters: v.optional(v.number()),
      avg_velocity_meters_per_second: v.optional(v.number()),
      cadence_samples: v.optional(v.array(cadenceSample)),
      max_cadence_rpm: v.optional(v.number()),
      max_pace_minutes_per_kilometer: v.optional(v.number()),
      max_speed_meters_per_second: v.optional(v.number()),
      max_torque_newton_meters: v.optional(v.number()),
      max_velocity_meters_per_second: v.optional(v.number()),
      normalized_speed_meters_per_second: v.optional(v.number()),
      speed_samples: v.optional(v.array(speedSample)),
      torque_samples: v.optional(v.array(torqueSample)),
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

  // ── polyline_map_data ────────────────────────────────────────────────────
  polyline_map_data: v.optional(
    v.object({
      summary_polyline: v.optional(v.string()),
    }),
  ),

  // ── position_data ────────────────────────────────────────────────────────
  position_data: v.optional(
    v.object({
      center_pos_lat_lng_deg: v.optional(v.array(v.number())),
      end_pos_lat_lng_deg: v.optional(v.array(v.number())),
      position_samples: v.optional(v.array(positionSample)),
      start_pos_lat_lng_deg: v.optional(v.array(v.number())),
    }),
  ),

  // ── power_data ───────────────────────────────────────────────────────────
  power_data: v.optional(
    v.object({
      avg_watts: v.optional(v.number()),
      max_watts: v.optional(v.number()),
      power_samples: v.optional(v.array(powerSample)),
    }),
  ),

  // ── strain_data ──────────────────────────────────────────────────────────
  strain_data: v.optional(
    v.object({
      strain_level: v.optional(v.number()),
    }),
  ),

  // ── TSS_data ─────────────────────────────────────────────────────────────
  TSS_data: v.optional(
    v.object({
      TSS_samples: v.optional(v.array(tssSample)),
    }),
  ),

  // ── work_data ────────────────────────────────────────────────────────────
  work_data: v.optional(
    v.object({
      work_kilojoules: v.optional(v.number()),
    }),
  ),
};
