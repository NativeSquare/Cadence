// ─── Soma → Garmin Training API V2 Transformer ─────────────────────────────
// Maps Soma's Terra-style planned workout model to the Garmin Training API V2
// JSON format for workout creation and scheduling.

import type {
  GarminWorkout,
  GarminWorkoutSegment,
  GarminWorkoutStep,
  GarminWorkoutRepeatStep,
  GarminWorkoutSport,
  GarminStepIntensity,
  GarminDurationType,
  GarminTargetType,
} from "./types.js";

// ─── Public API ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SomaPlannedWorkout = Record<string, any>;

/**
 * Transform a Soma planned workout document into a Garmin Training API V2
 * workout payload ready for `POST /workoutportal/workout/v2`.
 *
 * @param somaWorkout - The planned workout document from the Soma DB
 * @param providerName - Name shown to the user in Garmin Connect (20 chars max)
 */
export function transformPlannedWorkoutToGarmin(
  somaWorkout: SomaPlannedWorkout,
  providerName: string,
): GarminWorkout {
  const metadata = somaWorkout.metadata ?? {};
  const sport = mapSportType(metadata.type);
  const steps = transformSteps(somaWorkout.steps ?? []);

  const segment: GarminWorkoutSegment = {
    segmentOrder: 1,
    sport,
    poolLength: metadata.pool_length_meters ?? null,
    poolLengthUnit: metadata.pool_length_meters != null ? "METER" : null,
    estimatedDurationInSecs: null,
    estimatedDistanceInMeters: null,
    steps,
  };

  return {
    workoutName: metadata.name ?? "Workout",
    description: metadata.description ?? null,
    sport,
    estimatedDurationInSecs: null,
    estimatedDistanceInMeters: null,
    poolLength: metadata.pool_length_meters ?? null,
    poolLengthUnit: metadata.pool_length_meters != null ? "METER" : null,
    workoutProvider: providerName.slice(0, 20),
    workoutSourceId: providerName.slice(0, 20),
    isSessionTransitionEnabled: false,
    segments: [segment],
  };
}

// ─── Step Transformation ─────────────────────────────────────────────────────

function transformSteps(
  somaSteps: Array<Record<string, unknown>>,
): Array<GarminWorkoutStep | GarminWorkoutRepeatStep> {
  const result: Array<GarminWorkoutStep | GarminWorkoutRepeatStep> = [];
  let order = 1;

  for (const step of somaSteps) {
    const stepType = String(step.type ?? "STEP").toUpperCase();

    if (stepType === "REPEAT_STEP") {
      const nestedSteps = Array.isArray(step.steps) ? step.steps : [];
      const reps = extractRepeatCount(step);

      const repeatStep: GarminWorkoutRepeatStep = {
        type: "WorkoutRepeatStep",
        stepOrder: order++,
        repeatType: "REPEAT_UNTIL_STEPS_CMPLT",
        repeatValue: reps,
        steps: transformSteps(nestedSteps),
      };
      result.push(repeatStep);
    } else {
      const workoutStep = transformSingleStep(step, order++);
      result.push(workoutStep);
    }
  }

  return result;
}

function transformSingleStep(
  step: Record<string, unknown>,
  stepOrder: number,
): GarminWorkoutStep {
  const { durationType, durationValue, durationValueType } =
    extractDuration(step);
  const { targetType, targetValueLow, targetValueHigh, targetValueType } =
    extractTarget(step);

  return {
    type: "WorkoutStep",
    stepOrder,
    intensity: mapIntensity(step.intensity),
    description: (step.description as string) ?? null,
    durationType,
    durationValue,
    durationValueType,
    targetType,
    targetValue: null,
    targetValueLow,
    targetValueHigh,
    targetValueType,
    secondaryTargetType: null,
    secondaryTargetValue: null,
    secondaryTargetValueLow: null,
    secondaryTargetValueHigh: null,
    secondaryTargetValueType: null,
    strokeType: (step.stroke_type as string) ?? null,
    drillType: null,
    equipmentType: (step.equipment_type as string) ?? null,
    exerciseCategory: (step.exercise_category as string) ?? null,
    exerciseName: (step.exercise_name as string) ?? null,
    weightValue: (step.weight_kg as number) ?? null,
    weightDisplayUnit: step.weight_kg != null ? "KILOGRAM" : null,
  };
}

// ─── Duration Extraction ─────────────────────────────────────────────────────

interface DurationResult {
  durationType: GarminDurationType;
  durationValue: number | null;
  durationValueType: string | null;
}

function extractDuration(step: Record<string, unknown>): DurationResult {
  const durations = step.durations as Array<Record<string, unknown>> | undefined;
  if (!durations || durations.length === 0) {
    return { durationType: "OPEN", durationValue: null, durationValueType: null };
  }

  const dur = durations[0];
  const type = String(dur.duration_type ?? "OPEN").toUpperCase();

  switch (type) {
    case "TIME":
      return {
        durationType: "TIME",
        durationValue: (dur.seconds as number) ?? null,
        durationValueType: null,
      };
    case "DISTANCE_METERS":
    case "DISTANCE":
      return {
        durationType: "DISTANCE",
        durationValue: (dur.distance_meters as number) ?? null,
        durationValueType: null,
      };
    case "HR_LESS_THAN":
      return {
        durationType: "HR_LESS_THAN",
        durationValue: (dur.hr_below_bpm as number) ?? null,
        durationValueType: null,
      };
    case "HR_GREATER_THAN":
      return {
        durationType: "HR_GREATER_THAN",
        durationValue: (dur.hr_above_bpm as number) ?? null,
        durationValueType: null,
      };
    case "CALORIES":
      return {
        durationType: "CALORIES",
        durationValue: (dur.calories as number) ?? null,
        durationValueType: null,
      };
    case "POWER_LESS_THAN":
      return {
        durationType: "POWER_LESS_THAN",
        durationValue: (dur.power_below_watts as number) ?? null,
        durationValueType: null,
      };
    case "POWER_GREATER_THAN":
      return {
        durationType: "POWER_GREATER_THAN",
        durationValue: (dur.power_above_watts as number) ?? null,
        durationValueType: null,
      };
    case "REPS":
      return {
        durationType: "REPS",
        durationValue: (dur.reps as number) ?? null,
        durationValueType: null,
      };
    case "FIXED_REST":
      return {
        durationType: "FIXED_REST",
        durationValue: (dur.rest_seconds as number) ?? (dur.seconds as number) ?? null,
        durationValueType: null,
      };
    default:
      return { durationType: "OPEN", durationValue: null, durationValueType: null };
  }
}

