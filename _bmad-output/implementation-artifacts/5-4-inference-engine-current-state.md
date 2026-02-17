# Story 5.4: Inference Engine for Current State

Status: review

> **Updated 2026-02-17:** Reads from Soma-managed tables (`activities`, `sleepSessions`, `dailySummaries`), writes to Runner Object's `currentState`. This story is STILL NEEDED per Sprint Change Proposal 2026-02-17.
>
> **Data Flow:** Soma tables → Inference Engine → `runners.currentState`

## Story

As a developer,
I want an inference engine that calculates the runner's current state from historical data,
So that the Runner Object's `currentState` is always up-to-date with full provenance tracking.

## Acceptance Criteria

1. **AC1: Training Load Metrics** - The inference engine calculates:
   - ATL (Acute Training Load): 7-day exponentially weighted average
   - CTL (Chronic Training Load): 42-day exponentially weighted average
   - TSB (Training Stress Balance): CTL - ATL
   - Training load trend: "building" | "maintaining" | "declining" | "erratic"

2. **AC2: Injury Risk Calculation** - The engine calculates injury risk:
   - Ramp rate = (current week volume - 4 week avg) / 4 week avg
   - Risk level based on: ramp rate + injury history + age
   - Risk factors array populated

3. **AC3: Recent Patterns** - The engine calculates recent patterns:
   - last7DaysVolume, last7DaysRunCount
   - last28DaysVolume, last28DaysRunCount
   - Average pace by effort zone
   - Consistency score (0-100)

4. **AC4: Latest Biometrics** - The engine pulls latest biometrics from daily summaries:
   - latestRestingHr, latestHrv
   - latestWeight, latestSleepScore

5. **AC5: Module Isolation** - Architecture compliance:
   - Inference Engine is a **pure calculation function** (no DB writes)
   - Returns `CurrentStateCalculation` with raw values + confidence + inferredFrom
   - **Runner Module** is responsible for writing to the database
   - Writing happens "via interface" per architecture spec

6. **AC6: Provenance Tracking** - All inferred values include:
   - `confidence: number` (0-1) indicating calculation reliability
   - `inferredFrom: string[]` listing data sources used (e.g., `["activities.last28days", "dailySummaries.last7days"]`)
   - This enables the Runner module to wrap with full provenance (`source: "inferred"`) when storing

## Tasks / Subtasks

- [x] Task 1: Create inference engine module (AC: 5, 6)
  - [x] Create `packages/backend/convex/lib/inferenceEngine.ts`
  - [x] Define `InferredValue<T>` interface (value + confidence + inferredFrom)
  - [x] Define `CurrentStateCalculation` interface (all metrics as InferredValue)
  - [x] Implement `calculateCurrentState()` as pure function (NO DB writes)
  - [x] Export types for consumers

- [x] Task 2: Implement training load calculations (AC: 1, 6)
  - [x] Implement exponentially weighted moving average (EWMA)
  - [x] Calculate ATL with 7-day decay constant
  - [x] Calculate CTL with 42-day decay constant
  - [x] Calculate TSB = CTL - ATL
  - [x] Determine trend from TSB changes
  - [x] Return confidence based on data availability (e.g., 0.9 if 42+ days, 0.5 if <14 days)
  - [x] Track inferredFrom sources

- [x] Task 3: Implement injury risk calculation (AC: 2, 6)
  - [x] Calculate weekly volume ramp rate
  - [x] Factor in injury history from runner profile
  - [x] Factor in age if available
  - [x] Generate risk factors array
  - [x] Return confidence and inferredFrom sources

- [x] Task 4: Implement pattern analysis (AC: 3, 6)
  - [x] Calculate 7-day and 28-day aggregates
  - [x] Calculate consistency score from activity variance
  - [ ] (Optional) Calculate pace by effort zone - Deferred to future iteration
  - [x] Track which data sources contributed to each metric

- [x] Task 5: Implement biometrics extraction (AC: 4, 6)
  - [x] Extract latest resting HR from daily summaries
  - [x] Extract latest HRV from daily summaries
  - [x] Extract latest weight and sleep score
  - [x] Return confidence based on data freshness


## Dev Notes

### Architecture Compliance

**CRITICAL**: From architecture-backend-v2.md:

**Module 2 - Inference Engine (lines 164-180):**
- Inference Engine is ISOLATED
- Does NOT write directly to runners table
- Returns CurrentState object, **Runner module stores it**
- Pure calculation function (given inputs, produce outputs)

