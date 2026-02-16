# Story 3.8: Conversation Phase Management

Status: ready-for-dev

---

## Story

As a **developer**,
I want **the conversation to progress through phases based on data completeness**,
So that **the coach knows what to ask next and when to generate the plan**.

---

## Acceptance Criteria

### AC1: Phase Definitions

**Given** phase requirements are defined
**When** the system evaluates progress
**Then** phases are: `intro` -> `data_bridge` -> `profile` -> `goals` -> `schedule` -> `health` -> `coaching` -> `analysis` -> `complete`

### AC2: Intro Phase Transition

**Given** the intro phase
**When** `identity.nameConfirmed` is true
**Then** phase advances to `data_bridge`

### AC3: Data Bridge Phase Transition

**Given** the `data_bridge` phase
**When** wearable decision is made (connected OR skipped via `connections.wearableDecision`)
**Then** phase advances to `profile`

### AC4: Profile Phase Transition (NO DATA Path)

**Given** the profile phase with NO wearable data
**When** required fields are filled: `experienceLevel`, `currentFrequency`, `currentVolume`
**Then** phase advances to `goals`

### AC5: Profile Phase Transition (DATA Path)

**Given** the profile phase with wearable data
**When** wearable data is synced AND user confirms inferred values
**Then** phase advances to `goals`

### AC6: Subsequent Phase Transitions

**Given** subsequent phases (goals, schedule, health, coaching)
**When** their required fields are complete
**Then** phases advance automatically based on field completion

### AC7: Analysis Phase Trigger

**Given** analysis phase is reached
**When** all required fields are filled
**Then** `readyForPlan` becomes true
**And** plan generation can be triggered

### AC8: Phase-Specific System Prompt

**Given** the system prompt is assembled
**When** the coach generates responses
**Then** phase-specific instructions guide the conversation
**And** the coach knows which fields to collect next
**And** the prompt includes context about filled vs missing fields

---

## Tasks / Subtasks

