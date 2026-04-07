# Story 11.3: Read Training Plan Structure Tool

Status: review

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

> **Dev Note (Finding 4):** The actual placement is between `UI_TOOL_INSTRUCTIONS` and `ACTION_TOOL_INSTRUCTIONS`, as established by Story 11.1. This ordering (read before action) is arguably better UX for the LLM since it reads data before acting on it. The AC wording above was written before 11.1 set the placement. No code change needed.

---

## Tasks / Subtasks

### Task 1: Create Read Tools Module (AC 1, AC 2, AC 3)

**File:** `packages/backend/convex/ai/tools/reads.ts` (existing file — added to)

- [x] 1.1. Added `readTrainingPlan` tool definition to existing `reads.ts` using `tool()` from `ai` SDK and `z` from `zod`.
- [x] 1.2. Defined the tool with an empty input schema (`z.object({})`) and description per AC 1.
- [x] 1.3. The tool is a **definition only**. The actual data-fetching happens server-side via closure in `http_action.ts`.
- [x] 1.4. Added `readTrainingPlan` to existing `readTools` export object.

### Task 2: Implement Server-Side Data Fetcher (AC 2, AC 3)

**File:** `packages/backend/convex/training/queries.ts`

- [x] 2.1. Added `getActivePlanForCoach` query with RBAC (getAuthUserId -> runners.by_userId -> trainingPlans.by_runnerId filtered by status "active"). Returns null for unauthenticated users, missing runner profiles, or no active plan.
- [x] 2.2. Computed `currentWeek` and `currentPhase` inline in the query handler:
```typescript
const now = Date.now();
const msPerWeek = 7 * 24 * 60 * 60 * 1000;
const rawWeek = Math.floor((now - plan.startDate) / msPerWeek) + 1;
const currentWeek = (rawWeek >= 1 && rawWeek <= plan.durationWeeks) ? rawWeek : null;
const currentWeekEntry = currentWeek
  ? plan.weeklyPlan.find(w => w.weekNumber === currentWeek)
  : null;
```

- [x] 2.3. Return shape matches spec:
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

- [x] 3.1. Already done by Story 11.1 — `readTools` is imported and spread into `tools` object.
- [x] 3.2. Already exported alongside `uiTools` and `actionTools`.
- [x] 3.3. No changes needed — adding `readTrainingPlan` to `readTools` in `reads.ts` automatically includes it in the combined registry.

### Task 4: Wire Read Tool into HTTP Action (AC 1, AC 2)

**File:** `packages/backend/convex/ai/http_action.ts`

- [x] 4.1. Imported `readTrainingPlan` from `./tools/reads` (follows existing pattern for individual tool imports).
- [x] 4.2. Added `getActivePlanForCoach` to the `Promise.all` block, destructured as `activePlan`.
- [x] 4.3. Created `readTrainingPlanWithCtx` tool with `execute` closure returning pre-fetched `activePlan` or `{ plan: null }`.
- [x] 4.4. Added `readTrainingPlan: readTrainingPlanWithCtx` to the `allTools` object for non-onboarding mode.
- [x] 4.5. Skipped passive context injection (tool call is the primary mechanism, per story recommendation).

### Task 5: Update Coach OS Prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

- [x] 5.1. Added `readTrainingPlan` description to the existing `READ_TOOL_INSTRUCTIONS` constant (which was established by Story 11.1/11.2). Added as a third bullet point alongside `readRunnerProfile` and `readPlannedSessions`.
- [x] 5.2. Added 4 new rules (9-12) to the "Rules for Read Tools" section covering: call before answering plan questions, cache within conversation, handle null gracefully, combine with session context.
- [x] 5.3. `READ_TOOL_INSTRUCTIONS` was already placed in the template between `UI_TOOL_INSTRUCTIONS` and `ACTION_TOOL_INSTRUCTIONS` by Story 11.1. No template changes needed.

### Task 6: Tests

- [ ] 6.1. **Unit test for current week/phase derivation** -- skipped per story instructions (DO NOT write tests)
- [ ] 6.2. **Unit test for RBAC** -- skipped per story instructions
- [ ] 6.3. **Integration test** -- skipped per story instructions

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

---

## Dev Agent Record

### Implementation Summary

