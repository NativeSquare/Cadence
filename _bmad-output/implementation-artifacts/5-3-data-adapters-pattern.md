# Story 5.3: Data Adapters Pattern

Status: ready-for-dev

## Story

As a developer,
I want data adapters for each provider,
So that the system is source-agnostic and extensible.

## Acceptance Criteria

1. **AC1: Data Adapter Interface** - A data adapter interface exists:
   ```typescript
   interface DataAdapter {
     source: string; // "healthkit" | "strava" | "garmin" | "manual"
     normalizeActivity(raw: any): Partial<Activity>;
     normalizeSleep?(raw: any): Partial<SleepSession>;
     normalizeBody?(raw: any): Partial<BodyMeasurement>;
     fetchActivities?(userId: string, dateRange: DateRange): Promise<Activity[]>;
   }
   ```

2. **AC2: HealthKit Adapter** - Adapter exists for HealthKit (iOS native):
   - Normalizes HKWorkout to Activity format
   - Normalizes HKCategorySample (sleep) to SleepSession
   - Normalizes HKQuantitySample (body measurements) to BodyMeasurement
   - Handles missing fields gracefully

3. **AC3: Manual Entry Adapter** - Adapter exists for manual entry:
   - Accepts user-logged activities
   - Sets source = "manual"
   - Calculates derived fields (pace from distance/duration)

4. **AC4: Adapter Requirements** - All adapters:
   - Set `source` field to provider name
   - Handle missing fields gracefully (optional fields)
   - Preserve `rawPayload` for debugging
   - Calculate derived fields (pace from distance/duration)

5. **AC5: Adapter Registry** - Registry exists for adapter management:
   - `getAdapter(source: string): DataAdapter`
   - `normalizeAndStore(source, rawData, runnerId)`

## Tasks / Subtasks

- [ ] Task 1: Create adapter types and interface (AC: 1)
  - [ ] Create `packages/backend/convex/lib/adapters/types.ts`
  - [ ] Define DataAdapter interface
  - [ ] Define Activity, SleepSession, BodyMeasurement partial types
  - [ ] Define DateRange type

- [ ] Task 2: Create HealthKit adapter (AC: 2, 4)
  - [ ] Create `packages/backend/convex/lib/adapters/healthkit.ts`
  - [ ] Implement normalizeActivity for HKWorkout
  - [ ] Implement normalizeSleep for HKCategorySample
  - [ ] Implement normalizeBody for HKQuantitySample
  - [ ] Add derived field calculations (pace, speed)

- [ ] Task 3: Create manual entry adapter (AC: 3, 4)
  - [ ] Create `packages/backend/convex/lib/adapters/manual.ts`
  - [ ] Implement normalizeActivity for user input
  - [ ] Calculate derived fields from distance/duration
  - [ ] Set source = "manual"

- [ ] Task 4: Create adapter registry (AC: 5)
  - [ ] Create `packages/backend/convex/lib/adapters/registry.ts`
  - [ ] Implement getAdapter(source) function
  - [ ] Implement normalizeAndStore mutation helper
  - [ ] Register healthkit and manual adapters

- [ ] Task 5: Create index exports (AC: 1-5)
  - [ ] Create `packages/backend/convex/lib/adapters/index.ts`
  - [ ] Export all types and adapters
  - [ ] Verify imports work from convex functions

## Dev Notes

### Architecture Compliance

**CRITICAL**: This is the Wearable Adapter Layer from architecture-backend-v2.md:
- Built as a reusable Convex component
- Each source can potentially affect ALL historical tables
- Future: Replace individual adapters with Terra webhook handler

### Data Flow

```
                     ┌──────────────┐
                     │  RAW DATA    │
                     │ (HealthKit)  │
                     └──────┬───────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADAPTER LAYER                                 │
│                                                                  │
│  healthkitAdapter.normalizeActivity(raw) → Partial<Activity>    │
│  healthkitAdapter.normalizeSleep(raw) → Partial<SleepSession>   │
│  manualAdapter.normalizeActivity(raw) → Partial<Activity>       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │   HISTORICAL TABLES      │
               │ (activities, sleep, etc) │
               └─────────────────────────┘
```

