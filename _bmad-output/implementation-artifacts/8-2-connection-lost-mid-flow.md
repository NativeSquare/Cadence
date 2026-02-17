# Story 8.2: Connection Lost Mid-Flow

Status: review

## Story

As a user,
I want the app to handle connection drops gracefully,
so that I don't lose my progress.

## Acceptance Criteria

1. **Given** the user is mid-onboarding
   **When** network connection is lost
   **Then** a reconnecting state is shown (FR57)
   **And** the UI pauses rather than errors

2. **Given** connection is restored
   **When** the app detects connectivity
   **Then** the flow resumes from the last stable point (FR58)
   **And** no data is lost
   **And** the user sees confirmation of reconnection

3. **Given** a slow or flaky connection exists
   **When** streaming is affected
   **Then** the SSE stream can pause/resume gracefully
   **And** partial responses are handled

4. **Given** the connection is lost for an extended period (>30s)
   **When** the user is waiting
   **Then** they see progressive messaging ("Still trying...", "Connection taking longer...")
   **And** a manual retry option becomes available

5. **Given** the user's progress has been saved
   **When** connection is restored
   **Then** the conversation continues exactly where it left off
   **And** no duplicate messages or tool calls occur

## Tasks / Subtasks

- [x] Task 1: Create Reconnecting Overlay Component (AC: #1, #2)
  - [x] 1.1 Create `apps/native/src/components/common/ReconnectingOverlay.tsx`
  - [x] 1.2 Semi-transparent overlay with centered content
  - [x] 1.3 Animated loading indicator (pulsing wifi icon or spinner)
  - [x] 1.4 "Reconnecting..." text message
  - [x] 1.5 Auto-dismiss with fade when connection restored
  - [x] 1.6 Show "Back online" confirmation briefly (2s)

- [x] Task 2: Implement Progressive Timeout Messages (AC: #4)
  - [x] 2.1 Track disconnection duration in state
  - [x] 2.2 Show "Reconnecting..." for first 10 seconds
  - [x] 2.3 Show "Still trying to reconnect..." after 10s
  - [x] 2.4 Show "This is taking longer than expected" after 20s
  - [x] 2.5 Show "Try Again" button after 30s
  - [x] 2.6 Optionally show "Continue Offline" if applicable

- [x] Task 3: Enhance AI Stream Pause/Resume (AC: #3, #5)
  - [x] 3.1 Update `apps/native/src/lib/ai-stream.ts` with network-aware streaming
  - [x] 3.2 On network loss: abort current stream cleanly (not error)
  - [x] 3.3 Store last stable conversation state before abort
  - [x] 3.4 On network restore: detect if stream was interrupted
  - [x] 3.5 Resume from last user message (not resend entire history)
  - [x] 3.6 Prevent duplicate submissions during reconnection

- [x] Task 4: Integrate Network Status with AI Chat Hook (AC: #1, #3, #5)
  - [x] 4.1 Update `apps/native/src/hooks/use-ai-chat.ts` to subscribe to network context
  - [x] 4.2 Add `isReconnecting` state to hook return
  - [x] 4.3 Pause sending when offline (queue or block)
  - [x] 4.4 Auto-resume pending send when back online
  - [x] 4.5 Clear any error state on successful reconnection

- [x] Task 5: Handle Partial Stream Recovery (AC: #3)
  - [x] 5.1 Track last received chunk/token in stream
  - [x] 5.2 On reconnect, check if partial response exists
  - [ ] 5.3 If partial: mark as incomplete, request continuation *(partial - marks isInterrupted but no LLM continuation request)*
  - [x] 5.4 If complete: no action needed
  - [x] 5.5 Never show truncated AI message without indicator

- [x] Task 6: Integrate Overlay in Conversation View (AC: #1, #2)
  - [x] 6.1 Update `AIConversationView.tsx` to show ReconnectingOverlay
  - [x] 6.2 Overlay appears when `isReconnecting` is true
  - [x] 6.3 Conversation UI remains visible but non-interactive behind overlay
  - [x] 6.4 Input field disabled during reconnection
  - [x] 6.5 Haptic feedback when connection lost and restored

- [ ] Task 7: Local Progress Persistence (AC: #5) *(partial - see limitation below)*
  - [ ] 7.1 Verify conversation state is saved to Convex before network loss *(not implemented - React state only)*
  - [x] 7.2 Ensure Runner Object updates are queued if offline *(Convex handles)*
  - [x] 7.3 On reconnect: sync any pending mutations *(Convex handles)*
  - [x] 7.4 Handle Convex offline behavior (already has optimistic updates)

## Dev Notes

### Relationship to Story 8.1

**Dependency:** This story REQUIRES the `useNetworkStatus` hook and `NetworkProvider` from Story 8.1. The foundation (network monitoring) must be in place.

**Difference from 8.1:**
- Story 8.1: Handles app start with no network (blocking)
- Story 8.2: Handles network loss during active use (non-blocking, recoverable)

### Current Codebase Analysis

**AI Stream Reconnection (ai-stream.ts:373-396):**
Existing reconnection logic provides foundation:
```typescript
async function streamWithReconnect<T>(...) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await stream(...);
    } catch (error) {
      lastError = error as Error;
      if (!shouldReconnect(error)) throw error;
      await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  throw lastError;
}
```

**What's Missing:**
- No detection of "reconnecting" state to expose to UI
- No clean abort on network loss (relies on timeout)
- No tracking of partial responses

**useAIChat Hook (use-ai-chat.ts):**
Current error handling:
- `error` state exposed
- `retry()` function removes failed message and resends
- `lastUserMessageRef` stores input for retry

**What's Missing:**
- No `isReconnecting` state
- No auto-resume on network restore
- No pending send queue

**Convex Offline Behavior:**
Convex handles offline gracefully:
- Mutations queue locally when offline
- Sync automatically when back online
- Real-time subscriptions reconnect automatically

### Architecture Compliance

**Component Location:**
- Overlay: `apps/native/src/components/common/ReconnectingOverlay.tsx`

**Design System Requirements:**
Use semantic tokens:
- Overlay: `bg-background/80` (80% opacity dark background)
- Loading indicator: `text-primary` (lime accent)
- Text: `text-foreground` for primary, `text-muted-foreground` for secondary

**Animation Requirements:**
Use react-native-reanimated for:
- Fade in/out of overlay
- Pulsing loading indicator
- Slide-in "Back online" confirmation

### Technical Implementation

**1. Reconnecting Overlay Component:**
```tsx
interface ReconnectingOverlayProps {
  isVisible: boolean;
  disconnectionDuration: number; // seconds
  onRetry: () => void;
}

export function ReconnectingOverlay({ isVisible, disconnectionDuration, onRetry }: ReconnectingOverlayProps) {
  const getMessage = () => {
    if (disconnectionDuration < 10) return "Reconnecting...";
    if (disconnectionDuration < 20) return "Still trying to reconnect...";
    if (disconnectionDuration < 30) return "This is taking longer than expected";
    return "Connection issues. You can try again.";
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute inset-0 bg-background/80 items-center justify-center z-50"
    >
      <WifiOff className="text-primary animate-pulse mb-4" size={48} />
      <Text className="text-foreground text-lg mb-2">{getMessage()}</Text>
      {disconnectionDuration >= 30 && (
        <Button onPress={onRetry} variant="outline">
          <Text>Try Again</Text>
        </Button>
      )}
    </Animated.View>
  );
}
```

**2. Enhanced useAIChat Hook:**
```typescript
export function useAIChat(options: UseAIChatOptions) {
  const { isOffline } = useNetwork();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [disconnectionStart, setDisconnectionStart] = useState<number | null>(null);
  const pendingSendRef = useRef<string | null>(null);

  // Track disconnection duration
  useEffect(() => {
    if (isOffline && !disconnectionStart) {
      setDisconnectionStart(Date.now());
      setIsReconnecting(true);
    } else if (!isOffline && disconnectionStart) {
      // Reconnected
      setDisconnectionStart(null);
      setIsReconnecting(false);
      // Auto-resume pending send
      if (pendingSendRef.current) {
        sendMessage(pendingSendRef.current);
        pendingSendRef.current = null;
      }
    }
  }, [isOffline]);

  const sendMessage = async (content: string) => {
    if (isOffline) {
      pendingSendRef.current = content;
      return; // Queue for later
    }
    // ... existing send logic
  };

  return {
    // ... existing returns
    isReconnecting,
    disconnectionDuration: disconnectionStart ? Math.floor((Date.now() - disconnectionStart) / 1000) : 0,
  };
}
```

**3. Stream Abort on Network Loss:**
```typescript
// In ai-stream.ts
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  if (isOffline && abortControllerRef.current) {
    // Clean abort - not an error, just pause
    abortControllerRef.current.abort();
    // Mark stream as paused, not errored
    setStreamState('paused');
  }
}, [isOffline]);
```

**4. Partial Response Handling:**
```typescript
interface PartialStreamState {
  messageId: string;
  receivedContent: string;
  isComplete: boolean;
}

// On reconnect, check if we have partial response
if (partialState && !partialState.isComplete) {
  // Show indicator that response was interrupted
  updateMessage(partialState.messageId, {
    content: partialState.receivedContent + " [interrupted]",
    needsContinuation: true,
  });
}
```

### Project Structure Notes

**Files to Create:**
1. `apps/native/src/components/common/ReconnectingOverlay.tsx`

**Files to Modify:**
1. `apps/native/src/lib/ai-stream.ts` - Network-aware streaming, clean abort
2. `apps/native/src/hooks/use-ai-chat.ts` - Reconnecting state, pending queue
3. `apps/native/src/components/app/onboarding/generative/AIConversationView.tsx` - Overlay integration

### Critical Behaviors

1. **Never Show Error on Network Loss**
   - Network loss = pause, not failure
   - Only show error after extended timeout OR user-triggered retry fails

2. **Preserve User Input**
   - If user was typing when network dropped, preserve their text
   - If user sent message just before drop, queue it

3. **Seamless Resume**
   - User shouldn't have to re-do anything
   - Conversation continues exactly where it was

4. **Visual Continuity**
   - Conversation remains visible behind overlay
   - Only interaction is blocked, not visibility

### Dependencies

**Requires Story 8.1:**
- `useNetwork()` hook from NetworkContext
- `isOffline` state

**Integrates with Story 8.3:**
- Network errors should classify as `LLM_NETWORK_ERROR`
- Reconnection should clear error state

### References

- [Source: epics.md#Story-8.2] Story requirements (FR57, FR58)
- [Source: architecture.md#LLM-Integration-Architecture] Streaming architecture
- [Source: ai-stream.ts:373-396] Current reconnection logic
- [Source: use-ai-chat.ts] Current error and retry handling
- [Source: NFR-R1] Onboarding flow must handle network interruption
- [Source: NFR-R2] Partial progress must persist across app restarts
- [Source: NFR-R3] LLM streaming must handle partial responses

### Testing Approach

1. **Unit Tests:**
   - Disconnection duration tracking
   - Message progression based on duration
   - Pending send queue behavior

2. **Integration Tests:**
   - Stream pauses cleanly on network loss
   - Stream resumes correctly on reconnection
   - No duplicate messages after reconnect
   - Overlay shows/hides correctly

3. **Manual Testing:**
   - Mid-conversation: toggle airplane mode
   - Verify overlay appears within 1-2 seconds
   - Verify message progression (10s, 20s, 30s)
   - Re-enable network, verify auto-resume
   - Test partial response recovery
   - Test flaky network (rapid on/off)

4. **Edge Cases:**
   - Network loss exactly when sending message
   - Network loss during streaming response
   - Very brief network blip (<2 seconds)
   - Extended outage (>5 minutes)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Pre-existing TypeScript errors in healthkit.ts persist (unrelated to Story 8.2)

### Completion Notes List

1. **Task 1-2**: Created ReconnectingOverlay component with progressive messages built-in (0-10s, 10-20s, 20-30s, 30s+). Includes pulsing animation, haptic feedback, and "Back online" confirmation.

2. **Task 3**: Enhanced ai-stream.ts with `StreamCompletionReason` type ("complete" | "aborted" | "network-error" | "error") and `isNetworkError()` helper to classify errors.

3. **Task 4**: Major enhancement to use-ai-chat.ts:
   - Added `isReconnecting` and `disconnectionDuration` state
   - Added pending send queue (`pendingSendRef`)
   - Auto-resume on network restore (retries interrupted streams or pending sends)
   - Clean abort handling (not error) on network loss

4. **Task 5**: Added `isInterrupted` flag to ChatMessage interface. Partial responses are preserved (not replaced with "[Error]"). Aborted streams keep their content.

5. **Task 6**: Integrated ReconnectingOverlay into AIConversationView.tsx with new props (`isReconnecting`, `onRetry`).

6. **Task 7**: Verified Convex handles persistence:
   - Mutations auto-queue when offline
   - React state survives app backgrounding
   - Limitation: Full app restart loses React state (requires backend message storage for true persistence)

7. **Code Review Fix**: Added `onReconnected` prop to AIConversationView to properly wire haptic feedback on reconnection success.

### ⚠️ Testing Required

**TODO:** Create test files for Story 8.2 components:
- `apps/native/src/hooks/__tests__/use-ai-chat.test.ts` - Test reconnecting state, pending queue, auto-resume
- `apps/native/src/components/common/__tests__/ReconnectingOverlay.test.tsx` - Test progressive messages, haptics

Testing dependencies also need to be installed (see Story 8.1 notes).

### ⚠️ Known Limitations

1. **Task 5.3 - LLM Continuation**: Partial responses are marked with `isInterrupted` flag but no automatic LLM continuation request is sent. User must manually retry to continue.

2. **Task 7.1 - Persistence**: Conversation messages are stored in React state only. Full app restart/kill loses conversation progress. True persistence requires Story 8.3's `saveConversationProgress` to local storage and backend sync.

### File List

**Created:**
- apps/native/src/components/common/ReconnectingOverlay.tsx

**Modified:**
- apps/native/src/lib/ai-stream.ts (added completionReason, isNetworkError, LLMError class)
- apps/native/src/hooks/use-ai-chat.ts (reconnecting state, pending queue, auto-resume, isInterrupted, saveProgress)
- apps/native/src/components/app/onboarding/generative/AIConversationView.tsx (overlay integration, onReconnected prop)

