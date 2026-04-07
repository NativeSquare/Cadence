# Story 11.1: Read Runner Profile Tool

Status: review

## Story

As a runner,
I want the coach to access my full profile and fitness metrics when I ask about my current state,
so that the coach can give me specific, data-backed answers about my fitness, zones, and risk factors.

## Acceptance Criteria

### AC 1 — Tool Definition

**Given** the AI tool registry exists in `packages/backend/convex/ai/tools/`
**When** a new `readRunnerProfile` tool is defined
**Then** it:
- Uses `tool()` from `"ai"` with a Zod input schema (accepting no arguments — empty `z.object({})`)
- Has a `description` that clearly explains it returns the runner's full profile including identity, running experience, goals, schedule, health, coaching preferences, physical stats, inferred metrics, and currentState (ATL, CTL, TSB, readiness, risk, pace zones, HR zones)
- Is exported from a new file `packages/backend/convex/ai/tools/reads.ts` and re-exported via `tools/index.ts`
- Is included in the `allTools` object passed to `streamText()` in `http_action.ts` for post-onboarding conversations

### AC 2 — RBAC Enforcement

**Given** a user is chatting with the coach
**When** the LLM invokes the `readRunnerProfile` tool
**Then** the tool execution:
- Calls `getAuthUserId(ctx)` to get the authenticated user ID
- Queries `runners` table using the `by_userId` index with that user ID
- Returns ONLY that user's runner document (never another user's data)
- Throws a `ConvexError` with code `"UNAUTHORIZED"` if `getAuthUserId` returns null
- Throws a `ConvexError` with code `"NOT_FOUND"` if no runner document exists for that user

### AC 3 — Coach OS Prompt Update

**Given** the Coach OS prompt is built in `coach_os.ts`
**When** the prompt includes tool instructions
**Then** a new `READ_TOOL_INSTRUCTIONS` section is added that:
- Lists `readRunnerProfile` with a clear description of when to use it (e.g., "when the runner asks about their fitness, zones, metrics, risk factors, or current training state")
- Instructs the coach to reference specific field values from the result in its response (not generic advice)
- Instructs the coach to acknowledge data gaps honestly when fields are missing or `dataQuality` is low
- Is inserted into the prompt template between `ACTION_TOOL_INSTRUCTIONS` and `CONVERSATION_RULES`

### AC 4 — Streaming Integration

**Given** the coach is in a post-onboarding conversation
**When** the LLM calls `readRunnerProfile` during streaming
**Then**:
- The tool executes server-side within the `httpAction` context (NOT as a client-side tool — it runs inside the streaming loop)
- The tool result is returned as structured data to the LLM, which then generates a natural language response referencing specific fields
- The conversation continues naturally — the user sees the coach's interpretation, not raw JSON
- The tool call is logged via the existing `onStepFinish` callback

## Tasks / Subtasks

### Task 1: Create Read Tools Registry File (AC 1)

**File:** `packages/backend/convex/ai/tools/reads.ts` (NEW)

- [x] 1.1. Create `reads.ts` following the exact pattern from `actions.ts`:
  - Import `tool` from `"ai"` and `z` from `"zod"`
  - Define `readRunnerProfile` tool with empty input schema and detailed description
  - Export a `readTools` object containing the tool

- [x] 1.2. The tool must be defined as a **server-executed tool** (not a UI-rendering tool). It needs an `execute` function that receives the Convex `ctx` from the httpAction closure. See Task 3 for how this is wired.

### Task 2: Wire Read Tool into Tool Index (AC 1)

**File:** `packages/backend/convex/ai/tools/index.ts`

- [x] 2.1. Import `readTools` from `"./reads"`
- [x] 2.2. Re-export `readTools`
- [x] 2.3. Add `readTools` to the combined `tools` object
- [x] 2.4. Update the `allTools` composition (currently `{ ...uiTools, ...actionTools, ...memoryTools }`) — see Task 3

### Task 3: Integrate Tool Execution in HTTP Action (AC 2, AC 4)

**File:** `packages/backend/convex/ai/http_action.ts`

