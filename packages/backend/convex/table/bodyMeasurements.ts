import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Body Measurements Table Schema
// =============================================================================
// Terra-aligned body measurement data model for tracking physical metrics.
// Supports: HealthKit, smart scales, manual entry, Terra API
//
// Reference: data-model-comprehensive.md#Table-bodyMeasurements

export const bodyMeasurements = defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Terra-aligned metadata
  externalId: v.optional(v.string()), // Provider's unique ID
  source: v.string(), // "healthkit" | "garmin" | "withings" | "manual" | "terra"

  // Timestamp
  timestamp: v.number(), // Unix timestamp ms when measurement was taken
  date: v.string(), // "2026-02-16" for easy daily queries

  // Measurement type (for querying specific types)
  measurementType: v.union(
    v.literal("weight"),
    v.literal("body_composition"),
    v.literal("blood_pressure"),
    v.literal("glucose"),
    v.literal("temperature"),
    v.literal("comprehensive") // Multiple metrics in one reading
  ),

  // Weight & Body Composition
  weight: v.optional(v.number()), // kg
  bodyFatPercent: v.optional(v.number()),
  muscleMass: v.optional(v.number()), // kg
  boneMass: v.optional(v.number()), // kg
  waterPercent: v.optional(v.number()), // Body water percentage
  visceralFat: v.optional(v.number()), // Rating or percentage
  bmi: v.optional(v.number()), // Body mass index
  metabolicAge: v.optional(v.number()), // Years

  // Blood Pressure
  systolicBp: v.optional(v.number()), // mmHg
  diastolicBp: v.optional(v.number()), // mmHg
  pulseRate: v.optional(v.number()), // BPM during measurement

  // Blood Glucose
  bloodGlucose: v.optional(v.number()), // mg/dL or mmol/L
  glucoseUnit: v.optional(
    v.union(v.literal("mg/dL"), v.literal("mmol/L"))
  ),
  glucoseContext: v.optional(
    v.union(
      v.literal("fasting"),
      v.literal("before_meal"),
      v.literal("after_meal"),
      v.literal("random")
    )
  ),

  // Temperature
  temperature: v.optional(v.number()), // Celsius
  temperatureLocation: v.optional(
    v.union(
      v.literal("oral"),
      v.literal("ear"),
      v.literal("forehead"),
      v.literal("armpit"),
      v.literal("wrist")
    )
  ),

  // Blood Oxygen
  bloodOxygen: v.optional(v.number()), // SpO2 percent

  // Additional metrics
  waistCircumference: v.optional(v.number()), // cm
  hipCircumference: v.optional(v.number()), // cm
  chestCircumference: v.optional(v.number()), // cm

  // User notes
  notes: v.optional(v.string()),
  context: v.optional(v.string()), // "morning", "post-workout", etc.

  // Metadata
  rawPayload: v.optional(v.string()), // Original API response
  importedAt: v.number(),
  lastSyncedAt: v.number(),
})
  .index("by_runnerId", ["runnerId"])
  .index("by_userId", ["userId"])
  .index("by_timestamp", ["runnerId", "timestamp"])
  .index("by_date", ["runnerId", "date"])
  .index("by_type", ["runnerId", "measurementType"])
  .index("by_source", ["runnerId", "source"])
  .index("by_externalId", ["source", "externalId"]);
