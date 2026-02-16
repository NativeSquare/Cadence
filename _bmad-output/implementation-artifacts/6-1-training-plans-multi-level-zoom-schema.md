# Story 6.1: Training Plans with Multi-Level Zoom Schema

Status: done

## Story

As a developer,
I want training plans to store data for Season/Weekly/Daily zoom levels,
So that the UI can show justifications at each level.

## Acceptance Criteria

1. **Given** a training plan is generated
   **When** it is stored
   **Then** `seasonView` contains:
   - `coachSummary`: 2-3 sentence overview
   - `periodizationJustification`: why this approach
   - `volumeStrategyJustification`: why these numbers
   - `keyMilestones`: array of `{ weekNumber, milestone, significance }`
   - `identifiedRisks`: array of `{ risk, mitigation, monitoringSignals }`
   - `expectedOutcomes`: `{ primaryGoal, confidenceLevel, confidenceReason, secondaryOutcomes }`

2. **And** `weeklyPlan` contains array of weeks:
   - weekNumber, weekStartDate, weekEndDate
   - phaseName, phaseWeekNumber
   - volumeKm, intensityScore (for ProgressionChart)
   - isRecoveryWeek, weekLabel
   - keySessions, easyRuns, restDays counts
   - weekFocus, weekJustification, coachNotes
   - volumeChangePercent, warningSignals

3. **And** `runnerSnapshot` contains:
   - capturedAt timestamp
   - profileRadar: array for RadarChart
   - fitnessIndicators: VDOT, volume, consistency
   - planInfluencers: factors that shaped the plan

## Tasks / Subtasks