This is the critical integration point. The existing action tools (reschedule, modify, etc.) are "proposal" tools — they return structured data that renders as UI cards, and no server-side execution happens during the stream. The `readRunnerProfile` tool is different: it must **execute server-side** during the streaming loop to fetch data and return it to the LLM.

- [x] 3.1. Import the `readRunnerProfile` tool definition from `tools/reads`

- [x] 3.2. Create a server-executed version of the tool that closes over the `ctx` from the httpAction. The Vercel AI SDK `tool()` supports an `execute` function. Define it like:

```typescript
const readRunnerProfileWithCtx = tool({
  description: readRunnerProfile.description,  // reuse from reads.ts
  parameters: readRunnerProfile.parameters,     // reuse from reads.ts
  execute: async () => {
    // RBAC enforcement (AC 2)
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Must be authenticated" });
    }

    const runner = await ctx.runQuery(api.table.runners.getRunnerByUserId, { userId });
    if (!runner) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Runner profile not found" });
    }

    // Return the full runner object for LLM consumption
    return {
      identity: runner.identity,
      physical: runner.physical ?? null,
      running: runner.running ?? null,
      goals: runner.goals ?? null,
      schedule: runner.schedule ?? null,
      health: runner.health ?? null,
      coaching: runner.coaching ?? null,
      inferred: runner.inferred ?? null,
      currentState: runner.currentState ?? null,
    };
  },
});
```

**IMPORTANT CONTEXT NOTES:**
- Inside `httpAction`, you have access to `ctx` which can call `ctx.runQuery(...)`. You do NOT have direct `ctx.db` access — httpActions cannot query the DB directly. You must use `ctx.runQuery(api.table.runners.getRunnerByUserId, { userId })` or `ctx.runQuery(api.table.runners.getCurrentRunner, {})`.
- The existing code already calls `ctx.runQuery(api.table.runners.getCurrentRunner, {})` at line 248. The `getCurrentRunner` query already handles auth internally and returns null for unauthenticated users. However, for the tool, you want explicit error throwing (not silent null), so either:
  - Option A: Use `getCurrentRunner` and check for null yourself, throwing `ConvexError` — simpler but auth check happens twice (once in query, once in tool).
  - Option B: Use `getRunnerByUserId` with the userId obtained from the identity already verified at line 207-208. Since `identity` is already verified at that point, you know the user is authenticated. The `userId` can be derived from `user._id` (already fetched at line 247).
- **Recommended approach (Option B):** Since the httpAction already verifies auth and fetches the user at lines 207-247, reuse that context. The tool's `execute` function can close over the already-fetched `runner` variable from line 248 — but ONLY if the tool should reflect the state at request start. For freshest data, re-query inside execute.

- [x] 3.3. Add the server-executed tool to `allTools` for post-onboarding:
```typescript
const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...memoryTools, readRunnerProfile: readRunnerProfileWithCtx };
```

- [x] 3.4. The tool result will automatically flow through the AI SDK streaming loop. When the LLM calls `readRunnerProfile`, the `execute` function runs, returns the data, and the LLM receives it as a tool result to formulate its response. No additional SSE plumbing is needed — the existing `streamText` + `toUIMessageStreamResponse` handles this.

### Task 4: Update Coach OS Prompt (AC 3)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

- [x] 4.1. Add a new `READ_TOOL_INSTRUCTIONS` constant:

```typescript
const READ_TOOL_INSTRUCTIONS = `## Read Tools (Data Access)
When the runner asks about their fitness, training metrics, zones, risk factors, or current state, use these tools to fetch their latest data. The tools enforce access control — you can only read the current runner's data.

- **readRunnerProfile**: Fetches the runner's complete profile including:
  - Identity (name)
  - Physical stats (age, weight, height, max HR, resting HR)
  - Running profile (experience, frequency, volume, easy pace)
  - Goals (goal type, race distance, target time, race date)
  - Schedule (available days, blocked days, preferred time)
  - Health (past injuries, current pain, recovery style, sleep, stress)
  - Coaching preferences (voice, data orientation, challenges)
  - Inferred metrics (avg weekly volume, training load trend, estimated fitness, injury risk factors)
  - Current state: ATL, CTL, TSB, readiness score, HR zones, pace zones, injury risk level, volume trends, latest biometrics (resting HR, HRV, weight, sleep score), data quality rating

