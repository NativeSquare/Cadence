# Story 2.8: Runner Profile Phase

Status: ready-for-dev

---

## Story

As a **user**,
I want **to tell the coach about my running experience and current volume**,
So that **the plan can be calibrated to my level**.

---

## Acceptance Criteria

### AC1: Experience Level Question

**Given** the user is in the profile phase (after wearable connection/skip)
**When** the coach asks about experience level
**Then** options are presented via `renderMultipleChoice` tool
**And** options include: beginner, returning runner, casual, serious
**And** the user can select one option or provide free text via "Other"
**And** this maps to FR32 (User can describe their running experience level)

### AC2: Beginner Path

**Given** the user selects "beginner"
**When** experience is captured
**Then** `running.experienceLevel` is set to `"beginner"`
**And** follow-up questions may skip detailed volume questions
**And** coach adapts language for new runners
**And** progress bar advances

### AC3: Experienced Runner Follow-ups

**Given** the user is not a beginner (returning, casual, or serious)
**When** experience is captured
**Then** follow-up questions ask about:
  - Current frequency (days/week) via `renderMultipleChoice`
  - Current volume (weekly km) via `renderOpenInput` or choice
  - Easy pace (if known) via `renderOpenInput`
**And** each answer updates the corresponding Runner Object field
**And** progress bar advances with each field

### AC4: Progressive Field Updates

**Given** the user provides profile information
**When** each answer is submitted
**Then** the corresponding Runner Object field is updated immediately
**And** `conversationState.dataCompleteness` is recalculated
**And** the progress bar UI updates in real-time
**And** the coach acknowledges with contextual response

### AC5: Free Text Intelligence

**Given** the user volunteers extra information in free text
**When** the LLM parses their response (e.g., "I run about 40k a week, mostly easy runs around 5:30 pace")
**Then** relevant fields are extracted and populated:
  - `running.currentVolume` = 40
  - `running.easyPace` = "5:30/km"
**And** the coach acknowledges: "Good to know — I was going to ask about that"
**And** subsequent questions skip already-answered topics

### AC6: Phase Completion

**Given** all profile fields are captured (experienceLevel, currentFrequency, currentVolume)
**When** the profile phase completes
**Then** `conversationState.currentPhase` transitions to `"goals"`
**And** coach transitions naturally to goal-setting questions (Story 2.9)

---

## Tasks / Subtasks

