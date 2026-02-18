/**
 * TransitionMock - Transition screen matching cadence-v3.jsx prototype.
 *
 * This screen triggers plan generation while showing the "building your plan" animation.
 * It waits for plan generation to complete before advancing.
 *
 * Source: cadence-v3.jsx lines 683-698
 */

import { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface TransitionMockProps {
  onDone: () => void;
}

function Spinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <Animated.View style={[styles.spinner, animatedStyle]} />;
}

export function TransitionMock({ onDone }: TransitionMockProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const planGenerationStarted = useRef(false);

  // Plan generation mutation
  const generatePlan = useMutation(api.training.mutations.generateAndPersistPlan);

  const s1 = useStream({
    text: "Okay. I believe I have what I need to draft your game plan.",
    speed: 15,
    delay: 500,
  });

  const s2 = useStream({
    text: "Give me a second to put this together...",
    speed: 15,
    delay: 400,
    active: s1.done,
  });

  useEffect(() => {
    if (s2.done) {
      setTimeout(() => setShowSpinner(true), 600);
    }
  }, [s2.done]);

  // Trigger plan generation when spinner appears
  useEffect(() => {
    if (showSpinner && !planGenerationStarted.current) {
      planGenerationStarted.current = true;
      console.log("[TransitionMock] Starting plan generation...");

      generatePlan({})
        .then((result) => {
          console.log("[TransitionMock] Plan generated successfully:", result);
          setPlanGenerated(true);
        })
        .catch((error) => {
          console.error("[TransitionMock] Plan generation failed:", error);
          // Do NOT advance on error - keep spinner showing
          // User will need to retry or debug
        });
    }
  }, [showSpinner, generatePlan]);

  // Only advance when spinner is showing AND plan is generated
  useEffect(() => {
    if (showSpinner && planGenerated) {
      console.log("[TransitionMock] Plan ready, advancing to next screen...");
      setTimeout(onDone, 500);
    }
  }, [showSpinner, planGenerated, onDone]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>
          {s1.displayed}
          {!s1.done && s1.started && <Cursor visible height={24} />}
        </Text>

        {s2.started && (
          <Text style={styles.subheadline}>
            {s2.displayed}
            {!s2.done && <Cursor visible height={20} />}
          </Text>
        )}

        {showSpinner && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.spinnerContainer}>
            <Spinner />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 82,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  content: {
    maxWidth: 300,
    alignItems: "center",
  },
  headline: {
    fontSize: 28,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 38,
    letterSpacing: -0.56,
    textAlign: "center",
    marginBottom: 16,
  },
  subheadline: {
    fontSize: 22,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g3,
    lineHeight: 30,
    textAlign: "center",
  },
  spinnerContainer: {
    marginTop: 40,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: GRAYS.g6,
    borderTopColor: COLORS.lime,
  },
});
