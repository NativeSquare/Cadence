# Story 2.2: Generative UI Tool Renderer

Status: done

---

## Story

As a **user**,
I want **to see dynamic UI components rendered based on the coach's responses**,
So that **I can interact naturally through the conversation**.

---

## Acceptance Criteria

### AC1: Tool Part Rendering

**Given** a message contains tool call parts
**When** the message is rendered
**Then** each tool part is mapped to its corresponding UI component via switch statement
**And** components render inline with the conversation flow

### AC2: Streaming State Handling

**Given** a tool is in "streaming" state
**When** it is being processed
**Then** an appropriate loading indicator is shown

### AC3: Interactive State Transition

**Given** a tool call completes
**When** the result is available
**Then** the component updates to show the interactive state
**And** the user can interact with it (select options, type, etc.)

### AC4: Text + Tool Sequencing

**Given** the coach sends text before a tool call
**When** the message renders
**Then** the text streams with haptic feedback (phrase by phrase)
**And** the tool UI appears after the text completes

---

## Tasks / Subtasks

- [x] **Task 1: Create Tool Renderer Component** (AC: #1)
  - [x] Create `apps/native/src/components/app/onboarding/generative/tool-renderer.tsx`
  - [x] Implement switch statement for tool types
  - [x] Map `part.type` to component: `tool-renderMultipleChoice`, `tool-renderOpenInput`, etc.
  - [x] Handle unknown tool types gracefully (log warning, render nothing)

- [x] **Task 2: Create Tool State Manager** (AC: #2, #3)
  - [x] Create tool state context for tracking streaming/complete states
  - [x] Implement `useToolState(toolCallId)` hook
  - [x] Track states: `streaming`, `executing`, `complete`, `error`

- [x] **Task 3: Create Loading Placeholder Component** (AC: #2)
  - [x] Create `apps/native/src/components/app/onboarding/generative/ToolLoading.tsx`
  - [x] Show shimmer/skeleton based on expected tool type
  - [x] Use design system tokens for styling
  - [x] Animate entrance smoothly

- [x] **Task 4: Implement Message Parts Renderer** (AC: #1, #4)
  - [x] Create `apps/native/src/components/app/onboarding/generative/MessageParts.tsx`
  - [x] Iterate over `message.parts` array
  - [x] Render text parts via existing `streaming-text.tsx`
  - [x] Render tool parts via `tool-renderer.tsx`

- [x] **Task 5: Create Generative UI Index** (AC: #1)
  - [x] Create `apps/native/src/components/app/onboarding/generative/index.ts`
  - [x] Export all generative UI components
  - [x] Export types for tool props

- [x] **Task 6: Integrate Haptic Feedback** (AC: #4)
  - [x] Use existing haptic patterns from `streaming-text.tsx`
  - [x] Add "Question pause" haptic when tool appears
  - [x] Reference UX V6 haptic specifications

- [x] **Task 7: Create Tool Props Types** (AC: #1, #3)
  - [x] Create `apps/native/src/components/app/onboarding/generative/types.ts`
  - [x] Define `ToolPartProps<T>` generic interface
  - [x] Define props for each tool type
  - [x] Export shared types for tool components

- [x] **Task 8: Integrate with Conversation Flow** (AC: #1, #4)
  - [x] Create `AIConversationView.tsx` component for AI chat integration
  - [x] Connect to AI chat hook from Story 2.1
  - [x] Render message stream with parts

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **AI SDK Switch Statement Pattern:**
   ```typescript
   {message.parts.map((part, index) => {
     switch (part.type) {
       case 'text':
         return <StreamingText key={index} text={part.text} />;
       case 'tool-renderMultipleChoice':
         return <MultipleChoiceInput key={index} {...part.output} />;
       case 'tool-renderOpenInput':
         return <OpenInput key={index} {...part.output} />;
       case 'tool-renderConfirmation':
         return <ConfirmationCard key={index} {...part.output} />;
       case 'tool-renderThinkingStream':
         return <ThinkingBlock key={index} {...part.output} />;
       default:
         console.warn(`Unknown tool type: ${part.type}`);
         return null;
     }
   })}
   ```

2. **Part State Handling:**
   ```typescript
   interface ToolPart {
     type: `tool-${string}`;
     toolName: string;
     toolCallId: string;
     state: 'streaming' | 'call' | 'result';
     args?: unknown;    // Available when state is 'call'
     output?: unknown;  // Available when state is 'result'
   }
   ```

3. **Design System Requirements:**
   - All components use NativeWind semantic tokens
   - Interactive states: default, hover/pressed, disabled
   - Entrance animations via react-native-reanimated

### Tool Type to Component Mapping

| Tool Name | Part Type | Component |
|-----------|-----------|-----------|
| `renderMultipleChoice` | `tool-renderMultipleChoice` | `MultipleChoiceInput.tsx` |
| `renderOpenInput` | `tool-renderOpenInput` | `OpenInput.tsx` |
| `renderConfirmation` | `tool-renderConfirmation` | `ConfirmationCard.tsx` |
| `renderThinkingStream` | `tool-renderThinkingStream` | `ThinkingBlock.tsx` (existing) |
| `renderConnectionCard` | `tool-renderConnectionCard` | `connection-card.tsx` (existing) |

### Component File Structure

```
apps/native/src/components/app/onboarding/generative/
├── index.ts                    # Exports all components
├── types.ts                    # Shared type definitions
├── tool-renderer.tsx           # Main switch statement router
├── MessageParts.tsx            # Renders array of parts
├── ToolLoading.tsx             # Loading/skeleton state
├── MultipleChoiceInput.tsx     # Story 2.3
├── OpenInput.tsx               # Story 2.4
├── ConfirmationCard.tsx        # Story 2.6
└── VoiceInput.tsx              # Story 2.5 (optional)
```

### Props Interface Pattern

**Standard Tool Props:**
```typescript
interface BaseToolProps {
  toolCallId: string;
  state: 'streaming' | 'call' | 'result';
  onSubmit: (value: unknown) => void;
}

interface MultipleChoiceProps extends BaseToolProps {
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
}
```

### Existing Components to Leverage

| Component | Location | Usage |
|-----------|----------|-------|
| `streaming-text.tsx` | `components/app/onboarding/` | Render text parts |
| `thinking-block.tsx` | `components/app/onboarding/` | Already handles ThinkingStream |
| `connection-card.tsx` | `components/app/onboarding/` | Already handles ConnectionCard |
| `question-inputs.tsx` | `components/app/onboarding/` | Reference for input patterns |
| `coach-text.tsx` | `components/app/onboarding/` | Styling for coach messages |

### Haptic Feedback Integration

**From UX V6:**
- **Arrival pulse:** When coach message begins
- **Insight tap:** When important information appears
- **Question pause:** When tool appears (brief pulse before interaction)

**Implementation:**
```typescript
import * as Haptics from 'expo-haptics';

// When tool appears
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### State Transitions

```
Tool Part Lifecycle:
1. streaming → Show ToolLoading skeleton
2. call → Tool args available, show interactive component
3. result → Tool submitted, show confirmation state (optional)
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `generative/tool-renderer.tsx` | Main switch router |
| `generative/MessageParts.tsx` | Parts array renderer |
| `generative/ToolLoading.tsx` | Loading skeleton |
| `generative/types.ts` | Type definitions |
| `generative/index.ts` | Exports |

**Files to Modify:**
| File | Change |
|------|--------|
| `onboarding-flow.tsx` | Integrate MessageParts renderer |

### Error Handling

1. **Unknown Tool Type:**
   - Log warning in development
   - Return null (don't break render)
   - Consider Sentry/error tracking in production

2. **Tool Render Error:**
   - Wrap each tool in ErrorBoundary
   - Show "Something went wrong" with retry option
   - Don't crash entire conversation

### Performance Considerations

1. **Memoization:**
   - Memoize tool components to prevent re-renders
   - Use `React.memo` with proper deps
   - Key by `toolCallId`

2. **Animation Performance:**
   - Use `useSharedValue` for animations
   - Run animations on UI thread
   - Avoid layout thrashing

### Testing Considerations

1. **Manual Testing:**
   - Verify each tool type renders correctly
   - Test streaming → complete state transition
   - Test text + tool sequencing
   - Verify haptics fire at right moments

2. **Edge Cases:**
   - Multiple tools in one message
   - Empty tool args
   - Very long option lists

### Dependencies

**Story 2.1:** AI SDK Integration (provides message stream with parts)
**Stories 2.3-2.6:** Individual tool components (this story creates the framework)

### References

- [Source: architecture.md#Generative UI Implementation] - Switch statement pattern
- [Source: architecture.md#Tool Registry] - Tool name to component mapping
- [Source: ux-onboarding-flow-v6.md#Haptic Feedback] - Haptic patterns
- [Source: prd-onboarding-mvp.md#FR13] - Natural conversation flow
- [Source: epics.md#Story 2.2] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Created complete generative UI framework for AI SDK tool rendering
- Implemented switch-based ToolRenderer with support for all tool types
- Created ToolStateProvider context for tracking tool lifecycle states
- ToolLoading component provides shimmer skeletons per tool type
- MessageParts handles text + tool sequencing with streaming support
- Haptic feedback via questionPause() when tools appear
- AIConversationView bridges useAIChat with MessageParts rendering
- Placeholder components for Stories 2.3-2.6 (MultipleChoice, OpenInput, Confirmation)
- ThinkingBlock and ConnectionCard wrapped for tool rendering compatibility
- All components pass TypeScript type checking
- Memoization applied to prevent unnecessary re-renders

### File List

**Created:**
- apps/native/src/components/app/onboarding/generative/types.ts
- apps/native/src/components/app/onboarding/generative/tool-state-context.tsx
- apps/native/src/components/app/onboarding/generative/ToolLoading.tsx
- apps/native/src/components/app/onboarding/generative/tool-renderer.tsx
- apps/native/src/components/app/onboarding/generative/MessageParts.tsx
- apps/native/src/components/app/onboarding/generative/AIConversationView.tsx
- apps/native/src/components/app/onboarding/generative/index.ts
