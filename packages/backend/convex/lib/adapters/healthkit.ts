/**
 * HealthKit Data Adapter
 *
 * Transforms raw HealthKit workout data into the unified activities schema.
 * Implements the DataAdapter interface for consistent data normalization.
 */

import type { Id } from "../../_generated/dataModel";
import type { DataAdapter, PartialActivity } from "./types";

/** Raw workout data from HealthKit (matches RawHealthKitWorkout from native app). */
export type RawHealthKitWorkout = {
  uuid: string;
  startDate: number; // Unix timestamp ms
  endDate: number; // Unix timestamp ms
  durationSeconds: number;
  distanceMeters: number;
  activeEnergyBurnedKcal: number | undefined;
  avgHeartRate: number | undefined;
  maxHeartRate: number | undefined;
  avgSpeedMps: number | undefined;
  avgPaceSecondsPerKm: number | undefined;
};

/**
 * HealthKit adapter implementing the DataAdapter interface.
 * Normalizes HealthKit workout data to the unified activities schema.
 */
export const healthkitAdapter: DataAdapter = {
  source: "healthkit",

  /**
   * Normalize a single HealthKit workout to the activities schema.
   *
   * @param raw - Raw workout data from HealthKit
   * @param runnerId - Runner ID for foreign key
   * @param userId - User ID for foreign key
   * @returns PartialActivity ready for database insertion
   * @throws Error if raw data is missing required fields
   */
  normalizeActivity(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialActivity {
    // Validate required fields
    const workout = raw as RawHealthKitWorkout;
    if (
      typeof workout?.uuid !== "string" ||
      typeof workout?.startDate !== "number" ||
      typeof workout?.endDate !== "number"
    ) {
      throw new Error(
        "Invalid HealthKit workout: missing required fields (uuid, startDate, endDate)"
      );
    }
    const now = Date.now();

    // Convert m/s to km/h: multiply by 3.6
    const avgSpeedKmh = workout.avgSpeedMps
      ? Math.round(workout.avgSpeedMps * 3.6 * 100) / 100
      : undefined;

    return {
      // Foreign keys
      runnerId,
      userId,

      // Metadata
      externalId: workout.uuid,
      source: "healthkit",
      startTime: workout.startDate,
      endTime: workout.endDate,
      activityType: "running",

      // Distance & Movement
      distanceMeters:
        workout.distanceMeters > 0 ? workout.distanceMeters : undefined,
      durationSeconds:
        workout.durationSeconds > 0 ? workout.durationSeconds : undefined,

      // Pace & Speed
      avgPaceSecondsPerKm: workout.avgPaceSecondsPerKm
        ? Math.round(workout.avgPaceSecondsPerKm)
        : undefined,
      avgSpeedKmh,

      // Heart Rate
      avgHeartRate: workout.avgHeartRate
        ? Math.round(workout.avgHeartRate)
        : undefined,
      maxHeartRate: workout.maxHeartRate
        ? Math.round(workout.maxHeartRate)
        : undefined,

      // Calories
      calories: workout.activeEnergyBurnedKcal
        ? Math.round(workout.activeEnergyBurnedKcal)
        : undefined,

      // Debug
      rawPayload: JSON.stringify(raw),
      importedAt: now,
      lastSyncedAt: now,
    };
  },

  /**
   * Normalize sleep data (stub for future implementation).
   * @throws Error - Not yet implemented
   */
  normalizeSleep(): never {
    throw new Error("HealthKit sleep normalization not yet implemented");
  },

  /**
   * Normalize body measurement data (stub for future implementation).
   * @throws Error - Not yet implemented
   */
  normalizeBody(): never {
    throw new Error("HealthKit body measurement normalization not yet implemented");
  },
};
