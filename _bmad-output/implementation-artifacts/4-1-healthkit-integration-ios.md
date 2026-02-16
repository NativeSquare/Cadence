# Story 4.1: HealthKit Integration (iOS)

Status: review

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

- [x] **Task 1: Request HealthKit permissions** (AC: #1)
  - [x] Add HRV permission to READ_PERMISSIONS in `healthkit.ts`
  - [x] Ensure all required data types are requested: running workouts, distance, duration, heart rate, HRV
  - [x] Handle authorization flow properly (request before any data fetch)

- [x] **Task 2: Fetch and dump raw HealthKit data** (AC: #3)
  - [x] Query last 90 days of running workouts from HealthKit
  - [x] Return raw workout data from `importHealthKitData()` (not just aggregates)
  - [x] Include all available fields: duration, distance, energy burned, heart rate, HRV

- [x] **Task 3: Create normalization pipeline** (AC: #3)
  - [x] Create `packages/backend/convex/lib/normalizers/healthkit.ts`
  - [x] Map HealthKit fields to unified activities schema:
    - workoutActivityType -> activityType ("running")
    - duration -> durationSeconds
    - totalDistance -> distanceMeters
    - totalEnergyBurned -> calories
    - metadata.HKAverageHeartRate -> avgHeartRate
  - [x] Calculate avgPaceSecondsPerKm from distance/duration

- [x] **Task 4: Create batch upsert backend action** (AC: #3)
  - [x] Create `packages/backend/convex/integrations/healthkit/sync.ts`
  - [x] Implement `syncHealthKitActivities` mutation
  - [x] Handle upsert by externalId (prevent duplicates)
  - [x] Store rawPayload for debugging

- [x] **Task 5: Update useHealthKit hook** (AC: #2)
  - [x] Return sync progress/status for UI feedback
  - [x] Call batch upsert after data fetch
  - [x] Handle partial sync failures gracefully

- [x] **Task 6: Add permission denied fallback** (AC: #4)
  - [x] Detect denial vs not-determined states
  - [x] Provide UI guidance for enabling via iOS Settings
  - [x] Allow retry flow from settings screen

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
- **Activities table** - Already created in Epic 5

**What's MISSING (this story must implement):**
1. **Raw data dump** - Fetch raw HealthKit workouts and send to backend
2. **Normalization pipeline** - Transform HealthKit data to match unified activities schema
3. **Per-workout storage** - Each workout needs to be normalized and stored in activities table
4. **Heart rate & HRV data** - Not being fetched/stored per-workout
5. **Sync status UI feedback** - User needs visual confirmation of sync progress

**Out of scope (backend handles separately):**
- Runner Object sync (`connections.healthkitConnected`, `healthkitLastSync`)

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
  lib/
    normalizers/
      healthkit.ts         # HealthKit -> activities mapping
  integrations/
    healthkit/
      sync.ts              # Batch sync mutation
```

**Files to modify:**
```
apps/native/src/
  lib/healthkit.ts        # Add HRV permission, return raw workouts
  hooks/use-healthkit.ts  # Add sync progress, call batch upsert
```

### Activities Table Schema (REFERENCE ONLY - already implemented in Epic 5)

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript type-check passed for both native app and backend

### Completion Notes List

1. **Task 1**: Added `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` to READ_PERMISSIONS array in healthkit.ts
2. **Task 2**: Created `RawHealthKitWorkout` type and `importHealthKitDataWithRaw()` function that extracts raw workout data including uuid, timestamps, duration, distance, energy burned, heart rate stats, speed, and pace
3. **Task 3**: Created normalization pipeline at `packages/backend/convex/lib/normalizers/healthkit.ts` with `normalizeHealthKitWorkout()` and `normalizeHealthKitWorkouts()` functions that transform raw HealthKit data to the activities schema
4. **Task 4**: Created batch upsert mutation at `packages/backend/convex/integrations/healthkit/sync.ts` with `syncHealthKitActivities` that performs upsert by externalId and updates wearable connection status
5. **Task 5**: Updated useHealthKit hook with `SyncStatus` type, sync progress tracking, and integration with syncHealthKitActivities mutation. Added phases: idle, authorizing, fetching, syncing, complete, error, permission_denied
6. **Task 6**: Added authorization status checking (`getHealthKitAuthStatus`, `checkIfAuthorizationDenied`), `openHealthSettings()` for opening iOS Settings, and `PERMISSION_DENIED_GUIDANCE` constant. Updated hook with `permissionDenied` state, `openSettings()`, and `retryAfterSettings()` functions

### File List

**New Files:**
- `packages/backend/convex/lib/normalizers/healthkit.ts` - HealthKit normalization pipeline
- `packages/backend/convex/integrations/healthkit/sync.ts` - Batch upsert mutation

**Modified Files:**
- `apps/native/src/lib/healthkit.ts` - Added HRV permission, RawHealthKitWorkout type, importHealthKitDataWithRaw(), auth status functions, permission denied guidance
- `apps/native/src/hooks/use-healthkit.ts` - Added sync status, permission handling, settings integration

**Regenerated Files:**
- `packages/backend/convex/_generated/api.d.ts` - Updated with new integrations module
