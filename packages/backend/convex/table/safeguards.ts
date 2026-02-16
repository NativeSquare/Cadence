import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Safeguards Table Schema (Story 6.4)
// =============================================================================
// Stores safety rules that validate all plan generation decisions.
// Used by: Plan Generator (Module 6), via Safeguards.check()
//
// Reference: data-model-comprehensive.md#Safeguards-System
// Reference: architecture-backend-v2.md#Module-5-Safeguards
//
// Single Writer Principle: Admin/seeder only - no runtime writes

// Category types for safeguards
const categoryValues = v.union(
  v.literal("volume"),
  v.literal("intensity"),
  v.literal("frequency"),
  v.literal("recovery"),
  v.literal("safety")
);

// Rule types determine how violations are handled
const ruleTypeValues = v.union(
  v.literal("hard_limit"), // Cannot be exceeded - blocks or auto-caps
  v.literal("soft_limit"), // Can be exceeded with adjustment/warning
  v.literal("warning") // Log only, no blocking
);

// Action types when a safeguard is triggered
const actionTypeValues = v.union(
  v.literal("cap"), // Cap value at threshold
  v.literal("reduce"), // Reduce value by percentage
  v.literal("block"), // Block the decision entirely
  v.literal("warn"), // Warn but allow
  v.literal("require_confirmation") // Require user confirmation
);

// Severity levels for actions
const severityValues = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("critical")
);

// Comparison operators for conditions
const operatorValues = v.union(
  v.literal(">"),
  v.literal("<"),
  v.literal(">="),
  v.literal("<="),
  v.literal("=="),
  v.literal("!="),
  v.literal("contains")
);

// Condition that triggers a safeguard
const conditionValidator = v.object({
  field: v.string(), // "weeklyVolumeIncrease" | "consecutiveHardDays" | etc.
  operator: operatorValues,
  threshold: v.any(), // The limit value (number, string, or boolean)

  // Optional: Only apply to certain runner profiles
  applicableWhen: v.optional(
    v.object({
      experienceLevel: v.optional(v.array(v.string())), // ["beginner", "intermediate"]
      hasInjuryHistory: v.optional(v.boolean()),
      injuryTypes: v.optional(v.array(v.string())), // ["shin_splints", "plantar_fasciitis"]
      age: v.optional(
        v.object({
          operator: operatorValues,
          value: v.number(),
        })
      ),
      currentPhase: v.optional(v.array(v.string())), // ["base", "build", "peak", "taper"]
    })
  ),
});

// Action to take when safeguard is triggered
const actionValidator = v.object({
  type: actionTypeValues,
  adjustment: v.optional(v.any()), // How to adjust if action is "cap" or "reduce"
  message: v.string(), // Message to show/log
  severity: severityValues,
});

export const safeguards = defineTable({
  // Identification
  name: v.string(), // "max_volume_increase_10_percent"
  description: v.string(),
  category: categoryValues,

  // Rule Definition
  ruleType: ruleTypeValues,

  // The condition that triggers this safeguard
  condition: conditionValidator,

  // Action to take when triggered
  action: actionValidator,

  // Source & Validation
  source: v.string(), // "established_practice" | "daniels" | "research"
  rationale: v.string(), // Why this safeguard exists

  // Status
  isActive: v.boolean(),
  priority: v.number(), // Lower = higher priority (checked first)

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_category", ["category", "isActive"])
  .index("by_priority", ["isActive", "priority"]);

// =============================================================================
// Exported Types
// =============================================================================

export type Safeguard = typeof safeguards.validator.type;
export type SafeguardCategory = typeof categoryValues.type;
export type SafeguardRuleType = typeof ruleTypeValues.type;
export type SafeguardActionType = typeof actionTypeValues.type;
export type SafeguardSeverity = typeof severityValues.type;
export type SafeguardCondition = typeof conditionValidator.type;
export type SafeguardAction = typeof actionValidator.type;
