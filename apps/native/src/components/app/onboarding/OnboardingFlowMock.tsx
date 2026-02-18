/**
 * OnboardingFlowMock - Complete mock flow for UX validation.
 *
 * Renders all 13 onboarding screens in sequence with:
 * - Path context (DATA vs NO DATA)
 * - Progress bar
 * - Screen transitions
 *
 * Source: Story 3.5 - Tasks 1, 3, 8 (AC#1-#10)
 */

import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { MockPathProvider, useMockPath } from "./MockPathContext";
import { FlowProgressBar } from "./FlowProgressBar";
import { ScreenTransition } from "./ScreenTransition";
import { screenProgressMap } from "./mock-data";
import { COLORS } from "@/lib/design-tokens";

// Mock screens (matching cadence-v3.jsx prototype)
import {
  WelcomeMock,
  SelfReportMock,
  GoalsMock,
  HealthMock,
  StyleMock,
  OpenQuestionMock,
  TransitionMock,
} from "./mocks/screens";
import type { GoalsData, HealthData, CoachingData } from "./mocks/screens";

// Real data-driven screen
import { DataInsightsScreen } from "./screens/DataInsightsScreen";

// Regular screens (visualization/utility)
import { WearableScreen } from "./screens/WearableScreen";
import { RadarScreen } from "./screens/RadarScreen";
import { ProgressionScreen } from "./screens/ProgressionScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { VerdictScreen } from "./screens/VerdictScreen";
import { PaywallScreen } from "./screens/PaywallScreen";

// =============================================================================
// Types
// =============================================================================

export interface OnboardingFlowMockProps {
  /** Initial path: 'data' or 'no-data' */
  initialPath?: "data" | "no-data";
  /** Called when flow completes */
  onComplete?: (result: { startedTrial: boolean }) => void;
  /** Initial screen index */
  initialScreenIndex?: number;
  /** User name from database (runner.identity.name or fallback to user.name) */
  userName?: string;
  /** Test ID for visual regression */
  testID?: string;
}

type ScreenName =
  | "welcome"
  | "wearable"
  | "selfReport"
  | "goals"
  | "health"
  | "style"
  | "openQuestion"
  | "transition"
  | "radar"
  | "progression"
  | "calendar"
  | "verdict"
  | "paywall";

interface ScreenConfig {
  name: ScreenName;
  label: string;
}

// =============================================================================
// Screen Configuration
// =============================================================================

const SCREENS: ScreenConfig[] = [
  { name: "welcome", label: "Welcome" },
  { name: "wearable", label: "Wearable" },
  { name: "selfReport", label: "SelfReport" },
  { name: "goals", label: "Goals" },
  { name: "health", label: "Health" },
  { name: "style", label: "Style" },
  { name: "openQuestion", label: "OpenQ" },
  { name: "transition", label: "Transition" },
  { name: "radar", label: "Radar" },
  { name: "progression", label: "Progress" },
  { name: "calendar", label: "Calendar" },
  { name: "verdict", label: "Verdict" },
  { name: "paywall", label: "Paywall" },
];

// =============================================================================
// Inner Component (uses context)
// =============================================================================

