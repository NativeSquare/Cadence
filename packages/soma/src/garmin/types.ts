// ─── Garmin Health API Response Types ────────────────────────────────────────
// TypeScript types representing Garmin Health API data shapes.
//
// Wellness API types are derived from the OpenAPI spec (wellness-api.d.ts).
// Training API types are manually defined from the Garmin Connect docs.
//
// These types define the CONTRACT for data coming from the Garmin API.
// They are used by transformers, the API client, and OAuth helpers.

import type { components } from "./wellness-api.js";

// ─── Wellness API Type Aliases ──────────────────────────────────────────────
// Convenience aliases for the generated OpenAPI schema types.

export type GarminDaily = components["schemas"]["ClientDaily"];
export type GarminActivity = components["schemas"]["ClientActivity"];
export type GarminActivityDetail = components["schemas"]["ClientActivityDetail"];
export type GarminSleep = components["schemas"]["ClientSleep"];
export type GarminBodyComposition = components["schemas"]["ClientBodyComp"];
export type GarminMenstrualCycle = components["schemas"]["ClientSummarizedMenstrualCycle"];
export type GarminUserMetrics = components["schemas"]["ClientUserMetrics"];
export type GarminStressDetail = components["schemas"]["ClientStress"];
export type GarminSkinTemperature = components["schemas"]["ClientSkinTemp"];
export type GarminRespiration = components["schemas"]["ClientRespiration"];
export type GarminPulseOx = components["schemas"]["ClientDailySpo2Acclimation"];
export type GarminMoveIQEvent = components["schemas"]["ClientAutoActivityMoveIq"];
export type GarminHRVSummary = components["schemas"]["ClientHRVSummary"];
export type GarminHealthSnapshot = components["schemas"]["ClientHealthSnapshot"];
export type GarminEpoch = components["schemas"]["ClientEpoch"];
export type GarminBloodPressure = components["schemas"]["ClientBloodPressure"];
export type GarminSolar = components["schemas"]["ClientSolar"];
export type GarminSample = components["schemas"]["Sample"];
export type GarminLap = components["schemas"]["ClientLap"];
export type GarminTimeRange = components["schemas"]["TimeRange"];
export type GarminSleepScoreItem = components["schemas"]["ClientSleepScoreItem"];
export type GarminNap = components["schemas"]["ClientNaps"];

// ─── Extended Types ─────────────────────────────────────────────────────────
// The Garmin API returns additional fields beyond what the OpenAPI spec
// documents. These extended types add those fields so transformers can use them.

// Extended daily type with fields the API returns beyond what the spec documents
export type GarminDailyExtended = GarminDaily & {
  // Time-series stress data (returned by API, not in spec)
  timeOffsetStressLevelValues?: Record<string, number>;
  timeOffsetBodyBatteryValues?: Record<string, number>;
  // SpO2 data (returned by API, not in spec)
  averageSpo2Value?: number;
  lowestSpo2Value?: number;
  latestSpo2Value?: number;
  timeOffsetSpo2Values?: Record<string, number>;
  // Respiration data (returned by API, not in spec)
  averageRespirationInBreathsPerMinute?: number;
  lowestRespirationInBreathsPerMinute?: number;
  highestRespirationInBreathsPerMinute?: number;
  timeOffsetRespirationSamples?: Record<string, number>;
};

// Extended sleep type with fields the API returns beyond what the spec documents
export type GarminSleepExtended = GarminSleep & {
  // Respiration aggregates (returned by API, not in spec)
  averageRespirationInBreathsPerMinute?: number;
  lowestRespirationInBreathsPerMinute?: number;
  highestRespirationInBreathsPerMinute?: number;
  // SpO2 aggregates (returned by API, not in spec)
  averageSpo2Value?: number;
  lowestSpo2Value?: number;
  highestSpo2Value?: number;
  // Heart rate samples (returned by API, not in spec)
  timeOffsetHeartRateSamples?: Record<string, number>;
  // Alternate SpO2 field name (some responses use this instead of timeOffsetSleepSpo2)
  timeOffsetSpo2Values?: Record<string, number>;
};

// Extended activity type for webhook payloads which include detail-level fields
// (laps, samples, power) that the summary endpoint does not return.
export type GarminActivityExtended = GarminActivity & {
  // Fields from /rest/activityDetails and webhook payloads
  laps?: GarminLap[];
  samples?: GarminSample[];
  bmrKilocalories?: number;
  averagePowerInWatts?: number;
  maxPowerInWatts?: number;
  normalizedPowerInWatts?: number;
  poolLengthInMeters?: number;
  // Webhook payloads may use these alternate field names
  elevationGainInMeters?: number;
  elevationLossInMeters?: number;
};

// ─── Backward Compatibility Aliases ─────────────────────────────────────────

export type GarminDailySummary = GarminDailyExtended;
export type GarminMenstrualCycleData = GarminMenstrualCycle;
export type GarminSleepLevel = GarminTimeRange;
export type GarminActivityLap = GarminLap;
export type GarminActivitySample = GarminSample;

// ─── OAuth 2.0 ──────────────────────────────────────────────────────────────

export interface GarminOAuth2TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token_expires_in: number;
}

// ─── Training API V2 Types ──────────────────────────────────────────────────
// Types for the Garmin Connect Training API V2 (workout import/scheduling).

export type GarminWorkoutSport =
  | "RUNNING"
  | "CYCLING"
  | "LAP_SWIMMING"
  | "STRENGTH_TRAINING"
  | "CARDIO_TRAINING"
  | "GENERIC"
  | "YOGA"
  | "PILATES"
  | "MULTI_SPORT"
  | (string & {});

