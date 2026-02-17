# Story 4.2: Mock Data Generators for Development

Status: done

> **Note:** Soma component does NOT provide mock data generators. This story is still needed for development/testing.

## Story

As a developer,
I want to seed the database with realistic mock activity data,
So that I can test the inference engine, visualizations, and full flow without real wearable devices.

## Acceptance Criteria

1. **Given** the developer wants to test with mock data
   **When** the seed mutation is called
   **Then** realistic activities are generated following the Soma `activities` table schema exactly

2. **Given** mock activities are generated
   **When** stored in the database
   **Then** all Soma/Terra-aligned fields are populated appropriately:
   - Metadata: source, startTime, endTime, activityType, name
   - Distance: distanceMeters, elevationGainMeters, steps
   - Movement: durationSeconds, avgSpeedMetersPerSecond, avgPaceMinutesPerKm, avgCadenceRpm
   - Heart Rate: avgHeartRateBpm, maxHeartRateBpm, HR zones
   - Calories: totalBurnedCalories, netActivityCalories
   - Training Load: trainingStressScore, perceivedExertion

3. **Given** mock data is generated
   **When** the inference engine runs (Story 5.4)
   **Then** currentState calculations work correctly with mock data

4. **Given** developer wants different training profiles
   **When** profile preset is selected
   **Then** appropriate data patterns are generated:
   - "beginner": 2-3 runs/week, shorter distances, slower paces
   - "intermediate": 4 runs/week, varied distances, moderate paces
   - "advanced": 5-6 runs/week, higher volume, faster paces

5. **Given** mock data exists
   **When** cleanup is requested
   **Then** all activities with source="mock" are deleted
   **And** real data (source="healthkit", "strava") is preserved

6. **Given** user selects HealthKit integration
   **Then** no mock data is used
   **And** the real integration pipeline is used instead (see Story 4.1)

## Tasks / Subtasks

