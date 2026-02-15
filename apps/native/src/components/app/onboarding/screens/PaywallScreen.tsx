/**
 * PaywallScreen - Trial activation paywall.
 *
 * Matches cadence-v3.jsx PaywallScr design:
 * - Streaming intro text
 * - Feature card with icons and gradient
 * - Phase-based reveal animation
 *
 * Source: Story 3.5 - Task 9 (AC#1, #10)
 * Reference: cadence-v3.jsx PaywallScr (lines 917-944)
 */

import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInRight, ZoomIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { StreamBlock } from "../StreamBlock";
import { Btn } from "../generative/Choice";
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

const FEATURES_DATA = [
  { icon: "📋", text: "Full plan through race day" },
  { icon: "🔄", text: "Daily adaptive sessions" },
  { icon: "🧠", text: "Visible reasoning for every decision" },
  { icon: "⚙️", text: "Unlimited plan adjustments" },
];

const FEATURES_NO_DATA = [
  { icon: "📋", text: "Full plan through race day" },
  { icon: "🔄", text: "Sessions that adapt as you log runs" },
  { icon: "📡", text: "Connect wearable for deeper insights" },
  { icon: "🧠", text: "See why every decision was made" },
];

// =============================================================================
// Component
// =============================================================================

export function PaywallScreen({
  mockPath = "data",
  onComplete,
  testID,
}: PaywallScreenProps) {
  const hasData = mockPath === "data";
  const features = hasData ? FEATURES_DATA : FEATURES_NO_DATA;

  // Phase-based reveal matching reference
  const [phase, setPhase] = useState(0);
  const [text1Done, setText1Done] = useState(false);
  const [text2Done, setText2Done] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Phase 1: Show card after text2 completes
  useEffect(() => {
    if (text2Done) {
      const timer = setTimeout(() => setPhase(1), 500);
      return () => clearTimeout(timer);
    }
  }, [text2Done]);

  // Show buttons after card appears
  useEffect(() => {
    if (phase >= 1) {
      const timer = setTimeout(() => setShowButtons(true), 600);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleStartTrial = useCallback(() => {
    onComplete(true);
  }, [onComplete]);

  const handleMaybeLater = useCallback(() => {
    onComplete(false);
  }, [onComplete]);

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streaming intro text */}
        <View style={styles.introSection}>
          <StreamBlock
            text="The plan's ready. The coaching is ready."
            size={26}
            color={GRAYS.g1}
            delay={300}
            onDone={() => setText1Done(true)}
          />
          {text1Done && (
            <View style={styles.introText2Wrapper}>
              <StreamBlock
                text="To unlock everything, start your free trial."
                size={26}
                color={GRAYS.g2}
                delay={400}
                onDone={() => setText2Done(true)}
              />
            </View>
          )}
        </View>

        {/* Feature card with gradient */}
        {phase >= 1 && (
          <Animated.View entering={ZoomIn.duration(500)} style={styles.cardWrapper}>
            <View style={styles.featureCard}>
              {/* Trial badge */}
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>7-DAY FREE TRIAL</Text>
              </View>

              {/* Features list */}
              <View style={styles.featuresList}>
                {features.map((feature, index) => (
                  <Animated.View
                    key={feature.text}
                    entering={FadeInRight.delay(100 + index * 60).duration(350)}
                    style={styles.featureRow}
                  >
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>{feature.icon}</Text>
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </Animated.View>
                ))}
              </View>

              {/* Pricing */}
              <View style={styles.pricingRow}>
                <Text style={styles.priceAmount}>€9.99</Text>
                <Text style={styles.pricePeriod}>/month after trial</Text>
              </View>
              <Text style={styles.cancelText}>Cancel anytime.</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* CTAs — same pattern as CalendarScreen: conditional + FadeIn + absolute */}
      {showButtons && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.ctaSection}
        >
          <Btn label="Start Free Trial" onPress={handleStartTrial} />
          <Btn label="Maybe later" onPress={handleMaybeLater} ghost />
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
    paddingTop: 70,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  introSection: {
    marginBottom: 8,
  },
  introText2Wrapper: {
    marginTop: 8,
  },
  cardWrapper: {
    marginTop: 32,
  },
  featureCard: {
    padding: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SURFACES.sb,
    backgroundColor: SURFACES.sg,
  },
  trialBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.limeDim,
    marginBottom: 20,
  },
  trialBadgeText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.lime,
    letterSpacing: 0.4,
  },
  featuresList: {
    gap: 14,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GRAYS.g6,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconText: {
    fontSize: 16,
  },
  featureText: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    fontWeight: "400",
    color: GRAYS.g1,
    flex: 1,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 4,
  },
  priceAmount: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 32,
    fontWeight: "500",
    color: GRAYS.g1,
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g4,
  },
  cancelText: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: GRAYS.g4,
  },
  ctaSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 48,
    backgroundColor: COLORS.black,
    gap: 8,
  },
});
