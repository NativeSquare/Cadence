# Story 4.1: HealthKit Integration (iOS)

Status: ready-for-dev

## Story

As an iOS user,
I want to grant HealthKit access,
So that the coach can analyze my Apple Watch running data.

## Acceptance Criteria

1. **Given** the user taps "Connect Apple Watch" on iOS
   **When** HealthKit permission is requested
   **Then** the native iOS permission dialog appears (FR7)
   **And** requested data types include: running workouts, distance, duration, heart rate, HRV

2. **Given** permission is granted
   **When** HealthKit access is confirmed
   **Then** connections.healthkitConnected is set to true
   **And** data fetch is triggered immediately
   **And** sync status is shown to the user

3. **Given** historical data is fetched
   **When** workouts are retrieved
   **Then** last 90 days of running workouts are fetched
   **And** each workout is normalized to our schema
   **And** activities are stored in the activities table

4. **Given** permission is denied
   **When** the user declines
   **Then** graceful fallback to skip path
   **And** guidance for enabling later is provided

## Tasks / Subtasks

- [ ] **Task 1: Create activities table schema** (AC: #3)
  - [ ] Create `packages/backend/convex/schema/activities.ts` with Terra-aligned fields
  - [ ] Add activities table to `packages/backend/convex/schema.ts`
  - [ ] Create indexes for runnerId, startTime, source queries

- [ ] **Task 2: Extend HealthKit data fetching** (AC: #1, #3)
  - [ ] Add HRV permission to READ_PERMISSIONS in `healthkit.ts`
  - [ ] Create function to fetch heart rate samples per workout
  - [ ] Return raw workout data alongside aggregates from `importHealthKitData()`

- [ ] **Task 3: Create normalization pipeline** (AC: #3)
  - [ ] Create `packages/backend/convex/lib/normalizers/healthkit.ts`
  - [ ] Map HealthKit fields to activities schema:
    - workoutActivityType -> activityType ("running")
    - duration -> durationSeconds
    - totalDistance -> distanceMeters
    - totalEnergyBurned -> calories
    - metadata.HKAverageHeartRate -> avgHeartRate
  - [ ] Calculate avgPaceSecondsPerKm from distance/duration

- [ ] **Task 4: Create batch upsert backend action** (AC: #3)
  - [ ] Create `packages/backend/convex/integrations/healthkit/sync.ts`
  - [ ] Implement `syncHealthKitActivities` mutation
  - [ ] Handle upsert by externalId (prevent duplicates)
  - [ ] Store rawPayload for debugging

- [ ] **Task 5: Update Runner Object on sync** (AC: #2)
  - [ ] Set `connections.healthkitConnected = true`
  - [ ] Set `connections.healthkitLastSync = Date.now()`
  - [ ] Trigger inference engine to recalculate currentState (FUTURE - placeholder)

- [ ] **Task 6: Update useHealthKit hook** (AC: #2)
  - [ ] Return sync progress/status for UI feedback
  - [ ] Call batch upsert after data fetch
  - [ ] Handle partial sync failures gracefully

- [ ] **Task 7: Add permission denied fallback** (AC: #4)
  - [ ] Detect denial vs not-determined states
  - [ ] Provide UI guidance for enabling via iOS Settings
  - [ ] Allow retry flow from settings screen

## Dev Notes

### CRITICAL GAP ANALYSIS

**What EXISTS (already implemented):**
- `apps/native/src/lib/healthkit.ts` - Full HealthKit client with:
  - Authorization for running data types
  - Query running workouts (last 90 days)
  - Query VO2max
  - Calculate runner aggregates (weekly volume, consistency, pace, etc.)
- `apps/native/src/hooks/use-healthkit.ts` - React hook for connecting
- `packages/backend/convex/healthkit.ts` - Backend mutation storing aggregates in runner profile

**What's MISSING (this story must implement):**
1. **Activities table** - Currently only stores aggregates in runner profile, NOT individual workouts
2. **Per-workout storage** - Each workout needs to be normalized and stored separately
3. **Heart rate & HRV data** - Not being fetched/stored per-workout
4. **healthkitLastSync timestamp** - `connections.healthkitLastSync` not being set
5. **Sync status UI feedback** - User needs visual confirmation of sync progress

### Architecture Compliance

**Data Model:** Follow [data-model-comprehensive.md](../_bmad-output/planning-artifacts/data-model-comprehensive.md) exactly for activities table schema.

**Convex Patterns:**
- Use mutations for data writes (not actions) when possible
- Batch operations in chunks of 50-100 to avoid timeouts
- Store rawPayload as JSON string for debugging

**Source field values:** Use `"healthkit"` for all HealthKit-sourced activities.

### Library & Framework Requirements

**Package:** `@kingstinct/react-native-healthkit` (already installed)

**CRITICAL - EAS Build Required:**
- HealthKit DOES NOT work in Expo Go
- Must use EAS Build with custom dev client
- Existing app.json/eas.json already configured

**Authorization Warning:**
> Failing to request authorization, or requesting a permission you haven't requested yet, will result in the app crashing. This is easy to miss - for example by requesting authorization in the same component where you have a hook trying to fetch data right away.

**Current READ_PERMISSIONS in healthkit.ts:**
```typescript
const READ_PERMISSIONS = [
  "HKWorkoutTypeIdentifier",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierVO2Max",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKQuantityTypeIdentifierRunningSpeed",
] as const;
```

**ADD these permissions:**
- `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` (HRV)

### File Structure Requirements

**New files to create:**
```
packages/backend/convex/
  schema/
    activities.ts          # Activities table definition
  lib/
    normalizers/
      healthkit.ts         # HealthKit -> activities mapping
  integrations/
    healthkit/
      sync.ts              # Batch sync mutation
```

**Files to modify:**
```
packages/backend/convex/
  schema.ts               # Add activities import
  healthkit.ts            # Add healthkitLastSync update
apps/native/src/
  lib/healthkit.ts        # Add HRV permission, return raw workouts
  hooks/use-healthkit.ts  # Add sync progress, call batch upsert
```

### Activities Table Schema (from data-model-comprehensive.md)

```typescript
// packages/backend/convex/schema/activities.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const activities = defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Metadata
  externalId: v.optional(v.string()),  // HealthKit UUID
  source: v.string(),                   // "healthkit"
  startTime: v.number(),                // Unix timestamp (ms)
  endTime: v.number(),                  // Unix timestamp (ms)
  activityType: v.string(),             // "running"
  name: v.optional(v.string()),         // "Morning Run"

  // Distance data
  distanceMeters: v.optional(v.number()),
  durationSeconds: v.optional(v.number()),
  elevationGainMeters: v.optional(v.number()),
  steps: v.optional(v.number()),

  // Pace & Speed
  avgPaceSecondsPerKm: v.optional(v.number()),
  maxPaceSecondsPerKm: v.optional(v.number()),
  avgSpeedMps: v.optional(v.number()),
  maxSpeedMps: v.optional(v.number()),

  // Heart Rate
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  restingHeartRate: v.optional(v.number()),
  hrvMs: v.optional(v.number()),

  // Calories
  totalBurnedCalories: v.optional(v.number()),

  // Running metrics
  avgCadence: v.optional(v.number()),

  // Debug
  rawPayload: v.optional(v.string()),  // JSON string
  importedAt: v.number(),
})
  .index("by_runnerId", ["runnerId"])
  .index("by_runnerId_startTime", ["runnerId", "startTime"])
  .index("by_source", ["source"])
  .index("by_externalId", ["externalId"]);
```

### Testing Requirements

**Manual Testing (EAS Build required):**
1. Build with `eas build --profile development --platform ios`
2. Install on physical iOS device with Apple Watch
3. Test permission grant flow
4. Test permission denial flow
5. Verify activities appear in Convex dashboard
6. Verify no duplicates on re-sync

**Unit Tests:**
- Normalization function tests (pure functions)
- Pace calculation tests

### Sample HealthKit Export Data

The user has exported HealthKit data showing this structure:
```json
{
  "rawWorkouts": [
    {
      "sourceId": "840E2C83-7B60-461D-996B-2E75B866DCAC",
      "startDate": 1770042614486,  // Unix ms
      "endDate": 1770046272492,
      "duration": 3506.49,         // seconds
      "distanceKm": 10.64,
      "averagePaceMinKm": 5.49,
      "averageSpeedMs": 3.03,
      "activeEnergyBurnedKcal": 663.52
    }
  ]
}
```

Use this as reference for normalization mapping.

### Git Intelligence

Recent commit: `a5368a9 feat: apple healthkit and apple sign-in` - Initial HealthKit implementation.
This story extends that work to store individual activities.

### Project Structure Notes

- Monorepo with `apps/native` (Expo) and `packages/backend` (Convex)
- Convex tables defined in `packages/backend/convex/schema/` with barrel export in `schema.ts`
- Hooks follow pattern: `use-{feature}.ts` in `apps/native/src/hooks/`
- Lib utilities in `apps/native/src/lib/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#activities]
- [Source: apps/native/src/lib/healthkit.ts] - Existing HealthKit client
- [Source: packages/backend/convex/healthkit.ts] - Existing backend mutation
- [@kingstinct/react-native-healthkit docs](https://github.com/kingstinct/react-native-healthkit)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
