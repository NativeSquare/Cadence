# Story 3.9: Backend Wiring - Visualization Data

Status: ready-for-dev

---

## Story

As a **user**,
I want **the visualization screens to show my actual profile and plan data**,
So that **the charts and projections are personalized to me**.

---

## Acceptance Criteria

### AC1: RadarChart Real Data

**Given** RadarChart needs real data
**When** plan generation completes
**Then** `runnerSnapshot.profileRadar` provides the 6 axis values:
  - `endurance`: calculated from weekly volume and long run percentage
  - `speed`: calculated from recent pace data or goal-based estimate
  - `recovery`: calculated from rest days, sleep quality, stress level
  - `consistency`: calculated from training frequency variance
  - `injuryRisk`: calculated from injury history, recovery style, load changes
  - `raceReady`: composite score for goal-specific readiness
**And** `uncertain` flag is set based on data source (inferred vs confirmed)

### AC2: ProgressionChart Real Data

**Given** ProgressionChart needs real data
**When** plan generation completes
**Then** `weeklyPlan` array provides for each week:
  - `volumeKm`: planned total weekly volume
  - `intensityScore`: 1-10 scale of week difficulty
  - `isRecoveryWeek`: boolean marking recovery/deload weeks
  - `weekLabel`: display label (e.g., "Week 1", "Race Week")
**And** weeks align with plan start date to race date

### AC3: CalendarWidget Real Data

**Given** CalendarWidget needs real data
**When** plan generation completes
**Then** `plannedSessions` for week 1 are queried with:
  - `dayOfWeek`: Monday-Sunday mapping
  - `sessionTypeDisplay`: "Tempo", "Easy", "Intervals", "Long Run", "Rest"
  - `targetDurationDisplay`: formatted duration (e.g., "45 min")
  - `isKeySession`: boolean for important workouts
  - `isRestDay`: boolean for rest days

### AC4: DecisionAudit Real Data

**Given** DecisionAudit needs real data
**When** plan generation completes
**Then** `decisions` array provides the audit trail:
  - `question`: the coaching decision question
  - `answer`: the reasoning/justification
**And** `safeguardApplications` shows what limits were applied
**And** `seasonView.expectedOutcomes` provides confidence and reasoning

### AC5: Data Path Differentiation

**Given** the user is on DATA path (wearable connected)
**When** visualizations render
**Then** charts show higher confidence values
**And** ranges are narrower
**And** coach messages reference actual data

**Given** the user is on NO DATA path
**When** visualizations render
**Then** charts show uncertainty indicators (dashed lines, orange markers)
**And** ranges are wider
**And** coach messages acknowledge estimation

---

## Tasks / Subtasks

