# Story 11.6: Read Training Load Metrics Tool

Status: ready-for-dev

## Story

As a runner,
I want the coach to know my current training load, fatigue balance, and readiness,
so that the coach can make load-aware decisions about session intensity and volume.

## Acceptance Criteria

### AC 1 -- Tool definition

**Given** the AI coach tool registry exists in `packages/backend/convex/ai/tools/`
**When** the `readTrainingLoad` tool is defined
**Then** it uses `tool()` from `ai` with a Zod schema accepting no arguments
**And** its description clearly explains when to use it (fitness trend, fatigue, freshness, readiness, load context before intensity changes)
**And** the tool returns an object containing:
- `atl` (number) -- acute training load (7-day EWMA)
- `ctl` (number) -- chronic training load (42-day EWMA)
- `tsb` (number) -- training stress balance (CTL - ATL)
- `trainingLoadTrend` (string) -- "building" | "maintaining" | "declining" | "erratic"
- `readinessScore` (number) -- 0-100 composite
- `readinessFactors` (string[]) -- e.g. ["well_rested", "good_sleep"]
- `injuryRiskLevel` (string) -- "low" | "moderate" | "elevated" | "high"
- `injuryRiskFactors` (string[]) -- e.g. ["Volume increased >50% this week"]
- `overtrainingRisk` (string) -- "none" | "watch" | "caution" | "high"
- `volumeChangePercent` (number) -- week-over-week % change
- `last7DaysVolume` (number) -- km
- `last7DaysRunCount` (number)
- `last28DaysVolume` (number) -- km
- `last28DaysRunCount` (number)
- `consistencyScore` (number) -- 0-100
- `latestRestingHr` (number, optional)
- `latestHrv` (number, optional)
- `latestSleepScore` (number, optional)
- `dataQuality` (string) -- "high" | "medium" | "low" | "insufficient"
- `calculatedAt` (number) -- Unix timestamp ms
- `confidenceSummary` (string) -- human-readable confidence note for the LLM

### AC 2 -- Inference engine integration

**Given** the inference engine at `packages/backend/convex/lib/inferenceEngine.ts` exports `calculateCurrentState(ctx, runnerId)`
**When** the `readTrainingLoad` tool executes
**Then** it calls `calculateCurrentState` with a valid `QueryCtx` and the authenticated runner's `_id`
**And** the inference engine loads Soma activity data (last 60 days) and daily summaries (last 7 days) internally
**And** the tool maps the `CurrentStateCalculation` return value into the flat response schema from AC 1
**And** confidence scores and `dataQuality` from the engine are included in the response

### AC 3 -- RBAC enforcement

**Given** the tool runs as a server-side execution within the HTTP action
**When** the tool handler is invoked
**Then** it resolves the authenticated user via `getAuthUserId(ctx)`
**And** it queries the `runners` table using `by_userId` index to get the runner document
**And** it passes `runner._id` (not a raw userId) to `calculateCurrentState`
**And** the inference engine internally queries Soma using `runner.userId` as the ownership scope
**And** if no authenticated user is found, it returns an error message (not a throw, since tools should return gracefully for the LLM)
**And** if no runner profile exists, it returns a message telling the coach to complete onboarding first

### AC 4 -- Coach prompt update

**Given** the Coach OS prompt is built in `packages/backend/convex/ai/prompts/coach_os.ts`
**When** `readTrainingLoad` is available to the coach
**Then** a `READ_TOOL_INSTRUCTIONS` section is added to the prompt (or appended to existing tool instructions)
**And** it contains: `readTrainingLoad` -- "Use when the user asks about their fitness trend, fatigue, freshness, readiness to train hard, or when you need load context before proposing intensity changes"
**And** the instructions note that this tool accepts no arguments and computes live from activity data

## Tasks / Subtasks

### Task 1: Create read tools module (AC 1)

**File:** `packages/backend/convex/ai/tools/reads.ts` (new file)

1.1. Create `reads.ts` following the same pattern as `actions.ts` -- import `tool` from `ai` and `z` from `zod`.

1.2. Define `readTrainingLoad` tool with:
- `description`: "Read the runner's current training load metrics, fatigue balance, readiness score, injury risk, and recent training patterns. Use when the user asks about their fitness trend, fatigue, freshness, readiness to train hard, or when you need load context before proposing intensity changes. Accepts no arguments -- computes live from the authenticated runner's activity data."
- `inputSchema`: `z.object({})` (empty -- no arguments needed)

1.3. Export `readTools` object containing `readTrainingLoad`.

### Task 2: Implement server-side tool execution (AC 2, AC 3)

**File:** `packages/backend/convex/ai/http_action.ts`