- [x] **Task 1: Create mock activity generator** (AC: #1, #2)
  - [x] Create `packages/backend/convex/lib/mock-data-generator.ts`
  - [x] Implement `generateMockActivity(params)` returning full Soma `activities` schema
  - [x] Populate all Terra-aligned fields with realistic values
  - [x] Calculate derived fields (pace from distance/duration, calories from effort)

- [x] **Task 2: Create training profile presets** (AC: #4)
  - [x] Define `TrainingProfile` type: "beginner" | "intermediate" | "advanced"
  - [x] Implement profile-specific parameters:
    - Weekly frequency, distance ranges, pace ranges
    - Heart rate patterns, training load progression
  - [x] Add `generateTrainingBlock(profile, weeks)` function

- [x] **Task 3: Create seed mutation** (AC: #1, #2)
  - [x] Create `packages/backend/convex/seeds/mock-activities.ts`
  - [x] Implement `seedMockActivities` mutation
  - [x] Accept params: runnerId, profile, weeks (default 12)
  - [x] Set `source: "mock"` for all generated activities
  - [x] Batch insert for performance (chunks of 50)

- [x] **Task 4: Create cleanup mutation** (AC: #5)
  - [x] Implement `clearMockActivities` mutation
  - [x] Delete only where `source === "mock"`
  - [x] Return count of deleted records

- [x] **Task 5: Add HR zone distribution** (AC: #2)
  - [x] Calculate realistic HR zone time based on run type
  - [x] Easy runs: 75% Zone 2, 20% Zone 3, 5% Zone 1
  - [x] Tempo runs: 5% Zone 1, 15% Zone 2, 30% Zone 3, 45% Zone 4, 5% Zone 5
  - [x] Populate hrZone1-5Minutes fields (matching actual schema)

## Dev Notes

### Soma Table Schema Compliance (CRITICAL)

All generated activities MUST follow the Soma `activities` table schema at `packages/backend/convex/table/activities.ts`.

**Required fields for every mock activity:**

```typescript
{
  // Foreign keys
  runnerId: Id<"runners">,
  userId: Id<"users">,

  // Metadata
  externalId: `mock-${uuid()}`,
  source: "mock",                    // ALWAYS "mock" for generated data
  startTime: number,                 // Unix ms
  endTime: number,                   // Unix ms
  activityType: "running",
  name: string,                      // "Easy Run", "Long Run", etc.

  // Distance (Terra: distance_data)
  distanceMeters: number,
  steps: number,                     // ~1400 steps/km typical
  elevationGainMeters: number,       // 0-50m for flat, more for hilly

  // Movement (Terra: movement_data)
  durationSeconds: number,
  movingTimeSeconds: number,         // ~95% of duration
  avgSpeedMetersPerSecond: number,
  avgPaceMinutesPerKm: number,       // 5.0-7.0 typical
  avgCadenceRpm: number,             // 160-180 typical

  // Heart Rate (Terra: heart_rate_data)
  avgHeartRateBpm: number,           // 130-165 depending on effort
  maxHeartRateBpm: number,           // avg + 15-30
  minHeartRateBpm: number,           // ~100 at start
  hrZone1Seconds: number,            // Warm-up time
  hrZone2Seconds: number,            // Easy effort
  hrZone3Seconds: number,            // Moderate effort
  hrZone4Seconds: number,            // Hard effort
  hrZone5Seconds: number,            // Max effort

  // Calories (Terra: calories_data)
  totalBurnedCalories: number,       // ~60-80 cal/km
  netActivityCalories: number,       // total - BMR portion

  // Training Load (Terra: strain_data)
  trainingStressScore: number,       // TSS: 30-150 typical
  perceivedExertion: number,         // RPE 1-10

  // Timestamps
  importedAt: Date.now(),
}
```

### Training Profile Parameters

```typescript
const PROFILES = {
  beginner: {
    runsPerWeek: [2, 3],
    distanceKm: { easy: [3, 5], medium: [5, 7], long: [8, 10] },
    paceMinPerKm: { easy: [7, 8], medium: [6.5, 7], long: [7, 7.5] },
    restWeekFrequency: 3,
  },
  intermediate: {
    runsPerWeek: [4, 5],
    distanceKm: { easy: [5, 8], medium: [8, 12], long: [15, 18] },
    paceMinPerKm: { easy: [6, 6.5], medium: [5.5, 6], long: [6, 6.5] },
    restWeekFrequency: 4,
  },
  advanced: {
    runsPerWeek: [5, 6],
    distanceKm: { easy: [8, 10], medium: [12, 15], long: [20, 25] },
    paceMinPerKm: { easy: [5, 5.5], medium: [4.5, 5], long: [5, 5.5] },
    restWeekFrequency: 4,
  },
};
```

### Realistic Data Correlations

**Pace -> Heart Rate:**
```typescript
// Faster pace = higher HR
const paceMinPerKm = durationSeconds / 60 / (distanceMeters / 1000);
const hrBase = 200 - paceMinPerKm * 10; // ~140 at 6:00/km, ~150 at 5:00/km
const avgHeartRateBpm = hrBase + random(-5, 5);
```

**Distance -> Calories:**
```typescript
// ~70 cal/km average, varies by pace
const caloriesPerKm = 60 + (7 - paceMinPerKm) * 5; // Faster = more cal
const totalBurnedCalories = (distanceMeters / 1000) * caloriesPerKm;
```

**Distance -> Steps:**
```typescript
// ~1400 steps/km average
const stepsPerKm = 1300 + random(0, 200);
const steps = Math.round((distanceMeters / 1000) * stepsPerKm);
```

**Duration -> HR Zones:**
```typescript
// Easy run distribution
const hrZone2Seconds = durationSeconds * 0.7; // 70% in Zone 2
const hrZone3Seconds = durationSeconds * 0.25; // 25% in Zone 3
const hrZone1Seconds = durationSeconds * 0.05; // 5% warm-up
```

### File Structure

```
packages/backend/convex/
  lib/
    mock-data-generator.ts    # Core generation logic
  seeds/
    mock-activities.ts        # Seed/cleanup mutations
```

### Weekly Pattern Algorithm

```typescript
function generateTrainingWeek(profile: TrainingProfile, weekNumber: number) {
  const isRestWeek = weekNumber % profile.restWeekFrequency === 0;
  const runsThisWeek = isRestWeek
    ? Math.max(2, profile.runsPerWeek[0] - 1)
    : randomInRange(profile.runsPerWeek);

  const activities = [];

  // Always include one long run (unless rest week)
  if (!isRestWeek) {
    activities.push(generateRun("long", profile));
  }

  // Fill remaining with easy/medium mix (70/30)
  for (let i = activities.length; i < runsThisWeek; i++) {
    const type = Math.random() < 0.7 ? "easy" : "medium";
    activities.push(generateRun(type, profile));
  }

  return activities;
}
```

### Testing Requirements

**Verification:**
- Seed 12 weeks, verify 36-72 activities created (profile dependent)
- Verify all schema fields populated with valid values
- Verify pace/HR/calories correlations are realistic
- Verify cleanup removes only mock data

**Integration:**
- Verify mock data works with inference engine (Story 5.4)
- Verify mock data renders correctly in visualization components
- Verify Soma queries return mock data correctly

### Dependencies

- **Soma Component:** Activities table schema must match Soma's table definition
- **Story 5.4:** Mock data will be consumed by inference engine

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2]
- [Soma Activities Table: packages/backend/convex/table/activities.ts]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#activities]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Typecheck verified: new files compile without errors (pre-existing Soma/vitest module resolution issues unrelated)

### Completion Notes List

- **2026-02-17: Full implementation completed**
- **Task 1:** Created `mock-data-generator.ts` with `generateMockActivity()` function matching actual `activities` table schema (not the outdated Dev Notes schema)
- **Task 2:** Implemented three training profiles (beginner, intermediate, advanced) with profile-specific:
  - Runs per week ranges
  - Distance ranges by run type (easy, medium, long, tempo, intervals)
  - Pace ranges by run type
  - Rest week frequency
  - Base heart rate (fitness level indicator)
- **Task 3:** Created `seedMockActivities` mutation accepting profile and weeks params, batch inserts (50/batch)
- **Task 4:** Created `clearMockActivities` mutation - deletes only source="mock", preserves real data
- **Task 5:** HR zone distribution implemented per run type:
  - Easy/Long: 5% Z1, 75% Z2, 20% Z3
  - Medium: 5% Z1, 50% Z2, 40% Z3, 5% Z4
  - Tempo: 5% Z1, 15% Z2, 30% Z3, 45% Z4, 5% Z5
  - Intervals: 10% Z1, 20% Z2, 20% Z3, 30% Z4, 20% Z5
- **AC #6 compliance:** Mock data generation is completely separate from HealthKit - no mock HealthKit integration exists

### Realistic Correlations Implemented

- Pace → Heart Rate: HR increases as pace decreases (faster = higher HR)
- Distance → Calories: ~70 cal/km base, faster = more calories
- Distance → Steps: ~1400 steps/km average
- Run Type → Training Load (TSS): intensity factors per run type

### File List

- `packages/backend/convex/lib/mock-data-generator.ts` - NEW: Core mock data generation logic
- `packages/backend/convex/seeds/mock-activities.ts` - NEW: Seed/cleanup mutations
