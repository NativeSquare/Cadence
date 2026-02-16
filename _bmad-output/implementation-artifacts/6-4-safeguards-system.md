# Story 6.4: Safeguards System

Status: review

## Story

As a developer,
I want a safeguards system that validates all plan decisions,
So that generated plans cannot violate safety rules.

## Acceptance Criteria

1. **AC1: Safeguards Table** - The safeguards table exists with full schema:
   - name, description, category
   - ruleType: "hard_limit" | "soft_limit" | "warning"
   - condition: { field, operator, threshold, applicableWhen }
   - action: { type, adjustment, message, severity }
   - priority, isActive
   - Indexes: by_category, by_priority

2. **AC2: Check Function** - Check function exists:
   ```typescript
   checkSafeguards(
     decisions: Decision[],
     runnerContext: RunnerContext
   ): {
     violations: Violation[],
     adjustments: Adjustment[],
     warnings: Warning[]
   }
   ```

3. **AC3: Initial Safeguards** - Minimum 10 safeguards seeded:
   - Max 10% volume increase (hard_limit)
   - Max 7% for injury history (hard_limit, higher priority)
   - No consecutive hard days (hard_limit)
   - Long run max 30% of weekly volume (soft_limit)
   - Minimum 1 rest day per week (hard_limit)
   - Maximum 2 hard sessions per week for beginners (hard_limit)
   - Age 50+ extra recovery (soft_limit)
   - No speed work before base phase (soft_limit)
   - Taper minimum 10 days for marathon (soft_limit)
   - No volume increase after injury return for 4 weeks (hard_limit)

4. **AC4: Logging** - All checks are logged to plan's safeguardApplications

5. **AC5: Schema Integration** - Table registered in schema.ts

## Tasks / Subtasks

- [x] Task 1: Create safeguards schema (AC: 1, 5)
  - [x] Create `packages/backend/convex/table/safeguards.ts`
  - [x] Define all fields per data-model-comprehensive.md
  - [x] Add indexes: by_category, by_priority
  - [x] Register in schema.ts

- [x] Task 2: Create check function (AC: 2, 4)
  - [x] Create `packages/backend/convex/safeguards/check.ts`
  - [x] Define Decision, RunnerContext, ValidationResult types
  - [x] Implement checkSafeguards() pure function
  - [x] Load active safeguards sorted by priority
  - [x] Evaluate each safeguard condition against decisions
  - [x] Handle hard_limit: block or adjust
  - [x] Handle soft_limit: adjust with warning
  - [x] Handle warning: log only
  - [x] Return structured result with violations, adjustments, warnings

- [x] Task 3: Create seed data (AC: 3)
  - [x] Create `packages/backend/convex/seeds/safeguards.ts`
  - [x] Add 10+ safeguards per acceptance criteria (13 total)
  - [x] Include volume safeguards (10% rule, injury history)
  - [x] Include frequency safeguards (consecutive days, rest days)
  - [x] Include intensity safeguards (hard sessions for beginners)
  - [x] Include recovery safeguards (age 50+, injury return)
  - [x] Include phase safeguards (speed work timing, taper)
  - [x] Create seed mutation and clear mutation

- [x] Task 4: Create barrel exports
  - [x] Create `packages/backend/convex/safeguards/index.ts`
  - [x] Export check functions and types

## Dev Notes

### Architecture Compliance

**Module 5 - Safeguards** (architecture-backend-v2.md lines 222-238):
- Responsibility: Validate decisions against safety rules
- Inputs: Proposed decision (field, value), Runner context (age, injuries, experience)
- Outputs: Validation result (pass/fail/adjust), Adjusted value, Reason for adjustment
- Files: convex/safeguards/check.ts, convex/schema/safeguards.ts
- Interface: Safeguards.check(decision, context) → ValidationResult

**Single Writer Principle** (line 259):
- `safeguards` table writers: Admin/seeder only
- No runtime writes from other modules

**Stateless Calculations** (line 249):
- checkSafeguards is a pure function
- Does NOT write to database
- Returns structured result for Plan Generator to log

### Schema Definition

