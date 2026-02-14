# Story 2.13: Final Check & Profile Completion

Status: ready-for-dev

## Story

As a user completing my runner profile,
I want a chance to add anything else before plan generation,
So that the coach has the complete picture and nothing is missed.

## Acceptance Criteria

1. **Given** all profile phases are complete **When** the final check is reached **Then** the coach asks: "Anything else you want me to know?" **And** an `renderOpenInput` with `suggestedResponses` is shown ("No, I think that covers it", "Actually, there's one more thing...")

2. **Given** the user adds additional information **When** they submit **Then** the LLM parses and updates relevant Runner Object fields **And** the coach acknowledges: "Good to know. That's going into the mix."

3. **Given** the user indicates nothing more to add **When** they confirm **Then** progress bar hits 100% **And** the conversation state is set to `ready_for_plan` **And** transition to plan generation begins (FR25, FR28)

## Tasks / Subtasks

- [ ] Task 1: Implement final check question (AC: #1)
  - [ ] Trigger final check after coaching phase completes
  - [ ] Configure `renderOpenInput` with suggestedResponses
  - [ ] Style as transitional/summary moment in conversation

- [ ] Task 2: Handle additional information parsing (AC: #2)
  - [ ] LLM parses free text to extract relevant data
  - [ ] Update appropriate Runner Object fields based on content
  - [ ] Coach acknowledges with contextual response
  - [ ] Allow follow-up if user wants to add more

- [ ] Task 3: Handle completion confirmation (AC: #3)
  - [ ] Detect "nothing more" response pattern
  - [ ] Set `data_completeness` to 100%
  - [ ] Update progress bar UI to 100%
  - [ ] Set conversation state to `ready_for_plan`

- [ ] Task 4: Implement transition to plan generation
  - [ ] Trigger Epic 3 plan generation flow
  - [ ] Coach delivers transition message
  - [ ] Visual transition from profile to plan phase

## Dev Notes

### Architecture Compliance

- **LLM Integration**: Free text parsing requires LLM intelligence to extract structured data
- **Generative UI**: `renderOpenInput` with `suggestedResponses` for quick responses
- **State Transition**: `conversation_state` field tracks flow phase
- **Progress Tracking**: This story completes the profile, hitting 100%

### Technical Requirements

**Runner Object Fields (meta section):**
```typescript
meta: {
  data_completeness: number; // 0-100
  conversation_state: "profile_building" | "ready_for_plan" | "plan_generated";
  profile_completed_at?: string; // ISO timestamp
  additional_notes?: string; // Free text from final check
}
```

**Tool Configuration:**
```typescript
renderOpenInput({
  prompt: "Anything else you want me to know before I build your plan?",
  placeholder: "Type here or tap a quick response...",
  suggestedResponses: [
    "No, I think that covers it",
    "Actually, there's one more thing..."
  ],
  allowVoice: true,
  targetField: "meta.additional_notes"
})
```

**Completion Detection Logic:**
```typescript
// In LLM tool handling
const COMPLETION_PATTERNS = [
  "no",
  "that covers it",
  "nothing else",
  "that's all",
  "i'm good",
  "let's go",
  "ready"
];

const isCompletionResponse = (text: string): boolean => {
  const normalized = text.toLowerCase().trim();
  return COMPLETION_PATTERNS.some(pattern => normalized.includes(pattern));
};
```

**Transition Message Examples:**

Coach should deliver a brief summary before transitioning:
- "Perfect. I've got a clear picture now. Give me a moment to put together a plan built just for you."
- "Alright, {name}. Let me analyze everything and build your personalized training plan."

### File Structure Requirements

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/handleFinalCheck.ts` | Final check handling and state transition |

### Existing Components to Extend

- `packages/backend/convex/table/runners.ts` - Add `conversation_state` field and transition mutation
- `apps/native/src/components/app/onboarding/generative/OpenInput.tsx` - Already exists
- Progress bar component - Animate to 100% on completion

### Testing Requirements

- Unit test: suggestedResponses render correctly in OpenInput
- Integration test: Free text additional info parses and persists
- Integration test: Completion response triggers 100% and state change
- E2E test: Full final check to plan generation transition works

### Project Structure Notes

- This is the bridge between Epic 2 (Profile Building) and Epic 3 (Plan Generation)
- Progress bar animation to 100% should feel celebratory
- Coach transition message sets expectation for Thinking Stream (story 3.2)

### References

- [Source: architecture.md#Data Architecture] - Runner Object state tracking
- [Source: epics.md#Story 2.13] - Original story definition with FR25, FR28
- [Source: ux-onboarding-flow-v6.md] - Profile completion transition UX

### Dependencies

- **Story 2.12 (Coaching Preferences)**: Must complete before final check
- **Story 2.4 (Open Text Input Tool)**: OpenInput with suggestedResponses
- **Story 1.6 (Progress Tracking)**: Progress bar and data_completeness
- **Story 3.1 (Plan Generation Engine)**: Target of transition

### Transition Handoff to Epic 3

After this story completes, the flow continues to:
1. **Story 3.1**: Plan Generation Engine
2. **Story 3.2**: Thinking Stream displays as LLM analyzes profile

The `ready_for_plan` state should trigger:
- Brief pause (500ms-1s) for dramatic effect
- Thinking Stream initialization
- Plan generation LLM call

### Progress Bar Completion

The progress bar should:
- Animate smoothly from ~90% to 100%
- Include subtle haptic feedback on completion
- Consider confetti or micro-celebration animation (optional, check with design)

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