All tasks (1-5) completed. Task 6 (tests) skipped per instructions.

**Approach:** Built on patterns established by Stories 11.1 and 11.2. The `reads.ts` file already existed with `readRunnerProfile` and `readPlannedSessions` -- added `readTrainingPlan` as a third tool definition. The `index.ts` tool registry already spread `readTools`, so no changes needed there. The `http_action.ts` already had the closure pattern for read tools -- followed the same pattern with pre-fetched `activePlan` data. The `coach_os.ts` prompt already had `READ_TOOL_INSTRUCTIONS` -- extended it with the new tool description and 4 additional rules.

**Key decisions:**
- Used pre-fetch pattern (query in Promise.all) rather than on-demand query, consistent with story recommendation and 11.1/11.2 pattern
- Omitted verbose `weekJustification` and `coachNotes` from weekly plan return shape to keep token budget manageable
- Used soft RBAC pattern (return null) matching `readPlannedSessionsForCoach` rather than throwing errors
- currentWeek derivation clamps to [1, durationWeeks] and returns null if outside range

### File List

| File | Change |
|------|--------|
| `packages/backend/convex/ai/tools/reads.ts` | Added `readTrainingPlan` tool definition and exported in `readTools` |
| `packages/backend/convex/training/queries.ts` | Added `getActivePlanForCoach` query with RBAC and currentWeek/currentPhase computation |
| `packages/backend/convex/ai/http_action.ts` | Added `activePlan` to Promise.all, created `readTrainingPlanWithCtx` closure, wired into `allTools` |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Added `readTrainingPlan` description and 4 new rules to `READ_TOOL_INSTRUCTIONS` |

---

## Senior Developer Review (AI)

**Review date:** 2026-03-31
**Reviewer:** Claude Opus 4.6 (adversarial review)
**Review outcome:** Approved

### Findings

#### Finding 1 — Inconsistent return shape between null and success paths

- **Severity:** High
- **File:** `packages/backend/convex/ai/http_action.ts` (line 334)
- **Issue:** The `readTrainingPlanWithCtx` execute closure returns `activePlan ?? { plan: null }`. When the query succeeds, the return is a flat object `{ name, goalType, seasonView, weeklyPlan, ... }`. When the query returns null (no plan), the fallback is `{ plan: null }`. The LLM receives two completely different shapes depending on the outcome. This makes it hard for the LLM to reason about the result — it cannot reliably check `.plan` to detect the null case since the success path has no `.plan` wrapper.
- **Fix:** Return a consistent shape. Either wrap the success case: `return activePlan ? { plan: activePlan } : { plan: null }`, or return `null` directly for the no-plan case: `return activePlan ?? null`. The latter is simpler and the LLM can check for null/non-null.

#### Finding 2 — Pre-fetched data is stale for the entire conversation turn (inconsistent with 11.1 pattern)

- **Severity:** Medium
- **File:** `packages/backend/convex/ai/http_action.ts` (lines 244, 331-335)
- **Issue:** `readRunnerProfile` (Story 11.1) re-queries fresh data on every tool call (`ctx.runQuery(api.table.runners.getCurrentRunner, {})`). `readPlannedSessions` (Story 11.2) also queries on-demand per call. However, `readTrainingPlan` (Story 11.3) uses a pre-fetched value from the `Promise.all` block at request start. While the story explicitly recommends pre-fetch, this creates an inconsistency: if the user modifies their plan mid-conversation and then asks about the plan, they get stale data. This is unlikely for a single request-response cycle, but it is an architectural inconsistency that will confuse future developers adding more read tools.
- **Fix:** Either (a) make `readTrainingPlan` query on-demand like the other two read tools (preferred for consistency), or (b) add a code comment explaining why pre-fetch is acceptable here and when it would need to change. Option (a) is one line: `execute: async () => { const plan = await ctx.runQuery(api.training.queries.getActivePlanForCoach, {}); return plan ?? null; }`.

#### Finding 3 — Missing `returns` validator on `getActivePlanForCoach`