- [x] Task 1: Create trainingPlans table schema (AC: #1, #2, #3)
  - [x] 1.1 Create `packages/backend/convex/table/trainingPlans.ts`
  - [x] 1.2 Define seasonView object schema with all nested fields
  - [x] 1.3 Define weeklyPlan array schema with week objects
  - [x] 1.4 Define runnerSnapshot object schema
  - [x] 1.5 Add plan metadata fields (name, goalType, dates, status)
  - [x] 1.6 Add indexes (by_runnerId, by_userId, by_status)
- [x] Task 2: Register table in schema (AC: #1, #2, #3)
  - [x] 2.1 Import trainingPlans in `packages/backend/convex/schema.ts`
  - [x] 2.2 Add to schema export
- [x] Task 3: Create TypeScript types for frontend consumption
  - [x] 3.1 Export inferred types from schema
- [x] Task 4: Verify schema deployment
  - [x] 4.1 Run `npx convex dev` to validate schema
  - [x] 4.2 Confirm table appears in Convex dashboard

## Dev Notes

### Schema Design (from data-model-comprehensive.md)

The schema is pre-designed and documented. Key structure:

```typescript
// packages/backend/convex/table/trainingPlans.ts

trainingPlans: defineTable({
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // PLAN METADATA
  name: v.string(),                              // "Half Marathon - 12 Week Plan"
  goalType: v.string(),
  targetEvent: v.optional(v.string()),           // "Boston Marathon"
  targetDate: v.optional(v.number()),
  targetTime: v.optional(v.number()),            // Seconds
  startDate: v.number(),
  endDate: v.number(),
  durationWeeks: v.number(),
  status: v.string(),                            // "draft" | "active" | "paused" | "completed" | "abandoned"

  // ZOOM LEVEL 1: SEASON / MACRO VIEW
  seasonView: v.object({
    coachSummary: v.string(),
    periodizationJustification: v.string(),
    volumeStrategyJustification: v.string(),
    keyMilestones: v.array(v.object({
      weekNumber: v.number(),
      milestone: v.string(),
      significance: v.string(),
    })),
    identifiedRisks: v.array(v.object({
      risk: v.string(),
      mitigation: v.string(),
      monitoringSignals: v.array(v.string()),
    })),
    expectedOutcomes: v.object({
      primaryGoal: v.string(),
      confidenceLevel: v.number(),              // 0-100
      confidenceReason: v.string(),
      secondaryOutcomes: v.array(v.string()),
    }),
  }),

  // ZOOM LEVEL 2: WEEKLY / MESO VIEW
  weeklyPlan: v.array(v.object({
    weekNumber: v.number(),
    weekStartDate: v.number(),
    weekEndDate: v.number(),
    phaseName: v.string(),                       // "Base", "Build", "Peak", "Taper"
    phaseWeekNumber: v.number(),
    volumeKm: v.number(),
    intensityScore: v.number(),                  // 0-100 scale
    isRecoveryWeek: v.boolean(),
    weekLabel: v.optional(v.string()),           // "Recovery", "Race"
    keySessions: v.number(),
    easyRuns: v.number(),
    restDays: v.number(),
    weekFocus: v.string(),
    weekJustification: v.string(),
    coachNotes: v.optional(v.string()),
    volumeChangePercent: v.optional(v.number()),
    warningSignals: v.optional(v.array(v.string())),
  })),

  // RUNNER SNAPSHOT AT PLAN CREATION (For RadarChart)
  runnerSnapshot: v.object({
    capturedAt: v.number(),
    profileRadar: v.array(v.object({
      label: v.string(),                         // "Endurance" | "Speed" | "Recovery" | etc.
      value: v.number(),                         // 0-100
      uncertain: v.boolean(),
    })),
    fitnessIndicators: v.object({
      estimatedVdot: v.optional(v.number()),
      recentVolume: v.optional(v.number()),
      consistencyScore: v.optional(v.number()),
    }),
    planInfluencers: v.array(v.string()),        // Factors that shaped the plan
  }),

  // Plan generation metadata
  templateId: v.optional(v.string()),
  periodizationModel: v.optional(v.string()),
  phases: v.optional(v.array(v.object({
    name: v.string(),
    startWeek: v.number(),
    endWeek: v.number(),
    focus: v.string(),
  }))),
  loadParameters: v.optional(v.object({
    startingVolume: v.optional(v.number()),
    peakVolume: v.optional(v.number()),
    weeklyIncrease: v.optional(v.number()),
    estimatedVdot: v.optional(v.number()),
  })),
  targetPaces: v.optional(v.object({
    easy: v.optional(v.string()),
    marathon: v.optional(v.string()),
    threshold: v.optional(v.string()),
    interval: v.optional(v.string()),
    repetition: v.optional(v.string()),
  })),

  // Decision audit trail
  decisions: v.optional(v.array(v.object({
    category: v.string(),
    decision: v.string(),
    reasoning: v.string(),
    alternatives: v.optional(v.array(v.string())),
    knowledgeBaseRefs: v.optional(v.array(v.string())),
  }))),
  safeguardApplications: v.optional(v.array(v.object({
    safeguardId: v.string(),
    applied: v.boolean(),
    originalValue: v.optional(v.number()),
    adjustedValue: v.optional(v.number()),
    reason: v.optional(v.string()),
  }))),

  // Metadata
  generatedAt: v.number(),
  generatorVersion: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_runnerId", ["runnerId"])
.index("by_userId", ["userId"])
.index("by_status", ["userId", "status"])
```

### Project Structure Notes

- **Table file location:** `packages/backend/convex/table/trainingPlans.ts`
- **Schema registration:** `packages/backend/convex/schema.ts`
- **Follows existing pattern:** Same structure as `activities.ts`, `runners.ts`
- **Forward reference:** `activities.ts:89` already references `plannedSessions` table (Story 6.2)

### UI Component Data Requirements

The schema is designed to directly feed these UI components:

| Component | Data Source | Key Fields |
|-----------|-------------|------------|
| RadarChart | `runnerSnapshot.profileRadar` | `label`, `value`, `uncertain` |
| ProgressionChart | `weeklyPlan[]` | `volumeKm`, `intensityScore`, `isRecoveryWeek`, `weekLabel` |
| Decision Audit | `seasonView`, `decisions` | `coachSummary`, `periodizationJustification`, `reasoning` |

### References

- [Source: data-model-comprehensive.md#Training-Plans-Sessions] - Complete schema definition
- [Source: architecture-backend-v2.md#Plan-Generation-Engine] - Plan generation flow
- [Source: activities.ts:89] - Forward reference to plannedSessions
- [Source: runners.ts] - Pattern for Convex table definitions

### Critical Implementation Notes

1. **No forward references for IDs:** The `plannedSessions` table (Story 6.2) will reference `trainingPlans`, not the reverse. This avoids circular dependencies.

2. **Timestamps:** Use Unix timestamps in milliseconds (consistent with existing tables like `activities.ts`).

3. **Status values:** Use string literals for status field. Consider adding a status enum type for type safety.

4. **RadarChart axes:** The 6 axes are: "Endurance", "Speed", "Recovery", "Consistency", "Injury Risk", "Race Ready"

5. **ProgressionChart integration:** The `weeklyPlan` array is structured to directly map to the ProgressionChart data format:
   ```typescript
   interface ProgressionData {
     week: number;        // weekNumber
     volume: number;      // volumeKm
     intensity: number;   // intensityScore
     recovery?: boolean;  // isRecoveryWeek
     label?: string;      // weekLabel
   }
   ```

### Dependencies

- **Depends on:** None (foundational schema)
- **Required by:**
  - Story 6.2: plannedSessions schema (references this table)
  - Story 6.5: Plan Generator Core (writes to this table)
  - Story 6.6: Plan to UI Data Queries (reads from this table)
  - Story 3.9: Backend Wiring Visualization Data (reads weeklyPlan, runnerSnapshot)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation

### Completion Notes List

- Created trainingPlans table schema with full multi-level zoom structure
- Implemented AC #1: seasonView with coachSummary, periodizationJustification, volumeStrategyJustification, keyMilestones, identifiedRisks, expectedOutcomes
- Implemented AC #2: weeklyPlan array with all required fields for ProgressionChart integration
- Implemented AC #3: runnerSnapshot with profileRadar array for RadarChart, fitnessIndicators, planInfluencers
- Added decision audit trail fields (decisions, safeguardApplications) for transparency
- Exported TypeScript types for frontend consumption
- Schema validated and deployed via `npx convex dev --once`
- All 3 indexes created: by_runnerId, by_userId, by_status

### File List

- `packages/backend/convex/table/trainingPlans.ts` (NEW)
- `packages/backend/convex/schema.ts` (MODIFY - add import and registration)

### Change Log

- 2026-02-16: Story 6.1 implemented - trainingPlans schema with multi-level zoom structure
- 2026-02-16: Code review fix - exported `planStatus` union and `PlanStatus` type for frontend consumption
