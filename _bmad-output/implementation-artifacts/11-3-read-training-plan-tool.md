# Story 11.3: Read Training Plan Structure Tool

Status: ready-for-dev

---

## Story

As a runner,
I want the coach to understand my overall plan structure -- phases, weekly targets, and the big picture,
so that the coach can explain where I am in my training cycle and make plan-aware decisions.

---

## Acceptance Criteria

### AC 1: Tool Definition

**Given** the AI coach tool registry exists
**When** the `readTrainingPlan` tool is defined
**Then** it uses `tool()` from `ai` SDK with a Zod input schema accepting no arguments (empty `z.object({})`)
**And** its description states: "Read the authenticated runner's active training plan. Returns plan metadata, season view, weekly plan structure, runner snapshot, and computed current week/phase. Use when the user asks about their overall plan, training phases, goals, or when you need plan context to make intelligent session modification proposals."
**And** the tool is registered in the combined tool registry so it is available to `streamText`

### AC 2: RBAC Enforcement

**Given** a user is authenticated
**When** the `readTrainingPlan` tool executes
**Then** it calls `getAuthUserId` to get the authenticated user ID
**And** queries the `runners` table via `by_userId` index to get the runner document
**And** queries `trainingPlans` via `by_runnerId` index filtering by `status === "active"`
**And** returns only the plan belonging to that runner (ownership enforced by index query)
**And** returns `null` if no authenticated user, no runner profile, or no active plan exists

**Given** a user has no active plan
**When** the tool executes
**Then** it returns `{ plan: null }` (no fallback to draft/paused/completed plans)

### AC 3: Current Phase Derivation

**Given** an active plan with `startDate` and `weeklyPlan` array
**When** the tool computes current position
**Then** it calculates `currentWeek` as `Math.floor((Date.now() - plan.startDate) / (7 * 24 * 60 * 60 * 1000)) + 1`
**And** clamps it to range `[1, plan.durationWeeks]` (returns `null` if outside range)
**And** looks up the matching `weeklyPlan` entry by `weekNumber === currentWeek`
**And** derives `currentPhase` from that entry's `phaseName` field
**And** derives `currentPhaseWeekNumber` from that entry's `phaseWeekNumber` field
**And** includes `isRecoveryWeek` from that entry

**Given** the current date is before `startDate` or after `endDate`
**When** the tool computes current position
**Then** `currentWeek` is `null` and `currentPhase` is `null`

### AC 4: Coach Prompt Update

**Given** the Coach OS prompt in `coach_os.ts`
**When** the `readTrainingPlan` tool is available
**Then** a new `READ_TOOL_INSTRUCTIONS` section is added to the prompt
**And** it describes: "Use `readTrainingPlan` when the user asks about their overall plan, training phases, goals, or when you need plan context to make intelligent session modification proposals"
**And** the section is inserted into `buildCoachOSPrompt` return template between `ACTION_TOOL_INSTRUCTIONS` and `CONVERSATION_RULES`

---

## Tasks / Subtasks

### Task 1: Create Read Tools Module (AC 1, AC 2, AC 3)

**File:** `packages/backend/convex/ai/tools/reads.ts` (new file)

1.1. Create `packages/backend/convex/ai/tools/reads.ts` with the `readTrainingPlan` tool definition using `tool()` from `ai` SDK and `z` from `zod`.

1.2. Define the tool with an empty input schema (`z.object({})`) and a description per AC 1.

1.3. The tool itself is a **definition only** (like `actions.ts`). It defines the schema the LLM sees. The actual data-fetching happens server-side before the LLM call (see Task 2).

1.4. Export `readTools` object containing `readTrainingPlan`.

### Task 2: Implement Server-Side Data Fetcher (AC 2, AC 3)

**File:** `packages/backend/convex/training/queries.ts`

