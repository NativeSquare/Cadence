/**
 * PaywallScreen - Trial activation paywall stub.
 *
 * Stub implementation for OnboardingFlowMock testing.
 * Displays trial offer with start/decline options.
 *
 * Source: Story 3.5 - Task 9 (AC#1, #10)
 * Reference: cadence-v3.jsx Paywall section
 */

import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface PaywallScreenProps {
  /** Mock path for conditional messaging */
  mockPath?: "data" | "no-data";
  /** Called when user makes a choice */
  onComplete: (startedTrial: boolean) => void;
  /** Test ID for visual regression */
  testID?: string;
}

// =============================================================================
// Constants
// =============================================================================

const FEATURES = [
  "Personalized 10-week training plan",
  "Adaptive coaching that learns from you",
  "Smart recovery recommendations",
  "Weekly plan adjustments",
];

const PRICE = "$9.99/month";
const TRIAL_PERIOD = "7-day free trial";

// =============================================================================
// Component
// =============================================================================

export function PaywallScreen({
  mockPath = "data",
  onComplete,
  testID,
}: PaywallScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  const handleStartTrial = useCallback(() => {
    onComplete(true);
  }, [onComplete]);

  const handleMaybeLater = useCallback(() => {
    onComplete(false);
  }, [onComplete]);

  if (!showContent) {
    return <View style={styles.container} testID={testID} />;
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={styles.headerLabel}>YOUR PLAN IS READY</Text>
        <Text style={styles.headerTitle}>Start Training</Text>
      </Animated.View>

      {/* Features list */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.featuresSection}
      >
        {FEATURES.map((feature, index) => (
          <Animated.View
            key={feature}
            entering={FadeIn.delay(300 + index * 100)}
            style={styles.featureRow}
          >
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Pricing */}
      <Animated.View
        entering={FadeIn.delay(700)}
        style={styles.pricingSection}
      >
        <View style={styles.pricingCard}>
          <Text style={styles.trialText}>{TRIAL_PERIOD}</Text>
          <Text style={styles.priceText}>
            Then {PRICE} • Cancel anytime
          </Text>
        </View>
      </Animated.View>

      {/* CTAs */}
      <Animated.View
        entering={FadeIn.delay(900)}
        style={styles.ctaSection}
      >
        <Pressable onPress={handleStartTrial} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Free Trial</Text>
        </Pressable>

        <Pressable onPress={handleMaybeLater} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Maybe later</Text>
        </Pressable>
      </Animated.View>

      {/* Legal footnote */}
      <Animated.View entering={FadeIn.delay(1000)} style={styles.footnoteSection}>
        <Text style={styles.footnoteText}>
          Payment will be charged after trial ends. Cancel anytime in Settings.
        </Text>
      </Animated.View>
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
    paddingTop: 40,
    backgroundColor: COLORS.black,
  },
  header: {
    marginBottom: 32,
  },
  headerLabel: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.lime,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: "Outfit-Light",
    fontSize: 32,
    fontWeight: "300",
    color: GRAYS.g1,
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.limeDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  checkmarkText: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: "600",
  },
  featureText: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: GRAYS.g1,
    flex: 1,
  },
  pricingSection: {
    marginBottom: 32,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SURFACES.sb,
    backgroundColor: SURFACES.sg,
    alignItems: "center",
  },
  trialText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 20,
    color: COLORS.lime,
    marginBottom: 4,
  },
  priceText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g2,
  },
  ctaSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.lime,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 17,
    color: COLORS.black,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    color: GRAYS.g3,
  },
  footnoteSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footnoteText: {
    fontFamily: "Outfit-Light",
    fontSize: 12,
    color: GRAYS.g4,
    textAlign: "center",
    lineHeight: 16,
  },
});
