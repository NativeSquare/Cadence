/**
 * OnboardingFlow - Sequential onboarding orchestrator.
 *
 * Renders all screens in sequence with progress bar and screen transitions.
 */

import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
// import { FlowProgressBar } from "./FlowProgressBar";
import { ScreenTransition } from "./ScreenTransition";
// import { screenProgressMap } from "./preview-data";
import { COLORS } from "@/lib/design-tokens";

import {
  WelcomeScreen,
  WearableScreen,
  DataInsightsScreen,
  AthleteScreen,
  GoalsScreen,
  HealthScreen,
  StyleScreen,
  OpenQuestionScreen,
  TransitionScreen,
  VerdictScreen,
  PaywallScreen,
} from "./screens";

type ScreenName =
  | "welcome"
  | "wearable"
  | "selfReport"
  | "athlete"
  | "goals"
  | "health"
  | "style"
  | "openQuestion"
  | "transition"
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
  { name: "athlete", label: "Athlete" },
  { name: "goals", label: "Goals" },
  { name: "health", label: "Health" },
  { name: "style", label: "Style" },
  { name: "openQuestion", label: "OpenQ" },
  { name: "transition", label: "Transition" },
  { name: "verdict", label: "Verdict" },
  { name: "paywall", label: "Paywall" },
];

export function OnboardingFlow() {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  const currentScreen = SCREENS[currentScreenIndex];
  // const progress = screenProgressMap[currentScreenIndex] ?? 0;

  const goToNext = useCallback(() => {
    if (currentScreenIndex < SCREENS.length - 1) {
      setCurrentScreenIndex((i: number) => i + 1);
    }
  }, [currentScreenIndex]);

  const renderScreen = useMemo(() => {
    switch (currentScreen.name) {
      case "welcome":
        return <WelcomeScreen onNext={goToNext} />;

      case "wearable":
        return <WearableScreen onComplete={goToNext} />;

      case "selfReport":
        return <DataInsightsScreen onNext={goToNext} />;

      case "athlete":
        return <AthleteScreen onNext={goToNext} />;

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

      case "verdict":
        return <VerdictScreen onComplete={goToNext} />;

      case "paywall":
        return <PaywallScreen testID="screen-paywall" />;

      default:
        return null;
    }
  }, [currentScreen.name, goToNext]);

  // Progress bar visible from wearable through transition (screens 1-7)
  // const showProgressBar =
  //   currentScreen.name !== "welcome" &&
  //   !["verdict", "paywall"].includes(currentScreen.name);

  return (
    <View style={styles.container}>
      {/* {showProgressBar && (
        <FlowProgressBar progress={progress} testID="flow-progress-bar" />
      )} */}

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
