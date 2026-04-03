# Story 11.2: Read Planned Sessions Tool

Status: ready-for-dev

## Story

As a runner,
I want the coach to look up my scheduled sessions when I ask about my week or upcoming training,
so that the coach knows exactly what's planned before suggesting changes.

## Acceptance Criteria

### AC 1 — Tool Definition

**Given** the AI tool registry exists in `packages/backend/convex/ai/tools/`
**When** a `readPlannedSessions` tool is defined
**Then** it uses the Vercel AI SDK `tool()` helper with a Zod input schema accepting:
- `weekNumber` (optional number) — filter by plan week number
- `startDate` (optional string, ISO date e.g. `"2026-04-06"`) — inclusive start of date range
- `endDate` (optional string, ISO date e.g. `"2026-04-12"`) — inclusive end of date range
- `status` (optional enum: `"scheduled"` | `"completed"` | `"skipped"` | `"modified"` | `"rescheduled"`) — filter by session status

**And** the tool's `execute` function returns an array of planned session objects containing all user-facing fields:
- `_id` (string — Convex document ID)
- `scheduledDate` (number — Unix timestamp ms)
- `dayOfWeek`, `dayOfWeekShort` (string)
- `sessionType`, `sessionTypeDisplay` (string)
- `targetDurationSeconds` (number | null)
- `targetDurationDisplay` (string)
- `effortLevel` (number | null), `effortDisplay` (string)
- `targetPaceDisplay` (string | null)
- `isKeySession`, `isRestDay`, `isMoveable` (boolean)
- `status` (string)
- `description` (string)
- `justification` (string)
- `structureDisplay` (string | null)
- `weekNumber` (number)
- `physiologicalTarget` (string)
- `placementRationale` (string | null)
- `keyPoints` (string[] | null)

### AC 2 — RBAC Enforcement

**Given** a readPlannedSessions tool call is executed
**When** the tool queries the database
**Then** it calls a Convex query that:
1. Resolves the authenticated user via `getAuthUserId(ctx)`
2. Looks up the runner via `runners.by_userId` index
3. Queries `plannedSessions` using the `by_date` index with `runnerId` equality (ensuring ownership)
4. Applies additional in-memory filters for `weekNumber`, `status`
5. Never returns sessions where `runnerId !== runner._id`

**Given** an unauthenticated request
**When** `getAuthUserId` returns null
**Then** the query returns `null` (same pattern as `getUpcomingSessions`)

### AC 3 — Default Behavior (Current Week)

**Given** the tool is called with no filters (all optional params omitted)
**When** the execute function runs
**Then** it computes the current week boundaries:
- Monday 00:00:00 UTC of the current ISO week
- Sunday 23:59:59 UTC of the current ISO week
**And** uses the `by_date` index to fetch only sessions within that range for the runner
**And** returns them sorted by `scheduledDate` ascending

### AC 4 — Coach Prompt Update

**Given** the Coach OS prompt is built in `buildCoachOSPrompt()`
**When** the `readPlannedSessions` tool is available
**Then** the `ACTION_TOOL_INSTRUCTIONS` (or a new `READ_TOOL_INSTRUCTIONS`) section includes:
```
- **readPlannedSessions**: Use when the user asks about their schedule, upcoming sessions, what's planned for a specific day/week, or before proposing plan changes. Accepts optional filters: weekNumber, startDate, endDate, status.
```

## Tasks / Subtasks

### Task 1: Create the `readPlannedSessions` Convex query (AC 2, AC 3)

**File:** `packages/backend/convex/training/queries.ts`

1.1. Add a new exported query `readPlannedSessionsForCoach` with args:
```ts
args: {
  weekNumber: v.optional(v.number()),
  startDate: v.optional(v.string()),   // ISO date string "YYYY-MM-DD"
  endDate: v.optional(v.string()),     // ISO date string "YYYY-MM-DD"
  status: v.optional(v.string()),      // "scheduled" | "completed" | "skipped" | "modified" | "rescheduled"
},
```

1.2. Implement RBAC: `getAuthUserId` -> query `runners` by `by_userId` index -> get `runner._id`. Return `null` if either is missing.

1.3. Compute date range:
- If `startDate`/`endDate` provided: parse ISO strings to Unix timestamps (start = start of day UTC, end = end of day UTC)
- If neither provided: compute current ISO week Monday-Sunday boundaries
- Use `by_date` index: `.withIndex("by_date", q => q.eq("runnerId", runner._id).gte("scheduledDate", startMs).lte("scheduledDate", endMs))`

