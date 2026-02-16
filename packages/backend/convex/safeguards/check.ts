// =============================================================================
// Safeguards Check Function (Story 6.4)
// =============================================================================
// Pure function that validates plan decisions against safety rules.
// Does NOT write to database - returns result for Plan Generator to use.
//
// Reference: architecture-backend-v2.md#Module-5-Safeguards
// Interface: Safeguards.check(decision, context) → ValidationResult

import type { Doc } from "../_generated/dataModel";

// =============================================================================
// Types
// =============================================================================

/**
 * A decision proposed by the plan generator that needs validation.
 * Each decision represents a single field/value pair to check.
 */
export interface Decision {
  field: string; // "weeklyVolumeIncrease" | "consecutiveHardDays" | etc.
  proposedValue: number | string | boolean;
  context?: Record<string, unknown>; // Additional context for complex checks
}

/**
 * Runner context for conditional safeguard application.
 * Safeguards can be conditionally applied based on runner profile.
 */
export interface RunnerContext {
  experienceLevel: string; // "beginner" | "intermediate" | "advanced"
  age?: number;
  hasInjuryHistory: boolean;
  injuryTypes?: string[];
  currentPhase?: string; // "base" | "build" | "peak" | "taper"
  weeksPostInjury?: number;
}

/**
 * A safeguard violation that cannot be auto-adjusted.
 * Hard limits that block the plan from proceeding.
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
 * An adjustment made to bring a decision within limits.
 * The plan can proceed with the adjusted value.
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
 * A warning that doesn't block but should be logged.
 * Informational only - plan proceeds as-is.
 */
export interface Warning {
  safeguardName: string;
  safeguardId: string;
  field: string;
  value: unknown;
  message: string;
}

/**
 * Result of checking decisions against safeguards.
 * Contains violations, adjustments, and warnings for logging.
 */
export interface ValidationResult {
  isValid: boolean; // true if no hard violations (blocking)
  violations: Violation[]; // Hard violations that block the plan
  adjustments: Adjustment[]; // Values that were auto-adjusted
  warnings: Warning[]; // Soft warnings to log
  checkedAt: number; // Timestamp of check
}

// =============================================================================
// Main Check Function
// =============================================================================

/**
 * Check decisions against safeguards.
 *
 * PURE FUNCTION - does NOT write to database.
 * Returns validation result for Plan Generator to use and log.
 *
 * @param safeguards - Active safeguards sorted by priority (lower = higher)
 * @param decisions - Proposed decisions to validate
 * @param runnerContext - Runner profile for conditional checks
 * @returns ValidationResult with violations, adjustments, and warnings
 */
