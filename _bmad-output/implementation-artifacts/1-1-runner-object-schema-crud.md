# Story 1.1: Runner Object Schema & CRUD

Status: review

---

## Story

As a **developer**,
I want **the Runner Object data model created in Convex**,
So that **all onboarding data can be stored and tracked consistently**.

---

## Acceptance Criteria

### AC1: Runners Table Schema
**Given** the Convex backend is running
**When** the schema is deployed
**Then** a `runners` table exists with fields for:
- `identity` section (name, name_confirmed)
- `physical` section (age, weight, height)
- `running` section (experience_level, current_frequency, current_volume, easy_pace, etc.)
- `goals` section (goal_type, race_distance, race_date, target_time, etc.)
- `schedule` section (available_days, blocked_days, preferred_time, etc.)
- `health` section (past_injuries, current_pain, recovery_style, sleep_quality, stress_level)
- `coaching` section (coaching_voice, data_orientation, biggest_challenge)
- `connections` section (strava_connected, wearable_connected, wearable_type)
- `inferred` section (avg_weekly_volume, volume_consistency, easy_pace_actual, etc.)
- `conversation_state` section (data_completeness, ready_for_plan, current_phase, fields_to_confirm, fields_missing)

### AC2: CRUD Mutations
**Given** the schema is deployed
**When** mutations are called
**Then** basic CRUD operations work:
- `createRunner(userId)` - creates a new runner record linked to user
- `updateRunner(runnerId, fields)` - updates specific fields
- `getRunner(runnerId)` - retrieves runner by ID
- `getRunnerByUserId(userId)` - retrieves runner by user ID

### AC3: Index on userId
**Given** the runners table exists
**When** queried by userId
**Then** an index `by_userId` enables efficient lookup

---

## Tasks / Subtasks

