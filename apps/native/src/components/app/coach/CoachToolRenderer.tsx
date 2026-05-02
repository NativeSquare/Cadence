/**
 * CoachToolRenderer
 *
 * Switch-case router that maps tool names to their corresponding
 * action card components in the coach chat context.
 *
 * Similar to the onboarding tool-renderer.tsx but handles action
 * proposal tools that require user confirmation before execution.
 */

import { useEffect, useRef } from "react";
import { questionPause } from "@/lib/haptics";
import {
  RescheduleWorkoutCard,
  ModifyWorkoutCard,
  SwapWorkoutsCard,
} from "./actions";
import type {
  RescheduleProposal,
  ModifyProposal,
  SwapProposal,
} from "./actions";

// =============================================================================
// Types
// =============================================================================

type ToolState = "streaming" | "call" | "result";

interface CoachToolRendererProps {
  toolName: string;
  toolCallId: string;
  state: ToolState;
  args?: unknown;
  /** Execute the mutation for this proposal */
  executeMutation: (toolName: string, args: unknown) => Promise<{ success: boolean; error?: string }>;
  /** Called after the user accepts a proposal */
  onAccepted: (toolName: string, args: unknown) => void;
  /** Called after the user rejects a proposal */
  onRejected: (toolName: string, args: unknown) => void;
}

// =============================================================================
// Component
// =============================================================================

export function CoachToolRenderer({
  toolName,
  toolCallId,
  state,
  args,
  executeMutation,
  onAccepted,
  onRejected,
}: CoachToolRendererProps) {
  const hasTriggeredHaptic = useRef(false);

  // Fire haptic when tool first appears in 'call' state
  useEffect(() => {
    if (state === "call" && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      questionPause();
    }
  }, [state]);

  // Don't render anything while still streaming the tool call
  if (state === "streaming") return null;

  switch (toolName) {
    case "proposeRescheduleWorkout":
      return (
        <RescheduleWorkoutCard
          toolCallId={toolCallId}
          proposal={args as RescheduleProposal}
          executeMutation={() => executeMutation(toolName, args)}
          onAccepted={() => onAccepted(toolName, args)}
          onRejected={() => onRejected(toolName, args)}
        />
      );

    case "proposeModifyWorkout":
      return (
        <ModifyWorkoutCard
          toolCallId={toolCallId}
          proposal={args as ModifyProposal}
          executeMutation={() => executeMutation(toolName, args)}
          onAccepted={() => onAccepted(toolName, args)}
          onRejected={() => onRejected(toolName, args)}
        />
      );

    case "proposeSwapWorkouts":
      return (
        <SwapWorkoutsCard
          toolCallId={toolCallId}
          proposal={args as SwapProposal}
          executeMutation={() => executeMutation(toolName, args)}
          onAccepted={() => onAccepted(toolName, args)}
          onRejected={() => onRejected(toolName, args)}
        />
      );

    default:
      // Not an action tool — return null so CoachChatView can skip it
      return null;
  }
}
