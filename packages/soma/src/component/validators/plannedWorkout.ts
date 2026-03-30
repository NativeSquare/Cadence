import { v } from "convex/values";

// ─── PlannedWorkoutStepTarget ────────────────────────────────────────────────
const plannedWorkoutStepTarget = v.object({
  target_type: v.optional(v.string()), // string enum: SPEED, HEART_RATE, OPEN, CADENCE, POWER, etc.
  // Speed targets
  speed_meters_per_second: v.optional(v.number()),
  // Heart rate targets
  hr_bpm_high: v.optional(v.number()),
  hr_bpm_low: v.optional(v.number()),
  // Cadence targets
  cadence: v.optional(v.number()),
  cadence_high: v.optional(v.number()),
  cadence_low: v.optional(v.number()),
  // Power targets
  power_watt_high: v.optional(v.number()),
  power_watt_low: v.optional(v.number()),
  power_watt: v.optional(v.number()),
  // Swim stroke targets
  swim_strokes: v.optional(v.number()),
  // HR percentage targets
  hr_percentage: v.optional(v.number()),
  hr_percentage_low: v.optional(v.number()),
  hr_percentage_high: v.optional(v.number()),
  // Speed percentage targets
  speed_percentage: v.optional(v.number()),
  speed_percentage_low: v.optional(v.number()),
  speed_percentage_high: v.optional(v.number()),
  // Power percentage targets
  power_percentage: v.optional(v.number()),
  power_percentage_low: v.optional(v.number()),
  power_percentage_high: v.optional(v.number()),
  // Repetition targets
  repetitions: v.optional(v.number()),
  // Pace targets
  pace_minutes_per_kilometer: v.optional(v.number()),
  // TSS targets
  tss: v.optional(v.number()),
  // IF targets
  if_high: v.optional(v.number()),
  if_low: v.optional(v.number()),
});

// ─── PlannedWorkoutStepDuration ──────────────────────────────────────────────
const plannedWorkoutStepDuration = v.object({
  duration_type: v.optional(v.string()), // string enum: TIME, DISTANCE_METERS, HR_LESS_THAN, etc.
  seconds: v.optional(v.number()),
  distance_meters: v.optional(v.number()),
  hr_below_bpm: v.optional(v.number()),
  hr_above_bpm: v.optional(v.number()),
  calories: v.optional(v.number()),
  power_below_watts: v.optional(v.number()),
  power_above_watts: v.optional(v.number()),
  reps: v.optional(v.number()),
  rest_seconds: v.optional(v.number()),
  steps: v.optional(v.number()),
});

// ─── PlannedWorkoutStep ──────────────────────────────────────────────────────
const plannedWorkoutStep = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  order: v.optional(v.number()),
  intensity: v.optional(v.union(v.string(), v.number())), // string enum on base step, integer on specialized steps
  durations: v.optional(v.array(plannedWorkoutStepDuration)),
  type: v.optional(v.string()), // string enum: STEP, REPEAT_STEP
  targets: v.optional(v.array(plannedWorkoutStepTarget)),
  stroke_type: v.optional(v.string()), // string enum: OTHER, FREESTYLE, BACKSTROKE, BREASTSTROKE, BUTTERFLY, REST
  equipment_type: v.optional(v.string()), // string enum: NONE, SWIM_FINS, SWIM_KICKBOARD, etc.
  exercise_category: v.optional(v.string()), // string enum: UNKNOWN, BENCH_PRESS, CALF_RAISE, etc.
  exercise_name: v.optional(v.string()),
  weight_kg: v.optional(v.number()),
  // For repeat steps (type=REPEAT_STEP), nested steps
  steps: v.optional(v.array(v.any())),
});

// ─── PlannedWorkout ──────────────────────────────────────────────────────────
// Planned/scheduled workouts from the provider.
// Maps 1:1 to Terra's PlannedWorkout data model.
export const plannedWorkoutValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),

  // ── steps ────────────────────────────────────────────────────────────────
  steps: v.optional(v.array(plannedWorkoutStep)),

  // ── metadata ─────────────────────────────────────────────────────────────
  metadata: v.object({
    id: v.optional(v.string()),
    estimated_if: v.optional(v.number()),
    provider: v.optional(v.string()),
    estimated_distance_meters: v.optional(v.number()),
    estimated_elevation_gain_meters: v.optional(v.number()),
    estimated_energy_kj: v.optional(v.number()),
    estimated_speed_meters_per_second: v.optional(v.number()),
    estimated_pace_minutes_per_kilometer: v.optional(v.number()),
    planned_date: v.optional(v.string()),
    created_date: v.optional(v.string()),
    estimated_tss: v.optional(v.number()),
    estimated_tscore: v.optional(v.number()),
    type: v.optional(v.string()), // string enum: RUNNING, BIKING, SWIMMING, etc.
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    pool_length_meters: v.optional(v.number()),
    estimated_calories: v.optional(v.number()),
    estimated_duration_seconds: v.optional(v.number()),
    // Provider-assigned workout ID (e.g. Garmin workoutId after push)
    provider_workout_id: v.optional(v.string()),
    // Provider-assigned schedule ID (e.g. Garmin scheduleId after push)
    provider_schedule_id: v.optional(v.string()),
  }),
};
