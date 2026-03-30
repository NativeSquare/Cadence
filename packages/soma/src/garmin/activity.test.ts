import { describe, expect, it } from "vitest";
import { transformActivity } from "./activity.js";
import type { GarminActivityExtended } from "./types.js";

const baseActivity: GarminActivityExtended = {
  userId: "garmin_user_1",
  summaryId: "summary_12345",
  activityId: 12345,
  activityName: "Morning Run",
  activityType: "RUNNING",
  durationInSeconds: 3600,
  startTimeInSeconds: 1700000000,
  startTimeOffsetInSeconds: -18000,
};

describe("transformActivity", () => {
  it("maps metadata correctly", () => {
    const result = transformActivity(baseActivity);

    expect(result.metadata.summary_id).toBe("summary_12345");
    expect(result.metadata.start_time).toBe("2023-11-14T22:13:20.000Z");
    expect(result.metadata.end_time).toBe("2023-11-14T23:13:20.000Z");
    expect(result.metadata.type).toBe(8); // RUNNING → Terra Running
    expect(result.metadata.upload_type).toBe(1); // Automatic
    expect(result.metadata.name).toBe("Morning Run");
  });

  it("maps manual upload type", () => {
    const manual = { ...baseActivity, manual: true };
    const result = transformActivity(manual);
    expect(result.metadata.upload_type).toBe(2);
  });

  it("maps duration data", () => {
    const result = transformActivity(baseActivity);
    expect(result.active_durations_data.activity_seconds).toBe(3600);
  });

  it("maps calories data", () => {
    const withCalories: GarminActivityExtended = {
      ...baseActivity,
      activeKilocalories: 450,
      bmrKilocalories: 75,
    };
    const result = transformActivity(withCalories);

    expect(result.calories_data).toBeDefined();
    expect(result.calories_data!.net_activity_calories).toBe(450);
    expect(result.calories_data!.BMR_calories).toBe(75);
    expect(result.calories_data!.total_burned_calories).toBe(525);
  });

  it("returns undefined calories_data when no calorie fields present", () => {
    const result = transformActivity(baseActivity);
    expect(result.calories_data).toBeUndefined();
  });

  it("maps distance data", () => {
    const withDistance: GarminActivityExtended = {
      ...baseActivity,
      distanceInMeters: 10000,
      elevationGainInMeters: 150,
      elevationLossInMeters: 120,
      steps: 12000,
    };
    const result = transformActivity(withDistance);

    expect(result.distance_data).toBeDefined();
    expect(result.distance_data!.summary!.distance_meters).toBe(10000);
    expect(result.distance_data!.summary!.steps).toBe(12000);
    expect(result.distance_data!.summary!.elevation!.gain_actual_meters).toBe(150);
  });

  it("maps heart rate summary", () => {
    const withHR: GarminActivityExtended = {
      ...baseActivity,
      averageHeartRateInBeatsPerMinute: 155,
      maxHeartRateInBeatsPerMinute: 185,
    };
    const result = transformActivity(withHR);

    expect(result.heart_rate_data).toBeDefined();
    expect(result.heart_rate_data!.summary!.avg_hr_bpm).toBe(155);
    expect(result.heart_rate_data!.summary!.max_hr_bpm).toBe(185);
  });

  it("maps movement data with speed and cadence", () => {
    const withMovement: GarminActivityExtended = {
      ...baseActivity,
      averageSpeedInMetersPerSecond: 3.5,
      maxSpeedInMetersPerSecond: 5.2,
      averageRunCadenceInStepsPerMinute: 170,
      maxRunCadenceInStepsPerMinute: 190,
    };
    const result = transformActivity(withMovement);

    expect(result.movement_data).toBeDefined();
    expect(result.movement_data!.avg_speed_meters_per_second).toBe(3.5);
    expect(result.movement_data!.max_speed_meters_per_second).toBe(5.2);
    expect(result.movement_data!.avg_cadence_rpm).toBe(170);
    expect(result.movement_data!.max_cadence_rpm).toBe(190);
  });

  it("maps device data", () => {
    const withDevice: GarminActivityExtended = {
      ...baseActivity,
      deviceName: "Garmin Forerunner 265",
    };
    const result = transformActivity(withDevice);

    expect(result.device_data).toBeDefined();
    expect(result.device_data!.name).toBe("Garmin Forerunner 265");
  });

  it("maps position data", () => {
    const withPosition: GarminActivityExtended = {
      ...baseActivity,
      startingLatitudeInDegree: 37.7749,
      startingLongitudeInDegree: -122.4194,
    };
    const result = transformActivity(withPosition);

    expect(result.position_data).toBeDefined();
    expect(result.position_data!.start_pos_lat_lng_deg).toEqual([37.7749, -122.4194]);
  });

  it("maps power data", () => {
    const withPower: GarminActivityExtended = {
      ...baseActivity,
      activityType: "CYCLING",
      averagePowerInWatts: 200,
      maxPowerInWatts: 450,
    };
    const result = transformActivity(withPower);

    expect(result.power_data).toBeDefined();
    expect(result.power_data!.avg_watts).toBe(200);
    expect(result.power_data!.max_watts).toBe(450);
  });

  it("maps lap data", () => {
    const withLaps: GarminActivityExtended = {
      ...baseActivity,
      laps: [
        {
          startTimeInSeconds: 1700000000,
        },
        {
          startTimeInSeconds: 1700000600,
        },
      ],
    };
    const result = transformActivity(withLaps);

    expect(result.lap_data).toBeDefined();
    expect(result.lap_data!.laps).toHaveLength(2);
    expect(result.lap_data!.laps![0].start_time).toBe(
      new Date(1700000000 * 1000).toISOString(),
    );
  });

  it("uses summaryId as summary_id and falls back to activityId", () => {
    const withoutSummaryId = {
      ...baseActivity,
      summaryId: undefined as unknown as string,
    };
    const result = transformActivity(withoutSummaryId);
    expect(result.metadata.summary_id).toBe("12345");
  });
});