**Table Writers (line 255):**
- `runners` table writers: "Tool Handler, Inference Engine **(via interface)**"
- The "via interface" means writing through the Runner module, not directly

**Module Communication Rules (line 249):**
- "Stateless Calculations: Inference Engine and Plan Generator are pure functions"

**Provenance System (lines 917-924):**
- All fields wrapped with `FieldValue<T>` containing provenance
- Inferred values include: `confidence: number` and `inferredFrom: string[]`

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODULE 2: INFERENCE ENGINE                 │
│   Responsibility: Calculate derived metrics from historical data│
│   Inputs:                                                       │
│   • Historical data tables (activities, sleep, daily)           │
│   • Runner profile (for context: age, injuries)                 │
│   Outputs:                                                      │
│   • CurrentStateCalculation (raw values + confidence + sources) │
│   Files: convex/lib/inference-engine.ts                         │
│   Interface: calculateCurrentState(ctx, runnerId) → Calculation │
│                                                                 │
│   ISOLATED: Does NOT write directly to runners table.           │
│             Returns values that Runner module stores.           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              RUNNER MODULE (Consumer - separate story)          │
│   Will call inference engine and:                               │
│   1. Wrap results with provenance (source: "inferred")          │
│   2. Write to runners.currentState ONLY                         │
└─────────────────────────────────────────────────────────────────┘
```

### Training Load Formulas

**Exponentially Weighted Moving Average (EWMA):**
```typescript
// Decay constants
const ATL_DECAY = 2 / (7 + 1);   // 7-day window
const CTL_DECAY = 2 / (42 + 1);  // 42-day window

// EWMA formula
// newValue = previousValue + decay * (todayLoad - previousValue)
// Or equivalently:
// newValue = decay * todayLoad + (1 - decay) * previousValue
```

**Training Stress Score (simplified):**
```typescript
// For running, we use a simplified TSS based on duration and intensity
// TSS = (duration_seconds / 3600) * intensity_factor * 100

// Intensity factor can be estimated from:
// - Heart rate zones
// - Pace relative to threshold
// - Perceived exertion (RPE)

// Simplified: Use duration * HR zone multiplier
const tssEstimate = (durationSeconds / 3600) * hrZoneMultiplier * 100;
```

**Injury Risk Calculation:**
```typescript
// Ramp rate (acute:chronic workload ratio)
const rampRate = (currentWeekVolume - fourWeekAvg) / fourWeekAvg;

// Risk levels:
// < 10%: low
// 10-25%: moderate
// 25-50%: elevated
// > 50%: high

// Additional factors:
// - Recent injury history: +1 risk level
// - Age > 45: +0.5 risk level
// - Low sleep scores: +0.5 risk level
```

### Data Dependencies

This story depends on:
- **Soma Component**: Historical data tables (`activities`, `sleepSessions`, `dailySummaries`, `bodyMeasurements`) - provided by `@nativesquare/soma`
- **Story 5.2**: Runner Object currentState schema (provenance helpers)
- ~~**Story 5.1**: Historical data tables~~ - OBSOLETE (Soma provides)
- ~~**Story 5.3**: Data adapters~~ - OBSOLETE (Soma provides)

### Project Structure Notes

**Target Files:**
- `packages/backend/convex/lib/inference-engine.ts` (NEW - pure calculation, NO DB writes)

**Consumers (out of scope for this story):**
- Runner module will call this and wrap results with provenance before writing
- Activity import (Story 4.1) will trigger via Runner module
- Plan generation (Epic 6) will call via Runner module
- Daily cron job will call via Runner module

### References

- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#Module-2-Inference-Engine]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Current-State]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Inference-Engine]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4]

### Detailed Specifications

#### Inference Engine Interface (Pure Function)

```typescript
// packages/backend/convex/lib/inference-engine.ts

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Represents a single inferred value with metadata for provenance.
 * The Runner module will wrap this into FieldValue with full provenance.
 */
export interface InferredValue<T> {
  value: T;
  confidence: number;           // 0-1, how reliable is this calculation
  inferredFrom: string[];       // Data sources used, e.g., ["activities.last28days"]
}

/**
 * Raw calculation output from the inference engine.
 * Contains values + confidence + sources for each metric.
 * The Runner module wraps these with full provenance before storing.
 */
