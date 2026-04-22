/**
 * OnboardingFlow - Sequential 13-screen onboarding orchestrator.
 *
 * Renders all screens in sequence with progress bar and screen transitions.
 */

import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { FlowProgressBar } from "./FlowProgressBar";
import { ScreenTransition } from "./ScreenTransition";
import { screenProgressMap } from "./preview-data";
import { COLORS } from "@/lib/design-tokens";

import {
  WelcomeScreen,
  WearableScreen,
  DataInsightsScreen,
  GoalsScreen,
  HealthScreen,
  StyleScreen,
  OpenQuestionScreen,
  TransitionScreen,
  RadarScreen,
  ProgressionScreen,
  CalendarScreen,
  VerdictScreen,
  PaywallScreen,
} from "./screens";

export interface OnboardingFlowProps {
  /** Called when flow completes */
  onComplete?: (result: { startedTrial: boolean }) => void;
  /** Initial screen index */
  initialScreenIndex?: number;
  /** User name from database (agoge athlete.name or fallback to user.name) */
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

export function OnboardingFlow({
  onComplete,
  initialScreenIndex = 0,
  userName: initialUserName = "",
  testID,
}: OnboardingFlowProps) {
  const [currentScreenIndex, setCurrentScreenIndex] =
    useState(initialScreenIndex);
  const [userName, setUserName] = useState(initialUserName);

  const currentScreen = SCREENS[currentScreenIndex];
  const progress = screenProgressMap[currentScreenIndex] ?? 0;

  const goToNext = useCallback(() => {
    if (currentScreenIndex < SCREENS.length - 1) {
      setCurrentScreenIndex((i) => i + 1);
    }
  }, [currentScreenIndex]);

  const handleNameChanged = useCallback((newName: string) => {
    setUserName(newName);
  }, []);

  const handlePaywallComplete = useCallback(
    (startedTrial: boolean) => {
      onComplete?.({ startedTrial });
    },
    [onComplete],
  );

  const renderScreen = useMemo(() => {
    switch (currentScreen.name) {
      case "welcome":
        return (
          <WelcomeScreen
            userName={userName}
            onNext={goToNext}
            onNameChanged={handleNameChanged}
          />
        );

      case "wearable":
        return (
          <WearableScreen onComplete={goToNext} testID="screen-wearable" />
        );

      case "selfReport":
        return <DataInsightsScreen onNext={goToNext} />;

      case "goals":
        return <GoalsScreen onNext={goToNext} />;

      case "health":
        return <HealthScreen onNext={goToNext} />;

      case "style":
        return <StyleScreen onNext={goToNext} />;

      case "openQuestion":
        return <OpenQuestionScreen onNext={goToNext} />;

      case "transition":
        return <TransitionScreen onDone={goToNext} />;

      case "radar":
        return <RadarScreen onComplete={goToNext} />;

      case "progression":
        return <ProgressionScreen onComplete={goToNext} />;

      case "calendar":
        return <CalendarScreen onComplete={goToNext} />;

      case "verdict":
        return <VerdictScreen onComplete={goToNext} />;

      case "paywall":
        return (
          <PaywallScreen
            onComplete={handlePaywallComplete}
            testID="screen-paywall"
          />
        );

      default:
        return null;
    }
  }, [
    currentScreen.name,
    userName,
    goToNext,
    handleNameChanged,
    handlePaywallComplete,
  ]);

  // Progress bar visible from wearable through transition (screens 1-7)
  const showProgressBar =
    currentScreen.name !== "welcome" &&
    !["radar", "progression", "calendar", "verdict", "paywall"].includes(
      currentScreen.name,
    );

  return (
    <View style={styles.container} testID={testID}>
      {showProgressBar && (
        <FlowProgressBar progress={progress} testID="flow-progress-bar" />
      )}

      <ScreenTransition
        screenKey={currentScreen.name}
        testID={`screen-${currentScreen.name}`}
      >
        {renderScreen}
      </ScreenTransition>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
});

export { SCREENS as ONBOARDING_SCREENS };
export type { ScreenName, ScreenConfig };