### Rules for Read Tools
1. **Use when asked** — when the runner asks "how am I doing?", "what's my fitness?", "what are my zones?", "am I at risk?", call the appropriate read tool
2. **Reference specific values** — don't give generic advice. Say "your CTL is 45 and TSB is +8, so you're fresh" not "you seem to be recovering well"
3. **Acknowledge gaps** — if currentState.dataQuality is "low" or "insufficient", tell the runner you have limited data and your assessment may be less accurate
4. **Don't dump raw data** — interpret the numbers in plain language appropriate to their coaching voice preference
5. **Combine with memory** — cross-reference tool results with what you know from past conversations`;
```

- [x] 4.2. Insert `READ_TOOL_INSTRUCTIONS` into the prompt template in `buildCoachOSPrompt`:
```typescript
return `${PERSONA}

${VOICE_INSTRUCTIONS[coachingStyle] ?? VOICE_INSTRUCTIONS.encouraging}

${MEMORY_TOOL_INSTRUCTIONS}

${UI_TOOL_INSTRUCTIONS}

${READ_TOOL_INSTRUCTIONS}

${ACTION_TOOL_INSTRUCTIONS}

${CONVERSATION_RULES}

## Runner Profile
${runnerProfile || "No runner profile available yet."}

${sessionContext}

${memoryContext}`;
```

### Task 5: Verify Streaming Behavior (AC 4)

- [x] 5.1. Confirm that the existing `onStepFinish` callback in `http_action.ts` (line 294-299) will automatically log `readRunnerProfile` tool calls — it already logs all tool calls by name, so no changes needed.

- [x] 5.2. Confirm that `stopWhen: stepCountIs(5)` (line 293) provides enough steps for: user message -> tool call -> tool result -> assistant response. This uses 2 steps of the 5 budget, leaving 3 for additional tool calls (memory writes, UI tools). This should be sufficient.

## Dev Notes

### RBAC Implementation Pattern

The existing RBAC pattern from `actionMutations.ts` (lines 34-50):

```typescript
async function getAuthenticatedRunner(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Must be authenticated" });
  }

  const runner = await ctx.db
    .query("runners")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!runner) {
    throw new ConvexError({ code: "RUNNER_NOT_FOUND", message: "Runner profile not found" });
  }

  return runner;
}
```

**CRITICAL DIFFERENCE for httpAction context:** The `getAuthenticatedRunner` helper above uses `ctx.db.query(...)` which works inside mutations and queries. Inside an `httpAction`, you do NOT have `ctx.db` — you must use `ctx.runQuery(...)` to call an existing query. The `getCurrentRunner` query at `api.table.runners.getCurrentRunner` already handles the auth+lookup pattern and is the correct function to call from within the httpAction.

### Runner Object Fields Available

The full runner document schema (from `table/runners.ts`) includes these top-level sections:

| Section | Key Fields | Notes |
|---------|-----------|-------|
| `identity` | `name`, `nameConfirmed` | Always present |
| `physical` | `age`, `weight`, `height`, `gender`, `maxHr`, `restingHr` | Optional section |
| `running` | `experienceLevel`, `currentFrequency`, `currentVolume`, `easyPace`, `longestRecentRun`, `trainingConsistency` | Optional section |
| `goals` | `goalType`, `raceDistance`, `raceDate`, `targetTime`, `targetPace`, `targetVolume` | Optional section |
| `schedule` | `availableDays`, `blockedDays`, `preferredTime`, `calendarConnected` | Optional section |
| `health` | `pastInjuries`, `currentPain`, `recoveryStyle`, `sleepQuality`, `stressLevel` | Optional section |
| `coaching` | `coachingVoice`, `dataOrientation`, `biggestChallenge`, `skipTriggers` | Optional section |
| `connections` | `calendarConnected`, `stravaConnected`, `wearableConnected`, `wearableType` | Always present |
| `inferred` | `avgWeeklyVolume`, `volumeConsistency`, `easyPaceActual`, `trainingLoadTrend`, `estimatedFitness`, `injuryRiskFactors` | Optional, from wearable analysis |
| `currentState` | See below | Optional, from inference engine |