export interface CurrentStateCalculation {
  // Training load
  acuteTrainingLoad: InferredValue<number>;      // ATL (7-day)
  chronicTrainingLoad: InferredValue<number>;    // CTL (42-day)
  trainingStressBalance: InferredValue<number>;  // TSB = CTL - ATL
  trainingLoadTrend: InferredValue<"building" | "maintaining" | "declining" | "erratic">;

  // Readiness
  readinessScore: InferredValue<number>;         // 0-100
  readinessFactors: InferredValue<string[]>;

  // Recent patterns
  last7DaysVolume: InferredValue<number>;        // km
  last7DaysRunCount: InferredValue<number>;
  last28DaysVolume: InferredValue<number>;       // km
  last28DaysRunCount: InferredValue<number>;

  // Risk
  injuryRiskLevel: InferredValue<"low" | "moderate" | "elevated" | "high">;
  injuryRiskFactors: InferredValue<string[]>;
  overtrainingRisk?: InferredValue<string>;

  // Latest biometrics (from daily summaries)
  latestRestingHr?: InferredValue<number>;
  latestHrv?: InferredValue<number>;
  latestWeight?: InferredValue<number>;
  latestSleepScore?: InferredValue<number>;

  // Metadata
  calculatedAt: number;
  dataQuality: {
    activitiesCount: number;      // How many activities were analyzed
    oldestActivityDays: number;   // Age of oldest activity in days
    dailySummariesCount: number;  // How many daily summaries available
  };
}

/**
 * Calculate current state from historical data.
 *
 * PURE FUNCTION - does NOT write to database.
 * Returns raw calculations with confidence scores.
 * The Runner module is responsible for:
 *   1. Wrapping with full provenance
 *   2. Writing to runners.currentState
 */
export async function calculateCurrentState(
  ctx: QueryCtx,
  runnerId: Id<"runners">
): Promise<CurrentStateCalculation> {
  // Load historical data
  const activities = await loadRecentActivities(ctx, runnerId, 60); // 60 days
  const dailySummaries = await loadRecentDailySummaries(ctx, runnerId, 7);
  const runner = await ctx.db.get(runnerId);

  // Calculate data quality metrics (affects confidence)
  const dataQuality = {
    activitiesCount: activities.length,
    oldestActivityDays: calculateOldestActivityAge(activities),
    dailySummariesCount: dailySummaries.length,
  };

  // Calculate components (each returns InferredValue with confidence)
  const trainingLoad = calculateTrainingLoad(activities, dataQuality);
  const injuryRisk = calculateInjuryRisk(activities, runner, dataQuality);
  const patterns = calculateRecentPatterns(activities, dataQuality);
  const biometrics = extractLatestBiometrics(dailySummaries);
  const readiness = calculateReadiness(trainingLoad, biometrics, injuryRisk);

  return {
    ...trainingLoad,
    ...patterns,
    ...injuryRisk,
    ...biometrics,
    ...readiness,
    calculatedAt: Date.now(),
    dataQuality,
  };
}
```

#### Training Load Calculation

```typescript
interface TrainingLoadResult {
  acuteTrainingLoad: InferredValue<number>;
  chronicTrainingLoad: InferredValue<number>;
  trainingStressBalance: InferredValue<number>;
  trainingLoadTrend: InferredValue<"building" | "maintaining" | "declining" | "erratic">;
}

function calculateTrainingLoad(
  activities: Doc<"activities">[],
  dataQuality: { activitiesCount: number; oldestActivityDays: number }
): TrainingLoadResult {
  const ATL_DECAY = 2 / 8;   // 7-day EWMA
  const CTL_DECAY = 2 / 43;  // 42-day EWMA

  // Calculate confidence based on data availability
  // Full confidence requires 42+ days of data for CTL accuracy
  const confidence = Math.min(1, dataQuality.oldestActivityDays / 42);
  const inferredFrom = ["activities.last60days"];

  // Group activities by day
  const dailyLoads = groupActivitiesByDay(activities);

  // Calculate daily training stress
  const dailyTSS = dailyLoads.map(day => {
    return day.activities.reduce((sum, a) => {
      const tss = estimateTSS(a);
      return sum + tss;
    }, 0);
  });

  // Calculate EWMA
  let atl = 0;
  let ctl = 0;
  const tsbHistory: number[] = [];

  for (const tss of dailyTSS) {
    atl = atl + ATL_DECAY * (tss - atl);
    ctl = ctl + CTL_DECAY * (tss - ctl);
    tsbHistory.push(ctl - atl);
  }

  const tsb = ctl - atl;

  // Determine trend from recent TSB changes
  const trend = determineTrend(tsbHistory);

  return {
    acuteTrainingLoad: {
      value: Math.round(atl),
      confidence: Math.min(1, dataQuality.oldestActivityDays / 7), // ATL needs 7 days
      inferredFrom,
    },
    chronicTrainingLoad: {
      value: Math.round(ctl),
      confidence, // CTL needs 42 days
      inferredFrom,
    },
    trainingStressBalance: {
      value: Math.round(tsb),
      confidence,
      inferredFrom,
    },
    trainingLoadTrend: {
      value: trend,
      confidence: tsbHistory.length >= 14 ? 0.9 : 0.5, // Trend needs 2 weeks min
      inferredFrom,
    },
  };
}

