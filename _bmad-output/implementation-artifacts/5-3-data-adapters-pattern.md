# Story 5.3: Data Adapters Pattern

Status: done

## Story

As a developer,
I want data adapters for each wearable provider,
So that the system is source-agnostic and extensible.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA INGESTION LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    WEARABLE DATA SOURCES (via Adapters)                  │    │
│  │                                                                          │    │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │    │
│  │   │  HealthKit   │   │   Strava     │   │   Garmin     │                │    │
│  │   │  (iOS/Watch) │   │   (OAuth)    │   │   (OAuth)    │   ...future   │    │
│  │   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │    │
│  │          │                  │                  │                         │    │
│  │          ▼                  ▼                  ▼                         │    │
│  │   ┌──────────────────────────────────────────────────────────────┐      │    │
│  │   │                   ADAPTER REGISTRY                            │      │    │
│  │   │              getAdapter(source: string)                       │      │    │
│  │   ├──────────────────────────────────────────────────────────────┤      │    │
│  │   │                                                               │      │    │
│  │   │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │      │    │
│  │   │  │ healthkitAdapter│  │  stravaAdapter  │  │ garminAdapter│  │      │    │
│  │   │  │   (this story)  │  │    (future)     │  │   (future)   │  │      │    │
│  │   │  │                 │  │                 │  │              │  │      │    │
│  │   │  │ normalizeActivity()                                    │  │      │    │
│  │   │  │ normalizeSleep()                                       │  │      │    │
│  │   │  │ normalizeBody()                                        │  │      │    │
│  │   │  └─────────────────┘  └─────────────────┘  └──────────────┘  │      │    │
│  │   │                                                               │      │    │
│  │   └───────────────────────────┬──────────────────────────────────┘      │    │
│  │                               │                                          │    │
│  └───────────────────────────────┼──────────────────────────────────────────┘    │
│                                  │                                               │
│  ┌───────────────────────────────┼──────────────────────────────────────────┐    │
│  │     OTHER DATA PATHS (NOT adapters - different patterns)                 │    │
│  │                               │                                           │    │
│  │   ┌───────────────────────────┴───────────────────────────────────┐      │    │
│  │   │                                                                │      │    │
│  │   │  MOCK DATA (Story 4.2)          USER INPUT (Onboarding)       │      │    │
│  │   │  ─────────────────────          ────────────────────────      │      │    │
│  │   │  • Generator functions          • Tool Handler                 │      │    │
│  │   │  • Creates data directly        • Goes to Runner Object        │      │    │
│  │   │  • source = "mock"              • NOT to activities table      │      │    │
│  │   │  • For development only         • Direct field updates         │      │    │
│  │   │                                                                │      │    │
│  │   └───────────────────────────┬───────────────────────────────────┘      │    │
│  │                               │                                           │    │
│  └───────────────────────────────┼──────────────────────────────────────────┘    │
│                                  │                                               │
│                                  ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         SYNC MUTATIONS                                     │  │
│  │                                                                            │  │
│  │   integrations/healthkit/sync.ts  →  syncHealthKitActivities()            │  │
│  │   integrations/strava/sync.ts     →  syncStravaActivities()     (future)  │  │
│  │   seeds/mock-activities.ts        →  seedMockActivities()       (4.2)     │  │
│  │                                                                            │  │
│  └───────────────────────────────┬───────────────────────────────────────────┘  │
│                                  │                                               │
└──────────────────────────────────┼───────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────────┐
                    │           ACTIVITIES TABLE            │
                    │                                       │
                    │  source: "healthkit" | "strava" |     │
                    │          "garmin" | "mock"            │
                    │                                       │
                    │  ┌─────────────────────────────────┐  │
                    │  │ runnerId, userId, externalId    │  │
                    │  │ startTime, endTime, activityType│  │
                    │  │ distanceMeters, durationSeconds │  │
                    │  │ avgPaceSecondsPerKm, avgSpeedKmh│  │
                    │  │ avgHeartRate, maxHeartRate      │  │
                    │  │ calories, rawPayload, importedAt│  │
                    │  └─────────────────────────────────┘  │
                    │                                       │
                    └──────────────────────────────────────┘
