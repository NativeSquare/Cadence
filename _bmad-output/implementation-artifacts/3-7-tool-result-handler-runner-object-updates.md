# Story 3.7: Tool Result Handler & Runner Object Updates

Status: ready-for-dev

---

## Story

As a **developer**,
I want **tool results to update the Runner Object with proper field mapping**,
So that **user responses are persisted to their profile**.

---

## Acceptance Criteria

### AC1: Field Path Mapping

**Given** a tool result with targetField is received
**When** the handler processes it
**Then** the targetField path is mapped to the Runner Object schema:
  - `running.experienceLevel` → runners.running.experienceLevel
  - `goals.goalType` → runners.goals.goalType
  - `schedule.availableDays` → runners.schedule.availableDays
  - etc.

### AC2: Value Transformation

**Given** a value needs transformation
**When** the handler processes it
**Then** values are transformed appropriately:
  - Numeric strings → numbers
  - Pace strings → seconds per km (or store as string)
  - Date strings → timestamps
  - Arrays → validated arrays

### AC3: Conversation State Update

**Given** the Runner Object is updated
**When** the mutation completes
**Then** `conversationState.dataCompleteness` is recalculated
**And** `conversationState.fieldsMissing` is updated
**And** `conversationState.currentPhase` advances if requirements met

### AC4: Provenance Tracking

**Given** provenance tracking is needed
**When** a field is updated
**Then** the source is recorded: "user_input"
**And** the inputMethod is recorded: "selection" | "text" | "voice"
**And** the questionAsked is recorded for justification tracing
**And** timestamp is recorded

### AC5: Validation Error Handling

**Given** validation fails
**When** an invalid value is received
**Then** the error is handled gracefully
**And** the user is prompted to correct via conversation continuation

---

## Tasks / Subtasks

