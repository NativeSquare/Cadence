// ─── Activity Transformer ────────────────────────────────────────────────────
// Transforms a Strava DetailedActivity (+ optional streams/laps) into the
// Soma Activity schema shape.

import type { DetailedActivity, SummaryActivity, StreamSet, Lap } from "./types.js";
import { mapSportType } from "./maps/sport-type.js";

/**
 * The output shape of {@link transformActivity}, matching the Soma Activity
 * validator minus `connectionId` and `userId` (added at ingestion time).
 */
export type ActivityData = ReturnType<typeof transformActivity>;

/**
 * Transform a Strava activity into a Soma Activity document shape.
 *
 * The returned object is ready to be spread into an `ingestActivity` call
 * alongside `connectionId` and `userId`.
 *
 * Accepts either a DetailedActivity (from `GET /activities/{id}`) or a
 * SummaryActivity (from `GET /athlete/activities`). When a DetailedActivity
 * is provided, additional fields like `calories`, `segment_efforts`, and
 * embedded `laps` are mapped. Optional streams and laps can also be supplied
 * for time-series data (heart rate, power, position, etc.).
 *
 * @param activity - The Strava activity (summary or detailed)
 * @param opts - Optional streams and laps data
 * @returns Soma Activity fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformActivity(stravaActivity, { streams, laps });
 * await soma.ingestActivity(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformActivity(
  activity: DetailedActivity | SummaryActivity,
  opts?: { streams?: StreamSet; laps?: Lap[] },
) {
  const streams = opts?.streams;
  const laps = opts?.laps ?? (isDetailed(activity) ? activity.laps : undefined);
  const timeStream = streams?.time?.data;
  const startDate = activity.start_date;

  return {
    metadata: {
      summary_id: String(activity.id),
      start_time: activity.start_date,
      end_time: computeEndTime(activity.start_date, activity.elapsed_time),
      type: mapSportType(activity.sport_type),
      upload_type: activity.manual ? 2 : 1, // 2=Manual, 1=Automatic
      name: activity.name,
      city: activity.location_city ?? undefined,
      state: activity.location_state ?? undefined,
      country: activity.location_country ?? undefined,
    },

    active_durations_data: {
      activity_seconds: activity.moving_time,
    },

    calories_data: isDetailed(activity) && activity.calories != null
      ? { total_burned_calories: activity.calories }
      : undefined,

    device_data: activity.device_name
      ? { name: activity.device_name }
      : undefined,

    distance_data: buildDistanceData(activity),

    energy_data: activity.kilojoules != null
      ? { energy_kilojoules: activity.kilojoules }
      : undefined,

    heart_rate_data: buildHeartRateData(activity, streams, timeStream, startDate),

    lap_data: buildLapData(laps),

    movement_data: buildMovementData(activity, streams, timeStream, startDate),

    polyline_map_data: activity.map?.summary_polyline
      ? { summary_polyline: activity.map.summary_polyline }
      : undefined,

    position_data: buildPositionData(activity, streams, timeStream, startDate),

    power_data: buildPowerData(activity, streams, timeStream, startDate),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDetailed(
  activity: DetailedActivity | SummaryActivity,
): activity is DetailedActivity {
  return activity.resource_state === 3;
}

function computeEndTime(startDate: string, elapsedTimeSeconds: number): string {
  const start = new Date(startDate);
  return new Date(start.getTime() + elapsedTimeSeconds * 1000).toISOString();
}

/**
 * Compute an ISO-8601 timestamp for a stream data point, given the
 * activity start time and the time stream offset in seconds.
 */
function streamTimestamp(
  startDate: string,
  timeOffsetSeconds: number,
): string {
  const start = new Date(startDate);
  return new Date(start.getTime() + timeOffsetSeconds * 1000).toISOString();
}

function buildDistanceData(activity: DetailedActivity | SummaryActivity) {
  if (activity.distance == null && activity.total_elevation_gain == null) {
    return undefined;
  }

  const detailed = isDetailed(activity) ? activity : undefined;

  return {
    summary: {
      distance_meters: activity.distance ?? undefined,
      elevation:
        activity.total_elevation_gain != null
          ? {
            gain_actual_meters: activity.total_elevation_gain,
            max_meters: detailed?.elev_high ?? undefined,
            min_meters: detailed?.elev_low ?? undefined,
          }
          : undefined,
    },
  };
}

