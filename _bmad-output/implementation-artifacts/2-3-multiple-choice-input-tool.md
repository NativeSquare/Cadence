# Story 2.3: Multiple Choice Input Tool

Status: done

---

## Story

As a **user**,
I want **to respond to coach questions by tapping options**,
So that **I can quickly answer structured questions**.

---

## Acceptance Criteria

### AC1: Options Display

**Given** the coach calls the renderMultipleChoice tool
**When** the component renders
**Then** all options are displayed as tappable cards/buttons
**And** optional description text is shown below each option
**And** the question text (if provided) is displayed above options

### AC2: Single Selection

**Given** allowMultiple is false
**When** the user taps an option
**Then** that option is selected and highlighted
**And** the selection is submitted to the conversation
**And** the Runner Object field (targetField) is updated

### AC3: Multi-Selection

**Given** allowMultiple is true
**When** the user taps multiple options
**Then** all selected options are highlighted
**And** a "Done" or confirm button appears to submit

### AC4: Free Text Fallback

**Given** allowFreeText is true
**When** the user wants a custom answer
**Then** an "Other" option is available
**And** tapping it reveals a text input for custom response

### AC5: Skip Option

**Given** allowSkip is true
**When** the user wants to skip
**Then** a skip option is displayed with custom skipLabel
**And** tapping it advances without filling the field

---

## Tasks / Subtasks

