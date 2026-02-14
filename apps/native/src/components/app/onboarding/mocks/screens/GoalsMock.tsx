/**
 * GoalsMock - Goals screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 506-553
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { StreamBlock } from "../../StreamBlock";
import { Choice, Btn } from "../../generative/Choice";
import { FreeformInput } from "../../generative/FreeformInput";
import { MiniAnalysis } from "../../generative/MiniAnalysis";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface GoalsMockProps {
  hasData: boolean;
  onNext: () => void;
}

const GOAL_OPTIONS = [
  { label: "Training for a race", value: "race" },
  { label: "Getting faster", value: "speed" },
  { label: "Building mileage", value: "base" },
  { label: "Getting back in shape", value: "return" },
  { label: "General health", value: "health" },
];

export function GoalsMock({ hasData, onNext }: GoalsMockProps) {
  const [phase, setPhase] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [freeformMode, setFreeformMode] = useState(false);
  const [freeformText, setFreeformText] = useState("");
  const [freeformAnalyzed, setFreeformAnalyzed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const promptText = hasData
    ? "Your training data tells me a lot — but not what you're actually working toward. What's the goal?"
    : "Now the big one — what are you working toward?";

  const intro = useStream({
    text: promptText,
    speed: 28,
    delay: 300,
  });

  useEffect(() => {
    if (intro.done) setTimeout(() => setPhase(1), 400);
  }, [intro.done]);

  useEffect(() => {
    if (selected && selected !== "custom") {
      setTimeout(() => setPhase(2), 600);
    }
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [phase, freeformAnalyzed]);

  const handleFreeformSubmit = (text: string) => {
    setFreeformText(text);
    setFreeformMode(false);
  };

  const handleAnalysisDone = () => {
    setFreeformAnalyzed(true);
    setSelected("custom");
  };

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

        {/* Goal Options */}
        {phase >= 1 && !freeformMode && !freeformText && (
          <View style={styles.choices}>
            {GOAL_OPTIONS.map((opt, i) => (
              <Choice
                key={opt.value}
                label={opt.label}
                selected={selected === opt.value}
                onSelect={() => setSelected(opt.value)}
                delay={i * 0.04}
              />
            ))}
            <Pressable
              onPress={() => setFreeformMode(true)}
              style={styles.freeformTrigger}
            >
              <Text style={styles.freeformPlus}>+</Text>
              <Text style={styles.freeformLabel}>
                Something else — let me explain
              </Text>
            </Pressable>
          </View>
        )}

        {/* Freeform Input */}
        {phase >= 1 && freeformMode && !freeformText && (
          <Animated.View entering={FadeIn.duration(300)}>
            <StreamBlock
              text="Tell me in your own words — what does success look like?"
              size={20}
              color={GRAYS.g2}
            />
            <View style={styles.freeformInput}>
              <FreeformInput
                placeholder="e.g. I want to run a half marathon under 1:45 in October..."
                onSubmit={handleFreeformSubmit}
              />
            </View>
            <Pressable
              onPress={() => setFreeformMode(false)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back to options</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Freeform Analysis */}
        {freeformText && (
          <View style={styles.section}>
            <MiniAnalysis text={freeformText} onDone={handleAnalysisDone} />
            {freeformAnalyzed && (
              <Animated.View
                entering={FadeIn.delay(400).duration(300)}
                style={styles.coachResponse}
              >
                <StreamBlock
                  text="Understood. That's a clear goal — I can build around that."
                  size={17}
                  color={GRAYS.g3}
                />
              </Animated.View>
            )}
          </View>
        )}

        {/* Race follow-up */}
        {phase >= 2 && selected === "race" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <StreamBlock text="Nice. Which distance?" size={20} color={GRAYS.g2} />
          </Animated.View>
        )}
      </ScrollView>

      {selected && (
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
    gap: 8,
  },
  freeformTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: GRAYS.g4,
  },
  freeformPlus: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 14,
    color: GRAYS.g4,
  },
  freeformLabel: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    color: GRAYS.g3,
  },
  freeformInput: {
    marginTop: 12,
  },
  backButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: GRAYS.g4,
  },
  coachResponse: {
    marginTop: 14,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
});
