# Story 2.7: Wearable Connection Mock (Skip Path)

Status: done

---

## Story

As a **user without wearable data**,
I want **to skip the wearable connection and proceed conversationally**,
So that **I can still use the app without connected devices**.

---

## Acceptance Criteria

### AC1: Mock Provider Display

**Given** the user reaches the wearable connection prompt (after name confirmation)
**When** they see the ConnectionCard component
**Then** mock provider buttons are displayed (Strava, Garmin, COROS, Apple Watch)
**And** a "I'll do this later" skip option is prominently available
**And** the progress bar is visible showing current completion (~5-10%)

### AC2: Mock Provider Tap Behavior

**Given** the user taps a wearable provider (mock implementation)
**When** the mock flow executes
**Then** a brief loading state is shown (1-2 seconds)
**And** the flow proceeds to skip path (simulating "no data found" or skip behavior)
**And** no actual OAuth or API calls are made (MVP mock)

### AC3: Skip Confirmation

**Given** the user taps "I'll do this later" (or the current "I don't have a wearable right now")
**When** the skip is confirmed
**Then** `connections.stravaConnected` is set to `false`
**And** `connections.wearableConnected` is set to `false`
**And** `connections.wearableType` is set to `"none"`

### AC4: Coach Response After Skip

**Given** the user has skipped wearable connection
**When** the runner state is updated
**Then** the coach responds with: "No problem. I'll learn as we go."
**And** the conversation proceeds to the profile building phase (Story 2.8)
**And** `conversationState.currentPhase` transitions to `"profile"`

### AC5: AI Tool Integration

**Given** the AI SDK streaming infrastructure exists (Story 2.1)
**When** the coach decides to show the wearable connection prompt
**Then** a `renderConnectionCard` tool is called with appropriate props
**And** the ConnectionCard renders inline in the conversation flow
**And** user selection is captured and sent back to the LLM as tool result

---

## Tasks / Subtasks

