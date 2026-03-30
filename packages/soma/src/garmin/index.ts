// ─── @nativesquare/soma/garmin ───────────────────────────────────────────────
// Garmin Health API → Soma schema transformers, API client, OAuth 2.0 PKCE helpers, and sync.
//
// Uses the Web Crypto API for PKCE code challenge generation.
// Compatible with both the Convex V8 runtime and Node.js environments.

// ── Transformers ─────────────────────────────────────────────────────────────
export { transformActivity } from "./activity.js";
export type { ActivityData } from "./activity.js";

export { transformDaily } from "./daily.js";
export type { DailyData } from "./daily.js";

export { transformSleep } from "./sleep.js";
export type { SleepData } from "./sleep.js";

export { transformBody } from "./body.js";
export type { BodyData } from "./body.js";

export { transformMenstruation } from "./menstruation.js";
export type { MenstruationData } from "./menstruation.js";

export { transformBloodPressure } from "./bloodPressure.js";
export type { BloodPressureData } from "./bloodPressure.js";

export { transformSkinTemp } from "./skinTemp.js";
export type { SkinTempData } from "./skinTemp.js";

export { transformUserMetrics } from "./userMetrics.js";
export type { UserMetricsData } from "./userMetrics.js";

export { transformHRV } from "./hrv.js";
export type { HRVData } from "./hrv.js";

export { transformStressDetails } from "./stressDetails.js";
export type { StressDetailsData } from "./stressDetails.js";

export { transformPulseOx } from "./pulseOx.js";
export type { PulseOxData } from "./pulseOx.js";

export { transformRespiration } from "./respiration.js";
export type { RespirationData } from "./respiration.js";

// ── Enum Maps ────────────────────────────────────────────────────────────────
export { mapActivityType } from "./maps/activity-type.js";
export { mapSleepLevel } from "./maps/sleep-level.js";

// ── API Client ───────────────────────────────────────────────────────────────
export { GarminClient, GarminApiError } from "./client.js";
export type { GarminClientOptions, TimeRangeParams } from "./client.js";

// ── OAuth 2.0 PKCE Helpers ───────────────────────────────────────────────────
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthUrl,
  exchangeCode,
  refreshToken,
} from "./auth.js";
export type {
  BuildAuthUrlOptions,
  ExchangeCodeOptions,
  RefreshTokenOptions,
} from "./auth.js";

// ── Sync Helpers ─────────────────────────────────────────────────────────────
export {
  syncAll,
  syncActivities,
  syncDailies,
  syncSleep,
  syncBody,
  syncMenstruation,
  syncBloodPressures,
  syncSkinTemp,
  syncUserMetrics,
  syncHRV,
  syncStressDetails,
  syncPulseOx,
  syncRespiration,
} from "./sync.js";
export type {
  SyncOptions,
  SyncResult,
  SyncAllResult,
} from "./sync.js";

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  // Wellness API types (aliases for generated spec types)
  GarminActivity,
  GarminActivityDetail,
  GarminDaily,
  GarminSleep,
  GarminBodyComposition,
  GarminMenstrualCycle,
  GarminUserMetrics,
  GarminStressDetail,
  GarminSkinTemperature,
  GarminRespiration,
  GarminPulseOx,
  GarminHRVSummary,
  GarminHealthSnapshot,
  GarminEpoch,
  GarminBloodPressure,
  GarminMoveIQEvent,
  GarminSolar,
  GarminSample,
  GarminLap,
  GarminTimeRange,
  GarminSleepScoreItem,
  GarminNap,
  // Extended types (spec + undocumented fields)
  GarminDailyExtended,
  GarminSleepExtended,
  GarminActivityExtended,
  // Backward compatibility aliases
  GarminDailySummary,
  GarminMenstrualCycleData,
  GarminSleepLevel,
  GarminActivityLap,
  GarminActivitySample,
  // Training API types
  GarminWorkout,
  GarminWorkoutStep,
  GarminWorkoutRepeatStep,
  GarminWorkoutSegment,
  GarminWorkoutSchedule,
  GarminWorkoutSport,
  // OAuth
  GarminOAuth2TokenResponse,
  // Webhook payloads
  GarminWebhookActivityPayload,
  GarminWebhookDailyPayload,
  GarminWebhookSleepPayload,
  GarminWebhookBodyPayload,
  GarminWebhookBloodPressurePayload,
  GarminWebhookSkinTempPayload,
  GarminWebhookUserMetricsPayload,
  GarminWebhookHRVPayload,
  GarminWebhookStressDetailPayload,
  GarminWebhookPulseOxPayload,
  GarminWebhookRespirationPayload,
} from "./types.js";