- [x] **Task 1: Create MultipleChoiceInput Component** (AC: #1, #2)
  - [x] Create `apps/native/src/components/app/onboarding/generative/MultipleChoiceInput.tsx`
  - [x] Render question text above options
  - [x] Render options as tappable cards
  - [x] Show description text below each option label
  - [x] Use design system tokens for styling

- [x] **Task 2: Implement Single Selection Mode** (AC: #2)
  - [x] Track selected option in local state
  - [x] Highlight selected option with primary color
  - [x] Auto-submit on selection (single mode)
  - [x] Call `onSubmit(selectedValue)` prop

- [x] **Task 3: Implement Multi-Selection Mode** (AC: #3)
  - [x] Track selected options array in local state
  - [x] Allow toggling multiple selections
  - [x] Show "Done" button when at least one selected
  - [x] Submit array of values on confirm

- [x] **Task 4: Implement Free Text Option** (AC: #4)
  - [x] Add "Other" option when allowFreeText is true
  - [x] Show text input when "Other" selected
  - [x] Handle keyboard and text submission
  - [x] Clear text input on successful submit

- [x] **Task 5: Implement Skip Option** (AC: #5)
  - [x] Add skip option at bottom when allowSkip is true
  - [x] Use skipLabel or default "Skip for now"
  - [x] Style differently from regular options (muted)
  - [x] Submit with `{ skipped: true }` value

- [x] **Task 6: Add Selection Animations** (AC: #2, #3)
  - [x] Animate selection highlight with spring
  - [x] Scale animation on press
  - [x] Haptic feedback on selection

- [x] **Task 7: Create Backend Tool Definition** (AC: #2)
  - [x] Add `renderMultipleChoice` tool in `packages/backend/convex/ai/tools/renderMultipleChoice.ts`
  - [x] Define Zod schema for parameters
  - [x] Export from tools index

- [x] **Task 8: Wire Up Runner Object Update** (AC: #2)
  - [x] Create or extend tool result handler
  - [x] Parse targetField to update Runner Object
  - [x] Call updateRunner mutation with selection

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Design System Usage:**
   ```typescript
   // Option card styling
   className="bg-card border border-border rounded-xl p-4"

   // Selected state
   className="bg-primary/10 border-primary"

   // Option label
   className="text-foreground text-base font-medium"

   // Option description
   className="text-muted-foreground text-sm mt-1"
   ```

2. **Component Structure:**
   ```typescript
   interface MultipleChoiceInputProps {
     toolCallId: string;
     question?: string;
     options: Array<{
       label: string;
       value: string;
       description?: string;
     }>;
     targetField: string;
     allowMultiple?: boolean;
     allowFreeText?: boolean;
     allowSkip?: boolean;
     skipLabel?: string;
     onSubmit: (value: string | string[] | { skipped: true }) => void;
   }
   ```

3. **Naming Conventions:**
   - Component: `MultipleChoiceInput.tsx` (PascalCase)
   - Tool: `renderMultipleChoice` (camelCase)

### Tool Schema (Backend)

```typescript
// packages/backend/convex/ai/tools/renderMultipleChoice.ts
import { tool } from "ai";
import { z } from "zod";

export const renderMultipleChoice = tool({
  description: "Display multiple choice options for the user to select from",
  parameters: z.object({
    question: z.string().optional().describe("Question text to display above options"),
    options: z.array(z.object({
      label: z.string().describe("Display text for the option"),
      value: z.string().describe("Value to submit when selected"),
      description: z.string().optional().describe("Helper text below the label"),
    })).describe("Array of options to display"),
    targetField: z.string().describe("Runner Object field path to update, e.g., 'running.experienceLevel'"),
    allowMultiple: z.boolean().default(false).describe("Allow selecting multiple options"),
    allowFreeText: z.boolean().default(false).describe("Show 'Other' option with text input"),
    allowSkip: z.boolean().default(false).describe("Show skip option"),
    skipLabel: z.string().optional().describe("Custom label for skip button"),
  }),
});
```

### Common Use Cases (from UX V6)

**Experience Level:**
```typescript
{
  question: "How would you describe your running experience?",
  options: [
    { label: "Just getting started", value: "beginner", description: "Less than 6 months of regular running" },
    { label: "Getting back into it", value: "returning", description: "Ran before, taking it up again" },
    { label: "Running regularly", value: "casual", description: "Consistent but not training for anything specific" },
    { label: "Training seriously", value: "serious", description: "Following a plan, racing, pushing limits" },
  ],
  targetField: "running.experienceLevel",
  allowMultiple: false,
}
```

**Past Injuries:**
```typescript
{
  question: "Any past injuries I should know about?",
  options: [
    { label: "Shin splints", value: "shin_splints" },
    { label: "IT band issues", value: "itbs" },
    { label: "Plantar fasciitis", value: "plantar" },
    { label: "Knee problems", value: "knee" },
    { label: "Achilles issues", value: "achilles" },
    { label: "No injuries", value: "none" },
  ],
  targetField: "health.pastInjuries",
  allowMultiple: true,
  allowFreeText: true,
}
```

### Existing Components to Reference

| Component | Location | Learnings |
|-----------|----------|-----------|
| `question-inputs.tsx` | `components/app/onboarding/` | Existing multiple choice patterns |
| `@rn-primitives/toggle` | Installed | May use for multi-select |
| `@rn-primitives/radio-group` | Installed | May use for single select |

### Animation Specifications

**Selection Animation:**
```typescript
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const handlePressIn = () => {
  scale.value = withSpring(0.97);
};

const handlePressOut = () => {
  scale.value = withSpring(1);
};
```

**Haptic Feedback:**
```typescript
import * as Haptics from 'expo-haptics';

const handleSelect = (value: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // ... selection logic
};
```

### Accessibility

1. **Touch Targets:**
   - Minimum 44pt height for option cards
   - Full-width tappable area

2. **Screen Reader:**
   - Option labels readable
   - Selection state announced
   - Question associated with options

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `generative/MultipleChoiceInput.tsx` | Main component |
| `convex/ai/tools/renderMultipleChoice.ts` | Backend tool definition |

**Files to Modify:**
| File | Change |
|------|--------|
| `generative/tool-renderer.tsx` | Add case for MultipleChoiceInput |
| `convex/ai/tools/index.ts` | Export renderMultipleChoice |

### Data Flow

```
LLM calls renderMultipleChoice tool
              ↓
Tool renderer receives tool-call part
              ↓
MultipleChoiceInput renders with options
              ↓
User taps an option
              ↓
onSubmit(value) called
              ↓
AI chat hook receives result
              ↓
Tool result sent back to LLM
              ↓
updateRunner mutation updates targetField
              ↓
Conversation continues
```

### Error Handling

1. **Empty Options Array:**
   - Don't render anything
   - Log warning in development

2. **Invalid targetField:**
   - Submit value to LLM anyway
   - Let backend handle validation

3. **Network Error on Submit:**
   - Show retry option
   - Keep selection state

### Testing Considerations

1. **Manual Testing:**
   - Verify single selection auto-submits
   - Verify multi-selection requires Done button
   - Test "Other" free text flow
   - Test skip functionality
   - Verify haptics and animations

2. **Edge Cases:**
   - Very long option labels
   - Many options (>6)
   - Empty descriptions
   - No question text

### References

- [Source: architecture.md#Generative UI Implementation] - Tool component mapping
- [Source: architecture.md#Tool Registry] - renderMultipleChoice tool
- [Source: ux-onboarding-flow-v6.md#Multiple Choice] - UX specifications
- [Source: prd-onboarding-mvp.md#FR14] - Multiple choice responses
- [Source: epics.md#Story 2.3] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Created MultipleChoiceInput component with full AC coverage
- Single select mode auto-submits on selection
- Multi-select mode shows "Done" button when selections made
- Free text "Other" option with inline text input
- Skip option styled as muted link at bottom
- Entrance fade animation with Animated API
- Haptic feedback via selectionFeedback() and questionPause()
- Disabled state prevents interaction after submission
- Tool already defined in backend tools/index.ts from Story 2.1
- Integrated into tool-renderer.tsx switch statement

### File List

**Created:**
- apps/native/src/components/app/onboarding/generative/MultipleChoiceInput.tsx

**Modified:**
- apps/native/src/components/app/onboarding/generative/tool-renderer.tsx
- apps/native/src/components/app/onboarding/generative/types.ts
- apps/native/src/components/app/onboarding/generative/index.ts