```

---

## What Adapters Are For

**Adapters normalize external wearable data** into our unified schema. They are NOT for:
- User input during onboarding (goes directly to Runner Object via Tool Handler)
- Mock data generation (uses generators, not adapters)
- Manual activity logging (not in MVP scope)

**The adapter pattern provides:**
1. Consistent interface for all wearable sources
2. Central registry for source-agnostic access
3. Easy addition of new sources (Strava, Garmin, Terra)

---

## Relationship to Other Stories

### Story 4.1: HealthKit Integration (iOS) - COMPLETED
**What it did:**
- Created `lib/normalizers/healthkit.ts` - standalone normalizer functions
- Created `integrations/healthkit/sync.ts` - sync mutation

**This story migrates 4.1's normalizer into the adapter pattern:**
- Normalizer logic moves to `lib/adapters/healthkit.ts`
- Sync mutation updated to use adapter registry
- Old normalizer deleted

### Story 4.2: Mock Data Generators - COMPLETED
**What it does:**
- Creates `lib/mock-data-generator.ts` - generates realistic training data
- Creates `seeds/mock-activities.ts` - seed/cleanup mutations
- Sets `source: "mock"` on all generated activities

**Relationship to adapters:**
- Mock generators do NOT use the adapter pattern
- They generate data directly in the correct schema format
- No normalization needed because there's no external source

### Story 4.3: Data Normalization Sync Pipeline - SUPERSEDED
This story has been deleted and merged into 5.3.

---

## Acceptance Criteria

1. **AC1: Adapter Interface** - A DataAdapter interface exists defining the contract for all wearable data sources

2. **AC2: HealthKit Adapter** - Migrates existing normalizer into adapter pattern:
   - Implements DataAdapter interface
   - Contains all logic from `lib/normalizers/healthkit.ts`
   - Adds `normalizeSleep` and `normalizeBody` stubs for future use

3. **AC3: Adapter Registry** - Central access point:
   - `getAdapter(source: string): DataAdapter`
   - Throws if adapter not found
   - Supports registration of new adapters

4. **AC4: Sync Migration** - Update `integrations/healthkit/sync.ts`:
   - Import adapter via registry instead of normalizer
   - Use `healthkitAdapter.normalizeActivity()` method

5. **AC5: Cleanup** - Remove deprecated normalizer:
   - Delete `lib/normalizers/healthkit.ts`
   - Delete `lib/normalizers/` folder if empty

---

## Tasks / Subtasks

- [x] **Task 1: Create adapter types and interface** (AC: 1)
  - [x] Create `packages/backend/convex/lib/adapters/types.ts`
  - [x] Define DataAdapter interface with source, normalizeActivity, normalizeSleep?, normalizeBody?
  - [x] Define DataSource type, PartialActivity type
  - [x] Export all types

- [x] **Task 2: Create HealthKit adapter** (AC: 2)
  - [x] Create `packages/backend/convex/lib/adapters/healthkit.ts`
  - [x] Migrate logic from `lib/normalizers/healthkit.ts` into adapter
  - [x] Implement normalizeActivity (existing logic)
  - [x] Add normalizeSleep stub (throws "not implemented")
  - [x] Add normalizeBody stub (throws "not implemented")
  - [x] Ensure rawPayload is preserved

- [x] **Task 3: Create adapter registry** (AC: 3)
  - [x] Create `packages/backend/convex/lib/adapters/registry.ts`
  - [x] Implement getAdapter(source) function
  - [x] Implement registerAdapter(adapter) function
  - [x] Implement getSupportedSources() function
  - [x] Register healthkit adapter

- [x] **Task 4: Create barrel export** (AC: 1-3)
  - [x] Create `packages/backend/convex/lib/adapters/index.ts`
  - [x] Export types, adapters, and registry functions

- [x] **Task 5: Migrate sync.ts to use adapter** (AC: 4)
  - [x] Update `packages/backend/convex/integrations/healthkit/sync.ts`
  - [x] Replace import from `../lib/normalizers/healthkit` with adapter registry
  - [x] Use `getAdapter("healthkit").normalizeActivity()` for each workout
  - [x] Verify sync still works correctly

- [x] **Task 6: Remove deprecated normalizer** (AC: 5)
  - [x] Delete `packages/backend/convex/lib/normalizers/healthkit.ts`
  - [x] Delete `packages/backend/convex/lib/normalizers/` folder
  - [x] Verify no other imports reference the old normalizer

---

## Dev Notes

### DataAdapter Interface

```typescript
// packages/backend/convex/lib/adapters/types.ts