```typescript
// packages/backend/convex/table/safeguards.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const safeguards = defineTable({
  // Identification
  name: v.string(),                              // "max_volume_increase"
  description: v.string(),
  category: v.string(),                          // "volume" | "intensity" | "frequency" | "recovery" | "safety"

  // Rule Definition
  ruleType: v.string(),                          // "hard_limit" | "soft_limit" | "warning"

  // The condition that triggers this safeguard
  condition: v.object({
    field: v.string(),                           // "weeklyVolumeIncrease" | "consecutiveHardDays" | etc.
    operator: v.string(),                        // ">" | "<" | ">=" | "<=" | "==" | "contains"
    threshold: v.any(),                          // The limit value

    // Optional: Only apply to certain runner profiles
    applicableWhen: v.optional(v.object({
      experienceLevel: v.optional(v.array(v.string())),
      hasInjuryHistory: v.optional(v.boolean()),
      injuryTypes: v.optional(v.array(v.string())),
      age: v.optional(v.object({ operator: v.string(), value: v.number() })),
    })),
  }),

  // Action
  action: v.object({
    type: v.string(),                            // "cap" | "reduce" | "block" | "warn" | "require_confirmation"
    adjustment: v.optional(v.any()),             // How to adjust if action is "cap" or "reduce"
    message: v.string(),                         // Message to show/log
    severity: v.string(),                        // "info" | "warning" | "critical"
  }),

  // Source & Validation
  source: v.string(),
  rationale: v.string(),                         // Why this safeguard exists
  isActive: v.boolean(),
  priority: v.number(),                          // Lower = higher priority (checked first)

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_category", ["category", "isActive"])
.index("by_priority", ["isActive", "priority"]);
```

### Check Function Implementation

