/**
 * ScreenTransition - Animated wrapper for screen transitions.
 *
 * Provides smooth fade transitions between onboarding screens.
 * Uses react-native-reanimated for 60fps animations.
 *
 * Source: Story 3.5 - Task 4 (AC#3)
 */

import { type ReactNode } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { StyleSheet } from "react-native";

// =============================================================================
// Types
// =============================================================================

export interface ScreenTransitionProps {
  /** Unique key for screen transitions */
  screenKey: string;
  /** Screen content to animate */
  children: ReactNode;
  /** Test ID for visual regression */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ScreenTransition({
  screenKey,
  children,
  testID,
}: ScreenTransitionProps) {
  return (
    <Animated.View
      key={screenKey}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
