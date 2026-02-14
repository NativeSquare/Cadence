# Story 1.6: Progress Tracking & Persistence

Status: done

---

## Story

As a **user going through onboarding**,
I want **my progress to be saved automatically**,
So that **I can resume where I left off if I close the app**.

---

## Acceptance Criteria

### AC1: Data Completeness Calculation

**Given** the user is in the onboarding flow
**When** any Runner Object field is updated
**Then** `data_completeness` percentage is recalculated server-side
**And** the calculation is based on `fields_filled / required_fields * 100`
**And** the progress bar UI updates in real-time to reflect the new percentage

### AC2: Progress Persistence

**Given** the user has partially completed onboarding
**When** they close the app and reopen later
**Then** their Runner Object state is persisted in Convex
**And** they resume from where they left off (not from the beginning)
**And** the progress bar shows their saved completion percentage

### AC3: Progress Indicator Display

**Given** the user has partially completed onboarding
**When** they view the progress indicator
**Then** they see a percentage representing data completeness
**And** they can understand how much remains
**And** the progress bar has smooth animation on value changes

### AC4: Missing Fields Identification

**Given** the onboarding flow needs certain fields
**When** required fields are missing
**Then** the system can identify which fields are still needed via `fields_missing`
**And** the coach can adapt questions based on what's missing
**And** the `current_phase` tracks where the user is in the flow

### AC5: Resume Point Detection

**Given** the user returns to the app mid-onboarding
**When** the app loads
**Then** the system reads `current_phase` and `fields_missing` from Runner Object
**And** routes the user to the appropriate scene to continue
**And** displays a brief "Welcome back" acknowledgment

---

## Tasks / Subtasks

