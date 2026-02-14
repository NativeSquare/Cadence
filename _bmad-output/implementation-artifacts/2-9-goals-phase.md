# Story 2.9: Goals Phase

Status: ready-for-dev

---

## Story

As a **user**,
I want **to tell the coach what I'm working toward**,
So that **the plan serves my specific objectives**.

---

## Acceptance Criteria

### AC1: Goal Type Question

**Given** the user enters the goals phase (after profile completion)
**When** the coach asks about goals
**Then** options are presented via `renderMultipleChoice` tool
**And** options include: race, speed, base building, return to fitness, general health
**And** this maps to FR29 (User can specify a race goal with target distance and date)

### AC2: Race Goal Flow

**Given** the user selects "race" goal
**When** they confirm the selection
**Then** `goals.goalType` is set to `"race"`
**And** follow-up asks for race distance (5K, 10K, Half Marathon, Marathon, Ultra)
**And** follow-up asks for race date via date picker or input
**And** follow-up asks for target time (optional, with skip option "Help me figure it out")
**And** this maps to FR30 (User can specify a time target)

### AC3: Race Details Capture

**Given** the user is in race goal flow
**When** they provide race details
**Then** `goals.raceDistance` is set (e.g., 42.195 for marathon)
**And** `goals.raceDate` is set as Unix timestamp
**And** `goals.targetTime` is optionally set (in seconds)
**And** progress bar advances with each field

### AC4: Non-Race Goal Flow (Open Training)

**Given** the user selects a non-race goal (speed, base building, return to fitness, general health)
**When** they confirm the selection
**Then** the coach adapts to "Open Training" mode (FR31)
**And** `goals.goalType` is set to the selected value
**And** appropriate follow-ups are asked based on goal type:
  - Speed: "What aspect of speed? Shorter races? Faster easy pace?"
  - Base building: "Looking to increase your weekly volume?"
  - Return to fitness: "Coming back from injury or break?"
  - General health: "Looking to maintain consistency?"

### AC5: No Specific Goal Path

**Given** the user has no specific race goal
**When** they indicate this (via "I'm not training for anything specific" or similar)
**Then** the coach proposes a rolling improvement cycle
**And** asks "What would feel like an accomplishment to you?"
**And** captures qualitative goals (consistency, feeling good, etc.)

### AC6: Target Time Optional Skip

**Given** the user has selected a race goal with distance and date
**When** asked about target time
**Then** they can skip with "Help me figure it out"
**And** `goals.targetTime` remains undefined
**And** coach acknowledges: "I'll help estimate a realistic target based on your training"

### AC7: Phase Completion

**Given** all required goal fields are captured
**When** the goals phase completes
**Then** `conversationState.currentPhase` transitions to `"schedule"`
**And** coach transitions naturally to schedule questions (Story 2.10)

---

## Tasks / Subtasks

