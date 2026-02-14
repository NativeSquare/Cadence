/**
 * StyleMock - Coaching style screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 590-614
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { StreamBlock } from "../../StreamBlock";
import { Choice, Btn } from "../../generative/Choice";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface StyleMockProps {
  onNext: () => void;
}

const STYLE_OPTIONS = [
  { label: "Tough love — push me", value: "tough" },
  { label: "Encouraging — keep it positive", value: "enc" },
  { label: "Analytical — give me the data", value: "ana" },
  { label: "Minimalist — just tell me what to do", value: "min" },
];

const CHALLENGE_OPTIONS = [
  { label: "Consistency — I struggle to stick with it", value: "cons" },
  { label: "Pacing — I always go too fast", value: "pace" },
  { label: "Time — never enough", value: "time" },
  { label: "I just feel stuck", value: "stuck" },
];

export function StyleMock({ onNext }: StyleMockProps) {
  const [phase, setPhase] = useState(0);
  const [style, setStyle] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const intro = useStream({
    text: "Almost there. This one's about how you want me to show up.",
    speed: 28,
    delay: 300,
  });

  useEffect(() => {
    if (intro.done) setTimeout(() => setPhase(1), 500);
  }, [intro.done]);

  useEffect(() => {
    if (style) setTimeout(() => setPhase(2), 500);
  }, [style]);

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
        <View style={styles.section}>
          <Text style={styles.coachText}>
            {intro.displayed}
            {!intro.done && intro.started && <Cursor visible height={22} />}
          </Text>
        </View>

        {/* Style Options */}
        {phase >= 1 && (
          <View style={styles.choices}>
            {STYLE_OPTIONS.map((opt, i) => (
              <Choice
                key={opt.value}
                label={opt.label}
                selected={style === opt.value}
                onSelect={() => setStyle(opt.value)}
                delay={i * 0.04}
              />
            ))}
          </View>
        )}

        {/* Challenge Question */}
        {phase >= 2 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.challengeSection}>
            <StreamBlock
              text="And what's the biggest thing holding you back right now?"
              size={20}
              color={GRAYS.g2}
            />
            <View style={styles.challengeChoices}>
              {CHALLENGE_OPTIONS.map((opt, i) => (
                <Choice
                  key={opt.value}
                  label={opt.label}
                  selected={challenge === opt.value}
                  onSelect={() => setChallenge(opt.value)}
                  delay={i * 0.04}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {challenge && (
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
  section: {
    marginBottom: 20,
  },
  coachText: {
    fontSize: 26,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 36,
    letterSpacing: -0.52,
  },
  choices: {
    gap: 6,
  },
  challengeSection: {
    marginTop: 24,
  },
  challengeChoices: {
    gap: 6,
    marginTop: 12,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
});
