# Story 6.6: Plan-to-UI Data Queries

Status: done

## Story

As a developer,
I want efficient queries to fetch plan data for visualization components,
So that the UI can render quickly without over-fetching.

## Acceptance Criteria

1. **AC1: RadarChart Query** - Given RadarChart needs data
   When queried
   Then returns only `runnerSnapshot.profileRadar` array
   And response shape matches RadarChart props exactly

2. **AC2: ProgressionChart Query** - Given ProgressionChart needs data
   When queried
   Then returns `weeklyPlan` with only:
   - weekNumber
   - volumeKm
   - intensityScore
   - isRecoveryWeek
   - weekLabel
   And response shape matches ProgressionChart props exactly

3. **AC3: CalendarWidget Query** - Given CalendarWidget needs data
   When queried
   Then returns `plannedSessions` for specified week with display fields only:
   - sessionTypeDisplay
   - targetDurationDisplay
   - effortDisplay
   - targetPaceDisplay (optional)
   - structureDisplay (optional)
   - justification
   - isKeySession
   - isRestDay
   - dayOfWeekShort
   And supports pagination for multi-week views

4. **AC4: DecisionAudit Query** - Given DecisionAudit component needs data
   When queried
   Then returns:
   - `decisions` array with category, decision, reasoning
   - `safeguardApplications` array

5. **AC5: Verdict Query** - Given Verdict component needs data
   When queried
   Then returns `seasonView.expectedOutcomes`:
   - primaryGoal
   - confidenceLevel
   - confidenceReason
   - secondaryOutcomes

6. **AC6: Query Optimization** - All queries are optimized:
   - Use Convex indexes (no full table scans)
   - Return only required fields (no over-fetching)
   - Support pagination for sessions
   - Include proper error handling for missing plans

7. **AC7: Type Safety** - All queries have:
   - Proper TypeScript return types
   - Types that match UI component prop interfaces
   - Exported types for frontend consumption

## Tasks / Subtasks

- [x] Task 1: Create queries module (AC: 7)
  - [x] 1.1 Create `packages/backend/convex/training/queries.ts`
  - [x] 1.2 Define return type interfaces matching UI components
  - [x] 1.3 Export types for frontend consumption

- [x] Task 2: Implement RadarChart query (AC: 1, 6)
  - [x] 2.1 Create `getRadarChartData(planId)` query
  - [x] 2.2 Return only profileRadar array
  - [x] 2.3 Handle missing plan gracefully
  - [x] 2.4 Verify index usage (by_runnerId or by_userId)

- [x] Task 3: Implement ProgressionChart query (AC: 2, 6)
  - [x] 3.1 Create `getProgressionChartData(planId)` query
  - [x] 3.2 Map weeklyPlan to minimal response shape
  - [x] 3.3 Handle missing plan gracefully
  - [x] 3.4 Verify index usage

- [x] Task 4: Implement CalendarWidget query (AC: 3, 6)
  - [x] 4.1 Create `getWeekSessions(planId, weekNumber)` query
  - [x] 4.2 Use by_week index on plannedSessions
  - [x] 4.3 Map to display fields only
  - [x] 4.4 Create `getMultiWeekSessions(planId, startWeek, endWeek)` for calendar view
  - [x] 4.5 Implement pagination with cursor

- [x] Task 5: Implement DecisionAudit query (AC: 4, 6)
  - [x] 5.1 Create `getDecisionAudit(planId)` query
  - [x] 5.2 Return decisions + safeguardApplications
  - [x] 5.3 Handle missing plan gracefully

- [x] Task 6: Implement Verdict query (AC: 5, 6)
  - [x] 6.1 Create `getExpectedOutcomes(planId)` query
  - [x] 6.2 Return only expectedOutcomes object
  - [x] 6.3 Handle missing plan gracefully

- [x] Task 7: Create composite queries for screens (AC: 6)
  - [x] 7.1 Create `getPlanOverview(planId)` - combines radar + progression + verdict
  - [x] 7.2 Create `getActivePlanForRunner(runnerId)` - gets active plan ID
  - [x] 7.3 Optimize for minimal round trips

- [x] Task 8: Add query tests (AC: 6, 7)
  - [x] 8.1 Test empty/missing plan handling
  - [x] 8.2 Test response shape matches expected types
  - [x] 8.3 Test pagination for sessions

## Dev Notes

### Query Design Principles

From architecture-backend-v2.md:
- Queries should be optimized for specific UI needs
- Avoid over-fetching - return only what the component needs
- Use indexes for all queries (no full table scans)

### UI Component Data Contracts

