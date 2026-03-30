// ─── @nativesquare/soma/strava ───────────────────────────────────────────────
// Strava API → Soma schema transformers, API client, OAuth helpers, and sync.
//
// Pure TypeScript with zero runtime dependencies (uses global `fetch`).
// Compatible with Convex actions and any modern runtime.

// ── Transformers ─────────────────────────────────────────────────────────────
export { transformActivity } from "./activity.js";
export type { ActivityData } from "./activity.js";

export { transformAthlete } from "./athlete.js";
export type { AthleteData } from "./athlete.js";

// ── Enum Maps ────────────────────────────────────────────────────────────────
export { mapSportType } from "./maps/sport-type.js";

// ── API Client ───────────────────────────────────────────────────────────────
export { StravaClient, StravaApiError } from "./client.js";
export type { StravaClientOptions } from "./client.js";

// ── OAuth Helpers ────────────────────────────────────────────────────────────
export { buildAuthUrl, exchangeCode, refreshToken } from "./auth.js";
export type {
  BuildAuthUrlOptions,
  ExchangeCodeOptions,
  RefreshTokenOptions,
} from "./auth.js";

// ── Sync Helpers ─────────────────────────────────────────────────────────────
export { syncActivities, syncAthlete } from "./sync.js";
export type {
  SyncActivitiesOptions,
  SyncActivitiesResult,
  SyncAthleteOptions,
} from "./sync.js";

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  DetailedActivity,
  DetailedAthlete,
  Lap,
  OAuthTokenResponse,
  PolylineMap,
  SegmentEffort,
  Split,
  Stream,
  StreamSet,
  StravaSportType,
  SummaryActivity,
  SummaryAthlete,
  SummaryClub,
  SummaryGear,
  SummarySegment,
} from "./types.js";
