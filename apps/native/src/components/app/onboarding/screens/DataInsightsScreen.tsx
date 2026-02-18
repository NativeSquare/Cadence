/**
 * DataInsightsScreen - Real data analysis screen with card-based UI.
 *
 * Replaces ThinkingDataMock with live data from Soma.
 * Shows emotional insights computed from user's activity history.
 * UI matches prototype: cadence-insights.jsx
 *
 * Phases:
 * 1. Connecting - Streaming coach lines + activity counter
 * 2. Insights - 4-5 insight cards revealed sequentially
 * 3. Closing - Coach message + Continue button
 *
 * Source: Dev Story 4-7-data-insights-screen
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../Cursor";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import {
  computeInsights,
  buildInsightCards,
  getCoachClosingMessage,
} from "@/lib/insights";
import type { InsightCard, SomaActivity, AccentColor } from "@/lib/insights";

// =============================================================================
// Types
// =============================================================================

interface DataInsightsScreenProps {
  onNext: () => void;
  onNoData?: () => void;
}

type Phase = "loading" | "connecting" | "insights" | "closing";

// =============================================================================
// Color Helpers
// =============================================================================

function getAccentColor(accent: AccentColor): string {
  switch (accent) {
    case "lime":
      return COLORS.lime;
    case "orange":
      return "#FF8A00";
    case "white":
    default:
      return GRAYS.g1;
  }
}

// =============================================================================
// Provider Name Helper
// =============================================================================

type WearableType = "garmin" | "coros" | "apple_watch" | "none" | undefined;

function getProviderDisplayName(
  stravaConnected: boolean,
  wearableType: WearableType
): string {
  if (stravaConnected) return "Strava";
  switch (wearableType) {
    case "apple_watch":
      return "Apple Health";
    case "garmin":
      return "Garmin";
    case "coros":
      return "COROS";
    default:
      return "your wearable";
  }
}

// =============================================================================
// Activity Counter Component
// =============================================================================

function ActivityCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let c = 0;
    const iv = setInterval(() => {
      c += Math.floor(Math.random() * 40) + 15;
      if (c >= target) {
        c = target;
        clearInterval(iv);
      }
      setCount(c);
    }, 50);
    return () => clearInterval(iv);
  }, [target]);

  const isDone = count >= target;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.counterRow}>
      <View
        style={[
          styles.counterDot,
          { opacity: isDone ? 1 : 0.6 },
        ]}
      />
      <Text style={styles.counterText}>
        <Text style={styles.counterNumber}>{count}</Text> activities
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// Connecting Phase Component
// =============================================================================

function ConnectingPhase({
  activityCount,
  providerName,
  onDone,
}: {
  activityCount: number;
  providerName: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);

  const s0 = useStream({
    text: `Connected to ${providerName}.`,
    speed: 28,
    delay: 400,
    active: step >= 0,
  });
  const s1 = useStream({
    text: "Reading your history...",
    speed: 28,
    delay: 200,
    active: step >= 1,
  });
  const s2 = useStream({
    text: "Got it. Here's what I see.",
    speed: 28,
    delay: 200,
    active: step >= 2,
  });

  useEffect(() => {
    if (s0.done) {
      const timer = setTimeout(() => setStep(1), 300);
      return () => clearTimeout(timer);
    }
  }, [s0.done]);

  useEffect(() => {
    if (s1.done) {
      const timer = setTimeout(() => setStep(2), 400);
      return () => clearTimeout(timer);
    }
  }, [s1.done]);

  useEffect(() => {
    if (s2.done) {
      const timer = setTimeout(onDone, 800);
      return () => clearTimeout(timer);
    }
  }, [s2.done, onDone]);

  return (
    <View style={styles.connectingContainer}>
      <Text style={styles.connectingLine}>
        {s0.displayed}
        {!s0.done && s0.started && <Cursor visible height={22} />}
      </Text>

      {step >= 1 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={[styles.connectingLine, styles.connectingLineDim]}>
            {s1.displayed}
            {!s1.done && s1.started && <Cursor visible height={22} />}
          </Text>
        </Animated.View>
      )}

      {step >= 2 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={[styles.connectingLine, styles.connectingLineLime]}>
            {s2.displayed}
            {!s2.done && s2.started && <Cursor visible height={22} />}
          </Text>
        </Animated.View>
      )}

      {step >= 1 && !s2.done && <ActivityCounter target={activityCount} />}
    </View>
  );
}

// =============================================================================
// Insight Card Component
// =============================================================================

function InsightCardView({
  card,
  show,
  onComplete,
}: {
  card: InsightCard;
  show: boolean;
  onComplete?: () => void;
}) {
  const accentColor = getAccentColor(card.accent);

  // Stream each part of the card
  const bigStream = useStream({
    text: card.big,
    speed: 38,
    delay: 0,
    active: show,
  });

  const subStream = useStream({
    text: card.sub,
    speed: 22,
    delay: card.big.length * 38 + 200,
    active: show,
  });

  const noteStream = useStream({
    text: card.note || "",
    speed: 20,
    delay: card.big.length * 38 + card.sub.length * 22 + 500,
    active: show && !!card.note,
  });

  // Notify when card is complete
  useEffect(() => {
    if (card.note) {
      if (noteStream.done && onComplete) {
        const timer = setTimeout(onComplete, 800);
        return () => clearTimeout(timer);
      }
    } else {
      if (subStream.done && onComplete) {
        const timer = setTimeout(onComplete, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [subStream.done, noteStream.done, card.note, onComplete]);

  if (!show) return null;

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
      {/* Big number / fact */}
      <Text style={[styles.cardBig, { color: accentColor }]}>
        {bigStream.displayed}
        {!bigStream.done && bigStream.started && <Cursor visible height={32} />}
      </Text>

      {/* Supporting line */}
      {bigStream.done && (
        <Text style={styles.cardSub}>
          {subStream.displayed}
          {!subStream.done && subStream.started && <Cursor visible height={18} />}
        </Text>
      )}

      {/* Coach note */}
      {card.note && subStream.done && (
        <Text style={styles.cardNote}>
          {noteStream.displayed}
          {!noteStream.done && noteStream.started && <Cursor visible height={15} />}
        </Text>
      )}
    </Animated.View>
  );
}

