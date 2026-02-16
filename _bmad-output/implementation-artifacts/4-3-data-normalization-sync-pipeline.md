# Story 4.3: Data Normalization & Sync Pipeline

Status: ready-for-dev

## Story

As a developer,
I want a consistent data normalization pipeline,
So that data from any provider is stored in a unified format.

## Acceptance Criteria

1. **Given** HealthKit workout data is received
   **When** normalization runs
   **Then** fields are mapped:
   - workoutActivityType -> activityType ("running")
   - duration -> durationSeconds
   - totalDistance -> distanceMeters
   - totalEnergyBurned -> calories
   - metadata.HKAverageHeartRate -> avgHeartRate
   - startDate/endDate -> startTime/endTime (Unix ms)

2. **Given** pace needs to be calculated
   **When** distance and duration are available
   **Then** avgPaceSecondsPerKm = durationSeconds / (distanceMeters / 1000)

3. **Given** the sync pipeline runs
   **When** activities are processed
   **Then** duplicates are detected by externalId
   **And** existing records are updated (upsert behavior)
   **And** new records are inserted
   **And** rawPayload is preserved for debugging

4. **Given** sync completes
   **When** Runner Object is updated
   **Then** connections.healthkitLastSync is set to current timestamp
   **And** inference engine is triggered to recalculate currentState

## Tasks / Subtasks

