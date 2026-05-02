/**
 * Cadence → Soma translators.
 *
 * Every function here converts a flat Cadence-side type into a Soma validator
 * shape (`@nativesquare/soma/validators`) ready to be passed to Soma ingest /
 * push methods.
 *
 * Several reverse directions (activity, daily, body) are lossy: Cadence only
 * holds the summary fields, so sample streams and position data are omitted.
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

function formatDateYYYYMMDD(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePaceToMinPerKm(pace: string): number | null {
  const cleaned = pace.replace(/\/km$/i, "").trim();
  const parts = cleaned.split(":");
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return minutes + seconds / 60;
}

function paceMinPerKmToMetersPerSec(paceMinPerKm: number): number {
  if (paceMinPerKm <= 0) return 0;
  return 1000 / (paceMinPerKm * 60);
}

// =============================================================================
// Workout type → Terra numeric
// =============================================================================

export function terraType(type: WorkoutType): number {
  return TERRA_ACTIVITY_TYPES[type][0];
}

// =============================================================================
// Planned workout (Cadence → Soma)
// =============================================================================

type SomaStep = NonNullable<SomaPlannedWorkout["steps"]>[number];
type SomaStepDuration = NonNullable<SomaStep["durations"]>[number];
type SomaStepTarget = NonNullable<SomaStep["targets"]>[number];

const SEGMENT_TO_INTENSITY: Record<string, string> = {
  warmup: "WARMUP",
  warm_up: "WARMUP",
  cooldown: "COOLDOWN",
  cool_down: "COOLDOWN",
  recovery: "RECOVERY",
  rest: "REST",
  main: "ACTIVE",
  work: "INTERVAL",
};

function mapIntensity(segmentType: string): string {
  return SEGMENT_TO_INTENSITY[segmentType.toLowerCase()] ?? "ACTIVE";
}

function buildDurations(
  segment: CadencePlannedWorkoutStructureSegment,
): SomaStepDuration[] {
  if (segment.durationSeconds != null) {
    return [{ duration_type: "TIME", seconds: segment.durationSeconds }];
  }
  if (segment.distanceMeters != null) {
    return [
      {
        duration_type: "DISTANCE_METERS",
        distance_meters: segment.distanceMeters,
      },
    ];
  }
  return [{ duration_type: "OPEN" }];
}

function buildTargets(
  segment: CadencePlannedWorkoutStructureSegment,
): SomaStepTarget[] | undefined {
  const targets: SomaStepTarget[] = [];

  if (segment.targetPace) {
    const paceMinPerKm = parsePaceToMinPerKm(segment.targetPace);
    if (paceMinPerKm) {
      targets.push({
        target_type: "SPEED",
        speed_meters_per_second: paceMinPerKmToMetersPerSec(paceMinPerKm),
      });
    }
  }

  if (segment.targetHeartRate != null) {
    targets.push({
      target_type: "HEART_RATE",
      hr_bpm_low: segment.targetHeartRate,
      hr_bpm_high: segment.targetHeartRate,
    });
  }

  return targets.length > 0 ? targets : undefined;
}

function transformSegment(
  segment: CadencePlannedWorkoutStructureSegment,
  order: number,
): SomaStep {
  if (segment.repetitions != null && segment.repetitions > 1) {
    const workStep: SomaStep = {
      type: "STEP",
      order: 1,
      intensity: "INTERVAL",
      durations: buildDurations(segment),
      targets: buildTargets(segment),
      description: segment.notes,
    };

    const nestedSteps: SomaStep[] = [workStep];

    if (segment.recoverySeconds != null) {
      nestedSteps.push({
        type: "STEP",
        order: 2,
        intensity: "RECOVERY",
        durations: [{ duration_type: "TIME", seconds: segment.recoverySeconds }],
      });
    }

    return {
      type: "REPEAT_STEP",
      order,
      durations: [{ reps: segment.repetitions }],
      steps: nestedSteps,
    };
  }

  return {
    type: "STEP",
    order,
    intensity: mapIntensity(segment.segmentType),
    durations: buildDurations(segment),
    targets: buildTargets(segment),
    description: segment.notes,
  };
}

function buildWorkoutLevelSteps(
  input: CadencePlannedWorkoutInput,
): SomaStep[] {
  const durations: SomaStepDuration[] = [];
  if (input.targetDurationSeconds != null) {
    durations.push({
      duration_type: "TIME",
      seconds: input.targetDurationSeconds,
    });
  } else if (input.targetDistanceMeters != null) {
    durations.push({
      duration_type: "DISTANCE_METERS",
      distance_meters: input.targetDistanceMeters,
    });
  } else {
    durations.push({ duration_type: "OPEN" });
  }

  const targets: SomaStepTarget[] = [];

  const paceStr = input.targetPaceMax ?? input.targetPaceMin;
  if (paceStr) {
    const paceMinPerKm = parsePaceToMinPerKm(paceStr);
    if (paceMinPerKm) {
      targets.push({
        target_type: "SPEED",
        speed_meters_per_second: paceMinPerKmToMetersPerSec(paceMinPerKm),
      });
    }
  }

  if (input.targetHeartRateMin != null || input.targetHeartRateMax != null) {
    targets.push({
      target_type: "HEART_RATE",
      hr_bpm_low: input.targetHeartRateMin,
      hr_bpm_high: input.targetHeartRateMax,
    });
  }

  return [
    {
      type: "STEP",
      order: 1,
      intensity: "ACTIVE",
      durations,
      targets: targets.length > 0 ? targets : undefined,
    },
  ];
}

export function plannedWorkout(
  input: CadencePlannedWorkoutInput,
): SomaPlannedWorkout {
  let steps: SomaStep[];

  if (input.structureSegments && input.structureSegments.length > 0) {
    steps = [];
    let order = 1;
    for (const segment of input.structureSegments) {
      steps.push(transformSegment(segment, order));
      order++;
    }
  } else {
    steps = buildWorkoutLevelSteps(input);
  }

  const metadata: SomaPlannedWorkout["metadata"] = {
    id: input.id,
    type: "RUNNING",
    name: input.workoutTypeDisplay,
    description: input.description,
    planned_date: formatDateYYYYMMDD(input.scheduledDate),
    estimated_duration_seconds: input.targetDurationSeconds,
    estimated_distance_meters: input.targetDistanceMeters,
    provider: "Cadence",
  };

  return { steps, metadata };
}

// =============================================================================
// Activity (lossy reverse — summary fields only)
// =============================================================================

export function activity(input: CadenceActivity): SomaActivity {
  const startIso = new Date(input.startTime).toISOString();
  const endIso = input.durationSeconds
    ? new Date(input.startTime + input.durationSeconds * 1000).toISOString()
    : startIso;

  return {
    metadata: {
      start_time: startIso,
      end_time: endIso,
      type: input.workoutType ? terraType(input.workoutType) : 0,
      summary_id: input.id,
      upload_type: 0,
    },
    heart_rate_data:
      input.avgHeartRate != null || input.maxHeartRate != null
        ? {
            summary: {
              avg_hr_bpm: input.avgHeartRate,
              max_hr_bpm: input.maxHeartRate,
            },
          }
        : undefined,
    distance_data:
      input.distanceMeters != null
        ? { summary: { distance_meters: input.distanceMeters } }
        : undefined,
    TSS_data:
      input.trainingLoad != null
        ? { TSS_samples: [{ actual: input.trainingLoad }] }
        : undefined,
  } as SomaActivity;
}

// =============================================================================
// Daily biometrics (lossy reverse)
// =============================================================================

export function daily(input: CadenceDailyBiometrics): SomaDaily {
  const startIso = `${input.date}T00:00:00.000Z`;

  const heart_rate_data: SomaDaily["heart_rate_data"] =
    input.restingHeartRate != null || input.hrvMs != null
      ? {
          summary: {
            resting_hr_bpm: input.restingHeartRate,
            avg_hrv_rmssd: input.hrvMs,
          },
        }
      : undefined;

  const scores: SomaDaily["scores"] =
    input.sleepScore != null ? { sleep: input.sleepScore } : undefined;

  return {
    metadata: { start_time: startIso, end_time: startIso },
    heart_rate_data,
    scores,
  } as SomaDaily;
}

export function body(input: CadenceDailyBiometrics): SomaBody {
  const startIso = `${input.date}T00:00:00.000Z`;

  const measurements_data: SomaBody["measurements_data"] =
    input.weight != null
      ? { measurements: [{ weight_kg: input.weight }] }
      : undefined;

  const heart_data: SomaBody["heart_data"] =
    input.restingHeartRate != null || input.hrvMs != null
      ? {
          heart_rate_data: {
            summary: {
              resting_hr_bpm: input.restingHeartRate,
              avg_hrv_rmssd: input.hrvMs,
            },
          },
        }
      : undefined;

  return {
    metadata: { start_time: startIso, end_time: startIso },
    measurements_data,
    heart_data,
  } as SomaBody;
}