### HealthKit Data Mapping

From iOS HealthKit to our schema:

| HealthKit Field | Our Field |
|-----------------|-----------|
| HKWorkout.workoutActivityType | activityType |
| HKWorkout.startDate | startTime |
| HKWorkout.endDate | endTime |
| HKWorkout.totalDistance | distanceMeters |
| HKWorkout.duration | durationSeconds |
| HKWorkout.totalEnergyBurned | calories |
| HKQuantityTypeIdentifier.heartRate | avgHeartRate |
| HKQuantityTypeIdentifier.runningPower | avgPower |
| HKQuantityTypeIdentifier.stepCount | steps |

### Derived Field Calculations

```typescript
// Pace calculation
const avgPaceSecondsPerKm = distanceMeters > 0
  ? (durationSeconds / (distanceMeters / 1000))
  : undefined;

// Speed calculation
const avgSpeedKmh = durationSeconds > 0
  ? ((distanceMeters / 1000) / (durationSeconds / 3600))
  : undefined;
```

### Project Structure Notes

**Target Files:**
- `packages/backend/convex/lib/adapters/types.ts` (NEW)
- `packages/backend/convex/lib/adapters/healthkit.ts` (NEW)
- `packages/backend/convex/lib/adapters/manual.ts` (NEW)
- `packages/backend/convex/lib/adapters/registry.ts` (NEW)
- `packages/backend/convex/lib/adapters/index.ts` (NEW)

**Related Stories:**
- Depends on Story 5.1 (Historical Data Tables) for table schemas
- Used by Story 4.1 (HealthKit Integration) for data import

### References

- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#Wearable-Adapter-Layer]
- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#Data-Flow-Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.3]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Table-activities]

### Detailed Specifications

#### DataAdapter Interface

```typescript
// packages/backend/convex/lib/adapters/types.ts

import type { Doc, Id } from "../../_generated/dataModel";

export type DateRange = {
  start: number;  // Unix timestamp
  end: number;    // Unix timestamp
};

export type PartialActivity = Omit<Doc<"activities">, "_id" | "_creationTime">;
export type PartialSleepSession = Omit<Doc<"sleepSessions">, "_id" | "_creationTime">;
export type PartialBodyMeasurement = Omit<Doc<"bodyMeasurements">, "_id" | "_creationTime">;
export type PartialDailySummary = Omit<Doc<"dailySummaries">, "_id" | "_creationTime">;

export interface DataAdapter {
  /**
   * Source identifier for this adapter
   */
  source: "healthkit" | "strava" | "garmin" | "coros" | "manual" | "terra";

  /**
   * Normalize raw activity data to our schema.
   * Handles missing fields gracefully.
   */
  normalizeActivity(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialActivity;

  /**
   * Normalize raw sleep data to our schema (optional).
   */
  normalizeSleep?(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialSleepSession;

  /**
   * Normalize raw body measurement to our schema (optional).
   */
  normalizeBody?(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialBodyMeasurement;

  /**
   * Aggregate daily summary from day's data (optional).
   */
  normalizeDailySummary?(
    date: string,
    activities: PartialActivity[],
    sleep?: PartialSleepSession,
    body?: PartialBodyMeasurement[],
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialDailySummary;

  /**
   * Fetch activities from external API (optional, for OAuth sources).
   */
  fetchActivities?(
    userId: Id<"users">,
    dateRange: DateRange
  ): Promise<unknown[]>;
}
```

#### HealthKit Adapter Example