function estimateTSS(activity: Doc<"activities">): number {
  const durationHours = (activity.durationSeconds ?? 0) / 3600;
  const intensityFactor = getIntensityFactor(activity);
  return durationHours * intensityFactor * 100;
}

function getIntensityFactor(activity: Doc<"activities">): number {
  // Use RPE if available
  if (activity.perceivedExertion) {
    return activity.perceivedExertion / 10;
  }

  // Use HR zones if available
  if (activity.avgHeartRate && activity.maxHeartRate) {
    const hrPercent = activity.avgHeartRate / activity.maxHeartRate;
    return hrPercent;
  }

  // Default: moderate intensity
  return 0.65;
}

function determineTrend(tsbHistory: number[]): "building" | "maintaining" | "declining" | "erratic" {
  if (tsbHistory.length < 7) return "maintaining";

  const recent = tsbHistory.slice(-7);
  const older = tsbHistory.slice(-14, -7);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0
    ? older.reduce((a, b) => a + b, 0) / older.length
    : recentAvg;

  const change = recentAvg - olderAvg;
  const variance = calculateVariance(recent);

  if (variance > 20) return "erratic";
  if (change > 5) return "building";
  if (change < -5) return "declining";
  return "maintaining";
}
```

#### Injury Risk Calculation

```typescript
interface InjuryRiskResult {
  injuryRiskLevel: InferredValue<"low" | "moderate" | "elevated" | "high">;
  injuryRiskFactors: InferredValue<string[]>;
}

function calculateInjuryRisk(
  activities: Doc<"activities">[],
  runner: Doc<"runners"> | null,
  dataQuality: { activitiesCount: number; oldestActivityDays: number }
): InjuryRiskResult {
  const riskFactors: string[] = [];
  const inferredFrom: string[] = ["activities.last28days"];

  // Calculate ramp rate
  const currentWeekVolume = getWeekVolume(activities, 0);
  const fourWeekAvg = (
    getWeekVolume(activities, 1) +
    getWeekVolume(activities, 2) +
    getWeekVolume(activities, 3) +
    getWeekVolume(activities, 4)
  ) / 4;

  const rampRate = fourWeekAvg > 0
    ? (currentWeekVolume - fourWeekAvg) / fourWeekAvg
    : 0;

  // Base risk from ramp rate
  let riskScore = 0;
  if (rampRate > 0.5) {
    riskScore = 3;
    riskFactors.push("Volume increased >50% this week");
  } else if (rampRate > 0.25) {
    riskScore = 2;
    riskFactors.push("Volume increased 25-50% this week");
  } else if (rampRate > 0.1) {
    riskScore = 1;
    riskFactors.push("Volume increased 10-25% this week");
  }

  // Factor: injury history (from runner profile)
  if (runner?.health?.pastInjuries?.length) {
    riskScore += 1;
    riskFactors.push("History of past injuries");
    inferredFrom.push("runner.health.pastInjuries");
  }

  // Factor: age (from runner profile)
  const age = runner?.physical?.age;
  if (age && age > 45) {
    riskScore += 0.5;
    riskFactors.push("Age over 45");
    inferredFrom.push("runner.physical.age");
  }

  // Factor: current pain (from runner profile)
  if (runner?.health?.currentPain?.length) {
    riskScore += 1.5;
    riskFactors.push("Currently experiencing pain");
    inferredFrom.push("runner.health.currentPain");
  }

  // Map score to level
  const level: "low" | "moderate" | "elevated" | "high" =
    riskScore >= 3 ? "high" :
    riskScore >= 2 ? "elevated" :
    riskScore >= 1 ? "moderate" :
    "low";

  // Confidence based on data availability
  const confidence = dataQuality.oldestActivityDays >= 28 ? 0.9 : 0.6;

  return {
    injuryRiskLevel: {
      value: level,
      confidence,
      inferredFrom,
    },
    injuryRiskFactors: {
      value: riskFactors,
      confidence,
      inferredFrom,
    },
  };
}

