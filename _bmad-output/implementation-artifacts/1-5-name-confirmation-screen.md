# Story 1.5: Name Confirmation Screen

Status: done

---

## Story

As a **new user**,
I want **the coach to confirm my name from OAuth**,
So that **the experience feels personal from the first moment**.

---

## Acceptance Criteria

### AC1: Name Display After Consent
**Given** the user has completed consent flows
**When** they enter the onboarding flow
**Then** the screen shows "Hey! You're {name}, right?" with name from OAuth
**And** the name is styled prominently (larger font, primary color)
**And** two response options are visible: "That's me" and "Actually, it's..."

### AC2: Name Confirmation Flow
**Given** the user sees their name displayed
**When** they tap "That's me"
**Then** `identity.name_confirmed` is set to `true` in Runner Object via Convex mutation
**And** the progress bar appears showing ~5% complete
**And** haptic feedback (Arrival pulse pattern) is triggered
**And** they proceed to the next onboarding scene (wearable connection or profile building)

### AC3: Name Correction Flow
**Given** the user sees their name displayed
**When** they tap "Actually, it's..."
**Then** a text input appears with smooth animation to enter their preferred name
**And** the input is focused automatically
**And** the original name is cleared or shown as placeholder

### AC4: Name Update Submission
**Given** the user has entered a new name
**When** they submit (tap confirm or press enter)
**Then** `identity.name` is updated in Runner Object
**And** `identity.name_confirmed` is set to `true`
**And** the progress bar appears showing ~5% complete
**And** they proceed to the next onboarding scene

### AC5: Input Validation
**Given** the user is entering a new name
**When** they try to submit an empty or whitespace-only name
**Then** submission is prevented
**And** a gentle validation message is shown
**And** focus returns to the input

---

## Tasks / Subtasks