- [ ] **Task 1: Define Goal Type Tool** (AC: #1)
  - [ ] Create `renderMultipleChoice` call for goal type
  - [ ] Options: race, speed, base_building, return_to_fitness, general_health
  - [ ] Include descriptions for each option
  - [ ] Map to `goals.goalType`

- [ ] **Task 2: Implement Race Distance Question** (AC: #2, #3)
  - [ ] Coach asks "What distance are you training for?"
  - [ ] Options: 5K, 10K, Half Marathon, Marathon, Ultra, Other
  - [ ] Map to numeric km: 5, 10, 21.1, 42.2, 50+
  - [ ] Store in `goals.raceDistance`

- [ ] **Task 3: Implement Race Date Input** (AC: #2, #3)
  - [ ] Coach asks "When is your race?"
  - [ ] Use `renderOpenInput` or dedicated date tool
  - [ ] Parse natural language: "March 15th", "in 12 weeks", "early April"
  - [ ] Convert to Unix timestamp for `goals.raceDate`

- [ ] **Task 4: Implement Target Time Question** (AC: #2, #6)
  - [ ] Coach asks "Do you have a time goal in mind?"
  - [ ] `renderOpenInput` with suggestedResponses:
    - "I want to break [X]"
    - "Around [X:XX]"
    - "Help me figure it out"
  - [ ] Parse time format and convert to seconds
  - [ ] Store in `goals.targetTime`

- [ ] **Task 5: Implement Non-Race Flows** (AC: #4)
  - [ ] For speed: ask about specific speed goals
  - [ ] For base_building: ask about volume targets
  - [ ] For return_to_fitness: ask about comeback context (Story 2.11 overlap)
  - [ ] For general_health: confirm maintenance approach

- [ ] **Task 6: Implement Open Training Path** (AC: #5)
  - [ ] Detect "no specific goal" selection
  - [ ] Coach proposes rolling improvement cycle
  - [ ] Ask "What would feel like an accomplishment?"
  - [ ] Capture qualitative response

- [ ] **Task 7: Phase Transition Logic** (AC: #7)
  - [ ] After required goal fields captured, `determinePhase()` returns `"schedule"`
  - [ ] Coach transitions: "Great. Now let's figure out when you can actually run..."

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Generative UI Pattern:**
   - Goal type: `renderMultipleChoice`
   - Race distance: `renderMultipleChoice`
   - Race date: `renderOpenInput` or custom date tool
   - Target time: `renderOpenInput` with skip option

2. **Conditional Required Fields:**
   From Story 1.6, race-specific fields are conditionally required:
   ```typescript
   const CONDITIONAL_FIELDS: Record<string, string[]> = {
     race: ["goals.raceDistance", "goals.raceDate"],
   };
   ```
   - If `goalType === "race"`, then `raceDistance` and `raceDate` are required
   - `targetTime` is always optional

3. **State Updates:**
   - Each field triggers `updateRunner` mutation
   - Completeness recalculated based on goal type
   - Phase determined by `determinePhase()` function

### Runner Object Goals Schema

From `packages/backend/convex/table/runners.ts`:

```typescript
const goalsSchema = v.object({
  goalType: v.optional(
    v.union(
      v.literal("race"),
      v.literal("speed"),
      v.literal("base_building"),
      v.literal("return_to_fitness"),
      v.literal("general_health")
    )
  ),
  raceDistance: v.optional(v.number()), // km
  raceDate: v.optional(v.number()), // Unix timestamp
  targetTime: v.optional(v.number()), // Duration in seconds
  targetPace: v.optional(v.string()),
  targetVolume: v.optional(v.number()),
});
```

### Tool Definitions

**Goal Type:**
```typescript
renderMultipleChoice({
  question: "What are you working toward right now?",
  options: [
    { value: "race", label: "Training for a race", description: "A specific event with a date" },
    { value: "speed", label: "Getting faster", description: "Improve pace and speed endurance" },
    { value: "base_building", label: "Building my base", description: "Increase volume and consistency" },
    { value: "return_to_fitness", label: "Returning to running", description: "Coming back from break or injury" },
    { value: "general_health", label: "General fitness", description: "Stay healthy and consistent" },
  ],
  targetField: "goals.goalType",
})
```

**Race Distance:**
```typescript
renderMultipleChoice({
  question: "What distance are you training for?",
  options: [
    { value: 5, label: "5K" },
    { value: 10, label: "10K" },
    { value: 21.1, label: "Half Marathon" },
    { value: 42.2, label: "Marathon" },
    { value: 50, label: "Ultra (50K+)" },
  ],
  targetField: "goals.raceDistance",
  allowFreeText: true,
  freeTextPlaceholder: "Or enter distance in km...",
})
```

**Race Date:**
```typescript
renderOpenInput({
  prompt: "When is your race?",
  placeholder: "e.g., March 15, 2026 or 'in 12 weeks'",
  suggestedResponses: ["In about 8 weeks", "In about 12 weeks", "In about 16 weeks", "Not sure yet"],
  targetField: "goals.raceDate",
})
```

**Target Time:**
```typescript
renderOpenInput({
  prompt: "Do you have a time goal in mind?",
  placeholder: "e.g., 'sub-4 hours' or '1:45:00'",
  suggestedResponses: [
    "I want to PR",
    "Just want to finish",
    "Help me figure it out",
  ],
  targetField: "goals.targetTime",
  allowSkip: true,
  skipLabel: "Help me figure it out",
})
```

### Date Parsing Logic

The LLM should parse natural language dates:

| Input | Output (Unix timestamp for) |
|-------|----------------------------|
| "March 15, 2026" | 1741996800 |
| "in 12 weeks" | Current date + 12 weeks |
| "early April" | Approximate date in early April |
| "spring 2026" | Mid-March to mid-May estimate |

For ambiguous dates, coach should confirm: "So we're looking at around [date], right?"

### Time Parsing Logic

Target time should be parsed to seconds:

| Input | Output (seconds) |
|-------|-----------------|
| "sub-4 hours" | 14400 (4:00:00) |
| "3:45:00" | 13500 |
| "1:45" (half) | 6300 |
| "22 minutes" (5K) | 1320 |

### Coach Prompt Context

Add to coach system prompt for goals phase:

```
When gathering goals:
1. Start by asking what they're working toward
2. For race goals, get distance, date, and optionally time
3. For non-race goals, understand the underlying motivation
4. If they're unsure, propose a rolling improvement approach
5. Be supportive of any goal — there's no wrong answer

For time goals:
- If they say "Help me figure it out", acknowledge and move on
- Note: "I'll estimate a realistic target once I know more about you"

For non-race goals, adapt conversation:
- Speed: focus on what speed means to them
- Base building: discuss volume increases
- Return to fitness: be empathetic about comeback
- General health: confirm maintenance/consistency focus
```

### Progress Bar Impact

| Field | Completeness Impact |
|-------|---------------------|
| `goalType` | +7% |
| `raceDistance` (if race) | +4% |
| `raceDate` (if race) | +4% |

For race goals: ~15% total from goals phase
For non-race goals: ~7% from goals phase (only goalType required)

### Open Training Mode

When user doesn't have a race goal:

1. Coach acknowledges: "No race on the calendar? That's fine."
2. Proposes rolling cycles: "We can work in 4-6 week blocks."
3. Asks for qualitative goal: "What would feel like a win to you?"
4. Captures motivation for planning context

Example qualitative goals:
- "Just feeling good when I run"
- "Being able to run without getting injured"
- "Running a consistent 5 days a week"

### Project Structure Notes

**Files to Modify:**
| File | Change |
|------|--------|
| `packages/backend/convex/ai/prompts/onboarding-coach.ts` | Add goals phase prompts |
| `packages/backend/convex/ai/http-action.ts` | Goals tool orchestration |

**Potential New Tools:**
- Date parsing may benefit from dedicated tool or utility
- Time parsing utility for target time

### Dependencies

**From Story 2.1 (AI SDK Integration):**
- Streaming conversation infrastructure
- Tool calling capability

**From Story 2.3 (Multiple Choice Input):**
- `renderMultipleChoice` tool
- MultipleChoiceInput component

**From Story 2.4 (Open Text Input):**
- `renderOpenInput` tool for date/time inputs

**From Story 2.8 (Runner Profile):**
- User has completed profile phase
- `currentPhase` is `"goals"`
- Runner has `experienceLevel` set (affects coach tone)

### Phase Determination Impact

Update to `determinePhase()` in runners.ts:

```typescript
// Check goals
const goalType = runner.goals?.goalType;
if (!goalType) {
  return "goals";
}
if (goalType === "race") {
  if (!runner.goals?.raceDistance || !runner.goals?.raceDate) {
    return "goals";
  }
}
```

For race goals, both distance and date are required before moving to schedule.
For non-race goals, only goalType is required.

### Testing Considerations

1. **Manual Testing:**
   - Complete race goal flow: type → distance → date → time
   - Complete race goal flow with time skip
   - Complete each non-race goal flow
   - Test date parsing with various inputs
   - Verify progress bar updates correctly

2. **Edge Cases:**
   - User changes goal type mid-conversation
   - User provides ambiguous date
   - User provides unrealistic time goal
   - User changes mind about having a race

3. **Conversation Quality:**
   - Coach adapts to goal type appropriately
   - Time skip feels supportive, not dismissive
   - Non-race goals feel equally valid

### References

- [Source: architecture.md#Generative UI Implementation] - Tool rendering pattern
- [Source: epics.md#Story 2.9] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#FR29] - Race goal requirement
- [Source: prd-onboarding-mvp.md#FR30] - Target time requirement
- [Source: prd-onboarding-mvp.md#FR31] - Open Training mode
- [Source: ux-onboarding-flow-v6-2026-02-13.md#Getting to Know Each Other] - Goals UX

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