export type GarminStepIntensity =
  | "REST"
  | "WARMUP"
  | "COOLDOWN"
  | "RECOVERY"
  | "ACTIVE"
  | "INTERVAL"
  | "MAIN"
  | (string & {});

export type GarminDurationType =
  | "TIME"
  | "DISTANCE"
  | "HR_LESS_THAN"
  | "HR_GREATER_THAN"
  | "CALORIES"
  | "OPEN"
  | "POWER_LESS_THAN"
  | "POWER_GREATER_THAN"
  | "TIME_AT_VALID_CDA"
  | "FIXED_REST"
  | "REPS"
  | "FIXED_REPETITION"
  | "REPETITION_SWIM_CSS_OFFSET"
  | (string & {});

export type GarminTargetType =
  | "SPEED"
  | "HEART_RATE"
  | "CADENCE"
  | "POWER"
  | "GRADE"
  | "RESISTANCE"
  | "POWER_3S"
  | "POWER_10S"
  | "POWER_30S"
  | "POWER_LAP"
  | "SPEED_LAP"
  | "HEART_RATE_LAP"
  | "OPEN"
  | "PACE"
  | (string & {});

export type GarminRepeatType =
  | "REPEAT_UNTIL_STEPS_CMPLT"
  | "REPEAT_UNTIL_TIME"
  | "REPEAT_UNTIL_DISTANCE"
  | "REPEAT_UNTIL_CALORIES"
  | "REPEAT_UNTIL_HR_LESS_THAN"
  | "REPEAT_UNTIL_HR_GREATER_THAN"
  | "REPEAT_UNTIL_POWER_LESS_THAN"
  | "REPEAT_UNTIL_POWER_GREATER_THAN"
  | "REPEAT_UNTIL_POWER_LAST_LAP_LESS_THAN"
  | "REPEAT_UNTIL_MAX_POWER_LAST_LAP_LESS_THAN"
  | (string & {});

export interface GarminWorkoutStep {
  type: "WorkoutStep";
  stepId?: number;
  stepOrder: number;
  intensity: GarminStepIntensity;
  description?: string | null;
  durationType: GarminDurationType;
  durationValue?: number | null;
  durationValueType?: string | null;
  targetType?: GarminTargetType | null;
  targetValue?: number | null;
  targetValueLow?: number | null;
  targetValueHigh?: number | null;
  targetValueType?: string | null;
  secondaryTargetType?: string | null;
  secondaryTargetValue?: number | null;
  secondaryTargetValueLow?: number | null;
  secondaryTargetValueHigh?: number | null;
  secondaryTargetValueType?: string | null;
  strokeType?: string | null;
  drillType?: string | null;
  equipmentType?: string | null;
  exerciseCategory?: string | null;
  exerciseName?: string | null;
  weightValue?: number | null;
  weightDisplayUnit?: string | null;
}

export interface GarminWorkoutRepeatStep {
  type: "WorkoutRepeatStep";
  stepId?: number;
  stepOrder: number;
  repeatType: GarminRepeatType;
  repeatValue: number;
  skipLastRestStep?: boolean;
  steps: Array<GarminWorkoutStep | GarminWorkoutRepeatStep>;
}

export interface GarminWorkoutSegment {
  segmentOrder: number;
  sport: GarminWorkoutSport;
  poolLength?: number | null;
  poolLengthUnit?: string | null;
  estimatedDurationInSecs?: number | null;
  estimatedDistanceInMeters?: number | null;
  steps: Array<GarminWorkoutStep | GarminWorkoutRepeatStep>;
}

export interface GarminWorkout {
  workoutId?: number;
  ownerId?: number | null;
  workoutName: string;
  description?: string | null;
  updatedDate?: string;
  createdDate?: string;
  sport: GarminWorkoutSport;
  estimatedDurationInSecs?: number | null;
  estimatedDistanceInMeters?: number | null;
  poolLength?: number | null;
  poolLengthUnit?: string | null;
  workoutProvider: string;
  workoutSourceId: string;
  isSessionTransitionEnabled?: boolean;
  segments: GarminWorkoutSegment[];
}

export interface GarminWorkoutSchedule {
  scheduleId?: number;
  workoutId: number;
  date: string;
}

// ─── Push-Mode Webhook Payloads ─────────────────────────────────────────────
// In push mode, Garmin sends full data objects directly in the POST body.
// Each data type has its own webhook URL configured in the Garmin developer
// portal, so each payload is a typed array of the corresponding summary type.

export type GarminWebhookActivityPayload = (GarminActivity & { userAccessToken?: string })[];
export type GarminWebhookDailyPayload = (GarminDailyExtended & { userAccessToken?: string })[];
export type GarminWebhookSleepPayload = (GarminSleepExtended & { userAccessToken?: string })[];
export type GarminWebhookBodyPayload = (GarminBodyComposition & { userAccessToken?: string })[];
export type GarminWebhookBloodPressurePayload = (GarminBloodPressure & { userAccessToken?: string })[];
export type GarminWebhookSkinTempPayload = (GarminSkinTemperature & { userAccessToken?: string })[];
export type GarminWebhookUserMetricsPayload = (GarminUserMetrics & { userAccessToken?: string })[];
export type GarminWebhookHRVPayload = (GarminHRVSummary & { userAccessToken?: string })[];
export type GarminWebhookStressDetailPayload = (GarminStressDetail & { userAccessToken?: string })[];
export type GarminWebhookPulseOxPayload = (GarminPulseOx & { userAccessToken?: string })[];
export type GarminWebhookRespirationPayload = (GarminRespiration & { userAccessToken?: string })[];
