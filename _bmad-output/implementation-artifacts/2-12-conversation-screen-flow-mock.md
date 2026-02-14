# Story 2.12: Conversation Screen Flow (Mock Data)

Status: review

---

## Story

As a **user**,
I want **to experience the complete conversation flow visually**,
So that **the UX can be validated before backend wiring**.

---

## Acceptance Criteria

### SelfReport Screen (NO DATA path)

#### AC1: SelfReport Entry

**Given** the user skipped wearable connection
**When** SelfReport screen renders
**Then** coach streams: "No worries — I can work with what you tell me..."
**And** streaming uses the `StreamBlock` component from Story 2.9

#### AC2: Weekly Volume Question

**Given** the SelfReport screen is active
**When** the weekly km question renders
**Then** options display: <20km, 20-40km, 40-60km, 60km+, I'm not sure
**And** each option uses the `Choice` component from Story 2.11
**And** options animate in with staggered `springUp` delays

#### AC3: Days Per Week Question

**Given** the weekly volume is answered
**When** days per week question renders
**Then** numeric buttons display for 2, 3, 4, 5, 6, 7
**And** buttons are styled as compact choice pills
**And** single-select behavior (radio mode)

#### AC4: Longest Run Question

**Given** days per week is answered
**When** longest run question renders
**Then** options display: <10km, 10-15km, 15-20km, 20km+
**And** options use standard Choice card styling

#### AC5: SelfReport Completion

**Given** all SelfReport questions are answered
**When** the section completes
**Then** `ConfidenceBadge` displays with level="MODERATE"
**And** coach acknowledges with brief streaming response
**And** progress bar updates to reflect added data

---

### Goals Screen

#### AC6: Goals Entry

**Given** the user reaches goals section
**When** screen renders
**Then** coach streams: "What are you working toward?"
**And** streaming completes before options appear

#### AC7: Goal Type Options

**Given** the goals question displays
**When** options render
**Then** choices show: Training for a race, Getting faster, Building mileage, Getting back in shape, General health
**And** "Something else — let me explain" option is included
**And** options use `Choice` component with `springUp` animation

#### AC8: Freeform Goal Input

**Given** user selects "Something else — let me explain"
**When** the option is selected
**Then** `FreeformInput` component renders below
**And** text submission triggers `MiniAnalysis` component
**And** analysis shows extraction of goal-related information

#### AC9: Race Goal Follow-up

**Given** user selects "Training for a race"
**When** selection is confirmed
**Then** follow-up question appears for race distance
**And** distance options include: 5K, 10K, Half Marathon, Marathon, Ultra
**And** subsequent question asks for target date

---

### Health Screen

#### AC10: Health Entry

**Given** the user reaches health section
**When** screen renders
**Then** coach streams appropriate health-related prompt
**And** multi-select mode is indicated

#### AC11: Injury History Multi-Select

**Given** injury history question displays
**When** options render
**Then** multi-select checkboxes display (square, 6px radius)
**And** options include: Shin splints, IT band, Plantar fasciitis, Knee pain, Achilles issues, None
**And** selecting "None" deselects other options (mutually exclusive)
**And** `multi={true}` prop passed to Choice components

#### AC12: Recovery Style Follow-up

**Given** injury selections are made (not "None")
**When** recovery style question renders
**Then** options display: Bounce back quick, Takes a while, Push through
**And** single-select mode (radio buttons, round 11px)

#### AC13: Push Through Warning

**Given** user selects "Push through" recovery style
**When** that option is selected
**Then** `Choice` component shows `flagged={true}` state
**And** background tints red (`redDim` token)
**And** border uses red-tinted color
**And** coach acknowledges with streaming response about injury risk awareness

---

### Style Screen

#### AC14: Style Entry

**Given** the user reaches coaching preferences
**When** screen renders
**Then** coach streams coaching style prompt
**And** progress bar shows approaching completion (~85%)

#### AC15: Coaching Style Options

**Given** coaching style question displays
**When** options render
**Then** choices show: Tough love, Encouraging, Analytical, Minimalist
**And** each option has brief description text
**And** single-select mode

#### AC16: Biggest Challenge Question

**Given** coaching style is selected
**When** challenge question renders
**Then** options display: Consistency, Pacing, Time, Stuck
**And** brief explanatory text for each option

---

### OpenQuestion Screen

#### AC17: OpenQuestion Entry

**Given** the user reaches final check
**When** screen renders
**Then** coach streams: "Anything else you want me to know?"
**And** streaming uses character-by-character timing

#### AC18: OpenQuestion Input

