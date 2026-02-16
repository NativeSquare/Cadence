# Story 5.1: Historical Data Tables Schema

Status: complete

## Story

As a developer,
I want the complete historical data schema implemented in Convex,
So that wearable data from any provider can be stored in a unified format.

## Acceptance Criteria

1. **AC1: Activities Table** - `activities` table exists with Terra-aligned fields:
   - Core: runnerId, userId, externalId, source
   - Time: startTime, endTime, timezone
   - Distance & Movement: distanceMeters, durationSeconds, elevationGainMeters, steps
   - Pace & Speed: avgPaceSecondsPerKm, maxPaceSecondsPerKm, avgSpeedKmh
   - Heart Rate: avgHeartRate, maxHeartRate, restingHeartRate, hrvMs
   - Zones: hrZone1-5 minutes
   - Training Load: calories, trainingLoad (TSS/suffer), perceivedExertion
   - Power/Running: avgPower, avgCadence, groundContactTime, strideLength
   - Cadence-specific: sessionType, planAdherence, userFeedback
   - Samples: heartRateSamples, paceSamples (JSON for MVP)
   - Metadata: rawPayload, importedAt, lastSyncedAt

2. **AC2: Sleep Sessions Table** - `sleepSessions` table exists with:
   - Duration stages: totalSleepMinutes, deepSleepMinutes, lightSleepMinutes, remSleepMinutes, awakeMinutes
   - Heart rate: avgHeartRate, lowestHeartRate, hrvMs
   - Recovery: readinessScore, recoveryScore
   - Respiration: avgBreathingRate

3. **AC3: Daily Summaries Table** - `dailySummaries` table exists with:
   - Aggregates: totalDistanceMeters, totalSteps, totalCalories, activityCount
   - Heart: restingHeartRate, avgHeartRate, hrvMs
   - Sleep summary: sleepDurationMinutes, sleepQuality
   - Readiness: readinessScore, stressLevel
   - Training load: acuteTrainingLoad, chronicTrainingLoad, trainingStressBalance

4. **AC4: Body Measurements Table** - `bodyMeasurements` table exists with:
   - Weight, bodyFatPercent, muscleMass
   - Blood pressure, glucose, temperature

5. **AC5: Indexes** - All tables have indexes for:
   - Queries by runnerId
   - Queries by date range (startTime)
   - Queries by source provider

## Tasks / Subtasks

- [x] Task 1: Create activities table schema (AC: 1, 5)
  - [x] Create `packages/backend/convex/table/activities.ts`
  - [x] Define all Terra-aligned fields with `v.optional()` for nullable fields
  - [x] Add indexes: by_runnerId, by_startTime, by_source, by_externalId
  - [x] Export table definition

- [x] Task 2: Create sleepSessions table schema (AC: 2, 5)
  - [x] Create `packages/backend/convex/table/sleepSessions.ts`
  - [x] Define sleep stage fields
  - [x] Define heart rate and recovery fields
  - [x] Add indexes: by_runnerId, by_startTime, by_date

- [x] Task 3: Create dailySummaries table schema (AC: 3, 5)
  - [x] Create `packages/backend/convex/table/dailySummaries.ts`
  - [x] Define aggregate activity fields
  - [x] Define biometric summary fields
  - [x] Add indexes: by_runnerId_date, by_userId

- [x] Task 4: Create bodyMeasurements table schema (AC: 4, 5)
  - [x] Create `packages/backend/convex/table/bodyMeasurements.ts`
  - [x] Define weight/composition fields
  - [x] Define blood pressure, glucose, temperature fields
  - [x] Add indexes: by_runnerId, by_timestamp, by_type

- [x] Task 5: Register all tables in central schema (AC: 1-5)
  - [x] Import all new tables in `packages/backend/convex/schema.ts`
  - [x] Add to schema exports
  - [x] Run `npx convex dev` to verify schema compiles

## Dev Notes

### Architecture Compliance

**CRITICAL**: Follow the exact patterns from existing `runners.ts`:
- Use `defineTable()` from `convex/server`
- Use `v.optional()` for nullable fields
- Use `v.union(v.literal(...))` for enum types
- Use `v.id("tableName")` for foreign keys

### Schema Patterns (from runners.ts)

```typescript
// Example pattern to follow:
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const activities = defineTable({
  runnerId: v.id("runners"),
  userId: v.id("users"),
  source: v.string(),  // "healthkit" | "strava" | "manual"
  // ... other fields
})
.index("by_runnerId", ["runnerId"])
.index("by_startTime", ["runnerId", "startTime"]);
```

### Terra Alignment

These schemas are designed to align 1-1 with Terra API data models for future migration. Key mappings:
- `activities` -> Terra Activity model
- `sleepSessions` -> Terra Sleep model
- `dailySummaries` -> Terra Daily model
- `bodyMeasurements` -> Terra Body model

### Project Structure Notes

**Target Files:**
- `packages/backend/convex/table/activities.ts` (NEW)
- `packages/backend/convex/table/sleepSessions.ts` (NEW)
- `packages/backend/convex/table/dailySummaries.ts` (NEW)
- `packages/backend/convex/table/bodyMeasurements.ts` (NEW)
- `packages/backend/convex/schema.ts` (MODIFY - add imports)

**Existing Table Examples:**
- `packages/backend/convex/table/runners.ts` - Primary pattern reference
- `packages/backend/convex/table/users.ts` - Simple table pattern
- `packages/backend/convex/table/stravaConnections.ts` - Connection pattern

### References

- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#New-Table-Activities]
- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#New-Table-Daily-Summaries]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Table-activities]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Table-sleepSessions]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Table-dailySummaries]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Table-bodyMeasurements]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1]

