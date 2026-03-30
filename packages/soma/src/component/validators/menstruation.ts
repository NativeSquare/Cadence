import { v } from "convex/values";
import { menstruationFlowSample } from "./samples.js";

// ─── Menstruation ────────────────────────────────────────────────────────────
// Menstruation cycle and fertility data.
// Maps 1:1 to Terra's Menstruation data model.
export const menstruationValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),

  // ── metadata ─────────────────────────────────────────────────────────────
  metadata: v.object({
    end_time: v.string(),
    start_time: v.string(),
    timestamp_localization: v.optional(v.number()),
  }),

  // ── menstruation_data ────────────────────────────────────────────────────
  menstruation_data: v.optional(
    v.object({
      menstruation_flow: v.optional(v.array(menstruationFlowSample)),
      period_length_days: v.optional(v.number()),
      predicted_cycle_length_days: v.optional(v.number()),
      last_updated_time: v.optional(v.string()),
      day_in_cycle: v.optional(v.number()),
      length_of_current_phase_days: v.optional(v.number()),
      period_start_date: v.optional(v.string()),
      cycle_length_days: v.optional(v.string()),
      current_phase: v.optional(v.string()), // MenstrualPhase string enum
      is_predicted_cycle: v.optional(v.string()),
      days_until_next_phase: v.optional(v.number()),
    }),
  ),
};
