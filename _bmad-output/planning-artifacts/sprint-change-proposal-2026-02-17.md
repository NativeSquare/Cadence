# Sprint Change Proposal: Soma Component Integration

**Date:** 2026-02-17
**Trigger:** Colleague implemented Soma component that supersedes planned Epic 4/5 functionality
**Scope:** Moderate - Story revisions and legacy cleanup required
**Status:** APPROVED

---

## Section 1: Issue Summary

**Problem Statement:** Epic 4 (Wearable Data Integration) and Epic 5 (Backend Data Architecture) were written assuming we would build historical data tables, adapters, and sync pipelines from scratch. The Soma component (`@nativesquare/soma` v0.2.0) now provides:

- **4 Historical Data Tables**: `activities`, `sleepSessions`, `dailySummaries`, `bodyMeasurements`
- **HealthKit Integration**: On-device transformers + `syncHealthKitData()` mutation
- **Strava Integration**: Full OAuth, token management, and activity sync via `soma.connectStrava()` / `soma.syncStrava()`
- **Unified Ingestion API**: `soma.ingestActivity()`, `soma.ingestSleep()`, `soma.ingestBody()`, `soma.ingestDaily()`

**Discovery Context:** Integration confirmed by exploring convex.config.ts and integrations/ directory.

**Evidence:**
- Soma loaded via `app.use(soma)` in convex.config.ts
- HealthKit sync operational in integrations/healthkit/sync.ts
- Strava sync operational in integrations/strava/sync.ts
- Legacy adapter registry empty with comment: "HealthKit: migrated to @nativesquare/soma component"

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact Level | Summary |
|------|--------------|---------|
| Epic 4 | **HIGH** | 1 of 3 stories obsolete, 1 revised, 1 new cleanup story added |
| Epic 5 | **HIGH** | 2 of 4 stories obsolete, 2 unchanged |
| Epic 7 | **MEDIUM** | Strava stories may need revision (Soma handles OAuth) |

### Story Impact Summary

| Story | Original Status | New Status | Change |
|-------|----------------|------------|--------|
| 4.1 | NOT_STARTED | **REVISED** | Scope reduced ~70% |
| 4.2 | NOT_STARTED | STILL_NEEDED | No change |
| 4.3 | NOT_STARTED | **OBSOLETE** | Superseded by Soma |
| 4.4 | N/A | **NEW** | Cleanup legacy code |
| 5.1 | NOT_STARTED | **OBSOLETE** | Superseded by Soma |
| 5.2 | NOT_STARTED | STILL_NEEDED | No change |
| 5.3 | NOT_STARTED | **OBSOLETE** | Superseded by Soma |
| 5.4 | NOT_STARTED | STILL_NEEDED | Updated to read from Soma tables |

### Technical Impact

**Files to Delete:**
- `packages/backend/convex/lib/adapters/index.ts`
- `packages/backend/convex/lib/adapters/registry.ts`
- `packages/backend/convex/lib/adapters/types.ts`
- `packages/backend/convex/strava.ts`
- `packages/backend/convex/healthkit.ts`

**Directories to Remove:**
- `packages/backend/convex/lib/adapters/`

---

## Section 3: Story Assessments

### Epic 4: Wearable Data Integration

#### Story 4.1: HealthKit Integration (iOS) - REVISED

**Original Scope:** Build complete HealthKit integration including native permission handling, data extraction, normalization pipeline, and Convex storage.

**What Soma Now Provides:**
- On-device HealthKit transformers (normalization)
- `syncHealthKitData()` mutation that ingests pre-transformed data via Soma
- Batch ingestion for activities, sleep, body metrics, daily summaries
- Runner connection status updates

**Revised Scope:** Native app permission request, HealthKit data extraction, and calling `syncHealthKitData()` with transformed data.

**Effort Change:** Reduced from ~3 days to ~1 day

#### Story 4.2: Mock Data Providers - STILL_NEEDED

No change. Soma doesn't provide mock data generators. Still needed for development/testing.

#### Story 4.3: Data Normalization & Sync Pipeline - OBSOLETE

Superseded by Soma's `ingestActivity()`, `ingestSleep()`, `ingestBody()`, `ingestDaily()` methods.

#### Story 4.4: Soma Integration Cleanup - NEW

Delete legacy adapter code and document Soma integration. See epics.md for full acceptance criteria.

### Epic 5: Backend Data Architecture

#### Story 5.1: Historical Data Tables Schema - OBSOLETE

Superseded by Soma component tables:
- `activities` - packages/backend/convex/table/activities.ts
- `sleepSessions` - packages/backend/convex/table/sleepSessions.ts
- `dailySummaries` - packages/backend/convex/table/dailySummaries.ts
- `bodyMeasurements` - packages/backend/convex/table/bodyMeasurements.ts

#### Story 5.2: Enhanced Runner Object with Provenance - STILL_NEEDED

Runner Object enhancements for provenance tracking are Cadence-specific. Soma stores raw data but doesn't track justification metadata.

#### Story 5.3: Data Adapters Pattern - OBSOLETE

Soma replaces adapter pattern entirely with `ingest*()` methods.

#### Story 5.4: Inference Engine for Current State - STILL_NEEDED

Soma stores historical data but doesn't compute derived metrics (ATL/CTL/TSB, injury risk). Updated to clarify it reads FROM Soma tables and writes TO `runners.currentState`.

---

## Section 4: Architecture Doc Delta

The following sections in architecture-backend-v2.md need revision:

| Section | Required Change |
|---------|-----------------|
| Wearable Adapter Layer (~526-538) | Update to reference Soma's `ingest*()` methods |
| Historical Data Tables (~542-577) | Note that Soma component provides and manages these tables |
| New Table: Activities (~346-406) | Note: "Implemented by Soma component" |
| New Table: Daily Summaries (~408-452) | Note: "Implemented by Soma component" |
| Strava Integration (~648-719) | Update to reference `soma.connectStrava()` pattern |
| HealthKit Integration (~722-758) | Update to reference Soma transformers |
| Normalizer Functions (~763-802) | Note: "Superseded by Soma" |
| Data Flow Diagram (~461-631) | Update to show "Soma Component" as integration point |
| Module Communication Rules (~253-259) | Update `activities` owner to "Soma component only" |

**Recommendation:** Add a "Soma Integration Note" callout at the top of each affected section.

---

## Section 5: Updated Documents

The following documents have been updated:

1. **epics.md** - Stories marked obsolete, revised, or added with full changelog
2. **sprint-status.yaml** - Epic 4/5 annotations updated, Story 4.4 added

---

## Section 6: Implementation Handoff

**Change Scope:** Moderate

**Handoff Recipients:**
- Development team for Story 4.4 (cleanup)
- Architecture documentation owner for architecture-backend-v2.md updates

**Success Criteria:**
- [ ] Legacy files deleted, build succeeds
- [ ] epics.md updated with obsolete markers and revised stories
- [ ] architecture-backend-v2.md reflects Soma integration
- [ ] Team understands: Soma -> Historical Tables -> Inference Engine -> Runner Object

---

## Summary

| Metric | Value |
|--------|-------|
| Stories obsoleted | 3 (4.3, 5.1, 5.3) |
| Stories revised | 1 (4.1) |
| Stories unchanged | 3 (4.2, 5.2, 5.4) |
| New stories | 1 (4.4 Cleanup) |
| Files to delete | 5 |
| Effort saved | ~4-5 days |
| Effort added | ~0.5 days |
| Net savings | ~4 days |

---

*Approved by: NativeSquare*
*Date: 2026-02-17*
