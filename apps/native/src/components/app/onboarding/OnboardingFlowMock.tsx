/**
 * OnboardingFlowMock - Complete mock flow for UX validation.
 *
 * Renders all 13 onboarding screens in sequence with:
 * - Path context (DATA vs NO DATA)
 * - Progress bar
 * - Screen transitions
 * - Dev controls (path toggle, screen jump)
 *
 * Source: Story 3.5 - Tasks 1, 3, 8 (AC#1-#10)
 */

import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { MockPathProvider, useMockPath } from "./MockPathContext";
import { FlowProgressBar } from "./FlowProgressBar";
import { PathIndicator } from "./PathIndicator";
import { ScreenTransition } from "./ScreenTransition";
import { screenProgressMap } from "./mock-data";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// Screen components
import { WelcomeScreen } from "./welcome-screen";
import { WearableScreen } from "./screens/WearableScreen";
import { SelfReportScreen } from "./screens/SelfReportScreen";
import { GoalsScreen } from "./screens/GoalsScreen";
import { HealthScreen } from "./screens/HealthScreen";
import { StyleScreen } from "./screens/StyleScreen";
import { OpenQuestionScreen } from "./screens/OpenQuestionScreen";
import { TransitionScreen } from "./screens/TransitionScreen";
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
  /** Show dev controls (default: __DEV__) */
  devMode?: boolean;
  /** Initial screen index (dev mode) */
  initialScreenIndex?: number;
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
  devMode,
  initialScreenIndex = 0,
  testID,
}: Omit<OnboardingFlowMockProps, "initialPath">) {
  const { hasData, togglePath, setPath } = useMockPath();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(initialScreenIndex);
  const [welcomePart, setWelcomePart] = useState<"intro" | "got-it" | "transition">("intro");
  const [userName, setUserName] = useState("Runner");

  const showDevControls = devMode ?? __DEV__;
  const currentScreen = SCREENS[currentScreenIndex];
  const progress = screenProgressMap[currentScreenIndex] ?? 0;

  // Navigation helpers
  const goToNext = useCallback(() => {
    if (currentScreenIndex < SCREENS.length - 1) {
      setCurrentScreenIndex((i) => i + 1);
    }
  }, [currentScreenIndex]);

  const goToPrevious = useCallback(() => {
    if (currentScreenIndex > 0) {
      setCurrentScreenIndex((i) => i - 1);
    }
  }, [currentScreenIndex]);

  const jumpToScreen = useCallback((index: number) => {
    if (index >= 0 && index < SCREENS.length) {
      setCurrentScreenIndex(index);
    }
  }, []);

  // Welcome screen handlers
  const handleWelcomeIntro = useCallback(() => {
    setWelcomePart("got-it");
  }, []);

  const handleWelcomeGotIt = useCallback(() => {
    setWelcomePart("transition");
  }, []);

  const handleWelcomeTransition = useCallback(() => {
    goToNext();
  }, [goToNext]);

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
          <WelcomeScreen
            userName={userName}
            part={welcomePart}
            onContinue={
              welcomePart === "intro"
                ? handleWelcomeIntro
                : welcomePart === "got-it"
                  ? handleWelcomeGotIt
                  : handleWelcomeTransition
            }
            onNameChanged={setUserName}
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
        return (
          <SelfReportScreen
            onComplete={handleScreenComplete}
          />
        );

      case "goals":
        return (
          <GoalsScreen
            onComplete={handleScreenComplete}
          />
        );

      case "health":
        return (
          <HealthScreen
            onComplete={handleScreenComplete}
          />
        );

      case "style":
        return (
          <StyleScreen
            onComplete={handleScreenComplete}
          />
        );

      case "openQuestion":
        return (
          <OpenQuestionScreen
            onComplete={handleScreenComplete}
          />
        );

      case "transition":
        return (
          <TransitionScreen
            currentProgress={screenProgressMap[currentScreenIndex]}
            onComplete={handleScreenComplete}
          />
        );

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
    welcomePart,
    currentScreenIndex,
    handleWelcomeIntro,
    handleWelcomeGotIt,
    handleWelcomeTransition,
    handleWearableComplete,
    handleScreenComplete,
    handlePaywallComplete,
  ]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Progress bar (hidden on welcome) */}
      {currentScreen.name !== "welcome" && (
        <FlowProgressBar progress={progress} testID="flow-progress-bar" />
      )}

      {/* Path indicator */}
      <PathIndicator
        hasData={hasData}
        onToggle={togglePath}
        forceShow={showDevControls}
        testID="path-indicator"
      />

      {/* Screen content with transition */}
      <ScreenTransition
        screenKey={`${currentScreen.name}-${welcomePart}`}
        testID={`screen-${currentScreen.name}`}
      >
        {renderScreen}
      </ScreenTransition>

      {/* Dev controls */}
      {showDevControls && (
        <Animated.View
          entering={FadeIn.delay(500)}
          style={styles.devControls}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.devButtonsContainer}
          >
            {SCREENS.map((screen, index) => (
              <Pressable
                key={screen.name}
                onPress={() => jumpToScreen(index)}
                style={[
                  styles.devButton,
                  index === currentScreenIndex && styles.devButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.devButtonText,
                    index === currentScreenIndex && styles.devButtonTextActive,
                  ]}
                >
                  {screen.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// =============================================================================
// Main Component (provides context)
// =============================================================================

export function OnboardingFlowMock({
  initialPath = "no-data",
  ...props
}: OnboardingFlowMockProps) {
  return (
    <MockPathProvider initialPath={initialPath}>
      <OnboardingFlowMockInner {...props} />
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
  devControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.95)",
    borderTopWidth: 1,
    borderTopColor: SURFACES.brd,
    paddingVertical: 8,
  },
  devButtonsContainer: {
    paddingHorizontal: 12,
    gap: 6,
  },
  devButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
  },
  devButtonActive: {
    borderColor: COLORS.lime,
    backgroundColor: COLORS.limeDim,
  },
  devButtonText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 9,
    color: GRAYS.g3,
    textTransform: "uppercase",
  },
  devButtonTextActive: {
    color: COLORS.lime,
  },
});

// =============================================================================
// Exports
// =============================================================================

export { SCREENS as ONBOARDING_SCREENS };
export type { ScreenName, ScreenConfig };