1.4. Apply in-memory filters after index query:
- If `weekNumber` provided: `.filter(s => s.weekNumber === args.weekNumber)`
- If `status` provided: `.filter(s => s.status === args.status)`

1.5. Map results to the return shape (all fields listed in AC 1). Sort by `scheduledDate` ascending.

1.6. Define the `returns` validator matching the output shape.

### Task 2: Define the `readPlannedSessions` AI SDK tool (AC 1)

**File:** `packages/backend/convex/ai/tools/reads.ts` (new file)

2.1. Create a new file `reads.ts` alongside `actions.ts` in the tools directory. This establishes a clear separation: `actions.ts` = proposal tools, `reads.ts` = data-reading tools.

2.2. Define the tool using the Vercel AI SDK `tool()` helper:
```ts
import { tool } from "ai";
import { z } from "zod";

export const readPlannedSessions = tool({
  description:
    "Look up the runner's planned training sessions. Use when the user asks about their schedule, upcoming sessions, what's planned for a specific day/week, or before proposing plan changes. Returns session details including type, duration, effort, pace targets, date, status, and coaching justification.",
  inputSchema: z.object({
    weekNumber: z.number().optional().describe("Filter by plan week number (e.g., 3 for week 3)"),
    startDate: z.string().optional().describe("Start of date range as ISO date string, e.g. '2026-04-06'"),
    endDate: z.string().optional().describe("End of date range as ISO date string, e.g. '2026-04-12'"),
    status: z.enum(["scheduled", "completed", "skipped", "modified", "rescheduled"]).optional().describe("Filter by session status"),
  }),
});

export const readTools = {
  readPlannedSessions,
};
```

2.3. Note: This tool has NO `execute` function. Like the existing action tools and UI tools in this codebase, it is a "client-rendered" tool — the LLM calls it, receives the schema-validated args, and the result is handled by the streaming pipeline. However, unlike action tools (which render confirmation cards), this read tool needs server-side execution to return data. See Task 3.

### Task 3: Wire server-side execution for the read tool (AC 1, AC 2)

**File:** `packages/backend/convex/ai/http_action.ts`

3.1. The existing architecture uses `tool()` without `execute` for all tools (UI + action), relying on the AI SDK's tool-call mechanism where tool results are not computed server-side. For read tools, the LLM needs actual data back. Two approaches:

**Option A (Recommended — Tool with execute):** Add an `execute` function to the `readPlannedSessions` tool definition. The execute function calls the Convex query via `ctx.runQuery()`. This requires passing the Convex `ctx` into the tool at construction time.

Modify the tool creation to be a factory function:
```ts
// In reads.ts
export function createReadTools(ctx: any) {
  return {
    readPlannedSessions: tool({
      description: "...",
      inputSchema: z.object({ ... }),
      execute: async (args) => {
        const result = await ctx.runQuery(
          api.training.queries.readPlannedSessionsForCoach,
          {
            weekNumber: args.weekNumber,
            startDate: args.startDate,
            endDate: args.endDate,
            status: args.status,
          }
        );
        return result ?? [];
      },
    }),
  };
}
```

3.2. In `http_action.ts`, update the tool assembly:
```ts
import { createReadTools } from "./tools/reads";

// Inside streamChat handler, after auth is verified:
const readTools = createReadTools(ctx);

const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...readTools, ...memoryTools };
```

3.3. The `ctx` passed here is the `httpAction` context, which has `ctx.runQuery()`. The RBAC is enforced inside the Convex query itself (Task 1.2), so the tool just forwards the call.

### Task 4: Export read tools from the tools index (AC 1)

**File:** `packages/backend/convex/ai/tools/index.ts`

4.1. Add export for the read tools:
```ts
export { createReadTools } from "./reads";
```

4.2. Update the `tools` export to include read tools (if a static export is needed for type inference; runtime assembly happens in `http_action.ts`).

### Task 5: Update Coach OS prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

5.1. Add a new `READ_TOOL_INSTRUCTIONS` constant:
```ts
const READ_TOOL_INSTRUCTIONS = `## Read Tools (Training Data Access)
When you need to look up the runner's training data, use these tools. They return real data from the runner's plan.

- **readPlannedSessions**: Use when the user asks about their schedule, upcoming sessions, what's planned for a specific day/week, or before proposing plan changes. Accepts optional filters: weekNumber, startDate, endDate, status. When called with no filters, returns the current week's sessions (Monday to Sunday).

