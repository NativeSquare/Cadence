# Story 11.4: Read Completed Activities Tool

Status: ready-for-dev

## Story

As a runner,
I want the coach to see my actual completed runs -- pace, heart rate, duration, distance,
so that the coach can evaluate how my training is actually going, not just what was planned.

## Acceptance Criteria

### AC 1 -- Tool definition

**Given** the coach tool registry in `packages/backend/convex/ai/tools/`
**When** a new `readActivities` tool is defined with a Zod input schema
**Then** the tool accepts the following optional filters:
  - `startDate` (string, ISO-8601 date, e.g. `"2026-03-01"`) -- lower bound on activity date
  - `endDate` (string, ISO-8601 date, e.g. `"2026-03-31"`) -- upper bound on activity date
  - `limit` (number, default 20, max 50) -- maximum activities to return
**And** the tool description reads: "Use when the user asks about past runs, how a specific session went, training history, or when you need actual performance data to inform recommendations"
**And** the tool returns an array of activity objects with the shape:
```ts
{
  date: string;           // ISO-8601 date (YYYY-MM-DD)
  type: string;           // Activity type label (e.g. "Running", "Walking", "Cycling")
  durationMinutes: number;// Duration in minutes, rounded to 1 decimal
  distanceKm: number;     // Distance in km, rounded to 2 decimals
  avgPaceMinKm: number | null; // Average pace min/km, null if unavailable
  avgHR: number | null;   // Average heart rate BPM
  maxHR: number | null;   // Max heart rate BPM
  cadence: number | null; // Average cadence RPM
  calories: number | null;// Total burned calories
}
```
**And** the tool has an `execute` function (not schema-only like action tools) that runs server-side within the httpAction context

### AC 2 -- Soma integration

**Given** the Soma component is available via `components.soma`
**When** the `readActivities` tool executes
**Then** it calls `ctx.runQuery(components.soma.public.listActivities, { ... })` with:
  - `userId`: the authenticated user ID (string)
  - `startTime`: the `startDate` filter value (or undefined)
  - `endTime`: the `endDate` filter value (or undefined)
  - `limit`: the `limit` filter value (default 20)
  - `order`: `"desc"` (newest first)
**And** maps each raw Soma activity to the clean return shape defined in AC 1
**And** handles missing/optional fields gracefully (returns `null` for unavailable metrics)
**And** returns an empty array with no error if no activities exist for the given range

### AC 3 -- RBAC enforcement

**Given** an authenticated user
**When** `readActivities` executes
**Then** it obtains the user ID via `getAuthUserId` (or equivalent auth context in the httpAction)
**And** passes that userId as the filter to `soma.listActivities` (which indexes by `by_userId_startTime`)
**And** never returns activities belonging to other users
**And** returns an empty array (not an error) if the user has no activities

**Given** an unauthenticated request
**When** `readActivities` would execute
**Then** the httpAction auth guard rejects the request before any tool executes (existing behavior)

### AC 4 -- Coach OS prompt update

**Given** the Coach OS prompt in `packages/backend/convex/ai/prompts/coach_os.ts`
**When** the prompt is rebuilt for a conversation
**Then** it includes `readActivities` in a new "Read Tools" section with the description:
  "Use when the user asks about past runs, how a specific session went, training history, or when you need actual performance data to inform recommendations"
**And** the prompt explains that read tools execute server-side and return real data (unlike action tools which produce proposals)
**And** the prompt instructs the coach to call `readActivities` proactively when it needs performance context (not just when explicitly asked)

## Tasks / Subtasks

### Task 1: Create read tools module (AC 1, AC 2, AC 3)

**File:** `packages/backend/convex/ai/tools/reads.ts` (new file)

1.1. Create `packages/backend/convex/ai/tools/reads.ts` with a factory function `createReadActivitiesTool(ctx)` that accepts the httpAction `ctx` and returns an AI SDK `tool()` definition with an `execute` function.

1.2. Define the Zod input schema:
```ts
z.object({
  startDate: z.string().optional().describe("ISO-8601 start date filter, e.g. '2026-03-01'"),
  endDate: z.string().optional().describe("ISO-8601 end date filter, e.g. '2026-03-31'"),
  limit: z.number().min(1).max(50).default(20).describe("Max activities to return (default 20)"),
})
```

1.3. Implement the `execute` function:
  - Obtain `userId` from the httpAction auth context (it is already validated upstream in `http_action.ts`)
  - Call `ctx.runQuery(components.soma.public.listActivities, { userId, startTime, endTime, limit, order: "desc" })`
  - Map each raw Soma activity through a `transformActivityForCoach()` function
  - Return the mapped array

