/**
 * WearableScreen - Wearable connection or skip path selection.
 *
 * Presents wearable connection options with skip path.
 * Uses streaming text pattern matching cadence-v3.jsx prototype.
 *
 * Source: Story 3.5 - Task 9 (AC#1)
 */

import { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { useHealthKit } from "@/hooks/use-healthkit";
import { useStrava } from "@/hooks/use-strava";
import { Cursor } from "../Cursor";
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

const OPTIONS = [
  { id: "strava", label: "Connect Strava", icon: "⌚" },
  { id: "apple", label: "Apple Health", icon: "❤️" },
  { id: "garmin", label: "Garmin Connect", icon: "📍" },
];

// =============================================================================
// Component
// =============================================================================

export function WearableScreen({ onComplete, testID }: WearableScreenProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const { connect: connectHealthKit, error: healthKitError } = useHealthKit();
  const { connect: connectStrava, error: stravaError } = useStrava();

  const hasConnected = connectedIds.length > 0;
  const connectionError = healthKitError || stravaError;

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
    async (id: string) => {
      if (connectedIds.includes(id) || connectingId) return;

      if (id === "apple" && Platform.OS === "ios") {
        setConnectingId("apple");
        const result = await connectHealthKit();
        setConnectingId(null);
        if (result) {
          setConnectedIds((prev) => [...prev, "apple"]);
        }
      } else if (id === "strava") {
        setConnectingId("strava");
        const result = await connectStrava();
        setConnectingId(null);
        if (result) {
          setConnectedIds((prev) => [...prev, "strava"]);
        }
      } else {
        // Other providers not yet implemented — mark as connected for now
        setConnectingId(id);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setConnectingId(null);
        setConnectedIds((prev) => [...prev, id]);
      }
    },
    [connectedIds, connectingId, connectHealthKit, connectStrava],
  );

  const handleContinue = useCallback(() => {
    onComplete(true);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    onComplete(hasConnected);
  }, [onComplete, hasConnected]);

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
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.optionsSection}
        >
          {connectionError && (
            <Text style={styles.errorText}>{connectionError}</Text>
          )}
          {OPTIONS.map((option) => {
            const isConnected = connectedIds.includes(option.id);
            const isThisConnecting = connectingId === option.id;
            const isDisabled = isConnected || !!connectingId;

            return (
              <Pressable
                key={option.id}
                onPress={() => handleConnect(option.id)}
                disabled={isDisabled}
                style={[
                  styles.optionCard,
                  isConnected && styles.optionCardConnected,
                  !isConnected &&
                    !!connectingId &&
                    !isThisConnecting &&
                    styles.optionCardDisabled,
                ]}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {isThisConnecting ? (
                  <ActivityIndicator size="small" color={GRAYS.g3} />
                ) : isConnected ? (
                  <Text style={styles.connectedLabel}>Connected</Text>
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </Pressable>
            );
          })}

          {/* Continue button - appears after at least one connection */}
          {hasConnected && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <Pressable
                onPress={handleContinue}
                disabled={!!connectingId}
                style={[
                  styles.continueButton,
                  !!connectingId && styles.continueButtonDisabled,
                ]}
              >
                <Text style={styles.continueText}>Continue</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Skip / done option */}
          <Pressable
            onPress={handleSkip}
            disabled={!!connectingId}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              {hasConnected ? "That's all for now" : "Skip for now"}
            </Text>
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
  errorText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: "#FF5A5A",
    textAlign: "center",
    marginBottom: 4,
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
  optionCardConnected: {
    borderColor: "rgba(52,211,153,0.3)",
    backgroundColor: "rgba(52,211,153,0.08)",
  },
  optionCardDisabled: {
    opacity: 0.5,
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
  connectedLabel: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: "rgb(52,211,153)",
  },
  chevron: {
    fontFamily: "Outfit-Light",
    fontSize: 24,
    color: GRAYS.g3,
  },
  continueButton: {
    backgroundColor: COLORS.lime,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: "#000",
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipText: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    color: GRAYS.g3,
  },
});
