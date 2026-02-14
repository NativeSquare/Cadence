# Story 2.6: Confirmation Card Tool

Status: ready-for-dev

---

## Story

As a **user**,
I want **to confirm or correct information the coach captured**,
So that **my profile accurately reflects my situation**.

---

## Acceptance Criteria

### AC1: Confirmation Display

**Given** the coach calls the renderConfirmation tool
**When** the component renders
**Then** the statement to confirm is displayed prominently
**And** confirm and deny buttons are shown with their labels

### AC2: Confirm Action

**Given** the user taps the confirm button
**When** the confirmation is submitted
**Then** the targetField is marked as confirmed
**And** the conversation continues

### AC3: Deny and Correct Action

**Given** the user taps the deny button
**When** they want to correct information
**Then** an appropriate edit interface appears (text input or options)
**And** they can provide the correct information
**And** the Runner Object is updated with the correction

---

## Tasks / Subtasks

- [ ] **Task 1: Create ConfirmationCard Component** (AC: #1)
  - [ ] Create `apps/native/src/components/app/onboarding/generative/ConfirmationCard.tsx`
  - [ ] Render statement/value to confirm
  - [ ] Render confirm and deny buttons side by side
  - [ ] Use design system tokens for styling

- [ ] **Task 2: Implement Confirm Action** (AC: #2)
  - [ ] Handle confirm button press
  - [ ] Call `onSubmit({ confirmed: true, value })` prop
  - [ ] Show brief confirmation feedback (checkmark animation)
  - [ ] Transition to disabled/confirmed state

- [ ] **Task 3: Implement Deny/Edit Flow** (AC: #3)
  - [ ] Handle deny button press
  - [ ] Expand to show edit interface
  - [ ] Use text input or options based on editType prop
  - [ ] Submit corrected value

- [ ] **Task 4: Create Edit Mode UI** (AC: #3)
  - [ ] Create inline text input for corrections
  - [ ] Optionally show original value for reference
  - [ ] Add "Submit Correction" button
  - [ ] Handle keyboard properly

- [ ] **Task 5: Add Confirmation Animations** (AC: #2)
  - [ ] Animate checkmark on confirm
  - [ ] Animate expand/collapse for edit mode
  - [ ] Use spring animations
  - [ ] Add haptic feedback

- [ ] **Task 6: Create Backend Tool Definition** (AC: #2)
  - [ ] Add `renderConfirmation` tool in `packages/backend/convex/ai/tools/renderConfirmation.ts`
  - [ ] Define Zod schema for parameters
  - [ ] Export from tools index

- [ ] **Task 7: Style Button States** (AC: #1, #2)
  - [ ] Confirm button: primary appearance
  - [ ] Deny button: secondary/outline appearance
  - [ ] Disabled state after action
  - [ ] Pressed state feedback

- [ ] **Task 8: Handle Runner Object Update** (AC: #2, #3)
  - [ ] Parse targetField to update Runner Object
  - [ ] Handle confirmation flag
  - [ ] Handle correction value

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Design System Usage:**
   ```typescript
   // Card container
   className="bg-card border border-border rounded-xl p-4"

   // Statement text
   className="text-foreground text-lg font-medium mb-4"

   // Confirm button
   className="flex-1 bg-primary rounded-xl py-3"

   // Deny button
   className="flex-1 bg-secondary rounded-xl py-3"

   // Button container
   className="flex-row gap-3"
   ```

2. **Component Structure:**
   ```typescript
   interface ConfirmationCardProps {
     toolCallId: string;
     statement: string;
     value?: unknown;
     targetField: string;
     confirmLabel?: string;   // Default: "That's right"
     denyLabel?: string;      // Default: "Actually..."
     editType?: 'text' | 'options';
     editOptions?: string[];  // If editType is 'options'
     onSubmit: (result: {
       confirmed: boolean;
       value?: unknown;
       correction?: unknown;
     }) => void;
   }
   ```

3. **Naming Conventions:**
   - Component: `ConfirmationCard.tsx` (PascalCase)
   - Tool: `renderConfirmation` (camelCase)

### Tool Schema (Backend)

```typescript
// packages/backend/convex/ai/tools/renderConfirmation.ts
import { tool } from "ai";
import { z } from "zod";

export const renderConfirmation = tool({
  description: "Display a confirmation card for the user to verify captured information",
  parameters: z.object({
    statement: z.string().describe("Statement to confirm, e.g., 'So you run about 4 times a week?'"),
    value: z.unknown().optional().describe("The value being confirmed"),
    targetField: z.string().describe("Runner Object field path to confirm or update"),
    confirmLabel: z.string().optional().describe("Label for confirm button"),
    denyLabel: z.string().optional().describe("Label for deny button"),
    editType: z.enum(['text', 'options']).optional().describe("Type of edit interface if denied"),
    editOptions: z.array(z.string()).optional().describe("Options for correction if editType is options"),
  }),
});
```

### Common Use Cases (from UX V6)

**Name Confirmation (Story 1.5 Pattern):**
```typescript
{
  statement: "Hey! You're Alex, right?",
  value: "Alex",
  targetField: "identity.name",
  confirmLabel: "That's me",
  denyLabel: "Actually, it's...",
  editType: "text",
}
```

**Frequency Confirmation:**
```typescript
{
  statement: "So you typically run 4-5 times a week?",
  value: 4,
  targetField: "running.currentFrequency",
  confirmLabel: "Yes, that's about right",
  denyLabel: "Not quite",
  editType: "options",
  editOptions: ["2-3 times", "4-5 times", "6-7 times"],
}
```

**Goal Confirmation:**
```typescript
{
  statement: "You're targeting a sub-4 hour marathon in October?",
  value: { distance: 42.195, time: 14400, date: "2026-10-15" },
  targetField: "goals",
  confirmLabel: "Exactly",
  denyLabel: "Let me adjust that",
  editType: "text",
}
```

### UI Layout (Confirmation State)

```
┌────────────────────────────────────────┐
│                                        │
│   So you run about 4 times a week?     │
│                                        │
│ ┌─────────────────┐ ┌─────────────────┐│
│ │   That's right  │ │   Actually...   ││
│ └─────────────────┘ └─────────────────┘│
└────────────────────────────────────────┘
```

### UI Layout (Edit State)

```
┌────────────────────────────────────────┐
│                                        │
│   How many times do you run per week?  │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 3 times                            │ │
│ └────────────────────────────────────┘ │
│                                        │
│          [Submit Correction]           │
└────────────────────────────────────────┘
```

### Animation Specifications

**Confirm Animation:**
```typescript
const scale = useSharedValue(1);

const handleConfirm = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  scale.value = withSequence(
    withSpring(0.95),
    withSpring(1)
  );
  // Show checkmark overlay briefly
};
```

**Expand Edit Animation:**
```typescript
const editHeight = useSharedValue(0);

const handleDeny = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  editHeight.value = withSpring(150); // Expand to show edit UI
};
```

### Button Styling

**Side-by-Side Layout:**
```typescript
<View className="flex-row gap-3">
  <Pressable
    onPress={handleConfirm}
    className="flex-1 bg-primary rounded-xl py-3 items-center"
  >
    <Text className="text-primary-foreground font-medium">
      {confirmLabel}
    </Text>
  </Pressable>

  <Pressable
    onPress={handleDeny}
    className="flex-1 bg-secondary rounded-xl py-3 items-center"
  >
    <Text className="text-secondary-foreground font-medium">
      {denyLabel}
    </Text>
  </Pressable>
</View>
```

### State Machine

```
ConfirmationCard States:
1. pending → Initial state, both buttons active
2. confirmed → User confirmed, show success state
3. editing → User denied, show edit interface
4. corrected → User submitted correction
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `generative/ConfirmationCard.tsx` | Main component |
| `convex/ai/tools/renderConfirmation.ts` | Backend tool definition |

**Files to Modify:**
| File | Change |
|------|--------|
| `generative/tool-renderer.tsx` | Add case for ConfirmationCard |
| `convex/ai/tools/index.ts` | Export renderConfirmation |

### Data Flow

```
LLM calls renderConfirmation tool
              ↓
Tool renderer receives tool-call part
              ↓
ConfirmationCard renders with statement
              ↓
User taps Confirm or Deny
              ↓
┌───────────────────────────────────────────┐
│ Confirm? → onSubmit({ confirmed: true })  │
│ Deny?    → Show edit interface            │
└───────────────────────────────────────────┘
              ↓
If denied and corrected:
onSubmit({ confirmed: false, correction: newValue })
              ↓
AI chat hook receives result
              ↓
Tool result sent back to LLM
              ↓
updateRunner mutation updates targetField
              ↓
Conversation continues
```

### Accessibility

1. **Button Roles:**
   - `accessibilityRole="button"`
   - Clear labels for screen readers

2. **State Announcements:**
   - Announce confirmation success
   - Announce when edit mode opens

3. **Focus Management:**
   - Focus text input when edit mode opens

### Error Handling

1. **Submit Failure:**
   - Show error toast
   - Keep state for retry
   - Don't clear correction

2. **Invalid Correction:**
   - Basic client-side validation
   - Let LLM handle semantic validation

### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

const handleConfirm = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  // Submit confirmation
};

const handleDeny = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Open edit mode
};

const handleCorrection = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // Submit correction
};
```

### Testing Considerations

1. **Manual Testing:**
   - Test confirm flow
   - Test deny → edit → submit flow
   - Test animations
   - Test keyboard handling in edit mode
   - Verify haptics

2. **Edge Cases:**
   - Very long statement text
   - Empty value
   - Edit with no change
   - Multiple confirmations in sequence

### Integration Notes

**Related to Story 1.5 (Name Confirmation):**
- Story 1.5 implemented a custom name confirmation screen
- This tool provides a reusable confirmation pattern
- The coach can use this for any "Is this right?" moment

**Use Throughout Onboarding:**
- After inferring information from free text
- After calculating derived values
- Before transitioning to new phases

### References

- [Source: architecture.md#Generative UI Implementation] - Tool component mapping
- [Source: architecture.md#Tool Registry] - renderConfirmation tool
- [Source: ux-onboarding-flow-v6.md#Confirmation] - UX specifications
- [Source: prd-onboarding-mvp.md#FR17] - Confirm/edit captured info
- [Source: epics.md#Story 2.6] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List