1.4. Implement `transformActivityForCoach(raw: SomaActivity)` mapping function:
  - `date`: extract from `raw.metadata.start_time` (take YYYY-MM-DD portion)
  - `type`: map `raw.metadata.type` using a readable label map (8 -> "Running", 7 -> "Walking", 1 -> "Cycling", etc.) -- reuse logic from `somaAdapter.ts` but return user-friendly labels
  - `durationMinutes`: compute from `(end_time - start_time) / 60000`, round to 1 decimal
  - `distanceKm`: `raw.distance_data?.summary?.distance_meters / 1000`, round to 2 decimals, or 0
  - `avgPaceMinKm`: `raw.movement_data?.avg_pace_minutes_per_kilometer` or null
  - `avgHR`: `raw.heart_rate_data?.summary?.avg_hr_bpm` or null
  - `maxHR`: `raw.heart_rate_data?.summary?.max_hr_bpm` or null
  - `cadence`: `raw.movement_data?.avg_cadence_rpm` or null
  - `calories`: `raw.calories_data?.total_burned_calories` or null

### Task 2: Wire read tools into httpAction (AC 1, AC 3)

**File:** `packages/backend/convex/ai/http_action.ts`

2.1. Import the factory function: `import { createReadActivitiesTool } from "./tools/reads";`

2.2. Inside the `streamChat` handler, after auth validation and data fetching, create the read tools:
```ts
const readTools = createReadTools(ctx, userId);
```

2.3. Add read tools to the `allTools` object for the coach (non-onboarding) flow:
```ts
const allTools = isOnboarding
  ? { ...uiTools, ...memoryTools }
  : { ...uiTools, ...actionTools, ...readTools, ...memoryTools };
```

### Task 3: Update tool registry exports (AC 1)

**File:** `packages/backend/convex/ai/tools/index.ts`

3.1. Export the read tool factory from the index:
```ts
export { createReadTools } from "./reads";
```

3.2. Update the `ToolName` type to include read tool names (or make it dynamic based on combined tools).

### Task 4: Update Coach OS prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

4.1. Add a new `READ_TOOL_INSTRUCTIONS` constant:
```ts
const READ_TOOL_INSTRUCTIONS = `## Read Tools (Data Access)
These tools execute server-side and return real user data. Use them to access training history and performance metrics. They return actual data — not proposals.

- **readActivities**: Fetch completed activities (runs, walks, rides) with pace, HR, distance, duration, cadence, and calories. Use when the user asks about past runs, how a specific session went, training history, or when you need actual performance data to inform recommendations.
  - Optional filters: startDate (ISO), endDate (ISO), limit (default 20)
  - Returns newest first

### Rules for Read Tools
1. **Call proactively** — if the user asks "how did my long run go?", call readActivities before answering, don't guess
2. **Use date filters** — narrow the query when the user mentions a specific timeframe
3. **Interpret, don't dump** — present the data as coaching insight, not raw numbers
4. **Acknowledge gaps** — if no data is returned, tell the user honestly rather than making up numbers
5. **Combine with context** — cross-reference activity data with the upcoming sessions and plan to give holistic advice`;
```

4.2. Insert `${READ_TOOL_INSTRUCTIONS}` into the `buildCoachOSPrompt` return template, between `${ACTION_TOOL_INSTRUCTIONS}` and `${CONVERSATION_RULES}`.

### Task 5: Verify type compatibility

5.1. Ensure the `SomaActivity` interface in `reads.ts` aligns with the shape documented in `packages/backend/convex/lib/somaAdapter.ts` (lines 119-158). Either import the type from `somaAdapter.ts` or define a compatible subset.

5.2. Verify that `components.soma.public.listActivities` is accessible from the httpAction context. The existing pattern in `training/analytics.ts` (line 644) and `training/queries.ts` (line 34) confirms this works.

## Dev Notes

### Architecture Decision: Execute-on-Server vs Schema-Only

The existing action tools (`proposeRescheduleSession`, etc.) and UI tools (`renderMultipleChoice`, etc.) are all **schema-only** -- they have no `execute` function. The AI SDK returns the tool call arguments to the client, which renders them as UI cards.

Read tools are fundamentally different: they must **execute server-side** to fetch data from Soma and return results to the LLM for reasoning. The AI SDK `tool()` function supports an optional `execute` callback for this purpose. When `execute` is provided, the tool runs server-side and the LLM receives the result to continue its response.

**Key constraint:** The `execute` function needs access to the Convex `ctx` from the httpAction handler to call `ctx.runQuery(components.soma.public.listActivities, ...)`. This requires a factory function pattern where the tool is created inside the httpAction handler with `ctx` in closure scope.

### Soma Component API

The Soma `listActivities` query (defined in `packages/soma/src/component/public.ts` lines 379-402):

```ts
// Args:
{
  userId: string;          // Host app user ID (our Convex auth userId)
  startTime?: string;      // ISO-8601 lower bound on metadata.start_time
  endTime?: string;        // ISO-8601 upper bound on metadata.start_time
  order?: "asc" | "desc";  // Sort order (default: "desc")
  limit?: number;          // Max results (uses .take() if provided, .collect() otherwise)
}
```

