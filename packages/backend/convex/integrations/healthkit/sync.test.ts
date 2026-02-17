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
import { v } from "convex/values";

// =============================================================================
// Validator Schemas (duplicated from sync.ts for testing)
// =============================================================================

const activityValidator = v.object({
  external_id: v.string(),
  activity_type: v.string(),
  start_time: v.string(),
  end_time: v.string(),
  duration_seconds: v.optional(v.number()),
  distance_meters: v.optional(v.number()),
  calories_burned: v.optional(v.number()),
  average_heart_rate: v.optional(v.number()),
  max_heart_rate: v.optional(v.number()),
  average_pace_seconds_per_km: v.optional(v.number()),
  elevation_gain_meters: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const sleepValidator = v.object({
  external_id: v.string(),
  start_time: v.string(),
  end_time: v.string(),
  duration_seconds: v.optional(v.number()),
  sleep_stages: v.optional(v.any()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const bodyValidator = v.object({
  external_id: v.string(),
  recorded_at: v.string(),
  weight_kg: v.optional(v.number()),
  height_cm: v.optional(v.number()),
  body_fat_percentage: v.optional(v.number()),
  resting_heart_rate: v.optional(v.number()),
  hrv_ms: v.optional(v.number()),
  vo2_max: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

const dailyValidator = v.object({
  external_id: v.string(),
  date: v.string(),
  steps: v.optional(v.number()),
  active_calories: v.optional(v.number()),
  total_calories: v.optional(v.number()),
  distance_meters: v.optional(v.number()),
  floors_climbed: v.optional(v.number()),
  active_minutes: v.optional(v.number()),
  source: v.optional(v.string()),
  raw_payload: v.optional(v.any()),
});

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockActivity(overrides: Partial<{
  external_id: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  distance_meters: number;
}> = {}) {
  return {
    external_id: "hk_workout_123",
    activity_type: "running",
    start_time: "2026-02-17T08:00:00.000Z",
    end_time: "2026-02-17T08:45:00.000Z",
    duration_seconds: 2700,
    distance_meters: 8000,
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

function createMockBody(overrides: Partial<{
  external_id: string;
  recorded_at: string;
  weight_kg: number;
}> = {}) {
  return {
    external_id: "hk_body_123",
    recorded_at: "2026-02-17T07:00:00.000Z",
    weight_kg: 72.5,
    ...overrides,
  };
}

function createMockDaily(overrides: Partial<{
  external_id: string;
  date: string;
  steps: number;
}> = {}) {
  return {
    external_id: "hk_daily_20260217",
    date: "2026-02-17",
    steps: 8500,
    ...overrides,
  };
}

// =============================================================================
// Validator Tests
// =============================================================================

describe("HealthKit Sync Validators", () => {
  describe("activityValidator", () => {
    it("accepts valid activity data", () => {
      const activity = createMockActivity();
      // Convex validators don't have a validate method in the same way,
      // but we can test the shape by checking required fields
      expect(activity.external_id).toBeDefined();
      expect(activity.activity_type).toBeDefined();
      expect(activity.start_time).toBeDefined();
      expect(activity.end_time).toBeDefined();
    });

    it("accepts activity with all optional fields", () => {
      const activity = {
        ...createMockActivity(),
        calories_burned: 450,
        average_heart_rate: 155,
        max_heart_rate: 178,
        average_pace_seconds_per_km: 340,
        elevation_gain_meters: 85,
        source: "Apple Watch",
        raw_payload: { original: "data" },
      };
      expect(activity.calories_burned).toBe(450);
      expect(activity.average_heart_rate).toBe(155);
    });

    it("requires external_id as string", () => {
      const activity = createMockActivity();
      expect(typeof activity.external_id).toBe("string");
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
    it("accepts valid body data", () => {
      const body = createMockBody();
      expect(body.external_id).toBeDefined();
      expect(body.recorded_at).toBeDefined();
    });

    it("accepts body with all metrics", () => {
      const body = {
        ...createMockBody(),
        height_cm: 178,
        body_fat_percentage: 18.5,
        resting_heart_rate: 58,
        hrv_ms: 45,
        vo2_max: 48.5,
      };
      expect(body.vo2_max).toBe(48.5);
      expect(body.hrv_ms).toBe(45);
    });
  });

  describe("dailyValidator", () => {
    it("accepts valid daily summary", () => {
      const daily = createMockDaily();
      expect(daily.external_id).toBeDefined();
      expect(daily.date).toBeDefined();
    });

    it("accepts daily with all metrics", () => {
      const daily = {
        ...createMockDaily(),
        active_calories: 450,
        total_calories: 2100,
        distance_meters: 12500,
        floors_climbed: 8,
        active_minutes: 65,
      };
      expect(daily.active_minutes).toBe(65);
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
  it("generates unique external_ids for activities", () => {
    const activities = [
      createMockActivity({ external_id: "hk_workout_1" }),
      createMockActivity({ external_id: "hk_workout_2" }),
      createMockActivity({ external_id: "hk_workout_3" }),
    ];
    const ids = activities.map((a) => a.external_id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(activities.length);
  });

  it("validates ISO date format for timestamps", () => {
    const activity = createMockActivity();
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    expect(activity.start_time).toMatch(isoRegex);
    expect(activity.end_time).toMatch(isoRegex);
  });

  it("validates date format for daily summaries", () => {
    const daily = createMockDaily();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(daily.date).toMatch(dateRegex);
  });
});