- [x] **Task 1: Create runners table schema** (AC: #1, #3)
  - [x] Create `packages/backend/convex/table/runners.ts`
  - [x] Define complete Runner Object schema using Convex validators
  - [x] Add `by_userId` index
  - [x] Export table definition for schema.ts

- [x] **Task 2: Update main schema** (AC: #1)
  - [x] Import runners in `packages/backend/convex/schema.ts`
  - [x] Add to schema export

- [x] **Task 3: Create CRUD mutations** (AC: #2)
  - [x] Implement `createRunner` mutation - creates new runner linked to authenticated user
  - [x] Implement `updateRunner` mutation
  - [x] Implement `getRunner` query
  - [x] Implement `getRunnerByUserId` query
  - [x] Add `getCurrentRunner` query for authenticated user convenience

- [x] **Task 4: Create shared types** (AC: #1)
  - [x] Create `packages/shared/src/types/runner.ts` with TypeScript interfaces
  - [ ] Create `packages/shared/src/schemas/runner.ts` with Zod schemas (optional, for client validation)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Naming Conventions:**
   - Tables: `camelCase` plural → `runners`
   - Fields: `camelCase` → `userId`, `goalType`, `easyPace`
   - Foreign Keys: `{table}Id` → `runnerId`, `userId`
   - Indexes: `by_{field}` → `by_userId`

2. **Schema Pattern:**
   - Use Convex validators (`v.string()`, `v.number()`, `v.optional()`, etc.)
   - Follow existing pattern from `stravaConnections.ts` and `users.ts`
   - Use `generateFunctions` utility for standard CRUD operations

3. **Auth Integration:**
   - Use `getAuthUserId(ctx)` for authentication
   - Throw `ConvexError` for auth failures
   - Pattern exists in `table/admin.ts`

4. **Error Handling:**
   - Use `ConvexError` with standardized codes:
     - `RUNNER_NOT_FOUND` - Runner profile doesn't exist
     - `UNAUTHORIZED` - Authentication required

### Runner Object Complete Schema

From UX V6 document, the full Runner Object structure:

```typescript
// Identity Section
identity: {
  name: string;                    // Required. Source: OAuth or confirmed in conversation
  name_confirmed: boolean;         // True once user confirms
}

// Physical Profile
physical: {
  age?: number;                    // Optional but valuable
  weight?: number;                 // Optional. Useful for intensity calculations
  height?: number;                 // Optional
}

// Running Profile
running: {
  experience_level?: "beginner" | "returning" | "casual" | "serious";
  months_running?: number;
  current_frequency?: number;      // Days per week
  current_volume?: number;         // Weekly km
  easy_pace?: string;              // Format: "5:40/km"
  longest_recent_run?: number;
  training_consistency?: "high" | "moderate" | "low";
}

// Goals
goals: {
  goal_type?: "race" | "speed" | "base_building" | "return_to_fitness" | "general_health";
  race_distance?: number;
  race_date?: number;              // Unix timestamp
  target_time?: number;            // Duration in seconds
  target_pace?: string;
  target_volume?: number;
}

// Schedule & Life
schedule: {
  available_days?: number;
  blocked_days?: string[];         // ["monday", "wednesday"]
  preferred_time?: "morning" | "midday" | "evening" | "varies";
  calendar_connected?: boolean;
}

// Health & Risk
health: {
  past_injuries?: string[];        // ["shin_splints", "itbs", "plantar"]
  current_pain?: string[];
  recovery_style?: "quick" | "slow" | "push_through" | "no_injuries";
  sleep_quality?: "solid" | "inconsistent" | "poor";
  stress_level?: "low" | "moderate" | "high" | "survival";
}

// Coaching Preferences
coaching: {
  coaching_voice?: "tough_love" | "encouraging" | "analytical" | "minimalist";
  data_orientation?: "data_driven" | "curious" | "feel_based";
  biggest_challenge?: string;
  skip_triggers?: string[];
}

// Data Connections
connections: {
  strava_connected: boolean;
  wearable_connected: boolean;
  wearable_type?: "garmin" | "coros" | "apple_watch" | "polar" | "none";
  calendar_connected: boolean;
}

// Inferred Data (from wearable analysis)
inferred: {
  avg_weekly_volume?: number;
  volume_consistency?: number;     // % variance
  easy_pace_actual?: string;
  long_run_pattern?: string;
  rest_day_frequency?: number;
  training_load_trend?: "building" | "maintaining" | "declining" | "erratic";
  estimated_fitness?: number;
  injury_risk_factors?: string[];
}

// Conversation State (meta-tracking)
conversation_state: {
  data_completeness: number;       // 0-100 percentage
  ready_for_plan: boolean;
  current_phase: "intro" | "data_bridge" | "profile" | "goals" | "schedule" | "health" | "coaching" | "analysis";
  fields_to_confirm: string[];
  fields_missing: string[];
}
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `packages/backend/convex/table/runners.ts` | Runners table definition + CRUD |
| `packages/shared/src/types/runner.ts` | TypeScript interfaces |

**Files to Modify:**
| File | Change |
|------|--------|
| `packages/backend/convex/schema.ts` | Import and add runners table |

### Existing Patterns to Follow

**From `stravaConnections.ts`:**
```typescript
import { defineTable } from "convex/server";
import { v } from "convex/values";
import { generateFunctions } from "../utils/generateFunctions";

const documentSchema = {
  userId: v.id("users"),
  // ... fields
};

export const stravaConnections = defineTable(documentSchema)
  .index("by_userId", ["userId"]);

export const { get, insert, patch, replace, delete: deleteConnection } =
  generateFunctions("stravaConnections", documentSchema, documentSchema);
```

**From `admin.ts` for auth pattern:**
```typescript
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

const userId = await getAuthUserId(ctx);
if (userId === null) {
  throw new ConvexError({ message: "Not authenticated" });
}
```

### References

- [Source: architecture.md#Data Architecture] - Schema design decisions
- [Source: architecture.md#Naming Patterns] - Naming conventions
- [Source: architecture.md#Implementation Patterns] - Code patterns
- [Source: ux-onboarding-flow-v6-2026-02-13.md#The Runner Object Model] - Complete data model
- [Source: epics.md#Story 1.1] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#Progress Tracking] - FR48-51 requirements

### Implementation Notes

1. **Flat vs Nested Schema**: Convex validators support nested objects. Use nested structure to match Runner Object sections for clarity, but consider flat for simpler querying if needed.

2. **Optional Fields**: Most fields are optional initially. Use `v.optional()` wrapper. Only `userId` and `connections` booleans should be required from creation.

3. **Data Completeness Calculation**: The `conversation_state.data_completeness` should be calculated based on filled required fields. Consider a helper function.

4. **Type Safety**: Export validators as types using `Infer<typeof documentSchema>` pattern.

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan
1. Created runners table schema following existing patterns (stravaConnections.ts, users.ts)
2. Implemented nested schema structure matching UX V6 Runner Object Model
3. Added auth-protected CRUD mutations with ownership verification
4. Created TypeScript interfaces for client-side type safety

### Completion Notes List
- [x] Schema deployed successfully (Convex codegen validates)
- [x] All CRUD operations implemented (createRunner, updateRunner, getRunner, getRunnerByUserId, getCurrentRunner)
- [x] Index `by_userId` added for efficient lookup
- [x] TypeScript types created in shared package

### File List
- `packages/backend/convex/table/runners.ts` (created)
- `packages/backend/convex/schema.ts` (modified - added runners import)
- `packages/shared/src/types/runner.ts` (created)

### Change Log
- 2026-02-14: Implemented Runner Object schema and CRUD operations (Story 1.1)
