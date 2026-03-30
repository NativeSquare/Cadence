import { describe, expect, it } from "vitest";
import { transformActivity } from "./activity.js";
import type { DetailedActivity, SummaryActivity, StreamSet, Lap } from "./types.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseSummaryActivity: SummaryActivity = {
  resource_state: 2,
  athlete: { id: 134815, resource_state: 1 },
  name: "Happy Friday",
  distance: 24931.4,
  moving_time: 4500,
  elapsed_time: 4500,
  total_elevation_gain: 0,
  type: "Ride",
  sport_type: "MountainBikeRide",
  workout_type: null,
  id: 154504250376823,
  external_id: "garmin_push_12345678987654321",
  upload_id: 987654321234567900000,
  start_date: "2018-05-02T12:15:09Z",
  start_date_local: "2018-05-02T05:15:09Z",
  timezone: "(GMT-08:00) America/Los_Angeles",
  utc_offset: -25200,
  start_latlng: null,
  end_latlng: null,
  location_city: null,
  location_state: null,
  location_country: "United States",
  achievement_count: 0,
  kudos_count: 3,
  comment_count: 1,
  athlete_count: 1,
  photo_count: 0,
  map: {
    id: "a12345678987654321",
    summary_polyline: null,
    resource_state: 2,
    polyline: null,
  },
  trainer: true,
  commute: false,
  manual: false,
  private: false,
  flagged: false,
  gear_id: "b12345678987654321",
  from_accepted_tag: false,
  average_speed: 5.54,
  max_speed: 11,
  average_cadence: 67.1,
  average_watts: 175.3,
  weighted_average_watts: 210,
  kilojoules: 788.7,
  device_watts: true,
  has_heartrate: true,
  average_heartrate: 140.3,
  max_heartrate: 178,
  max_watts: 406,
  pr_count: 0,
  total_photo_count: 1,
  has_kudoed: false,
  suffer_score: 82,
  device_name: "Garmin Edge 1030",
};

