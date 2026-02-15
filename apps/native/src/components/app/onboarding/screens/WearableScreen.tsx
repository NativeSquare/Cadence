/**
 * WearableScreen - Wearable connection or skip path selection.
 *
 * Presents wearable connection options with skip path.
 * Uses streaming text pattern matching cadence-v3.jsx prototype.
 *
 * Source: Story 3.5 - Task 9 (AC#1)
 */

import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../Cursor";
import { GRAYS, SURFACES } from "@/lib/design-tokens";

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

  const s1 = useStream({
    text: "I'm your running coach. I learn, I adapt, and I get better the more I know.",
    speed: 32,
    delay: 300,
  });

  const s2 = useStream({
    text: "Fastest way to get started — connect your watch or running app.",
    speed: 32,
    delay: 400,
    active: s1.done,
  });

  useEffect(() => {
    if (s2.done) {
      setTimeout(() => setShowOptions(true), 400);
    }
  }, [s2.done]);

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
      {/* Text area */}
      <View style={styles.textArea}>
        <Text style={styles.headline}>
          {s1.displayed}
          {!s1.done && s1.started && <Cursor visible height={26} />}
        </Text>

        {s2.started && (
          <Text style={[styles.subheadline, styles.marginTop]}>
            {s2.displayed}
            {!s2.done && <Cursor visible height={26} />}
          </Text>
        )}
      </View>

      {/* Connection options */}
      {showOptions && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.optionsSection}>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleConnect(option.id)}
              style={styles.optionCard}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}

          {/* Skip option */}
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
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
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  textArea: {
    paddingTop: 4,
  },
  headline: {
    fontSize: 26,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 36,
    letterSpacing: -0.52,
  },
  subheadline: {
    fontSize: 26,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g2,
    lineHeight: 36,
    letterSpacing: -0.52,
  },
  marginTop: {
    marginTop: 12,
  },
  optionsSection: {
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
});