- [ ] **Task 1: Add data_bridge Phase to determinePhase()** (AC: #2, #3)
  - [ ] Modify `packages/backend/convex/table/runners.ts` `determinePhase()` function
  - [ ] Add check after intro: if `identity.nameConfirmed` but no wearable decision -> `data_bridge`
  - [ ] Add `connections.wearableDecision` field check (value: "connected" | "skipped" | null)
  - [ ] Ensure phase transitions: intro -> data_bridge -> profile

- [ ] **Task 2: Add complete Phase** (AC: #1, #7)
  - [ ] Add "complete" to phase union type
  - [ ] After analysis, when `readyForPlan` is true AND plan is generated -> `complete`
  - [ ] Update type definitions in runners.ts

- [ ] **Task 3: Create Phase Manager Module** (AC: #1, #6)
  - [ ] Create `packages/backend/convex/ai/phase-manager.ts`
  - [ ] Define `PhaseConfig` interface: `{ name, requiredFields, optionalFields, nextPhase }`
  - [ ] Create `PHASE_CONFIGS` registry with all phase requirements
  - [ ] Export `getPhaseConfig(phase: string): PhaseConfig`
  - [ ] Export `getNextPhase(runner: RunnerDocument): string`

- [ ] **Task 4: Create Phase Context Builder** (AC: #8)
  - [ ] Create `packages/backend/convex/ai/phase-context.ts`
  - [ ] Export `buildPhaseContext(runner: RunnerDocument): PhaseContext`
  - [ ] Include: currentPhase, nextPhase, filledFields, missingFields, dataPath ("DATA" | "NO_DATA")
  - [ ] Include: phaseProgress (percentage within current phase)
  - [ ] Include: suggestedNextQuestion (based on missing fields priority)

- [ ] **Task 5: Create Phase-Specific Prompt Templates** (AC: #8)
  - [ ] Create `packages/backend/convex/ai/prompts/phase-prompts.ts`
  - [ ] Define prompt segments for each phase
  - [ ] `intro`: Welcome, confirm name, set friendly tone
  - [ ] `data_bridge`: Offer wearable connection, explain benefits, provide skip option
  - [ ] `profile`: Collect running experience (questions differ DATA vs NO_DATA path)
  - [ ] `goals`: Collect goal type, race details if applicable
  - [ ] `schedule`: Collect available days, blocked days, preferred times
  - [ ] `health`: Collect injuries, recovery style, sleep, stress
  - [ ] `coaching`: Collect coaching voice preference, biggest challenge
  - [ ] `analysis`: Summarize collected data, prepare for plan generation

- [ ] **Task 6: Enhance Onboarding Coach System Prompt** (AC: #8)
  - [ ] Create/enhance `packages/backend/convex/ai/prompts/onboarding-coach.ts`
  - [ ] Import phase-specific segments from phase-prompts.ts
  - [ ] Build dynamic system prompt based on runner's current phase
  - [ ] Include filled field values as context
  - [ ] Include missing fields as conversation targets
  - [ ] Include data path context (DATA vs NO_DATA) for appropriate questions

- [ ] **Task 7: Add wearableDecision Field to Schema** (AC: #3)
  - [ ] Update `connectionsSchema` in runners.ts
  - [ ] Add: `wearableDecision: v.optional(v.union(v.literal("connected"), v.literal("skipped")))`
  - [ ] Ensure ConnectionCard tool result can set this field

- [ ] **Task 8: Wire Phase Context to Streaming Endpoint** (AC: #8)
  - [ ] Update `packages/backend/convex/ai/http-action.ts`
  - [ ] Load runner document before generating response
  - [ ] Call `buildPhaseContext(runner)` to get current phase info
  - [ ] Pass phase context to system prompt builder
  - [ ] Include phase in response metadata for client phase indicators

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from [architecture.md](../planning-artifacts/architecture.md):**

1. **Phase Definitions (existing in runners.ts:344-393):**
   - Current phases: intro, data_bridge, profile, goals, schedule, health, coaching, analysis
   - Need to add: complete phase
   - Need to add: data_bridge transition logic

2. **LLM Integration (architecture.md#LLM Integration Architecture):**
   - Server-side via Convex HTTP Actions
   - System prompt must be built dynamically per request
   - Phase context informs prompt assembly

3. **State Management (architecture.md#State Management Patterns):**
   - Phase is derived from Runner Object state
   - Never store phase separately; always calculate from data

### Existing Implementation Assets

**Phase determination at [table/runners.ts:344-393](../../packages/backend/convex/table/runners.ts#L344-L393):**
- Lines 344-393: `determinePhase()` function - NEEDS UPDATE for data_bridge
- Currently missing: data_bridge check after intro
- Currently missing: complete phase after analysis

**Tools at [ai/tools/index.ts:129-136](../../packages/backend/convex/ai/tools/index.ts#L129-L136):**
- `renderProgress` tool already accepts phase enum
- `renderConnectionCard` tool exists for data_bridge phase

### Phase Configuration Design

```typescript
// packages/backend/convex/ai/phase-manager.ts

export interface PhaseConfig {
  name: string;
  displayName: string;
  requiredFields: string[];
  optionalFields: string[];
  nextPhase: string | null;
  promptFocus: string;
  dataPathVariant?: {
    DATA: { requiredFields: string[]; promptFocus: string };
    NO_DATA: { requiredFields: string[]; promptFocus: string };
  };
}

export const PHASE_CONFIGS: Record<string, PhaseConfig> = {
  intro: {
    name: "intro",
    displayName: "Welcome",
    requiredFields: ["identity.nameConfirmed"],
    optionalFields: [],
    nextPhase: "data_bridge",
    promptFocus: "Confirm user's name and establish rapport",
  },
  data_bridge: {
    name: "data_bridge",
    displayName: "Data Connection",
    requiredFields: ["connections.wearableDecision"],
    optionalFields: [],
    nextPhase: "profile",
    promptFocus: "Offer wearable connection or allow skip",
  },
  profile: {
    name: "profile",
    displayName: "Running Profile",
    requiredFields: [],
    optionalFields: [],
    nextPhase: "goals",
    promptFocus: "Understand running background",
    dataPathVariant: {
      DATA: {
        requiredFields: ["inferred.confirmedByUser"],
        promptFocus: "Confirm inferred values from wearable data",
      },
      NO_DATA: {
        requiredFields: [
          "running.experienceLevel",
          "running.currentFrequency",
          "running.currentVolume",
        ],
        promptFocus: "Collect running experience through questions",
      },
    },
  },
  goals: {
    name: "goals",
    displayName: "Goals",
    requiredFields: ["goals.goalType"],
    optionalFields: ["goals.raceDistance", "goals.raceDate", "goals.targetTime"],
    nextPhase: "schedule",
    promptFocus: "Understand training goals and any race targets",
  },
  schedule: {
    name: "schedule",
    displayName: "Schedule",
    requiredFields: ["schedule.availableDays", "schedule.blockedDays"],
    optionalFields: ["schedule.preferredTime", "schedule.longRunDay"],
    nextPhase: "health",
    promptFocus: "Understand weekly availability and constraints",
  },
  health: {
    name: "health",
    displayName: "Health & Recovery",
    requiredFields: [
      "health.pastInjuries",
      "health.recoveryStyle",
      "health.sleepQuality",
      "health.stressLevel",
    ],
    optionalFields: ["health.currentPain"],
    nextPhase: "coaching",
    promptFocus: "Understand health context and recovery patterns",
  },
  coaching: {
    name: "coaching",
    displayName: "Coaching Style",
    requiredFields: ["coaching.coachingVoice", "coaching.biggestChallenge"],
    optionalFields: ["coaching.dataOrientation"],
    nextPhase: "analysis",
    promptFocus: "Understand preferred coaching style and challenges",
  },
  analysis: {
    name: "analysis",
    displayName: "Analysis",
    requiredFields: [],
    optionalFields: [],
    nextPhase: "complete",
    promptFocus: "Summarize collected data, prepare for plan generation",
  },
  complete: {
    name: "complete",
    displayName: "Complete",
    requiredFields: [],
    optionalFields: [],
    nextPhase: null,
    promptFocus: "Profile complete, ready for plan generation",
  },
};
```

### Updated determinePhase Function

```typescript
// Update in packages/backend/convex/table/runners.ts

export function determinePhase(
  runner: RunnerDocument
): "intro" | "data_bridge" | "profile" | "goals" | "schedule" | "health" | "coaching" | "analysis" | "complete" {
  // Check identity
  if (!runner.identity?.nameConfirmed) {
    return "intro";
  }

  // Check wearable decision (NEW - data_bridge phase)
  if (!runner.connections?.wearableDecision) {
    return "data_bridge";
  }

  // Determine data path
  const hasWearableData = runner.connections?.wearableDecision === "connected" &&
    runner.inferred?.fromHealthKit || runner.inferred?.fromStrava;

  // Check running profile (differs by data path)
  if (hasWearableData) {
    // DATA path: need confirmation of inferred values
    if (!runner.inferred?.confirmedByUser) {
      return "profile";
    }
  } else {
    // NO DATA path: need manual input
    const runningFields = ["running.experienceLevel", "running.currentFrequency", "running.currentVolume"];
    const runningComplete = runningFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
    if (!runningComplete) {
      return "profile";
    }
  }

  // Check goals
  const goalType = runner.goals?.goalType;
  if (!goalType) {
    return "goals";
  }
  if (goalType === "race") {
    if (!runner.goals?.raceDistance || !runner.goals?.raceDate) {
      return "goals";
    }
  }

  // Check schedule
  const scheduleFields = ["schedule.availableDays", "schedule.blockedDays"];
  const scheduleComplete = scheduleFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!scheduleComplete) {
    return "schedule";
  }

  // Check health
  const healthFields = ["health.pastInjuries", "health.recoveryStyle", "health.sleepQuality", "health.stressLevel"];
  const healthComplete = healthFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!healthComplete) {
    return "health";
  }

  // Check coaching
  const coachingFields = ["coaching.coachingVoice", "coaching.biggestChallenge"];
  const coachingComplete = coachingFields.every((f) => isFieldFilled(getFieldValue(runner, f)));
  if (!coachingComplete) {
    return "coaching";
  }

  // Check if plan generated (for complete phase)
  if (runner.conversationState?.readyForPlan && runner.conversationState?.planGenerated) {
    return "complete";
  }

  // All data collected, ready for plan
  return "analysis";
}
```

### Phase Context Builder

```typescript
// packages/backend/convex/ai/phase-context.ts

import { RunnerDocument } from "../table/runners";
import { PHASE_CONFIGS, PhaseConfig } from "./phase-manager";

export interface PhaseContext {
  currentPhase: string;
  nextPhase: string | null;
  dataPath: "DATA" | "NO_DATA";
  filledFields: string[];
  missingFields: string[];
  phaseProgress: number;
  phaseConfig: PhaseConfig;
  suggestedNextField: string | null;
  runnerSummary: {
    name: string;
    hasWearable: boolean;
    goalType: string | null;
    dataCompleteness: number;
  };
}

export function buildPhaseContext(runner: RunnerDocument): PhaseContext {
  const currentPhase = determinePhase(runner);
  const phaseConfig = PHASE_CONFIGS[currentPhase];

  const hasWearableData = runner.connections?.wearableDecision === "connected";
  const dataPath = hasWearableData ? "DATA" : "NO_DATA";

  // Get required fields for current phase (considering data path variants)
  const requiredFields = phaseConfig.dataPathVariant?.[dataPath]?.requiredFields
    ?? phaseConfig.requiredFields;

  const filledFields = requiredFields.filter((f) => isFieldFilled(getFieldValue(runner, f)));
  const missingFields = requiredFields.filter((f) => !isFieldFilled(getFieldValue(runner, f)));

  const phaseProgress = requiredFields.length > 0
    ? Math.round((filledFields.length / requiredFields.length) * 100)
    : 100;

  return {
    currentPhase,
    nextPhase: phaseConfig.nextPhase,
    dataPath,
    filledFields,
    missingFields,
    phaseProgress,
    phaseConfig,
    suggestedNextField: missingFields[0] ?? null,
    runnerSummary: {
      name: runner.identity?.name ?? "Runner",
      hasWearable: hasWearableData,
      goalType: runner.goals?.goalType ?? null,
      dataCompleteness: runner.conversationState?.dataCompleteness ?? 0,
    },
  };
}
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/convex/ai/phase-manager.ts` | Phase configuration registry |
| `packages/backend/convex/ai/phase-context.ts` | Phase context builder for prompts |
| `packages/backend/convex/ai/prompts/phase-prompts.ts` | Phase-specific prompt segments |
| `packages/backend/convex/ai/prompts/onboarding-coach.ts` | Main system prompt builder |

**Files to Modify:**

| File | Change |
|------|--------|
| `packages/backend/convex/table/runners.ts` | Update `determinePhase()`, add complete phase, add wearableDecision |
| `packages/backend/convex/ai/http-action.ts` | Wire phase context to system prompt |
| `packages/backend/convex/schema.ts` | Ensure connections schema has wearableDecision |

### Dependencies

| Package | Status | Notes |
|---------|--------|-------|
| None | N/A | Uses existing Convex and AI SDK |

### Testing Workflow

1. **Phase Transition Tests:**
   - Create runner with only name confirmed -> expect `data_bridge` phase
   - Set wearableDecision to "skipped" -> expect `profile` phase
   - Fill profile fields -> expect `goals` phase
   - Continue through all phases to `complete`

2. **Data Path Tests:**
   - NO DATA path: Fill manual fields, verify phase advances
   - DATA path: Set wearable connected, verify inferred confirmation required

3. **Phase Context Tests:**
   - Build context for each phase -> verify correct fields listed
   - Verify suggestedNextField points to first missing required field

4. **System Prompt Tests:**
   - Generate prompt for each phase -> verify phase-specific instructions included
   - Verify filled values appear in context
   - Verify missing fields appear as conversation targets

### References

- [Source: architecture.md#LLM Integration Architecture] - System prompt patterns
- [Source: table/runners.ts:344-393] - Existing determinePhase function
- [Source: ai/tools/index.ts:129-136] - renderProgress tool with phases
- [Source: epics.md#Story 3.8] - Acceptance criteria
- [Source: ux-onboarding-flow-v6] - Conversation flow phases

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