2.1. Import `calculateCurrentState` from `../lib/inferenceEngine`.

2.2. Import `getAuthUserId` from `@convex-dev/auth/server`.

2.3. Import `readTools` from `./tools/reads`.

2.4. Add `readTrainingLoad` to the `allTools` object for the non-onboarding branch (alongside `uiTools`, `actionTools`, `memoryTools`). Since this is a server-executed read tool (not a proposal tool), it needs an `execute` function.

2.5. Define the `readTrainingLoad` tool with an `execute` handler in `http_action.ts` (or a dedicated handler file). The execute function must:
   - Call `getAuthUserId(ctx)` to get the authenticated user
   - Query `runners` table via `by_userId` index
   - If no user/runner, return `{ error: "..." }` gracefully
   - Call `calculateCurrentState(ctx, runner._id)`
   - Map `CurrentStateCalculation` to the flat response object
   - Build a `confidenceSummary` string from `dataQuality.quality`

**IMPORTANT DESIGN DECISION:** The `calculateCurrentState` function requires a `QueryCtx`, but the HTTP action handler receives an `ActionCtx`. Since `ActionCtx` cannot be used as `QueryCtx` directly, the tool execution must use `ctx.runQuery()` to call a Convex query function that wraps `calculateCurrentState`. This means:

2.6. Create a new internal query in `packages/backend/convex/ai/queries.ts` (new file):
```ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { calculateCurrentState } from "../lib/inferenceEngine";

export const computeTrainingLoad = internalQuery({
  args: { runnerId: v.id("runners") },
  handler: async (ctx, args) => {
    return await calculateCurrentState(ctx, args.runnerId);
  },
});
```

2.7. In the HTTP action, the tool execute function calls:
```ts
const result = await ctx.runQuery(internal.ai.queries.computeTrainingLoad, { runnerId: runner._id });
```

2.8. The RBAC check (getAuthUserId + runner lookup) happens in the HTTP action before calling the internal query, so the internal query only receives a verified `runnerId`.

### Task 3: Wire read tools into tool registry (AC 1)

**File:** `packages/backend/convex/ai/tools/index.ts`

3.1. Import and re-export `readTools` from `./reads`.

3.2. Add `readTools` to the combined `tools` export.

### Task 4: Update Coach OS prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

4.1. Add a `READ_TOOL_INSTRUCTIONS` constant:
```
## Read Tools (Data Access)
When you need to access the runner's training data, use these read tools. They compute live from the runner's synced activity data.

- **readTrainingLoad**: Use when the user asks about their fitness trend, fatigue, freshness, readiness to train hard, or when you need load context before proposing intensity changes. Takes no arguments. Returns ATL, CTL, TSB, readiness score, injury risk, recent volume patterns, and data quality indicators.

### Rules for Read Tools
1. **Call before recommending intensity changes** -- always check training load before suggesting harder/easier sessions
2. **Interpret data quality** -- if dataQuality is "low" or "insufficient", caveat your advice accordingly
3. **Don't dump raw numbers** -- translate metrics into coaching language (e.g., "You're carrying some fatigue" instead of "Your TSB is -15")
4. **Combine with session context** -- use training load alongside upcoming sessions to give holistic advice
```

4.2. Add `${READ_TOOL_INSTRUCTIONS}` to the `buildCoachOSPrompt` template string, between `ACTION_TOOL_INSTRUCTIONS` and `CONVERSATION_RULES`.

### Task 5: Integration tests

5.1. Test that `readTrainingLoad` tool definition has empty input schema.
5.2. Test RBAC: unauthenticated request returns error message (not exception).
5.3. Test RBAC: request with no runner profile returns appropriate message.
5.4. Test that `computeTrainingLoad` internal query calls inference engine and returns `CurrentStateCalculation` shape.
5.5. Test that the response mapping produces all expected fields from the AC 1 schema.
5.6. Test Coach OS prompt includes read tool instructions when built for non-onboarding mode.

## Dev Notes

### Key Design Decision: Live Computation vs. Cached State

The runner schema already has a `currentState` field (lines 185-280 of `packages/backend/convex/table/runners.ts`) that stores cached inference results. There are two approaches:

**Option A -- Read cached `runner.currentState`**: Fast, no computation. But may be stale if the cache hasn't been refreshed since the last sync.

**Option B -- Call inference engine live**: Always fresh. Reads Soma data on demand. Takes a QueryCtx, runs EWMA calculations.