Called from the host app via:
```ts
ctx.runQuery(components.soma.public.listActivities, { userId, ... })
```

### Soma Activity Data Shape (Terra Schema)

From `packages/backend/convex/lib/somaAdapter.ts` lines 119-158:

```ts
interface SomaActivity {
  _id: string;
  metadata: {
    start_time: string;       // ISO-8601
    end_time: string;         // ISO-8601
    type?: number;            // Terra activity type enum
    name?: string;
  };
  distance_data?: {
    summary?: {
      distance_meters?: number;
      steps?: number;
      elevation?: { gain_actual_meters?: number };
    };
  };
  heart_rate_data?: {
    summary?: {
      avg_hr_bpm?: number;
      max_hr_bpm?: number;
      min_hr_bpm?: number;
      resting_hr_bpm?: number;
    };
  };
  calories_data?: {
    total_burned_calories?: number;
  };
  movement_data?: {
    avg_cadence_rpm?: number;
    avg_pace_minutes_per_kilometer?: number;
    avg_speed_meters_per_second?: number;
  };
  // Also: TSS_data (training stress), lap_data, etc.
}
```

### Terra Activity Type Enum (for readable labels)

From `somaAdapter.ts` lines 78-81 and Terra docs:

| Terra Type | Label |
|------------|-------|
| 8 | Running |
| 7 | Walking |
| 35 | Hiking |
| 1 | Cycling |
| 97, 98 | Race |
| Other | Cross Training |

### RBAC Pattern

The RBAC enforcement for this tool is simpler than the action mutations because:

1. The httpAction already validates auth (lines 194-208 of `http_action.ts`) -- if no identity, request is rejected with 401
2. The Soma `listActivities` query filters by `userId` using the `by_userId_startTime` index -- it is architecturally impossible to retrieve another user's data through this API
3. The `userId` is obtained from `getAuthUserId` or the already-fetched `user._id` in the httpAction

There is no ownership verification step beyond passing the correct userId, because Soma activities are indexed by userId and the query enforces that filter.

### Existing Usage Patterns (Reference)

**`training/queries.ts` (listMyActivities wrapper, lines 21-42):**
```ts
const userId = await getAuthUserId(ctx);
if (userId === null) return [];
return await ctx.runQuery(components.soma.public.listActivities, {
  userId: userId as string,
  startTime: args.startTime,
  endTime: args.endTime,
  limit: args.limit,
  order: args.order ?? "desc",
});
```

**`training/analytics.ts` (lines 642-653):**
```ts
const rawActivities = await ctx.runQuery(
  components.soma.public.listActivities,
  {
    userId: userId as string,
    startTime: oneYearAgo.toISOString(),
    order: "asc",
  },
);
activities = rawActivities as unknown as Activity[];
```

Note the `as unknown as Activity[]` cast -- the Soma component returns generic Terra-schema objects. The type assertion is expected.

### Project Structure Notes

- Read tools introduce a new architectural pattern: tools with `execute` functions that run server-side. All existing tools are schema-only (no execute). This is Story 11.4's main innovation and will be reused by Stories 11.1-11.3, 11.5-11.6.
- The factory function pattern (`createReadTools(ctx, userId)`) should be designed to accommodate additional read tools from subsequent stories. The function should return an object like `{ readActivities, readBiometrics, readPlannedSessions, ... }` -- start with just `readActivities` but structure it for extension.
- The new file `tools/reads.ts` parallels `tools/actions.ts` in structure.
- The Coach OS prompt update adds a new section parallel to `ACTION_TOOL_INSTRUCTIONS`.

### References

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/tools/actions.ts` | Existing action tool definitions (pattern reference) |
| `packages/backend/convex/ai/tools/index.ts` | Tool registry and exports |
| `packages/backend/convex/ai/http_action.ts` | httpAction handler where tools are wired to streamText |
| `packages/backend/convex/ai/prompts/coach_os.ts` | Coach OS prompt (add read tool instructions) |
| `packages/backend/convex/lib/somaAdapter.ts` | SomaActivity type definition and Terra type mapping |
| `packages/backend/convex/training/queries.ts` | Existing `listMyActivities` wrapper (Soma call pattern) |
| `packages/backend/convex/training/analytics.ts` | Soma activity fetching in analytics (reference) |
| `packages/soma/src/component/public.ts` | Soma `listActivities` query definition (lines 379-402) |
| `packages/backend/convex/convex.config.ts` | Soma component registration |
| `packages/backend/convex/training/actionMutations.ts` | RBAC pattern reference (`getAuthenticatedRunner`) |
| `packages/backend/package.json` | Soma package dependency (`@nativesquare/soma: workspace:*`) |
