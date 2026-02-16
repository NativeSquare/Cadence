# Story 5.4: Inference Engine for Current State

Status: ready-for-dev

## Story

As a developer,
I want an inference engine that calculates the runner's current state from historical data,
So that the Runner Object's `currentState` is always up-to-date.

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

5. **AC5: Update Behavior** - When inference completes:
   - Only `currentState` section is modified
   - lastCalculatedAt is set
   - User-provided fields are NEVER overwritten

6. **AC6: Trigger Points** - Inference runs when:
   - After each new activity import
   - Daily via scheduled job
   - On demand before plan generation

## Tasks / Subtasks

- [ ] Task 1: Create inference engine core (AC: 1, 2, 3, 4)
  - [ ] Create `packages/backend/convex/lib/inference-engine.ts`
  - [ ] Implement calculateTrainingLoad function
  - [ ] Implement calculateInjuryRisk function
  - [ ] Implement calculateRecentPatterns function
  - [ ] Implement pullLatestBiometrics function

- [ ] Task 2: Implement training load calculations (AC: 1)
  - [ ] Implement exponentially weighted moving average (EWMA)
  - [ ] Calculate ATL with 7-day decay constant
  - [ ] Calculate CTL with 42-day decay constant
  - [ ] Calculate TSB = CTL - ATL
  - [ ] Determine trend from TSB changes

- [ ] Task 3: Implement injury risk calculation (AC: 2)
  - [ ] Calculate weekly volume ramp rate
  - [ ] Factor in injury history from runner profile
  - [ ] Factor in age if available
  - [ ] Generate risk factors array

- [ ] Task 4: Implement pattern analysis (AC: 3)
  - [ ] Calculate 7-day and 28-day aggregates
  - [ ] Calculate consistency score from activity variance
  - [ ] (Optional) Calculate pace by effort zone

- [ ] Task 5: Create inference trigger mutation (AC: 5, 6)
  - [ ] Create `packages/backend/convex/inference/calculate.ts`
  - [ ] Implement runInference mutation
  - [ ] Ensure only currentState is updated
  - [ ] Add lastCalculatedAt timestamp

- [ ] Task 6: Create scheduled daily inference (AC: 6)
  - [ ] Create `packages/backend/convex/scheduled/daily-inference.ts`
  - [ ] Schedule to run once per day
  - [ ] Process all active runners

- [ ] Task 7: Integration with activity import (AC: 6)
  - [ ] Export hook for activity import to trigger inference
  - [ ] Add after-import inference call

## Dev Notes

### Architecture Compliance

**CRITICAL**: From architecture-backend-v2.md Module 2:
- Inference Engine is ISOLATED
- Does NOT write directly to runners table
- Returns CurrentState object, caller writes it
- Pure calculation function (given inputs, produce outputs)

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODULE 2: INFERENCE ENGINE                 │
│   Responsibility: Calculate derived metrics from historical data│
│   Inputs:                                                       │
│   • Historical data tables (activities, sleep, daily)           │
│   Outputs:                                                      │
│   • CurrentState object (ATL, CTL, TSB, readiness, risk)       │
│   Files: convex/lib/inferenceEngine.ts                         │
│   Interface: InferenceEngine.calculate(runnerId) → CurrentState│
│                                                                 │
│   ISOLATED: Does NOT write directly to runners table.          │
│   Caller is responsible for applying CurrentState.             │
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
- **Story 5.1**: Historical data tables (activities, dailySummaries)
- **Story 5.2**: Runner Object currentState schema
- **Story 5.3**: Data adapters (for understanding source data)

### Project Structure Notes

**Target Files:**
- `packages/backend/convex/lib/inference-engine.ts` (NEW - core logic)
- `packages/backend/convex/inference/calculate.ts` (NEW - mutation)
- `packages/backend/convex/scheduled/daily-inference.ts` (NEW - cron job)

**Integration Points:**
- Called after activity import (Story 4.1)
- Called before plan generation (Epic 6)
- Called on schedule (daily)

### References

- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#Module-2-Inference-Engine]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Current-State]
- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Inference-Engine]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4]

### Detailed Specifications

#### Inference Engine Interface