**Recommendation: Option B (live computation)**. Reasons:
1. Freshness matters -- the coach needs current data to make safe decisions
2. The inference engine is a pure read (QueryCtx) with no writes, so it's safe to run in a query
3. Soma data queries are indexed, so performance is bounded
4. The `currentState` cache may not exist yet or may be days old
5. Computation is lightweight (60 days of activities, simple EWMA math)

If performance becomes a concern later, we can add a short TTL cache or fall back to `runner.currentState` when it's recent enough.

### ActionCtx vs. QueryCtx Problem

The HTTP action (`streamChat`) runs in an `ActionCtx`. The inference engine's `calculateCurrentState` requires `QueryCtx` (it uses `ctx.db.get` and `ctx.runQuery` for Soma component). Actions cannot directly provide a QueryCtx.

**Solution:** Create an `internalQuery` wrapper (`ai/queries.ts::computeTrainingLoad`) that the action calls via `ctx.runQuery(internal.ai.queries.computeTrainingLoad, ...)`. The RBAC check (auth + runner lookup) happens in the action layer before invoking the query.

### Inference Engine API

**Function:** `calculateCurrentState(ctx: QueryCtx, runnerId: Id<"runners">): Promise<CurrentStateCalculation>`

**Internally loads:**
- Activities from Soma: `ctx.runQuery(components.soma.public.listActivities, { userId, startTime, order: "asc" })` -- last 60 days
- Daily summaries: `ctx.runQuery(components.soma.public.listDaily, { userId, startTime, order: "desc" })` -- last 7 days
- Body data: `ctx.runQuery(components.soma.public.listBody, { userId, startTime, order: "desc" })` -- last 7 days

**Returns `CurrentStateCalculation`:**
```ts
interface CurrentStateCalculation {
  acuteTrainingLoad: InferredValue<number>;       // ATL
  chronicTrainingLoad: InferredValue<number>;      // CTL
  trainingStressBalance: InferredValue<number>;    // TSB
  trainingLoadTrend: InferredValue<TrainingLoadTrend>;
  readinessScore: InferredValue<number>;           // 0-100
  readinessFactors: InferredValue<string[]>;
  last7DaysVolume: InferredValue<number>;           // km
  last7DaysRunCount: InferredValue<number>;
  last28DaysVolume: InferredValue<number>;           // km
  last28DaysRunCount: InferredValue<number>;
  consistencyScore: InferredValue<number>;           // 0-100
  injuryRiskLevel: InferredValue<InjuryRiskLevel>;
  injuryRiskFactors: InferredValue<string[]>;
  overtrainingRisk: InferredValue<OvertrainingRisk>;
  volumeChangePercent: InferredValue<number>;
  volumeWithinSafeRange: InferredValue<boolean>;
  latestRestingHr?: InferredValue<number>;
  latestHrv?: InferredValue<number>;
  latestWeight?: InferredValue<number>;
  latestSleepScore?: InferredValue<number>;
  calculatedAt: number;
  dataQuality: DataQualityMetrics;
}

interface InferredValue<T> {
  value: T;
  confidence: number;       // 0-1
  inferredFrom: string[];   // data source tags
}

interface DataQualityMetrics {
  activitiesCount: number;
  oldestActivityDays: number;
  dailySummariesCount: number;
  quality: "high" | "medium" | "low" | "insufficient";
}
```

### Response Mapping (CurrentStateCalculation -> Tool Output)

The tool flattens `InferredValue<T>` to just `T` for the LLM (confidence data goes into `confidenceSummary`):

```ts
function mapToToolResponse(calc: CurrentStateCalculation) {
  return {
    atl: calc.acuteTrainingLoad.value,
    ctl: calc.chronicTrainingLoad.value,
    tsb: calc.trainingStressBalance.value,
    trainingLoadTrend: calc.trainingLoadTrend.value,
    readinessScore: calc.readinessScore.value,
    readinessFactors: calc.readinessFactors.value,
    injuryRiskLevel: calc.injuryRiskLevel.value,
    injuryRiskFactors: calc.injuryRiskFactors.value,
    overtrainingRisk: calc.overtrainingRisk.value,
    volumeChangePercent: calc.volumeChangePercent.value,
    last7DaysVolume: calc.last7DaysVolume.value,
    last7DaysRunCount: calc.last7DaysRunCount.value,
    last28DaysVolume: calc.last28DaysVolume.value,
    last28DaysRunCount: calc.last28DaysRunCount.value,
    consistencyScore: calc.consistencyScore.value,
    latestRestingHr: calc.latestRestingHr?.value,
    latestHrv: calc.latestHrv?.value,
    latestSleepScore: calc.latestSleepScore?.value,
    dataQuality: calc.dataQuality.quality,
    calculatedAt: calc.calculatedAt,
    confidenceSummary: buildConfidenceSummary(calc),
  };
}

function buildConfidenceSummary(calc: CurrentStateCalculation): string {
  const q = calc.dataQuality;
  if (q.quality === "insufficient") return "Insufficient data for reliable calculations. Need at least 3 activities.";
  if (q.quality === "low") return `Limited data: ${q.activitiesCount} activities over ${q.oldestActivityDays} days. Treat values as rough estimates.`;
  if (q.quality === "medium") return `Moderate data: ${q.activitiesCount} activities over ${q.oldestActivityDays} days. Values are reasonably reliable.`;
  return `Good data: ${q.activitiesCount} activities over ${q.oldestActivityDays} days. Values are reliable.`;
}
```

