// ─── Activity Transformer ────────────────────────────────────────────────────
// Transforms a Garmin activity into the Soma Activity schema shape.

import type { GarminActivityExtended, GarminLap, GarminSample } from "./types.js";
import { mapActivityType } from "./maps/activity-type.js";

export type ActivityData = ReturnType<typeof transformActivity>;

/**
 * Transform a Garmin activity into a Soma Activity document shape.
 *
 * Accepts both activity summaries (from `/rest/activities`) and detailed
 * activities (from `/rest/activityDetails` or webhook payloads) which
 * include laps, samples, and power data.
 *
 * The returned object is ready to be spread into an `ingestActivity` call
 * alongside `connectionId` and `userId`.
 */
export function transformActivity(activity: GarminActivityExtended) {
  const startMs = (activity.startTimeInSeconds ?? 0) * 1000;
  const endMs = startMs + (activity.durationInSeconds ?? 0) * 1000;
  const startDate = new Date(startMs).toISOString();
  const endDate = new Date(endMs).toISOString();

  return {
    metadata: {
      summary_id: activity.summaryId ?? String(activity.activityId),
      start_time: startDate,
      end_time: endDate,
      type: mapActivityType(activity.activityType ?? "OTHER"),
      upload_type: activity.manual ? 2 : 1,
      name: activity.activityName,
    },

    active_durations_data: {
      activity_seconds: activity.durationInSeconds,
    },

    calories_data: buildCaloriesData(activity),

    device_data: activity.deviceName
      ? { name: activity.deviceName }
      : undefined,

    distance_data: buildDistanceData(activity),

    heart_rate_data: buildHeartRateData(activity),

    movement_data: buildMovementData(activity),

    position_data: buildPositionData(activity),

    power_data: buildPowerData(activity),

    lap_data: buildLapData(activity),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCaloriesData(activity: GarminActivityExtended) {
  if (
    activity.activeKilocalories == null &&
    activity.bmrKilocalories == null
  ) {
    return undefined;
  }

  const total =
    (activity.activeKilocalories ?? 0) + (activity.bmrKilocalories ?? 0);

  return {
    net_activity_calories: activity.activeKilocalories,
    BMR_calories: activity.bmrKilocalories,
    total_burned_calories: total || undefined,
  };
}

function buildDistanceData(activity: GarminActivityExtended) {
  // Spec uses totalElevationGainInMeters; webhooks may use elevationGainInMeters
  const elevGain = activity.totalElevationGainInMeters ?? activity.elevationGainInMeters;
  const elevLoss = activity.totalElevationLossInMeters ?? activity.elevationLossInMeters;

  if (activity.distanceInMeters == null && elevGain == null) {
    return undefined;
  }

  return {
    summary: {
      distance_meters: activity.distanceInMeters,
      steps: activity.steps,
      elevation:
        elevGain != null
          ? {
              gain_actual_meters: elevGain,
              loss_actual_meters: elevLoss,
            }
          : undefined,
    },
  };
}

function buildHeartRateData(activity: GarminActivityExtended) {
  const hasHrSummary =
    activity.averageHeartRateInBeatsPerMinute != null ||
    activity.maxHeartRateInBeatsPerMinute != null;
  const hasSamples = activity.samples && activity.samples.length > 0;

  if (!hasHrSummary && !hasSamples) return undefined;

  const hrSamples = hasSamples
    ? activity.samples!
        .filter((s: GarminSample) => s.heartRate != null && s.startTimeInSeconds != null)
        .map((s: GarminSample) => ({
          timestamp: new Date(s.startTimeInSeconds! * 1000).toISOString(),
          bpm: s.heartRate!,
        }))
    : undefined;

  return {
    summary: hasHrSummary
      ? {
          avg_hr_bpm: activity.averageHeartRateInBeatsPerMinute,
          max_hr_bpm: activity.maxHeartRateInBeatsPerMinute,
        }
      : undefined,
    detailed:
      hrSamples && hrSamples.length > 0
        ? { hr_samples: hrSamples }
        : undefined,
  };
}

function buildMovementData(activity: GarminActivityExtended) {
  const avgCadence =
    activity.averageRunCadenceInStepsPerMinute ??
    activity.averageBikeCadenceInRoundsPerMinute;
  const maxCadence =
    activity.maxRunCadenceInStepsPerMinute ??
    activity.maxBikeCadenceInRoundsPerMinute;

  const hasMovement =
    activity.averageSpeedInMetersPerSecond != null ||
    activity.maxSpeedInMetersPerSecond != null ||
    avgCadence != null;

  const hasSamples = activity.samples && activity.samples.length > 0;

  if (!hasMovement && !hasSamples) return undefined;

  const speedSamples = hasSamples
    ? activity.samples!
        .filter(
          (s: GarminSample) =>
            s.speedMetersPerSecond != null && s.startTimeInSeconds != null,
        )
        .map((s: GarminSample) => ({
          timestamp: new Date(s.startTimeInSeconds! * 1000).toISOString(),
          speed_meters_per_second: s.speedMetersPerSecond!,
        }))
    : undefined;

  const cadenceSamples = hasSamples
    ? activity.samples!
        .filter(
          (s: GarminSample) =>
            (s.stepsPerMinute != null ||
              s.bikeCadenceInRPM != null) &&
            s.startTimeInSeconds != null,
        )
        .map((s: GarminSample) => ({
          timestamp: new Date(s.startTimeInSeconds! * 1000).toISOString(),
          cadence_rpm:
            s.stepsPerMinute ?? s.bikeCadenceInRPM ?? 0,
        }))
    : undefined;

  return {
    avg_speed_meters_per_second: activity.averageSpeedInMetersPerSecond,
    max_speed_meters_per_second: activity.maxSpeedInMetersPerSecond,
    avg_pace_minutes_per_kilometer: activity.averagePaceInMinutesPerKilometer,
    max_pace_minutes_per_kilometer: activity.maxPaceInMinutesPerKilometer,
    avg_cadence_rpm: avgCadence,
    max_cadence_rpm: maxCadence,
    speed_samples:
      speedSamples && speedSamples.length > 0 ? speedSamples : undefined,
    cadence_samples:
      cadenceSamples && cadenceSamples.length > 0
        ? cadenceSamples
        : undefined,
  };
}

function buildPositionData(activity: GarminActivityExtended) {
  const hasStartPos =
    activity.startingLatitudeInDegree != null &&
    activity.startingLongitudeInDegree != null;
  const hasSamples = activity.samples && activity.samples.length > 0;

  if (!hasStartPos && !hasSamples) return undefined;

  const positionSamples = hasSamples
    ? activity.samples!
        .filter(
          (s: GarminSample) =>
            s.latitudeInDegree != null &&
            s.longitudeInDegree != null &&
            s.startTimeInSeconds != null,
        )
        .map((s: GarminSample) => ({
          timestamp: new Date(s.startTimeInSeconds! * 1000).toISOString(),
          coords_lat_lng_deg: [s.latitudeInDegree!, s.longitudeInDegree!],
        }))
    : undefined;

  return {
    start_pos_lat_lng_deg: hasStartPos
      ? [
          activity.startingLatitudeInDegree!,
          activity.startingLongitudeInDegree!,
        ]
      : undefined,
    position_samples:
      positionSamples && positionSamples.length > 0
        ? positionSamples
        : undefined,
  };
}

function buildPowerData(activity: GarminActivityExtended) {
  const hasPowerSummary =
    activity.averagePowerInWatts != null ||
    activity.maxPowerInWatts != null;
  const hasSamples = activity.samples && activity.samples.length > 0;

  if (!hasPowerSummary && !hasSamples) return undefined;

  const powerSamples = hasSamples
    ? activity.samples!
        .filter(
          (s: GarminSample) => s.powerInWatts != null && s.startTimeInSeconds != null,
        )
        .map((s: GarminSample) => ({
          timestamp: new Date(s.startTimeInSeconds! * 1000).toISOString(),
          watts: s.powerInWatts!,
        }))
    : undefined;

  return {
    avg_watts: activity.averagePowerInWatts,
    max_watts: activity.maxPowerInWatts,
    power_samples:
      powerSamples && powerSamples.length > 0 ? powerSamples : undefined,
  };
}

function buildLapData(activity: GarminActivityExtended) {
  if (!activity.laps || activity.laps.length === 0) return undefined;

  return {
    laps: activity.laps.map((lap: GarminLap) => ({
      start_time: new Date((lap.startTimeInSeconds ?? 0) * 1000).toISOString(),
    })),
  };
}
