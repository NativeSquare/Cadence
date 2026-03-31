# Story 11.5: Read Biometric Data Tool

Status: ready-for-dev

## Story

As a runner,
I want the coach to access my sleep, HRV, and recovery data,
so that the coach can factor my recovery state into its recommendations.

## Acceptance Criteria

### AC 1 — Tool Definition

**Given** the AI coach tool registry exists at `packages/backend/convex/ai/tools/`
**When** a `readBiometrics` tool is defined
**Then** it has a Zod input schema with:
- `dataType`: required enum `"sleep" | "daily" | "body"`
- `startDate`: optional ISO-8601 date string (e.g. `"2026-03-01"`)
- `endDate`: optional ISO-8601 date string (e.g. `"2026-03-31"`)
- `limit`: optional number (default 7, max 30)

**And** when `dataType` is `"sleep"`, the tool returns an array of objects with:
- `date` (string, YYYY-MM-DD)
- `durationAsleepSeconds` (number | null)
- `deepSleepSeconds` (number | null)
- `lightSleepSeconds` (number | null)
- `remSleepSeconds` (number | null)
- `awakeSeconds` (number | null)
- `sleepEfficiency` (number | null, 0-1)
- `sleepScore` (number | null, 0-100)
- `readiness` (number | null)
- `avgHrBpm` (number | null)
- `avgHrvRmssd` (number | null)
- `isNap` (boolean)

**And** when `dataType` is `"daily"`, the tool returns an array of objects with:
- `date` (string, YYYY-MM-DD)
- `restingHrBpm` (number | null)
- `avgHrvRmssd` (number | null)
- `sleepScore` (number | null)
- `recoveryScore` (number | null)
- `activityScore` (number | null)
- `avgStressLevel` (number | null)
- `steps` (number | null)
- `totalBurnedCalories` (number | null)

**And** when `dataType` is `"body"`, the tool returns an array of objects with:
- `date` (string, YYYY-MM-DD)
- `weightKg` (number | null)
- `bodyFatPercentage` (number | null)
- `bmi` (number | null)
- `restingHrBpm` (number | null)
- `avgHrvRmssd` (number | null)
- `vo2maxMlPerMinPerKg` (number | null)

### AC 2 — Soma Integration

**Given** the Soma client is instantiated via `new Soma(components.soma)`
**When** the tool is called with `dataType: "sleep"`
**Then** it calls `soma.listSleep(ctx, { userId, startTime?, endTime?, order: "desc", limit })`

**When** the tool is called with `dataType: "daily"`
**Then** it calls `soma.listDaily(ctx, { userId, startTime?, endTime?, order: "desc", limit })`

**When** the tool is called with `dataType: "body"`
**Then** it calls `soma.listBody(ctx, { userId, startTime?, endTime?, order: "desc", limit })`

**And** `startTime` and `endTime` are ISO-8601 strings derived from the input `startDate`/`endDate` (appending `T00:00:00Z` and `T23:59:59Z` respectively)

### AC 3 — RBAC Enforcement

**Given** the tool executes inside the `streamChat` HTTP action
**When** `readBiometrics` is called
**Then** the tool's execute function receives the authenticated `userId` (from the runner lookup already performed by the HTTP action)
**And** the `userId` is passed directly to every Soma list call as the `userId` parameter
**And** Soma internally filters all results by this `userId` (no cross-user data leakage is possible)
**And** if no runner exists for the authenticated user, the tool returns `{ error: "No runner profile found" }`

### AC 4 — Coach Prompt Update

**Given** the Coach OS prompt is built in `buildCoachOSPrompt()`
**When** the prompt is assembled
**Then** a new `READ_TOOL_INSTRUCTIONS` section is included that documents the `readBiometrics` tool with:
```
- **readBiometrics**: Access sleep, recovery, HRV, resting heart rate, and body measurements.
  Use when the user asks about their sleep, recovery, HRV, resting heart rate, or when you need
  recovery context before recommending session intensity.
  Accepts: dataType ("sleep", "daily", "body"), optional startDate/endDate (ISO dates), optional limit.
```