### RBAC Pattern

Follows the same pattern as `actionMutations.ts`:
```ts
// 1. Get authenticated user
const userId = await getAuthUserId(ctx);
if (!userId) return { error: "Must be authenticated" };

// 2. Get runner by userId
const runner = await ctx.db
  .query("runners")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .first();
if (!runner) return { error: "No runner profile found. Complete onboarding first." };

// 3. Pass runner._id to inference engine (ownership enforced)
const result = await ctx.runQuery(internal.ai.queries.computeTrainingLoad, { runnerId: runner._id });
```

Note: In the HTTP action context, step 2 requires `ctx.runQuery(api.table.runners.getRunnerByUserId, { userId })` or similar, since ActionCtx doesn't have `ctx.db`. The runner is already fetched at the top of `streamChat` -- reuse it.

### Tool Execution in AI SDK

The Vercel AI SDK `tool()` supports an `execute` function for server-side execution. Since `readTrainingLoad` must fetch data server-side (not render a UI card), it needs `execute`. The existing action tools (propose*) do NOT have `execute` -- they render as UI cards. This is the first tool in the codebase that uses server-side execution.

Pattern:
```ts
const readTrainingLoad = tool({
  description: "...",
  inputSchema: z.object({}),
  execute: async () => {
    // This runs server-side during streamText
    // But we need ctx here...
  },
});
```

**Challenge:** The `execute` function does not receive Convex `ctx`. The tool definition happens outside the request handler. 

**Solution:** Define the tool with `execute` inside `streamChat` where `ctx` is in scope, or use a closure pattern. The cleanest approach is to build the read tools dynamically in `http_action.ts`:

```ts
// Inside streamChat handler, after runner is loaded:
const readTrainingLoadWithCtx = tool({
  description: "...",
  inputSchema: z.object({}),
  execute: async () => {
    if (!runner) return { error: "No runner profile found." };
    const calc = await ctx.runQuery(internal.ai.queries.computeTrainingLoad, { runnerId: runner._id });
    return mapToToolResponse(calc);
  },
});

const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...memoryTools, readTrainingLoad: readTrainingLoadWithCtx };
```

This avoids the closure problem and keeps RBAC in the action handler.

### Project Structure Notes

- **New files:**
  - `packages/backend/convex/ai/tools/reads.ts` -- tool schema definition (description + inputSchema only, no execute)
  - `packages/backend/convex/ai/queries.ts` -- internal query wrapping `calculateCurrentState`

- **Modified files:**
  - `packages/backend/convex/ai/http_action.ts` -- wire read tool with execute closure, import internal query
  - `packages/backend/convex/ai/tools/index.ts` -- re-export readTools
  - `packages/backend/convex/ai/prompts/coach_os.ts` -- add READ_TOOL_INSTRUCTIONS

- **Architectural alignment:**
  - Follows the same `tool()` from `ai` + `z` from `zod` pattern as `actions.ts` and `index.ts`
  - RBAC pattern matches `actionMutations.ts` (getAuthUserId -> runner lookup -> ownership)
  - Inference engine call matches its documented API (QueryCtx + runnerId)
  - Coach prompt update follows the same section pattern (const + template interpolation)
  - First read tool establishes the pattern for the rest of Epic 11 (11.1-11.5 stories)

### References

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/actions.ts` | Action tool pattern (tool() + Zod schema) |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry and exports |
| `packages/backend/convex/ai/http_action.ts` | streamChat handler, tool wiring, ctx access |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Coach OS prompt builder |
| `packages/backend/convex/lib/inferenceEngine.ts` | calculateCurrentState function, CurrentStateCalculation type |
| `packages/backend/convex/lib/somaAdapter.ts` | InferenceActivity / InferenceDaily types |
| `packages/backend/convex/table/runners.ts` | Runner schema with currentState field |
| `packages/backend/convex/training/actionMutations.ts` | RBAC pattern (getAuthUserId + getAuthenticatedRunner) |
