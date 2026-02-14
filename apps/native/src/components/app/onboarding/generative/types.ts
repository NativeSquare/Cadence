/**
 * Generative UI Type Definitions
 *
 * Shared types for tool components rendered via AI SDK streaming.
 * Aligned with backend tool schemas in convex/ai/tools/index.ts
 *
 * Source: Story 2.2 - AC#1, AC#3
 * Updated: Stories 2.3, 2.4, 2.5, 2.6
 */

// =============================================================================
// Tool State Types
// =============================================================================

/**
 * Tool lifecycle states
 * - streaming: Tool call is being processed
 * - call: Tool args available, ready to render interactive component
 * - result: Tool submitted, showing confirmation state
 * - error: Tool encountered an error
 */
export type ToolState = "streaming" | "call" | "result" | "error";

// =============================================================================
// Base Tool Props
// =============================================================================

/**
 * Base props shared by all tool components
 */
export interface BaseToolProps {
  /** Unique identifier for this tool call */
  toolCallId: string;
  /** Current state of the tool */
  state: ToolState;
  /** Called when user submits a value */
  onSubmit: (value: unknown) => void;
}

/**
 * Generic tool part props - extends base with typed args and result
 */
export interface ToolPartProps<TArgs = unknown, TResult = unknown>
  extends BaseToolProps {
  /** Tool arguments (available when state is 'call' or 'result') */
  args?: TArgs;
  /** Tool result (available when state is 'result') */
  result?: TResult;
}

// =============================================================================
// Multiple Choice Tool (Story 2.3)
// =============================================================================

export interface MultipleChoiceOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
}

export interface MultipleChoiceArgs {
  question?: string;
  options: MultipleChoiceOption[];
  targetField: string;
  allowMultiple?: boolean;
  allowFreeText?: boolean;
  allowSkip?: boolean;
  skipLabel?: string;
}

export interface MultipleChoiceProps extends BaseToolProps {
  args?: MultipleChoiceArgs;
  result?: string | string[] | { skipped: true } | { freeText: string };
}

// =============================================================================
// Open Input Tool (Story 2.4)
// =============================================================================

export interface OpenInputArgs {
  question?: string;
  prompt?: string;
  placeholder?: string;
  suggestedResponses?: string[];
  allowVoice?: boolean;
  multiline?: boolean;
  maxLength?: number;
  targetField?: string;
  inputType?: "text" | "number" | "duration" | "pace";
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  allowSkip?: boolean;
}

export interface OpenInputProps extends BaseToolProps {
  args?: OpenInputArgs;
  result?: string;
}

// =============================================================================
// Voice Input Tool (Story 2.5)
// =============================================================================

export interface VoiceInputArgs {
  prompt?: string;
  targetField?: string;
  maxDuration?: number;
}

export interface VoiceInputProps extends BaseToolProps {
  args?: VoiceInputArgs;
  result?: string;
}

// =============================================================================
// Confirmation Card Tool (Story 2.6)
// =============================================================================

export interface ConfirmationField {
  label: string;
  value: string;
  fieldPath: string;
  editable?: boolean;
}

export interface ConfirmationArgs {
  title: string;
  fields: ConfirmationField[];
  confirmLabel?: string;
  editLabel?: string;
}

export interface ConfirmationProps extends BaseToolProps {
  args?: ConfirmationArgs;
  result?: {
    confirmed: boolean;
    edits?: Record<string, string>;
  };
}

// =============================================================================
// Progress Tool
// =============================================================================

export interface ProgressArgs {
  currentPhase: string;
  completionPercentage: number;
  phasesCompleted: string[];
  currentPhaseProgress?: number;
}

export interface ProgressProps extends BaseToolProps {
  args?: ProgressArgs;
}

// =============================================================================
// Thinking Stream Tool
// =============================================================================

export interface ThinkingStreamArgs {
  lines: string[];
}

export interface ThinkingStreamProps extends BaseToolProps {
  args?: ThinkingStreamArgs;
  result?: { complete: boolean };
}

// =============================================================================
// Connection Card Tool
// =============================================================================

export interface ConnectionCardArgs {
  providers: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  skipLabel?: string;
}

export interface ConnectionCardProps extends BaseToolProps {
  args?: ConnectionCardArgs;
  result?: { providerId: string | null; skipped: boolean };
}

// =============================================================================
// Tool Name to Type Mapping
// =============================================================================

/**
 * Map of tool names to their corresponding part types
 * Used for type-safe switch statement routing
 */
export type ToolName =
  | "renderMultipleChoice"
  | "renderOpenInput"
  | "renderConfirmation"
  | "renderVoiceInput"
  | "renderProgress"
  | "renderThinkingStream"
  | "renderConnectionCard";

/**
 * Tool part type string format: `tool-${ToolName}`
 */
export type ToolPartType = `tool-${ToolName}`;

// =============================================================================
// Message Part Types (aligned with ai-stream.ts)
// =============================================================================

export interface TextPart {
  type: "text";
  text: string;
}

export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
}

export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: unknown;
}

export type MessagePart = TextPart | ToolCallPart | ToolResultPart;