// =============================================================================
// Closing Line Component
// =============================================================================

function ClosingLine({ message }: { message: string }) {
  const stream = useStream({
    text: message,
    speed: 22,
    delay: 300,
    active: true,
  });

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.closingContainer}>
      <Text style={styles.closingText}>
        {stream.displayed}
        {!stream.done && stream.started && <Cursor visible height={18} />}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function DataInsightsScreen({ onNext, onNoData }: DataInsightsScreenProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [visibleCard, setVisibleCard] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Query activities from Convex
  const activities = useQuery(api.table.activities.listMyActivities, {
    order: "desc",
  });

  // Query runner to get wearable type
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const providerName = getProviderDisplayName(
    runner?.connections?.stravaConnected ?? false,
    runner?.connections?.wearableType as WearableType
  );

  // Compute insights when data loads
  const insights = useMemo(() => {
    if (!activities || activities.length === 0) return null;
    return computeInsights(activities as SomaActivity[]);
  }, [activities]);

  // Build insight cards
  const insightCards = useMemo(() => {
    if (!insights) return [];
    return buildInsightCards(insights);
  }, [insights]);

  // Get closing message
  const closingMessage = insights ? getCoachClosingMessage(insights) : "";

  // Handle no-data path
  useEffect(() => {
    if (activities !== undefined && activities.length === 0 && onNoData) {
      const timer = setTimeout(() => onNoData(), 500);
      return () => clearTimeout(timer);
    }
  }, [activities, onNoData]);

  // Transition from loading to connecting when data arrives
  useEffect(() => {
    if (activities && activities.length > 0 && phase === "loading") {
      const timer = setTimeout(() => setPhase("connecting"), 300);
      return () => clearTimeout(timer);
    }
  }, [activities, phase]);

  // Handle connecting phase completion
  const handleConnectDone = useCallback(() => {
    setPhase("insights");
    setVisibleCard(0);
  }, []);

  // Handle card completion
  const handleCardComplete = useCallback(() => {
    if (visibleCard < insightCards.length - 1) {
      setVisibleCard((v) => v + 1);
    } else {
      // All cards revealed
      setPhase("closing");
      setTimeout(() => setAllRevealed(true), 500);
    }
  }, [visibleCard, insightCards.length]);

  // Auto-scroll as cards appear
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [visibleCard, allRevealed]);

  const isLoading = activities === undefined;
  const activityCount = activities?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}

        {/* Phase 1: Connecting */}
        {phase === "connecting" && (
          <ConnectingPhase
            activityCount={activityCount}
            providerName={providerName}
            onDone={handleConnectDone}
          />
        )}

        {/* Phase 2: Insight cards */}
        {(phase === "insights" || phase === "closing") && (
          <View style={styles.cardsContainer}>
            {insightCards.map((card, i) => (
              <InsightCardView
                key={i}
                card={card}
                show={i <= visibleCard}
                onComplete={i === visibleCard ? handleCardComplete : undefined}
              />
            ))}

            {/* Closing line */}
            {allRevealed && <ClosingLine message={closingMessage} />}
          </View>
        )}
      </ScrollView>

      {/* Continue button */}
      {allRevealed && (
        <Animated.View entering={FadeInUp.springify()} style={styles.buttonContainer}>
          <View style={styles.buttonGradient} />
          <Pressable onPress={onNext} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue</Text>
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
    paddingTop: 100,
    paddingBottom: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  loadingContainer: {
    padding: 36,
  },
  loadingText: {
    fontFamily: "Outfit-Light",
    fontSize: 22,
    fontWeight: "300",
    color: GRAYS.g3,
    letterSpacing: -0.44,
  },

  // Connecting phase
  connectingContainer: {
    paddingHorizontal: 36,
  },
  connectingLine: {
    fontFamily: "Outfit-Light",
    fontSize: 22,
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 30,
    letterSpacing: -0.44,
  },
  connectingLineDim: {
    color: GRAYS.g3,
    marginTop: 4,
  },
  connectingLineLime: {
    color: COLORS.lime,
    marginTop: 4,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  counterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
  },
  counterText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 13,
    color: GRAYS.g3,
  },
  counterNumber: {
    fontFamily: "JetBrainsMono-Medium",
    fontWeight: "500",
    color: GRAYS.g1,
  },

  // Insight cards
  cardsContainer: {
    paddingHorizontal: 36,
  },
  card: {
    paddingBottom: 36,
    borderBottomWidth: 1,
    borderBottomColor: GRAYS.g6,
    marginBottom: 32,
  },
  cardBig: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 32,
    fontWeight: "500",
    letterSpacing: -0.96,
    lineHeight: 38,
    marginBottom: 8,
  },
  cardSub: {
    fontFamily: "Outfit-Light",
    fontSize: 18,
    fontWeight: "300",
    color: GRAYS.g2,
    lineHeight: 27,
    letterSpacing: -0.18,
  },
  cardNote: {
    fontFamily: "Outfit-Light",
    fontSize: 15,
    fontWeight: "300",
    color: GRAYS.g3,
    lineHeight: 23,
    letterSpacing: -0.15,
    marginTop: 8,
  },

  // Closing
  closingContainer: {
    paddingTop: 8,
  },
  closingText: {
    fontFamily: "Outfit-Light",
    fontSize: 18,
    fontWeight: "300",
    color: COLORS.lime,
    lineHeight: 27,
    letterSpacing: -0.18,
  },

  // Button
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  buttonGradient: {
    position: "absolute",
    top: -60,
    left: 0,
    right: 0,
    height: 60,
    // Note: In React Native, we'd use LinearGradient component
    // For now, use a semi-transparent background
    backgroundColor: "transparent",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.black,
    letterSpacing: -0.17,
  },
});