- [x] **Task 1: Create Name Confirmation Screen Component** (AC: #1, #2, #3, #4, #5)
  - [x] Create `apps/native/src/components/app/onboarding/NameConfirmationScreen.tsx`
  - [x] Implement prominent name display with design system tokens
  - [x] Implement "That's me" and "Actually, it's..." buttons
  - [x] Implement animated text input for correction flow
  - [x] Add input validation (non-empty, trimmed)
  - [x] Integrate haptic feedback (expo-haptics arrival pulse pattern)

- [x] **Task 2: Create Name Confirmation Hook** (AC: #2, #4)
  - [x] Create `apps/native/src/hooks/use-name-confirmation.ts`
  - [x] Implement Convex mutation call for confirmName
  - [x] Handle loading and error states
  - [x] Return confirmation/update functions

- [x] **Task 3: Add Backend Mutation** (AC: #2, #4)
  - [x] Ensure `updateRunner` mutation in `packages/backend/convex/table/runners.ts` supports partial updates to `identity` section
  - [x] Add `confirmName` convenience mutation

- [x] **Task 4: Integrate with Onboarding Flow** (AC: #1)
  - [x] Update `apps/native/src/components/app/onboarding/onboarding-flow.tsx` to include name confirmation scene
  - [x] Ensure scene appears immediately after consent screens
  - [x] Pass OAuth name from user context to component

- [x] **Task 5: Progress Bar Initial Display** (AC: #2, #4)
  - [x] confirmName mutation sets data_completeness to 5%
  - [x] Progress bar will display via Story 1.6 implementation

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Component Location:**
   - Place in `apps/native/src/components/app/onboarding/`
   - Follow existing naming: `PascalCase.tsx`

2. **Design System Usage:**
   - Use semantic tokens: `text-primary`, `bg-background`, `text-muted-foreground`
   - NEVER hardcode colors
   - Use existing NativeWind classes from the design system

3. **Haptic Patterns (from UX V6):**
   - Arrival pulse: Use when name is confirmed (positive feedback)
   - Pattern: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`

4. **State Management:**
   - Use Convex mutations directly via hooks
   - No local state duplication of server data
   - Loading states via mutation pending status

5. **Error Handling:**
   - Use `ConvexError` codes: `RUNNER_NOT_FOUND`, `UNAUTHORIZED`
   - Show user-friendly error messages
   - Allow retry on failure

### UI/UX Specifications

**From UX V6 Document:**

```
Scene: Name Confirmation (First scene after consent)

Layout:
- Centered vertically with slight top bias
- Large greeting text: "Hey!"
- Name displayed prominently below: "{name}, right?"
- Two button options below name

Typography:
- Greeting: Display size (text-3xl or larger)
- Name: Emphasized, primary color accent
- Buttons: Standard button sizing (44pt touch target minimum)

Animation:
- Text input slides in smoothly when "Actually, it's..." tapped
- Consider spring animation with react-native-reanimated
```

### Existing Components to Leverage

**From prototype inspection:**

| Component | Location | Usage |
|-----------|----------|-------|
| `onboarding-flow.tsx` | `components/app/onboarding/` | Scene controller - add new scene type |
| `streaming-text.tsx` | `components/app/onboarding/` | Could use for greeting reveal |
| `question-inputs.tsx` | `components/app/onboarding/` | Input field patterns |
| UI Button | `components/ui/button.tsx` | Standard button component |
| UI Input | `components/ui/input.tsx` | Text input component |

### Data Flow

```
User Auth (OAuth) → User record with name
                           ↓
              Name Confirmation Screen
                           ↓
              User taps "That's me" OR enters new name
                           ↓
              updateRunner mutation → runners table
                           ↓
              identity.name_confirmed = true
              conversation_state.data_completeness = 5
                           ↓
              Navigate to next scene
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/NameConfirmationScreen.tsx` | Main component |
| `apps/native/src/hooks/use-name-confirmation.ts` | Hook for name confirmation logic |

**Files to Modify:**
| File | Change |
|------|--------|
| `apps/native/src/components/app/onboarding/onboarding-flow.tsx` | Add name confirmation scene |
| `packages/backend/convex/table/runners.ts` | Ensure partial update support (likely already exists) |

### Dependencies

**Required (already installed):**
- `expo-haptics` - For haptic feedback
- `react-native-reanimated` - For smooth animations
- `@convex-dev/auth` - For user context with name

**From Story 1.1 (dependency):**
- Runners table schema must be deployed
- `updateRunner` mutation must exist

### Testing Considerations

1. **Manual Testing:**
   - Confirm OAuth name displays correctly
   - Confirm "That's me" updates Runner Object
   - Confirm name correction flow works
   - Confirm empty name validation
   - Confirm progress bar appears at 5%

2. **Edge Cases:**
   - OAuth returns no name (use email or prompt differently)
   - Name contains special characters
   - Very long names (truncation or wrapping)

### References

- [Source: architecture.md#Design System Patterns] - Token usage
- [Source: architecture.md#Component Boundaries] - No direct Convex calls in components
- [Source: ux-onboarding-flow-v6-2026-02-13.md#Act 1: The Meeting] - Name confirmation UX
- [Source: epics.md#Story 1.5] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#FR48] - Track data completeness

### Implementation Notes

1. **OAuth Name Source:** The user's name comes from the OAuth payload stored in the users table. Access via `useQuery` on users or passed as prop from auth context.

2. **Progress Bar Visibility:** The progress bar should be hidden until name is confirmed, then fade in showing ~5%. This creates a clear "onboarding has begun" moment.

3. **Graceful Degradation:** If no name is available from OAuth, show "Hey! What should I call you?" with direct input.

4. **Animation Library:** Use `react-native-reanimated` for smooth input reveal animation. Pattern from existing `onboarding-flow.tsx`.

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List
- [x] Name displays correctly from OAuth
- [x] Confirmation updates Runner Object via confirmName mutation
- [x] Correction flow works with validation
- [x] Progress set to 5% via confirmName mutation (progress bar UI in Story 1.6)
- [x] Haptic feedback implemented (arrivalPulse on confirmation)
- [x] Integrates with onboarding flow as first scene

### File List
- `apps/native/src/components/app/onboarding/NameConfirmationScreen.tsx` (created)
- `apps/native/src/hooks/use-name-confirmation.ts` (created)
- `apps/native/src/components/app/onboarding/onboarding-flow.tsx` (modified)
- `apps/native/src/app/(onboarding)/index.tsx` (modified)
- `packages/backend/convex/table/runners.ts` (modified - added confirmName mutation)

### Change Log
- 2026-02-14: Implemented name confirmation screen (Story 1.5)
