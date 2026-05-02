/**
 * Cadence-side domain types for data sourced from or exported to Soma.
 *
 * These flat shapes are what the rest of the Cadence codebase works with —
 * the adapter (`fromSoma` / `toSoma`) is the only place Soma's Terra-based
 * nested schema is touched.
 */

// =============================================================================
// Workout classification
// =============================================================================

export type WorkoutType =
  | "easy"
  | "tempo"
  | "intervals"
  | "long_run"
  | "recovery"
  | "race"
  | "cross_training"
  | "unstructured";

// =============================================================================
// Activity (completed workout)
// =============================================================================

export interface CadenceActivity {
  /** Soma activity ID for back-reference */
  id: string;
  /** Unix timestamp ms */
  startTime: number;
  /** Duration in seconds */
  durationSeconds?: number;
  /** Distance in meters */
  distanceMeters?: number;
  /** Average heart rate BPM */
  avgHeartRate?: number;
  /** Max heart rate BPM */
  maxHeartRate?: number;
  /** Training stress score (TSS) */
  trainingLoad?: number;
  /** Perceived exertion 1-10 */
  perceivedExertion?: number;
  /** Workout classification */
  workoutType?: WorkoutType;
}

// =============================================================================
// Daily biometrics (combines Soma daily + body)
// =============================================================================

export interface CadenceDailyBiometrics {
  /** Date string YYYY-MM-DD */
  date: string;
  /** Resting heart rate BPM */
  restingHeartRate?: number;
  /** HRV in milliseconds (RMSSD) */
  hrvMs?: number;
  /** Weight in kg */
  weight?: number;
  /** Sleep score 0-100 */
  sleepScore?: number;
}

// =============================================================================
// Planned workout (input to `toSoma.plannedWorkout`)
// =============================================================================

export interface CadencePlannedWorkoutStructureSegment {
  segmentType: string;
  durationSeconds?: number;
  distanceMeters?: number;
  targetPace?: string;
  targetHeartRate?: number;
  targetEffort?: number;
  repetitions?: number;
  recoverySeconds?: number;
  notes?: string;
}

export interface CadencePlannedWorkoutInput {
  /** Stable identifier round-tripped into SomaPlannedWorkout.metadata.id */
  id: string;
  /** Unix timestamp ms */
  scheduledDate: number;
  workoutTypeDisplay: string;
  description?: string;
  targetDurationSeconds?: number;
  targetDistanceMeters?: number;
  targetPaceMin?: string;
  targetPaceMax?: string;
  targetHeartRateMin?: number;
  targetHeartRateMax?: number;
  structureSegments?: CadencePlannedWorkoutStructureSegment[];
}

// =============================================================================
// Terra activity type map (bi-directional)
// =============================================================================

/**
 * Canonical Terra activity type ids per WorkoutType.
 * The first entry is the "preferred" id used when converting WorkoutType → Terra.
 * Reverse direction checks any entry in the array.
 *
 * https://docs.tryterra.co/reference/enums#activity-types
 */
export const TERRA_ACTIVITY_TYPES: Record<WorkoutType, number[]> = {
  easy: [8],
  tempo: [8],
  intervals: [8],
  long_run: [8],
  race: [97, 98],
  recovery: [7, 35],
  cross_training: [1],
  unstructured: [0],
};
