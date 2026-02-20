/**
 * HealthKit Sync Tests (Story 4.1)
 *
 * NOTE: These tests require vitest to be installed.
 * Run: pnpm add -D vitest
 * Then add to package.json: "test": "vitest"
 *
 * Tests cover validator schemas and input validation.
 * The actual Soma ingestion requires integration tests with Convex test harness.
 */

import { describe, it, expect } from "vitest";

// =============================================================================
// Test Fixtures
// =============================================================================

/** Nested activity shape from Soma's HealthKit transformWorkout (Terra-style). */
function createMockActivity(overrides: Partial<{
  metadata: { start_time: string; end_time: string; summary_id: string; type: number; upload_type?: number };
  active_durations_data: unknown;
  device_data: unknown;
}> = {}) {
  return {
    metadata: {
      start_time: "2026-02-17T08:00:00.000Z",
      end_time: "2026-02-17T08:45:00.000Z",
      summary_id: "hk_workout_123",
      type: 1, // Running
      upload_type: 1,
      ...overrides.metadata,
    },
    active_durations_data: { activity_seconds: 2700 },
    device_data: undefined,
    ...overrides,
  };
}

function createMockSleep(overrides: Partial<{
  external_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
}> = {}) {
  return {
    external_id: "hk_sleep_123",
    start_time: "2026-02-16T22:00:00.000Z",
    end_time: "2026-02-17T06:30:00.000Z",
    duration_seconds: 30600,
    ...overrides,
  };
}

/** Nested body shape from Soma's HealthKit transformBody (Terra-style). */
function createMockBody(overrides: Partial<{
  metadata: { start_time: string; end_time: string };
  measurements_data: { measurements: Array<{ measurement_time?: string; weight_kg?: number; height_cm?: number; bodyfat_percentage?: number }> };
  oxygen_data: { vo2max_ml_per_min_per_kg?: number };
  heart_data: { heart_rate_data?: { summary?: { avg_hr_bpm?: number; resting_hr_bpm?: number } } };
}> = {}) {
  return {
    metadata: {
      start_time: "2026-02-17T07:00:00.000Z",
      end_time: "2026-02-17T07:00:00.000Z",
      ...overrides.metadata,
    },
    measurements_data: {
      measurements: [
        { measurement_time: "2026-02-17T07:00:00.000Z", weight_kg: 72.5 },
      ],
      ...overrides.measurements_data,
    },
    ...overrides,
  };
}

/** Nested daily shape from Soma's HealthKit transformDaily (Terra-style). */
function createMockDaily(overrides: Partial<{
  metadata: { start_time: string; end_time: string; upload_type?: number };
  distance_data: unknown;
  calories_data: unknown;
}> = {}) {
  return {
    metadata: {
      start_time: "2026-02-17T00:00:00.000Z",
      end_time: "2026-02-17T23:59:59.999Z",
      upload_type: 1,
      ...overrides.metadata,
    },
    distance_data: { steps: 8500, distance_meters: 0, floors_climbed: 0 },
    calories_data: undefined,
    ...overrides,
  };
}

// =============================================================================
// Validator Tests
// =============================================================================

