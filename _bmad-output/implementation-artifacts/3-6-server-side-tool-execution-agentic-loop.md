# Story 3.6: Server-Side Tool Execution & Agentic Loop

Status: ready-for-dev

---

## Story

As a **developer**,
I want **tool calls to execute server-side and results to flow back to the LLM**,
So that **the conversation actually persists data and continues intelligently**.

---

## Acceptance Criteria

### AC1: Tool Result Endpoint

**Given** the LLM makes a tool call (e.g., renderMultipleChoice)
**When** the user submits their response
**Then** the frontend POSTs the tool result to `/api/ai/tool-result` endpoint
**And** the backend receives: { conversationId, toolCallId, toolName, targetField, value }

### AC2: Tool Execution Handler

**Given** a tool result is received
**When** the backend processes it
**Then** the tool handler executes the appropriate logic:
  - For data-collecting tools: update Runner Object via Convex mutation
  - For confirmation tools: mark field as confirmed
  - For connection tools: trigger OAuth flow or skip

### AC3: Agentic Loop Continuation

**Given** tool execution completes
**When** the result is ready
**Then** the result is formatted according to Vercel AI SDK expectations
**And** the result is sent back through the SSE stream
**And** the AI SDK re-invokes the LLM with the tool result in context

### AC4: Multi-Round Support

**Given** the LLM receives the tool result
**When** it generates the next response
**Then** the agentic loop continues (either more text, more tools, or finish)
**And** up to 5 rounds of tool calling are supported (per existing stepCountIs(5))

### AC5: Error Recovery

**Given** a tool execution fails
**When** an error occurs
**Then** the error is logged
**And** a graceful error response is sent to the client
**And** the conversation can recover

---

## Tasks / Subtasks

