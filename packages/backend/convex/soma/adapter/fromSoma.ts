/**
 * Soma → Cadence translators.
 *
 * Every function here converts a Soma validator shape
 * (`@nativesquare/soma/validators`) into a flat Cadence-side type.
 */

import type {
  SomaActivity,
  SomaBody,
  SomaDaily,
  SomaPlannedWorkout,
} from "@nativesquare/soma/validators";
import {
  type CadenceActivity,
  type CadenceDailyBiometrics,
  type CadencePlannedWorkoutInput,
  type CadencePlannedWorkoutStructureSegment,
  type WorkoutType,
  TERRA_ACTIVITY_TYPES,
} from "./types";

// =============================================================================
// Small helpers
// =============================================================================

function isoDateOnly(iso: string): string {
  return iso.split("T")[0];
}

function metersPerSecToPaceString(mps: number): string | undefined {
  if (!mps || mps <= 0) return undefined;
  const secPerKm = 1000 / mps;
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

// =============================================================================
// Workout type mapping (Terra numeric → Cadence enum)
// =============================================================================

export function workoutType(terraType: number | undefined): WorkoutType {
  if (terraType === undefined) return "unstructured";
  // Running defaults to "easy" — the inference engine refines the classification
  // (tempo / intervals / long_run) based on pace and duration.
  if (TERRA_ACTIVITY_TYPES.easy.includes(terraType)) return "easy";
  if (TERRA_ACTIVITY_TYPES.race.includes(terraType)) return "race";
  if (TERRA_ACTIVITY_TYPES.recovery.includes(terraType)) return "recovery";
  // Everything else (cycling, swimming, strength, unknown) → cross-training.
  return "cross_training";
}

// =============================================================================
// Activity
// =============================================================================

export function activity(
  soma: SomaActivity & { _id: string },
): CadenceActivity {
  const startTime = new Date(soma.metadata.start_time).getTime();
  const endTime = new Date(soma.metadata.end_time).getTime();
  const durationSeconds = Math.round((endTime - startTime) / 1000);

  let trainingLoad: number | undefined;
  if (soma.TSS_data?.TSS_samples?.length) {
    trainingLoad = soma.TSS_data.TSS_samples[0].actual;
  }

  return {
    id: soma._id,
    startTime,
    durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
    distanceMeters: soma.distance_data?.summary?.distance_meters,
    avgHeartRate: soma.heart_rate_data?.summary?.avg_hr_bpm,
    maxHeartRate: soma.heart_rate_data?.summary?.max_hr_bpm,
    trainingLoad,
    perceivedExertion: undefined,
    workoutType: workoutType(soma.metadata.type),
  };
}

// =============================================================================
// Daily biometrics (from SomaDaily)
// =============================================================================

export function daily(soma: SomaDaily): CadenceDailyBiometrics {
  return {
    date: isoDateOnly(soma.metadata.start_time),
    restingHeartRate: soma.heart_rate_data?.summary?.resting_hr_bpm,
    hrvMs: soma.heart_rate_data?.summary?.avg_hrv_rmssd,
    sleepScore: soma.scores?.sleep,
  };
}

// =============================================================================
// Daily biometrics (from SomaBody — weight + HR/HRV)
// =============================================================================

export function body(soma: SomaBody): Partial<CadenceDailyBiometrics> {
  let weight: number | undefined;
  if (soma.measurements_data?.measurements?.length) {
    weight = soma.measurements_data.measurements[0].weight_kg;
  }

  return {
    date: isoDateOnly(soma.metadata.start_time),
    weight,
    restingHeartRate: soma.heart_data?.heart_rate_data?.summary?.resting_hr_bpm,
    hrvMs: soma.heart_data?.heart_rate_data?.summary?.avg_hrv_rmssd,
  };
}

// =============================================================================
// Merge daily + body into a single CadenceDailyBiometrics
// =============================================================================

export function mergeDailyBiometrics(
  dailyData?: CadenceDailyBiometrics,
  bodyData?: Partial<CadenceDailyBiometrics>,
): CadenceDailyBiometrics | undefined {
  if (!dailyData && !bodyData) return undefined;
  if (!dailyData) return bodyData as CadenceDailyBiometrics;
  if (!bodyData) return dailyData;

  return {
    date: dailyData.date,
    // Body snapshots carry fresher biometrics than daily summaries.
    restingHeartRate: bodyData.restingHeartRate ?? dailyData.restingHeartRate,
    hrvMs: bodyData.hrvMs ?? dailyData.hrvMs,
    weight: bodyData.weight ?? dailyData.weight,
    sleepScore: dailyData.sleepScore,
  };
}

// =============================================================================
// Planned workout (Soma → Cadence input shape)
// =============================================================================

const INTENSITY_TO_SEGMENT: Record<string, string> = {
  WARMUP: "warmup",
  COOLDOWN: "cooldown",
  RECOVERY: "recovery",
  REST: "rest",
  ACTIVE: "main",
  INTERVAL: "work",
};

function segmentTypeFromIntensity(intensity: unknown): string {
  if (typeof intensity !== "string") return "main";
  return INTENSITY_TO_SEGMENT[intensity.toUpperCase()] ?? "main";
}

type SomaStep = NonNullable<SomaPlannedWorkout["steps"]>[number];

function segmentFromStep(
  step: SomaStep,
): CadencePlannedWorkoutStructureSegment | null {
  // REPEAT_STEP: unwrap to a single segment with repetitions + optional recovery.
  if (step.type === "REPEAT_STEP") {
    const repetitions = step.durations?.[0]?.reps;
    const nested = (step.steps ?? []) as SomaStep[];
    const workStep = nested.find((s) => s.intensity !== "RECOVERY") ?? nested[0];
    const recoveryStep = nested.find((s) => s.intensity === "RECOVERY");
    if (!workStep) return null;

    const base = segmentFromStep(workStep);
    if (!base) return null;

    return {
      ...base,
      segmentType: "work",
      repetitions,
      recoverySeconds: recoveryStep?.durations?.[0]?.seconds,
    };
  }

  const duration = step.durations?.[0];
  const target = step.targets?.[0];

  const targetPace = target?.speed_meters_per_second
    ? metersPerSecToPaceString(target.speed_meters_per_second)
    : undefined;

  const targetHeartRate =
    target?.hr_bpm_high && target.hr_bpm_low === target.hr_bpm_high
      ? target.hr_bpm_high
      : undefined;

  return {
    segmentType: segmentTypeFromIntensity(step.intensity),
    durationSeconds: duration?.seconds,
    distanceMeters: duration?.distance_meters,
    targetPace,
    targetHeartRate,
    notes: step.description,
  };
}

export function plannedWorkout(
  soma: SomaPlannedWorkout,
): CadencePlannedWorkoutInput {
  const steps = soma.steps ?? [];
  const structureSegments = steps
    .map(segmentFromStep)
    .filter((s): s is CadencePlannedWorkoutStructureSegment => s !== null);

  const plannedDate = soma.metadata.planned_date;
  // `planned_date` is YYYY-MM-DD; parse at UTC midnight to get a stable ms.
  const scheduledDate = plannedDate
    ? new Date(`${plannedDate}T00:00:00Z`).getTime()
    : 0;

  return {
    id: soma.metadata.id ?? "",
    scheduledDate,
    workoutTypeDisplay: soma.metadata.name ?? "Workout",
    description: soma.metadata.description,
    targetDurationSeconds: soma.metadata.estimated_duration_seconds,
    targetDistanceMeters: soma.metadata.estimated_distance_meters,
    structureSegments: structureSegments.length > 0 ? structureSegments : undefined,
  };
}
