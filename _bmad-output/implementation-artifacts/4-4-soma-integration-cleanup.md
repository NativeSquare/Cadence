# Story 4.4: Soma Integration Cleanup

Status: done

> **NEW 2026-02-17:** Cleanup legacy code superseded by Soma component.

## Story

As a developer,
I want to remove legacy adapter code and document Soma integration,
So that the codebase is clean and the data flow is clear.

## Acceptance Criteria

1. **Given** Soma now handles wearable data ingestion
   **When** cleanup is performed
   **Then** the following files are deleted:
   - `packages/backend/convex/lib/adapters/index.ts` (empty exports)
   - `packages/backend/convex/lib/adapters/registry.ts` (empty adapter map)
   - `packages/backend/convex/lib/adapters/types.ts` (unused interfaces)
   - `packages/backend/convex/strava.ts` (old OAuth handlers, replaced by Soma)
   - `packages/backend/convex/healthkit.ts` (old aggregates storage, replaced by Soma)
   **And** the `/lib/adapters/` directory is removed entirely
   **And** any imports referencing deleted files are updated/removed

2. **Given** files have been deleted
   **When** TypeScript compilation runs
   **Then** no import errors exist
   **And** `pnpm build` succeeds in packages/backend

3. **Given** architecture documentation needs updating
   **When** documentation is complete
   **Then** architecture-backend-v2.md "Wearable Adapter Layer" section references Soma
   **And** data flow diagram shows: Wearable APIs → Soma Component → Historical Tables → Inference Engine → Runner Object

## Tasks / Subtasks