- [ ] **Task 1: Create Tool Result HTTP Endpoint** (AC: #1)
  - [ ] Create `packages/backend/convex/ai/tool_result.ts` HTTP action
  - [ ] Accept POST requests with body: `{ conversationId, toolCallId, toolName, targetField, value, inputMethod? }`
  - [ ] Validate auth token (reuse pattern from http_action.ts:24-39)
  - [ ] Validate request body schema with Zod
  - [ ] Route to appropriate tool handler based on toolName

- [ ] **Task 2: Create Tool Handler Registry** (AC: #2)
  - [ ] Create `packages/backend/convex/ai/tool-handlers.ts`
  - [ ] Define ToolHandlerContext type: `{ ctx, userId, runnerId, conversationId }`
  - [ ] Implement handler interface: `(context: ToolHandlerContext, args: ToolArgs) => Promise<ToolResult>`
  - [ ] Create handler map: `Record<ToolName, ToolHandler>`

- [ ] **Task 3: Implement Data-Collecting Tool Handlers** (AC: #2)
  - [ ] `handleMultipleChoice`: Parse value, call updateRunnerField mutation
  - [ ] `handleOpenInput`: Parse and validate value by inputType, update field
  - [ ] `handleVoiceInput`: Store transcription, update field
  - [ ] All handlers record provenance: `{ source: "user_input", inputMethod, timestamp }`

- [ ] **Task 4: Implement Connection Tool Handler** (AC: #2)
  - [ ] `handleConnectionCard`: Route based on provider selection
  - [ ] If provider selected: Return pending status, trigger OAuth flow
  - [ ] If skipped: Call `skipWearableConnection` mutation (already exists)
  - [ ] Return appropriate tool result for conversation continuation

- [ ] **Task 5: Implement Confirmation Tool Handler** (AC: #2)
  - [ ] `handleConfirmation`: Mark fields as confirmed in Runner Object
  - [ ] If user selects "Make changes": Return edit intent for field list
  - [ ] If user confirms: Update fieldsToConfirm, return success

- [ ] **Task 6: Wire Tool Result into Streaming Flow** (AC: #3)
  - [ ] Modify `http_action.ts` to support tool result submission mid-stream
  - [ ] Format tool results per AI SDK spec: `{ toolCallId, toolName, result }`
  - [ ] Ensure SSE stream includes tool result acknowledgment
  - [ ] Verify stepCountIs(5) applies to round-trips

- [ ] **Task 7: Update Frontend to Submit Tool Results** (AC: #1, #3)
  - [ ] Update `apps/native/src/lib/ai-stream.ts` with `submitToolResult` function
  - [ ] Update `apps/native/src/hooks/use-ai-chat.ts` to call submitToolResult
  - [ ] Wire onToolCall callback to component interaction → result submission

- [ ] **Task 8: Error Handling** (AC: #5)
  - [ ] Wrap all handlers in try-catch
  - [ ] Define error codes: `TOOL_EXECUTION_FAILED`, `INVALID_TOOL_RESULT`, `RUNNER_UPDATE_FAILED`
  - [ ] Log errors with context: toolName, toolCallId, userId
  - [ ] Return graceful error result that allows conversation to continue

- [ ] **Task 9: Integration Testing** (AC: #4)
  - [ ] Test multi-round conversation: coach asks → user responds → coach asks follow-up
  - [ ] Test tool chain: multiple tool calls in sequence
  - [ ] Test recovery: failed tool → error response → user retries
  - [ ] Verify 5-round limit is enforced

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from [architecture.md](../planning-artifacts/architecture.md):**

1. **Tool Execution Flow (architecture.md#LLM Integration Architecture):**
   ```
   Mobile Client → Convex HTTP Action → OpenAI (via AI SDK)
                         ↓
                 Stream to client (SSE)
                         +
                 Persist deltas to Convex
                         +
                 Tool calls update Runner Object
   ```

2. **Vercel AI SDK v6.x Tool Results:**
   - Tool results must match AI SDK format: `{ toolCallId, toolName, result }`
   - Results are passed back via `experimental_toolResults` or inline submission
   - SDK handles re-invocation automatically when results provided

3. **Existing Tool Definitions (packages/backend/convex/ai/tools/index.ts:17-175):**
   - All tools define `targetField` for Runner Object mapping
   - Tools: `renderMultipleChoice`, `renderOpenInput`, `renderConfirmation`, `renderVoiceInput`, `renderProgress`, `renderConnectionCard`

### Current Implementation Gap

The streaming endpoint exists at [http_action.ts](../../packages/backend/convex/ai/http_action.ts) but:
- Line 77-82: `onStepFinish` only logs tool calls, doesn't execute them
- No mechanism to receive tool results from client
- No mutations called to update Runner Object

### Tool Handler Implementation Pattern

```typescript
// packages/backend/convex/ai/tool-handlers.ts

import { api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface ToolHandlerContext {
  ctx: ActionCtx;
  userId: Id<"users">;
  runnerId: Id<"runners">;
  conversationId?: string;
}

export interface ToolResultInput {
  toolCallId: string;
  toolName: string;
  targetField: string;
  value: unknown;
  inputMethod?: "selection" | "text" | "voice";
}

export interface ToolResultOutput {
  success: boolean;
  result: unknown;
  error?: string;
}

export async function handleToolResult(
  context: ToolHandlerContext,
  input: ToolResultInput
): Promise<ToolResultOutput> {
  const { ctx, runnerId } = context;
  const { toolName, targetField, value, inputMethod } = input;

  try {
    switch (toolName) {
      case "renderMultipleChoice":
      case "renderOpenInput":
      case "renderVoiceInput":
        // Update runner field
        await ctx.runMutation(api.table.runners.updateRunnerField, {
          runnerId,
          fieldPath: targetField,
          value,
          provenance: {
            source: "user_input",
            inputMethod: inputMethod ?? "selection",
            timestamp: Date.now(),
          },
        });
        return { success: true, result: { updated: targetField, value } };

      case "renderConnectionCard":
        if (value === "skip") {
          await ctx.runMutation(api.table.runners.skipWearableConnection, {});
          return { success: true, result: { action: "skipped" } };
        }
        // OAuth flow trigger would go here
        return { success: true, result: { action: "oauth_pending", provider: value } };

      case "renderConfirmation":
        // Mark fields as confirmed
        return { success: true, result: { confirmed: true } };

      default:
        return { success: false, result: null, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`[ToolHandler] ${toolName} failed:`, error);
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : "Tool execution failed"
    };
  }
}
```

### Tool Result HTTP Endpoint Pattern

```typescript
// packages/backend/convex/ai/tool_result.ts

import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import { z } from "zod";
import { handleToolResult } from "./tool-handlers";

const toolResultSchema = z.object({
  conversationId: z.string().optional(),
  toolCallId: z.string(),
  toolName: z.string(),
  targetField: z.string(),
  value: z.unknown(),
  inputMethod: z.enum(["selection", "text", "voice"]).optional(),
});

export const submitToolResult = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth validation (reuse http_action.ts pattern)
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return new Response(
      JSON.stringify({ code: "UNAUTHORIZED", message: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse and validate body
  let body: z.infer<typeof toolResultSchema>;
  try {
    const raw = await request.json();
    body = toolResultSchema.parse(raw);
  } catch (error) {
    return new Response(
      JSON.stringify({ code: "INVALID_REQUEST", message: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get runner for user
  const runner = await ctx.runQuery(api.table.runners.getCurrentRunner, {});
  if (!runner) {
    return new Response(
      JSON.stringify({ code: "RUNNER_NOT_FOUND", message: "Runner not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Execute tool handler
  const result = await handleToolResult(
    {
      ctx,
      userId: runner.userId,
      runnerId: runner._id,
      conversationId: body.conversationId,
    },
    {
      toolCallId: body.toolCallId,
      toolName: body.toolName,
      targetField: body.targetField,
      value: body.value,
      inputMethod: body.inputMethod,
    }
  );

  // Return result for AI SDK
  return new Response(
    JSON.stringify({
      toolCallId: body.toolCallId,
      toolName: body.toolName,
      result: result.result,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
```

### Frontend Integration Pattern

```typescript
// In ai-stream.ts - add submitToolResult function

export async function submitToolResult(options: {
  convexSiteUrl: string;
  authToken: string;
  toolCallId: string;
  toolName: string;
  targetField: string;
  value: unknown;
  inputMethod?: "selection" | "text" | "voice";
  conversationId?: string;
}): Promise<{ success: boolean; result: unknown }> {
  const url = `${options.convexSiteUrl}/api/ai/tool-result`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.authToken}`,
    },
    body: JSON.stringify({
      toolCallId: options.toolCallId,
      toolName: options.toolName,
      targetField: options.targetField,
      value: options.value,
      inputMethod: options.inputMethod,
      conversationId: options.conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tool result submission failed: ${response.status}`);
  }

  return response.json();
}
```

### HTTP Route Registration

Add to `convex/http.ts`:
```typescript
import { submitToolResult } from "./ai/tool_result";

http.route({
  path: "/api/ai/tool-result",
  method: "POST",
  handler: submitToolResult,
});
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tool-handlers.ts` | Tool execution logic |
| `packages/backend/convex/ai/tool_result.ts` | HTTP action for tool results |

**Files to Modify:**

| File | Change |
|------|--------|
| `packages/backend/convex/http.ts` | Add `/api/ai/tool-result` route |
| `packages/backend/convex/table/runners.ts` | Add `updateRunnerField` mutation |
| `apps/native/src/lib/ai-stream.ts` | Add `submitToolResult` function |
| `apps/native/src/hooks/use-ai-chat.ts` | Integrate tool result submission |

**Dependencies:**

| Package | Status | Notes |
|---------|--------|-------|
| `ai` | Installed | Vercel AI SDK v6.x |
| `@ai-sdk/openai` | Installed | OpenAI provider |
| `zod` | Installed | Request validation |

### Testing Workflow

1. **Manual Testing:**
   - Start conversation, coach greets user
   - Coach calls renderMultipleChoice with question
   - User selects option in UI
   - Verify tool result submitted to backend
   - Verify Runner Object updated
   - Verify coach continues with next question

2. **Edge Cases:**
   - Network failure during submission → retry
   - Invalid tool result → error response
   - Runner not found → 404 error
   - Auth expired → 401 error

3. **TypeScript:**
   - All handlers typed with ToolResultInput/Output
   - `tsc --noEmit` passes

### References

- [Source: architecture.md#LLM Integration Architecture] - Streaming pattern
- [Source: architecture.md#Tool Execution Flow] - Tool → Runner Object
- [Source: http_action.ts:77-82] - Current onStepFinish stub
- [Source: tools/index.ts:17-175] - Tool definitions
- [Source: table/runners.ts:497-551] - updateRunner mutation pattern
- [Source: epics.md#Story 3.6] - Acceptance criteria

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
