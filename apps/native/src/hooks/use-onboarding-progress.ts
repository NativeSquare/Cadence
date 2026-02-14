import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

type OnboardingProgress = {
  /** Data completeness percentage (0-100) */
  completeness: number;
  /** Current onboarding phase */
  phase:
    | "intro"
    | "data_bridge"
    | "profile"
    | "goals"
    | "schedule"
    | "health"
    | "coaching"
    | "analysis";
  /** List of missing required field paths */
  fieldsMissing: string[];
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Whether the runner is ready for plan generation */
  readyForPlan: boolean;
};

/**
 * Hook to subscribe to the current user's onboarding progress.
 * Returns real-time updates from Convex as the runner's data changes.
 */
export function useOnboardingProgress(): OnboardingProgress {
  const runner = useQuery(api.table.runners.getCurrentRunner);

  // Loading state
  if (runner === undefined) {
    return {
      completeness: 0,
      phase: "intro",
      fieldsMissing: [],
      isLoading: true,
      readyForPlan: false,
    };
  }

  // No runner exists yet
  if (runner === null) {
    return {
      completeness: 0,
      phase: "intro",
      fieldsMissing: [],
      isLoading: false,
      readyForPlan: false,
    };
  }

  // Return conversation state from runner
  const { conversationState } = runner;

  return {
    completeness: conversationState.dataCompleteness,
    phase: conversationState.currentPhase,
    fieldsMissing: conversationState.fieldsMissing,
    isLoading: false,
    readyForPlan: conversationState.readyForPlan,
  };
}
