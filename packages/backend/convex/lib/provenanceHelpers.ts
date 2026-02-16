/**
 * Provenance Helper Functions (Story 5.2)
 *
 * These helpers support tracing data provenance for justifications.
 * They work with both old (plain value) and new (with provenance) formats
 * for backward compatibility.
 *
 * ## Provenance Integration Strategy (AC1)
 *
 * The provenance types (DataProvenance, FieldWithProvenance) are defined here
 * for use by:
 * 1. Tool result handlers - wrap user input with provenance before storing
 * 2. Inference engine - wrap calculated values with provenance
 * 3. Plan generator - use buildJustification() to explain decisions
 *
 * Schema fields can optionally store provenance-wrapped values. The helpers
 * automatically handle both plain values (backward compat) and wrapped values.
 * Full schema integration of provenance validators is planned for Phase 2.
 *
 * Reference: architecture-backend-v2.md#Justification-Tracking
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Source of data - where did this value come from?
 */
export type DataSource = "user_input" | "wearable" | "inferred" | "default" | "unknown";

/**
 * How was user input collected?
 */
export type InputMethod = "slider" | "selection" | "text" | "confirmation" | "voice" | "multi_select";

/**
 * Provenance metadata tracks WHERE data came from.
 * This enables justifications like: "4 sessions/week because you said you can run 4 days"
 */
export interface DataProvenance {
  /** Where the data originated */
  source: DataSource;

  /** For user_input: how they provided it */
  inputMethod?: InputMethod;

  /** The question that was asked (for justification: "You were asked X") */
  questionAsked?: string;

  /** The tool that collected it */
  toolName?: string;
  toolCallId?: string;

  /** When it was collected */
  collectedAt: number;

  /** For inferred values: confidence score 0-1 */
  confidence?: number;

  /** For inferred values: what fields/tables it was calculated from */
  inferredFrom?: string[];

  /** Conversation context */
  conversationId?: string;
  messageIndex?: number;
}

/**
 * A field value wrapped with its provenance metadata.
 */
export interface FieldWithProvenance<T = unknown> {
  value: T;
  provenance: DataProvenance;
}

/**
 * Decision factor for justification building.
 */
export interface DecisionFactor {
  field: string;
  value: unknown;
  source: DataSource;
  confidence?: number;
  explanation?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a nested field value from an object using dot notation path.
 *
 * @param obj - The object to traverse
 * @param path - Dot-notation path like "schedule.availableDays"
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * getNestedValue({ schedule: { availableDays: 4 } }, "schedule.availableDays")
 * // Returns: 4
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined;

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Get field value, unwrapping provenance if present.
 * Works with both old (plain value) and new (with provenance) formats.
 *
 * @param runner - The runner object (or any object)
 * @param path - Dot-notation path to the field
 * @returns The raw value, unwrapped from provenance if needed
 *
 * @example
 * // Plain value
 * getFieldValue({ schedule: { availableDays: 4 } }, "schedule.availableDays")
 * // Returns: 4
 *
 * // With provenance wrapper
 * getFieldValue({ schedule: { availableDays: { value: 4, provenance: {...} } } }, "schedule.availableDays")
 * // Returns: 4
 */
export function getFieldValue<T = unknown>(
  runner: unknown,
  path: string
): T | undefined {
  const rawValue = getNestedValue(runner, path);
  if (rawValue === undefined || rawValue === null) return undefined;

  // Check if it's a provenance-wrapped value
  if (isProvenanceWrapped(rawValue)) {
    return rawValue.value as T;
  }

  // Plain value (backward compatibility)
  return rawValue as T;
}

/**
 * Get field with full provenance metadata.
 * Returns null if field doesn't exist.
 *
 * @param runner - The runner object
 * @param path - Dot-notation path to the field
 * @returns The value with provenance, or null if not found
 *
 * @example
 * getFieldWithProvenance(runner, "schedule.availableDays")
 * // Returns: { value: 4, provenance: { source: "user_input", ... } }
 */
export function getFieldWithProvenance(
  runner: unknown,
  path: string
): FieldWithProvenance | null {
  const rawValue = getNestedValue(runner, path);
  if (rawValue === undefined || rawValue === null) return null;

  // If already has provenance, return as-is
  if (isProvenanceWrapped(rawValue)) {
    return rawValue as FieldWithProvenance;
  }

  // Wrap plain value with "unknown" provenance for backward compatibility
  return {
    value: rawValue,
    provenance: {
      source: "unknown",
      collectedAt: Date.now(),
    },
  };
}

/**
 * Check if a value is wrapped with provenance metadata.
 */
export function isProvenanceWrapped(value: unknown): value is FieldWithProvenance {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "provenance" in value
  );
}

/**
 * Wrap a value with provenance metadata.
 *
 * @param value - The value to wrap
 * @param provenance - The provenance metadata
 * @returns The value wrapped with provenance
 */
export function wrapWithProvenance<T>(
  value: T,
  provenance: DataProvenance
): FieldWithProvenance<T> {
  return { value, provenance };
}

/**
 * Create provenance for user input.
 *
 * @param options - Options for creating user input provenance
 * @returns Provenance metadata for user input
 */
export function createUserInputProvenance(options: {
  inputMethod: InputMethod;
  questionAsked?: string;
  toolName?: string;
  toolCallId?: string;
  conversationId?: string;
  messageIndex?: number;
}): DataProvenance {
  return {
    source: "user_input",
    inputMethod: options.inputMethod,
    questionAsked: options.questionAsked,
    toolName: options.toolName,
    toolCallId: options.toolCallId,
    collectedAt: Date.now(),
    conversationId: options.conversationId,
    messageIndex: options.messageIndex,
  };
}