```typescript
// packages/backend/convex/safeguards/check.ts

import type { Doc } from "../_generated/dataModel";

/**
 * A decision proposed by the plan generator that needs validation
 */
export interface Decision {
  field: string;                    // "weeklyVolumeIncrease" | "consecutiveHardDays" | etc.
  proposedValue: number | string | boolean;
  context?: Record<string, unknown>; // Additional context for complex checks
}

/**
 * Runner context for conditional safeguard application
 */
export interface RunnerContext {
  experienceLevel: string;          // "beginner" | "intermediate" | "advanced"
  age?: number;
  hasInjuryHistory: boolean;
  injuryTypes?: string[];
  currentPhase?: string;            // "base" | "build" | "peak" | "taper"
  weeksPostInjury?: number;
}

/**
 * A safeguard violation that cannot be auto-adjusted
 */
export interface Violation {
  safeguardName: string;
  safeguardId: string;
  field: string;
  proposedValue: unknown;
  threshold: unknown;
  message: string;
  severity: string;
}

/**
 * An adjustment made to bring a decision within limits
 */
export interface Adjustment {
  safeguardName: string;
  safeguardId: string;
  field: string;
  originalValue: unknown;
  adjustedValue: unknown;
  message: string;
  severity: string;
}

/**
 * A warning that doesn't block but should be noted
 */
export interface Warning {
  safeguardName: string;
  safeguardId: string;
  field: string;
  value: unknown;
  message: string;
}

/**
 * Result of checking decisions against safeguards
 */
export interface ValidationResult {
  isValid: boolean;                 // true if no hard violations
  violations: Violation[];          // Hard violations that block the plan
  adjustments: Adjustment[];        // Values that were auto-adjusted
  warnings: Warning[];              // Soft warnings to log
  checkedAt: number;
}

/**
 * Check decisions against safeguards.
 *
 * PURE FUNCTION - does NOT write to database.
 * Returns validation result for Plan Generator to use.
 *
 * @param safeguards - Active safeguards sorted by priority
 * @param decisions - Proposed decisions to validate
 * @param runnerContext - Runner profile for conditional checks
 */
export function checkSafeguards(
  safeguards: Doc<"safeguards">[],
  decisions: Decision[],
  runnerContext: RunnerContext
): ValidationResult {
  const violations: Violation[] = [];
  const adjustments: Adjustment[] = [];
  const warnings: Warning[] = [];

  // Process each decision against all applicable safeguards
  for (const decision of decisions) {
    const applicableSafeguards = safeguards.filter(sg =>
      sg.condition.field === decision.field &&
      isApplicable(sg, runnerContext)
    );

    for (const sg of applicableSafeguards) {
      const triggered = evaluateCondition(
        sg.condition.operator,
        decision.proposedValue,
        sg.condition.threshold
      );

      if (triggered) {
        handleTriggeredSafeguard(sg, decision, violations, adjustments, warnings);
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    adjustments,
    warnings,
    checkedAt: Date.now(),
  };
}

function isApplicable(
  safeguard: Doc<"safeguards">,
  context: RunnerContext
): boolean {
  const when = safeguard.condition.applicableWhen;
  if (!when) return true;

  if (when.experienceLevel && !when.experienceLevel.includes(context.experienceLevel)) {
    return false;
  }

  if (when.hasInjuryHistory !== undefined && when.hasInjuryHistory !== context.hasInjuryHistory) {
    return false;
  }

  if (when.injuryTypes && context.injuryTypes) {
    const hasMatch = when.injuryTypes.some(t => context.injuryTypes!.includes(t));
    if (!hasMatch) return false;
  }

  if (when.age && context.age !== undefined) {
    const ageCheck = evaluateCondition(when.age.operator, context.age, when.age.value);
    if (!ageCheck) return false;
  }

  return true;
}

function evaluateCondition(
  operator: string,
  value: unknown,
  threshold: unknown
): boolean {
  const numValue = typeof value === "number" ? value : parseFloat(String(value));
  const numThreshold = typeof threshold === "number" ? threshold : parseFloat(String(threshold));

  switch (operator) {
    case ">": return numValue > numThreshold;
    case "<": return numValue < numThreshold;
    case ">=": return numValue >= numThreshold;
    case "<=": return numValue <= numThreshold;
    case "==": return value === threshold;
    case "!=": return value !== threshold;
    case "contains":
      return Array.isArray(value) && value.includes(threshold);
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

function handleTriggeredSafeguard(
  sg: Doc<"safeguards">,
  decision: Decision,
  violations: Violation[],
  adjustments: Adjustment[],
  warnings: Warning[]
): void {
  const baseInfo = {
    safeguardName: sg.name,
    safeguardId: sg._id.toString(),
    field: decision.field,
  };

  switch (sg.ruleType) {
    case "hard_limit":
      if (sg.action.type === "cap" && sg.action.adjustment !== undefined) {
        adjustments.push({
          ...baseInfo,
          originalValue: decision.proposedValue,
          adjustedValue: sg.action.adjustment,
          message: sg.action.message,
          severity: sg.action.severity,
        });
      } else {
        violations.push({
          ...baseInfo,
          proposedValue: decision.proposedValue,
          threshold: sg.condition.threshold,
          message: sg.action.message,
          severity: sg.action.severity,
        });
      }
      break;

    case "soft_limit":
      if (sg.action.adjustment !== undefined) {
        adjustments.push({
          ...baseInfo,
          originalValue: decision.proposedValue,
          adjustedValue: sg.action.adjustment,
          message: sg.action.message,
          severity: sg.action.severity,
        });
      } else {
        warnings.push({
          ...baseInfo,
          value: decision.proposedValue,
          message: sg.action.message,
        });
      }
      break;

    case "warning":
      warnings.push({
        ...baseInfo,
        value: decision.proposedValue,
        message: sg.action.message,
      });
      break;
  }
}
```

### Seed Data Structure

```typescript
// packages/backend/convex/seeds/safeguards.seed.ts

const SAFEGUARDS_SEEDS = [
  // Volume Safeguards
  {
    name: "max_volume_increase_10_percent",
    description: "Weekly volume cannot increase more than 10% from previous week",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0.10,
    },
    action: {
      type: "cap",
      adjustment: 0.10,
      message: "Volume increase capped at 10% to prevent overuse injury",
      severity: "warning",
    },
    source: "established_practice",
    rationale: "Rapid volume increases are the #1 cause of running injuries",
    isActive: true,
    priority: 1,
  },
  {
    name: "max_volume_increase_injury_history",
    description: "Runners with injury history limited to 7% volume increase",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0.07,
      applicableWhen: {
        hasInjuryHistory: true,
      },
    },
    action: {
      type: "cap",
      adjustment: 0.07,
      message: "Volume increase capped at 7% due to injury history",
      severity: "warning",
    },
    source: "established_practice",
    rationale: "Injury history increases re-injury risk with rapid progressions",
    isActive: true,
    priority: 0, // Higher priority than general 10% rule
  },
  // ... 8+ more safeguards per AC3
];
```