**Given** the open question displays
**When** `FreeformInput` renders
**Then** pill chips appear above: "No, that covers it", "One more thing..."
**And** microphone button is available
**And** textarea placeholder is appropriate

#### AC19: Freeform Submission

**Given** user types freeform text
**When** text is submitted
**Then** `MiniAnalysis` component activates
**And** analysis shows extraction of any relevant data
**And** "Added to profile" confirmation appears

#### AC20: Skip Behavior

**Given** user taps "No, that covers it" pill
**When** pill is selected
**Then** flow advances directly without MiniAnalysis
**And** coach acknowledges briefly
**And** progress bar reaches ~95%

---

### Cross-Screen Requirements

#### AC21: All Screens Use Mock Data

**Given** any conversation screen renders
**When** data is displayed or processed
**Then** mock data is used (no backend calls)
**And** mock data simulates realistic responses
**And** mock delays simulate network timing

#### AC22: Progress Bar Consistency

**Given** the user progresses through screens
**When** each section completes
**Then** progress bar updates incrementally
**And** updates are visually smooth (animated)
**And** percentage reflects mock data_completeness

#### AC23: Screen Transitions

**Given** user completes a screen section
**When** transitioning to next section
**Then** transition is smooth (fade or slide)
**And** no jarring layout shifts
**And** coach streaming begins after transition settles

---

## Tasks / Subtasks