**RadarChart.tsx expects:**
```typescript
interface RadarChartData {
  data: {
    label: string;
    value: number;
    uncertain: boolean;
  }[];
}
```

**ProgressionChart.tsx expects:**
```typescript
interface ProgressionData {
  weeks: {
    week: number;        // weekNumber
    volume: number;      // volumeKm
    intensity: number;   // intensityScore
    recovery?: boolean;  // isRecoveryWeek
    label?: string;      // weekLabel
  }[];
}
```

**CalendarWidget.tsx expects:**
```typescript
interface SessionData {
  type: string;          // sessionTypeDisplay
  dur: string;           // targetDurationDisplay
  effort: string;        // effortDisplay
  key: boolean;          // isKeySession
  pace?: string;         // targetPaceDisplay
  desc?: string;         // description (truncated)
  structure?: string;    // structureDisplay
  why?: string;          // justification
  day: string;           // dayOfWeekShort
}
```

### Query Implementations

```typescript
// packages/backend/convex/training/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

// =============================================================================
// Types (matching UI component props)
// =============================================================================

export interface RadarChartData {
  data: {
    label: string;
    value: number;
    uncertain: boolean;
  }[];
}

export interface ProgressionData {
  weeks: {
    week: number;
    volume: number;
    intensity: number;
    recovery?: boolean;
    label?: string;
  }[];
  currentWeek?: number;  // Highlight current position
}

export interface SessionCardData {
  type: string;
  dur: string;
  effort: string;
  key: boolean;
  pace?: string;
  desc?: string;
  structure?: string;
  why?: string;
  day: string;
  scheduledDate: number;
  status: string;
}

export interface WeekSessionsData {
  weekNumber: number;
  sessions: SessionCardData[];
}

export interface DecisionAuditData {
  decisions: {
    category: string;
    decision: string;
    reasoning: string;
    alternatives?: string[];
  }[];
  safeguardApplications: {
    safeguardId: string;
    applied: boolean;
    reason?: string;
  }[];
}

export interface ExpectedOutcomesData {
  primaryGoal: string;
  confidenceLevel: number;
  confidenceReason: string;
  secondaryOutcomes: string[];
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get radar chart data for a plan
 * Returns only the profileRadar array needed by RadarChart component
 */
export const getRadarChartData = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(v.null(), v.object({
    data: v.array(v.object({
      label: v.string(),
      value: v.number(),
      uncertain: v.boolean(),
    })),
  })),
  handler: async (ctx, args): Promise<RadarChartData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    return {
      data: plan.runnerSnapshot.profileRadar,
    };
  },
});

/**
 * Get progression chart data for a plan
 * Returns weeklyPlan mapped to ProgressionChart format
 */
export const getProgressionChartData = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(v.null(), v.object({
    weeks: v.array(v.object({
      week: v.number(),
      volume: v.number(),
      intensity: v.number(),
      recovery: v.optional(v.boolean()),
      label: v.optional(v.string()),
    })),
    currentWeek: v.optional(v.number()),
  })),
  handler: async (ctx, args): Promise<ProgressionData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    // Calculate current week based on plan start date
    const now = Date.now();
    const planStart = plan.startDate;
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.floor((now - planStart) / msPerWeek) + 1;

    return {
      weeks: plan.weeklyPlan.map(w => ({
        week: w.weekNumber,
        volume: w.volumeKm,
        intensity: w.intensityScore,
        recovery: w.isRecoveryWeek || undefined,
        label: w.weekLabel || undefined,
      })),
      currentWeek: currentWeek > 0 && currentWeek <= plan.durationWeeks ? currentWeek : undefined,
    };
  },
});

/**
 * Get sessions for a specific week
 * Returns display fields only, optimized for CalendarWidget
 */
export const getWeekSessions = query({
  args: {
    planId: v.id("trainingPlans"),
    weekNumber: v.number(),
  },
  returns: v.union(v.null(), v.object({
    weekNumber: v.number(),
    sessions: v.array(v.object({
      type: v.string(),
      dur: v.string(),
      effort: v.string(),
      key: v.boolean(),
      pace: v.optional(v.string()),
      desc: v.optional(v.string()),
      structure: v.optional(v.string()),
      why: v.optional(v.string()),
      day: v.string(),
      scheduledDate: v.number(),
      status: v.string(),
    })),
  })),
  handler: async (ctx, args): Promise<WeekSessionsData | null> => {
    // Use by_week index for efficient lookup
    const sessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_week", q =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .collect();

    if (sessions.length === 0) return null;

    return {
      weekNumber: args.weekNumber,
      sessions: sessions.map(s => ({
        type: s.sessionTypeDisplay,
        dur: s.targetDurationDisplay,
        effort: s.effortDisplay,
        key: s.isKeySession,
        pace: s.targetPaceDisplay || undefined,
        desc: s.description.slice(0, 100), // Truncate for card
        structure: s.structureDisplay || undefined,
        why: s.justification,
        day: s.dayOfWeekShort,
        scheduledDate: s.scheduledDate,
        status: s.status,
      })),
    };
  },
});

/**
 * Get sessions for multiple weeks (calendar view)
 */
export const getMultiWeekSessions = query({
  args: {
    planId: v.id("trainingPlans"),
    startWeek: v.number(),
    endWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const weeks: WeekSessionsData[] = [];

    for (let week = args.startWeek; week <= args.endWeek; week++) {
      const sessions = await ctx.db
        .query("plannedSessions")
        .withIndex("by_week", q =>
          q.eq("planId", args.planId).eq("weekNumber", week)
        )
        .collect();

      weeks.push({
        weekNumber: week,
        sessions: sessions.map(s => ({
          type: s.sessionTypeDisplay,
          dur: s.targetDurationDisplay,
          effort: s.effortDisplay,
          key: s.isKeySession,
          pace: s.targetPaceDisplay || undefined,
          desc: s.description.slice(0, 100),
          structure: s.structureDisplay || undefined,
          why: s.justification,
          day: s.dayOfWeekShort,
          scheduledDate: s.scheduledDate,
          status: s.status,
        })),
      });
    }

    return weeks;
  },
});

/**
 * Get decision audit data for plan transparency
 */
export const getDecisionAudit = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(v.null(), v.object({
    decisions: v.array(v.object({
      category: v.string(),
      decision: v.string(),
      reasoning: v.string(),
      alternatives: v.optional(v.array(v.string())),
    })),
    safeguardApplications: v.array(v.object({
      safeguardId: v.string(),
      applied: v.boolean(),
      reason: v.optional(v.string()),
    })),
  })),
  handler: async (ctx, args): Promise<DecisionAuditData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    return {
      decisions: (plan.decisions ?? []).map(d => ({
        category: d.category,
        decision: d.decision,
        reasoning: d.reasoning,
        alternatives: d.alternatives,
      })),
      safeguardApplications: (plan.safeguardApplications ?? []).map(s => ({
        safeguardId: s.safeguardId,
        applied: s.applied,
        reason: s.reason,
      })),
    };
  },
});

/**
 * Get expected outcomes for verdict display
 */
export const getExpectedOutcomes = query({
  args: { planId: v.id("trainingPlans") },
  returns: v.union(v.null(), v.object({
    primaryGoal: v.string(),
    confidenceLevel: v.number(),
    confidenceReason: v.string(),
    secondaryOutcomes: v.array(v.string()),
  })),
  handler: async (ctx, args): Promise<ExpectedOutcomesData | null> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    return plan.seasonView.expectedOutcomes;
  },
});

/**
 * Get active plan ID for a runner
 * Returns the most recent active plan
 */
export const getActivePlanForRunner = query({
  args: { runnerId: v.id("runners") },
  returns: v.union(v.null(), v.id("trainingPlans")),
  handler: async (ctx, args) => {
    // First try to find an active plan
    const activePlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", q => q.eq("runnerId", args.runnerId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();

    if (activePlan) return activePlan._id;

    // Fall back to most recent plan of any status
    const anyPlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", q => q.eq("runnerId", args.runnerId))
      .order("desc")
      .first();

    return anyPlan?._id ?? null;
  },
});

/**
 * Composite query: Get all data needed for plan overview screen
 * Combines multiple queries in one round-trip
 */
export const getPlanOverview = query({
  args: { planId: v.id("trainingPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    // Calculate current week
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeek = Math.floor((now - plan.startDate) / msPerWeek) + 1;

    // Get current week's sessions
    const currentSessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_week", q =>
        q.eq("planId", args.planId).eq("weekNumber", currentWeek)
      )
      .collect();

    return {
      // Plan metadata
      name: plan.name,
      goalType: plan.goalType,
      targetDate: plan.targetDate,
      status: plan.status,
      durationWeeks: plan.durationWeeks,

      // RadarChart data
      radarChart: {
        data: plan.runnerSnapshot.profileRadar,
      },

      // ProgressionChart data
      progressionChart: {
        weeks: plan.weeklyPlan.map(w => ({
          week: w.weekNumber,
          volume: w.volumeKm,
          intensity: w.intensityScore,
          recovery: w.isRecoveryWeek || undefined,
          label: w.weekLabel || undefined,
        })),
        currentWeek: currentWeek > 0 && currentWeek <= plan.durationWeeks ? currentWeek : undefined,
      },

      // Verdict data
      expectedOutcomes: plan.seasonView.expectedOutcomes,

      // Coach summary
      coachSummary: plan.seasonView.coachSummary,

      // Current week sessions
      currentWeekSessions: currentSessions.map(s => ({
        type: s.sessionTypeDisplay,
        dur: s.targetDurationDisplay,
        effort: s.effortDisplay,
        key: s.isKeySession,
        day: s.dayOfWeekShort,
        status: s.status,
      })),
    };
  },
});
```

