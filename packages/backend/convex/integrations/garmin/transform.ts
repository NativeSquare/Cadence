/**
 * Planned Session → Soma Planned Workout transformer
 *
 * Converts Cadence's plannedSessions schema to Soma's Terra-based
 * planned workout format for export to Garmin Connect via Soma's
 * pushPlannedWorkoutToGarmin action.
 */

import type { Doc } from "../../_generated/dataModel";

type PlannedSessionDoc = Doc<"plannedSessions">;

// ─── Soma Step Types ─────────────────────────────────────────────────────────

interface SomaStepDuration {
  duration_type?: string;
  seconds?: number;
  distance_meters?: number;
  reps?: number;
}

interface SomaStepTarget {
  target_type?: string;
  speed_meters_per_second?: number;
  hr_bpm_high?: number;
  hr_bpm_low?: number;
}

interface SomaStep {
  name?: string;
  description?: string;
  order?: number;
  intensity?: string;
  durations?: SomaStepDuration[];
  type?: string;
  targets?: SomaStepTarget[];
  steps?: SomaStep[];
}

interface SomaWorkoutMetadata {
  id?: string;
  type?: string;
  name?: string;
  description?: string;
  planned_date?: string;
  estimated_duration_seconds?: number;
  estimated_distance_meters?: number;
  provider?: string;
}

export interface SomaPlannedWorkoutData {
  steps: SomaStep[];
  metadata: SomaWorkoutMetadata;
}

// ─── Intensity Mapping ───────────────────────────────────────────────────────

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

// ─── Pace Parsing ────────────────────────────────────────────────────────────

/**
 * Parse "M:SS/km" or "M:SS" to minutes per kilometer.
 */
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

// ─── Step Builders ───────────────────────────────────────────────────────────

interface StructureSegment {
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

function buildDurations(segment: StructureSegment): SomaStepDuration[] {
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

function buildTargets(segment: StructureSegment): SomaStepTarget[] | undefined {
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

/**
 * Transform a single segment into one or more Soma steps.
 *
 * Intervals with repetitions produce a REPEAT_STEP containing
 * a work step and an optional recovery step.
 */
function transformSegment(segment: StructureSegment, order: number): SomaStep {
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

/**
 * When no structureSegments exist, build a single step from session-level targets.
 */
function buildSessionLevelSteps(session: PlannedSessionDoc): SomaStep[] {
  const durations: SomaStepDuration[] = [];
  if (session.targetDurationSeconds != null) {
    durations.push({
      duration_type: "TIME",
      seconds: session.targetDurationSeconds,
    });
  } else if (session.targetDistanceMeters != null) {
    durations.push({
      duration_type: "DISTANCE_METERS",
      distance_meters: session.targetDistanceMeters,
    });
  } else {
    durations.push({ duration_type: "OPEN" });
  }

  const targets: SomaStepTarget[] = [];

  const paceStr = session.targetPaceMax ?? session.targetPaceMin;
  if (paceStr) {
    const paceMinPerKm = parsePaceToMinPerKm(paceStr);
    if (paceMinPerKm) {
      targets.push({
        target_type: "SPEED",
        speed_meters_per_second: paceMinPerKmToMetersPerSec(paceMinPerKm),
      });
    }
  }

  if (session.targetHeartRateMin != null || session.targetHeartRateMax != null) {
    targets.push({
      target_type: "HEART_RATE",
      hr_bpm_low: session.targetHeartRateMin,
      hr_bpm_high: session.targetHeartRateMax,
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

// ─── Date Formatting ─────────────────────────────────────────────────────────

function formatDateToYYYYMMDD(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Transform a Cadence planned session into Soma's planned workout format.
 *
 * The returned object can be passed directly to `soma.ingestPlannedWorkout()`
 * (alongside connectionId and userId) and then pushed to Garmin via
 * `soma.pushPlannedWorkoutToGarmin()`.
 */
export function transformSessionToSomaWorkout(
  session: PlannedSessionDoc,
): SomaPlannedWorkoutData {
  let steps: SomaStep[];

  if (session.structureSegments && session.structureSegments.length > 0) {
    steps = [];
    let order = 1;
    for (const segment of session.structureSegments) {
      steps.push(transformSegment(segment as StructureSegment, order));
      order++;
    }
  } else {
    steps = buildSessionLevelSteps(session);
  }

  const metadata: SomaWorkoutMetadata = {
    id: session._id,
    type: "RUNNING",
    name: session.sessionTypeDisplay,
    description: session.description,
    planned_date: formatDateToYYYYMMDD(session.scheduledDate),
    estimated_duration_seconds: session.targetDurationSeconds,
    estimated_distance_meters: session.targetDistanceMeters,
    provider: "Cadence",
  };

  return { steps, metadata };
}