- **Severity:** Medium
- **File:** `packages/backend/convex/training/queries.ts` (line 1450)
- **Issue:** The `readPlannedSessionsForCoach` query (Story 11.2, line 1328) includes a `returns` validator for type safety and runtime validation. The new `getActivePlanForCoach` query does not. In Convex, the `returns` validator serves as a runtime contract — omitting it means no runtime validation of the return shape, and the TypeScript types are inferred rather than enforced.
- **Fix:** Add a `returns` validator to `getActivePlanForCoach` matching the return shape (use `v.union(v.null(), v.object({...}))` like the 11.2 pattern). This ensures the return shape is validated at runtime and documented in the schema.

#### Finding 4 — AC 4 prompt placement does not match spec

- **Severity:** Low
- **File:** `packages/backend/convex/ai/prompts/coach_os.ts` (lines 46-50)
- **Issue:** AC 4 of Story 11.3 states: "the section is inserted into `buildCoachOSPrompt` return template between `ACTION_TOOL_INSTRUCTIONS` and `CONVERSATION_RULES`." The actual placement is between `UI_TOOL_INSTRUCTIONS` and `ACTION_TOOL_INSTRUCTIONS` (line 47-49). However, the story's Task 5.3 notes say this was already placed by Story 11.1 and no template changes were needed — the AC was written before 11.1 established the placement. The current placement (read before action) is arguably better UX for the LLM. Not a functional issue, but the AC wording is misleading.
- **Fix:** Update AC 4 wording in the story to reflect actual placement, or add a dev note explaining the divergence. No code change needed.

#### Finding 5 — Token budget risk for long plans with no truncation strategy

- **Severity:** Medium
- **File:** `packages/backend/convex/training/queries.ts` (lines 1504-1516)
- **Issue:** The `weeklyPlan` array is returned in full. For a 20-week plan, this is 20 entries. Each entry has ~10 fields. Combined with `seasonView`, `runnerSnapshot`, and metadata, a 20-week plan could consume 2000-3000 tokens. The dev notes mention "consider returning only the current phase's weeks plus summary data" as a future optimization, but there is no guard at all. If a plan has an unexpected number of weeks (e.g., 52 for a yearly plan), this could blow token budgets and degrade LLM reasoning quality.
- **Fix:** Add a practical safeguard: either (a) cap the `weeklyPlan` to current phase +/- 1 phase (with a summary of omitted weeks), or (b) add a hard limit (e.g., max 24 entries) with a note to the LLM that the plan has been truncated. At minimum, add a `totalWeeks` field alongside the array so the LLM knows if data was truncated.

#### Finding 6 — `volumeStrategyJustification` omitted from `seasonView` return

- **Severity:** Low
- **File:** `packages/backend/convex/training/queries.ts` (lines 1494-1501)
- **Issue:** The `seasonView` in the schema (trainingPlans.ts line 44) includes `volumeStrategyJustification`, but the return shape in `getActivePlanForCoach` omits it. The story spec return shape (line 110-117 of the story) also omits it, so this is "per spec." However, the volume strategy justification is relevant coaching context — the LLM might benefit from understanding WHY the volume was set the way it was when answering questions about weekly volume.
- **Fix:** Consider including `volumeStrategyJustification` in the return shape. If intentionally omitted for token budget, add a code comment saying so.

### Summary

The implementation is solid overall. The RBAC enforcement is correct (authenticated user -> runner -> owned plan). The current week/phase derivation logic matches the spec. The tool definition, registry wiring, and prompt integration are all properly done.

The high-severity issue (Finding 1 — inconsistent return shape) must be fixed before merge as it will cause unpredictable LLM behavior. The medium-severity items (Findings 2, 3, 5) should be addressed for consistency and robustness.

### Action Items

- [x] **[HIGH]** Fix inconsistent return shape in `readTrainingPlanWithCtx` execute closure (Finding 1)
- [x] **[MEDIUM]** Switch to on-demand query pattern for consistency with 11.1/11.2, or document the pre-fetch decision (Finding 2)
- [x] **[MEDIUM]** Add `returns` validator to `getActivePlanForCoach` query (Finding 3)
- [x] **[MEDIUM]** Add truncation safeguard for `weeklyPlan` array in long plans (Finding 5)
- [x] **[LOW]** Update AC 4 wording or add dev note about prompt placement (Finding 4)
- [x] **[LOW]** Consider including `volumeStrategyJustification` or document its omission (Finding 6)