```typescript
// packages/backend/convex/lib/adapters/healthkit.ts

import type { DataAdapter, PartialActivity } from "./types";
import type { Id } from "../../_generated/dataModel";

/**
 * HealthKit data adapter.
 * Normalizes iOS HealthKit data to our schema.
 */
export const healthkitAdapter: DataAdapter = {
  source: "healthkit",

  normalizeActivity(raw: unknown, runnerId: Id<"runners">, userId: Id<"users">): PartialActivity {
    const data = raw as HealthKitWorkout;
    const now = Date.now();

    // Calculate derived fields
    const distanceMeters = data.totalDistance ?? undefined;
    const durationSeconds = data.duration ?? undefined;

    const avgPaceSecondsPerKm = distanceMeters && durationSeconds && distanceMeters > 0
      ? Math.round(durationSeconds / (distanceMeters / 1000))
      : undefined;

    const avgSpeedKmh = durationSeconds && distanceMeters && durationSeconds > 0
      ? Math.round(((distanceMeters / 1000) / (durationSeconds / 3600)) * 100) / 100
      : undefined;

    return {
      runnerId,
      userId,
      source: "healthkit",
      externalId: data.uuid,
      startTime: new Date(data.startDate).getTime(),
      endTime: new Date(data.endDate).getTime(),
      activityType: mapHealthKitActivityType(data.workoutActivityType),
      name: data.name,
      distanceMeters,
      durationSeconds,
      elevationGainMeters: data.totalElevationGain,
      steps: data.stepCount,
      avgPaceSecondsPerKm,
      avgSpeedKmh,
      avgHeartRate: data.averageHeartRate,
      maxHeartRate: data.maxHeartRate,
      calories: data.totalEnergyBurned,
      avgCadence: data.averageCadence,
      rawPayload: JSON.stringify(data),
      importedAt: now,
      lastSyncedAt: now,
    };
  },

  normalizeSleep(raw: unknown, runnerId: Id<"runners">, userId: Id<"users">) {
    const data = raw as HealthKitSleep;
    // Implementation for sleep normalization
    return {
      runnerId,
      userId,
      source: "healthkit",
      // ... sleep fields
    };
  },
};

// Helper: Map HealthKit activity types to our enum
function mapHealthKitActivityType(hkType: number): string {
  const mapping: Record<number, string> = {
    37: "running",    // HKWorkoutActivityType.running
    13: "cycling",    // HKWorkoutActivityType.cycling
    46: "swimming",   // HKWorkoutActivityType.swimming
    52: "walking",    // HKWorkoutActivityType.walking
    // ... more mappings
  };
  return mapping[hkType] ?? "other";
}

// Type for raw HealthKit data (from React Native bridge)
interface HealthKitWorkout {
  uuid: string;
  workoutActivityType: number;
  startDate: string;
  endDate: string;
  duration?: number;
  totalDistance?: number;
  totalElevationGain?: number;
  totalEnergyBurned?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averageCadence?: number;
  stepCount?: number;
  name?: string;
}

interface HealthKitSleep {
  uuid: string;
  startDate: string;
  endDate: string;
  value: number;  // Sleep analysis value
}
```

#### Adapter Registry

```typescript
// packages/backend/convex/lib/adapters/registry.ts

import type { DataAdapter } from "./types";
import { healthkitAdapter } from "./healthkit";
import { manualAdapter } from "./manual";

const adapters: Record<string, DataAdapter> = {
  healthkit: healthkitAdapter,
  manual: manualAdapter,
  // Future: strava, garmin, coros, terra
};

/**
 * Get adapter for a given source.
 * Throws if adapter not found.
 */
export function getAdapter(source: string): DataAdapter {
  const adapter = adapters[source];
  if (!adapter) {
    throw new Error(`No adapter found for source: ${source}`);
  }
  return adapter;
}

/**
 * Register a new adapter (for extensibility).
 */
export function registerAdapter(adapter: DataAdapter): void {
  adapters[adapter.source] = adapter;
}

/**
 * Get all registered source names.
 */
export function getSupportedSources(): string[] {
  return Object.keys(adapters);
}
```

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
