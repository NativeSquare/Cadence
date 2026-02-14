/**
 * SelfReportMock - Self-report screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 473-501
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { Choice, Btn } from "../../generative/Choice";
import { ConfidenceBadge } from "../../generative/ConfidenceBadge";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

interface SelfReportMockProps {
  onNext: () => void;
}

const VOLUME_OPTIONS = [
  { label: "Less than 20km", value: "lt20" },
  { label: "20–40km", value: "20-40" },
  { label: "40–60km", value: "40-60" },
  { label: "60km+", value: "60+" },
  { label: "I'm not sure", value: "?" },
];

const LONGEST_RUN_OPTIONS = [
  { label: "Under 10km", value: "lt10" },
  { label: "10–15km", value: "10-15" },
  { label: "15–20km", value: "15-20" },
  { label: "20km+", value: "20+" },
];

export function SelfReportMock({ onNext }: SelfReportMockProps) {
  const [phase, setPhase] = useState(0);
  const [volume, setVolume] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [longestRun, setLongestRun] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const intro = useStream({
    text: "No worries — I can work with what you tell me. It'll take a couple extra questions, but we'll get there.",
    speed: 28,
    delay: 300,
  });

  useEffect(() => {
    if (intro.done) setTimeout(() => setPhase(1), 500);
  }, [intro.done]);

  useEffect(() => {
    if (volume) setTimeout(() => setPhase(2), 500);
  }, [volume]);

  useEffect(() => {
    if (frequency) setTimeout(() => setPhase(3), 500);
  }, [frequency]);

  useEffect(() => {
    if (longestRun) setTimeout(() => setPhase(4), 500);
  }, [longestRun]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [phase]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={styles.coachText}>
          {intro.displayed}
          {!intro.done && intro.started && <Cursor visible height={20} />}
        </Text>

        {/* Volume Question */}
        {phase >= 1 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <Text style={styles.question}>
              Roughly, how many kilometers in a typical week?
            </Text>
            <View style={styles.choices}>
              {VOLUME_OPTIONS.map((opt, i) => (
                <Choice
                  key={opt.value}
                  label={opt.label}
                  selected={volume === opt.value}
                  onSelect={() => setVolume(opt.value)}
                  delay={i * 0.03}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Frequency Question */}
        {phase >= 2 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <Text style={styles.question}>How many days a week?</Text>
            <View style={styles.pillRow}>
              {["2", "3", "4", "5", "6", "7"].map((day, i) => (
                <Pressable
                  key={day}
                  onPress={() => setFrequency(day)}
                  style={[
                    styles.dayPill,
                    frequency === day && styles.dayPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      frequency === day && styles.dayPillTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Longest Run Question */}
        {phase >= 3 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <Text style={styles.question}>Longest run in the last month?</Text>
            <View style={styles.choices}>
              {LONGEST_RUN_OPTIONS.map((opt, i) => (
                <Choice
                  key={opt.value}
                  label={opt.label}
                  selected={longestRun === opt.value}
                  onSelect={() => setLongestRun(opt.value)}
                  delay={i * 0.03}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Completion */}
        {phase >= 4 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <Text style={styles.coachMuted}>
              Good — that gives me a starting point. I'll be conservative until
              I learn from your first few runs.
            </Text>
            <View style={styles.badge}>
              <ConfidenceBadge level="MODERATE" hasData={false} />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {phase >= 4 && (
        <View style={styles.buttonContainer}>
          <Btn label="Continue" onPress={onNext} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  coachText: {
    fontSize: 24,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 34,
    letterSpacing: -0.48,
    marginBottom: 20,
  },
  coachMuted: {
    fontSize: 16,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g3,
    lineHeight: 24,
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g2,
    lineHeight: 25,
    marginBottom: 12,
  },
  choices: {
    gap: 6,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayPill: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillSelected: {
    borderColor: SURFACES.sb,
    backgroundColor: SURFACES.sg,
  },
  dayPillText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 18,
    fontWeight: "500",
    color: GRAYS.g2,
  },
  dayPillTextSelected: {
    color: COLORS.lime,
  },
  badge: {
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
});