## Tasks / Subtasks

### Task 1: Create `readBiometrics` tool definition (AC 1, AC 2, AC 3)

**File:** `packages/backend/convex/ai/tools/reads.ts` (new file)

1.1. Define the Zod input schema with `dataType` enum, optional `startDate`, `endDate`, `limit`.

1.2. Define three transform functions that flatten Soma's nested Terra schema into the coach-friendly shapes described in AC 1:
- `transformSleepForCoach(somaDoc)` — extracts fields from `sleep_durations_data.asleep`, `scores.sleep`, `readiness_data`, `heart_rate_data.summary`, `metadata`
- `transformDailyForCoach(somaDoc)` — extracts from `heart_rate_data.summary`, `scores`, `stress_data`, `distance_data`, `calories_data`, `metadata`
- `transformBodyForCoach(somaDoc)` — extracts from `measurements_data.measurements[0]`, `heart_data.heart_rate_data.summary`, `oxygen_data`, `metadata`

1.3. Define the `readBiometrics` tool using `tool()` from `"ai"` with:
- `description`: "Read biometric data (sleep sessions, daily summaries, body measurements). Use when the user asks about sleep, recovery, HRV, resting heart rate, weight, or when you need recovery context before recommending session intensity."
- `inputSchema`: the Zod schema from 1.1
- `execute`: an async function that receives `{ dataType, startDate, endDate, limit }` and returns the flattened data array

1.4. The `execute` function must be a closure that captures `ctx` (Convex query context) and `userId` — see Task 2 for how these are threaded in.

### Task 2: Wire tool into the HTTP action (AC 2, AC 3)

**File:** `packages/backend/convex/ai/http_action.ts`

2.1. Import `{ createReadTools }` from `./tools/reads`.

2.2. The `readBiometrics` tool needs query-context access and the authenticated userId. Since AI SDK tools execute inside the `streamText` call which runs in an `httpAction`, the tool's `execute` function needs access to `ctx` and the runner's userId. Define a factory function `createReadTools(ctx, userId)` in `reads.ts` that returns `{ readBiometrics }` with the closure capturing ctx and userId.

2.3. In the `streamChat` handler, after the runner is fetched, call `createReadTools(ctx, runner.userId)` and spread the result into `allTools`:
```ts
const readTools = runner ? createReadTools(ctx, runner.userId) : {};
const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...readTools, ...memoryTools };
```

### Task 3: Update tools index (AC 1)

**File:** `packages/backend/convex/ai/tools/index.ts`

3.1. Re-export `createReadTools` from `./reads` for clean imports.

### Task 4: Update Coach OS prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

4.1. Add a new `READ_TOOL_INSTRUCTIONS` constant with the readBiometrics tool description and usage guidance.

4.2. Include `${READ_TOOL_INSTRUCTIONS}` in the prompt template string returned by `buildCoachOSPrompt()`, placed after `ACTION_TOOL_INSTRUCTIONS` and before `CONVERSATION_RULES`.

### Task 5: Manual testing

5.1. Verify the coach can call `readBiometrics` with `dataType: "sleep"` and receives flattened sleep data.
5.2. Verify `dataType: "daily"` returns daily summaries with HRV, resting HR, scores.
5.3. Verify `dataType: "body"` returns body measurements with weight.
5.4. Verify date filtering works (startDate/endDate narrow results).
5.5. Verify that an unauthenticated request returns an error (existing auth guard in httpAction handles this).
5.6. Verify the coach prompt now mentions `readBiometrics`.

## Dev Notes

### Soma Client API

The Soma client is instantiated in each file that needs it:
```ts
import { Soma } from "@nativesquare/soma";
import { components } from "../_generated/api";
const soma = new Soma(components.soma);
```

