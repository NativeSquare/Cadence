/**
 * WearableScreen - Wearable connection or skip path selection.
 *
 * Stub implementation for OnboardingFlowMock testing.
 * Presents wearable connection options with skip path.
 *
 * Source: Story 3.5 - Task 9 (AC#1)
 */

import { useState, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { StreamBlock } from "../StreamBlock";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface WearableScreenProps {
  /** Called when user completes this screen */
  onComplete: (hasData: boolean) => void;
  /** Test ID for visual regression */
  testID?: string;
}

// =============================================================================
// Constants
// =============================================================================

const COACH_INTRO =
  "Do you track your runs with a watch or app? If so, I can pull your recent activity to build a more accurate picture.";

const OPTIONS = [
  { id: "strava", label: "Connect Strava", icon: "⌚" },
  { id: "apple", label: "Apple Health", icon: "❤️" },
  { id: "garmin", label: "Garmin Connect", icon: "📍" },
];

// =============================================================================
// Component
// =============================================================================

export function WearableScreen({
  onComplete,
  testID,
}: WearableScreenProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => setShowOptions(true), 300);
  }, []);

  const handleConnect = useCallback(
    (id: string) => {
      // Simulate connection - in mock mode, just complete with data
      onComplete(true);
    },
    [onComplete]
  );

  const handleSkip = useCallback(() => {
    onComplete(false);
  }, [onComplete]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Coach intro */}
      <StreamBlock
        text={COACH_INTRO}
        delay={300}
        onDone={handleIntroComplete}
      />

      {/* Connection options */}
      {showOptions && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.optionsSection}>
          {OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeIn.delay(100 * index)}
            >
              <Pressable
                onPress={() => handleConnect(option.id)}
                style={styles.optionCard}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Animated.View>
          ))}

          {/* Skip option */}
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>

          <Text style={styles.footnote}>
            You can connect later in Settings. I'll work with what you tell me.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  optionsSection: {
    marginTop: 32,
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: GRAYS.g1,
  },
  chevron: {
    fontFamily: "Outfit-Light",
    fontSize: 24,
    color: GRAYS.g3,
  },
  skipButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  skipText: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    color: GRAYS.g3,
  },
  footnote: {
    marginTop: 16,
    fontFamily: "Outfit-Light",
    fontSize: 13,
    color: GRAYS.g4,
    textAlign: "center",
    lineHeight: 18,
  },
});