2.1. Add a new query `getActivePlanForCoach` that:
- Takes no args (uses auth context)
- Calls `getAuthUserId(ctx)` to get user ID
- Queries `runners` via `by_userId` index
- Queries `trainingPlans` via `by_runnerId` index with `.filter(q => q.eq(q.field("status"), "active"))` (same pattern as existing `getActivePlanForRunner`)
- Returns the full plan structure needed by the coach

2.2. Compute `currentWeek` and `currentPhase` inline in the query handler:
```typescript
const now = Date.now();
const msPerWeek = 7 * 24 * 60 * 60 * 1000;
const rawWeek = Math.floor((now - plan.startDate) / msPerWeek) + 1;
const currentWeek = (rawWeek >= 1 && rawWeek <= plan.durationWeeks) ? rawWeek : null;
const currentWeekEntry = currentWeek
  ? plan.weeklyPlan.find(w => w.weekNumber === currentWeek)
  : null;
```

2.3. Return shape:
```typescript
{
  // Plan metadata
  name: string;
  goalType: string;
  targetEvent: string | null;
  targetDate: number | null;       // Unix ms
  targetTime: number | null;       // seconds
  startDate: number;
  endDate: number;
  durationWeeks: number;
  status: string;

  // Season view (macro)
  seasonView: {
    coachSummary: string;
    periodizationJustification: string;
    keyMilestones: Array<{ weekNumber: number; milestone: string; significance: string }>;
    identifiedRisks: Array<{ risk: string; mitigation: string; monitoringSignals: string[] }>;
    expectedOutcomes: {
      primaryGoal: string;
      confidenceLevel: number;
      confidenceReason: string;
      secondaryOutcomes: string[];
    };
  };

  // Weekly plan (meso)
  weeklyPlan: Array<{
    weekNumber: number;
    phaseName: string;
    phaseWeekNumber: number;
    volumeKm: number;
    intensityScore: number;
    isRecoveryWeek: boolean;
    weekLabel: string | null;
    keySessions: number;
    easyRuns: number;
    restDays: number;
    weekFocus: string;
  }>;

  // Runner snapshot
  runnerSnapshot: {
    capturedAt: number;
    profileRadar: Array<{ label: string; value: number; uncertain: boolean }>;
    fitnessIndicators: {
      estimatedVdot: number | null;
      recentVolume: number | null;
      consistencyScore: number | null;
    };
    planInfluencers: string[];
  };

  // Computed current position (AC 3)
  currentWeek: number | null;
  currentPhase: string | null;
  currentPhaseWeekNumber: number | null;
  isRecoveryWeek: boolean | null;

  // Optional: periodization model and phases for context
  periodizationModel: string | null;
  phases: Array<{ name: string; startWeek: number; endWeek: number; focus: string }> | null;
}
```

### Task 3: Wire Read Tool into Tool Registry (AC 1)

**File:** `packages/backend/convex/ai/tools/index.ts`

3.1. Import `readTools` from `./reads`.

3.2. Export `readTools` alongside `uiTools` and `actionTools`.

3.3. Add `readTools` to the combined `tools` object:
```typescript
export const tools = {
  ...uiTools,
  ...actionTools,
  ...readTools,
};
```

### Task 4: Wire Read Tool into HTTP Action (AC 1, AC 2)

**File:** `packages/backend/convex/ai/http_action.ts`

4.1. Import `readTools` from `./tools`.

4.2. In the `streamChat` handler, add a call to `getActivePlanForCoach` in the `Promise.all` block (line ~242):
```typescript
const [user, runner, providers, upcomingSessions, activePlan] = await Promise.all([
  ctx.runQuery(api.table.users.currentUser, {}),
  ctx.runQuery(api.table.runners.getCurrentRunner, {}),
  ctx.runQuery(api.integrations.connections.getConnectedProviders, {}),
  ctx.runQuery(api.training.queries.getUpcomingSessions, {}),
  ctx.runQuery(api.training.queries.getActivePlanForCoach, {}),
]);
```