- [ ] **Task 1: Define Profile Question Tools** (AC: #1, #3)
  - [ ] Define `renderMultipleChoice` for experience level
  - [ ] Define options: beginner, returning, casual, serious with descriptions
  - [ ] Add `targetField: "running.experienceLevel"` to tool call

- [ ] **Task 2: Implement Experience Level Handler** (AC: #1, #4)
  - [ ] Handle tool result for experience level selection
  - [ ] Update Runner Object via `updateRunner` mutation
  - [ ] Map selection to schema value: `beginner | returning | casual | serious`

- [ ] **Task 3: Implement Frequency Question Flow** (AC: #3)
  - [ ] Coach asks "How often do you run each week?"
  - [ ] Options: "1-2 days", "3-4 days", "5-6 days", "Every day"
  - [ ] Map to `running.currentFrequency` as number (1, 2, 3, 4, 5, 6, 7)

- [ ] **Task 4: Implement Volume Question Flow** (AC: #3)
  - [ ] Coach asks "How far do you run in a typical week?"
  - [ ] Options: ranges like "Under 20km", "20-40km", "40-60km", "60-80km", "80+km"
  - [ ] Or free text input for specific number
  - [ ] Map to `running.currentVolume` as number in km

- [ ] **Task 5: Implement Easy Pace Input** (AC: #3)
  - [ ] Coach asks "What does an easy run feel like? Do you know your easy pace?"
  - [ ] `renderOpenInput` with suggestedResponses: "I don't track pace", "Around 6:00/km", "I go by feel"
  - [ ] Parse pace format (e.g., "5:40/km") and store as string
  - [ ] Map to `running.easyPace`

- [ ] **Task 6: Free Text Parsing Logic** (AC: #5)
  - [ ] Add extraction instructions to coach system prompt
  - [ ] LLM should identify volume, pace, frequency from natural language
  - [ ] Call tools to update multiple fields from single response
  - [ ] Coach acknowledges unprompted info naturally

- [ ] **Task 7: Beginner Path Adaptation** (AC: #2)
  - [ ] Detect beginner selection
  - [ ] Coach uses simpler language
  - [ ] May skip volume/pace questions or ask differently
  - [ ] Set sensible defaults: `currentFrequency: 2`, `currentVolume: 10`

- [ ] **Task 8: Phase Transition Logic** (AC: #6)
  - [ ] After all profile fields captured, `determinePhase()` returns `"goals"`
  - [ ] Coach transitions: "Great, now let's talk about what you're working toward..."
  - [ ] Ensure smooth handoff to Story 2.9

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Generative UI Pattern:**
   - Each question is a tool call from the AI
   - User response is captured as tool result
   - Coach processes result and continues conversation

2. **Tool Calling Sequence:**
   ```
   Coach text: "What kind of runner would you say you are?"
   Tool call: renderMultipleChoice(...)
   User taps: "Casual"
   Tool result: { selection: "casual" }
   Mutation: updateRunner({ running: { experienceLevel: "casual" } })
   Coach text: "Got it. How often do you run each week?"
   Tool call: renderMultipleChoice(...)
   ... continues
   ```

3. **State Updates:**
   - Each field update triggers `updateRunner` mutation
   - Completeness is recalculated server-side
   - Progress bar updates via Convex subscription

4. **Design System:**
   - Multiple choice: cards/buttons with `bg-white/5`
   - Selected state: `bg-primary/10 border-primary`
   - Text input: standard input styling

### Runner Object Profile Fields

From `packages/backend/convex/table/runners.ts`:

```typescript
const runningSchema = v.object({
  experienceLevel: v.optional(
    v.union(
      v.literal("beginner"),
      v.literal("returning"),
      v.literal("casual"),
      v.literal("serious")
    )
  ),
  monthsRunning: v.optional(v.number()),
  currentFrequency: v.optional(v.number()), // Days per week
  currentVolume: v.optional(v.number()), // Weekly km
  easyPace: v.optional(v.string()), // Format: "5:40/km"
  longestRecentRun: v.optional(v.number()),
  trainingConsistency: v.optional(
    v.union(v.literal("high"), v.literal("moderate"), v.literal("low"))
  ),
});
```

### Required Fields for Completeness

From Story 1.6, the required profile fields are:
- `running.experienceLevel`
- `running.currentFrequency`
- `running.currentVolume`

These three fields contribute ~20% to data completeness.

### Tool Definitions

**Experience Level:**
```typescript
renderMultipleChoice({
  question: "What kind of runner would you say you are?",
  options: [
    { value: "beginner", label: "Beginner", description: "Just getting started or less than 6 months of running" },
    { value: "returning", label: "Returning runner", description: "Used to run but took time off" },
    { value: "casual", label: "Casual", description: "Run regularly but not training for anything specific" },
    { value: "serious", label: "Serious", description: "Training consistently with specific goals" },
  ],
  targetField: "running.experienceLevel",
  allowFreeText: true,
})
```

**Frequency:**
```typescript
renderMultipleChoice({
  question: "How many days a week do you typically run?",
  options: [
    { value: 2, label: "1-2 days" },
    { value: 4, label: "3-4 days" },
    { value: 5, label: "5-6 days" },
    { value: 7, label: "Every day" },
  ],
  targetField: "running.currentFrequency",
})
```

**Volume:**
```typescript
renderMultipleChoice({
  question: "About how far do you run in a typical week?",
  options: [
    { value: 15, label: "Under 20km" },
    { value: 30, label: "20-40km" },
    { value: 50, label: "40-60km" },
    { value: 70, label: "60-80km" },
    { value: 90, label: "80+km" },
  ],
  targetField: "running.currentVolume",
  allowFreeText: true,
  freeTextPlaceholder: "Or enter your weekly km...",
})
```

### Coach Prompt Additions

Add to coach system prompt for profile phase:

```
When gathering the runner profile, you should:
1. Start by understanding their experience level
2. For non-beginners, ask about frequency and volume
3. If they mention pace naturally, capture it
4. Acknowledge extra information they volunteer
5. Use contextual language based on their level:
   - Beginner: simple, encouraging
   - Returning: empathetic, acknowledging the comeback
   - Casual: relaxed, no pressure
   - Serious: direct, technical when appropriate

If the user provides multiple pieces of information in one response,
extract all relevant data and update the Runner Object accordingly.
Then acknowledge: "Good to know — I was going to ask about that."
```

### Free Text Extraction Examples

**User says:** "I've been running for about 2 years, usually 4 times a week"
**Extract:**
- `running.experienceLevel` = "casual" or "serious" (infer from context)
- `running.currentFrequency` = 4

**User says:** "I do about 50k a week, mostly easy around 5:30 pace"
**Extract:**
- `running.currentVolume` = 50
- `running.easyPace` = "5:30/km"

### Beginner Adaptations

If `experienceLevel === "beginner"`:
- Skip detailed volume/pace questions OR ask differently
- Use simpler language: "How often would you like to run?"
- Set reasonable defaults for missing fields
- Coach tone: encouraging, no assumptions about knowledge

### Progress Bar Impact

| Field | Approximate Completeness Impact |
|-------|--------------------------------|
| `experienceLevel` | +7% |
| `currentFrequency` | +7% |
| `currentVolume` | +7% |
| Total Profile | ~21% of total |

After profile phase, user should be at ~25-30% completion (including name confirmation).

### Project Structure Notes

**No new files created** - this story uses existing infrastructure from Stories 2.1-2.3:
- Tool definitions in `packages/backend/convex/ai/tools/`
- Tool renderer in `apps/native/src/components/app/onboarding/generative/`
- Mutations in `packages/backend/convex/table/runners.ts`

**Files to Modify:**
| File | Change |
|------|--------|
| `packages/backend/convex/ai/prompts/onboarding-coach.ts` | Add profile phase prompts |
| `packages/backend/convex/ai/tools/renderMultipleChoice.ts` | Ensure options support for profile |
| `packages/backend/convex/ai/http-action.ts` | Profile tool orchestration |

### Dependencies

**From Story 2.1 (AI SDK Integration):**
- Streaming conversation infrastructure
- Tool calling capability

**From Story 2.3 (Multiple Choice Input):**
- `renderMultipleChoice` tool
- MultipleChoiceInput component

**From Story 2.4 (Open Text Input):**
- `renderOpenInput` tool for pace input
- OpenInput component

**From Story 1.6 (Progress Tracking):**
- Automatic completeness recalculation
- Progress bar updates

**From Story 2.7 (Wearable Skip):**
- User has transitioned to profile phase
- `currentPhase` is `"profile"`

### Testing Considerations

1. **Manual Testing:**
   - Complete full profile flow with each experience level
   - Test free text extraction with various inputs
   - Verify progress bar increments correctly
   - Verify phase transition to goals

2. **Edge Cases:**
   - User provides all info in first response
   - User skips optional pace question
   - User changes answer mid-flow
   - User provides nonsensical values

3. **Conversation Quality:**
   - Coach responses feel natural
   - Transitions between questions are smooth
   - Acknowledgments vary, don't feel repetitive

### References

- [Source: architecture.md#Generative UI Implementation] - Tool rendering pattern
- [Source: architecture.md#Tool Registry] - `renderMultipleChoice`, `renderOpenInput`
- [Source: epics.md#Story 2.8] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#FR32] - Experience level requirement
- [Source: ux-onboarding-flow-v6-2026-02-13.md#Getting to Know Each Other] - UX phase

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

