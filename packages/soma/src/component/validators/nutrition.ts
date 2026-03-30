import { v } from "convex/values";
import { drinkSample, meal } from "./samples.js";
import { macros, micros } from "./shared.js";

// ─── Nutrition ───────────────────────────────────────────────────────────────
// Micronutrients, macronutrients, and foods consumed.
// Maps 1:1 to Terra's Nutrition data model.
// Uniquely identified by metadata.start_time + metadata.end_time.
export const nutritionValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),

  // ── drink_samples ────────────────────────────────────────────────────────
  drink_samples: v.optional(v.array(drinkSample)),

  // ── meals ────────────────────────────────────────────────────────────────
  meals: v.optional(v.array(meal)),

  // ── metadata ─────────────────────────────────────────────────────────────
  metadata: v.object({
    end_time: v.string(),
    start_time: v.string(),
    timestamp_localization: v.optional(v.number()),
  }),

  // ── summary ──────────────────────────────────────────────────────────────
  summary: v.optional(
    v.object({
      macros: v.optional(macros),
      micros: v.optional(micros),
      water_ml: v.optional(v.number()),
      drink_ml: v.optional(v.number()),
    }),
  ),
};
