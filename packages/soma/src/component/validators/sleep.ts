import { v } from "convex/values";
import {
  sleepHypnogramSample,
  breathSample,
  oxygenSaturationSample,
  snoringSample,
} from "./samples.js";
import { deviceData, heartRateData, dataContributor } from "./shared.js";

// ─── Sleep ───────────────────────────────────────────────────────────────────
// Data from sleep sessions.
// Maps 1:1 to Terra's Sleep data model.
// Uniquely identified by metadata.summary_id.
export const sleepValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),

  // ── data_enrichment ──────────────────────────────────────────────────────
  data_enrichment: v.optional(
    v.object({
      sleep_contributors: v.optional(v.array(dataContributor)),
      sleep_score: v.optional(v.number()),
    }),
  ),

  // ── device_data ──────────────────────────────────────────────────────────
  device_data: v.optional(deviceData),

  // ── heart_rate_data ──────────────────────────────────────────────────────
  heart_rate_data: v.optional(heartRateData),

  // ── metadata ─────────────────────────────────────────────────────────────
  metadata: v.object({
    end_time: v.string(),
    start_time: v.string(),
    is_nap: v.optional(v.boolean()),
    summary_id: v.optional(v.string()),
    timestamp_localization: v.optional(v.number()),
    upload_type: v.number(), // SleepUploadType enum
  }),

  // ── readiness_data ───────────────────────────────────────────────────────
  readiness_data: v.optional(
    v.object({
      readiness: v.optional(v.number()),
      recovery_level: v.optional(v.number()), // RecoveryLevel enum
    }),
  ),

  // ── respiration_data ─────────────────────────────────────────────────────
  respiration_data: v.optional(
    v.object({
      breaths_data: v.optional(
        v.object({
          avg_breaths_per_min: v.optional(v.number()),
          end_time: v.optional(v.string()),
          max_breaths_per_min: v.optional(v.number()),
          min_breaths_per_min: v.optional(v.number()),
          on_demand_reading: v.optional(v.boolean()),
          samples: v.optional(v.array(breathSample)),
          start_time: v.optional(v.string()),
        }),
      ),
      oxygen_saturation_data: v.optional(
        v.object({
          avg_saturation_percentage: v.optional(v.number()),
          end_time: v.optional(v.string()),
          samples: v.optional(v.array(oxygenSaturationSample)),
          start_time: v.optional(v.string()),
        }),
      ),
      snoring_data: v.optional(
        v.object({
          end_time: v.optional(v.string()),
          num_snoring_events: v.optional(v.number()),
          samples: v.optional(v.array(snoringSample)),
          start_time: v.optional(v.string()),
          total_snoring_duration_seconds: v.optional(v.number()),
        }),
      ),
    }),
  ),

  // ── scores ───────────────────────────────────────────────────────────────
  scores: v.optional(
    v.object({
      sleep: v.optional(v.number()),
    }),
  ),

  // ── sleep_durations_data ─────────────────────────────────────────────────
  sleep_durations_data: v.optional(
    v.object({
      asleep: v.optional(
        v.object({
          duration_asleep_state_seconds: v.optional(v.number()),
          duration_deep_sleep_state_seconds: v.optional(v.number()),
          duration_light_sleep_state_seconds: v.optional(v.number()),
          duration_REM_sleep_state_seconds: v.optional(v.number()),
          num_REM_events: v.optional(v.number()),
        }),
      ),
      awake: v.optional(
        v.object({
          duration_awake_state_seconds: v.optional(v.number()),
          duration_long_interruption_seconds: v.optional(v.number()),
          duration_short_interruption_seconds: v.optional(v.number()),
          num_out_of_bed_events: v.optional(v.number()),
          num_wakeup_events: v.optional(v.number()),
          sleep_latency_seconds: v.optional(v.number()),
          wake_up_latency_seconds: v.optional(v.number()),
        }),
      ),
      hypnogram_samples: v.optional(v.array(sleepHypnogramSample)),
      other: v.optional(
        v.object({
          duration_in_bed_seconds: v.optional(v.number()),
          duration_unmeasurable_sleep_seconds: v.optional(v.number()),
        }),
      ),
      sleep_efficiency: v.optional(v.number()),
    }),
  ),

  // ── temperature_data ─────────────────────────────────────────────────────
  temperature_data: v.optional(
    v.object({
      delta: v.optional(v.number()),
    }),
  ),
};