- [ ] **Task 1: Create ProfileRadar Calculator** (AC: #1)
  - [ ] Create `packages/backend/convex/ai/calculators/profile-radar.ts`
  - [ ] Implement `calculateEndurance(runner: RunnerDocument): { value: number; uncertain: boolean }`
    - DATA path: derive from weekly volume trends, long run %
    - NO DATA path: estimate from stated experience level
  - [ ] Implement `calculateSpeed(runner)` - pace data or goal-based estimate
  - [ ] Implement `calculateRecovery(runner)` - rest days, sleep, stress
  - [ ] Implement `calculateConsistency(runner)` - training frequency variance
  - [ ] Implement `calculateInjuryRisk(runner)` - injury history, recovery style
  - [ ] Implement `calculateRaceReady(runner)` - composite readiness score
  - [ ] Export `buildProfileRadar(runner): ProfileRadarData`

- [ ] **Task 2: Create Weekly Plan Data Provider** (AC: #2)
  - [ ] Create `packages/backend/convex/ai/calculators/weekly-plan.ts`
  - [ ] Define `WeeklyPlanData` interface matching ProgressionChart props
  - [ ] Implement `buildWeeklyPlan(plan: TrainingPlan): WeeklyPlanData[]`
  - [ ] Calculate volumeKm per week from planned sessions
  - [ ] Calculate intensityScore based on session types and volume
  - [ ] Mark recovery weeks based on volume dips
  - [ ] Generate weekLabel including race week handling

- [ ] **Task 3: Create Calendar Session Provider** (AC: #3)
  - [ ] Create `packages/backend/convex/ai/calculators/calendar-sessions.ts`
  - [ ] Define `CalendarSessionData` interface matching CalendarWidget props
  - [ ] Implement `getWeekSessions(planId: Id, weekNumber: number): CalendarSessionData[]`
  - [ ] Query plannedSessions table for specific week
  - [ ] Format session data for UI display
  - [ ] Handle rest days (no session = rest)

- [ ] **Task 4: Create Decision Audit Provider** (AC: #4)
  - [ ] Create `packages/backend/convex/ai/calculators/decision-audit.ts`
  - [ ] Define `DecisionAuditData` interface
  - [ ] Query plan generation decisions from plan document
  - [ ] Format safeguard applications with user-friendly explanations
  - [ ] Build expected outcomes with confidence levels

- [ ] **Task 5: Create Visualization Data Query** (AC: #1-4)
  - [ ] Create `packages/backend/convex/plans/visualization.ts`
  - [ ] Implement `getVisualizationData` query:
    ```typescript
    export const getVisualizationData = query({
      args: { runnerId: v.id("runners") },
      handler: async (ctx, args) => {
        // Returns all visualization data in one query
        return {
          profileRadar: ProfileRadarData,
          weeklyPlan: WeeklyPlanData[],
          currentWeekSessions: CalendarSessionData[],
          decisionAudit: DecisionAuditData,
          dataPath: "DATA" | "NO_DATA",
        };
      },
    });
    ```

- [ ] **Task 6: Update RadarChart Component** (AC: #1, #5)
  - [ ] Modify `apps/native/src/components/app/onboarding/viz/RadarChart.tsx`
  - [ ] Add `data: ProfileRadarData` prop alongside mock data fallback
  - [ ] Render uncertainty indicators for `uncertain: true` values
  - [ ] Use dashed lines / orange markers for NO DATA path
  - [ ] Keep mock data as default for development

- [ ] **Task 7: Update ProgressionChart Component** (AC: #2, #5)
  - [ ] Modify `apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx`
  - [ ] Add `data: WeeklyPlanData[]` prop alongside mock data fallback
  - [ ] Add uncertainty visualization for NO DATA path
  - [ ] Highlight recovery weeks visually
  - [ ] Keep mock data as default for development

- [ ] **Task 8: Update CalendarWidget Component** (AC: #3, #5)
  - [ ] Modify `apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx`
  - [ ] Add `sessions: CalendarSessionData[]` prop alongside mock data fallback
  - [ ] Format real session data for display
  - [ ] Keep mock data as default for development

- [ ] **Task 9: Create useVisualizationData Hook** (AC: #1-5)
  - [ ] Create `apps/native/src/hooks/use-visualization-data.ts`
  - [ ] Subscribe to Convex `getVisualizationData` query
  - [ ] Handle loading state with mock data fallback
  - [ ] Expose data path for conditional rendering
  - [ ] Memoize data transformations for performance

- [ ] **Task 10: Wire Screens to Real Data** (AC: #1-5)
  - [ ] Update `RadarScreen.tsx` to use `useVisualizationData` hook
  - [ ] Update `ProgressionScreen.tsx` to use hook
  - [ ] Update `CalendarScreen.tsx` to use hook
  - [ ] Update `VerdictScreen.tsx` to use hook for decision audit
  - [ ] Pass dataPath to coach message selection

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from [architecture.md](../planning-artifacts/architecture.md):**

1. **Data Flow (architecture.md#Data Flow):**
   - Visualization data flows: Plan Document -> Calculator -> Query -> Hook -> Component
   - Never duplicate Convex data in local state
   - Use single query for all visualization data to minimize subscriptions

2. **State Management (architecture.md#State Management Patterns):**
   - Server State: Convex `useQuery`
   - Components receive data as props
   - Hooks bridge Convex and UI

3. **Charting (architecture.md#Visual Components):**
   - Victory Native XL for ProgressionChart
   - Skia for RadarChart
   - Components already exist with mock data

### Existing Implementation Assets

**Visualization Components:**

| File | Status | Data Shape |
|------|--------|------------|
| [viz/RadarChart.tsx](../../apps/native/src/components/app/onboarding/viz/RadarChart.tsx) | Built with mock | 6-axis values 0-100, uncertain flag |
| [viz/ProgressionChart.tsx](../../apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx) | Built with mock | WeekData[] with volume, intensity, isRecovery |
| [viz/CalendarWidget.tsx](../../apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx) | Built with mock | DayData[] with type, duration, isKey |

**Mock Data at [mock-data.ts](../../apps/native/src/components/app/onboarding/mock-data.ts):**
- Lines 14-31: `mockRunnerProfile` - RadarChart data shapes
- Lines 37-54: `mockTrainingPlan` - ProgressionChart WeekData[]
- Lines 60-76: `mockWeeklySchedule` - CalendarWidget DayData[]
- Lines 82-95: `mockProjection` - Verdict data
- Lines 101-121: `mockDecisions` - Decision audit

### Profile Radar Calculation Logic

```typescript
// packages/backend/convex/ai/calculators/profile-radar.ts

export interface ProfileRadarData {
  endurance: { value: number; uncertain: boolean };
  speed: { value: number; uncertain: boolean };
  recovery: { value: number; uncertain: boolean };
  consistency: { value: number; uncertain: boolean };
  injuryRisk: { value: number; uncertain: boolean };
  raceReady: { value: number; uncertain: boolean };
}

export function buildProfileRadar(runner: RunnerDocument): ProfileRadarData {
  const hasWearableData = runner.connections?.wearableDecision === "connected" &&
    (runner.inferred?.fromHealthKit || runner.inferred?.fromStrava);

  return {
    endurance: calculateEndurance(runner, hasWearableData),
    speed: calculateSpeed(runner, hasWearableData),
    recovery: calculateRecovery(runner, hasWearableData),
    consistency: calculateConsistency(runner, hasWearableData),
    injuryRisk: calculateInjuryRisk(runner, hasWearableData),
    raceReady: calculateRaceReady(runner, hasWearableData),
  };
}

function calculateEndurance(runner: RunnerDocument, hasData: boolean): { value: number; uncertain: boolean } {
  if (hasData && runner.inferred?.weeklyVolume) {
    // DATA path: calculate from actual volume
    const volume = runner.inferred.weeklyVolume;
    const longRunPct = runner.inferred.longRunPercentage ?? 0.25;
    // Higher volume + good long run % = higher endurance
    const value = Math.min(100, Math.round((volume / 60) * 100 * (0.7 + longRunPct)));
    return { value, uncertain: false };
  }

  // NO DATA path: estimate from stated experience
  const experienceMap = {
    beginner: 40,
    returning: 55,
    casual: 60,
    serious: 75,
  };
  const value = experienceMap[runner.running?.experienceLevel ?? "casual"] ?? 60;
  return { value, uncertain: true };
}

// Similar patterns for other metrics...
```

### Weekly Plan Data Shape

```typescript
// packages/backend/convex/ai/calculators/weekly-plan.ts

export interface WeeklyPlanData {
  weekNumber: number;
  weekLabel: string;
  volumeKm: number;
  intensityScore: number; // 1-10
  isRecoveryWeek: boolean;
  startDate: number; // Unix timestamp
}

export function buildWeeklyPlan(plan: PlanDocument): WeeklyPlanData[] {
  const weeks: WeeklyPlanData[] = [];

  for (let i = 0; i < plan.totalWeeks; i++) {
    const weekSessions = plan.sessions.filter(s => s.weekNumber === i + 1);
    const volumeKm = weekSessions.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
    const avgIntensity = weekSessions.reduce((sum, s) => sum + s.intensityLevel, 0) / weekSessions.length;

    weeks.push({
      weekNumber: i + 1,
      weekLabel: i === plan.totalWeeks - 1 ? "Race Week" : `Week ${i + 1}`,
      volumeKm,
      intensityScore: Math.round(avgIntensity),
      isRecoveryWeek: volumeKm < plan.averageWeeklyVolume * 0.8,
      startDate: plan.startDate + (i * 7 * 24 * 60 * 60 * 1000),
    });
  }

  return weeks;
}
```

### Calendar Session Data Shape

```typescript
// packages/backend/convex/ai/calculators/calendar-sessions.ts

export interface CalendarSessionData {
  dayOfWeek: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  sessionTypeDisplay: string;
  targetDurationDisplay: string | null;
  isKeySession: boolean;
  isRestDay: boolean;
}

export async function getWeekSessions(
  ctx: QueryCtx,
  planId: Id<"trainingPlans">,
  weekNumber: number
): Promise<CalendarSessionData[]> {
  const sessions = await ctx.db
    .query("plannedSessions")
    .withIndex("by_plan_week", (q) => q.eq("planId", planId).eq("weekNumber", weekNumber))
    .collect();

  // Build full week with rest days
  const weekDays: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[] =
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return weekDays.map(day => {
    const session = sessions.find(s => s.dayOfWeek === day);
    if (!session) {
      return { dayOfWeek: day, sessionTypeDisplay: "Rest", targetDurationDisplay: null, isKeySession: false, isRestDay: true };
    }
    return {
      dayOfWeek: day,
      sessionTypeDisplay: session.sessionType,
      targetDurationDisplay: `${session.durationMinutes} min`,
      isKeySession: session.isKeySession,
      isRestDay: false,
    };
  });
}
```

### useVisualizationData Hook

```typescript
// apps/native/src/hooks/use-visualization-data.ts

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { mockRunnerProfile, mockTrainingPlan, mockWeeklySchedule, mockDecisions } from "@/components/app/onboarding/mock-data";

export function useVisualizationData(runnerId: Id<"runners"> | null) {
  const data = useQuery(
    api.plans.visualization.getVisualizationData,
    runnerId ? { runnerId } : "skip"
  );

  // Fallback to mock data during loading or when no plan exists
  const profileRadar = data?.profileRadar ?? transformMockProfile(mockRunnerProfile.data);
  const weeklyPlan = data?.weeklyPlan ?? mockTrainingPlan;
  const currentWeekSessions = data?.currentWeekSessions ?? mockWeeklySchedule;
  const decisionAudit = data?.decisionAudit ?? { decisions: mockDecisions, safeguards: [] };
  const dataPath = data?.dataPath ?? "NO_DATA";

  return {
    profileRadar,
    weeklyPlan,
    currentWeekSessions,
    decisionAudit,
    dataPath,
    isLoading: data === undefined,
    hasRealData: data !== undefined && data !== null,
  };
}
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/calculators/profile-radar.ts` | ProfileRadar calculation |
| `packages/backend/convex/ai/calculators/weekly-plan.ts` | WeeklyPlan data builder |
| `packages/backend/convex/ai/calculators/calendar-sessions.ts` | Calendar session provider |
| `packages/backend/convex/ai/calculators/decision-audit.ts` | Decision audit provider |
| `packages/backend/convex/plans/visualization.ts` | Unified visualization query |
| `apps/native/src/hooks/use-visualization-data.ts` | React hook for viz data |

**Files to Modify:**

| File | Change |
|------|--------|
| `apps/native/src/components/app/onboarding/viz/RadarChart.tsx` | Add real data prop |
| `apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx` | Add real data prop |
| `apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx` | Add real data prop |
| `apps/native/src/components/app/onboarding/screens/*.tsx` | Wire to useVisualizationData |

### Dependencies

**Depends on:** Epic 6 (Plan Generation Engine) for plan data to exist

Note: This story can be partially implemented by:
1. Creating the data provider infrastructure
2. Wiring components to accept real data props
3. Keeping mock data fallback until Epic 6 provides real plans

| Dependency | Required For |
|------------|--------------|
| Epic 6 Plan Generation | Real weeklyPlan and session data |
| Story 5.4 Inference Engine | Real profile radar calculations with wearable data |

### Testing Workflow

1. **Calculator Tests:**
   - Test profile radar calculations with mock runner data
   - Test weekly plan builder with mock plan data
   - Test calendar session provider with mock sessions

2. **Query Tests:**
   - Test getVisualizationData returns all required fields
   - Test fallback behavior when plan doesn't exist
   - Test data path detection (DATA vs NO_DATA)

3. **Component Tests:**
   - RadarChart renders with real data prop
   - ProgressionChart renders with real data prop
   - CalendarWidget renders with real session data
   - Components fallback gracefully to mock data

4. **Integration Tests:**
   - Hook returns mock data during loading
   - Hook returns real data when plan exists
   - Screens render correctly with hook data

### References

- [Source: architecture.md#Visual Components] - Charting library decisions
- [Source: mock-data.ts] - Current data shapes used by components
- [Source: epics.md#Story 3.9] - Acceptance criteria
- [Source: data-model-comprehensive.md] - Plan and session schemas
- [Source: viz/RadarChart.tsx] - Existing component implementation

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
