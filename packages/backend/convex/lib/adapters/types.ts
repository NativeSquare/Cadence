/**
 * Data Adapter Types
 *
 * Defines the interface and types for wearable data adapters.
 * All adapters must implement this interface to ensure consistent
 * data normalization across different wearable sources.
 */

import type { Id } from "../../_generated/dataModel";

/** Supported wearable data sources */
export type DataSource =
  | "healthkit"
  | "strava"
  | "garmin"
  | "coros"
  | "terra"
  | "manual"
  | "mock";

/** Activity fields for database insertion (without Convex system fields) */
export type PartialActivity = {
  // Foreign keys (provided by caller)
  runnerId: Id<"runners">;
  userId: Id<"users">;

  // Metadata
  externalId?: string;
  source: DataSource;
  startTime: number;
  endTime: number;
  activityType: string;
  name?: string;

  // Distance & Movement
  distanceMeters?: number;
  durationSeconds?: number;
  elevationGainMeters?: number;
  steps?: number;

  // Pace & Speed
  avgPaceSecondsPerKm?: number;
  avgSpeedKmh?: number;

  // Heart Rate
  avgHeartRate?: number;
  maxHeartRate?: number;

  // Calories
  calories?: number;

  // Running metrics
  avgCadence?: number;

  // Debug
  rawPayload?: string;
  importedAt: number;
  lastSyncedAt: number;
};

/** Interface all wearable adapters must implement */
export interface DataAdapter {
  /** Source identifier */
  source: DataSource;

  /** Transform raw activity data to our schema */
  normalizeActivity(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialActivity;

  /** Transform raw sleep data (optional, for future use) */
  normalizeSleep?(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): unknown;

  /** Transform raw body measurement (optional, for future use) */
  normalizeBody?(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): unknown;
}