import type { Id } from "../../_generated/dataModel";

/** Supported wearable data sources */
export type DataSource = "healthkit" | "strava" | "garmin" | "coros" | "terra";

/** Activity fields for database insertion (without Convex system fields) */
export type PartialActivity = {
  // Foreign keys (provided by caller)
  runnerId: Id<"runners">;
  userId: Id<"users">;

  // Metadata
  externalId: string;
  source: DataSource;
  startTime: number;
  endTime: number;
  activityType: string;
  name?: string;

  // Distance & Movement
  distanceMeters?: number;
  durationSeconds?: number;
  elevationGainMeters?: number;
  steps?: number;

  // Pace & Speed
  avgPaceSecondsPerKm?: number;
  avgSpeedKmh?: number;

  // Heart Rate
  avgHeartRate?: number;
  maxHeartRate?: number;

  // Calories
  calories?: number;

  // Running metrics
  avgCadence?: number;

  // Debug
  rawPayload?: string;
  importedAt: number;
  lastSyncedAt: number;
};

/** Interface all wearable adapters must implement */
export interface DataAdapter {
  /** Source identifier */
  source: DataSource;

  /** Transform raw activity data to our schema */
  normalizeActivity(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): PartialActivity;

  /** Transform raw sleep data (optional, for future use) */
  normalizeSleep?(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): unknown;

  /** Transform raw body measurement (optional, for future use) */
  normalizeBody?(
    raw: unknown,
    runnerId: Id<"runners">,
    userId: Id<"users">
  ): unknown;
}
```

### Registry Implementation

```typescript
// packages/backend/convex/lib/adapters/registry.ts

import type { DataAdapter, DataSource } from "./types";
import { healthkitAdapter } from "./healthkit";

const adapters: Map<DataSource, DataAdapter> = new Map([
  ["healthkit", healthkitAdapter],
  // Future: ["strava", stravaAdapter], ["garmin", garminAdapter]
]);

export function getAdapter(source: DataSource): DataAdapter {
  const adapter = adapters.get(source);
  if (!adapter) {
    throw new Error(`No adapter registered for source: ${source}`);
  }
  return adapter;
}

export function registerAdapter(adapter: DataAdapter): void {
  adapters.set(adapter.source, adapter);
}

export function getSupportedSources(): DataSource[] {
  return Array.from(adapters.keys());
}
```

### Sync Migration Example

```typescript
// BEFORE (current 4.1 implementation):
import { normalizeHealthKitWorkouts } from "../../lib/normalizers/healthkit";

const normalizedActivities = normalizeHealthKitWorkouts(args.rawWorkouts);
for (const activity of normalizedActivities) {
  await ctx.db.insert("activities", {
    runnerId: runner._id,
    userId,
    ...activity,
  });
}

// AFTER (using adapter pattern):
import { getAdapter } from "../../lib/adapters";

