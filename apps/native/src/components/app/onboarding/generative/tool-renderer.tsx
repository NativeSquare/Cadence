/**
 * Tool Renderer Component
 *
 * Main switch statement router for rendering tool UI components.
 * Maps tool names to their corresponding React components.
 *
 * Source: Story 2.2 - AC#1
 * Updated: Stories 2.3, 2.4, 2.5, 2.6
 */

import { useEffect, useRef } from "react";
import { questionPause } from "@/lib/haptics";
import { ThinkingBlock } from "../thinking-block";
import { ConnectionCard } from "../connection-card";
import { ToolLoading } from "./ToolLoading";
import { MultipleChoiceInput } from "./MultipleChoiceInput";
import { OpenInput } from "./OpenInput";
import { ConfirmationCard } from "./ConfirmationCard";
import type {
  ToolState,
  MultipleChoiceArgs,
  ThinkingStreamArgs,
  ConnectionCardArgs,
} from "./types";

// =============================================================================
// Types
// =============================================================================

interface ToolRendererProps {
  /** The tool name (e.g., 'renderMultipleChoice') */
  toolName: string;
  /** Unique tool call identifier */
  toolCallId: string;
  /** Current tool state */
  state: ToolState;
  /** Tool arguments (available when state is 'call' or 'result') */
  args?: unknown;
  /** Tool result (available when state is 'result') */
  result?: unknown;
  /** Called when user submits a value */
  onSubmit?: (value: unknown) => void;
}

// =============================================================================
// OpenInput Args Type (aligned with backend)
// =============================================================================

interface OpenInputArgs {
  question?: string;
  prompt?: string;
  placeholder?: string;
  suggestedResponses?: string[];
  allowVoice?: boolean;
  multiline?: boolean;
  maxLength?: number;
  inputType?: "text" | "number" | "duration" | "pace";
  targetField?: string;
}

// =============================================================================
// ConfirmationCard Args Type (aligned with backend)
// =============================================================================

interface ConfirmationCardArgs {
  title: string;
  fields: Array<{
    label: string;
    value: string;
    fieldPath: string;
    editable?: boolean;
  }>;
  confirmLabel?: string;
  editLabel?: string;
}

// =============================================================================
// Wrapper for Existing Components
// =============================================================================

/**
 * Wrapper for ThinkingBlock to handle tool props
 */
function ThinkingStreamWrapper({
  args,
  onComplete,
}: {
  args?: ThinkingStreamArgs;
  onComplete?: () => void;
}) {
  if (!args?.lines) {
    return null;
  }

  return (
    <ThinkingBlock
      lines={args.lines}
      onComplete={onComplete}
    />
  );
}

/**
 * Wrapper for ConnectionCard to handle tool props
 */
function ConnectionCardWrapper({
  args,
  onSubmit,
}: {
  args?: ConnectionCardArgs;
  onSubmit?: (value: unknown) => void;
}) {
  const handleConnect = (providerId: string) => {
    onSubmit?.({ providerId, skipped: false });
  };

  const handleSkip = () => {
    onSubmit?.({ providerId: null, skipped: true });
  };

  return (
    <ConnectionCard
      onConnect={handleConnect}
      onSkip={handleSkip}
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ToolRenderer({
  toolName,
  toolCallId,
  state,
  args,
  result,
  onSubmit,
}: ToolRendererProps) {
  const hasTriggeredHaptic = useRef(false);

  // Fire haptic when tool first appears in 'call' state
  useEffect(() => {
    if (state === "call" && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      questionPause();
    }
  }, [state]);

  // Show loading skeleton while streaming
  if (state === "streaming") {
    return <ToolLoading toolName={toolName} />;
  }

  // After result is submitted, don't render interactive component
  const isDisabled = state === "result";

  // Render appropriate component based on tool name
  switch (toolName) {
    case "renderMultipleChoice":
      return (
        <MultipleChoiceInput
          toolCallId={toolCallId}
          args={args as MultipleChoiceArgs}
          onSubmit={(value) => onSubmit?.(value)}
          disabled={isDisabled}
        />
      );

    case "renderOpenInput": {
      const openInputArgs = args as OpenInputArgs;
      return (
        <OpenInput
          toolCallId={toolCallId}
          args={{
            prompt: openInputArgs?.question || openInputArgs?.prompt,
            placeholder: openInputArgs?.placeholder,
            suggestedResponses: openInputArgs?.suggestedResponses,
            allowVoice: openInputArgs?.allowVoice,
            multiline: openInputArgs?.multiline,
            maxLength: openInputArgs?.maxLength,
            inputType: openInputArgs?.inputType,
          }}
          onSubmit={(value) => onSubmit?.(value)}
          disabled={isDisabled}
        />
      );
    }

    case "renderConfirmation":
      return (
        <ConfirmationCard
          toolCallId={toolCallId}
          args={args as ConfirmationCardArgs}
          onSubmit={(value) => onSubmit?.(value)}
          disabled={isDisabled}
        />
      );

    case "renderVoiceInput":
      // Voice input is integrated into OpenInput via allowVoice prop
      // This case handles standalone voice input tool calls
      return (
        <OpenInput
          toolCallId={toolCallId}
          args={{
            prompt: (args as { prompt?: string })?.prompt,
            allowVoice: true,
          }}
          onSubmit={(value) => onSubmit?.(value)}
          disabled={isDisabled}
        />
      );

    case "renderThinkingStream":
      return (
        <ThinkingStreamWrapper
          args={args as ThinkingStreamArgs}
          onComplete={() => onSubmit?.({ complete: true })}
        />
      );

    case "renderConnectionCard":
      return (
        <ConnectionCardWrapper
          args={args as ConnectionCardArgs}
          onSubmit={onSubmit}
        />
      );

    case "renderProgress":
      // Progress indicator - can be implemented as needed
      // For now, return null as it's not critical for MVP
      return null;

    default:
      // Unknown tool type - log warning in development, render nothing
      if (__DEV__) {
        console.warn(`[ToolRenderer] Unknown tool type: ${toolName}`);
      }
      return null;
  }
}
