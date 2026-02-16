# Story 8.2: Connection Lost Mid-Flow

Status: ready-for-dev

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

- [ ] Task 1: Create Reconnecting Overlay Component (AC: #1, #2)
  - [ ] 1.1 Create `apps/native/src/components/common/ReconnectingOverlay.tsx`
  - [ ] 1.2 Semi-transparent overlay with centered content
  - [ ] 1.3 Animated loading indicator (pulsing wifi icon or spinner)
  - [ ] 1.4 "Reconnecting..." text message
  - [ ] 1.5 Auto-dismiss with fade when connection restored
  - [ ] 1.6 Show "Back online" confirmation briefly (2s)

- [ ] Task 2: Implement Progressive Timeout Messages (AC: #4)
  - [ ] 2.1 Track disconnection duration in state
  - [ ] 2.2 Show "Reconnecting..." for first 10 seconds
  - [ ] 2.3 Show "Still trying to reconnect..." after 10s
  - [ ] 2.4 Show "This is taking longer than expected" after 20s
  - [ ] 2.5 Show "Try Again" button after 30s
  - [ ] 2.6 Optionally show "Continue Offline" if applicable

- [ ] Task 3: Enhance AI Stream Pause/Resume (AC: #3, #5)
  - [ ] 3.1 Update `apps/native/src/lib/ai-stream.ts` with network-aware streaming
  - [ ] 3.2 On network loss: abort current stream cleanly (not error)
  - [ ] 3.3 Store last stable conversation state before abort
  - [ ] 3.4 On network restore: detect if stream was interrupted
  - [ ] 3.5 Resume from last user message (not resend entire history)
  - [ ] 3.6 Prevent duplicate submissions during reconnection

- [ ] Task 4: Integrate Network Status with AI Chat Hook (AC: #1, #3, #5)
  - [ ] 4.1 Update `apps/native/src/hooks/use-ai-chat.ts` to subscribe to network context
  - [ ] 4.2 Add `isReconnecting` state to hook return
  - [ ] 4.3 Pause sending when offline (queue or block)
  - [ ] 4.4 Auto-resume pending send when back online
  - [ ] 4.5 Clear any error state on successful reconnection

- [ ] Task 5: Handle Partial Stream Recovery (AC: #3)
  - [ ] 5.1 Track last received chunk/token in stream
  - [ ] 5.2 On reconnect, check if partial response exists
  - [ ] 5.3 If partial: mark as incomplete, request continuation
  - [ ] 5.4 If complete: no action needed
  - [ ] 5.5 Never show truncated AI message without indicator

- [ ] Task 6: Integrate Overlay in Conversation View (AC: #1, #2)
  - [ ] 6.1 Update `AIConversationView.tsx` to show ReconnectingOverlay
  - [ ] 6.2 Overlay appears when `isReconnecting` is true
  - [ ] 6.3 Conversation UI remains visible but non-interactive behind overlay
  - [ ] 6.4 Input field disabled during reconnection
  - [ ] 6.5 Haptic feedback when connection lost and restored

- [ ] Task 7: Local Progress Persistence (AC: #5)
  - [ ] 7.1 Verify conversation state is saved to Convex before network loss
  - [ ] 7.2 Ensure Runner Object updates are queued if offline
  - [ ] 7.3 On reconnect: sync any pending mutations
  - [ ] 7.4 Handle Convex offline behavior (already has optimistic updates)

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

