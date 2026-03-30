// ─── Activity Transformer ────────────────────────────────────────────────────
// Transforms an Apple HealthKit HKWorkout into the Soma Activity schema shape.

import type { HKWorkout } from "./types.js";
import { mapActivityType } from "./maps/activity-type.js";
import { buildDeviceData } from "./utils.js";

/**
 * The output shape of {@link transformWorkout}, matching the Soma Activity
 * validator minus `connectionId` and `userId` (added at ingestion time).
 */
export type ActivityData = ReturnType<typeof transformWorkout>;

/**
 * Transform an HKWorkout into a Soma Activity document shape.
 *
 * The returned object is ready to be spread into an `ingestActivity` call
 * alongside `connectionId` and `userId`.
 *
 * @param workout - The HKWorkout from HealthKit
 * @returns Soma Activity fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformWorkout(hkWorkout);
 * await soma.ingestActivity(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformWorkout(workout: HKWorkout) {
  const heartRateSamples = workout.heartRateSamples;
  const hrValues = heartRateSamples?.map((s) => s.value) ?? [];

  return {
    metadata: {
      summary_id: workout.uuid,
      start_time: workout.startDate,
      end_time: workout.endDate,
      type: mapActivityType(workout.workoutActivityType),
      upload_type: 1 as const, // Automatic
      name: undefined as string | undefined,
    },

    active_durations_data: {
      activity_seconds: workout.duration,
    },

    calories_data:
      workout.totalEnergyBurned != null
        ? {
            total_burned_calories: workout.totalEnergyBurned,
          }
        : undefined,

    device_data: buildDeviceData(workout.source, workout.device),

    distance_data:
      workout.totalDistance != null ||
      workout.totalSwimmingStrokeCount != null ||
      workout.totalFlightsClimbed != null
        ? {
            summary: {
              distance_meters: workout.totalDistance,
              steps: undefined as number | undefined,
              floors_climbed: workout.totalFlightsClimbed,
              swimming:
                workout.totalSwimmingStrokeCount != null
                  ? { num_strokes: workout.totalSwimmingStrokeCount }
                  : undefined,
            },
          }
        : undefined,

    heart_rate_data:
      heartRateSamples && heartRateSamples.length > 0
        ? {
            detailed: {
              hr_samples: heartRateSamples.map((s) => ({
                timestamp: s.startDate,
                bpm: s.value,
              })),
            },
            summary: {
              avg_hr_bpm:
                hrValues.length > 0
                  ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length
                  : undefined,
              max_hr_bpm:
                hrValues.length > 0 ? Math.max(...hrValues) : undefined,
              min_hr_bpm:
                hrValues.length > 0 ? Math.min(...hrValues) : undefined,
            },
          }
        : undefined,

    position_data:
      workout.routeData && workout.routeData.length > 0
        ? {
            position_samples: workout.routeData.flatMap((route) =>
              route.locations.map((loc) => ({
                timestamp: loc.timestamp,
                coords_lat_lng_deg: [loc.latitude, loc.longitude],
              })),
            ),
            start_pos_lat_lng_deg: (() => {
              const first = workout.routeData[0]?.locations[0];
              return first
                ? [first.latitude, first.longitude]
                : undefined;
            })(),
            end_pos_lat_lng_deg: (() => {
              const lastRoute =
                workout.routeData[workout.routeData.length - 1];
              const last =
                lastRoute?.locations[lastRoute.locations.length - 1];
              return last ? [last.latitude, last.longitude] : undefined;
            })(),
          }
        : undefined,
  };
}