// ─── Target Extraction ───────────────────────────────────────────────────────

interface TargetResult {
  targetType: GarminTargetType | null;
  targetValueLow: number | null;
  targetValueHigh: number | null;
  targetValueType: string | null;
}

function extractTarget(step: Record<string, unknown>): TargetResult {
  const targets = step.targets as Array<Record<string, unknown>> | undefined;
  if (!targets || targets.length === 0) {
    return { targetType: null, targetValueLow: null, targetValueHigh: null, targetValueType: null };
  }

  const target = targets[0];
  const type = String(target.target_type ?? "OPEN").toUpperCase();

  switch (type) {
    case "HEART_RATE":
      if (target.hr_percentage_low != null || target.hr_percentage_high != null) {
        return {
          targetType: "HEART_RATE",
          targetValueLow: (target.hr_percentage_low as number) ?? null,
          targetValueHigh: (target.hr_percentage_high as number) ?? null,
          targetValueType: "PERCENT",
        };
      }
      return {
        targetType: "HEART_RATE",
        targetValueLow: (target.hr_bpm_low as number) ?? null,
        targetValueHigh: (target.hr_bpm_high as number) ?? null,
        targetValueType: null,
      };

    case "SPEED":
    case "PACE":
      return {
        targetType: "SPEED",
        targetValueLow: (target.speed_meters_per_second as number) ?? null,
        targetValueHigh: (target.speed_meters_per_second as number) ?? null,
        targetValueType: null,
      };

    case "CADENCE":
      return {
        targetType: "CADENCE",
        targetValueLow: (target.cadence_low as number) ?? (target.cadence as number) ?? null,
        targetValueHigh: (target.cadence_high as number) ?? (target.cadence as number) ?? null,
        targetValueType: null,
      };

    case "POWER":
      if (target.power_percentage_low != null || target.power_percentage_high != null) {
        return {
          targetType: "POWER",
          targetValueLow: (target.power_percentage_low as number) ?? null,
          targetValueHigh: (target.power_percentage_high as number) ?? null,
          targetValueType: "PERCENT",
        };
      }
      return {
        targetType: "POWER",
        targetValueLow: (target.power_watt_low as number) ?? (target.power_watt as number) ?? null,
        targetValueHigh: (target.power_watt_high as number) ?? (target.power_watt as number) ?? null,
        targetValueType: null,
      };

    case "OPEN":
      return { targetType: "OPEN", targetValueLow: null, targetValueHigh: null, targetValueType: null };

    default:
      return { targetType: null, targetValueLow: null, targetValueHigh: null, targetValueType: null };
  }
}

// ─── Enum Mapping ────────────────────────────────────────────────────────────

const SPORT_MAP: Record<string, GarminWorkoutSport> = {
  RUNNING: "RUNNING",
  BIKING: "CYCLING",
  CYCLING: "CYCLING",
  SWIMMING: "LAP_SWIMMING",
  LAP_SWIMMING: "LAP_SWIMMING",
  STRENGTH_TRAINING: "STRENGTH_TRAINING",
  STRENGTH: "STRENGTH_TRAINING",
  CARDIO: "CARDIO_TRAINING",
  CARDIO_TRAINING: "CARDIO_TRAINING",
  YOGA: "YOGA",
  PILATES: "PILATES",
  MULTI_SPORT: "MULTI_SPORT",
  GENERIC: "GENERIC",
  HIIT: "CARDIO_TRAINING",
};

function mapSportType(type: string | undefined): GarminWorkoutSport {
  if (!type) return "RUNNING";
  return SPORT_MAP[type.toUpperCase()] ?? "GENERIC";
}

const INTENSITY_MAP: Record<string, GarminStepIntensity> = {
  REST: "REST",
  WARMUP: "WARMUP",
  WARM_UP: "WARMUP",
  COOLDOWN: "COOLDOWN",
  COOL_DOWN: "COOLDOWN",
  RECOVERY: "RECOVERY",
  ACTIVE: "ACTIVE",
  INTERVAL: "INTERVAL",
  MAIN: "MAIN",
};

function mapIntensity(value: unknown): GarminStepIntensity {
  if (value == null) return "ACTIVE";
  const str = String(value).toUpperCase();
  return INTENSITY_MAP[str] ?? "ACTIVE";
}

function extractRepeatCount(step: Record<string, unknown>): number {
  const durations = step.durations as Array<Record<string, unknown>> | undefined;
  if (durations && durations.length > 0) {
    const reps = durations[0].reps as number | undefined;
    if (reps != null) return reps;
  }
  return 1;
}