**`currentState` sub-fields (the key data for this tool):**
- Training load: `acuteTrainingLoad` (ATL), `chronicTrainingLoad` (CTL), `trainingStressBalance` (TSB), `trainingLoadTrend`
- Readiness: `readinessScore`, `readinessFactors`
- Volume: `last7DaysVolume`, `last7DaysRunCount`, `last28DaysVolume`, `last28DaysAvgVolume`, `volumeChangePercent`, `volumeWithinSafeRange`
- Risk: `injuryRiskLevel`, `injuryRiskFactors`, `overtrainingRisk`
- Biometrics: `latestRestingHr`, `latestHrv`, `latestWeight`, `latestSleepScore`, `latestReadinessScore`
- Fitness: `estimatedVdot`, `estimatedMaxHr`, `estimatedRestingHr`
- Zones: `hrZones` (zone1-5 with min/max), `paceZones` (easy, marathon, threshold, interval, repetition)
- Metadata: `lastCalculatedAt`, `dataQuality`

### Existing Tool Architecture

Tools are split by category:
- **UI tools** (`tools/index.ts`): `renderMultipleChoice`, `renderOpenInput`, `renderConfirmation`, etc. — these produce structured data the frontend renders as generative UI components. They have NO `execute` function.
- **Action tools** (`tools/actions.ts`): `proposeRescheduleSession`, etc. — these also have NO `execute` function. They produce proposals that render as action cards. Execution happens via separate frontend-triggered mutations.
- **Memory tools**: Provided by Seshat component via `seshat.getMemoryTools()`. These DO have `execute` functions and run server-side during streaming.
- **Read tools** (NEW — this story): Like memory tools, these need `execute` functions that run server-side. The tool definition (schema + description) lives in `tools/reads.ts`, but the `execute` function must be created inside `http_action.ts` where `ctx` is available.

### How Tool Execution Works in AI SDK

The Vercel AI SDK `tool()` function accepts an optional `execute` property. When provided:
1. LLM decides to call the tool and emits a tool_call
2. AI SDK invokes `execute(args)` server-side
3. The result is sent back to the LLM as a tool_result
4. LLM generates its next response incorporating the tool result
5. All of this happens within the streaming loop — no extra round-trips needed

When `execute` is NOT provided (like current UI/action tools), the tool call is streamed to the client and the LLM does NOT receive a result back — the client handles it.

This distinction is critical: `readRunnerProfile` MUST have an `execute` function so the LLM gets the data back and can reason about it.

### File Naming Conventions

- Tool definitions: `packages/backend/convex/ai/tools/{category}.ts`
- Tool index: `packages/backend/convex/ai/tools/index.ts`
- Prompt builders: `packages/backend/convex/ai/prompts/{prompt_name}.ts`
- HTTP action: `packages/backend/convex/ai/http_action.ts`
- Table schemas/queries: `packages/backend/convex/table/{table_name}.ts`

### Project Structure Notes

- The new `reads.ts` file follows the existing pattern of one file per tool category (`actions.ts` for action tools, `index.ts` for UI tools)
- The tool definition is separated from the execute function because the execute function needs the httpAction `ctx`, which is only available at runtime inside the streaming endpoint
- This pattern (definition in registry file, execution wired in http_action) will be reused for all subsequent read tools in Epic 11 (readPlannedSessions, readTrainingPlan, readActivities, readBiometrics, readTrainingLoad)

