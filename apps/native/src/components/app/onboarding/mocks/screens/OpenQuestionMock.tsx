/**
 * OpenQuestionMock - Open question screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 620-677
 */

import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { StreamBlock } from "../../StreamBlock";
import { FreeformInput } from "../../generative/FreeformInput";
import { MiniAnalysis } from "../../generative/MiniAnalysis";
import { Btn } from "../../generative/Choice";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface OpenQuestionMockProps {
  onNext: () => void;
}

export function OpenQuestionMock({ onNext }: OpenQuestionMockProps) {
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [coachDone, setCoachDone] = useState(false);
  const [ready, setReady] = useState(false);

  const intro = useStream({
    text: "Last thing. Anything else you want me to know?",
    speed: 28,
    delay: 300,
  });

  useEffect(() => {
    if (intro.done) setTimeout(() => setReady(true), 400);
  }, [intro.done]);

  const handleSubmit = (val: string) => {
    setAnswer(val);
    setSubmitted(true);
  };

  const handlePill = (pill: string) => {
    setAnswer(pill);
    setSubmitted(true);
    if (pill === "No, I think that covers it") {
      setAnalyzed(true);
    }
  };

  const isSkip = answer === "No, I think that covers it";
  const isCustom = submitted && !isSkip;
  const showButton = isSkip || (isCustom && analyzed && coachDone);

  return (
    <View style={styles.container}>
      <ScrollView
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

        {/* Freeform Input */}
        {ready && !submitted && (
          <FreeformInput
            placeholder="Training context, life constraints, past coaching experiences..."
            pills={["No, I think that covers it", "Actually, one more thing..."]}
            onSubmit={handleSubmit}
            onPill={handlePill}
          />
        )}

        {/* Custom Analysis */}
        {isCustom && (
          <View style={styles.analysisSection}>
            <MiniAnalysis text={answer} onDone={() => setAnalyzed(true)} />
            {analyzed && (
              <Animated.View
                entering={FadeIn.delay(200).duration(300)}
                style={styles.coachResponse}
              >
                <StreamBlock
                  text="Good — that changes a few things. I'll factor it into the plan."
                  size={17}
                  color={GRAYS.g3}
                  onDone={() => setCoachDone(true)}
                />
              </Animated.View>
            )}
          </View>
        )}

        {/* Skip Response */}
        {isSkip && (
          <Animated.View entering={FadeIn.duration(300)}>
            <StreamBlock
              text="Perfect. I've got everything I need."
              size={20}
              color={GRAYS.g2}
              onDone={() => setCoachDone(true)}
            />
          </Animated.View>
        )}
      </ScrollView>

      {showButton && (
        <View style={styles.buttonContainer}>
          <Btn label="Generate my plan" onPress={onNext} />
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
  analysisSection: {
    marginTop: 8,
  },
  coachResponse: {
    marginTop: 16,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
});