### Detailed Schema Specifications

#### Activities Table (from architecture-backend-v2.md)

```typescript
activities: defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Terra-aligned metadata
  externalId: v.optional(v.string()),        // summary_id equivalent
  source: v.string(),                         // "strava" | "healthkit" | "manual" | "terra"

  // Core fields (Terra Activity model aligned)
  startTime: v.number(),                      // Unix timestamp
  endTime: v.number(),
  activityType: v.string(),                   // "running" | "cycling" | "swimming" | etc.
  name: v.optional(v.string()),               // "Morning Run"

  // Distance & Movement
  distanceMeters: v.optional(v.number()),
  durationSeconds: v.optional(v.number()),
  elevationGainMeters: v.optional(v.number()),
  steps: v.optional(v.number()),

  // Pace & Speed
  avgPaceSecondsPerKm: v.optional(v.number()),
  maxPaceSecondsPerKm: v.optional(v.number()),
  avgSpeedKmh: v.optional(v.number()),

  // Heart Rate
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  restingHeartRate: v.optional(v.number()),

  // Training Load
  calories: v.optional(v.number()),
  trainingLoad: v.optional(v.number()),       // Strava's suffer score, etc.
  perceivedExertion: v.optional(v.number()),  // 1-10 scale

  // Cadence
  avgCadence: v.optional(v.number()),

  // Recovery/Readiness (from daily summaries)
  recoveryScore: v.optional(v.number()),
  hrvMs: v.optional(v.number()),

  // Samples (store as JSON for MVP, separate table later)
  heartRateSamples: v.optional(v.string()),   // JSON array for MVP
  paceSamples: v.optional(v.string()),        // JSON array for MVP

  // Metadata
  rawPayload: v.optional(v.string()),         // Original API response (debugging)
  importedAt: v.number(),
  lastSyncedAt: v.number(),
})
.index("by_runnerId", ["runnerId"])
.index("by_userId", ["userId"])
.index("by_startTime", ["runnerId", "startTime"])
.index("by_source", ["runnerId", "source"])
.index("by_externalId", ["source", "externalId"])
```

#### Daily Summaries Table (from architecture-backend-v2.md)

```typescript
dailySummaries: defineTable({
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Date (one record per day)
  date: v.string(),                           // "2026-02-16" format

  // Activity Totals
  totalDistanceMeters: v.optional(v.number()),
  totalDurationSeconds: v.optional(v.number()),
  totalSteps: v.optional(v.number()),
  totalCalories: v.optional(v.number()),
  activityCount: v.optional(v.number()),

  // Heart Rate Summary
  restingHeartRate: v.optional(v.number()),
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  hrvMs: v.optional(v.number()),

  // Sleep (from HealthKit/wearable)
  sleepDurationMinutes: v.optional(v.number()),
  sleepQuality: v.optional(v.string()),       // "good" | "fair" | "poor"
  deepSleepMinutes: v.optional(v.number()),
  remSleepMinutes: v.optional(v.number()),

  // Readiness/Recovery (device-specific)
  readinessScore: v.optional(v.number()),     // 0-100
  recoveryScore: v.optional(v.number()),      // 0-100
  stressLevel: v.optional(v.number()),        // 0-100

  // Source tracking
  sources: v.array(v.string()),               // ["strava", "healthkit"]

  // Metadata
  lastUpdatedAt: v.number(),
})
.index("by_runnerId_date", ["runnerId", "date"])
.index("by_userId", ["userId"])
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- All 4 historical data tables created with Terra-aligned schemas
- Activities table includes comprehensive fields: core time/distance, pace, HR, HR zones, training load, power, running dynamics, Cadence-specific fields (sessionType, planAdherence), weather, and JSON sample storage
- SleepSessions table includes sleep stages, HR/HRV metrics, recovery scores, respiration data
- DailySummaries table includes activity aggregates, training load (ATL/CTL/TSB), biometrics, menstrual tracking
- BodyMeasurements table includes weight/composition, BP, glucose, temperature with measurement type enum
- All tables registered in schema.ts with appropriate indexes
- Schema compiles successfully with `npx convex dev`
- 24 new indexes added across all tables

### File List

- `packages/backend/convex/table/activities.ts` (NEW)
- `packages/backend/convex/table/sleepSessions.ts` (NEW)
- `packages/backend/convex/table/dailySummaries.ts` (NEW)
- `packages/backend/convex/table/bodyMeasurements.ts` (NEW)
- `packages/backend/convex/schema.ts` (MODIFIED)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Amelia - Dev Agent)
**Date:** 2026-02-16
**Outcome:** Approved with fixes applied

### AC Validation

| AC | Status | Notes |
|----|--------|-------|
| AC1: Activities Table | ✅ PASS | All Terra-aligned fields present |
| AC2: Sleep Sessions | ✅ PASS | Sleep stages, HR, recovery complete |
| AC3: Daily Summaries | ✅ PASS | Aggregates, training load present |
| AC4: Body Measurements | ✅ PASS | Weight, BP, glucose, temp present |
| AC5: Indexes | ✅ PASS | 24 indexes across all tables |

### Issues Found & Fixed

1. **M2 (FIXED):** `dailySummaries.sources` was required but should be optional - fixed to `v.optional(v.array(v.string()))`
2. **M3 (FIXED):** Added forward reference comment for `plannedSessions` table in activities.ts
3. **L1 (NOTED):** Inconsistent date/time patterns across tables - acceptable for different query needs

### Change Log

- 2026-02-16: Code review passed, M2/M3 fixes applied