export function checkSafeguards(
  safeguards: Doc<"safeguards">[],
  decisions: Decision[],
  runnerContext: RunnerContext
): ValidationResult {
  const violations: Violation[] = [];
  const adjustments: Adjustment[] = [];
  const warnings: Warning[] = [];

  // Track which decisions have been adjusted to prevent double-adjusting
  const adjustedFields = new Set<string>();

  // Process each decision against all applicable safeguards
  for (const decision of decisions) {
    // Find safeguards that apply to this field
    const applicableSafeguards = safeguards.filter(
      (sg) =>
        sg.condition.field === decision.field &&
        isApplicable(sg, runnerContext)
    );

    // Check each applicable safeguard (already sorted by priority)
    for (const sg of applicableSafeguards) {
      // Skip if this field was already adjusted by a higher-priority safeguard
      if (adjustedFields.has(decision.field) && sg.ruleType !== "warning") {
        continue;
      }

      const triggered = evaluateCondition(
        sg.condition.operator,
        decision.proposedValue,
        sg.condition.threshold
      );

      if (triggered) {
        handleTriggeredSafeguard(
          sg,
          decision,
          violations,
          adjustments,
          warnings,
          adjustedFields
        );
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a safeguard applies to the given runner context.
 * Returns true if no conditions specified or all conditions match.
 */
function isApplicable(
  safeguard: Doc<"safeguards">,
  context: RunnerContext
): boolean {
  const when = safeguard.condition.applicableWhen;

  // No conditions = applies to everyone
  if (!when) return true;

  // Check experience level filter
  if (
    when.experienceLevel &&
    !when.experienceLevel.includes(context.experienceLevel)
  ) {
    return false;
  }

  // Check injury history filter
  if (
    when.hasInjuryHistory !== undefined &&
    when.hasInjuryHistory !== context.hasInjuryHistory
  ) {
    return false;
  }

  // Check injury types filter (any match)
  if (when.injuryTypes && context.injuryTypes) {
    const hasMatch = when.injuryTypes.some((t) =>
      context.injuryTypes!.includes(t)
    );
    if (!hasMatch) return false;
  }

  // Check age filter
  if (when.age && context.age !== undefined) {
    const ageCheck = evaluateCondition(
      when.age.operator,
      context.age,
      when.age.value
    );
    if (!ageCheck) return false;
  }

  // Check current phase filter
  if (when.currentPhase && context.currentPhase) {
    if (!when.currentPhase.includes(context.currentPhase)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a condition by comparing value against threshold.
 * Handles numeric comparisons and contains operator.
 */
function evaluateCondition(
  operator: string,
  value: unknown,
  threshold: unknown
): boolean {
  // Handle contains operator for arrays
  if (operator === "contains") {
    return Array.isArray(value) && value.includes(threshold);
  }

  // Convert to numbers for comparison operators
  const numValue =
    typeof value === "number" ? value : parseFloat(String(value));
  const numThreshold =
    typeof threshold === "number" ? threshold : parseFloat(String(threshold));

  // Handle NaN cases
  if (isNaN(numValue) || isNaN(numThreshold)) {
    // Fall back to string comparison for == and !=
    if (operator === "==") return value === threshold;
    if (operator === "!=") return value !== threshold;
    return false;
  }

  switch (operator) {
    case ">":
      return numValue > numThreshold;
    case "<":
      return numValue < numThreshold;
    case ">=":
      return numValue >= numThreshold;
    case "<=":
      return numValue <= numThreshold;
    case "==":
      return numValue === numThreshold;
    case "!=":
      return numValue !== numThreshold;
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Handle a triggered safeguard by adding to appropriate result array.
 * Respects rule type to determine blocking vs adjusting behavior.
 */
function handleTriggeredSafeguard(
  sg: Doc<"safeguards">,
  decision: Decision,
  violations: Violation[],
  adjustments: Adjustment[],
  warnings: Warning[],
  adjustedFields: Set<string>
): void {
  const baseInfo = {
    safeguardName: sg.name,
    safeguardId: sg._id.toString(),
    field: decision.field,
  };

  switch (sg.ruleType) {
    case "hard_limit":
      // Hard limits can either cap/adjust or block
      if (
        (sg.action.type === "cap" || sg.action.type === "reduce") &&
        sg.action.adjustment !== undefined
      ) {
        // Auto-adjust to limit
        adjustments.push({
          ...baseInfo,
          originalValue: decision.proposedValue,
          adjustedValue: sg.action.adjustment,
          message: sg.action.message,
          severity: sg.action.severity,
        });
        adjustedFields.add(decision.field);
      } else {
        // Cannot auto-adjust - this is a violation
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
      // Soft limits prefer adjustment but fall back to warning
      if (sg.action.adjustment !== undefined) {
        adjustments.push({
          ...baseInfo,
          originalValue: decision.proposedValue,
          adjustedValue: sg.action.adjustment,
          message: sg.action.message,
          severity: sg.action.severity,
        });
        adjustedFields.add(decision.field);
      } else {
        warnings.push({
          ...baseInfo,
          value: decision.proposedValue,
          message: sg.action.message,
        });
      }
      break;

    case "warning":
      // Warnings are always just logged
      warnings.push({
        ...baseInfo,
        value: decision.proposedValue,
        message: sg.action.message,
      });
      break;
  }
}
