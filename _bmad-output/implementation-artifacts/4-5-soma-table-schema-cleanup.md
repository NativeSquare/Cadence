# Story 4.5: Soma Table Schema Cleanup

Status: blocked

> **NEW 2026-02-17:** Remove local table schema files that duplicate Soma component tables.

## Story

As a developer,
I want to remove duplicate table schema files that are now owned by Soma component,
So that the codebase has a single source of truth for Soma-managed tables.

## Acceptance Criteria

1. **Given** Soma component owns table schemas for wearable data
   **When** cleanup is performed
   **Then** the following table files are deleted:
   - `packages/backend/convex/table/activities.ts`
   - `packages/backend/convex/table/sleepSessions.ts`
   - `packages/backend/convex/table/dailySummaries.ts`
   - `packages/backend/convex/table/bodyMeasurements.ts`
   **And** corresponding imports in `schema.ts` are removed
   **And** table references in `schema.ts` are removed

2. **Given** Soma handles Strava OAuth and sync
   **When** `stravaConnections.ts` ownership is evaluated
   **Then** determine if Soma owns this table or if Cadence needs it
   **And** delete if Soma-owned, keep if Cadence-specific

3. **Given** files have been deleted
   **When** TypeScript compilation runs
   **Then** no import errors exist
   **And** `convex dev` generates new `_generated/api.d.ts` without errors

4. **Given** the app queries Soma-owned tables
   **When** queries are executed
   **Then** they use Soma's component API (e.g., `ctx.runQuery(api.soma.activities.list)`)
   **And** NOT direct table access from deleted schemas

## Tasks / Subtasks