### Index Requirements

The queries depend on these indexes (defined in Story 6.1 and 6.2):

**trainingPlans indexes:**
- `by_runnerId` - for `getActivePlanForRunner`
- `by_userId` - alternative user-based lookup
- `by_status` - for filtering active plans

**plannedSessions indexes:**
- `by_week` - `["planId", "weekNumber"]` - CRITICAL for `getWeekSessions`
- `by_planId` - for full plan session retrieval
- `by_date` - for date-range queries

### Project Structure Notes

**Target Files:**
- `packages/backend/convex/training/queries.ts` (NEW)

**Dependencies:**
- Story 6.1: trainingPlans schema (table must exist)
- Story 6.2: plannedSessions schema (table must exist)
- Story 6.5: Plan Generator (writes the data these queries read)

**Consumers:**
- RadarChart component
- ProgressionChart component
- CalendarWidget component
- Verdict screen
- Plan overview screen

### Frontend Usage Example

```typescript
// In React component
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function PlanOverview({ runnerId }: { runnerId: Id<"runners"> }) {
  // First get the active plan ID
  const planId = useQuery(api.training.queries.getActivePlanForRunner, { runnerId });

  // Then get all overview data in one query
  const overview = useQuery(
    api.training.queries.getPlanOverview,
    planId ? { planId } : "skip"
  );

  if (!overview) return <Loading />;

  return (
    <>
      <RadarChart data={overview.radarChart.data} />
      <ProgressionChart
        weeks={overview.progressionChart.weeks}
        currentWeek={overview.progressionChart.currentWeek}
      />
      <CoachSummary text={overview.coachSummary} />
      <ExpectedOutcomes {...overview.expectedOutcomes} />
    </>
  );
}
```