/**
 * Create provenance for wearable-sourced data.
 *
 * @param source - The wearable source (e.g., "strava", "healthkit")
 * @param options - Additional options
 * @returns Provenance metadata for wearable data
 */
export function createWearableProvenance(
  source: string,
  options: {
    confidence?: number;
    inferredFrom?: string[];
  } = {}
): DataProvenance {
  return {
    source: "wearable",
    collectedAt: Date.now(),
    confidence: options.confidence ?? 0.9,
    inferredFrom: options.inferredFrom ?? [source],
  };
}

/**
 * Create provenance for inferred/calculated data.
 *
 * @param inferredFrom - List of source fields/tables used for inference
 * @param confidence - Confidence score 0-1
 * @returns Provenance metadata for inferred data
 */
export function createInferredProvenance(
  inferredFrom: string[],
  confidence: number
): DataProvenance {
  return {
    source: "inferred",
    collectedAt: Date.now(),
    confidence,
    inferredFrom,
  };
}

// =============================================================================
// Justification Building
// =============================================================================

/**
 * Extract decision factors from multiple fields for justification building.
 *
 * @param runner - The runner object
 * @param fields - Array of field paths to extract
 * @returns Array of decision factors with provenance info
 */
export function extractDecisionFactors(
  runner: unknown,
  fields: string[]
): DecisionFactor[] {
  const factors: DecisionFactor[] = [];

  for (const field of fields) {
    const withProv = getFieldWithProvenance(runner, field);
    if (withProv) {
      factors.push({
        field,
        value: withProv.value,
        source: withProv.provenance.source,
        confidence: withProv.provenance.confidence,
        explanation: buildFactorExplanation(field, withProv),
      });
    }
  }

  return factors;
}

/**
 * Build a human-readable explanation for a single factor.
 */
function buildFactorExplanation(
  field: string,
  withProv: FieldWithProvenance
): string {
  const { value, provenance } = withProv;
  const displayValue = formatValue(value);

  switch (provenance.source) {
    case "user_input":
      if (provenance.questionAsked) {
        return `You said ${displayValue} when asked "${provenance.questionAsked}"`;
      }
      return `You provided: ${displayValue}`;

    case "wearable":
      const wearableSource = provenance.inferredFrom?.[0] || "wearable";
      return `${displayValue} (from ${wearableSource} data)`;

    case "inferred":
      const sources = provenance.inferredFrom?.join(", ") || "available data";
      const conf = provenance.confidence
        ? ` (${Math.round(provenance.confidence * 100)}% confidence)`
        : "";
      return `${displayValue} calculated from ${sources}${conf}`;

    case "default":
      return `${displayValue} (default value)`;

    default:
      return `${displayValue}`;
  }
}

/**
 * Format a value for display in justifications.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "not set";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) {
    if (value.length === 0) return "none";
    return value.join(", ");
  }
  return String(value);
}

/**
 * Build a complete justification string explaining a decision.
 * Matches Story 5.2 AC3 signature: buildJustification(runner, decision)
 *
 * @param runner - The runner object
 * @param decision - The decision being made (e.g., "4 sessions per week")
 * @param contributingFields - Optional: specific fields to trace. If omitted, auto-detects from decision context.
 * @returns A formatted justification string
 *
 * @example
 * buildJustification(runner, "4 training sessions per week")
 * // Returns: "4 training sessions per week" (no fields specified)
 *
 * buildJustification(
 *   runner,
 *   "4 training sessions per week",
 *   ["schedule.availableDays", "health.recoveryStyle"]
 * )
 * // Returns:
 * // "4 training sessions per week
 * //
 * // Based on:
 * // - schedule.availableDays: You said 4 when asked "How many days can you run?"
 * // - health.recoveryStyle: You provided: slow"
 */
export function buildJustification(
  runner: unknown,
  decision: string,
  contributingFields?: string[]
): string {
  // If no fields specified, return decision as-is
  // Caller can provide fields for detailed justification
  if (!contributingFields || contributingFields.length === 0) {
    return decision;
  }

  const factors = extractDecisionFactors(runner, contributingFields);

  if (factors.length === 0) {
    return decision;
  }

  const factorLines = factors.map(
    (f) => `- ${f.field}: ${f.explanation}`
  );

  return `${decision}\n\nBased on:\n${factorLines.join("\n")}`;
}

/**
 * Build a short justification for inline use.
 *
 * @param runner - The runner object
 * @param contributingFields - Fields that contributed to decision
 * @returns A short comma-separated list of sources
 *
 * @example
 * buildShortJustification(runner, ["schedule.availableDays", "goals.goalType"])
 * // Returns: "your availability (4 days), your race goal"
 */
export function buildShortJustification(
  runner: unknown,
  contributingFields: string[]
): string {
  const factors = extractDecisionFactors(runner, contributingFields);

  const parts = factors.map((f) => {
    const displayValue = formatValue(f.value);
    const fieldName = f.field.split(".").pop() || f.field;

    switch (f.source) {
      case "user_input":
        return `your ${humanizeFieldName(fieldName)} (${displayValue})`;
      case "wearable":
        return `${humanizeFieldName(fieldName)} from your watch (${displayValue})`;
      case "inferred":
        return `calculated ${humanizeFieldName(fieldName)} (${displayValue})`;
      default:
        return `${humanizeFieldName(fieldName)}: ${displayValue}`;
    }
  });

  return parts.join(", ");
}

/**
 * Convert camelCase or snake_case field names to human-readable format.
 */
function humanizeFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();
}
