# Story 6.2: Planned Sessions Schema

Status: done

## Story

As a developer,
I want planned sessions to include all UI-required fields plus justifications,
So that CalendarWidget can render with full coach reasoning.

## Acceptance Criteria

1. **Given** a session is planned
   **When** it is stored
   **Then** display fields exist:
   - sessionTypeDisplay: "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest"
   - targetDurationDisplay: "50 min" format
   - effortDisplay: "7/10" format
   - targetPaceDisplay: "4:55-5:05/km" format
   - structureDisplay: "10 min warm-up -> 30 min tempo -> 10 min cool-down"

2. **And** justification fields exist:
   - justification: WHY this session is placed here
   - physiologicalTarget: what system we're training
   - placementRationale: why THIS day
   - keyPoints: what to focus on
   - relatedKnowledgeIds: KB entries that informed this
   - relatedSafeguardIds: safeguards that were checked

3. **And** flexibility fields exist:
   - isMoveable, canBeSplit
   - alternatives: array of backup options

4. **And** execution tracking fields exist:
   - status: "scheduled" | "completed" | "skipped" | "modified"
   - completedActivityId, adherenceScore

## Tasks / Subtasks

- [x] Task 1: Create plannedSessions table schema (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `packages/backend/convex/table/plannedSessions.ts`
  - [x] 1.2 Define schedule fields (weekNumber, dayOfWeek, scheduledDate)
  - [x] 1.3 Define session type & classification fields
  - [x] 1.4 Define duration & effort display fields
  - [x] 1.5 Define pace target fields
  - [x] 1.6 Define description and structure fields
  - [x] 1.7 Define justification fields (critical for trust)
  - [x] 1.8 Define flexibility & alternatives fields
  - [x] 1.9 Define execution tracking fields
  - [x] 1.10 Add indexes (by_planId, by_runnerId, by_date, by_week, by_status)
- [x] Task 2: Register table in schema (AC: all)
  - [x] 2.1 Import plannedSessions in `packages/backend/convex/schema.ts`
  - [x] 2.2 Add to schema export
- [x] Task 3: Verify forward reference in activities table
  - [x] 3.1 Confirm `activities.ts:89` `plannedSessionId` reference resolves
- [x] Task 4: Verify schema deployment
  - [x] 4.1 Run `npx convex dev` to validate schema
  - [x] 4.2 Confirm table appears in Convex dashboard

## Dev Notes

### Schema Design (from data-model-comprehensive.md)

The schema is pre-designed and documented. This table stores individual sessions within a plan.

```typescript
// packages/backend/convex/table/plannedSessions.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const plannedSessions = defineTable({
  planId: v.id("trainingPlans"),
  runnerId: v.id("runners"),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════════════════════════════════════════
  weekNumber: v.number(),                        // Week 1, 2, 3...
  dayOfWeek: v.string(),                         // "monday", "tuesday", etc.
  dayOfWeekShort: v.string(),                    // "Mon", "Tue", etc. (for UI)
  scheduledDate: v.number(),                     // Unix timestamp

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION TYPE & CLASSIFICATION (UI: type, key)
  // ═══════════════════════════════════════════════════════════════════════════
  sessionType: v.string(),                       // "tempo" | "easy" | "intervals" | "long_run" | "rest" | "recovery" | "race"
  sessionTypeDisplay: v.string(),                // "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest" (for UI)
  sessionSubtype: v.optional(v.string()),        // "progression" | "fartlek" | "hills" | "track"
  isKeySession: v.boolean(),                     // true for quality sessions (UI: key)
  isRestDay: v.boolean(),                        // true for rest days

  // ═══════════════════════════════════════════════════════════════════════════
  // DURATION & EFFORT (UI: dur, effort)
  // ═══════════════════════════════════════════════════════════════════════════
  targetDurationSeconds: v.optional(v.number()), // Stored as seconds for calculations
  targetDurationDisplay: v.string(),             // "50 min" | "90 min" | "-" (for UI)
  targetDistanceMeters: v.optional(v.number()),  // Alternative to duration
  effortLevel: v.optional(v.number()),           // 0-10 numeric
  effortDisplay: v.string(),                     // "7/10" | "3/10" | "0/10" (for UI)

  // ═══════════════════════════════════════════════════════════════════════════
  // PACE TARGETS (UI: pace)
  // ═══════════════════════════════════════════════════════════════════════════
  targetPaceMin: v.optional(v.string()),         // "4:55/km" - faster end of range
  targetPaceMax: v.optional(v.string()),         // "5:05/km" - slower end of range
  targetPaceDisplay: v.optional(v.string()),     // "4:55-5:05/km" (for UI)
  targetHeartRateZone: v.optional(v.number()),   // 1-5
  targetHeartRateMin: v.optional(v.number()),    // BPM
  targetHeartRateMax: v.optional(v.number()),    // BPM

  // ═══════════════════════════════════════════════════════════════════════════
  // DESCRIPTION (UI: desc)
  // ═══════════════════════════════════════════════════════════════════════════
  description: v.string(),                       // Full description of what this session is

  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURE (UI: structure)
  // ═══════════════════════════════════════════════════════════════════════════
  structureDisplay: v.optional(v.string()),      // "10 min warm-up -> 30 min tempo -> 10 min cool-down" (for UI)

  // Detailed structure (for calculations and validation)
  structureSegments: v.optional(v.array(v.object({
    segmentType: v.string(),                     // "warmup" | "main" | "cooldown" | "recovery" | "work"
    durationSeconds: v.optional(v.number()),
    distanceMeters: v.optional(v.number()),
    targetPace: v.optional(v.string()),
    targetHeartRate: v.optional(v.number()),
    targetEffort: v.optional(v.number()),        // 1-10
    repetitions: v.optional(v.number()),         // For intervals: 6 x 800m
    recoverySeconds: v.optional(v.number()),     // Recovery between reps
    notes: v.optional(v.string()),
  }))),

  // ═══════════════════════════════════════════════════════════════════════════
  // JUSTIFICATION - THE "WHY" (UI: why) - CRITICAL FOR TRUST
  // ═══════════════════════════════════════════════════════════════════════════
  justification: v.string(),                     // WHY this session is placed here

  // Additional reasoning context
  physiologicalTarget: v.string(),               // "aerobic_base" | "lactate_threshold" | "vo2max" | "economy" | "recovery"
  placementRationale: v.optional(v.string()),    // Why THIS day specifically
  keyPoints: v.optional(v.array(v.string())),    // What to focus on during the session

  // Decision audit (links to knowledge base / safeguards)
  relatedKnowledgeIds: v.optional(v.array(v.string())), // Which KB entries informed this
  relatedSafeguardIds: v.optional(v.array(v.string())), // Which safeguards were checked

  // ═══════════════════════════════════════════════════════════════════════════
  // FLEXIBILITY & ALTERNATIVES
  // ═══════════════════════════════════════════════════════════════════════════
  isMoveable: v.boolean(),                       // Can be rescheduled within the week
  canBeSplit: v.optional(v.boolean()),           // Can be split into two sessions
  alternatives: v.optional(v.array(v.object({
    sessionType: v.string(),
    description: v.string(),
    whenToUse: v.string(),                       // "If legs are heavy" | "If short on time"
  }))),

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTION TRACKING (Post-run)
  // ═══════════════════════════════════════════════════════════════════════════
  status: v.string(),                            // "scheduled" | "completed" | "skipped" | "modified" | "rescheduled"
  completedActivityId: v.optional(v.id("activities")),
  completedAt: v.optional(v.number()),
  adherenceScore: v.optional(v.number()),        // 0-1 how well did execution match plan

  // If modified or skipped
  skipReason: v.optional(v.string()),
  modificationNotes: v.optional(v.string()),
  actualDurationSeconds: v.optional(v.number()),
  actualDistanceMeters: v.optional(v.number()),
  userFeedback: v.optional(v.string()),          // How did it feel?
  userRating: v.optional(v.number()),            // 1-5 satisfaction

  // ═══════════════════════════════════════════════════════════════════════════
  // UI STYLING (Computed, but stored for efficiency)
  // ═══════════════════════════════════════════════════════════════════════════
  colorTheme: v.optional(v.string()),            // "lime" | "gray" - for UI styling
})
.index("by_planId", ["planId"])
.index("by_runnerId", ["runnerId"])
.index("by_date", ["runnerId", "scheduledDate"])
.index("by_week", ["planId", "weekNumber"])
.index("by_status", ["runnerId", "status"]);
```

### Project Structure Notes

- **Table file location:** `packages/backend/convex/table/plannedSessions.ts`
- **Schema registration:** `packages/backend/convex/schema.ts`
- **Follows existing pattern:** Same structure as `activities.ts`, `runners.ts`, `trainingPlans.ts`
- **Forward reference resolution:** `activities.ts:89` references this table via `plannedSessionId`

### UI Component Data Requirements

This table directly feeds the CalendarWidget component:

```typescript
// CalendarWidget expects this interface:
interface SessionData {
  type: "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest";
  dur: string;           // targetDurationDisplay
  effort: string;        // effortDisplay
  key: boolean;          // isKeySession
  pace?: string;         // targetPaceDisplay
  desc?: string;         // description
  structure?: string;    // structureDisplay
  why?: string;          // justification
}
```

**Field Mapping:**
| UI Field | Schema Field |
|----------|--------------|
| `type` | `sessionTypeDisplay` |
| `dur` | `targetDurationDisplay` |
| `effort` | `effortDisplay` |
| `key` | `isKeySession` |
| `pace` | `targetPaceDisplay` |
| `desc` | `description` |
| `structure` | `structureDisplay` |
| `why` | `justification` |

### Justification Example (Daily Level)

```typescript
// This is what makes Cadence special - the "why" behind every session
justification: "Tuesday tempo sets the tone for the week. You're fresh from the weekend, mentally sharp. The effort is high but controlled - we're teaching your body to clear lactate at half marathon pace. Don't chase the pace; let the effort guide you."
```

### References

- [Source: data-model-comprehensive.md#Table-plannedSessions] - Complete schema definition
- [Source: epics.md#Story-6.2] - Acceptance criteria
- [Source: activities.ts:89] - Forward reference to this table
- [Source: 6-1-training-plans-multi-level-zoom-schema.md] - Parent table this references

### Critical Implementation Notes

1. **Foreign Key:** `planId` references `trainingPlans` table (Story 6.1 must be complete first)

2. **Bidirectional Link with Activities:**
   - `plannedSessions.completedActivityId` -> links to activity when session is completed
   - `activities.plannedSessionId` -> links activity back to planned session

3. **Display Fields:** Fields ending in `Display` are pre-formatted for UI consumption (e.g., "50 min", "7/10")

4. **Physiological Targets:** Valid values are:
   - `"aerobic_base"` - Easy running, building foundation
   - `"lactate_threshold"` - Tempo runs
   - `"vo2max"` - Intervals, hard efforts
   - `"economy"` - Strides, form work
   - `"recovery"` - Active recovery

5. **Status Values:** Use string literals:
   - `"scheduled"` - Default state when plan is created
   - `"completed"` - Session done, linked to activity
   - `"skipped"` - User skipped (capture reason)
   - `"modified"` - User modified the session
   - `"rescheduled"` - Moved to different day

### Dependencies

- **Depends on:** Story 6.1 (trainingPlans table must exist for `planId` reference)
- **Required by:**
  - Story 6.5: Plan Generator Core (writes sessions)
  - Story 6.6: Plan to UI Data Queries (reads sessions for CalendarWidget)
  - Story 3.9: Backend Wiring Visualization Data (reads for CalendarWidget)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation

### Completion Notes List

- Created plannedSessions table schema with full CalendarWidget integration
- Implemented AC #1: Display fields (sessionTypeDisplay, targetDurationDisplay, effortDisplay, targetPaceDisplay, structureDisplay)
- Implemented AC #2: Justification fields (justification, physiologicalTarget, placementRationale, keyPoints, relatedKnowledgeIds, relatedSafeguardIds)
- Implemented AC #3: Flexibility fields (isMoveable, canBeSplit, alternatives array)
- Implemented AC #4: Execution tracking (status union type, completedActivityId, adherenceScore)
- Verified forward reference in activities.ts:89 resolves correctly
- Exported TypeScript types (PlannedSession, StructureSegment, SessionAlternative)
- Schema validated and deployed via `npx convex dev --once`
- All 5 indexes created: by_planId, by_runnerId, by_date, by_week, by_status

### File List

- `packages/backend/convex/table/plannedSessions.ts` (NEW)
- `packages/backend/convex/schema.ts` (MODIFY - add import and registration)

### Change Log

- 2026-02-16: Story 6.2 implemented - plannedSessions schema for CalendarWidget
- 2026-02-16: Code review fix - exported `sessionStatus` union and `SessionStatus` type for frontend consumption