const adapter = getAdapter("healthkit");
for (const raw of args.rawWorkouts) {
  const activity = adapter.normalizeActivity(raw, runner._id, userId);
  await ctx.db.insert("activities", activity);
}
```

### File Structure After Implementation

```
packages/backend/convex/
├── lib/
│   ├── adapters/                    # NEW - this story
│   │   ├── types.ts                 # Interface & type definitions
│   │   ├── healthkit.ts             # HealthKit adapter (migrated)
│   │   ├── registry.ts              # Adapter registry
│   │   └── index.ts                 # Barrel export
│   │
│   ├── mock-data-generator.ts       # Story 4.2 (separate, not an adapter)
│   │
│   └── normalizers/                 # DELETED after migration
│       └── healthkit.ts             # → Moves to adapters/healthkit.ts
│
├── integrations/
│   └── healthkit/
│       └── sync.ts                  # UPDATED to use adapter registry
│
└── seeds/
    └── mock-activities.ts           # Story 4.2 (uses generator, not adapters)
```

### Adding Future Sources

When adding a new source (e.g., Strava):

1. **Create adapter:** `lib/adapters/strava.ts` implementing DataAdapter
2. **Register:** Add to registry in `registry.ts`
3. **Create sync mutation:** `integrations/strava/sync.ts` using `getAdapter("strava")`

No changes needed to existing adapters or consuming code.

---

## Testing Checklist

After implementation:
- [x] `npx convex dev` runs without errors
- [x] TypeScript type-check passes (`npx convex codegen`)
- [x] Existing HealthKit sync still works (regression test)
- [x] `getAdapter("healthkit")` returns correct adapter
- [x] `getAdapter("unknown")` throws error
- [x] No imports reference `lib/normalizers/`
- [ ] Mock data generator (4.2) still works independently (4.2 not implemented yet)

---

## References

- [Story 4.1: HealthKit Integration](./4-1-healthkit-integration-ios.md) - Existing normalizer being migrated
- [Story 4.2: Mock Data Generators](./4-2-mock-data-providers-development.md) - Separate generator system
- [Architecture Backend v2](../planning-artifacts/architecture-backend-v2.md) - Wearable Adapter Layer

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Convex codegen passed without errors
- No imports reference deleted `lib/normalizers/` folder
- Generated API types include all adapter modules

### Completion Notes List

- Created DataAdapter interface with source, normalizeActivity, normalizeSleep?, normalizeBody?
- Created PartialActivity type with all activity fields for database insertion
- Created DataSource type for supported wearable sources
- Migrated HealthKit normalizer logic into adapter pattern with runnerId/userId parameters
- Added normalizeSleep and normalizeBody stubs that throw "not implemented"
- Created adapter registry with getAdapter, registerAdapter, getSupportedSources functions
- Created barrel export for clean imports
- Updated sync.ts to use adapter registry instead of direct normalizer import
- Deleted deprecated lib/normalizers/ folder
- All acceptance criteria satisfied

### File List

**Created:**
- packages/backend/convex/lib/adapters/types.ts
- packages/backend/convex/lib/adapters/healthkit.ts
- packages/backend/convex/lib/adapters/registry.ts
- packages/backend/convex/lib/adapters/index.ts
- packages/backend/convex/integrations/healthkit/sync.ts

**Modified:**
- apps/native/src/hooks/use-healthkit.ts (uses new sync mutation path)
- apps/native/src/lib/healthkit.ts (exports RawHealthKitWorkout type)

**Deleted:**
- packages/backend/convex/lib/normalizers/healthkit.ts
- packages/backend/convex/lib/normalizers/ (folder)

### Code Review Fixes (2026-02-16)

**Fixed Issues:**
- H2: Added "manual" and "mock" to DataSource type to match schema
- M4: Made externalId optional in PartialActivity to match schema
- M2: Added runtime validation in healthkit adapter normalizeActivity
- M3: Added error logging in sync.ts catch block with workout UUID
