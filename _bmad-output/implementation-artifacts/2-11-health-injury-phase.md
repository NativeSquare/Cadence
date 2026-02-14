# Story 2.11: Health & Injury Phase

Status: ready-for-dev

## Story

As a user building my runner profile,
I want to tell the coach about my injury history and current health,
So that the plan protects me from re-injury and accounts for my physical context.

## Acceptance Criteria

1. **Given** the user enters the health phase **When** the coach asks about past injuries **Then** common injury options are presented (shin splints, IT band, plantar, knee, achilles, stress fracture, hip/glute, none) via `renderMultipleChoice` with `allowMultiple: true` (FR34) **And** free text "Other" option is available

2. **Given** the user has injury history **When** they report past injuries **Then** follow-up asks about current pain/issues **And** follow-up asks about recovery style (quick, slow, push through, no injuries)

3. **Given** the user indicates "push through" recovery style **When** that's captured **Then** the coach acknowledges this as a risk factor **And** notes it will be monitored in planning

4. **Given** the user is returning from injury (FR35) **When** the coach detects comeback situation **Then** sensitive language is used **And** non-performance goals like confidence rebuilding are explored (FR36)

5. **Given** the health phase continues **When** sleep and stress questions are asked **Then** sleep quality options are presented (solid, inconsistent, poor) **And** stress level options are presented (low, moderate, high, survival)

## Tasks / Subtasks

- [ ] Task 1: Implement injury history question (AC: #1)
  - [ ] Configure `renderMultipleChoice` with injury options and `allowMultiple: true`
  - [ ] Include `allowFreeText: true` for "Other" option
  - [ ] Map selections to `health.injury_history` array

- [ ] Task 2: Implement injury follow-up questions (AC: #2)
  - [ ] Add conditional logic: if injuries selected, ask about current pain
  - [ ] Add recovery style question with options
  - [ ] Map to `health.current_issues` and `health.recovery_style` fields

- [ ] Task 3: Implement comeback runner detection (AC: #3, #4)
  - [ ] Add coach response acknowledging "push through" as risk factor
  - [ ] Detect comeback situation from `running.status` or injury context
  - [ ] Adjust coach language tone for comeback runners
  - [ ] Explore non-performance goals (confidence rebuilding)

- [ ] Task 4: Implement sleep/stress questions (AC: #5)
  - [ ] Add sleep quality question via `renderMultipleChoice`
  - [ ] Add stress level question via `renderMultipleChoice`
  - [ ] Map to `health.sleep_quality` and `health.stress_level` fields

- [ ] Task 5: Update Runner Object and progress tracking
  - [ ] Ensure all health fields exist in schema
  - [ ] Implement mutations for health field updates
  - [ ] Recalculate `data_completeness` on each update

## Dev Notes

### Architecture Compliance

- **LLM Integration**: Convex HTTP Action handles conversation with context from Runner Object
- **Generative UI**: Use `renderMultipleChoice` with `allowMultiple: true` for injury list
- **Adaptive Coaching**: LLM system prompt should include comeback-sensitive language rules
- **State Management**: Health section updates via Convex mutations

### Technical Requirements

**Runner Object Schema (health section):**
```typescript
health: {
  injury_history: string[]; // ["shin_splints", "plantar_fasciitis"]
  current_issues: string[]; // Active pain/concerns
  recovery_style: "quick" | "slow" | "push_through" | "no_injuries";
  sleep_quality: "solid" | "inconsistent" | "poor";
  stress_level: "low" | "moderate" | "high" | "survival";
  is_comeback_runner?: boolean;
}
```

**Injury Option List:**
```typescript
const INJURY_OPTIONS = [
  { value: "shin_splints", label: "Shin splints" },
  { value: "it_band", label: "IT band syndrome" },
  { value: "plantar_fasciitis", label: "Plantar fasciitis" },
  { value: "knee_pain", label: "Knee pain / Runner's knee" },
  { value: "achilles", label: "Achilles tendinitis" },
  { value: "stress_fracture", label: "Stress fracture" },
  { value: "hip_glute", label: "Hip / Glute issues" },
  { value: "none", label: "No injury history" }
];
```

**Tool Configuration:**
```typescript
renderMultipleChoice({
  question: "Have you dealt with any of these running injuries?",
  options: INJURY_OPTIONS,
  allowMultiple: true,
  allowFreeText: true,
  allowSkip: false,
  targetField: "health.injury_history"
})
```

### File Structure Requirements

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/prompts/comeback-coaching.ts` | Sensitive language prompts for comeback runners |

### Existing Components to Extend

- `packages/backend/convex/ai/tools/renderMultipleChoice.ts` - Already supports `allowMultiple`
- `packages/backend/convex/table/runners.ts` - Add health field mutations
- Coach system prompt - Add comeback runner language rules

### Testing Requirements

- Unit test: MultipleChoice multi-select mode works correctly
- Unit test: Free text "Other" input captures custom injuries
- Integration test: Comeback detection triggers appropriate language
- Integration test: All health fields persist to Runner Object
- E2E test: Full health phase completes and advances progress

### Project Structure Notes

- Health phase follows Schedule phase (story 2.10)
- Multi-select pattern same as established in story 2.3
- Comeback runner detection may use data from running profile phase (story 2.8)

### References

- [Source: architecture.md#Generative UI Implementation] - Tool rendering pattern
- [Source: epics.md#Story 2.11] - Original story definition with FR34, FR35, FR36
- [Source: ux-onboarding-flow-v6.md] - Sensitive language for comeback runners

### Dependencies

- **Story 2.10 (Schedule Phase)**: Must complete before health phase
- **Story 2.3 (Multiple Choice Input Tool)**: Multi-select pattern
- **Story 2.4 (Open Text Input Tool)**: Free text for "Other" option
- **Story 1.1 (Runner Object Schema)**: Schema must include health fields

### Coach Language Adaptation

For comeback runners, the coach should:
- Avoid performance pressure language
- Focus on confidence milestones, not pace targets
- Acknowledge the emotional weight of returning from injury
- Offer "permission to stop" messaging in future sessions
- Use phrases like "rebuilding trust in your body"

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