function OnboardingFlowMockInner({
  onComplete,
  initialScreenIndex = 0,
  userName: initialUserName = "",
  testID,
}: Omit<OnboardingFlowMockProps, "initialPath">) {
  const { hasData, setPath } = useMockPath();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(initialScreenIndex);
  const [userName, setUserName] = useState(initialUserName);

  const currentScreen = SCREENS[currentScreenIndex];
  const progress = screenProgressMap[currentScreenIndex] ?? 0;

  // Query runner to get ID for updates
  const runner = useQuery(api.table.runners.getCurrentRunner);

  // Mutation for updating runner fields
  const updateRunner = useMutation(api.table.runners.updateRunner);

  // Navigation helpers
  const goToNext = useCallback(() => {
    if (currentScreenIndex < SCREENS.length - 1) {
      setCurrentScreenIndex((i) => i + 1);
    }
  }, [currentScreenIndex]);

  // Handle name change from welcome screen
  const handleNameChanged = useCallback((newName: string) => {
    setUserName(newName);
  }, []);

  // Wearable screen handler - sets path based on choice
  const handleWearableComplete = useCallback(
    (selectedHasData: boolean) => {
      setPath(selectedHasData ? "data" : "no-data");
      goToNext();
    },
    [setPath, goToNext]
  );

  // Generic screen complete handler
  const handleScreenComplete = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Goals screen handler - persists to backend
  const handleGoalsComplete = useCallback(
    async (data: GoalsData) => {
      if (runner?._id) {
        await updateRunner({
          runnerId: runner._id,
          fields: {
            goals: {
              goalType: data.goalType,
            },
          },
        });
      }
      goToNext();
    },
    [runner?._id, updateRunner, goToNext]
  );

  // Health screen handler - persists to backend
  const handleHealthComplete = useCallback(
    async (data: HealthData) => {
      if (runner?._id) {
        await updateRunner({
          runnerId: runner._id,
          fields: {
            health: {
              pastInjuries: data.pastInjuries,
              recoveryStyle: data.recoveryStyle,
            },
          },
        });
      }
      goToNext();
    },
    [runner?._id, updateRunner, goToNext]
  );

  // Style screen handler - persists to backend
  const handleStyleComplete = useCallback(
    async (data: CoachingData) => {
      if (runner?._id) {
        await updateRunner({
          runnerId: runner._id,
          fields: {
            coaching: {
              coachingVoice: data.coachingVoice,
              biggestChallenge: data.biggestChallenge,
            },
          },
        });
      }
      goToNext();
    },
    [runner?._id, updateRunner, goToNext]
  );

  // Paywall handler
  const handlePaywallComplete = useCallback(
    (startedTrial: boolean) => {
      onComplete?.({ startedTrial });
    },
    [onComplete]
  );

  // Render current screen
  const renderScreen = useMemo(() => {
    const mockPath = hasData ? "data" : "no-data";

    switch (currentScreen.name) {
      case "welcome":
        return (
          <WelcomeMock
            userName={userName}
            onNext={goToNext}
            onNameChanged={handleNameChanged}
          />
        );

      case "wearable":
        return (
          <WearableScreen
            onComplete={handleWearableComplete}
            testID="screen-wearable"
          />
        );

      case "selfReport":
        // Show data insights for DATA path, self-report for NO DATA path
        return hasData ? (
          <DataInsightsScreen
            onNext={goToNext}
            onNoData={() => {
              // User connected but has 0 activities - switch to NO DATA path
              setPath("no-data");
            }}
          />
        ) : (
          <SelfReportMock onNext={goToNext} />
        );

      case "goals":
        return <GoalsMock hasData={hasData} onNext={handleGoalsComplete} />;

      case "health":
        return <HealthMock hasData={hasData} onNext={handleHealthComplete} />;

      case "style":
        return <StyleMock onNext={handleStyleComplete} />;

      case "openQuestion":
        return <OpenQuestionMock onNext={goToNext} />;

      case "transition":
        return <TransitionMock onDone={goToNext} />;

      case "radar":
        return (
          <RadarScreen
            mockPath={mockPath}
            onComplete={handleScreenComplete}
          />
        );

      case "progression":
        return (
          <ProgressionScreen
            mockPath={mockPath}
            onComplete={handleScreenComplete}
          />
        );

      case "calendar":
        return (
          <CalendarScreen
            mockPath={mockPath}
            onComplete={handleScreenComplete}
          />
        );

      case "verdict":
        return (
          <VerdictScreen
            mockPath={mockPath}
            onComplete={handleScreenComplete}
          />
        );

      case "paywall":
        return (
          <PaywallScreen
            mockPath={mockPath}
            onComplete={handlePaywallComplete}
            testID="screen-paywall"
          />
        );

      default:
        return null;
    }
  }, [
    currentScreen.name,
    hasData,
    userName,
    goToNext,
    handleNameChanged,
    handleWearableComplete,
    handleScreenComplete,
    handleGoalsComplete,
    handleHealthComplete,
    handleStyleComplete,
    handlePaywallComplete,
    setPath,
  ]);

  // Progress bar visible from wearable through transition (screens 1-7)
  // Hidden on welcome and after transition (radar onwards)
  const showProgressBar =
    currentScreen.name !== "welcome" &&
    !["radar", "progression", "calendar", "verdict", "paywall"].includes(
      currentScreen.name
    );

  return (
    <View style={styles.container} testID={testID}>
      {/* Progress bar (visible wearable → transition, hidden before/after) */}
      {showProgressBar && (
        <FlowProgressBar progress={progress} testID="flow-progress-bar" />
      )}

      {/* Screen content with transition */}
      <ScreenTransition
        screenKey={currentScreen.name}
        testID={`screen-${currentScreen.name}`}
      >
        {renderScreen}
      </ScreenTransition>
    </View>
  );
}

// =============================================================================
// Main Component (provides context)
// =============================================================================

export function OnboardingFlowMock({
  initialPath = "no-data",
  userName,
  ...props
}: OnboardingFlowMockProps) {
  return (
    <MockPathProvider initialPath={initialPath}>
      <OnboardingFlowMockInner userName={userName} {...props} />
    </MockPathProvider>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
});

// =============================================================================
// Exports
// =============================================================================

export { SCREENS as ONBOARDING_SCREENS };
export type { ScreenName, ScreenConfig };