### Rules for Read Tools
1. **Read before proposing** — always read the current schedule before using action tools to propose changes
2. **Use filters wisely** — if the user asks about "next Tuesday", use startDate/endDate rather than fetching everything
3. **Don't recite raw data** — summarize sessions naturally in conversation, don't dump JSON
4. **Combine with context** — cross-reference read results with the Upcoming Sessions context already in your prompt`;
```

5.2. Insert `${READ_TOOL_INSTRUCTIONS}` into the `buildCoachOSPrompt` return template, after `${ACTION_TOOL_INSTRUCTIONS}`.

## Dev Notes

### RBAC Pattern (Critical)

The RBAC pattern is consistent across the codebase. Follow the exact pattern from `getUpcomingSessions` (line 1249 of `queries.ts`):

```ts
const userId = await getAuthUserId(ctx);
if (userId === null) return null;

const runner = await ctx.db
  .query("runners")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .first();
if (!runner) return null;
```

The `by_date` index on `plannedSessions` is `["runnerId", "scheduledDate"]` — this inherently scopes all queries to the authenticated runner. There is no way to query across runners through this index.

### Index Usage

Available indexes on `plannedSessions`:
- `by_runnerId`: `["runnerId"]` — full scan filtered by runner
- `by_date`: `["runnerId", "scheduledDate"]` — **preferred for date-range queries**
- `by_week`: `["planId", "weekNumber"]` — requires planId, less useful here
- `by_status`: `["runnerId", "status"]` — useful if filtering by status only

For the default "current week" case and date-range queries, use `by_date`. For status-only queries, `by_status` could be used but filtering in-memory after a date-range query is simpler and covers all cases.

### Date Handling for Week Boundaries

Compute ISO week (Monday-start) boundaries in UTC:

```ts
function getCurrentWeekBounds(): { startMs: number; endMs: number } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { startMs: monday.getTime(), endMs: sunday.getTime() };
}
```

### Session Object Shape

The return shape should include all fields the coach needs to reason about sessions. Key fields beyond what `getUpcomingSessions` already returns:
- `justification` — the "why" behind the session, critical for coach reasoning
- `physiologicalTarget` — what training stimulus the session targets
- `placementRationale` — why this specific day
- `keyPoints` — focus areas during the session
- `weekNumber` — so the coach can reference "week 4" etc.
- `targetDurationSeconds` — numeric value for calculations (not just display string)
- `effortLevel` — numeric value for calculations

### Existing Tool Architecture

All current tools (`uiTools` in `index.ts`, `actionTools` in `actions.ts`) are defined WITHOUT `execute` functions — they are "proposal-only" tools where the LLM generates structured args and the frontend handles rendering/execution. The `readPlannedSessions` tool is different: it needs to return actual data to the LLM so it can reason about the runner's schedule. This is the first "server-executed" tool in the system, requiring the factory pattern described in Task 3.

### Tool Registration in http_action.ts

The current flow (lines 284-286 of `http_action.ts`):
```ts
const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...memoryTools };
```

Read tools should only be available in post-onboarding (coach OS) mode, alongside action tools. The `memoryTools` from Seshat already use the execute pattern (they are created via `seshat.getMemoryTools(ctx, { userId })` — a factory that captures `ctx`), so the `createReadTools(ctx)` pattern is consistent.

### Project Structure Notes

```
packages/backend/convex/ai/
  tools/
    index.ts        ← export registry, add createReadTools
    actions.ts      ← existing action (proposal) tools — DO NOT MODIFY
    reads.ts        ← NEW: read tools with execute functions
  prompts/
    coach_os.ts     ← add READ_TOOL_INSTRUCTIONS section
    onboarding_coach.ts ← no changes needed
  http_action.ts    ← wire createReadTools(ctx) into allTools

packages/backend/convex/training/
  queries.ts        ← add readPlannedSessionsForCoach query
```

### References

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/actions.ts` | Existing action tool definitions (pattern reference) |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry and exports |
| `packages/backend/convex/ai/http_action.ts` | Streaming handler, tool wiring, ctx availability |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Coach OS system prompt |
| `packages/backend/convex/table/plannedSessions.ts` | Table schema, indexes, types |
| `packages/backend/convex/training/queries.ts` | Existing queries (`getUpcomingSessions`, `getWeekSessions`, `getMultiWeekSessions`) |
| `packages/backend/convex/training/actionMutations.ts` | RBAC pattern (`getAuthenticatedRunner`, `getOwnedSession`) |
