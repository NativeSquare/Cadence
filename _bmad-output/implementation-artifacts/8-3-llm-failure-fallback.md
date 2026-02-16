# Story 8.3: LLM Failure Fallback

Status: ready-for-dev

## Story

As a user,
I want the app to handle AI failures gracefully,
So that I can continue or retry without frustration.

## Acceptance Criteria

1. **Given** an LLM API call fails
   **When** the error is detected
   **Then** a user-friendly error message is shown
   **And** a retry option is available
   **And** the error is logged for debugging

2. **Given** the LLM times out
   **When** no response is received within 30 seconds
   **Then** the timeout is handled gracefully
   **And** the user can retry
   **And** their previous input is preserved

3. **Given** multiple failures occur
   **When** 3 retries are exhausted
   **Then** a more detailed error with support contact is shown
   **And** the user's progress is saved locally

## Tasks / Subtasks

- [ ] Task 1: Enhance LLM Error Classification (AC: #1)
  - [ ] 1.1 Add granular error types in http_action.ts (timeout, rate_limit, model_error, network)
  - [ ] 1.2 Add structured error response with error code, user message, and debug info
  - [ ] 1.3 Add server-side logging with request ID for debugging

- [ ] Task 2: Create LLM Error UI Component (AC: #1, #3)
  - [ ] 2.1 Create `LLMErrorCard.tsx` component in `apps/native/src/components/app/onboarding/generative/`
  - [ ] 2.2 Display user-friendly message based on error type
  - [ ] 2.3 Show retry button with loading state
  - [ ] 2.4 Show escalated error with support contact after exhausted retries

- [ ] Task 3: Enhance Retry Logic in use-ai-chat.ts (AC: #2, #3)
  - [ ] 3.1 Track retry count per message attempt
  - [ ] 3.2 Implement configurable timeout (30s default)
  - [ ] 3.3 Preserve user input across retry attempts
  - [ ] 3.4 Expose retry count and max retries to UI

- [ ] Task 4: Implement Exhausted Retries Handling (AC: #3)
  - [ ] 4.1 Detect when maxRetries (3) is exhausted
  - [ ] 4.2 Save conversation progress to local AsyncStorage
  - [ ] 4.3 Display support contact information (email/link)
  - [ ] 4.4 Provide "Try Later" option that navigates away gracefully

- [ ] Task 5: Update ai-stream.ts Error Handling (AC: #1, #2)
  - [ ] 5.1 Add AbortController timeout wrapper (30s)
  - [ ] 5.2 Parse and categorize HTTP error responses
  - [ ] 5.3 Return structured error objects to calling code

## Dev Notes

### Current Implementation Analysis

**Backend (http_action.ts:93-123)**
Basic error handling exists:
- ConvexError handling with code extraction
- Timeout detection via error message string matching
- Rate limit detection via error message string matching
- Generic LLM_ERROR fallback

**What's Missing:**
- No request ID for debugging
- Error messages are technical, not user-friendly
- No distinction between recoverable vs. fatal errors

**Frontend (use-ai-chat.ts)**
Basic retry exists:
- `retry()` function removes failed messages and resends
- `lastUserMessageRef` stores last user input for retry
- Error state exposed via `error` return value

**What's Missing:**
- No retry count tracking
- No exhausted retries detection
- No timeout configuration (uses ai-stream default)

**ai-stream.ts:373-396**
Good foundation:
- `streamWithReconnect()` with maxRetries=3
- Exponential backoff (1s, 2s, 4s)
- `shouldReconnect()` filters retryable errors

**What's Missing:**
- No timeout wrapper
- No structured error type returns
- Doesn't expose retry attempt number to caller

### Architecture Compliance

**Error Handling Pattern (architecture.md:389-397)**
Use ConvexError with standardized codes:
- `LLM_TIMEOUT` - AI response timeout
- Add: `LLM_RATE_LIMITED` - Rate limit hit
- Add: `LLM_MODEL_ERROR` - Model returned error
- Add: `LLM_NETWORK_ERROR` - Network failure

**Component Location (architecture.md:479-485)**
Error UI goes in: `apps/native/src/components/app/onboarding/generative/`

**Design System (architecture.md:401-415)**
Use semantic tokens:
- `destructive` for error states
- `muted-foreground` for secondary text
- Existing Alert component can be extended

### Technical Requirements

**Timeout Configuration:**
```typescript
const LLM_TIMEOUT_MS = 30000; // 30 seconds per AC#2
const MAX_RETRIES = 3;        // 3 retries per AC#3
```

**Error Response Structure:**
```typescript
interface LLMErrorResponse {
  code: 'LLM_TIMEOUT' | 'LLM_RATE_LIMITED' | 'LLM_MODEL_ERROR' | 'LLM_NETWORK_ERROR' | 'LLM_ERROR';
  message: string;           // User-friendly message
  debugInfo?: {
    requestId: string;       // For support tickets
    timestamp: number;
    details?: string;        // Technical details (not shown to user)
  };
  isRetryable: boolean;      // Hint for UI
}
```

**User-Friendly Messages:**
| Code | User Message |
|------|--------------|
| LLM_TIMEOUT | "I'm thinking hard but taking too long. Let's try again?" |
| LLM_RATE_LIMITED | "I need a moment to catch my breath. Try again in a few seconds." |
| LLM_MODEL_ERROR | "Something went wrong on my end. Let's try that again." |
| LLM_NETWORK_ERROR | "I can't reach my brain right now. Check your connection and retry." |
| LLM_ERROR | "Something unexpected happened. Let's try again." |

**Exhausted Retries Message:**
> "I'm having trouble right now. Your progress is saved. You can try again later or contact support at support@cadence.app"

### Project Structure Notes

**Files to Modify:**
1. `packages/backend/convex/ai/http_action.ts` - Enhanced error responses
2. `apps/native/src/lib/ai-stream.ts` - Timeout wrapper, structured errors
3. `apps/native/src/hooks/use-ai-chat.ts` - Retry tracking, timeout config

**Files to Create:**
1. `apps/native/src/components/app/onboarding/generative/LLMErrorCard.tsx` - Error UI

**Existing Patterns to Follow:**
- [ToolLoading.tsx](apps/native/src/components/app/onboarding/generative/ToolLoading.tsx) for loading states
- [ConfirmationCard.tsx](apps/native/src/components/app/onboarding/generative/ConfirmationCard.tsx) for card styling
- Button component from `@/components/ui/button`
- Alert component from `@/components/ui/alert` if needed

### References

- [Source: epics.md#Epic-8-Story-8.3] Story requirements
- [Source: architecture.md#Error-Handling-Patterns] ConvexError codes
- [Source: architecture.md#LLM-Integration-Architecture] Streaming architecture
- [Source: use-ai-chat.ts] Current retry implementation
- [Source: http_action.ts:93-123] Current error handling
- [Source: ai-stream.ts:373-396] Current reconnection logic

### Dependencies

**NFR References:**
- NFR-I3: LLM API failures must fallback gracefully with user-friendly error and retry option
- NFR-R3: LLM streaming must handle partial responses (graceful recovery if stream breaks)

**No blocking dependencies.** This story can be implemented independently.

### Testing Approach

1. **Unit Tests:**
   - Error classification logic in http_action.ts
   - Retry count tracking in use-ai-chat.ts
   - Timeout wrapper in ai-stream.ts

2. **Integration Tests:**
   - Mock LLM timeout (delay > 30s)
   - Mock rate limit response (429)
   - Mock server error (500)
   - Verify retry flow up to 3 attempts

3. **Manual Testing:**
   - Disable network mid-stream
   - Force slow network to trigger timeout
   - Verify error messages display correctly
   - Verify retry button works
   - Verify progress saved after exhausted retries

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

