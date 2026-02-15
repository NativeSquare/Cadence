/**
 * HealthMock - Health/injury screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 559-585
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

interface HealthMockProps {
  hasData: boolean;
  onNext: () => void;
}

const INJURY_OPTIONS = [
  { label: "Shin splints", value: "shin" },
  { label: "IT band syndrome", value: "itb" },
  { label: "Plantar fasciitis", value: "plantar" },
  { label: "Knee pain", value: "knee" },
  { label: "Achilles issues", value: "achilles" },
  { label: "None — I've been lucky", value: "none" },
];

const RECOVERY_OPTIONS = [
  { label: "I bounce back quick", value: "quick" },
  { label: "Takes a while but I get there", value: "slow" },
  { label: "I tend to push through it", value: "push", flagged: true, desc: "coaching flag" },
];

export function HealthMock({ hasData, onNext }: HealthMockProps) {
  const [phase, setPhase] = useState(0);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [recovery, setRecovery] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const promptText = hasData
    ? "Nice. Your data looks clean — no big injury gaps. But I want to hear it from you. Any past injuries?"
    : "Okay. Now the less fun stuff. Any past injuries that have affected your running?";

  const intro = useStream({
    text: promptText,
    speed: 14,
    delay: 300,
  });

  useEffect(() => {
    if (intro.done) setTimeout(() => setPhase(1), 400);
  }, [intro.done]);

  const toggleInjury = (value: string) => {
    if (value === "none") {
      setInjuries(injuries.includes("none") ? [] : ["none"]);
      return;
    }
    const filtered = injuries.filter((v) => v !== "none");
    if (filtered.includes(value)) {
      setInjuries(filtered.filter((v) => v !== value));
    } else {
      setInjuries([...filtered, value]);
    }
  };

  useEffect(() => {
    if (injuries.length > 0 && !injuries.includes("none")) {
      setTimeout(() => setPhase(2), 500);
    }
  }, [injuries.length, injuries]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [phase, recovery]);

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
            {!intro.done && intro.started && <Cursor visible height={20} />}
          </Text>
        </View>

        {/* Injury Multi-Select */}
        {phase >= 1 && (
          <View style={styles.choices}>
            {INJURY_OPTIONS.map((opt, i) => (
              <Choice
                key={opt.value}
                label={opt.label}
                selected={injuries.includes(opt.value)}
                onSelect={() => toggleInjury(opt.value)}
                delay={i * 0.03}
                multi
              />
            ))}
          </View>
        )}

        {/* Recovery Question */}
        {phase >= 2 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.recoverySection}>
            <StreamBlock
              text="When you've been hurt before, how do you typically recover?"
              size={20}
              color={GRAYS.g2}
            />
            <View style={styles.recoveryChoices}>
              {RECOVERY_OPTIONS.map((opt, i) => (
                <Choice
                  key={opt.value}
                  label={opt.label}
                  desc={opt.desc}
                  selected={recovery === opt.value}
                  onSelect={() => setRecovery(opt.value)}
                  delay={i * 0.04}
                  flagged={opt.flagged && recovery === opt.value}
                />
              ))}
            </View>

            {/* Push Through Warning */}
            {recovery === "push" && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.warningBox}>
                <Text style={styles.warningText}>
                  <Text style={styles.warningBold}>Noted.</Text> That tendency is
                  something I'll watch for. Sometimes the smartest training is
                  knowing when not to train.
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {injuries.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.buttonContainer}>
          <Btn label="Continue" onPress={onNext} />
        </Animated.View>
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
    fontSize: 24,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 34,
    letterSpacing: -0.48,
  },
  choices: {
    gap: 6,
  },
  recoverySection: {
    marginTop: 24,
  },
  recoveryChoices: {
    gap: 6,
    marginTop: 12,
  },
  warningBox: {
    marginTop: 14,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.15)",
    backgroundColor: COLORS.redDim,
  },
  warningText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g2,
    lineHeight: 21,
  },
  warningBold: {
    color: COLORS.red,
    fontWeight: "500",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 48,
    backgroundColor: COLORS.black,
  },
});