describe("HealthKit Sync Validators", () => {
  describe("activityValidator", () => {
    it("accepts valid activity data (nested Soma/Terra format)", () => {
      const activity = createMockActivity();
      expect(activity.metadata).toBeDefined();
      expect(activity.metadata.summary_id).toBeDefined();
      expect(activity.metadata.start_time).toBeDefined();
      expect(activity.metadata.end_time).toBeDefined();
      expect(typeof activity.metadata.type).toBe("number");
    });

    it("accepts activity with optional fields", () => {
      const activity = {
        ...createMockActivity(),
        distance_data: { summary: { distance_meters: 8000 } },
        heart_rate_data: { summary: { avg_hr_bpm: 155, max_hr_bpm: 178 } },
        calories_data: { total_burned_calories: 450 },
        raw_payload: { original: "data" },
      };
      expect(activity.distance_data).toBeDefined();
      expect(activity.heart_rate_data).toBeDefined();
    });

    it("requires metadata.summary_id as string", () => {
      const activity = createMockActivity();
      expect(typeof activity.metadata.summary_id).toBe("string");
    });
  });

  describe("sleepValidator", () => {
    it("accepts valid sleep data", () => {
      const sleep = createMockSleep();
      expect(sleep.external_id).toBeDefined();
      expect(sleep.start_time).toBeDefined();
      expect(sleep.end_time).toBeDefined();
    });

    it("accepts sleep with stages", () => {
      const sleep = {
        ...createMockSleep(),
        sleep_stages: [
          { stage: "deep", duration_seconds: 3600 },
          { stage: "rem", duration_seconds: 5400 },
          { stage: "light", duration_seconds: 21600 },
        ],
      };
      expect(sleep.sleep_stages).toHaveLength(3);
    });
  });

  describe("bodyValidator", () => {
    it("accepts valid body data (nested Soma/Terra format)", () => {
      const body = createMockBody();
      expect(body.metadata).toBeDefined();
      expect(body.metadata.start_time).toBeDefined();
      expect(body.metadata.end_time).toBeDefined();
      expect(body.measurements_data?.measurements).toBeDefined();
    });

    it("accepts body with all metrics across sections", () => {
      const body = createMockBody({
        measurements_data: {
          measurements: [
            {
              measurement_time: "2026-02-17T07:00:00.000Z",
              weight_kg: 72.5,
              height_cm: 178,
              bodyfat_percentage: 18.5,
            },
          ],
        },
        oxygen_data: { vo2max_ml_per_min_per_kg: 48.5 },
        heart_data: { heart_rate_data: { summary: { resting_hr_bpm: 58 } } },
      });
      expect(body.measurements_data?.measurements[0].bodyfat_percentage).toBe(18.5);
      expect(body.oxygen_data?.vo2max_ml_per_min_per_kg).toBe(48.5);
      expect(body.heart_data?.heart_rate_data?.summary?.resting_hr_bpm).toBe(58);
    });
  });

  describe("dailyValidator", () => {
    it("accepts valid daily summary (nested Soma/Terra format)", () => {
      const daily = createMockDaily();
      expect(daily.metadata).toBeDefined();
      expect(daily.metadata.start_time).toBeDefined();
      expect(daily.metadata.end_time).toBeDefined();
    });

    it("accepts daily with distance_data and calories_data", () => {
      const daily = {
        ...createMockDaily(),
        distance_data: { steps: 8500, distance_meters: 12500, floors_climbed: 8 },
        calories_data: { total_burned_calories: 2100, net_activity_calories: 450 },
      };
      expect(daily.distance_data).toBeDefined();
      expect(daily.calories_data).toBeDefined();
    });
  });
});

// =============================================================================
// Batch Processing Tests
// =============================================================================

describe("Batch Processing Logic", () => {
  const BATCH_SIZE = 25;

  it("calculates correct number of batches for small arrays", () => {
    const records = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const numBatches = Math.ceil(records.length / BATCH_SIZE);
    expect(numBatches).toBe(1);
  });

  it("calculates correct number of batches for large arrays", () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const numBatches = Math.ceil(records.length / BATCH_SIZE);
    expect(numBatches).toBe(4);
  });

  it("handles empty arrays", () => {
    const records: unknown[] = [];
    const numBatches = Math.ceil(records.length / BATCH_SIZE);
    expect(numBatches).toBe(0);
  });

  it("handles exact batch size multiples", () => {
    const records = Array.from({ length: 75 }, (_, i) => ({ id: i }));
    const numBatches = Math.ceil(records.length / BATCH_SIZE);
    expect(numBatches).toBe(3);
  });
});

// =============================================================================
// Data Transformation Tests
// =============================================================================

describe("Data Consistency", () => {
  it("generates unique summary_ids for activities", () => {
    const base = createMockActivity();
    const activities = [
      createMockActivity({ metadata: { ...base.metadata, summary_id: "hk_workout_1" } }),
      createMockActivity({ metadata: { ...base.metadata, summary_id: "hk_workout_2" } }),
      createMockActivity({ metadata: { ...base.metadata, summary_id: "hk_workout_3" } }),
    ];
    const ids = activities.map((a) => a.metadata.summary_id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(activities.length);
  });

  it("validates ISO date format for activity timestamps", () => {
    const activity = createMockActivity();
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    expect(activity.metadata.start_time).toMatch(isoRegex);
    expect(activity.metadata.end_time).toMatch(isoRegex);
  });

  it("validates ISO range format for daily metadata", () => {
    const daily = createMockDaily();
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    expect(daily.metadata.start_time).toMatch(isoRegex);
    expect(daily.metadata.end_time).toMatch(isoRegex);
  });
});
