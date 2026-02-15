/**
 * ThinkingDataMock - Data analysis stream screen.
 *
 * Shows animated analysis of connected wearable data.
 * Matches cadence-v3.jsx ThinkingData component (lines 429-468).
 *
 * Source: Story 3.5
 */

import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { COLORS, GRAYS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

interface ThinkingDataMockProps {
  onNext: () => void;
}

interface AnalysisLine {
  text: string;
  type: "sys" | "dat" | "warn" | "pos" | "res" | "sp";
}

// =============================================================================
// Constants
// =============================================================================

const ANALYSIS_LINES: AnalysisLine[] = [
  { text: "Connecting to Strava...", type: "sys" },
  { text: "Found 847 activities.", type: "sys" },
  { text: "Analyzing last 12 months...", type: "sys" },
  { text: "", type: "sp" },
  { text: "Weekly volume: 42–48km. Consistent.", type: "dat" },
  { text: "Long run average: 16.2km.", type: "dat" },
  { text: "Easy pace: 5:38–5:45/km.", type: "dat" },
  { text: "Tempo range: 4:50–5:05/km.", type: "dat" },
  { text: "", type: "sp" },
  { text: "Rest days last month: 3. That's... not many.", type: "warn" },
  { text: "Easy runs look fast — possible pacing issue.", type: "warn" },
  { text: "", type: "sp" },
  { text: "No major injury gaps in last year.", type: "pos" },
  { text: "Weekly consistency: top 15%.", type: "pos" },
  { text: "", type: "sp" },
  { text: "Profile confidence: HIGH", type: "res" },
];

// =============================================================================
// Badge Component
// =============================================================================

function Badge({ level = "HIGH" }: { level?: "HIGH" | "MODERATE" | "LOW" }) {
  const color = {
    HIGH: COLORS.lime,
    MODERATE: "#FF8A00",
    LOW: "#FF5A5A",
  }[level];

  return (
    <View style={[styles.badge, { borderColor: `${color}30`, backgroundColor: `${color}15` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>DATA · {level}</Text>
    </View>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ThinkingDataMock({ onNext }: ThinkingDataMockProps) {
  const [lines, setLines] = useState<AnalysisLine[]>([]);
  const [done, setDone] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const coachStream = useStream({
    text: "Okay, I've got a picture forming. Let me fill in the gaps.",
    speed: 28,
    delay: 200,
    active: showCoach,
  });

  // Animate analysis lines
  useEffect(() => {
    let i = 0;
    const addLine = () => {
      if (i < ANALYSIS_LINES.length) {
        const line = ANALYSIS_LINES[i];
        setLines((prev) => [...prev, line]);
        i++;
        const delay = line.type === "sp" ? 150 : 320;
        setTimeout(addLine, delay);
      } else {
        setTimeout(() => setDone(true), 600);
        setTimeout(() => setShowCoach(true), 1200);
      }
    };
    setTimeout(addLine, 800);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [lines]);

  const getLineColor = (type: AnalysisLine["type"]) => {
    switch (type) {
      case "sys":
        return GRAYS.g4;
      case "dat":
        return GRAYS.g2;
      case "warn":
        return "#FF5A5A";
      case "pos":
        return COLORS.lime;
      case "res":
        return COLORS.lime;
      default:
        return GRAYS.g3;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status indicator */}
        <View style={styles.statusRow}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: done ? COLORS.lime : "#FF8A00" },
            ]}
          />
          <Text style={styles.statusText}>
            {done ? "Analysis Complete" : "Analyzing Strava data..."}
          </Text>
        </View>

        {/* Analysis lines */}
        <View style={styles.linesContainer}>
          {lines.map((line, index) =>
            line.type === "sp" ? (
              <View key={index} style={styles.spacer} />
            ) : (
              <Animated.View
                key={index}
                entering={FadeIn.duration(250)}
                style={styles.lineRow}
              >
                <Text
                  style={[
                    styles.lineText,
                    { color: getLineColor(line.type) },
                    line.type === "res" && styles.lineTextBold,
                  ]}
                >
                  {line.type === "res" && "✓ "}
                  {line.text}
                </Text>
              </Animated.View>
            )
          )}
          {!done && lines.length > 0 && (
            <View style={styles.cursorContainer}>
              <Cursor visible height={16} />
            </View>
          )}
        </View>

        {/* Coach message */}
        {showCoach && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.coachSection}>
            <Text style={styles.coachText}>
              {coachStream.displayed}
              {!coachStream.done && coachStream.started && <Cursor visible height={22} />}
            </Text>
            {coachStream.done && (
              <Animated.View entering={FadeIn.delay(200)} style={styles.badgeContainer}>
                <Badge level="HIGH" />
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Continue button */}
      {showCoach && coachStream.done && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.buttonContainer}>
          <Pressable onPress={onNext} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Let's go</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 11,
    fontWeight: "500",
    color: GRAYS.g3,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  linesContainer: {
    gap: 2,
  },
  lineRow: {
    paddingVertical: 2,
  },
  lineText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 13,
    lineHeight: 22,
  },
  lineTextBold: {
    fontFamily: "JetBrainsMono-Medium",
    fontWeight: "600",
  },
  spacer: {
    height: 8,
  },
  cursorContainer: {
    marginTop: 4,
  },
  coachSection: {
    marginTop: 28,
  },
  coachText: {
    fontSize: 22,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 30,
    letterSpacing: -0.44,
  },
  badgeContainer: {
    marginTop: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.6,
  },
  buttonContainer: {
    marginTop: 16,
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