function buildHeartRateData(
  activity: DetailedActivity | SummaryActivity,
  streams: StreamSet | undefined,
  timeStream: number[] | undefined,
  startDate: string,
) {
  const hasHrSummary =
    activity.average_heartrate != null || activity.max_heartrate != null;
  const hrStream = streams?.heartrate?.data;
  const hasHrStream = hrStream && hrStream.length > 0 && timeStream;

  if (!hasHrSummary && !hasHrStream) return undefined;

  return {
    summary: hasHrSummary
      ? {
        avg_hr_bpm: activity.average_heartrate,
        max_hr_bpm: activity.max_heartrate,
      }
      : undefined,
    detailed:
      hasHrStream && timeStream
        ? {
          hr_samples: hrStream.map((bpm, i) => ({
            timestamp: streamTimestamp(startDate, timeStream[i]),
            bpm,
          })),
        }
        : undefined,
  };
}

function buildLapData(laps: Lap[] | undefined) {
  if (!laps || laps.length === 0) return undefined;

  return {
    laps: laps.map((lap) => ({
      start_time: lap.start_date,
      end_time: computeEndTime(lap.start_date, lap.elapsed_time),
      distance_meters: lap.distance,
      calories: undefined as number | undefined,
      avg_speed_meters_per_second: lap.average_speed,
      avg_hr_bpm: lap.average_heartrate,
    })),
  };
}

function buildMovementData(
  activity: DetailedActivity | SummaryActivity,
  streams: StreamSet | undefined,
  timeStream: number[] | undefined,
  startDate: string,
) {
  const hasMovement =
    activity.average_speed != null ||
    activity.max_speed != null ||
    activity.average_cadence != null;
  const speedStream = streams?.velocity_smooth?.data;
  const cadenceStream = streams?.cadence?.data;
  const hasStreams =
    ((speedStream && speedStream.length > 0) ||
      (cadenceStream && cadenceStream.length > 0)) &&
    timeStream;

  if (!hasMovement && !hasStreams) return undefined;

  return {
    avg_speed_meters_per_second: activity.average_speed ?? undefined,
    max_speed_meters_per_second: activity.max_speed ?? undefined,
    avg_cadence_rpm: activity.average_cadence ?? undefined,
    speed_samples:
      speedStream && timeStream
        ? speedStream.map((speed, i) => ({
          timestamp: streamTimestamp(startDate, timeStream[i]),
          speed_meters_per_second: speed,
        }))
        : undefined,
    cadence_samples:
      cadenceStream && timeStream
        ? cadenceStream.map((cadence, i) => ({
          timestamp: streamTimestamp(startDate, timeStream[i]),
          cadence_rpm: cadence,
        }))
        : undefined,
  };
}

function buildPositionData(
  activity: DetailedActivity | SummaryActivity,
  streams: StreamSet | undefined,
  timeStream: number[] | undefined,
  startDate: string,
) {
  const latlngStream = streams?.latlng?.data;
  const hasPositionStream = latlngStream && latlngStream.length > 0 && timeStream;
  const hasStartEnd =
    activity.start_latlng != null || activity.end_latlng != null;

  if (!hasPositionStream && !hasStartEnd) return undefined;

  return {
    start_pos_lat_lng_deg: activity.start_latlng ?? undefined,
    end_pos_lat_lng_deg: activity.end_latlng ?? undefined,
    position_samples:
      hasPositionStream && timeStream
        ? latlngStream.map((coords, i) => ({
          timestamp: streamTimestamp(startDate, timeStream[i]),
          coords_lat_lng_deg: coords,
        }))
        : undefined,
  };
}

function buildPowerData(
  activity: DetailedActivity | SummaryActivity,
  streams: StreamSet | undefined,
  timeStream: number[] | undefined,
  startDate: string,
) {
  const hasPowerSummary =
    activity.average_watts != null || activity.max_watts != null;
  const wattsStream = streams?.watts?.data;
  const hasWattsStream = wattsStream && wattsStream.length > 0 && timeStream;

  if (!hasPowerSummary && !hasWattsStream) return undefined;

  return {
    avg_watts: activity.average_watts ?? undefined,
    max_watts: activity.max_watts ?? undefined,
    power_samples:
      hasWattsStream && timeStream
        ? wattsStream.map((watts, i) => ({
          timestamp: streamTimestamp(startDate, timeStream[i]),
          watts,
        }))
        : undefined,
  };
}