4.3. Create server-side tool execution for `readTrainingPlan`. Unlike action tools (which are proposal-only), read tools need **server-side execution** that returns data to the LLM. Override the tool's `execute` function to return the pre-fetched `activePlan` data:
```typescript
const readTrainingPlanWithData = tool({
  ...readTools.readTrainingPlan,
  execute: async () => activePlan ?? { plan: null },
});
```

4.4. Add `readTrainingPlanWithData` to the `allTools` object passed to `streamText`:
```typescript
const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, readTrainingPlan: readTrainingPlanWithData, ...memoryTools };
```

4.5. Pass `activePlan` to `buildCoachOSPrompt` if desired as passive context (optional -- the tool call is the primary mechanism).

### Task 5: Update Coach OS Prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

5.1. Add a new `READ_TOOL_INSTRUCTIONS` constant:
```typescript
const READ_TOOL_INSTRUCTIONS = `## Read Tools (Training Data Access)
You can read the runner's training data on-demand using these tools. They execute server-side and return data directly to you.

- **readTrainingPlan**: Read the runner's active training plan structure. Returns plan metadata (name, goal, target date), season view (coach summary, periodization, milestones, risks), weekly plan array with phase/volume/intensity per week, runner snapshot (fitness indicators, radar profile), and computed current week/phase position. Use when the user asks about their overall plan, training phases, goals, or when you need plan context to make intelligent session modification proposals.

### Rules for Read Tools
1. **Call before answering plan questions** -- always read the plan before discussing phases, goals, volume, or training structure
2. **Cache within conversation** -- if you already called readTrainingPlan in this conversation turn, don't call it again
3. **Handle null gracefully** -- if the tool returns null, the runner has no active plan; suggest creating one or acknowledge the gap
4. **Combine with session context** -- use plan data together with the Upcoming Sessions list for complete picture`;
```

5.2. Insert `${READ_TOOL_INSTRUCTIONS}` in the `buildCoachOSPrompt` return template, between `${ACTION_TOOL_INSTRUCTIONS}` and `${CONVERSATION_RULES}`:
```typescript
return `${PERSONA}

${VOICE_INSTRUCTIONS[coachingStyle] ?? VOICE_INSTRUCTIONS.encouraging}

${MEMORY_TOOL_INSTRUCTIONS}

${UI_TOOL_INSTRUCTIONS}

${ACTION_TOOL_INSTRUCTIONS}

${READ_TOOL_INSTRUCTIONS}

${CONVERSATION_RULES}

## Runner Profile
${runnerProfile || "No runner profile available yet."}

${sessionContext}

${memoryContext}`;
```

### Task 6: Tests

6.1. **Unit test for current week/phase derivation** -- test the calculation logic with:
- Plan midway through (e.g., week 6 of 12)
- Plan not yet started (currentWeek should be null)
- Plan completed (past endDate, currentWeek should be null)
- Edge case: exactly on week boundary

6.2. **Unit test for RBAC** -- verify `getActivePlanForCoach` returns null for:
- Unauthenticated user
- User with no runner profile
- Runner with no active plan

6.3. **Integration test** -- verify the tool returns correct shape when an active plan exists.

---

## Dev Notes

### Architecture Decision: Pre-fetched Read Tool vs. Convex Query Tool

The existing action tools (reschedule, modify, swap, skip) are **proposal-only** -- they produce data for confirmation cards but don't execute mutations. The LLM calls the tool, the tool returns proposal data, and the frontend renders a card.

Read tools work differently. The LLM calls `readTrainingPlan`, and the tool must **execute server-side** and return actual data to the LLM so it can reason about it. This means the tool needs an `execute` function.

**Recommended pattern:** Pre-fetch the plan data in the `Promise.all` block at the start of `streamChat`, then provide it to the tool's `execute` function via closure. This avoids giving the LLM direct database access while keeping the RBAC enforcement in the Convex query layer.

### RBAC Pattern (from `actionMutations.ts`)