```typescript
// packages/backend/convex/lib/inference-engine.ts

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export interface CurrentState {
  // Training load
  acuteTrainingLoad: number;      // ATL (7-day)
  chronicTrainingLoad: number;    // CTL (42-day)
  trainingStressBalance: number;  // TSB = CTL - ATL
  trainingLoadTrend: "building" | "maintaining" | "declining" | "erratic";

  // Readiness
  readinessScore: number;         // 0-100
  readinessFactors: string[];

  // Recent patterns
  last7DaysVolume: number;        // km
  last7DaysRunCount: number;
  last28DaysVolume: number;       // km
  last28DaysRunCount: number;

  // Risk
  injuryRiskLevel: "low" | "moderate" | "elevated" | "high";
  injuryRiskFactors: string[];
  overtrainingRisk?: string;

  // Latest biometrics
  latestRestingHr?: number;
  latestHrv?: number;
  latestWeight?: number;
  latestSleepScore?: number;

  // Timestamp
  lastCalculatedAt: number;
}

/**
 * Calculate current state from historical data.
 * This is a pure function - does not write to database.
 */
export async function calculateCurrentState(
  ctx: QueryCtx,
  runnerId: Id<"runners">
): Promise<CurrentState> {
  // Load historical data
  const activities = await loadRecentActivities(ctx, runnerId, 60); // 60 days
  const dailySummaries = await loadRecentDailySummaries(ctx, runnerId, 7);
  const runner = await ctx.db.get(runnerId);

  // Calculate components
  const trainingLoad = calculateTrainingLoad(activities);
  const injuryRisk = calculateInjuryRisk(activities, runner);
  const patterns = calculateRecentPatterns(activities);
  const biometrics = extractLatestBiometrics(dailySummaries);
  const readiness = calculateReadiness(trainingLoad, biometrics, injuryRisk);

  return {
    ...trainingLoad,
    ...patterns,
    ...injuryRisk,
    ...biometrics,
    ...readiness,
    lastCalculatedAt: Date.now(),
  };
}
```

#### Training Load Calculation

```typescript
interface TrainingLoadResult {
  acuteTrainingLoad: number;
  chronicTrainingLoad: number;
  trainingStressBalance: number;
  trainingLoadTrend: "building" | "maintaining" | "declining" | "erratic";
}

function calculateTrainingLoad(activities: Doc<"activities">[]): TrainingLoadResult {
  const ATL_DECAY = 2 / 8;   // 7-day EWMA
  const CTL_DECAY = 2 / 43;  // 42-day EWMA

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
    acuteTrainingLoad: Math.round(atl),
    chronicTrainingLoad: Math.round(ctl),
    trainingStressBalance: Math.round(tsb),
    trainingLoadTrend: trend,
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
  injuryRiskLevel: "low" | "moderate" | "elevated" | "high";
  injuryRiskFactors: string[];
}

function calculateInjuryRisk(
  activities: Doc<"activities">[],
  runner: Doc<"runners"> | null
): InjuryRiskResult {
  const riskFactors: string[] = [];

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

  // Factor: injury history
  if (runner?.health?.pastInjuries?.length) {
    riskScore += 1;
    riskFactors.push("History of past injuries");
  }

  // Factor: age
  const age = runner?.physical?.age;
  if (age && age > 45) {
    riskScore += 0.5;
    riskFactors.push("Age over 45");
  }

  // Factor: current pain
  if (runner?.health?.currentPain?.length) {
    riskScore += 1.5;
    riskFactors.push("Currently experiencing pain");
  }

  // Map score to level
  const level: InjuryRiskResult["injuryRiskLevel"] =
    riskScore >= 3 ? "high" :
    riskScore >= 2 ? "elevated" :
    riskScore >= 1 ? "moderate" :
    "low";

  return {
    injuryRiskLevel: level,
    injuryRiskFactors: riskFactors,
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

#### Inference Mutation

```typescript
// packages/backend/convex/inference/calculate.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { calculateCurrentState } from "../lib/inference-engine";

/**
 * Run inference and update runner's currentState.
 * Called after activity import, daily scheduled, or on-demand.
 */
export const runInference = mutation({
  args: {
    runnerId: v.id("runners"),
  },
  handler: async (ctx, args) => {
    // Calculate new state (pure function)
    const currentState = await calculateCurrentState(ctx, args.runnerId);

    // Update ONLY the currentState section
    await ctx.db.patch(args.runnerId, {
      currentState,
    });

    return currentState;
  },
});
```

#### Scheduled Daily Job

```typescript
// packages/backend/convex/scheduled/daily-inference.ts

import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";

const crons = cronJobs();

// Run daily at 4am UTC
crons.daily(
  "daily-inference",
  { hourUTC: 4, minuteUTC: 0 },
  internal.inference.runDailyInference
);

export default crons;
```

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