- [x] **Task 1: Create renderConnectionCard AI Tool** (AC: #5)
  - [x] Create `packages/backend/convex/ai/tools/renderConnectionCard.ts`
  - [x] Define tool schema with parameters: `providers`, `skipLabel`, `targetField`
  - [x] Tool returns structured output for frontend rendering
  - [x] Integrate with tool registry in AI HTTP action

- [x] **Task 2: Create ConnectionCard Tool Component** (AC: #1, #5)
  - [x] Create `apps/native/src/components/app/onboarding/generative/ConnectionCardTool.tsx`
  - [x] Wrap existing ConnectionCard with AI tool response handling
  - [x] Accept tool output props from AI SDK
  - [x] Handle selection callback to send tool result back

- [x] **Task 3: Implement Mock Provider Flow** (AC: #2)
  - [x] Add `isConnecting` and `connectingProvider` state management
  - [x] Show loading indicator for 1-2 seconds on provider tap
  - [x] After mock delay, proceed to skip behavior
  - [x] Log mock connection attempt for future real implementation

- [x] **Task 4: Implement Skip Handler** (AC: #3, #4)
  - [x] Create `handleSkipWearable` function in hook or component
  - [x] Call `updateRunner` mutation with connections update
  - [x] Set `stravaConnected: false`, `wearableConnected: false`, `wearableType: "none"`
  - [x] Send tool result back to AI conversation

- [x] **Task 5: Add Skip Mutation** (AC: #3)
  - [x] Create `skipWearableConnection` mutation in `packages/backend/convex/table/runners.ts`
  - [x] Update connections section atomically
  - [x] Transition `currentPhase` to `"profile"` (or let `determinePhase` handle it)
  - [x] Return updated runner state

- [x] **Task 6: Update Tool Renderer Switch** (AC: #5)
  - [x] Add `case 'tool-renderConnectionCard'` to tool-renderer.tsx
  - [x] Map to ConnectionCardTool component
  - [x] Handle loading state while tool is streaming

- [x] **Task 7: Coach Prompt Integration** (AC: #4)
  - [x] Add wearable connection prompt to coach system prompt
  - [x] Coach should naturally introduce the connection option
  - [x] After skip, coach responds with warm acknowledgment
  - [x] Coach proceeds to profile questions

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Generative UI Pattern:**
   - AI calls `renderConnectionCard` tool
   - Frontend renders based on `part.type === 'tool-renderConnectionCard'`
   - User selection sends tool result back to conversation
   - Coach continues based on tool result

2. **State Management:**
   - Use Convex mutations for all Runner Object updates
   - No local state duplication of connections status
   - Optimistic updates handled by Convex

3. **Design System Usage:**
   - ConnectionCard already uses design tokens
   - Loading indicator: use existing ActivityIndicator with white/40 color
   - Button styles match existing `bg-white/5 active:bg-white/10`

4. **Naming Conventions:**
   - Tool: `renderConnectionCard` (camelCase)
   - Part type: `tool-renderConnectionCard`
   - Component: `ConnectionCardTool.tsx` (PascalCase)

### Existing Components

The `connection-card.tsx` component already exists with:

```typescript
type ConnectionCardProps = {
  onConnect: (providerId: string) => void;
  onSkip: () => void;
  isConnecting?: boolean;
  connectingProvider?: string | null;
  connectedProvider?: string | null;
  connectedAthleteName?: string | null;
  className?: string;
};
```

**Providers already defined:**
- `garmin` - Garmin
- `coros` - COROS
- `apple` - Apple Watch
- `strava` - Strava

### AI Tool Schema

```typescript
// renderConnectionCard tool definition
const renderConnectionCard = tool({
  description: "Display wearable/data connection options to the user",
  parameters: z.object({
    prompt: z.string().optional().describe("Optional prompt text above the card"),
    providers: z.array(z.enum(["garmin", "coros", "apple", "strava"])).default(["strava", "garmin", "coros", "apple"]),
    skipLabel: z.string().default("I'll do this later"),
    allowSkip: z.boolean().default(true),
  }),
  execute: async ({ prompt, providers, skipLabel, allowSkip }) => {
    return {
      type: "connectionCard",
      prompt,
      providers,
      skipLabel,
      allowSkip,
    };
  },
});
```

### Tool Result Flow

```
Coach calls renderConnectionCard tool
        ↓
Frontend renders ConnectionCardTool
        ↓
User taps "Skip" or mock provider
        ↓
Tool result sent: { action: "skip" } or { action: "connect", provider: "strava" }
        ↓
Backend mutation updates Runner Object connections
        ↓
Coach receives tool result, responds appropriately
        ↓
Conversation continues to profile phase
```

### Mock Implementation Notes

For MVP, all provider connections are mocked:

1. **Provider Tap → Mock Delay → Skip Path**
   - Simulates "connecting" state for UX polish
   - Does NOT actually connect to any service
   - Proceeds as if user chose to skip

2. **Future Real Implementation (Epic 6):**
   - Story 6.1: Strava OAuth Integration
   - Story 6.2: HealthKit Integration
   - Story 6.3: Health Connect Integration

3. **Comment in Code:**
   ```typescript
   // TODO: Replace with real OAuth flow in Epic 6
   // For now, simulate connection attempt then skip
   ```

### Phase Transition Logic

After skip:
- `connections.stravaConnected = false`
- `connections.wearableConnected = false`
- `connections.wearableType = "none"`
- `conversationState.currentPhase` → `"profile"` (handled by `determinePhase()`)

The `determinePhase()` function in runners.ts will automatically calculate phase based on filled fields. After name confirmation and before profile fields are filled, phase should be `"profile"`.

### Coach Prompt Context

Coach should be aware of:
- User has confirmed their name
- This is the data bridge phase
- Wearable connection is optional
- Skip is a valid, supported path

Example coach dialogue:
```
Coach: "Before we dig in, would you like to connect your watch or Strava?
It helps me understand your running better, but no pressure — we can
figure it out together."

[ConnectionCard displays]

User: [Taps "I'll do this later"]

Coach: "No problem. I'll learn as we go. Now, tell me about your running..."
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/renderConnectionCard.ts` | AI tool definition |
| `apps/native/src/components/app/onboarding/generative/ConnectionCardTool.tsx` | Tool wrapper component |

**Files to Modify:**
| File | Change |
|------|--------|
| `packages/backend/convex/table/runners.ts` | Add `skipWearableConnection` mutation |
| `packages/backend/convex/ai/http-action.ts` | Register renderConnectionCard tool |
| `apps/native/src/components/app/onboarding/generative/tool-renderer.tsx` | Add case for connection card |

### Dependencies

**From Story 2.1 (AI SDK Integration):**
- AI streaming HTTP action
- Tool calling infrastructure
- Conversation context management

**From Story 2.2 (Generative UI):**
- Tool renderer switch statement
- Part type mapping pattern

**From Story 1.6 (Progress Tracking):**
- `updateRunner` mutation with auto-recalculation
- Phase tracking in `conversationState`

### Testing Considerations

1. **Manual Testing:**
   - Tap each mock provider, verify loading + skip behavior
   - Tap "I'll do this later", verify coach response
   - Verify connections state in Convex dashboard
   - Verify phase transitions correctly to "profile"

2. **Edge Cases:**
   - Double-tap prevention during loading
   - Network error during mutation (Convex handles retry)
   - Resume after closing app mid-flow

### References

- [Source: architecture.md#Generative UI Implementation] - Tool rendering pattern
- [Source: architecture.md#Tool Registry] - `renderConnectionCard` in tool list
- [Source: epics.md#Story 2.7] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#FR9] - Skip wearable connection requirement
- [Source: ux-onboarding-flow-v6-2026-02-13.md#Data Bridge] - UX specifications

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Added `renderConnectionCard` tool to backend tools registry with params: providers, skipLabel, allowSkip
- Created `ConnectionCardTool.tsx` wrapper component with mock provider flow
- Mock provider tap shows 1.5s loading state then falls through to skip behavior
- TODO comments added for Epic 6 real OAuth implementation
- Added `skipWearableConnection` mutation to runners.ts with auto phase transition
- Updated tool-renderer.tsx switch case for renderConnectionCard
- Coach system prompt updated with Data Bridge phase instructions
- Tool instructs coach to offer wearable connection after name confirmation
- Coach responds "No problem. I'll learn as we go." after skip
- All TypeScript checks pass (native app)

### File List

**Created:**
- apps/native/src/components/app/onboarding/generative/ConnectionCardTool.tsx

**Modified:**
- packages/backend/convex/ai/tools/index.ts (added renderConnectionCard tool)
- packages/backend/convex/table/runners.ts (added skipWearableConnection mutation)
- packages/backend/convex/ai/prompts/onboarding-coach.ts (added Data Bridge phase, tool guide, connections context)
- apps/native/src/components/app/onboarding/generative/tool-renderer.tsx (updated imports, switch case)
- apps/native/src/components/app/onboarding/generative/index.ts (added export)