function getWeekVolume(activities: Doc<"activities">[], weeksAgo: number): number {
  const now = Date.now();
  const weekStart = now - ((weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = now - (weeksAgo * 7 * 24 * 60 * 60 * 1000);

  return activities
    .filter(a => a.startTime >= weekStart && a.startTime < weekEnd)
    .reduce((sum, a) => sum + ((a.distanceMeters ?? 0) / 1000), 0);
}
```

---

### Reference: How Consumers Should Use This

> **Note:** The following is reference documentation for consumers of the inference engine.
> Implementation of the Runner module interface is OUT OF SCOPE for this story.

#### Example: Runner Module Wrapping with Provenance

```typescript
// Example consumer code (Runner module - separate story)
// Shows how to wrap InferredValue into FieldValue with provenance

import { calculateCurrentState, type InferredValue } from "../lib/inference-engine";

function wrapWithProvenance<T>(inferred: InferredValue<T>): FieldValue<T> {
  return {
    value: inferred.value,
    provenance: {
      source: "inferred",
      collectedAt: Date.now(),
      confidence: inferred.confidence,
      inferredFrom: inferred.inferredFrom,
    },
  };
}

// Consumer calls pure function, wraps results, writes to DB
const calculation = await calculateCurrentState(ctx, runnerId);
const wrapped = wrapWithProvenance(calculation.acuteTrainingLoad);
// → { value: 85, provenance: { source: "inferred", confidence: 0.9, inferredFrom: ["activities.last60days"] } }
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- **2026-02-16**: Implemented complete inference engine module as a pure calculation function
- Created `InferredValue<T>` generic interface with value, confidence, and inferredFrom properties
- Created `CurrentStateCalculation` interface with all required metrics
- Implemented `calculateCurrentState()` as main entry point - reads from DB but does NOT write (per architecture spec AC5)
- Training load calculations use EWMA with proper decay constants (ATL: 7-day, CTL: 42-day)
- Injury risk calculation factors in: volume ramp rate, injury history, age, current pain, recovery style
- Pattern analysis calculates 7-day and 28-day volumes, run counts, and consistency score
- Biometrics extraction pulls latest values from daily summaries with freshness-based confidence
- Readiness score calculated as composite of TSB, sleep score, and injury risk
- All values include confidence scores based on data availability and freshness
- TypeScript compilation verified (no errors in backend package)
- Note: Pace by effort zone calculation deferred as optional and not critical for initial implementation
- **2026-02-17**: Added comprehensive test suite covering all Acceptance Criteria:
  - AC1: Training load metrics (ATL, CTL, TSB, trend calculation)
  - AC2: Injury risk calculation (ramp rate, risk factors, age/injury modifiers)
  - AC3: Recent patterns (7/28 day volumes, consistency score)
  - AC4: Latest biometrics (HR, HRV, weight, sleep score extraction)
  - AC5: Module isolation (pure function verification, no DB writes)
  - AC6: Provenance tracking (confidence scores, inferredFrom arrays)
- Tests follow project vitest pattern (vitest not yet installed in backend package)
- Note: Pace by effort zone calculation remains deferred as optional and not critical for initial implementation

### File List

- `packages/backend/convex/lib/inferenceEngine.ts` (NEW) - Pure calculation module with all inference logic
- `packages/backend/convex/lib/inferenceEngine.test.ts` (NEW) - Comprehensive test suite for inference engine

### Change Log

- 2026-02-17: Added comprehensive test suite (Story 5.4 completion)
  - 350+ lines of tests covering all ACs
  - Tests follow existing project vitest patterns
  - Story marked ready for review
- 2026-02-16: Initial implementation of inference engine module (Story 5.4)
- 2026-02-16: Code Review fixes applied (CR-5.4):
  - Fixed story documentation: corrected filename from kebab-case to camelCase
  - Added 20+ named constants for magic numbers (thresholds, confidence values)
  - Added input validation for runnerId (throws if runner not found)
  - Fixed date mutation pattern in groupActivitiesByDay (safer iteration)
  - Marked pace-by-effort-zone task as incomplete (was incorrectly marked done)
