# Story 2.12: Coaching Preferences Phase

Status: ready-for-dev

## Story

As a user building my runner profile,
I want to tell the coach how I prefer to be coached,
So that the experience matches my personality and motivational style.

## Acceptance Criteria

1. **Given** the user enters the coaching phase **When** the coach asks about coaching style **Then** options are presented: tough love, encouraging, analytical, minimalist (FR37)

2. **Given** the user selects a coaching style **When** the coach responds **Then** the response mirrors the selected style **And** `coaching.coaching_voice` is updated

3. **Given** the coach asks about biggest challenge **When** options are presented **Then** they include: consistency, time, motivation, injury fear, pacing, stuck **And** free text is allowed

4. **Given** all coaching preferences are captured **When** the phase completes **Then** relevant Runner Object fields are populated **And** progress bar approaches completion (~90%)

## Tasks / Subtasks

- [ ] Task 1: Implement coaching style question (AC: #1)
  - [ ] Configure `renderMultipleChoice` with coaching style options
  - [ ] Add descriptions for each style option
  - [ ] Map selection to `coaching.coaching_voice` field

- [ ] Task 2: Implement style-mirroring response (AC: #2)
  - [ ] Update coach system prompt to adapt to selected style
  - [ ] Generate immediate response that demonstrates the selected style
  - [ ] Verify style persists in subsequent messages

- [ ] Task 3: Implement biggest challenge question (AC: #3)
  - [ ] Configure `renderMultipleChoice` with challenge options
  - [ ] Include `allowFreeText: true` for custom challenges
  - [ ] Map to `coaching.biggest_challenge` field

- [ ] Task 4: Update progress tracking (AC: #4)
  - [ ] Ensure coaching fields update `data_completeness`
  - [ ] Verify progress bar shows ~90% after coaching phase
  - [ ] Transition to final check phase (story 2.13)

## Dev Notes

### Architecture Compliance

- **LLM Integration**: Coach must dynamically adapt language style based on `coaching_voice`
- **Generative UI**: Standard `renderMultipleChoice` tool usage
- **Real-time Adaptation**: Style change should affect immediate next response
- **State Management**: Coaching section updates via Convex mutations

### Technical Requirements

**Runner Object Schema (coaching section):**
```typescript
coaching: {
  coaching_voice: "tough_love" | "encouraging" | "analytical" | "minimalist";
  biggest_challenge: string;
  motivation_triggers?: string[];
  communication_frequency?: "daily" | "weekly" | "as_needed";
}
```

**Coaching Style Options:**
```typescript
const COACHING_STYLE_OPTIONS = [
  {
    value: "tough_love",
    label: "Tough love",
    description: "Direct feedback, high accountability, no sugar-coating"
  },
  {
    value: "encouraging",
    label: "Encouraging",
    description: "Positive reinforcement, celebrate small wins, supportive"
  },
  {
    value: "analytical",
    label: "Analytical",
    description: "Data-driven insights, numbers and percentages, detailed explanations"
  },
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Brief and direct, essential info only, no fluff"
  }
];
```

**Biggest Challenge Options:**
```typescript
const CHALLENGE_OPTIONS = [
  { value: "consistency", label: "Staying consistent" },
  { value: "time", label: "Finding time to train" },
  { value: "motivation", label: "Staying motivated" },
  { value: "injury_fear", label: "Fear of re-injury" },
  { value: "pacing", label: "Running the right paces" },
  { value: "stuck", label: "Feeling stuck / plateaued" }
];
```

**Style-Mirroring Implementation:**

The LLM system prompt should include dynamic sections based on `coaching_voice`:

```typescript
// In coach system prompt
const getStyleInstructions = (voice: string) => {
  switch (voice) {
    case "tough_love":
      return "Be direct and challenging. Don't soften feedback. Hold the runner accountable.";
    case "encouraging":
      return "Lead with positives. Celebrate progress. Use warm, supportive language.";
    case "analytical":
      return "Cite specific numbers. Explain reasoning with data. Use percentages and metrics.";
    case "minimalist":
      return "Be brief. One sentence where possible. No filler words. Essential info only.";
  }
};
```

### File Structure Requirements

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/prompts/coaching-styles.ts` | Style-specific language instructions |

### Existing Components to Extend

- `packages/backend/convex/ai/http-action.ts` - Include coaching_voice in system prompt context
- `packages/backend/convex/table/runners.ts` - Add coaching field mutations
- Coach system prompt - Add dynamic style adaptation

### Testing Requirements

- Unit test: All four coaching styles render correctly
- Integration test: Style selection triggers style-appropriate response
- Integration test: Biggest challenge with free text captures custom input
- E2E test: Complete coaching phase reaches ~90% progress

### Project Structure Notes

- Coaching phase follows Health phase (story 2.11)
- Style preference affects all subsequent coach messages (Epic 3 plan presentation)
- Minimalist style should produce noticeably shorter responses

### References

- [Source: architecture.md#LLM Integration Architecture] - System prompt handling
- [Source: epics.md#Story 2.12] - Original story definition with FR37
- [Source: epics.md#Story 3.8] - Adaptive Coaching Language (uses coaching_voice)

### Dependencies

- **Story 2.11 (Health Phase)**: Must complete before coaching phase
- **Story 2.1 (AI SDK Integration)**: System prompt customization
- **Story 2.3 (Multiple Choice Input Tool)**: Standard tool usage
- **Story 1.1 (Runner Object Schema)**: Schema must include coaching fields

### Cross-Story Impact

The `coaching_voice` field captured here is critical for:
- **Story 3.8 (Adaptive Coaching Language)**: Plan explanation style
- All future coach interactions after onboarding
- Should persist and be editable in user settings post-MVP

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