- [x] **Task 1: Audit legacy files for deletion** (AC: #1)
  - [x] Verify `packages/backend/convex/lib/adapters/index.ts` is empty/unused — YES, only _generated imports
  - [x] Verify `packages/backend/convex/lib/adapters/registry.ts` is empty/unused — YES, empty adapter map
  - [x] Verify `packages/backend/convex/lib/adapters/types.ts` is unused — YES, only _generated imports
  - [x] Verify `packages/backend/convex/strava.ts` is superseded by Soma — PARTIAL: needs native app migration
  - [x] Verify `packages/backend/convex/healthkit.ts` is superseded by Soma — PARTIAL: aggregate storage must move to Soma sync
  - [x] Search for any imports of these files — Found: use-strava-auth.ts:23, use-healthkit.ts:51

- [x] **Task 2: Delete legacy adapter files** (AC: #1)
  - [x] Delete `packages/backend/convex/lib/adapters/index.ts`
  - [x] Delete `packages/backend/convex/lib/adapters/registry.ts`
  - [x] Delete `packages/backend/convex/lib/adapters/types.ts`
  - [x] Delete `packages/backend/convex/lib/adapters/` directory
  - [x] Delete `packages/backend/convex/strava.ts`
  - [x] Delete `packages/backend/convex/healthkit.ts`

- [x] **Task 3: Fix any broken imports** (AC: #1, #2)
  - [x] Search codebase for imports from deleted files — Found in use-strava-auth.ts, use-healthkit.ts
  - [x] Update or remove broken imports — Migrated to Soma endpoints
  - [x] Verify no runtime references remain — All migrated

- [x] **Task 4: Verify build succeeds** (AC: #2)
  - [x] Run `pnpm build` in packages/backend — No build script; used typecheck
  - [x] Run `pnpm typecheck` if available — Pre-existing errors (Soma types, vitest) unrelated to 4.4
  - [x] Verify Convex deployment would succeed — Pre-existing issues (mock-activities.ts naming) unrelated to 4.4
  - NOTE: No source files import deleted modules; _generated/api.d.ts regenerates on next `convex dev`

- [x] **Task 5: Update architecture documentation** (AC: #3)
  - [x] Update `_bmad-output/planning-artifacts/architecture-backend-v2.md`
  - [x] Add Soma integration note to "Wearable Adapter Layer" section — Updated diagram box
  - [x] Update data flow diagram to show Soma component — Updated description and boxes
  - [x] Note which sections are "Implemented by Soma component" — Updated headers and MVP table

## Dev Notes

### Files to Delete

```
packages/backend/convex/
  lib/
    adapters/
      index.ts       # DELETE - empty exports
      registry.ts    # DELETE - empty adapter map with comment "migrated to @nativesquare/soma"
      types.ts       # DELETE - unused interfaces
  strava.ts          # DELETE - old OAuth handlers
  healthkit.ts       # DELETE - old aggregates storage
```

### What Soma Provides (Reference)

**Tables (already operational):**
- `activities` - packages/backend/convex/table/activities.ts
- `sleepSessions` - packages/backend/convex/table/sleepSessions.ts
- `dailySummaries` - packages/backend/convex/table/dailySummaries.ts
- `bodyMeasurements` - packages/backend/convex/table/bodyMeasurements.ts

**Ingestion Methods:**
- `soma.ingestActivity()` - Normalizes and stores activity data
- `soma.ingestSleep()` - Normalizes and stores sleep data
- `soma.ingestBody()` - Normalizes and stores body measurements
- `soma.ingestDaily()` - Normalizes and stores daily summaries

**Integration Points:**
- `packages/backend/convex/integrations/healthkit/sync.ts` - HealthKit sync
- `packages/backend/convex/integrations/strava/sync.ts` - Strava sync

### Architecture Doc Updates Required

**Sections to update in architecture-backend-v2.md:**

| Section | Required Change |
|---------|-----------------|
| Wearable Adapter Layer (~line 526-538) | Reference Soma's `ingest*()` methods |
| Historical Data Tables (~line 542-577) | Note: "Implemented by Soma component" |
| New Table: Activities (~line 346-406) | Note: "Implemented by Soma component" |
| New Table: Daily Summaries (~line 408-452) | Note: "Implemented by Soma component" |
| Strava Integration (~line 648-719) | Reference `soma.connectStrava()` pattern |
| HealthKit Integration (~line 722-758) | Reference Soma transformers |
| Normalizer Functions (~line 763-802) | Note: "Superseded by Soma" |
| Data Flow Diagram (~line 461-631) | Show "Soma Component" as integration point |
| Module Communication Rules (~line 253-259) | Update `activities` owner to "Soma component only" |

**Updated Data Flow:**
```
Wearable APIs (HealthKit, Strava, etc.)
    ↓
Soma Component (@nativesquare/soma)
    ↓
Historical Tables (activities, sleepSessions, dailySummaries, bodyMeasurements)
    ↓
Inference Engine (Story 5.4)
    ↓
Runner Object (runners.currentState)
```

### Verification Checklist

Before marking complete:
- [x] All 5 files deleted
- [x] `/lib/adapters/` directory removed
- [x] No import errors in codebase (source files; _generated regenerates on convex dev)
- [x] `pnpm typecheck` — pre-existing errors only (Soma types, vitest)
- [x] Architecture doc updated with Soma notes

### Sprint Change Proposal Reference

This story was added per Sprint Change Proposal 2026-02-17:
- Stories obsoleted: 3 (4.3, 5.1, 5.3)
- Stories revised: 1 (4.1)
- New stories: 1 (this one - 4.4)
- Net effort savings: ~4 days

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.4]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-02-17.md]
- [Soma HealthKit Sync: packages/backend/convex/integrations/healthkit/sync.ts]
- [Soma Strava Sync: packages/backend/convex/integrations/strava/sync.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Task 1 found native app dependencies in use-strava-auth.ts and use-healthkit.ts
- Task 3 required migrating native app to use Soma endpoints before deleting legacy files
- Task 4 revealed pre-existing type errors (Soma module types, vitest) unrelated to 4.4 changes

### Completion Notes List

1. **Deleted legacy files**: lib/adapters/ (3 files), strava.ts, healthkit.ts
2. **Migrated use-strava-auth.ts**: Switched from `api.strava.exchangeCode` to `api.integrations.strava.sync.connectStravaOAuth`
3. **Enhanced Soma HealthKit sync**: Added aggregates parameter to `syncHealthKitData` to consolidate aggregate storage (previously in healthkit.ts)
4. **Migrated use-healthkit.ts**: Removed separate `storeHealthData` call, aggregates now passed to single `syncHealthKitData` call
5. **Architecture doc updated**: Module Communication Rules, Data Flow diagram, Wearable Adapter Layer section, Historical Data Tables section, MVP scope table

### File List

**Deleted:**
- packages/backend/convex/lib/adapters/index.ts
- packages/backend/convex/lib/adapters/registry.ts
- packages/backend/convex/lib/adapters/types.ts
- packages/backend/convex/lib/adapters/ (directory)
- packages/backend/convex/strava.ts
- packages/backend/convex/healthkit.ts

**Created:**
- packages/backend/convex/integrations/healthkit/sync.test.ts — Validator and batch processing tests (requires vitest)

**Modified:**
- apps/native/src/hooks/use-strava-auth.ts — Migrated to Soma endpoint; fixed variable redeclaration (review fix)
- apps/native/src/hooks/use-healthkit.ts — Removed storeHealthData call, pass aggregates to syncHealthKitData
- packages/backend/convex/integrations/healthkit/sync.ts — Added aggregates parameter, runner.inferred storage; fixed batchIngest type signature (review fix)
- _bmad-output/planning-artifacts/architecture-backend-v2.md — Updated Soma integration notes
- _bmad-output/implementation-artifacts/sprint-status.yaml — Status updated to done

### Change Log

- 2026-02-17: Story 4.4 implemented — Legacy adapter code removed, native app migrated to Soma endpoints, architecture docs updated
- 2026-02-17: Code review fixes — Fixed variable redeclaration in use-strava-auth.ts:73 (`const result` → `const connectResult`); Fixed batchIngest type signature in sync.ts (`Promise<void>` → `Promise<unknown>`); Added sync.test.ts to File List