- [x] **Task 1: Create Data Completeness Calculator** (AC: #1)
  - [x] Create helper function in `packages/backend/convex/table/runners.ts`
  - [x] Define required fields array for data completeness calculation
  - [x] Implement percentage calculation logic: `filledCount / requiredCount * 100`
  - [x] Round to integer for clean display

- [x] **Task 2: Update Runner Mutation Enhancement** (AC: #1, #4)
  - [x] Modify `updateRunner` mutation to trigger completeness recalculation
  - [x] Auto-update `conversation_state.data_completeness` on every field change
  - [x] Auto-update `conversation_state.fields_missing` based on unfilled required fields
  - [x] Auto-update `conversation_state.current_phase` based on context

- [x] **Task 3: Create Progress Bar Component** (AC: #3)
  - [x] Create `apps/native/src/components/app/onboarding/ProgressBar.tsx`
  - [x] Implement animated progress bar using `react-native-reanimated`
  - [x] Use design system tokens for colors (primary accent for fill)
  - [x] Show percentage label (optional, based on design)
  - [x] Support smooth transitions on value changes

- [x] **Task 4: Create Progress Hook** (AC: #1, #2, #3)
  - [x] Create `apps/native/src/hooks/use-onboarding-progress.ts`
  - [x] Subscribe to Runner Object's `conversation_state` via Convex `useQuery`
  - [x] Return `{ completeness, phase, fieldsMissing, isLoading }`
  - [x] Handle loading and error states

- [x] **Task 5: Implement Resume Logic** (AC: #2, #5)
  - [x] Create `apps/native/src/hooks/use-onboarding-resume.ts`
  - [x] Read `current_phase` on app load to determine resume point
  - [x] Map phases to onboarding scenes
  - [x] Navigate to appropriate scene based on state

- [x] **Task 6: Integrate Progress Bar into Flow** (AC: #3)
  - [x] Add ProgressBar to onboarding layout (persistent across scenes)
  - [x] Position at top or bottom of onboarding screens
  - [x] Hide until name confirmation is complete (Story 1.5 dependency)

- [x] **Task 7: Welcome Back UX** (AC: #5)
  - [x] Detect if user is resuming (Runner Object exists with partial completion)
  - [x] Show brief "Welcome back!" message or toast
  - [x] Continue to saved position

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Server-Side Calculation:**
   - Data completeness MUST be calculated server-side in Convex mutation
   - Never calculate in client and send back (source of truth = server)
   - Use Convex subscription for real-time UI updates

2. **State Management:**
   - Use Convex `useQuery` for progress subscription
   - No local state duplication of `data_completeness`
   - Convex handles persistence automatically

3. **Design System Usage:**
   - Progress bar fill: `bg-primary` (lime green)
   - Progress bar track: `bg-muted` or `bg-secondary`
   - Percentage text: `text-muted-foreground`
   - NEVER hardcode colors

4. **Naming Conventions:**
   - Hook: `use-onboarding-progress.ts` (kebab-case)
   - Component: `ProgressBar.tsx` (PascalCase)
   - Fields: `data_completeness`, `fields_missing` (already defined in schema)

Final note : The display of the progress starts after the screen where the user is asked "Mind a few questions?"

### Data Completeness Algorithm

**Required Fields for Calculation (from UX V6):**

```typescript
const REQUIRED_FIELDS = [
  // Identity
  "identity.name_confirmed", // 5% - Story 1.5

  // Running Profile (20%)
  "running.experience_level",
  "running.current_frequency",
  "running.current_volume",

  // Goals (20%)
  "goals.goal_type",
  "goals.race_distance", // if goal_type === 'race'
  "goals.race_date", // if goal_type === 'race'

  // Schedule (15%)
  "schedule.available_days",
  "schedule.blocked_days",

  // Health (20%)
  "health.past_injuries",
  "health.recovery_style",
  "health.sleep_quality",
  "health.stress_level",

  // Coaching (20%)
  "coaching.coaching_voice",
  "coaching.biggest_challenge",
];

// Calculation:
const filled = REQUIRED_FIELDS.filter(
  (field) => getFieldValue(runner, field) !== undefined,
).length;
const completeness = Math.round((filled / REQUIRED_FIELDS.length) * 100);
```

**Note:** Some fields are conditionally required (e.g., race_distance only if goal_type is 'race'). The algorithm should handle this.

### Phase Tracking

**Phases Map to Scenes:**

| Phase         | Description                | Entry Condition         |
| ------------- | -------------------------- | ----------------------- |
| `intro`       | Initial welcome            | App first launch        |
| `data_bridge` | Wearable connection prompt | After name confirmation |
| `profile`     | Runner profile questions   | After data bridge       |
| `goals`       | Goal setting               | After profile           |
| `schedule`    | Availability               | After goals             |
| `health`      | Injury/health questions    | After schedule          |
| `coaching`    | Coaching style preferences | After health            |
| `analysis`    | Plan generation            | All fields complete     |

**Phase Update Logic:**
Update `current_phase` when user transitions between scenes. This is the resume point.

### Progress Bar UX Specifications

**From UX V6 Document:**

```
Progress Indicator:
- Thin horizontal bar at top of onboarding screens
- Fills left-to-right as percentage increases
- Smooth animation on changes (spring animation)
- Optional: subtle glow effect when reaching milestones (25%, 50%, 75%, 100%)

Visibility:
- Hidden during splash/auth/consent
- Appears with fade-in after name confirmation
- Persists until onboarding completes
```

### Existing Components to Leverage

| Component             | Location                     | Usage                                |
| --------------------- | ---------------------------- | ------------------------------------ |
| `onboarding-flow.tsx` | `components/app/onboarding/` | Parent layout - add ProgressBar here |
| Reanimated            | Installed                    | For smooth progress animation        |
| NativeWind            | Installed                    | Design tokens                        |

### Data Flow

```
User updates any field (via conversation tools)
                    ↓
updateRunner mutation called
                    ↓
Server calculates new data_completeness
Updates fields_missing array
Updates current_phase if appropriate
                    ↓
Convex real-time sync to client
                    ↓
useOnboardingProgress hook receives update
                    ↓
ProgressBar animates to new value
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/ProgressBar.tsx` | Progress bar component |
| `apps/native/src/hooks/use-onboarding-progress.ts` | Progress subscription hook |
| `apps/native/src/hooks/use-onboarding-resume.ts` | Resume point detection hook |

**Files to Modify:**
| File | Change |
|------|--------|
| `packages/backend/convex/table/runners.ts` | Add completeness calculation, enhance updateRunner |
| `apps/native/src/components/app/onboarding/onboarding-flow.tsx` | Integrate ProgressBar, resume logic |

### Dependencies

**Required (already installed):**

- `react-native-reanimated` v4.1.6 - Smooth progress animations
- `convex/react` - Real-time subscriptions
- NativeWind - Design tokens

**From Story 1.1 (dependency):**

- Runners table with `conversation_state` section
- Basic `updateRunner` mutation

**From Story 1.5 (dependency):**

- Name confirmation triggers initial progress display

### Edge Cases & Error Handling

1. **First Visit (No Runner Object):**
   - Create Runner Object on first onboarding entry
   - Initialize `data_completeness = 0`, `current_phase = 'intro'`

2. **Runner Object Exists, 100% Complete:**
   - User has finished onboarding before
   - Skip to main app (don't show onboarding)

3. **Network Interruption Mid-Update:**
   - Convex handles optimistic updates and retries
   - Progress bar might briefly show old value, then sync

4. **Concurrent Updates:**
   - Convex handles concurrency
   - Latest calculation wins

### Testing Considerations

1. **Manual Testing:**
   - Confirm progress updates after each field change
   - Confirm persistence across app closes
   - Confirm resume routing works correctly
   - Confirm progress bar animation is smooth

2. **Specific Scenarios:**
   - Start onboarding, close app at 30%, reopen → resume at correct scene
   - Complete all fields → progress shows 100%
   - Clear app data → start fresh at 0%

### Performance Considerations

1. **Subscription Efficiency:**
   - Only subscribe to `conversation_state` fields, not entire Runner Object
   - Use Convex's efficient reactive queries

2. **Animation Performance:**
   - Use `useSharedValue` from Reanimated for progress value
   - Animate on UI thread for 60fps

### References

- [Source: architecture.md#State Management Patterns] - Convex for server state
- [Source: architecture.md#Data Architecture] - Runner Object schema
- [Source: ux-onboarding-flow-v6-2026-02-13.md#Progress Bar] - UX specifications
- [Source: epics.md#Story 1.6] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#FR48-51] - Progress tracking requirements

### Implementation Notes

1. **Atomic Updates:** The `updateRunner` mutation should atomically update both the target field AND recalculate `data_completeness` in the same transaction.

2. **Conditional Required Fields:** For race-specific fields (race_date, race_distance), only count them as required if `goal_type === 'race'`. Otherwise, exclude from calculation.

3. **Phase Transitions:** Phase should update automatically based on which fields were just filled. E.g., filling `coaching.coaching_voice` transitions phase to 'analysis' if it's the last field.

4. **Welcome Back Message:** Keep it brief and non-blocking. A toast notification or subtle text that auto-dismisses after 2 seconds.

5. **Name Data Pattern:** The authoritative source of truth for the user's name is `runners.identity.name`. The pattern for reading the name is:
   ```typescript
   // Read from runner identity first, fallback to user name
   const rawName = runner?.identity?.name || user?.name || "";
   const displayName = rawName.split(" ")[0] || "there";
   ```
   - No sync between `runners` and `users` tables (sync is unsafe if it fails)
   - `confirmName` mutation writes only to `runners.identity.name`
   - Frontend reads from runner first, falls back to user table if runner doesn't exist

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- [x] Data completeness calculates correctly via `calculateDataCompleteness()` in runners.ts
- [x] Progress bar animates smoothly using react-native-reanimated `withSpring`
- [x] Persistence works via Convex real-time subscriptions - no local state duplication
- [x] Resume routing works via `useOnboardingResume` hook mapping phases to scenes
- [x] Phase tracking updates automatically in `updateRunner` mutation
- [x] fields_missing array updates via `getMissingFields()` on every mutation

### Implementation Summary

**Backend (packages/backend/convex/table/runners.ts):**
- Added `REQUIRED_FIELDS` array with 13 base fields + conditional race fields
- Implemented `calculateDataCompleteness()` - returns 0-100 integer
- Implemented `getMissingFields()` - returns array of missing field paths
- Implemented `determinePhase()` - maps filled fields to current phase
- Enhanced `updateRunner` mutation to auto-calculate completeness, fieldsMissing, currentPhase
- Enhanced `confirmName` mutation to use calculator functions
- **Name source of truth:** `runners.identity.name` is authoritative; no sync to users table

**Frontend Components:**
- Created `ProgressBar.tsx` with reanimated spring animation and design tokens
- Created `use-onboarding-progress.ts` hook subscribing to runner state
- Created `use-onboarding-resume.ts` hook for resume point detection
- Integrated ProgressBar into onboarding-flow.tsx (visible after name confirmation)
- Added WelcomeBackToast component with 2-second auto-dismiss

### File List

- `apps/native/src/components/app/onboarding/ProgressBar.tsx` (new)
- `apps/native/src/hooks/use-onboarding-progress.ts` (new)
- `apps/native/src/hooks/use-onboarding-resume.ts` (new)
- `packages/backend/convex/table/runners.ts` (modified)
- `apps/native/src/components/app/onboarding/onboarding-flow.tsx` (modified)
- `apps/native/src/app/(onboarding)/index.tsx` (modified)

### Change Log

- 2026-02-14: Implemented Story 1.6 Progress Tracking & Persistence
- 2026-02-14: Updated name reading pattern to use runners.identity.name with fallback to users.name