- [x] **Task 1: Create SelfReportScreen Component** (AC: #1-#5)
  - [x] Create `apps/native/src/components/app/onboarding/screens/SelfReportScreen.tsx`
  - [x] Implement coach streaming intro using `StreamBlock`
  - [x] Render weekly volume choices (5 options)
  - [x] Render days per week numeric pills (2-7)
  - [x] Render longest run choices (4 options)
  - [x] Show `ConfidenceBadge` with level="MODERATE" on completion
  - [x] Update progress bar on answers

- [x] **Task 2: Create GoalsScreen Component** (AC: #6-#9)
  - [x] Create `apps/native/src/components/app/onboarding/screens/GoalsScreen.tsx`
  - [x] Implement coach streaming intro
  - [x] Render goal type choices (6 options including freeform)
  - [x] Handle "Something else" → `FreeformInput` + `MiniAnalysis`
  - [x] Implement race goal follow-up (distance + date)

- [x] **Task 3: Create HealthScreen Component** (AC: #10-#13)
  - [x] Create `apps/native/src/components/app/onboarding/screens/HealthScreen.tsx`
  - [x] Implement coach streaming intro
  - [x] Render injury multi-select with `multi={true}` Choices
  - [x] Handle "None" as mutually exclusive
  - [x] Render recovery style follow-up
  - [x] Handle "Push through" with `flagged={true}` + coach acknowledgment

- [x] **Task 4: Create StyleScreen Component** (AC: #14-#16)
  - [x] Create `apps/native/src/components/app/onboarding/screens/StyleScreen.tsx`
  - [x] Implement coach streaming intro
  - [x] Render coaching style choices (4 options with descriptions)
  - [x] Render biggest challenge choices (4 options)
  - [x] Update progress bar to ~85%

- [x] **Task 5: Create OpenQuestionScreen Component** (AC: #17-#20)
  - [x] Create `apps/native/src/components/app/onboarding/screens/OpenQuestionScreen.tsx`
  - [x] Implement coach streaming: "Anything else you want me to know?"
  - [x] Render `FreeformInput` with pill chips
  - [x] Handle freeform submission → `MiniAnalysis`
  - [x] Handle skip pill → direct advance

- [x] **Task 6: Mock Data Layer** (AC: #21)
  - [x] Create `apps/native/src/components/app/onboarding/mocks/conversationMocks.ts`
  - [x] Define mock responses for each screen
  - [x] Define mock delays (simulate network timing)
  - [x] Define mock MiniAnalysis extractions

- [x] **Task 7: Progress & Transitions** (AC: #22-#23)
  - [x] Implement progress bar updates across screens
  - [x] Implement smooth screen transitions
  - [x] Test flow continuity end-to-end

- [x] **Task 8: Integration Test** (AC: all)
  - [x] Test complete SelfReport → Goals → Health → Style → OpenQuestion flow
  - [x] Verify all Choice interactions (select, deselect, flagged)
  - [x] Verify MiniAnalysis triggers correctly
  - [x] Verify progress bar accuracy
  - [x] Run TypeScript checks (`tsc --noEmit`)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Component Dependencies (from previous stories):**
   - `StreamBlock` from Story 2.9 (streaming text with cursor)
   - `Choice` from Story 2.11 (selection cards)
   - `ConfidenceBadge` from Story 2.11 (data quality indicator)
   - `FreeformInput` from Story 2.10 (text input with pills)
   - `MiniAnalysis` from Story 2.10 (analysis visualization)

2. **Animation Library:**
   - Use `react-native-reanimated` v4.1.6
   - Use animation presets from `animations.ts` (Story 2.8)
   - Stagger choice animations with increasing delays

3. **Design System:**
   - Use semantic tokens via NativeWind
   - Fonts: `font-coach` (Outfit) for coach text, `font-mono` for data
   - Colors: `lime`, `ora`, `red`, `g1`-`g4`, `brd`, `card`

### Prototype Reference

From `cadence-v3.jsx` lines 473-678:

**SelfReport Screen (lines 479-530):**
```javascript
function SelfReport({ onComplete }) {
  // Weekly km question
  // Days per week (numeric 2-7)
  // Longest run question
  // Shows MODERATE confidence badge on complete
}
```

**Goals Screen (lines 535-580):**
```javascript
function Goals({ onComplete }) {
  // "What are you working toward?"
  // Options: race, faster, mileage, back in shape, health, something else
  // Freeform triggers MiniAnalysis
}
```

**Health Screen (lines 585-640):**
```javascript
function Health({ onComplete }) {
  // Injury multi-select
  // Recovery style follow-up
  // "Push through" triggers flagged + coach response
}
```

**StyleScr (lines 645-670):**
```javascript
function StyleScr({ onComplete }) {
  // Coaching style: tough love, encouraging, analytical, minimalist
  // Biggest challenge: consistency, pacing, time, stuck
}
```

**OpenQuestion (lines 673-678):**
```javascript
function OpenQuestion({ onComplete }) {
  // "Anything else you want me to know?"
  // Freeform with pills
}
```

### Screen Flow Sequence

```
SelfReport (NO DATA path)
    ↓
Goals
    ↓
Health
    ↓
Style
    ↓
OpenQuestion
    ↓
TransitionScreen (Story 2.13)
```

### Choice Options Reference

**SelfReport - Weekly Volume:**
| Option | Value |
|--------|-------|
| Less than 20km | "<20" |
| 20-40km | "20-40" |
| 40-60km | "40-60" |
| 60km+ | "60+" |
| I'm not sure | "unsure" |

**SelfReport - Days Per Week:**
| Option | Value |
|--------|-------|
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 |
| 6 | 6 |
| 7 | 7 |

**Goals - Goal Type:**
| Option | Value | Triggers |
|--------|-------|----------|
| Training for a race | "race" | Distance follow-up |
| Getting faster | "speed" | - |
| Building mileage | "volume" | - |
| Getting back in shape | "comeback" | - |
| General health | "health" | - |
| Something else | "other" | FreeformInput |

**Health - Injuries (multi-select):**
| Option | Value |
|--------|-------|
| Shin splints | "shins" |
| IT band | "itband" |
| Plantar fasciitis | "plantar" |
| Knee pain | "knee" |
| Achilles issues | "achilles" |
| None | "none" |

**Health - Recovery Style:**
| Option | Value | Flagged |
|--------|-------|---------|
| Bounce back quick | "quick" | No |
| Takes a while | "slow" | No |
| Push through | "push" | Yes |

**Style - Coaching Style:**
| Option | Description |
|--------|-------------|
| Tough love | "Tell it like it is" |
| Encouraging | "Positive reinforcement" |
| Analytical | "Data and numbers" |
| Minimalist | "Just the essentials" |

**Style - Biggest Challenge:**
| Option | Value |
|--------|-------|
| Consistency | "consistency" |
| Pacing | "pacing" |
| Time | "time" |
| Stuck | "stuck" |

### Progress Bar Milestones

| Screen | Progress % |
|--------|------------|
| After SelfReport | ~40% |
| After Goals | ~55% |
| After Health | ~70% |
| After Style | ~85% |
| After OpenQuestion | ~95% |

### Mock Data Structure

```typescript
// apps/native/src/components/app/onboarding/mocks/conversationMocks.ts

export const mockSelfReportData = {
  weeklyVolume: "20-40",
  daysPerWeek: 4,
  longestRun: "15-20",
};

export const mockGoalsData = {
  goalType: "race",
  raceDistance: "half",
  raceDate: "2026-06-15",
};

export const mockHealthData = {
  injuries: ["shins", "knee"],
  recoveryStyle: "slow",
};

export const mockStyleData = {
  coachingStyle: "analytical",
  biggestChallenge: "pacing",
};

export const mockMiniAnalysisExtractions = {
  raceGoal: "Half Marathon in June",
  timeline: "~4 months",
  injuryFlags: ["Shin splint history noted"],
};
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/screens/SelfReportScreen.tsx` | NO DATA path volume/frequency questions |
| `apps/native/src/components/app/onboarding/screens/GoalsScreen.tsx` | Goal type and race details |
| `apps/native/src/components/app/onboarding/screens/HealthScreen.tsx` | Injury and recovery questions |
| `apps/native/src/components/app/onboarding/screens/StyleScreen.tsx` | Coaching preferences |
| `apps/native/src/components/app/onboarding/screens/OpenQuestionScreen.tsx` | Final freeform input |
| `apps/native/src/components/app/onboarding/mocks/conversationMocks.ts` | Mock data for all screens |

### Dependencies

**Uses from Story 2.8:**
- Animation presets: `springUp`, `fadeUp`, `scaleIn`
- Color tokens: all semantic tokens

**Uses from Story 2.9:**
- `StreamBlock` component for coach streaming text

**Uses from Story 2.10:**
- `FreeformInput` component
- `MiniAnalysis` component

**Uses from Story 2.11:**
- `Choice` component (single/multi select)
- `ConfidenceBadge` component

**No new packages required.**

### Testing Considerations

1. **Flow Testing:**
   - Test complete flow: SelfReport → Goals → Health → Style → OpenQuestion
   - Verify screen transitions are smooth
   - Test progress bar updates at each milestone

2. **Choice Interaction Testing:**
   - Test single-select modes (Goals, Style)
   - Test multi-select mode (Health injuries)
   - Test "None" exclusivity in injury selection
   - Test "Push through" flagged state

3. **FreeformInput + MiniAnalysis:**
   - Test "Something else" in Goals triggers freeform
   - Test freeform submission triggers analysis
   - Test pill chip shortcuts work

4. **Visual Testing:**
   - Compare with prototype screens
   - Verify staggered animations
   - Test progress bar visual accuracy

### References

- [Source: cadence-v3.jsx lines 473-678] - Screen implementations
- [Source: sprint-change-proposal-2026-02-14.md#Story 2-12] - Story requirements
- [Depends on: Story 2.8] - Design tokens and animations
- [Depends on: Story 2.9] - StreamBlock component
- [Depends on: Story 2.10] - FreeformInput and MiniAnalysis
- [Depends on: Story 2.11] - Choice and ConfidenceBadge

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript checks passed for all story 2.12 files (backend has pre-existing errors unrelated to this story)

### Completion Notes List

- **Task 1**: Created `SelfReportScreen.tsx` with StreamBlock intro, weekly volume choices (5 options), days per week numeric pills (2-7), longest run choices (4 options), and ConfidenceBadge MODERATE on completion.
- **Task 2**: Created `GoalsScreen.tsx` with goal type selection (6 options), race distance/date follow-ups for "race" selection, and FreeformInput + MiniAnalysis for "other" selection.
- **Task 3**: Created `HealthScreen.tsx` with multi-select injury checkboxes, "None" mutual exclusivity logic, recovery style follow-up, and flagged "Push through" option with coach warning.
- **Task 4**: Created `StyleScreen.tsx` with coaching style selection (4 options with descriptions) and biggest challenge selection (4 options with descriptions).
- **Task 5**: Created `OpenQuestionScreen.tsx` with StreamBlock intro, FreeformInput with pill shortcuts ("No, that covers it" / "One more thing..."), and MiniAnalysis on submission.
- **Task 6**: Created `conversationMocks.ts` with COACH_PROMPTS, all choice options, PROGRESS_MILESTONES, MOCK_DELAYS, and default mock data for testing.
- **Task 7**: Implemented progress bar integration in test component with milestone updates (15% → 40% → 55% → 70% → 85% → 95%) and SlideInRight/SlideOutLeft transitions.
- **Task 8**: Created `conversation-flow-test.tsx` visual integration test with complete flow, collected data JSON summary, and reset functionality.

### File List

**Created:**
- `apps/native/src/components/app/onboarding/screens/SelfReportScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/GoalsScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/HealthScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/StyleScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/OpenQuestionScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/index.ts`
- `apps/native/src/components/app/onboarding/mocks/conversationMocks.ts`
- `apps/native/src/components/__tests__/conversation-flow-test.tsx`

**Modified:**
- None