const baseDetailedActivity: DetailedActivity = {
  ...baseSummaryActivity,
  resource_state: 3,
  id: 12345678987654320,
  distance: 28099,
  moving_time: 4207,
  elapsed_time: 4410,
  total_elevation_gain: 516,
  start_date: "2018-02-16T14:52:54Z",
  start_latlng: [37.83, -122.26],
  end_latlng: [37.83, -122.26],
  calories: 870.2,
  elev_high: 446.6,
  elev_low: 17.2,
  average_speed: 6.679,
  max_speed: 18.5,
  average_cadence: 78.5,
  average_watts: 185.5,
  max_watts: 743,
  kilojoules: 780.5,
  has_heartrate: false,
  average_heartrate: undefined,
  max_heartrate: undefined,
  description: "",
  gear: {
    id: "b12345678987654321",
    primary: true,
    name: "Tarmac",
    resource_state: 2,
    distance: 32547610,
  },
  segment_efforts: [],
  splits_metric: [],
  laps: [],
  embed_token: "abc123",
  partner_brand_tag: null,
  map: {
    id: "a1410355832",
    polyline: "encoded_polyline_data",
    resource_state: 3,
    summary_polyline: "summary_encoded_data",
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("transformActivity", () => {
  describe("metadata", () => {
    it("sets summary_id from activity id", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.metadata.summary_id).toBe(
        String(baseDetailedActivity.id),
      );
    });

    it("sets start_time from start_date", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.metadata.start_time).toBe("2018-02-16T14:52:54Z");
    });

    it("computes end_time from start_date + elapsed_time", () => {
      const result = transformActivity(baseDetailedActivity);
      const expected = new Date(
        new Date("2018-02-16T14:52:54Z").getTime() + 4410 * 1000,
      ).toISOString();
      expect(result.metadata.end_time).toBe(expected);
    });

    it("maps sport_type to Terra ActivityType", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.metadata.type).toBe(1); // Biking for MountainBikeRide
    });

    it("sets upload_type to 1 (Automatic) for non-manual activities", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.metadata.upload_type).toBe(1);
    });

    it("sets upload_type to 2 (Manual) for manual activities", () => {
      const manual = { ...baseDetailedActivity, manual: true };
      const result = transformActivity(manual);
      expect(result.metadata.upload_type).toBe(2);
    });

    it("sets name from activity name", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.metadata.name).toBe("Happy Friday");
    });

    it("maps location fields", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.metadata.country).toBe("United States");
    });
  });

  describe("active_durations_data", () => {
    it("sets activity_seconds from moving_time", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.active_durations_data.activity_seconds).toBe(4207);
    });
  });

  describe("calories_data", () => {
    it("sets total_burned_calories for detailed activities", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.calories_data?.total_burned_calories).toBe(870.2);
    });

    it("returns undefined for summary activities", () => {
      const result = transformActivity(baseSummaryActivity);
      expect(result.calories_data).toBeUndefined();
    });
  });

  describe("distance_data", () => {
    it("sets distance_meters from activity distance", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.distance_data?.summary?.distance_meters).toBe(28099);
    });

    it("includes elevation for detailed activities", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(
        result.distance_data?.summary?.elevation?.gain_actual_meters,
      ).toBe(516);
      expect(result.distance_data?.summary?.elevation?.max_meters).toBe(446.6);
      expect(result.distance_data?.summary?.elevation?.min_meters).toBe(17.2);
    });
  });

  describe("heart_rate_data", () => {
    it("maps summary HR from activity fields", () => {
      const withHr = {
        ...baseDetailedActivity,
        has_heartrate: true,
        average_heartrate: 145,
        max_heartrate: 180,
      };
      const result = transformActivity(withHr);
      expect(result.heart_rate_data?.summary?.avg_hr_bpm).toBe(145);
      expect(result.heart_rate_data?.summary?.max_hr_bpm).toBe(180);
    });

    it("maps detailed HR from streams", () => {
      const streams: StreamSet = {
        time: {
          type: "time",
          data: [0, 5, 10],
          series_type: "distance",
          original_size: 3,
          resolution: "high",
        },
        heartrate: {
          type: "heartrate",
          data: [120, 135, 150],
          series_type: "distance",
          original_size: 3,
          resolution: "high",
        },
      };
      const result = transformActivity(baseSummaryActivity, { streams });
      expect(result.heart_rate_data?.detailed?.hr_samples).toHaveLength(3);
      expect(result.heart_rate_data?.detailed?.hr_samples?.[0].bpm).toBe(120);
    });

    it("returns undefined when no HR data", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.heart_rate_data).toBeUndefined();
    });
  });

  describe("movement_data", () => {
    it("maps speed and cadence from activity fields", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.movement_data?.avg_speed_meters_per_second).toBe(6.679);
      expect(result.movement_data?.max_speed_meters_per_second).toBe(18.5);
      expect(result.movement_data?.avg_cadence_rpm).toBe(78.5);
    });

    it("maps speed samples from velocity_smooth stream", () => {
      const streams: StreamSet = {
        time: {
          type: "time",
          data: [0, 5],
          series_type: "distance",
          original_size: 2,
          resolution: "high",
        },
        velocity_smooth: {
          type: "velocity_smooth",
          data: [3.5, 4.2],
          series_type: "distance",
          original_size: 2,
          resolution: "high",
        },
      };
      const result = transformActivity(baseSummaryActivity, { streams });
      expect(result.movement_data?.speed_samples).toHaveLength(2);
      expect(
        result.movement_data?.speed_samples?.[0].speed_meters_per_second,
      ).toBe(3.5);
    });
  });

  describe("power_data", () => {
    it("maps power summary from activity fields", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.power_data?.avg_watts).toBe(185.5);
      expect(result.power_data?.max_watts).toBe(743);
    });

    it("maps power samples from watts stream", () => {
      const streams: StreamSet = {
        time: {
          type: "time",
          data: [0, 5, 10],
          series_type: "distance",
          original_size: 3,
          resolution: "high",
        },
        watts: {
          type: "watts",
          data: [200, 250, 180],
          series_type: "distance",
          original_size: 3,
          resolution: "high",
        },
      };
      const result = transformActivity(baseSummaryActivity, { streams });
      expect(result.power_data?.power_samples).toHaveLength(3);
      expect(result.power_data?.power_samples?.[1].watts).toBe(250);
    });
  });

  describe("position_data", () => {
    it("maps start/end positions from activity", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.position_data?.start_pos_lat_lng_deg).toEqual([
        37.83, -122.26,
      ]);
      expect(result.position_data?.end_pos_lat_lng_deg).toEqual([
        37.83, -122.26,
      ]);
    });

    it("maps position samples from latlng stream", () => {
      const streams: StreamSet = {
        time: {
          type: "time",
          data: [0, 5],
          series_type: "distance",
          original_size: 2,
          resolution: "high",
        },
        latlng: {
          type: "latlng",
          data: [
            [37.83, -122.26],
            [37.84, -122.25],
          ],
          series_type: "distance",
          original_size: 2,
          resolution: "high",
        },
      };
      const result = transformActivity(baseDetailedActivity, { streams });
      expect(result.position_data?.position_samples).toHaveLength(2);
      expect(
        result.position_data?.position_samples?.[0].coords_lat_lng_deg,
      ).toEqual([37.83, -122.26]);
    });

    it("returns undefined when no position data", () => {
      const noPos = {
        ...baseSummaryActivity,
        start_latlng: null,
        end_latlng: null,
      };
      const result = transformActivity(noPos);
      expect(result.position_data).toBeUndefined();
    });
  });

  describe("polyline_map_data", () => {
    it("maps summary_polyline from activity map", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.polyline_map_data?.summary_polyline).toBe(
        "summary_encoded_data",
      );
    });

    it("returns undefined when no summary_polyline", () => {
      const result = transformActivity(baseSummaryActivity);
      expect(result.polyline_map_data).toBeUndefined();
    });
  });

  describe("energy_data", () => {
    it("maps kilojoules", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.energy_data?.energy_kilojoules).toBe(780.5);
    });
  });

  describe("device_data", () => {
    it("maps device_name", () => {
      const result = transformActivity(baseDetailedActivity);
      expect(result.device_data?.name).toBe("Garmin Edge 1030");
    });
  });

  describe("lap_data", () => {
    it("maps laps from explicit laps array", () => {
      const laps: Lap[] = [
        {
          id: 4479306946,
          resource_state: 2,
          name: "Lap 1",
          activity: { id: 1410355832, resource_state: 1 },
          athlete: { id: 134815, resource_state: 1 },
          elapsed_time: 1573,
          moving_time: 1569,
          start_date: "2018-02-16T14:52:54Z",
          start_date_local: "2018-02-16T06:52:54Z",
          distance: 8046.72,
          start_index: 0,
          end_index: 1570,
          total_elevation_gain: 276,
          average_speed: 5.12,
          max_speed: 9.5,
          average_cadence: 78.6,
          device_watts: true,
          average_watts: 233.1,
          lap_index: 1,
          split: 1,
        },
      ];

      const result = transformActivity(baseSummaryActivity, { laps });
      expect(result.lap_data?.laps).toHaveLength(1);
      expect(result.lap_data?.laps?.[0].distance_meters).toBe(8046.72);
      expect(result.lap_data?.laps?.[0].avg_speed_meters_per_second).toBe(
        5.12,
      );
      expect(result.lap_data?.laps?.[0].start_time).toBe(
        "2018-02-16T14:52:54Z",
      );
    });
  });
});
