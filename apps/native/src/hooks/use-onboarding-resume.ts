import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

type OnboardingScene =
  | "welcome-intro"
  | "welcome-got-it"
  | "welcome-transition"
  | "questions"
  | "wearable"
  | "thinking-stream"
  | "coaching-response"
  | "honest-limits"
  | "synthesis"
  | "handoff";

type OnboardingPhase =
  | "intro"
  | "data_bridge"
  | "profile"
  | "goals"
  | "schedule"
  | "health"
  | "coaching"
  | "analysis";

type ResumeState = {
  /** The scene to resume from */
  targetScene: OnboardingScene;
  /** Whether a runner exists with partial progress */
  isResuming: boolean;
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Data completeness percentage */
  completeness: number;
  /** Current phase for context */
  currentPhase: OnboardingPhase;
};

/**
 * Maps conversation phases to onboarding scenes.
 * Profile, goals, schedule, health, and coaching all route to the questions scene
 * since SectionFlow handles all these phases internally.
 */
function phaseToScene(phase: OnboardingPhase): OnboardingScene {
  switch (phase) {
    case "intro":
      return "welcome-intro";
    case "data_bridge":
      return "wearable";
    case "profile":
    case "goals":
    case "schedule":
    case "health":
    case "coaching":
      return "questions";
    case "analysis":
      return "thinking-stream";
    default:
      return "welcome-intro";
  }
}

/**
 * Hook to determine where to resume onboarding.
 * Reads current_phase from Runner Object and maps to appropriate scene.
 */
export function useOnboardingResume(): ResumeState {
  const runner = useQuery(api.table.runners.getCurrentRunner);

  // Loading state
  if (runner === undefined) {
    return {
      targetScene: "welcome-intro",
      isResuming: false,
      isLoading: true,
      completeness: 0,
      currentPhase: "intro",
    };
  }

  // No runner exists - fresh start
  if (runner === null) {
    return {
      targetScene: "welcome-intro",
      isResuming: false,
      isLoading: false,
      completeness: 0,
      currentPhase: "intro",
    };
  }

  const { conversationState } = runner;
  const { dataCompleteness, currentPhase } = conversationState;

  // Determine if this is a resume (has any progress)
  const isResuming = dataCompleteness > 0;

  // Map phase to scene
  const targetScene = phaseToScene(currentPhase);

  return {
    targetScene,
    isResuming,
    isLoading: false,
    completeness: dataCompleteness,
    currentPhase,
  };
}
