# Story 2.10: Schedule & Availability Phase

Status: ready-for-dev

## Story

As a user building my runner profile,
I want to tell the coach my available training days,
So that the plan fits my life and schedule constraints.

## Acceptance Criteria

1. **Given** the user enters the schedule phase **When** the coach asks about availability **Then** options for training days are presented (2-3, 4-5, 6-7 days) via `renderMultipleChoice` tool (FR33)

2. **Given** the user specifies available days **When** they confirm **Then** a DaySelector tool may ask about blocked days (days completely off-limits) **And** the user can select specific days or "No blocked days"

3. **Given** the user has specified schedule **When** the phase completes **Then** `schedule.available_days` and `schedule.blocked_days` are populated in Runner Object **And** the progress bar advances

## Tasks / Subtasks

- [ ] Task 1: Implement schedule availability question flow (AC: #1)
  - [ ] Add schedule phase trigger after goals phase completes
  - [ ] Configure `renderMultipleChoice` tool call with availability options
  - [ ] Map selection to `schedule.available_days_per_week` field

- [ ] Task 2: Implement blocked days selector (AC: #2)
  - [ ] Add `renderDaySelector` tool if not already implemented
  - [ ] Handle multi-select for blocked days
  - [ ] Include "No blocked days" escape option
  - [ ] Map to `schedule.blocked_days` array field

- [ ] Task 3: Update Runner Object and progress tracking (AC: #3)
  - [ ] Verify `schedule` section exists in runners schema
  - [ ] Implement mutations for schedule field updates
  - [ ] Recalculate `data_completeness` percentage on update
  - [ ] Trigger progress bar UI update

## Dev Notes

### Architecture Compliance

- **LLM Integration**: Convex HTTP Action at `/api/ai/stream` handles all coach conversation
- **Generative UI**: Use existing tool-renderer pattern with switch on `part.type`
- **State Management**: Runner Object updates via Convex mutations, subscribe via `useQuery`
- **Tool Calling**: AI SDK `tool()` helper in `packages/backend/convex/ai/tools/`

### Technical Requirements

**Runner Object Schema (schedule section):**
```typescript
schedule: {
  available_days_per_week: number; // 2-7
  blocked_days: string[]; // ["Monday", "Wednesday"] or []
  preferred_long_run_day?: string;
  time_constraints?: string;
}
```

**Tool Definitions Required:**
1. `renderMultipleChoice` - Already defined in earlier stories, reuse for day count
2. `renderDaySelector` - May need implementation (multi-select day picker)

### File Structure Requirements

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/renderDaySelector.ts` | Day selector tool definition (if new) |
| `apps/native/src/components/app/onboarding/generative/DaySelector.tsx` | UI component for day selection |

### Existing Components to Extend

- `apps/native/src/components/app/onboarding/generative/tool-renderer.tsx` - Add DaySelector case
- `packages/backend/convex/table/runners.ts` - Ensure schedule field mutations exist

### Testing Requirements

- Unit test: DaySelector component renders all 7 days
- Unit test: Multi-select toggles work correctly
- Integration test: Tool call flows through to Runner Object update
- E2E test: Complete schedule phase advances progress bar

### Project Structure Notes

- Follows existing generative UI pattern established in stories 2.1-2.4
- DaySelector is similar pattern to MultipleChoiceInput but specialized for days
- Schedule fields are part of the `runners` table schema defined in story 1.1

### References

- [Source: architecture.md#Tool Registry] - renderMultipleChoice, renderDaySelector
- [Source: architecture.md#Runner Object Schema] - schedule section
- [Source: epics.md#Story 2.10] - Original story definition with FR33

### Dependencies

- **Story 2.9 (Goals Phase)**: Must complete before schedule phase begins
- **Story 2.1 (AI SDK Integration)**: Streaming infrastructure
- **Story 2.2 (Generative UI Tool Renderer)**: Tool rendering pattern
- **Story 1.1 (Runner Object Schema)**: Schema must include schedule fields

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