- [x] **Task 1: Verify Soma component table ownership** (AC: #1, #2)
  - [x] Confirm Soma exposes `activities`, `sleepSessions`, `dailySummaries`, `bodyMeasurements`
  - [x] Check if Soma exposes `stravaConnections` or if Cadence owns it
  - [x] Document which tables are Soma-owned vs Cadence-owned

- [x] **Task 2: Audit existing table usage** (AC: #4)
  - [x] Search for imports of deleted table files
  - [x] Search for direct table queries (e.g., `ctx.db.query("activities")`)
  - [x] List all files that reference these tables

- [ ] **Task 3: Update queries to use Soma API** (AC: #4) - **BLOCKED: Requires follow-up story**
  - [ ] Update inference-engine.ts to use Soma queries
  - [ ] Update any other files that query Soma-owned tables
  - [x] Verify Soma provides necessary query methods

- [x] **Task 4: Delete table schema files** (AC: #1, #2)
  - [x] Delete `packages/backend/convex/table/activities.ts`
  - [x] Delete `packages/backend/convex/table/sleepSessions.ts`
  - [x] Delete `packages/backend/convex/table/dailySummaries.ts`
  - [x] Delete `packages/backend/convex/table/bodyMeasurements.ts`
  - [x] Delete `packages/backend/convex/table/stravaConnections.ts` (Soma-owned via connections + providerTokens)

- [x] **Task 5: Update schema.ts** (AC: #1)
  - [x] Remove imports for deleted table files
  - [x] Remove table references from defineSchema()
  - [x] Verify remaining tables are correct

- [ ] **Task 6: Verify build succeeds** (AC: #3) - **BLOCKED: Requires Task 3**
  - [ ] Run `convex dev` to regenerate types
  - [ ] Run `pnpm typecheck` to verify no errors
  - [ ] Test that Soma queries work correctly

## Dev Notes

### Tables to Delete (Soma-Owned)

| File | Soma API | Status |
|------|----------|--------|
| `table/activities.ts` | `api.soma.activities.*` | DELETE |
| `table/sleepSessions.ts` | `api.soma.sleepSessions.*` | DELETE |
| `table/dailySummaries.ts` | `api.soma.dailySummaries.*` | DELETE |
| `table/bodyMeasurements.ts` | `api.soma.bodyMeasurements.*` | DELETE |
| `table/stravaConnections.ts` | TBD - verify Soma ownership | VERIFY |

### Tables to Keep (Cadence-Owned)

These are NOT owned by Soma and must remain:
- `table/runners.ts` - Core Cadence runner profile
- `table/users.ts` - Cadence user accounts
- `table/admin.ts` - Admin users
- `table/adminInvites.ts` - Admin invite system
- `table/feedback.ts` - User feedback
- `table/knowledgeBase.ts` - Training knowledge (Epic 6)
- `table/safeguards.ts` - Training safeguards (Epic 6)
- `table/trainingPlans.ts` - Generated plans (Epic 6)
- `table/plannedSessions.ts` - Plan sessions (Epic 6)

### Schema Changes Required

**Current schema.ts:**
```typescript
import { activities } from "./table/activities";
import { sleepSessions } from "./table/sleepSessions";
import { dailySummaries } from "./table/dailySummaries";
import { bodyMeasurements } from "./table/bodyMeasurements";
import { stravaConnections } from "./table/stravaConnections"; // verify

export default defineSchema({
  activities,        // REMOVE
  sleepSessions,     // REMOVE
  dailySummaries,    // REMOVE
  bodyMeasurements,  // REMOVE
  stravaConnections, // VERIFY
  // ... keep all others
});
```

### Query Migration Pattern

**Before (direct table access):**
```typescript
const activities = await ctx.db
  .query("activities")
  .withIndex("by_runnerId", (q) => q.eq("runnerId", runnerId))
  .collect();
```

**After (Soma component API):**
```typescript
const activities = await ctx.runQuery(
  api.soma.activities.listByRunner,
  { runnerId }
);
```

### Why This Was Missed in 4.4

Story 4.4 focused on removing **adapter code** (the translation layer) but not the **table schemas**. The tables were documented as "Soma-provided" but the local schema files weren't deleted because:
1. The story scope was adapter cleanup, not schema cleanup
2. There was confusion between "Soma populates these tables" vs "Soma owns these tables"

### Convex Component Architecture

In Convex's component model:
- Components define their own tables internally
- Parent app imports component via `app.use(soma)` in `convex.config.ts`
- Parent app accesses component tables via component API, not direct queries
- Parent app should NOT redefine component tables in its own schema

### References

- [Source: Story 4.4 implementation notes]
- [Source: architecture-backend-v2.md - Soma integration]
- [Soma component: @nativesquare/soma]
- [Convex config: convex.config.ts line 9]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

1. **Soma table ownership verified** - Soma's schema.ts defines: `connections`, `athletes`, `activities`, `body`, `daily`, `sleep`, `menstruation`, `nutrition`, `plannedWorkouts`, `providerTokens`
2. **Tables deleted** - All 5 Soma-owned table files removed from `packages/backend/convex/table/`
3. **schema.ts updated** - Removed imports and exports for deleted tables, added comment documenting Soma API access pattern
4. **stravaConnections ownership confirmed** - Soma owns via `connections` (generic provider link) + `providerTokens` (OAuth tokens)

### Blocking Issue: Schema Mismatch

**Critical Finding:** Cadence's deleted tables had a **different schema** than Soma's tables:

| Field | Cadence (deleted) | Soma |
|-------|-------------------|------|
| User reference | `runnerId: Id<"runners">` | `userId: string` |
| Timestamps | `startTime: number` (Unix ms) | `metadata.start_time: string` (ISO) |
| Structure | Flat fields | Nested Terra model |
| Session type | `sessionType: "easy" \| "tempo" \| ...` | `metadata.type: number` (enum) |

The `inferenceEngine.ts` and `mockActivities.ts` were designed for Cadence's flat schema, not Soma's nested Terra schema.

### Required Refactors (Follow-up Story)

#### 1. inferenceEngine.ts - Lines 240-280

**Current (broken):**
```typescript
const activities = await ctx.db
  .query("activities")
  .withIndex("by_startTime", (q) => q.eq("runnerId", runnerId).gte("startTime", cutoff))
  .collect();
```

**Required refactor:**
```typescript
// Get runner's userId for Soma query
const runner = await ctx.db.get(runnerId);
const userId = runner?.userId?.toString();

// Query Soma component
const somaActivities = await soma.listActivities(ctx, {
  userId,
  startTime: new Date(cutoff).toISOString(),
  order: "asc",
});

// Transform Soma's Terra schema to inference format
const activities = somaActivities.map(transformSomaActivity);
```

**Transform function needed:**
```typescript
function transformSomaActivity(somaActivity: SomaActivity): InferenceActivity {
  return {
    startTime: new Date(somaActivity.metadata.start_time).getTime(),
    durationSeconds: calculateDuration(somaActivity),
    distanceMeters: somaActivity.distance_data?.summary?.distance_meters,
    avgHeartRate: somaActivity.heart_rate_data?.summary?.avg_hr_bpm,
    maxHeartRate: somaActivity.heart_rate_data?.summary?.max_hr_bpm,
    sessionType: mapActivityType(somaActivity.metadata.type), // Map numeric to string
    trainingLoad: calculateTSS(somaActivity), // Calculate from available data
    // ... etc
  };
}
```

#### 2. mockActivities.ts - Lines 84, 136

**Current (broken):**
```typescript
await ctx.db.insert("activities", activity);
```

**Required refactor:**
```typescript
// Transform mock data to Soma's Terra schema
const somaActivity = transformToSomaFormat(activity, connectionId, userId);
await soma.ingestActivity(ctx, somaActivity);
```

#### 3. plannedSessions.ts - Line 122

**Current:**
```typescript
completedActivityId: v.optional(v.id("activities")),
```

**Required decision:** Store Soma activity reference as string ID or create lookup mechanism.

### File List

**Deleted:**
- packages/backend/convex/table/activities.ts
- packages/backend/convex/table/sleepSessions.ts
- packages/backend/convex/table/dailySummaries.ts
- packages/backend/convex/table/bodyMeasurements.ts
- packages/backend/convex/table/stravaConnections.ts

**Modified:**
- packages/backend/convex/schema.ts

**Require refactor (follow-up story):**
- packages/backend/convex/lib/inferenceEngine.ts
- packages/backend/convex/lib/inferenceEngine.test.ts
- packages/backend/convex/seeds/mockActivities.ts
- packages/backend/convex/lib/mockDataGenerator.ts
- packages/backend/convex/table/plannedSessions.ts (completedActivityId reference)