### References

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/actions.ts` | Existing action tool definitions — pattern for tool definition structure |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry and exports — where to wire new tools |
| `packages/backend/convex/ai/http_action.ts` | Streaming endpoint — where tool execution is wired with `ctx` |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Coach OS prompt — where to add read tool instructions |
| `packages/backend/convex/table/runners.ts` | Runner table schema — full field inventory, RBAC patterns, `getCurrentRunner` query |
| `packages/backend/convex/training/actionMutations.ts` | RBAC pattern reference — `getAuthenticatedRunner` helper (lines 34-50) |
| `packages/backend/convex/training/queries.ts` | `getUpcomingSessions` query (line 1227) — example of auth + runner lookup pattern |

## Dev Agent Record

### Implementation Summary

All 5 tasks completed. The `readRunnerProfile` tool is fully wired into the AI coach pipeline.

### Implementation Notes

- Used `inputSchema` (not `parameters`) to match AI SDK v6.x API used throughout the codebase
- Used Option A (getCurrentRunner + null check with ConvexError) for RBAC in the tool execute function. This re-queries for freshest data rather than closing over the stale runner from request start.
- The tool definition in `reads.ts` has no `execute` function (schema-only). The `execute` closure is created inside `http_action.ts` where `ctx` is available, matching the pattern described in the story's Dev Notes for read tools vs UI/action tools.
- READ_TOOL_INSTRUCTIONS placed between UI_TOOL_INSTRUCTIONS and ACTION_TOOL_INSTRUCTIONS in the prompt template as specified.

### File List

| File | Action | Description |
|------|--------|-------------|
| `packages/backend/convex/ai/tools/reads.ts` | NEW | Read tool definitions with `readRunnerProfile` tool and `readTools` export |
| `packages/backend/convex/ai/tools/index.ts` | MODIFIED | Added `readTools` import, re-export, and inclusion in combined `tools` object |
| `packages/backend/convex/ai/http_action.ts` | MODIFIED | Added `readRunnerProfileWithCtx` with server-side `execute` closure, wired into `allTools` for post-onboarding |
| `packages/backend/convex/ai/prompts/coach_os.ts` | MODIFIED | Added `READ_TOOL_INSTRUCTIONS` constant and inserted it into the prompt template |

## Senior Developer Review (AI)

**Review Date:** 2026-03-31
**Reviewer:** Claude Opus 4.6 (adversarial review)
**Review Outcome:** Approved

### Findings

#### Finding 1 — RBAC: UNAUTHORIZED vs NOT_FOUND conflated
- **Severity:** High
- **File:** `packages/backend/convex/ai/http_action.ts` (lines 290-295)
- **Issue:** AC 2 explicitly requires two distinct error paths: throw `ConvexError` with code `"UNAUTHORIZED"` if `getAuthUserId` returns null, and throw `ConvexError` with code `"NOT_FOUND"` if no runner document exists. The current implementation uses `getCurrentRunner` which returns `null` for both unauthenticated users AND missing runner profiles. The tool then throws a single `NOT_FOUND` error for both cases. This means an unauthenticated request is misclassified as "profile not found" rather than "unauthorized", which is a security logging concern (cannot distinguish auth failures from data gaps in logs/monitoring) and violates the AC.
- **Fix:** Either (a) call `getAuthUserId` separately via a query before calling `getCurrentRunner`, throwing `UNAUTHORIZED` if null, then throw `NOT_FOUND` if runner is null; or (b) use `getRunnerByUserId` with the `user._id` already available from line 245 (the httpAction already verified auth at line 204-209), adding an explicit null guard for the user before entering the tool. Option B is cleaner since auth is already verified at the httpAction level.

#### Finding 2 — `connections` field omitted from tool return
- **Severity:** Medium
- **File:** `packages/backend/convex/ai/http_action.ts` (lines 297-307)
- **Issue:** The tool return object cherry-picks 9 fields from the runner document but omits `connections` (calendarConnected, stravaConnected, wearableConnected). The story's Dev Notes table explicitly lists `connections` as "Always present" on the runner schema. This data is relevant for the coach to know whether the runner has connected devices (affects data quality interpretation, e.g. "I see you don't have a wearable connected, so I'm working with limited data"). The tool description also mentions it will return the "full profile".
- **Fix:** Add `connections: freshRunner.connections ?? null` to the return object.

#### Finding 3 — Prompt ordering contradicts AC 3
- **Severity:** Medium
- **File:** `packages/backend/convex/ai/prompts/coach_os.ts` (lines 39-58)
- **Issue:** AC 3 states READ_TOOL_INSTRUCTIONS should be inserted "between ACTION_TOOL_INSTRUCTIONS and CONVERSATION_RULES". The actual implementation places it between UI_TOOL_INSTRUCTIONS and ACTION_TOOL_INSTRUCTIONS (line 47-49). While the current ordering is arguably more logical (reads before actions), it directly contradicts the stated AC. The Dev Agent Record even acknowledges this deviation without flagging it as a discrepancy.
- **Fix:** Either (a) update the prompt template to match the AC ordering (READ between ACTION and CONVERSATION_RULES), or (b) update the AC to reflect the chosen ordering. Recommend option (b) since the current ordering is more intuitive (read tools before action tools), but this should be an explicit decision, not a silent deviation.

#### Finding 4 — Static `tools` export in index.ts includes non-executable readTools
- **Severity:** Medium
- **File:** `packages/backend/convex/ai/tools/index.ts` (lines 193-197)
- **Issue:** The `readTools` (containing `readRunnerProfile` without an `execute` function) are spread into the combined `tools` export. This export is available to any importer. If any code path uses this static `tools` object directly with `streamText`, the `readRunnerProfile` tool will be available to the LLM but will have no `execute` function, meaning the LLM will call it and it will be treated as a client-side tool (no result returned to the LLM). The `http_action.ts` correctly overrides this by building `allTools` separately, but the static export is a footgun for future developers.
- **Fix:** Either (a) remove `readTools` from the combined `tools` export in `index.ts` (keep the re-export for individual import but don't spread it into the combined object), or (b) add a clear JSDoc comment on the `tools` export warning that read tools in this object lack `execute` functions and must be wired with ctx in httpAction. Option (a) is safer.

#### Finding 5 — Non-null assertion on description
- **Severity:** Low
- **File:** `packages/backend/convex/ai/http_action.ts` (line 288)
- **Issue:** `readRunnerProfile.description!` uses a non-null assertion. The AI SDK `tool()` return type has `description` typed as `string | undefined`. If someone accidentally removes the description from `reads.ts`, this assertion silently converts `undefined` to a runtime value without type-checking catching it.
- **Fix:** Add a runtime guard or use a fallback: `description: readRunnerProfile.description ?? "Fetch the runner's full profile"`. Alternatively, export the description as a separate constant from `reads.ts` that can be imported with a guaranteed string type.

#### Finding 6 — No error handling around execute function
- **Severity:** Low
- **File:** `packages/backend/convex/ai/http_action.ts` (lines 290-308)
- **Issue:** If `ctx.runQuery(api.table.runners.getCurrentRunner, {})` throws an unexpected error (e.g., Convex internal error, network issue), the exception propagates uncaught into the AI SDK streaming loop. The outer try/catch (line 367) handles ConvexError specifically, but a non-ConvexError from within the tool execute would result in an unstructured error response. NFR-R2 states "If a tool call fails, coach must report the failure gracefully."
- **Fix:** Wrap the execute body in a try/catch that converts unexpected errors into a structured error the LLM can interpret, e.g., return `{ error: "Failed to fetch profile", code: "INTERNAL_ERROR" }` instead of throwing. This lets the LLM tell the user "I had trouble fetching your profile, let me try again" rather than the stream dying.

### Action Items

- [x] **[High]** Fix RBAC enforcement to distinguish UNAUTHORIZED from NOT_FOUND (Finding 1)
- [x] **[Medium]** Add `connections` field to tool return object (Finding 2)
- [x] **[Medium]** Resolve prompt ordering discrepancy with AC 3 — decide and document (Finding 3)
- [x] **[Medium]** Remove `readTools` from the combined static `tools` export in index.ts (Finding 4)
- [x] **[Low]** Remove non-null assertion on description, use fallback or typed constant (Finding 5)
- [x] **[Low]** Add try/catch in execute function for graceful error handling (Finding 6)
