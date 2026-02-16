// =============================================================================
// Safeguards Module Barrel Export (Story 6.4)
// =============================================================================
// Re-exports all safeguards types and functions for clean imports.
//
// Usage:
//   import { checkSafeguards, Decision, RunnerContext } from "./safeguards";
//
// Reference: architecture-backend-v2.md#Module-5-Safeguards

// Check function and types
export {
  checkSafeguards,
  type Decision,
  type RunnerContext,
  type Violation,
  type Adjustment,
  type Warning,
  type ValidationResult,
} from "./check";
