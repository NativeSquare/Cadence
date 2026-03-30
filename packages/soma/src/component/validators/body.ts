import { v } from "convex/values";
import {
  bloodPressureSample,
  afibClassificationSample,
  ecgReading,
  pulseVelocitySample,
  rrInterval,
  ketoneSample,
  measurementDataSample,
  temperatureSample,
  glucoseDataSample,
  dailyPatternSample,
  oxygenSaturationSample,
  vo2MaxSample,
  hydrationMeasurementSample,
} from "./samples.js";
import { deviceData, heartRateData } from "./shared.js";

// ─── Body ────────────────────────────────────────────────────────────────────
// Body metrics for a given time period.
// Maps 1:1 to Terra's Body data model.
// Uniquely identified by metadata.start_time + metadata.end_time.
export const bodyValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),

  // ── blood_pressure_data ──────────────────────────────────────────────────
  blood_pressure_data: v.optional(
    v.object({
      blood_pressure_samples: v.optional(v.array(bloodPressureSample)),
    }),
  ),

  // ── device_data ──────────────────────────────────────────────────────────
  device_data: v.optional(deviceData),

  // ── heart_data ───────────────────────────────────────────────────────────
  heart_data: v.optional(
    v.object({
      afib_classification_samples: v.optional(
        v.array(afibClassificationSample),
      ),
      ecg_signal: v.optional(v.array(ecgReading)),
      heart_rate_data: v.optional(heartRateData),
      pulse_wave_velocity_samples: v.optional(v.array(pulseVelocitySample)),
      rr_interval_samples: v.optional(v.array(rrInterval)),
    }),
  ),

  // ── hydration_data ───────────────────────────────────────────────────────
  hydration_data: v.optional(
    v.object({
      day_total_water_consumption_ml: v.optional(v.number()),
      hydration_amount_samples: v.optional(
        v.array(hydrationMeasurementSample),
      ),
    }),
  ),

  // ── ketone_data ──────────────────────────────────────────────────────────
  ketone_data: v.optional(
    v.object({
      ketone_samples: v.optional(v.array(ketoneSample)),
    }),
  ),

  // ── measurements_data ────────────────────────────────────────────────────
  measurements_data: v.optional(
    v.object({
      measurements: v.optional(v.array(measurementDataSample)),
    }),
  ),

  // ── metadata ─────────────────────────────────────────────────────────────
  metadata: v.object({
    start_time: v.string(),
    end_time: v.string(),
    timestamp_localization: v.optional(v.number()),
  }),

  // ── oxygen_data ──────────────────────────────────────────────────────────
  oxygen_data: v.optional(
    v.object({
      avg_saturation_percentage: v.optional(v.number()),
      saturation_samples: v.optional(v.array(oxygenSaturationSample)),
      vo2_samples: v.optional(v.array(vo2MaxSample)),
      vo2max_ml_per_min_per_kg: v.optional(v.number()),
    }),
  ),

  // ── temperature_data ─────────────────────────────────────────────────────
  temperature_data: v.optional(
    v.object({
      ambient_temperature_samples: v.optional(v.array(temperatureSample)),
      body_temperature_samples: v.optional(v.array(temperatureSample)),
      skin_temperature_samples: v.optional(v.array(temperatureSample)),
    }),
  ),

  // ── glucose_data ─────────────────────────────────────────────────────────
  glucose_data: v.optional(
    v.object({
      blood_glucose_samples: v.optional(v.array(glucoseDataSample)),
      detailed_blood_glucose_samples: v.optional(v.array(glucoseDataSample)),
      daily_patterns: v.optional(v.array(dailyPatternSample)),
      sensor_usage: v.optional(v.number()),
      day_avg_blood_glucose_mg_per_dL: v.optional(v.number()),
      time_in_range: v.optional(v.number()),
      gmi: v.optional(v.number()),
    }),
  ),
};