### File Structure After Implementation

```
packages/backend/convex/
├── table/
│   └── safeguards.ts            # NEW - table definition
├── safeguards/
│   ├── check.ts                 # NEW - check function
│   └── index.ts                 # NEW - barrel export
├── seeds/
│   └── safeguards.seed.ts       # NEW - seed data
└── schema.ts                    # MODIFIED - add safeguards
```

### Integration with Plan Generator

The Plan Generator (Story 6.5) will:
1. Propose decisions (volume increases, session types, etc.)
2. Call `checkSafeguards()` with decisions and runner context
3. Apply adjustments returned
4. Block if violations exist
5. Log all safeguard applications to `trainingPlans.safeguardApplications`

```typescript
// Example usage in Plan Generator (Story 6.5)
const decisions: Decision[] = [
  { field: "weeklyVolumeIncrease", proposedValue: 0.15 },
  { field: "consecutiveHardDays", proposedValue: 2 },
];

const runnerContext: RunnerContext = {
  experienceLevel: "beginner",
  age: 52,
  hasInjuryHistory: true,
  injuryTypes: ["shin_splints"],
};

const result = checkSafeguards(activeSafeguards, decisions, runnerContext);

if (!result.isValid) {
  // Handle violations - cannot proceed
}

// Apply adjustments to plan
for (const adj of result.adjustments) {
  plan[adj.field] = adj.adjustedValue;
}

// Log to plan's safeguardApplications
plan.safeguardApplications = [
  ...result.adjustments.map(a => ({ type: "adjusted", ...a })),
  ...result.warnings.map(w => ({ type: "warning", ...w })),
];
```

### Dependencies

- **Depends on:** None (foundational Epic 6 component)
- **Required by:** Story 6.5 (Plan Generator Core)
- **Related to:** Story 6.3 (Knowledge Base) - provides rationale for safeguards

### Testing Checklist

After implementation:
- [ ] `npx convex dev` runs without errors
- [ ] TypeScript type-check passes (`npx convex codegen`)
- [ ] checkSafeguards returns empty violations for valid decisions
- [ ] checkSafeguards returns violations for hard_limit breaches
- [ ] checkSafeguards returns adjustments for cappable violations
- [ ] checkSafeguards filters by runner context correctly
- [ ] Priority ordering works (lower priority number = checked first)
- [ ] Seed mutation creates all 10+ safeguards
- [ ] Clear mutation removes all safeguards

## References

- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Safeguards-System]
- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#Module-5-Safeguards]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.4]
- [Pattern Reference: Story 5.4 Inference Engine - pure function pattern]
- [Pattern Reference: Story 5.3 Data Adapters Pattern - interface pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- convex codegen: passed all validations
- pnpm run typecheck: passed

### Completion Notes List

- Task 1: Created safeguards table with typed unions for category, ruleType, actionType, severity, and operator. Added condition and action validators. Indexed by_category and by_priority.
- Task 2: Implemented pure checkSafeguards() function with Decision, RunnerContext, ValidationResult types. Handles hard_limit (block/cap), soft_limit (adjust/warn), and warning rule types. Includes isApplicable() for conditional safeguard filtering and evaluateCondition() for threshold comparison.
- Task 3: Seeded 13 safeguards covering all AC#3 requirements plus 3 additional safety rules. Includes seedSafeguards mutation and clearSafeguards mutation (admin-only).
- Task 4: Created barrel export for clean imports of check function and types.

### File List

- packages/backend/convex/table/safeguards.ts (NEW)
- packages/backend/convex/safeguards/check.ts (NEW)
- packages/backend/convex/safeguards/index.ts (NEW)
- packages/backend/convex/seeds/safeguards.ts (NEW)
- packages/backend/convex/schema.ts (MODIFIED)

### Change Log

- 2026-02-16: Story 6.4 implemented - Safeguards system with schema, check function, and seed data
