# Story 2.1: AI SDK Integration & Streaming Infrastructure

Status: review

---

## Story

As a **developer**,
I want **the LLM integration set up with Vercel AI SDK via Convex HTTP Actions**,
So that **the coach can have streaming conversations with tool-calling capabilities**.

---

## Acceptance Criteria

### AC1: AI Streaming Endpoint

**Given** the Convex backend is configured
**When** an AI streaming endpoint is called
**Then** it connects to OpenAI via Vercel AI SDK v6.x
**And** responses stream back to the client via SSE
**And** the endpoint supports tool definitions for generative UI

### AC2: Real-Time Streaming

**Given** a conversation is in progress
**When** the LLM generates a response
**Then** text streams to the client in real-time (<3 seconds to first token per NFR-P2)
**And** tool calls are parsed and returned with their arguments
**And** conversation history is maintained for context

### AC3: Tool Call Handling

**Given** the AI makes a tool call
**When** the tool execution completes
**Then** the result is persisted to the Runner Object as appropriate
**And** the conversation continues with the tool result in context

### AC4: Delta Streaming with Persistence

**Given** the user is mid-conversation
**When** network interruption occurs
**Then** partial responses are persisted via delta streaming
**And** the conversation can resume from the last checkpoint

---

## Tasks / Subtasks

