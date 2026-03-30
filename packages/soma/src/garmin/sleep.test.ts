import { describe, expect, it } from "vitest";
import { transformSleep } from "./sleep.js";
import type { GarminSleepExtended } from "./types.js";

const baseSleep: GarminSleepExtended = {
  userId: "garmin_user_1",
  summaryId: "sleep_001",
  calendarDate: "2023-11-14",
  startTimeInSeconds: 1700000000,
  startTimeOffsetInSeconds: -18000,
  durationInSeconds: 28800, // 8 hours
  validation: "ENHANCED_FINAL",
};

describe("transformSleep", () => {
  it("maps metadata correctly", () => {
    const result = transformSleep(baseSleep);

    expect(result.metadata.summary_id).toBe("sleep_001");
    expect(result.metadata.start_time).toBe("2023-11-14T22:13:20.000Z");
    expect(result.metadata.end_time).toBe("2023-11-15T06:13:20.000Z");
    expect(result.metadata.upload_type).toBe(2); // ENHANCED_FINAL → Automatic
  });

  it("maps manual upload type", () => {
    const manual = { ...baseSleep, validation: "MANUAL" as const };
    const result = transformSleep(manual);
    expect(result.metadata.upload_type).toBe(1);
  });

  it("maps tentative as indeterminate", () => {
    const tentative = { ...baseSleep, validation: "AUTO_TENTATIVE" as const };
    const result = transformSleep(tentative);
    expect(result.metadata.upload_type).toBe(4);
  });

  it("maps sleep stage durations", () => {
    const withStages: GarminSleepExtended = {
      ...baseSleep,
      deepSleepDurationInSeconds: 7200,
      lightSleepDurationInSeconds: 14400,
      remSleepInSeconds: 5400,
      awakeDurationInSeconds: 1800,
    };
    const result = transformSleep(withStages);

    const durations = result.sleep_durations_data;
    expect(durations.asleep.duration_deep_sleep_state_seconds).toBe(7200);
    expect(durations.asleep.duration_light_sleep_state_seconds).toBe(14400);
    expect(durations.asleep.duration_REM_sleep_state_seconds).toBe(5400);
    expect(durations.asleep.duration_asleep_state_seconds).toBe(27000);
    expect(durations.awake!.duration_awake_state_seconds).toBe(1800);
    expect(durations.other!.duration_in_bed_seconds).toBe(28800);
  });

  it("maps sleep levels hypnogram", () => {
    const withLevels: GarminSleepExtended = {
      ...baseSleep,
      sleepLevelsMap: {
        deep: [
          { startTimeInSeconds: 1700003600, endTimeInSeconds: 1700007200 },
        ],
        light: [
          { startTimeInSeconds: 1700000000, endTimeInSeconds: 1700003600 },
        ],
        rem: [
          { startTimeInSeconds: 1700010800, endTimeInSeconds: 1700014400 },
        ],
        awake: [
          { startTimeInSeconds: 1700007200, endTimeInSeconds: 1700010800 },
        ],
      },
    };
    const result = transformSleep(withLevels);
    const samples = result.sleep_durations_data.hypnogram_samples;

    expect(samples).toBeDefined();
    expect(samples).toHaveLength(4);
    // Sorted by timestamp
    expect(samples![0].level).toBe(4); // Light
    expect(samples![1].level).toBe(5); // Deep
    expect(samples![2].level).toBe(1); // Awake
    expect(samples![3].level).toBe(6); // REM
  });

  it("maps respiration data", () => {
    const withResp: GarminSleepExtended = {
      ...baseSleep,
      averageRespirationInBreathsPerMinute: 16,
      lowestRespirationInBreathsPerMinute: 12,
      highestRespirationInBreathsPerMinute: 22,
      timeOffsetSleepRespiration: {
        "0": 16,
        "3600": 14,
        "7200": 12,
      },
    };
    const result = transformSleep(withResp);

    expect(result.respiration_data).toBeDefined();
    expect(result.respiration_data!.breaths_data!.avg_breaths_per_min).toBe(16);
    expect(result.respiration_data!.breaths_data!.samples).toHaveLength(3);
  });

  it("returns undefined respiration_data when no respiration fields", () => {
    const result = transformSleep(baseSleep);
    expect(result.respiration_data).toBeUndefined();
  });
});