The three relevant list methods share the same `ListTimeRangeArgs` signature:
```ts
type ListTimeRangeArgs = {
  userId: string;
  startTime?: string;  // ISO-8601 lower bound (inclusive)
  endTime?: string;    // ISO-8601 upper bound (inclusive)
  order?: "asc" | "desc";
  limit?: number;
};
```

- `soma.listSleep(ctx, args)` — returns array of sleep documents
- `soma.listDaily(ctx, args)` — returns array of daily summary documents
- `soma.listBody(ctx, args)` — returns array of body measurement documents

All three accept a `QueryCtx` (the first parameter), which maps to `Pick<GenericQueryCtx<GenericDataModel>, "runQuery">`. In an `httpAction`, `ctx` satisfies this because it has `runQuery`.

### Soma Data Shapes (Source of Truth)

**Sleep** (`packages/soma/src/component/validators/sleep.ts`):
- `metadata.start_time`, `metadata.end_time` (ISO strings)
- `metadata.is_nap` (boolean)
- `sleep_durations_data.asleep.duration_asleep_state_seconds`
- `sleep_durations_data.asleep.duration_deep_sleep_state_seconds`
- `sleep_durations_data.asleep.duration_light_sleep_state_seconds`
- `sleep_durations_data.asleep.duration_REM_sleep_state_seconds`
- `sleep_durations_data.awake.duration_awake_state_seconds`
- `sleep_durations_data.sleep_efficiency` (0-1)
- `scores.sleep` (0-100)
- `readiness_data.readiness` (number)
- `heart_rate_data.summary.avg_hr_bpm`
- `heart_rate_data.summary.avg_hrv_rmssd`

**Daily** (`packages/soma/src/component/validators/daily.ts`):
- `metadata.start_time`, `metadata.end_time` (ISO strings)
- `heart_rate_data.summary.resting_hr_bpm`
- `heart_rate_data.summary.avg_hrv_rmssd`
- `scores.sleep`, `scores.recovery`, `scores.activity`
- `stress_data.avg_stress_level`
- `distance_data.steps`
- `calories_data.total_burned_calories`

**Body** (`packages/soma/src/component/validators/body.ts`):
- `metadata.start_time`, `metadata.end_time` (ISO strings)
- `measurements_data.measurements[0].weight_kg`
- `measurements_data.measurements[0].bodyFat_percentage` (via `bodyfat_percentage`)
- `measurements_data.measurements[0].BMI`
- `heart_data.heart_rate_data.summary.resting_hr_bpm`
- `heart_data.heart_rate_data.summary.avg_hrv_rmssd`
- `oxygen_data.vo2max_ml_per_min_per_kg`

### RBAC Pattern

The RBAC pattern used in `actionMutations.ts` follows:
1. `getAuthUserId(ctx)` — extract auth identity
2. `getAuthenticatedRunner(ctx)` — query runners table by userId, throw if missing
3. Ownership check — verify the resource belongs to the runner

For read tools in `httpAction`, step 1-2 are already done at the top of `streamChat`:
```ts
const runner = await ctx.runQuery(api.table.runners.getCurrentRunner, {});
```
The runner's `userId` (which is the string stored on Soma documents) is then passed into the tool factory. Soma's `listSleep`/`listDaily`/`listBody` all filter by `userId` internally, so cross-user data access is structurally impossible.

### Tool Architecture: Factory Pattern

Unlike action tools (which are pure Zod schemas producing proposals), read tools need runtime access to `ctx` and `userId`. Use a factory function pattern:

```ts
// packages/backend/convex/ai/tools/reads.ts
export function createReadTools(ctx: QueryCtx, userId: string) {
  const soma = new Soma(components.soma);

  const readBiometrics = tool({
    description: "...",
    inputSchema: z.object({
      dataType: z.enum(["sleep", "daily", "body"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().min(1).max(30).default(7).optional(),
    }),
    execute: async ({ dataType, startDate, endDate, limit }) => {
      const args = {
        userId,
        startTime: startDate ? `${startDate}T00:00:00Z` : undefined,
        endTime: endDate ? `${endDate}T23:59:59Z` : undefined,
        order: "desc" as const,
        limit: limit ?? 7,
      };

      switch (dataType) {
        case "sleep": {
          const docs = await soma.listSleep(ctx, args);
          return docs.map(transformSleepForCoach);
        }
        case "daily": {
          const docs = await soma.listDaily(ctx, args);
          return docs.map(transformDailyForCoach);
        }
        case "body": {
          const docs = await soma.listBody(ctx, args);
          return docs.map(transformBodyForCoach);
        }
      }
    },
  });

  return { readBiometrics };
}
```

### Context Type for httpAction

The `httpAction` ctx has `runQuery`, `runMutation`, `runAction` — it satisfies Soma's `QueryCtx` type (`Pick<GenericQueryCtx, "runQuery">`). No adapter needed.

### Coach OS Prompt Addition

Add after `ACTION_TOOL_INSTRUCTIONS`:
```ts
const READ_TOOL_INSTRUCTIONS = `## Read Tools (Data Access)
You can query the runner's biometric data on demand. Use these when you need real data to inform your coaching.

- **readBiometrics**: Access sleep sessions, daily summaries (resting HR, HRV, recovery scores), and body measurements (weight, body fat, VO2max).
  Use when the user asks about their sleep, recovery, HRV, resting heart rate, weight, or when you need recovery context before recommending session intensity.
  Accepts: dataType ("sleep", "daily", "body"), optional startDate/endDate (ISO date strings like "2026-03-25"), optional limit (default 7, max 30).

### Rules for Read Tools
1. **Don't over-fetch** — use date ranges and limits to get only what you need
2. **Summarize, don't dump** — present insights from the data, not raw numbers
3. **Combine data types when useful** — e.g., check both sleep and daily data for a full recovery picture
4. **Be transparent** — tell the runner what data you're looking at when relevant`;
```

### Date Handling

The `startDate`/`endDate` inputs use simple YYYY-MM-DD format (coach-friendly). The tool converts to ISO-8601 by appending time components:
- `startDate "2026-03-25"` → `startTime "2026-03-25T00:00:00Z"`
- `endDate "2026-03-31"` → `endTime "2026-03-31T23:59:59Z"`

### Project Structure Notes

- Read tools go in a new file `reads.ts` alongside `actions.ts` and `index.ts` in `packages/backend/convex/ai/tools/`
- The factory pattern (`createReadTools`) differs from action tools (which are static) because read tools need runtime context
- This pattern scales for future read tools (e.g., `readActivities`, `readTrainingPlan`) — they can be added to the same factory
- The tool re-exports through `index.ts` for clean imports

### References

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/actions.ts` | Existing action tool definitions (pattern reference) |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry and exports |
| `packages/backend/convex/ai/http_action.ts` | streamChat handler where tools are wired to LLM |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Coach OS system prompt |
| `packages/backend/convex/lib/somaAdapter.ts` | Soma data transforms (SomaDaily, SomaBody, SomaActivity interfaces) |
| `packages/soma/src/client/index.ts` | Soma client class — `listSleep`, `listDaily`, `listBody` APIs |
| `packages/soma/src/client/types.ts` | Soma context types (QueryCtx, MutationCtx) |
| `packages/soma/src/component/validators/sleep.ts` | Sleep document schema |
| `packages/soma/src/component/validators/daily.ts` | Daily summary document schema |
| `packages/soma/src/component/validators/body.ts` | Body measurement document schema |
| `packages/soma/src/component/validators/shared.ts` | Shared heartRateData, deviceData validators |
| `packages/soma/src/component/validators/samples.ts` | measurementDataSample validator (weight, BMI, etc.) |
| `packages/backend/convex/training/actionMutations.ts` | RBAC pattern reference (getAuthUserId → getAuthenticatedRunner) |
| `packages/backend/convex/integrations/healthkit/sync.ts` | Soma instantiation pattern in backend |
