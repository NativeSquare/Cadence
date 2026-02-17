/**
 * Soma-to-Inference Type Adapter (Story 4.6)
 *
 * Transforms Terra schema data from Soma component into flat inference format.
 * The inference engine uses simplified flat types for calculations.
 *
 * Reference: Terra data model https://docs.tryterra.co/reference/data-models
 */

// =============================================================================
// Inference Engine Types (flat format for calculations)
// =============================================================================

/**
 * Session types for running activities.
 * Used by inference engine for intensity calculations.
 */
export type SessionType =
  | "easy"
  | "tempo"
  | "intervals"
  | "long_run"
  | "recovery"
  | "race"
  | "cross_training"
  | "unstructured";

/**
 * Flat activity format optimized for inference calculations.
 * Transformed from Terra nested schema.
 */
export interface InferenceActivity {
  /** Soma activity ID (string) for reference */
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
  /** Session classification */
  sessionType?: SessionType;
}

/**
 * Flat daily summary format for biometrics.
 * Combines data from Soma daily and body endpoints.
 */
export interface InferenceDaily {
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
// Terra Activity Type Mapping
// =============================================================================

/**
 * Terra activity type enum values.
 * https://docs.tryterra.co/reference/enums#activity-types
 */
const TERRA_RUNNING_TYPES = [1, 4, 56]; // Running, TrailRun, VirtualRun
const TERRA_WALKING_TYPES = [2, 3]; // Walking, Hiking
const TERRA_CYCLING_TYPES = [5, 6]; // Cycling, VirtualCycling
const TERRA_RACE_TYPES = [97, 98]; // Race events

/**
 * Map Terra numeric activity type to SessionType.
 * Conservative default - returns "unstructured" for unknown types.
 */
export function mapActivityType(terraType: number | undefined): SessionType {
  if (terraType === undefined) return "unstructured";

  if (TERRA_RUNNING_TYPES.includes(terraType)) {
    // All running defaults to "easy" - inference engine will adjust based on intensity
    return "easy";
  }

  if (TERRA_WALKING_TYPES.includes(terraType)) {
    return "recovery";
  }

  if (TERRA_CYCLING_TYPES.includes(terraType)) {
    return "cross_training";
  }

  if (TERRA_RACE_TYPES.includes(terraType)) {
    return "race";
  }

  // Swimming, strength, yoga, etc.
  return "cross_training";
}

// =============================================================================
// Soma Activity Transform
// =============================================================================

/**
 * Terra/Soma activity structure (partial - only fields we use).
 * Full schema: https://docs.tryterra.co/reference/activity-model
 */
export interface SomaActivity {
  _id: string;
  metadata: {
    start_time: string; // ISO-8601
    end_time: string; // ISO-8601
    type?: number; // Terra activity type enum
    name?: string;
  };
  distance_data?: {
    summary?: {
      distance_meters?: number;
      steps?: number;
      elevation?: {
        gain_actual_meters?: number;
      };
    };
  };
  heart_rate_data?: {
    summary?: {
      avg_hr_bpm?: number;
      max_hr_bpm?: number;
      min_hr_bpm?: number;
      resting_hr_bpm?: number;
    };
  };
  calories_data?: {
    total_burned_calories?: number;
  };
  TSS_data?: {
    TSS_samples?: Array<{
      actual?: number;
      method?: string;
    }>;
  };
  movement_data?: {
    avg_cadence_rpm?: number;
    avg_pace_minutes_per_kilometer?: number;
    avg_speed_meters_per_second?: number;
  };
}

/**
 * Transform Soma/Terra activity to flat InferenceActivity.
 * Handles missing/optional fields gracefully.
 */
export function transformSomaActivity(soma: SomaActivity): InferenceActivity {
  // Parse ISO times to Unix ms
  const startTime = new Date(soma.metadata.start_time).getTime();
  const endTime = new Date(soma.metadata.end_time).getTime();
  const durationSeconds = Math.round((endTime - startTime) / 1000);

  // Extract TSS if available
  let trainingLoad: number | undefined;
  if (soma.TSS_data?.TSS_samples?.length) {
    const tss = soma.TSS_data.TSS_samples[0];
    trainingLoad = tss.actual;
  }

  return {
    id: soma._id,
    startTime,
    durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
    distanceMeters: soma.distance_data?.summary?.distance_meters,
    avgHeartRate: soma.heart_rate_data?.summary?.avg_hr_bpm,
    maxHeartRate: soma.heart_rate_data?.summary?.max_hr_bpm,
    trainingLoad,
    perceivedExertion: undefined, // Not available in Terra schema
    sessionType: mapActivityType(soma.metadata.type),
  };
}

// =============================================================================
// Soma Daily/Body Transform
// =============================================================================

/**
 * Soma daily summary structure (partial).
 */
export interface SomaDaily {
  _id: string;
  metadata: {
    start_time: string;
    end_time: string;
  };
  heart_rate_data?: {
    summary?: {
      avg_hr_bpm?: number;
      resting_hr_bpm?: number;
      avg_hrv_rmssd?: number;
      avg_hrv_sdnn?: number;
    };
  };
  scores?: {
    sleep?: number;
    recovery?: number;
    activity?: number;
  };
}

/**
 * Soma body measurement structure (partial).
 */
export interface SomaBody {
  _id: string;
  metadata: {
    start_time: string;
    end_time: string;
  };
  measurements_data?: {
    measurements?: Array<{
      weight_kg?: number;
      measurement_time?: string;
    }>;
  };
  heart_data?: {
    heart_rate_data?: {
      summary?: {
        resting_hr_bpm?: number;
        avg_hrv_rmssd?: number;
      };
    };
  };
}

/**
 * Transform Soma daily summary to flat InferenceDaily.
 */
export function transformSomaDaily(soma: SomaDaily): InferenceDaily {
  const date = soma.metadata.start_time.split("T")[0];

  return {
    date,
    restingHeartRate: soma.heart_rate_data?.summary?.resting_hr_bpm,
    hrvMs: soma.heart_rate_data?.summary?.avg_hrv_rmssd,
    sleepScore: soma.scores?.sleep,
  };
}

/**
 * Transform Soma body measurement to partial InferenceDaily.
 * Can be merged with daily data.
 */
export function transformSomaBody(soma: SomaBody): Partial<InferenceDaily> {
  const date = soma.metadata.start_time.split("T")[0];

  // Get latest weight measurement
  let weight: number | undefined;
  if (soma.measurements_data?.measurements?.length) {
    const latest = soma.measurements_data.measurements[0];
    weight = latest.weight_kg;
  }

  // Body endpoint may also have HR/HRV data
  const restingHr = soma.heart_data?.heart_rate_data?.summary?.resting_hr_bpm;
  const hrv = soma.heart_data?.heart_rate_data?.summary?.avg_hrv_rmssd;

  return {
    date,
    weight,
    restingHeartRate: restingHr,
    hrvMs: hrv,
  };
}

/**
 * Merge daily and body data into complete InferenceDaily.
 * Body data takes precedence for weight/biometrics.
 */
export function mergeInferenceDaily(
  daily?: InferenceDaily,
  body?: Partial<InferenceDaily>
): InferenceDaily | undefined {
  if (!daily && !body) return undefined;
  if (!daily) return body as InferenceDaily;
  if (!body) return daily;

  return {
    date: daily.date,
    restingHeartRate: body.restingHeartRate ?? daily.restingHeartRate,
    hrvMs: body.hrvMs ?? daily.hrvMs,
    weight: body.weight ?? daily.weight,
    sleepScore: daily.sleepScore,
  };
}