- [x] **Task 1: Install AI SDK Dependencies** (AC: #1)
  - [x] Add `ai` (Vercel AI SDK v6.x) to packages/backend
  - [x] Add `@ai-sdk/openai` provider package
  - [x] Configure OPENAI_API_KEY in Convex environment (manual step required)

- [x] **Task 2: Create AI HTTP Action Endpoint** (AC: #1, #2)
  - [x] Create `packages/backend/convex/ai/http-action.ts`
  - [x] Implement `streamText()` from Vercel AI SDK
  - [x] Return SSE stream via `toTextStreamResponse()`
  - [x] Register route in `packages/backend/convex/http.ts`

- [x] **Task 3: Create Conversation State Management** (AC: #2, #4)
  - [x] Create `packages/backend/convex/ai/messages.ts` for message persistence
  - [x] Define message schema: role, content, toolCalls, toolResults
  - [x] Implement conversation history retrieval
  - [x] Add conversation ID to Runner Object schema (via conversations table)

- [x] **Task 4: Create Tool Registry** (AC: #1, #3)
  - [x] Create `packages/backend/convex/ai/tools/index.ts`
  - [x] Define tool interface matching AI SDK `tool()` helper
  - [x] Create placeholder tools: renderMultipleChoice, renderOpenInput, renderConfirmation
  - [x] Implement tool parameter schemas with Zod

- [x] **Task 5: Create System Prompt** (AC: #2)
  - [x] Create `packages/backend/convex/ai/prompts/onboarding-coach.ts`
  - [x] Define coach persona and conversation guidelines
  - [x] Include tool usage instructions for the LLM
  - [x] Add context injection for Runner Object state

- [x] **Task 6: Create Client-Side Streaming Hook** (AC: #2)
  - [x] Create `apps/native/src/hooks/use-ai-chat.ts`
  - [x] Implement SSE connection to Convex HTTP endpoint
  - [x] Parse streaming chunks and tool calls
  - [x] Return typed messages with parts array

- [x] **Task 7: Create AI Stream Library** (AC: #2, #4)
  - [x] Create `apps/native/src/lib/ai-stream.ts`
  - [x] Implement SSE parser for Vercel AI SDK format
  - [x] Handle text chunks and tool call events
  - [x] Implement reconnection logic

- [x] **Task 8: Add Convex Client Configuration** (AC: #1)
  - [x] Update `apps/native/src/lib/convex.ts` if needed (no changes needed - existing setup sufficient)
  - [x] Ensure HTTP endpoint is accessible from native app (via .site URL conversion)
  - [x] Add auth token passthrough for authenticated requests (via useAuthToken hook)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Server-Side via Convex HTTP Actions:**
   - LLM calls happen server-side only - NEVER expose API keys to client
   - Use Convex HTTP Actions (not mutations) for streaming responses
   - `toTextStreamResponse()` returns proper SSE format

2. **Vercel AI SDK v6.x Pattern (UPDATED):**
   ```typescript
   import { streamText, stepCountIs } from "ai";
   import { openai } from "@ai-sdk/openai";

   const result = streamText({
     model: openai("gpt-4o"),
     messages: conversationHistory,
     tools: toolRegistry,
     system: systemPrompt,
     stopWhen: stepCountIs(5), // v6 uses stopWhen instead of maxSteps
   });

   return result.toTextStreamResponse();
   ```

3. **Delta Streaming (Recommended):**
   - Stream chunks to client AND save deltas to Convex
   - Use `@convex-dev/agent` or custom delta storage for persistence
   - Survives disconnects, enables multi-client sync

4. **Runtime Compatibility (Verified):**
   - Convex default runtime supports `TextDecoderStream`
   - No `"use node"` directive needed for basic AI SDK streaming
   - Web Streams API fully supported

### Tool Definition Pattern

**AI SDK v6 Tool Structure (UPDATED):**
```typescript
import { tool } from "ai";
import { z } from "zod";

// NOTE: AI SDK v6 uses `inputSchema` instead of deprecated `parameters`
export const renderMultipleChoice = tool({
  description: "Display multiple choice options for user selection",
  inputSchema: z.object({
    question: z.string().optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
      description: z.string().optional(),
    })),
    targetField: z.string(),
    allowMultiple: z.boolean().default(false),
    allowSkip: z.boolean().default(false),
  }),
});
```

### HTTP Endpoint Registration

**In packages/backend/convex/http.ts:**
```typescript
import { httpAction } from "./_generated/server";

http.route({
  path: "/api/ai/stream",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate auth token from headers
    // Get conversation state
    // Call streamText
    // Return SSE response
  }),
});
```

### Client-Side SSE Parsing

**Message Parts Structure:**
```typescript
type MessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolName: string; args: unknown; toolCallId: string }
  | { type: "tool-result"; toolName: string; result: unknown; toolCallId: string };

interface Message {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
}
```

### System Prompt Guidelines

**Coach Persona:**
- Name: Coach (no specific name - user projects)
- Voice: Crisp, purposeful, warm but not saccharine
- Style adapts to user's `coaching.coachingVoice` preference
- Always reference context from earlier in conversation

**Tool Usage Rules:**
- Use tools to collect structured data
- Follow with conversational acknowledgment
- Never expose internal field names to user

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/http-action.ts` | Main streaming endpoint |
| `packages/backend/convex/ai/messages.ts` | Message persistence |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry |
| `packages/backend/convex/ai/prompts/onboarding-coach.ts` | System prompt |
| `apps/native/src/hooks/use-ai-chat.ts` | Client streaming hook |
| `apps/native/src/lib/ai-stream.ts` | SSE parser utilities |

**Files to Modify:**
| File | Change |
|------|--------|
| `packages/backend/convex/http.ts` | Add AI streaming route |
| `packages/backend/package.json` | Add AI SDK dependencies |
| `packages/backend/convex/schema.ts` | Add messages table (optional for MVP) |

### Dependencies to Install

**Backend (packages/backend):**
```bash
pnpm add ai @ai-sdk/openai
```

**Environment Variables:**
```
OPENAI_API_KEY=sk-...
```

### Existing Infrastructure to Leverage

| Component | Location | Usage |
|-----------|----------|-------|
| `streaming-text.tsx` | `components/app/onboarding/` | Already built - renders streaming text |
| `thinking-block.tsx` | `components/app/onboarding/` | Already built - collapsible thinking |
| `coach-text.tsx` | `components/app/onboarding/` | Already built - coach message styling |
| Convex auth | `packages/backend/convex/auth.ts` | Use for endpoint authentication |
| Runner Object | `packages/backend/convex/table/runners.ts` | Context for AI prompts |

### Error Handling

**Use ConvexError with standardized codes:**
- `LLM_TIMEOUT` - AI response timeout (use 30s default)
- `LLM_ERROR` - API call failed
- `UNAUTHORIZED` - Missing or invalid auth token
- `RATE_LIMITED` - Too many requests

**Graceful Degradation:**
- On LLM failure, return user-friendly error message
- Allow retry without losing conversation context
- Log errors for debugging (sanitize sensitive data)

### Performance Considerations

1. **First Token Latency:**
   - Target: <3 seconds (NFR-P2)
   - Use streaming to show progress immediately
   - Consider gpt-4o-mini for faster responses if needed

2. **Conversation Context:**
   - Don't send entire Runner Object on every message
   - Summarize relevant context in system prompt
   - Keep message history pruned to last ~20 messages

3. **Tool Call Efficiency:**
   - Tools execute server-side
   - Runner Object updates happen atomically
   - Client receives tool results via same stream

### Testing Considerations

1. **Manual Testing:**
   - Verify SSE stream connects and receives chunks
   - Confirm tool calls parse correctly
   - Test auth token validation
   - Test reconnection after network drop

2. **Integration Points:**
   - This story enables Story 2.2 (Tool Renderer)
   - Tools defined here are rendered in Story 2.3-2.6
   - Conversation state links to Runner Object from Epic 1

### References

- [Source: architecture.md#LLM Integration Architecture] - Server-side via Convex HTTP Actions
- [Source: architecture.md#Runtime Compatibility] - Verified AI SDK works in Convex default runtime
- [Source: prd-onboarding-mvp.md#FR13] - Natural language conversation
- [Source: prd-onboarding-mvp.md#NFR-P2] - <3 seconds streaming start
- [Source: epics.md#Story 2.1] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Installed AI SDK v6.0.86 and @ai-sdk/openai v3.0.29
- Created HTTP action endpoint at `/api/ai/stream` with auth validation
- Used AI SDK v6 API (`inputSchema` instead of deprecated `parameters`, `stopWhen: stepCountIs()` instead of `maxSteps`)
- Implemented 5 generative UI tools: renderMultipleChoice, renderOpenInput, renderConfirmation, renderVoiceInput, renderProgress
- Built comprehensive system prompt with coaching personas (tough_love, encouraging, analytical, minimalist)
- Added conversations and messages tables to schema for persistence
- Client-side hook uses `useAuthToken()` from `@convex-dev/auth/react` for auth
- SSE parser handles text deltas, tool calls, and tool results
- Reconnection logic with exponential backoff implemented
- Note: User must set OPENAI_API_KEY in Convex environment: `npx convex env set OPENAI_API_KEY sk-...`

### Implementation Architecture

#### Data Flow Overview

```
┌─────────────────┐     POST /api/ai/stream      ┌──────────────────────┐
│   Native App    │ ─────────────────────────▶   │  Convex HTTP Action  │
│                 │   Authorization: Bearer xxx   │  (http-action.ts)    │
│  use-ai-chat.ts │                              │                      │
│  ai-stream.ts   │                              │  ┌────────────────┐  │
│                 │   SSE Stream Response        │  │  streamText()  │  │
│                 │ ◀─────────────────────────   │  │  + tools       │  │
│                 │   0:"Hello"                  │  │  + system      │  │
│                 │   9:{toolCallId, args}       │  └───────┬────────┘  │
└─────────────────┘                              │          │           │
                                                 │          ▼           │
                                                 │  ┌────────────────┐  │
                                                 │  │    OpenAI      │  │
                                                 │  │    gpt-4o      │  │
                                                 │  └────────────────┘  │
                                                 └──────────────────────┘
```

#### 1. Backend Layer (`packages/backend/convex/ai/`)

**http-action.ts** - The streaming endpoint
- Receives POST requests at `/api/ai/stream`
- Validates auth token via `ctx.auth.getUserIdentity()`
- Loads Runner Object for context injection
- Calls `streamText()` with model, messages, tools, and system prompt
- Returns SSE response via `toTextStreamResponse()`
- Uses `stopWhen: stepCountIs(5)` to allow up to 5 tool call rounds

**tools/index.ts** - Tool definitions for generative UI
- Uses AI SDK v6 `tool()` helper with `inputSchema` (not deprecated `parameters`)
- Each tool defines:
  - `description`: What the LLM sees to decide when to use it
  - `inputSchema`: Zod schema for typed arguments
- Tools implemented:
  - `renderMultipleChoice`: Options selection (experience level, goal type, etc.)
  - `renderOpenInput`: Free-form text/number input
  - `renderConfirmation`: Phase transition confirmation cards
  - `renderVoiceInput`: Voice recording trigger
  - `renderProgress`: Conversation progress indicator

**prompts/onboarding-coach.ts** - System prompt builder
- `buildSystemPrompt(runner)` injects Runner Object context
- Adapts voice based on `runner.coaching.coachingVoice`:
  - `tough_love`: Direct, no-nonsense
  - `encouraging`: Warm, supportive
  - `analytical`: Data-driven, precise
  - `minimalist`: Brief, efficient
- Includes tool usage guidelines for the LLM
- Provides phase progression guidance

**messages.ts** - Conversation persistence (for delta streaming)
- `conversations` table: Links to runner, tracks phase, active status
- `messages` table: Stores role, content, parts, toolCalls, toolResults
- `isComplete` field supports delta streaming (partial message recovery)
- `getConversationHistory()`: Returns last N messages for context

#### 2. Client Layer (`apps/native/src/`)

**lib/ai-stream.ts** - Low-level SSE parser
- `parseSSEEvent(data)`: Parses AI SDK streaming format
  - `0:"text"` → text-delta event
  - `9:{...}` → tool-call event
  - `a:{...}` → tool-result event
  - `d:{...}` / `e:{...}` → finish event
- `streamAIResponse(options)`: Fetches and processes SSE stream
- `streamWithReconnect(options)`: Adds exponential backoff retry
- Returns `StreamMessage` with id, role, content, parts[], isComplete

**hooks/use-ai-chat.ts** - React hook for chat state
- `useAIChat(options)` returns:
  - `messages`: Array of ChatMessage with parts
  - `isStreaming`: Boolean for loading state
  - `error`: Any error that occurred
  - `sendMessage(content)`: Send user message, get streaming response
  - `appendMessage()`: Add message without sending
  - `clearMessages()`: Reset conversation
  - `abort()`: Cancel current stream
  - `retry()`: Retry last failed message
- Uses `useAuthToken()` from `@convex-dev/auth/react`
- Converts Convex cloud URL to site URL automatically

#### 3. Message Parts Structure

The AI response is decomposed into typed parts for rendering:

```typescript
type MessagePart =
  | { type: "text"; text: string }                    // Rendered as coach text
  | { type: "tool-call"; toolName: string; args: unknown; toolCallId: string }  // Triggers UI component
  | { type: "tool-result"; toolName: string; result: unknown; toolCallId: string }; // User's response
```

Example message with tool call:
```typescript
{
  id: "assistant_1707912345678",
  role: "assistant",
  content: "Great! Let's start by understanding your running background.",
  parts: [
    { type: "text", text: "Great! Let's start by understanding your running background." },
    {
      type: "tool-call",
      toolCallId: "call_abc123",
      toolName: "renderMultipleChoice",
      args: {
        question: "How would you describe your running experience?",
        options: [
          { label: "Just starting", value: "beginner", emoji: "🌱" },
          { label: "Getting back into it", value: "returning", emoji: "🔄" },
          { label: "Run occasionally", value: "casual", emoji: "🏃" },
          { label: "Train regularly", value: "serious", emoji: "🎯" }
        ],
        targetField: "running.experienceLevel",
        allowSkip: false
      }
    }
  ],
  isStreaming: false,
  createdAt: 1707912345678
}
```

#### 4. Database Schema Additions

**conversations table:**
```typescript
{
  runnerId: Id<"runners">,
  userId: Id<"users">,
  phase: "intro" | "data_bridge" | "profile" | "goals" | "schedule" | "health" | "coaching" | "analysis",
  isActive: boolean,
  createdAt: number,
  updatedAt: number
}
// Indexes: by_runnerId, by_userId, by_active
```

**messages table:**
```typescript
{
  conversationId: Id<"conversations">,
  role: "user" | "assistant" | "system",
  content: string,
  parts: MessagePart[],
  toolCalls: ToolCall[],
  toolResults: ToolResult[],
  createdAt: number,
  isComplete: boolean,
  streamedContent?: string  // For delta streaming recovery
}
// Indexes: by_conversationId, by_conversation_time
```

#### 5. Authentication Flow

1. Native app has auth token from `@convex-dev/auth`
2. `useAuthToken()` hook provides the token
3. Client sends `Authorization: Bearer <token>` header
4. HTTP action calls `ctx.auth.getUserIdentity()`
5. If null, returns 401 UNAUTHORIZED
6. If valid, proceeds with Runner Object lookup and AI call

#### 6. Error Handling Strategy

| Error Type | HTTP Status | Code | Handling |
|------------|-------------|------|----------|
| No auth header | 401 | UNAUTHORIZED | Client shows login |
| Invalid token | 401 | UNAUTHORIZED | Client refreshes auth |
| Invalid JSON body | 400 | INVALID_REQUEST | Client shows error |
| Missing messages | 400 | INVALID_REQUEST | Client shows error |
| OpenAI timeout | 504 | LLM_TIMEOUT | Client can retry |
| Rate limited | 429 | RATE_LIMITED | Client waits |
| Other OpenAI error | 500 | LLM_ERROR | Client shows fallback |

Client-side reconnection:
- Network errors: Retry with exponential backoff (1s, 2s, 4s)
- Auth errors: Don't retry (401, 403)
- Rate limits: Don't retry immediately (429)

### Testing Guide

#### Prerequisites

1. **Set OpenAI API Key in Convex:**
   ```bash
   cd packages/backend
   npx convex env set OPENAI_API_KEY sk-your-key-here
   ```

2. **Start Convex Dev Server:**
   ```bash
   cd packages/backend
   pnpm dev
   ```
   Note the Convex deployment URL (e.g., `https://your-deployment.convex.cloud`)

3. **Ensure a User Exists:**
   - Sign in via the native app or web app
   - The Runner Object should be auto-created on first login

#### Test 1: Backend Typecheck

Verify all backend files compile:
```bash
cd packages/backend
pnpm typecheck
```

**Expected:** Only pre-existing strava.ts errors (unrelated to this story). No errors in `convex/ai/*` files.

#### Test 2: Convex Schema Deployment

Deploy schema changes:
```bash
cd packages/backend
npx convex dev
```

**Expected:** Schema deploys successfully with `conversations` and `messages` tables.

#### Test 3: HTTP Endpoint via cURL

Test the streaming endpoint directly (requires valid auth token):

```bash
# Get your Convex site URL (replace .cloud with .site)
CONVEX_SITE="https://your-deployment.convex.site"

# Get auth token from browser DevTools > Application > Local Storage > convex auth token
AUTH_TOKEN="your-auth-token"

# Test the endpoint
curl -X POST "$CONVEX_SITE/api/ai/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"messages":[{"role":"user","content":"Hello coach!"}]}' \
  --no-buffer
```

**Expected Output (SSE format):**
```
0:"Hello"
0:"!"
0:" I"
0:"'m"
0:" excited"
...
9:{"toolCallId":"call_xxx","toolName":"renderMultipleChoice","args":{...}}
d:{"finishReason":"tool-calls"}
```

#### Test 4: Auth Validation

Test without auth token:
```bash
curl -X POST "$CONVEX_SITE/api/ai/stream" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

**Expected:** `401 {"code":"UNAUTHORIZED","message":"Missing or invalid authorization header"}`

Test with invalid token:
```bash
curl -X POST "$CONVEX_SITE/api/ai/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

**Expected:** `401 {"code":"UNAUTHORIZED","message":"Invalid authentication token"}`

#### Test 5: Invalid Request Handling

Test with missing messages:
```bash
curl -X POST "$CONVEX_SITE/api/ai/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{}'
```

**Expected:** `400 {"code":"INVALID_REQUEST","message":"Messages array is required"}`

Test with invalid JSON:
```bash
curl -X POST "$CONVEX_SITE/api/ai/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d 'not-json'
```

**Expected:** `400 {"code":"INVALID_REQUEST","message":"Invalid JSON body"}`

#### Test 6: Tool Call Generation

Send a message that should trigger a tool call:
```bash
curl -X POST "$CONVEX_SITE/api/ai/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"messages":[{"role":"user","content":"I want to start running and get in shape"}]}' \
  --no-buffer
```

**Expected:** Stream should include:
- Text content (greeting, context-setting)
- Tool call (`9:{"toolCallId":"...","toolName":"renderMultipleChoice",...}`)
- Tool should have `targetField` like `"running.experienceLevel"`

#### Test 7: Native App Integration (Manual)

1. Add test component to native app:

```typescript
// apps/native/src/app/(onboarding)/ai-test.tsx
import { useAIChat } from "@/hooks/use-ai-chat";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import { useState } from "react";

export default function AITest() {
  const [input, setInput] = useState("");
  const { messages, isStreaming, sendMessage, error } = useAIChat({
    onToolCall: (tc) => console.log("Tool call:", tc.toolName, tc.args),
  });

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <ScrollView style={{ flex: 1 }}>
        {messages.map((m) => (
          <View key={m.id} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: "bold" }}>{m.role}:</Text>
            <Text>{m.content}</Text>
            {m.parts.filter(p => p.type === "tool-call").map((p, i) => (
              <Text key={i} style={{ color: "blue" }}>
                [Tool: {p.toolName}]
              </Text>
            ))}
          </View>
        ))}
        {isStreaming && <Text>Streaming...</Text>}
        {error && <Text style={{ color: "red" }}>{error.message}</Text>}
      </ScrollView>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Send" onPress={() => { sendMessage(input); setInput(""); }} />
    </View>
  );
}
```

2. Run the native app:
```bash
cd apps/native
pnpm start
```

3. Navigate to the test screen and:
   - Send "Hello"
   - Verify streaming text appears
   - Send "I want to run a marathon"
   - Verify tool call appears (renderMultipleChoice with goal options)

#### Test 8: System Prompt Verification

Check Convex logs for system prompt content:
1. Open Convex Dashboard
2. Go to Logs
3. Send a message via the endpoint
4. Verify Runner Object context is included in the request

#### Test 9: Conversation Persistence (Optional)

After sending messages, check the database:
1. Open Convex Dashboard > Data
2. Check `conversations` table for new entry
3. Check `messages` table for stored messages

**Note:** Message persistence is prepared but not actively used until Story 2.2+ implements the full conversation flow.

#### Verification Checklist

| Test | Status | Notes |
|------|--------|-------|
| Backend typecheck passes | ☐ | Only pre-existing errors allowed |
| Schema deploys | ☐ | conversations + messages tables |
| Endpoint returns SSE stream | ☐ | Text deltas stream correctly |
| Auth validation works | ☐ | 401 for missing/invalid token |
| Invalid request handling | ☐ | 400 for bad JSON/missing messages |
| Tool calls appear in stream | ☐ | renderMultipleChoice triggered |
| Native hook connects | ☐ | useAIChat returns messages |
| Streaming updates UI | ☐ | Real-time text appearance |

### File List

**Created:**
- packages/backend/convex/ai/http-action.ts
- packages/backend/convex/ai/messages.ts
- packages/backend/convex/ai/tools/index.ts
- packages/backend/convex/ai/prompts/onboarding-coach.ts
- apps/native/src/hooks/use-ai-chat.ts
- apps/native/src/lib/ai-stream.ts

**Modified:**
- packages/backend/package.json (added ai, @ai-sdk/openai dependencies)
- packages/backend/convex/http.ts (added AI streaming route)
- packages/backend/convex/schema.ts (added conversations, messages tables)

### Change Log

- 2026-02-14: Story 2.1 implemented - AI SDK Integration & Streaming Infrastructure