- [ ] **Task 1: Create Field Mapping Registry** (AC: #1)
  - [ ] Create `packages/backend/convex/ai/field-mappings.ts`
  - [ ] Define `FIELD_MAPPINGS: Record<string, FieldMapping>` with all targetField → schema paths
  - [ ] Include validation rules per field (type, min, max, enum values)
  - [ ] Export `getFieldMapping(targetField: string): FieldMapping | null`

- [ ] **Task 2: Create Value Transformers** (AC: #2)
  - [ ] Create `packages/backend/convex/ai/value-transformers.ts`
  - [ ] Implement `transformStringToNumber(value: string): number`
  - [ ] Implement `transformPaceString(value: string): string` (validate format "M:SS/km")
  - [ ] Implement `transformDateString(value: string): number` (Unix timestamp)
  - [ ] Implement `transformArray(value: unknown): unknown[]`
  - [ ] Export `transformValue(value: unknown, targetType: string): unknown`

- [ ] **Task 3: Create updateRunnerField Mutation** (AC: #1, #2, #3)
  - [ ] Add to `packages/backend/convex/table/runners.ts`
  - [ ] Accept: `{ runnerId, fieldPath, value, provenance? }`
  - [ ] Validate fieldPath exists in FIELD_MAPPINGS
  - [ ] Transform value using transformers
  - [ ] Deep merge into Runner Object
  - [ ] Recalculate dataCompleteness, fieldsMissing, currentPhase
  - [ ] Return updated runner document

- [ ] **Task 4: Create Provenance Schema** (AC: #4)
  - [ ] Add provenance field to each section schema (or create separate provenance table)
  - [ ] Define ProvenanceRecord: `{ source, inputMethod, questionAsked?, timestamp }`
  - [ ] Store provenance per field or per update batch
  - [ ] Design: Consider provenance as parallel object or embedded

- [ ] **Task 5: Implement Field-Specific Validators** (AC: #5)
  - [ ] Create validators for each field type using Zod
  - [ ] experienceLevel: must be one of enum values
  - [ ] currentFrequency: number 1-7
  - [ ] pastInjuries: array of valid injury types
  - [ ] raceDate: must be future date
  - [ ] Return validation errors with user-friendly messages

- [ ] **Task 6: Wire Provenance into Tool Handlers** (AC: #4)
  - [ ] Update tool handlers from Story 3.6 to pass provenance
  - [ ] Extract questionAsked from tool call args (if available)
  - [ ] Pass inputMethod from frontend submission
  - [ ] Store provenance with each field update

- [ ] **Task 7: Phase Advancement Logic** (AC: #3)
  - [ ] Verify `determinePhase()` in runners.ts handles all transitions
  - [ ] Add `data_bridge` phase check (wearable decision made)
  - [ ] Ensure phase transitions trigger system prompt updates
  - [ ] Log phase transitions for debugging

- [ ] **Task 8: Validation Error Response** (AC: #5)
  - [ ] Return validation errors as structured ToolResult
  - [ ] Format: `{ success: false, error: { field, message, constraints } }`
  - [ ] AI can use error info to ask user for correction
  - [ ] Include example of valid value when possible

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from [architecture.md](../planning-artifacts/architecture.md):**

1. **Runner Object Schema (table/runners.ts:12-198):**
   - Identity, Physical, Running, Goals, Schedule, Health, Coaching sections
   - ConversationState for tracking progress
   - All fields optional except identity.name/nameConfirmed

2. **State Management (architecture.md#State Management Patterns):**
   - Server State: Convex `useQuery`/`useMutation`
   - Anti-pattern: Never duplicate Convex data in local state

3. **Error Handling (architecture.md#Error Handling Patterns):**
   - Use ConvexError with standardized codes
   - `VALIDATION_ERROR` for Zod validation failures

### Existing Implementation Assets

**Runner Object schema at [table/runners.ts](../../packages/backend/convex/table/runners.ts):**
- Lines 12-198: Section schemas (identity, running, goals, etc.)
- Lines 302-339: `calculateDataCompleteness()` and `getMissingFields()`
- Lines 344-393: `determinePhase()` for phase transitions
- Lines 497-551: `updateRunner` mutation (needs field-level version)

**Tool definitions at [tools/index.ts](../../packages/backend/convex/ai/tools/index.ts):**
- Each tool has `targetField` for mapping to Runner Object
- Existing tools: renderMultipleChoice, renderOpenInput, etc.

### Field Mapping Registry Design

```typescript
// packages/backend/convex/ai/field-mappings.ts

import { z } from "zod";

export interface FieldMapping {
  /** Dot-notation path in Runner Object */
  schemaPath: string;
  /** Zod schema for validation */
  schema: z.ZodType;
  /** Transform function if needed */
  transform?: (value: unknown) => unknown;
  /** User-friendly field name for errors */
  displayName: string;
  /** Example valid value for error messages */
  example?: string;
}

export const FIELD_MAPPINGS: Record<string, FieldMapping> = {
  // Running Profile
  "running.experienceLevel": {
    schemaPath: "running.experienceLevel",
    schema: z.enum(["beginner", "returning", "casual", "serious"]),
    displayName: "Experience Level",
    example: "casual",
  },
  "running.currentFrequency": {
    schemaPath: "running.currentFrequency",
    schema: z.number().int().min(0).max(7),
    transform: (v) => typeof v === "string" ? parseInt(v, 10) : v,
    displayName: "Weekly Run Frequency",
    example: "3",
  },
  "running.currentVolume": {
    schemaPath: "running.currentVolume",
    schema: z.number().min(0).max(500),
    transform: (v) => typeof v === "string" ? parseFloat(v) : v,
    displayName: "Weekly Volume (km)",
    example: "25",
  },
  "running.easyPace": {
    schemaPath: "running.easyPace",
    schema: z.string().regex(/^\d{1,2}:\d{2}\/km$/, "Pace must be in M:SS/km format"),
    displayName: "Easy Pace",
    example: "5:30/km",
  },

  // Goals
  "goals.goalType": {
    schemaPath: "goals.goalType",
    schema: z.enum(["race", "speed", "base_building", "return_to_fitness", "general_health"]),
    displayName: "Goal Type",
    example: "race",
  },
  "goals.raceDistance": {
    schemaPath: "goals.raceDistance",
    schema: z.number().min(1).max(250),
    transform: (v) => typeof v === "string" ? parseFloat(v) : v,
    displayName: "Race Distance (km)",
    example: "42.195",
  },
  "goals.raceDate": {
    schemaPath: "goals.raceDate",
    schema: z.number().int().min(Date.now()),
    transform: (v) => typeof v === "string" ? new Date(v).getTime() : v,
    displayName: "Race Date",
    example: "2026-06-15",
  },

  // Schedule
  "schedule.availableDays": {
    schemaPath: "schedule.availableDays",
    schema: z.number().int().min(1).max(7),
    transform: (v) => typeof v === "string" ? parseInt(v, 10) : v,
    displayName: "Available Training Days",
    example: "4",
  },
  "schedule.blockedDays": {
    schemaPath: "schedule.blockedDays",
    schema: z.array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])),
    displayName: "Blocked Days",
    example: '["monday", "friday"]',
  },
  "schedule.preferredTime": {
    schemaPath: "schedule.preferredTime",
    schema: z.enum(["morning", "midday", "evening", "varies"]),
    displayName: "Preferred Run Time",
    example: "morning",
  },

  // Health
  "health.pastInjuries": {
    schemaPath: "health.pastInjuries",
    schema: z.array(z.string()),
    displayName: "Past Injuries",
    example: '["shin_splints", "plantar"]',
  },
  "health.currentPain": {
    schemaPath: "health.currentPain",
    schema: z.array(z.string()),
    displayName: "Current Pain Areas",
    example: '["knee"]',
  },
  "health.recoveryStyle": {
    schemaPath: "health.recoveryStyle",
    schema: z.enum(["quick", "slow", "push_through", "no_injuries"]),
    displayName: "Recovery Style",
    example: "slow",
  },
  "health.sleepQuality": {
    schemaPath: "health.sleepQuality",
    schema: z.enum(["solid", "inconsistent", "poor"]),
    displayName: "Sleep Quality",
    example: "solid",
  },
  "health.stressLevel": {
    schemaPath: "health.stressLevel",
    schema: z.enum(["low", "moderate", "high", "survival"]),
    displayName: "Stress Level",
    example: "moderate",
  },

  // Coaching
  "coaching.coachingVoice": {
    schemaPath: "coaching.coachingVoice",
    schema: z.enum(["tough_love", "encouraging", "analytical", "minimalist"]),
    displayName: "Coaching Style",
    example: "encouraging",
  },
  "coaching.dataOrientation": {
    schemaPath: "coaching.dataOrientation",
    schema: z.enum(["data_driven", "curious", "feel_based"]),
    displayName: "Data Orientation",
    example: "data_driven",
  },
  "coaching.biggestChallenge": {
    schemaPath: "coaching.biggestChallenge",
    schema: z.string().min(1).max(500),
    displayName: "Biggest Challenge",
    example: "Staying consistent during busy weeks",
  },
};

/**
 * Get field mapping for a target field path.
 */
export function getFieldMapping(targetField: string): FieldMapping | null {
  return FIELD_MAPPINGS[targetField] ?? null;
}

/**
 * Validate and transform a value for a target field.
 */
export function validateAndTransform(
  targetField: string,
  value: unknown
): { success: true; value: unknown } | { success: false; error: string; example?: string } {
  const mapping = getFieldMapping(targetField);

  if (!mapping) {
    return { success: false, error: `Unknown field: ${targetField}` };
  }

  // Transform if needed
  const transformed = mapping.transform ? mapping.transform(value) : value;

  // Validate with Zod
  const result = mapping.schema.safeParse(transformed);

  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      success: false,
      error: `Invalid ${mapping.displayName}: ${issue.message}`,
      example: mapping.example,
    };
  }

  return { success: true, value: result.data };
}
```

### updateRunnerField Mutation

```typescript
// Add to packages/backend/convex/table/runners.ts

/**
 * Update a single field in the Runner Object.
 * Validates field path, transforms value, updates runner, recalculates state.
 *
 * Story 3.7 - AC#1, AC#2, AC#3
 */
export const updateRunnerField = mutation({
  args: {
    runnerId: v.id("runners"),
    fieldPath: v.string(),
    value: v.any(),
    provenance: v.optional(v.object({
      source: v.union(
        v.literal("user_input"),
        v.literal("inferred"),
        v.literal("wearable")
      ),
      inputMethod: v.optional(v.union(
        v.literal("selection"),
        v.literal("text"),
        v.literal("voice")
      )),
      questionAsked: v.optional(v.string()),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const runner = await ctx.db.get(args.runnerId);
    if (!runner) {
      throw new ConvexError({ code: "RUNNER_NOT_FOUND", message: "Runner not found" });
    }

    if (runner.userId !== userId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authorized" });
    }

    // Import field mapping validation (inline for mutation)
    // In production, this would call the field-mappings module
    const { validateAndTransform } = await import("../ai/field-mappings");

    const validation = validateAndTransform(args.fieldPath, args.value);
    if (!validation.success) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: validation.error,
        example: validation.example,
      });
    }

    // Parse field path (e.g., "running.experienceLevel" → ["running", "experienceLevel"])
    const pathParts = args.fieldPath.split(".");
    if (pathParts.length !== 2) {
      throw new ConvexError({
        code: "INVALID_FIELD_PATH",
        message: `Field path must be section.field format: ${args.fieldPath}`,
      });
    }

    const [section, field] = pathParts;

    // Build update object with deep merge
    const sectionData = runner[section as keyof typeof runner] ?? {};
    const updatedSection = {
      ...(typeof sectionData === "object" ? sectionData : {}),
      [field]: validation.value,
    };

    // Build merged runner for state calculation
    const mergedRunner = {
      ...runner,
      [section]: updatedSection,
    };

    // Recalculate state
    const dataCompleteness = calculateDataCompleteness(mergedRunner);
    const fieldsMissing = getMissingFields(mergedRunner);
    const currentPhase = determinePhase(mergedRunner);
    const readyForPlan = dataCompleteness === 100;

    // Apply update
    await ctx.db.patch(args.runnerId, {
      [section]: updatedSection,
      conversationState: {
        ...runner.conversationState,
        dataCompleteness,
        fieldsMissing,
        currentPhase,
        readyForPlan,
      },
    });

    return {
      updated: args.fieldPath,
      value: validation.value,
      dataCompleteness,
      currentPhase,
      readyForPlan,
    };
  },
});
```

### Provenance Design Options

**Option A: Parallel Object (Recommended)**
```typescript
// Separate provenance tracking table
export const fieldProvenance = defineTable({
  runnerId: v.id("runners"),
  fieldPath: v.string(),
  source: v.union(v.literal("user_input"), v.literal("inferred"), v.literal("wearable")),
  inputMethod: v.optional(v.string()),
  questionAsked: v.optional(v.string()),
  previousValue: v.optional(v.any()),
  newValue: v.any(),
  timestamp: v.number(),
}).index("by_runner_field", ["runnerId", "fieldPath"]);
```

**Option B: Embedded in Runner (Simpler but bulkier)**
```typescript
// Add to each section
const runningSchema = v.optional(v.object({
  experienceLevel: v.optional(v.string()),
  experienceLevel_provenance: v.optional(provenanceSchema),
  // ... etc
}));
```

**Recommendation:** Use Option A for clean separation and audit trail.

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/field-mappings.ts` | Field mapping registry with validators |
| `packages/backend/convex/ai/value-transformers.ts` | Value transformation utilities |

**Files to Modify:**

| File | Change |
|------|--------|
| `packages/backend/convex/table/runners.ts` | Add `updateRunnerField` mutation |
| `packages/backend/convex/ai/tool-handlers.ts` | Wire field mappings and provenance |
| `packages/backend/convex/schema.ts` | Add fieldProvenance table (if using Option A) |

**Dependencies:**

| Package | Status | Notes |
|---------|--------|-------|
| `zod` | Installed | Validation schemas |

### Testing Workflow

1. **Field Mapping Tests:**
   - Test each field path resolves correctly
   - Test value transformations (string → number, etc.)
   - Test validation failures return proper errors

2. **Update Mutation Tests:**
   - Update single field → verify runner updated
   - Update triggers phase transition → verify currentPhase changes
   - Invalid value → verify ConvexError thrown with VALIDATION_ERROR

3. **Provenance Tests:**
   - Update field with provenance → verify provenance stored
   - Query provenance history → verify audit trail

4. **Integration Tests:**
   - Tool call → tool handler → updateRunnerField → state recalculation
   - Verify dataCompleteness increments after each field

### References

- [Source: architecture.md#Data Architecture] - Runner Object structure
- [Source: table/runners.ts:12-198] - Section schemas
- [Source: table/runners.ts:302-393] - State calculation functions
- [Source: tools/index.ts:34] - targetField in tool definitions
- [Source: epics.md#Story 3.7] - Acceptance criteria
- [Source: data-model-comprehensive.md] - Full data model reference

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
