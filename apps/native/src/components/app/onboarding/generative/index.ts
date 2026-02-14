/**
 * Generative UI Components
 *
 * Exports all components and types for AI-powered generative UI.
 * Used in conversational onboarding flow with AI SDK streaming.
 *
 * Source: Story 2.2 - AC#1
 * Updated: Stories 2.3, 2.4, 2.5, 2.6
 */

// =============================================================================
// Components
// =============================================================================

export { ToolRenderer } from "./tool-renderer";
export { MessageParts } from "./MessageParts";
export { ToolLoading } from "./ToolLoading";
export { AIConversationView } from "./AIConversationView";
export {
  ToolStateProvider,
  useToolStateContext,
  useToolState,
} from "./tool-state-context";

// Tool Components (Stories 2.3-2.6)
export { MultipleChoiceInput } from "./MultipleChoiceInput";
export { OpenInput } from "./OpenInput";
export { VoiceInput } from "./VoiceInput";
export { ConfirmationCard } from "./ConfirmationCard";

// =============================================================================
// Types
// =============================================================================

export type {
  // Tool state
  ToolState,
  // Base props
  BaseToolProps,
  ToolPartProps,
  // Multiple Choice (Story 2.3)
  MultipleChoiceOption,
  MultipleChoiceArgs,
  MultipleChoiceProps,
  // Open Input (Story 2.4)
  OpenInputArgs,
  OpenInputProps,
  // Voice Input (Story 2.5)
  VoiceInputArgs,
  VoiceInputProps,
  // Confirmation (Story 2.6)
  ConfirmationField,
  ConfirmationArgs,
  ConfirmationProps,
  // Progress
  ProgressArgs,
  ProgressProps,
  // Thinking Stream
  ThinkingStreamArgs,
  ThinkingStreamProps,
  // Connection Card
  ConnectionCardArgs,
  ConnectionCardProps,
  // Tool mapping
  ToolName,
  ToolPartType,
  // Message parts
  TextPart,
  ToolCallPart,
  ToolResultPart,
  MessagePart,
} from "./types";