### References

- [Source: epics.md#Story-6.6] - Acceptance criteria source
- [Source: data-model-comprehensive.md#Training-Plans-Sessions] - Schema reference
- [Source: architecture-backend-v2.md#Module-3-Plan-Generator] - Module context
- [Source: 6-1-training-plans-multi-level-zoom-schema.md] - trainingPlans schema
- [Source: apps/native/src/components/app/onboarding/generative/RadarChart.tsx] - UI component
- [Source: apps/native/src/components/app/onboarding/generative/ProgressionChart.tsx] - UI component
- [Source: apps/native/src/components/app/onboarding/generative/CalendarWidget.tsx] - UI component

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeCheck: Passes with no errors in queries.ts (only pre-existing vitest import error in unrelated test files)

### Completion Notes List

- Created `queries.ts` with 8 Convex queries optimized for UI component needs
- Implemented RadarChartData, ProgressionData, SessionCardData, WeekSessionsData, DecisionAuditData, ExpectedOutcomesData type interfaces
- All queries use direct ID lookup or indexed queries (by_week, by_runnerId, by_planId)
- All queries return `T | null` for graceful missing plan handling (except getWeekSessions which returns empty array)
- Response shapes match UI component props exactly
- getPlanOverview composite query reduces round trips from 4 to 1
- getMultiWeekSessions supports multi-week calendar views with O(1) query optimization
- Comprehensive test suite validates response shapes, type contracts, and optimization patterns

**Code Review Fixes Applied (2026-02-16):**
- H2: Added missing `rest` (isRestDay) field to SessionCardData interface and all queries (AC3 compliance)
- M1: Refactored getMultiWeekSessions from N+1 queries to single query with in-memory grouping
- M2: Changed getWeekSessions to return `{ weekNumber, sessions: [] }` instead of null for empty weeks
- M3: Added documentation for ordering behavior in getActivePlanForRunner fallback query
- L1: Added ellipsis ("...") for truncated descriptions > 100 chars

### File List

- `packages/backend/convex/training/queries.ts` (NEW) - 8 queries for plan visualization
- `packages/backend/convex/training/queries.test.ts` (NEW) - Test suite for queries

### Change Log

- 2026-02-16: Story 6.6 implementation complete - all queries and tests created
- 2026-02-16: Code Review fixes - H2 (isRestDay), M1 (N+1 query), M2 (null handling), M3 (ordering docs), L1 (ellipsis)