- [ ] **Task 1: Create normalizer interface and base** (AC: #1)
  - [ ] Create `packages/backend/convex/lib/normalizers/types.ts`
  - [ ] Define `DataNormalizer` interface
  - [ ] Define normalized `ActivityInput` type matching activities schema

- [ ] **Task 2: Create HealthKit normalizer** (AC: #1, #2)
  - [ ] Create `packages/backend/convex/lib/normalizers/healthkit.ts`
  - [ ] Implement field mapping per AC #1
  - [ ] Calculate avgPaceSecondsPerKm from distance/duration
  - [ ] Handle optional fields gracefully (HR, HRV may be missing)
  - [ ] Preserve rawPayload as JSON string

- [ ] **Task 3: Create sync pipeline core** (AC: #3)
  - [ ] Create `packages/backend/convex/integrations/sync-pipeline.ts`
  - [ ] Implement `syncActivities` mutation
  - [ ] Query existing activities by externalId for upsert detection
  - [ ] Batch upsert: insert new, patch existing
  - [ ] Return sync summary (inserted, updated, skipped counts)

- [ ] **Task 4: Implement upsert logic** (AC: #3)
  - [ ] Query by `externalId` index for duplicate detection
  - [ ] If exists: use `ctx.db.patch()` to update
  - [ ] If new: use `ctx.db.insert()` to create
  - [ ] Track operation counts for summary

- [ ] **Task 5: Update Runner Object on sync** (AC: #4)
  - [ ] Set `connections.healthkitLastSync = Date.now()`
  - [ ] Set `connections.healthkitConnected = true`
  - [ ] Add placeholder for inference engine trigger (Epic 5.4)

- [ ] **Task 6: Wire hook to pipeline** (AC: #3, #4)
  - [ ] Update `apps/native/src/hooks/use-healthkit.ts`
  - [ ] After `importHealthKitData()`, call `syncActivities` mutation
  - [ ] Pass normalized activities through pipeline
  - [ ] Return sync results to caller

## Dev Notes

### CRITICAL: Relationship to Story 4.1

Story 4.1 creates the activities table schema and basic HealthKit fetching. This story (4.3) completes the pipeline:

| Story 4.1 | Story 4.3 |
|-----------|-----------|
| Activities table schema | N/A (done) |
| HealthKit data fetching | N/A (done) |
| Basic backend mutation | Full sync pipeline |
| Aggregate storage | Individual workout storage |

Ensure Story 4.1 is complete before implementing 4.3.

### Normalizer Interface

```typescript
// packages/backend/convex/lib/normalizers/types.ts
import type { Doc } from "../_generated/dataModel";

export type ActivityInput = Omit<Doc<"activities">, "_id" | "_creationTime">;

export interface DataNormalizer<TRaw = unknown> {
  source: string;
  normalize(raw: TRaw, context: NormalizerContext): ActivityInput;
}

export interface NormalizerContext {
  runnerId: Id<"runners">;
  userId: Id<"users">;
  importedAt: number;
}
```

### HealthKit Normalizer Implementation

```typescript
// packages/backend/convex/lib/normalizers/healthkit.ts
import type { WorkoutProxy } from "@kingstinct/react-native-healthkit";

export const healthkitNormalizer: DataNormalizer<HealthKitWorkout> = {
  source: "healthkit",

  normalize(raw, context) {
    const durationSeconds = raw.duration;
    const distanceMeters = raw.distanceKm * 1000;

    // Calculate pace: seconds per km
    const avgPaceSecondsPerKm = distanceMeters > 0
      ? durationSeconds / (distanceMeters / 1000)
      : undefined;

    return {
      runnerId: context.runnerId,
      userId: context.userId,
      externalId: raw.sourceId,
      source: "healthkit",
      startTime: raw.startDate,
      endTime: raw.endDate,
      activityType: "running",
      distanceMeters,
      durationSeconds,
      avgPaceSecondsPerKm,
      avgSpeedMps: raw.averageSpeedMs,
      totalBurnedCalories: raw.activeEnergyBurnedKcal,
      avgHeartRate: raw.avgHeartRate,  // May be undefined
      maxHeartRate: raw.maxHeartRate,  // May be undefined
      rawPayload: JSON.stringify(raw),
      importedAt: context.importedAt,
    };
  }
};
```

### Sync Pipeline Pattern

```typescript
// packages/backend/convex/integrations/sync-pipeline.ts
export const syncActivities = mutation({
  args: {
    activities: v.array(activityInputValidator),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, { activities }) => {
    let inserted = 0, updated = 0, skipped = 0;

    for (const activity of activities) {
      // Check for existing by externalId
      const existing = await ctx.db
        .query("activities")
        .withIndex("by_externalId", q => q.eq("externalId", activity.externalId))
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, activity);
        updated++;
      } else {
        // Insert new
        await ctx.db.insert("activities", activity);
        inserted++;
      }
    }

    return { inserted, updated, skipped };
  }
});
```

### File Structure Requirements

**New files to create:**
```
packages/backend/convex/
  lib/
    normalizers/
      types.ts              # Interface definitions
      healthkit.ts          # HealthKit normalizer
      index.ts              # Barrel export
  integrations/
    sync-pipeline.ts        # Core sync mutation
```

**Files to modify:**
```
apps/native/src/
  hooks/use-healthkit.ts    # Wire to sync pipeline
packages/backend/convex/
  healthkit.ts              # Add lastSync update
```

### Batch Processing for Large Syncs

For initial sync (90 days of data), may have 50+ activities. Process in batches:

```typescript
const BATCH_SIZE = 25;

for (let i = 0; i < activities.length; i += BATCH_SIZE) {
  const batch = activities.slice(i, i + BATCH_SIZE);
  await syncBatch(batch);
}
```

### Inference Engine Placeholder

Story 5.4 implements the inference engine. For now, add a placeholder:

```typescript
// After sync completes
// TODO: Story 5.4 - Trigger inference engine
// await ctx.runMutation(api.inference.recalculateCurrentState, { runnerId });
console.log(`[Sync] Would trigger inference for runner ${runnerId}`);
```

### Testing Requirements

**Unit Tests:**
- Normalizer correctly maps all fields
- Pace calculation is accurate
- Missing optional fields handled gracefully
- rawPayload is valid JSON

**Integration Tests:**
- Upsert creates new records
- Upsert updates existing records (same externalId)
- Batch sync processes all activities
- Runner Object updated with lastSync timestamp

### Architecture Compliance

- Normalizers are pure functions (no side effects)
- Sync pipeline is single Convex mutation
- Upsert by externalId prevents duplicates
- rawPayload preserved for debugging/audit

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#activities]
- [Source: Story 4.1 - activities table schema]
- [Source: apps/native/src/lib/healthkit.ts - HealthKit data shapes]
- [Source: packages/backend/convex/healthkit.ts - existing mutation pattern]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
