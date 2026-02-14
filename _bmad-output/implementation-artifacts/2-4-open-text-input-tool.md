# Story 2.4: Open Text Input Tool

Status: ready-for-dev

---

## Story

As a **user**,
I want **to type free-form responses to the coach**,
So that **I can share details that don't fit predefined options**.

---

## Acceptance Criteria

### AC1: Text Input Display

**Given** the coach calls the renderOpenInput tool
**When** the component renders
**Then** a text input field is displayed with the placeholder text
**And** the prompt (if provided) is shown above

### AC2: Suggested Responses

**Given** suggestedResponses are provided
**When** the component renders
**Then** quick-tap chips are shown (e.g., "No, that's all")
**And** tapping a chip submits that response

### AC3: Text Submission

**Given** the user types a response
**When** they submit (tap send or press enter)
**Then** the response is sent to the conversation
**And** the LLM parses it to update relevant Runner Object fields

### AC4: Voice Input Button

**Given** the input supports voice
**When** allowVoice is true
**Then** a microphone button is displayed
**And** the user can tap to record voice input

---

## Tasks / Subtasks

- [ ] **Task 1: Create OpenInput Component** (AC: #1)
  - [ ] Create `apps/native/src/components/app/onboarding/generative/OpenInput.tsx`
  - [ ] Render prompt text above input
  - [ ] Create text input with placeholder
  - [ ] Add send button (arrow icon)
  - [ ] Use design system tokens for styling

- [ ] **Task 2: Implement Suggested Response Chips** (AC: #2)
  - [ ] Render horizontal scroll of chip buttons
  - [ ] Style chips with secondary appearance
  - [ ] Handle chip tap to auto-submit response
  - [ ] Dismiss keyboard when chip selected

- [ ] **Task 3: Implement Text Submission** (AC: #3)
  - [ ] Handle send button press
  - [ ] Handle keyboard submit (returnKeyType="send")
  - [ ] Clear input after successful submit
  - [ ] Call `onSubmit(text)` prop

- [ ] **Task 4: Implement Multiline Support** (AC: #1)
  - [ ] Support multiline prop for longer responses
  - [ ] Auto-expand text area up to max height
  - [ ] Handle scroll within text area

- [ ] **Task 5: Add Voice Input Button** (AC: #4)
  - [ ] Show microphone icon when allowVoice is true
  - [ ] Wire up to voice input flow (Story 2.5 integration)
  - [ ] Swap icon when recording active
  - [ ] Handle transcribed text insertion

- [ ] **Task 6: Create Backend Tool Definition** (AC: #3)
  - [ ] Add `renderOpenInput` tool in `packages/backend/convex/ai/tools/renderOpenInput.ts`
  - [ ] Define Zod schema for parameters
  - [ ] Export from tools index

- [ ] **Task 7: Add Input Animations** (AC: #1)
  - [ ] Animate input focus state
  - [ ] Animate send button enabled state
  - [ ] Haptic feedback on submit

- [ ] **Task 8: Handle Keyboard Properly** (AC: #1, #3)
  - [ ] Use KeyboardAvoidingView or similar
  - [ ] Ensure input visible above keyboard
  - [ ] Dismiss keyboard on background tap (optional)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Design System Usage:**
   ```typescript
   // Input container
   className="bg-card border border-border rounded-xl p-3"

   // Input field
   className="text-foreground text-base flex-1"

   // Placeholder
   placeholderTextColor="#a1a1aa" // Use token

   // Send button
   className="bg-primary rounded-full p-2"

   // Suggested chip
   className="bg-secondary px-4 py-2 rounded-full"
   ```

2. **Component Structure:**
   ```typescript
   interface OpenInputProps {
     toolCallId: string;
     prompt?: string;
     placeholder?: string;
     suggestedResponses?: string[];
     allowVoice?: boolean;
     multiline?: boolean;
     maxLength?: number;
     onSubmit: (value: string) => void;
   }
   ```

3. **Naming Conventions:**
   - Component: `OpenInput.tsx` (PascalCase)
   - Tool: `renderOpenInput` (camelCase)

### Tool Schema (Backend)

```typescript
// packages/backend/convex/ai/tools/renderOpenInput.ts
import { tool } from "ai";
import { z } from "zod";

export const renderOpenInput = tool({
  description: "Display a text input field for free-form user response",
  parameters: z.object({
    prompt: z.string().optional().describe("Prompt text to display above input"),
    placeholder: z.string().optional().describe("Placeholder text in the input"),
    suggestedResponses: z.array(z.string()).optional().describe("Quick-tap response chips"),
    allowVoice: z.boolean().default(false).describe("Show microphone button for voice input"),
    multiline: z.boolean().default(false).describe("Allow multiple lines of input"),
    maxLength: z.number().optional().describe("Maximum character limit"),
  }),
});
```

### Common Use Cases (from UX V6)

**Final Check:**
```typescript
{
  prompt: "Anything else you want me to know?",
  placeholder: "Type here or tap a suggestion...",
  suggestedResponses: [
    "No, I think that covers it",
    "Actually, there's one more thing...",
  ],
  allowVoice: true,
}
```

**Injury Description:**
```typescript
{
  prompt: "Tell me more about what happened",
  placeholder: "Describe your injury...",
  multiline: true,
  allowVoice: true,
}
```

**Coaching Challenge:**
```typescript
{
  prompt: "What's your biggest challenge with running?",
  suggestedResponses: [
    "Staying consistent",
    "Finding time",
    "Motivation",
    "Avoiding injury",
    "Getting faster",
  ],
  allowVoice: true,
}
```

### Existing Components to Reference

| Component | Location | Learnings |
|-----------|----------|-----------|
| `conversation-input.tsx` | `components/app/onboarding/` | Existing input patterns |
| `@rn-primitives/input` | Installed | Base input component |
| `lucide-react-native` | Installed | Send, Mic icons |

### Layout Structure

```
┌────────────────────────────────────────┐
│ Prompt text (optional)                 │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Placeholder text...       [Mic][→] │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ [Chip 1] [Chip 2] [Chip 3]            │
└────────────────────────────────────────┘
```

### Input Styling

**Focused State:**
```typescript
const [isFocused, setIsFocused] = useState(false);

<View className={cn(
  "bg-card border rounded-xl p-3 flex-row items-center",
  isFocused ? "border-primary" : "border-border"
)}>
```

**Send Button Enabled:**
```typescript
const canSubmit = text.trim().length > 0;

<Pressable
  disabled={!canSubmit}
  className={cn(
    "rounded-full p-2",
    canSubmit ? "bg-primary" : "bg-muted"
  )}
>
```

### Voice Integration (Story 2.5)

**When allowVoice is true:**
1. Show microphone button next to send
2. Tapping starts voice recording (Story 2.5)
3. Transcribed text is inserted into input
4. User can edit before submitting

**Placeholder for now:**
```typescript
const handleVoicePress = () => {
  // Will be implemented in Story 2.5
  console.log("Voice input not yet implemented");
};
```

### Keyboard Handling

**Best Practices:**
```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={100} // Adjust as needed
>
  {/* Input content */}
</KeyboardAvoidingView>
```

**Submit on Enter:**
```typescript
<TextInput
  returnKeyType="send"
  onSubmitEditing={handleSubmit}
  blurOnSubmit={!multiline}
/>
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `generative/OpenInput.tsx` | Main component |
| `convex/ai/tools/renderOpenInput.ts` | Backend tool definition |

**Files to Modify:**
| File | Change |
|------|--------|
| `generative/tool-renderer.tsx` | Add case for OpenInput |
| `convex/ai/tools/index.ts` | Export renderOpenInput |

### Data Flow

```
LLM calls renderOpenInput tool
              ↓
Tool renderer receives tool-call part
              ↓
OpenInput renders with prompt + suggestions
              ↓
User types or taps suggestion
              ↓
onSubmit(text) called
              ↓
AI chat hook receives result
              ↓
Tool result sent back to LLM
              ↓
LLM parses text → may call more tools or update Runner Object
              ↓
Conversation continues
```

### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

const handleSubmit = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onSubmit(text);
  setText('');
};

const handleChipPress = (response: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  onSubmit(response);
};
```

### Accessibility

1. **Input Label:**
   - Use `accessibilityLabel` prop
   - Associate prompt with input

2. **Submit Button:**
   - `accessibilityLabel="Send message"`
   - `accessibilityRole="button"`

3. **Chips:**
   - `accessibilityRole="button"`
   - Clear labels

### Error Handling

1. **Empty Submit:**
   - Disable send button when empty
   - Don't call onSubmit

2. **Max Length:**
   - Enforce maxLength prop
   - Show character count if >100 chars

### Testing Considerations

1. **Manual Testing:**
   - Verify text input works
   - Test suggested response chips
   - Test keyboard behavior (show/hide)
   - Verify submit clears input
   - Test multiline expansion

2. **Edge Cases:**
   - Very long text input
   - Special characters and emoji
   - RTL languages
   - No suggested responses

### References

- [Source: architecture.md#Generative UI Implementation] - Tool component mapping
- [Source: architecture.md#Tool Registry] - renderOpenInput tool
- [Source: ux-onboarding-flow-v6.md#Open Input] - UX specifications
- [Source: prd-onboarding-mvp.md#FR15] - Free text input
- [Source: epics.md#Story 2.4] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List