```typescript
// Standard RBAC: getAuthUserId -> query runners by_userId -> use runnerId for data access
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

For the read query, use the softer pattern from `getUpcomingSessions` (return null instead of throwing):
```typescript
const userId = await getAuthUserId(ctx);
if (userId === null) return null;
const runner = await ctx.db
  .query("runners")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .first();
if (!runner) return null;
```

### Current Week/Phase Derivation

Existing pattern from `getProgressionChartData` (line 130-133 of `queries.ts`):
```typescript
const now = Date.now();
const planStart = plan.startDate;
const msPerWeek = 7 * 24 * 60 * 60 * 1000;
const currentWeek = Math.floor((now - planStart) / msPerWeek) + 1;
```

Extend this to derive phase from the `weeklyPlan` array:
```typescript
const currentWeekEntry = plan.weeklyPlan.find(w => w.weekNumber === currentWeek);
// currentWeekEntry.phaseName => "Base", "Build", "Peak", "Taper"
// currentWeekEntry.phaseWeekNumber => week within that phase
// currentWeekEntry.isRecoveryWeek => boolean
```

### Plan Schema Key Fields (from `trainingPlans.ts`)

**Indexes available:**
- `by_runnerId` -- `["runnerId"]` -- primary lookup for this tool
- `by_userId` -- `["userId"]`
- `by_status` -- `["userId", "status"]`

**WeeklyPlanItem fields** (the meso-level data the coach needs):
- `weekNumber`, `weekStartDate`, `weekEndDate`
- `phaseName` ("Base", "Build", "Peak", "Taper")
- `phaseWeekNumber` (week within that phase)
- `volumeKm`, `intensityScore` (0-100)
- `isRecoveryWeek`, `weekLabel`
- `keySessions`, `easyRuns`, `restDays`
- `weekFocus`, `weekJustification`

**SeasonView fields** (the macro-level data):
- `coachSummary` (2-3 sentence overview)
- `periodizationJustification`
- `volumeStrategyJustification`
- `keyMilestones[]` (weekNumber, milestone, significance)
- `identifiedRisks[]` (risk, mitigation, monitoringSignals)
- `expectedOutcomes` (primaryGoal, confidenceLevel, confidenceReason, secondaryOutcomes)

**RunnerSnapshot fields:**
- `capturedAt`, `profileRadar[]`, `fitnessIndicators`, `planInfluencers[]`

### Existing Tool Conventions

**Tool definition pattern** (from `actions.ts`):
```typescript
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "...",
  inputSchema: z.object({ ... }),
});
```

**Tool registry pattern** (from `index.ts`):
```typescript
export const tools = {
  ...uiTools,
  ...actionTools,
};
```

**Tool wiring in `http_action.ts`** (line 284-286):
```typescript
const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...memoryTools };
```

### Token Budget Consideration

The full plan object can be large (especially `weeklyPlan` for 16+ week plans). The return shape intentionally omits verbose fields like `weekJustification` and `coachNotes` from the weekly plan to keep token usage reasonable. If token budget becomes an issue, consider returning only the current phase's weeks plus summary data.

### Project Structure Notes

This story establishes the **read tools pattern** for Epic 11. Subsequent stories (11.4, 11.5, etc.) will add more read tools following the same architecture:
1. Tool definition in `reads.ts`
2. Convex query with RBAC in `queries.ts`
3. Pre-fetch in `http_action.ts` `Promise.all`
4. Execute function via closure
5. Prompt instructions in `coach_os.ts`

### References

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/actions.ts` | Action tool definitions (pattern to follow) |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry (add readTools here) |
| `packages/backend/convex/ai/http_action.ts` | HTTP streaming endpoint (wire tool execution) |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Coach system prompt (add READ_TOOL_INSTRUCTIONS) |
| `packages/backend/convex/table/trainingPlans.ts` | Plan schema (field reference) |
| `packages/backend/convex/training/queries.ts` | Existing plan queries (RBAC + currentWeek patterns) |
| `packages/backend/convex/training/actionMutations.ts` | RBAC helper pattern (getAuthenticatedRunner) |
