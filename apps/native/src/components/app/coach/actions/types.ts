/**
 * Action Card Types
 *
 * Type definitions for AI coach action proposals that render
 * as confirmation cards in the chat UI.
 */

// =============================================================================
// State Machine
// =============================================================================

export type ActionCardPhase =
  | "streaming" // Tool call still being parsed from SSE
  | "pending" // Fully rendered, awaiting user decision
  | "applying" // User accepted, mutation in flight
  | "accepted" // Mutation succeeded
  | "rejected" // User explicitly rejected
  | "expired" // Proposal is no longer valid (workout changed externally)
  | "error"; // Mutation failed

// =============================================================================
// Proposal Types (match tool inputSchemas from actions.ts)
// =============================================================================

export interface RescheduleProposal {
  type: "reschedule";
  workoutId: string;
  workoutName: string;
  workoutType: string;
  currentDate: string;
  currentDayOfWeek: string;
  proposedDate: string;
  proposedDayOfWeek: string;
  duration: string;
  reason: string;
  impact?: string;
}

export interface ModifyProposal {
  type: "modify";
  workoutId: string;
  workoutName: string;
  changes: Array<{
    field: string;
    fieldLabel: string;
    oldValue: string;
    newValue: string;
  }>;
  reason: string;
}

export interface SwapProposal {
  type: "swap";
  workoutA: {
    workoutId: string;
    workoutName: string;
    workoutType: string;
    date: string;
    dayOfWeek: string;
    duration: string;
  };
  workoutB: {
    workoutId: string;
    workoutName: string;
    workoutType: string;
    date: string;
    dayOfWeek: string;
    duration: string;
  };
  reason: string;
}

export type ActionProposal =
  | RescheduleProposal
  | ModifyProposal
  | SwapProposal;

// =============================================================================
// Action Card Props
// =============================================================================

export interface ActionCardProps {
  /** Unique tool call ID for tracking */
  toolCallId: string;
  /** Current phase of the card */
  phase: ActionCardPhase;
  /** Called when user taps Accept */
  onAccept: () => void;
  /** Called when user taps Reject */
  onReject: () => void;
  /** Error message when phase is "error" */
  errorMessage?: string;
  /** Called when user taps Retry after error */
  onRetry?: () => void;
}

// =============================================================================
// Action Result (sent back to LLM via chat message)
// =============================================================================

export interface ActionResult {
  action: "accepted" | "rejected";
  proposalType: string;
  summary: string;
}
