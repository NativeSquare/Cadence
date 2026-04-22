/**
 * TransitionScreen - triggers plan generation while showing the "building your plan" animation.
 * Waits for plan generation to complete before advancing.
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
import { useAction, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../Cursor";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface TransitionScreenProps {
  onDone: () => void;
}

type GoalType = "5k" | "10k" | "half_marathon" | "marathon" | "base_building";

/**
 * Map the athlete's nearest future event distance to a training goal type.
 * Fallback to `base_building` when no event exists (or distance is unset).
 */
function inferGoalType(
  events: Array<{ date: string; distanceMeters?: number }> | null | undefined,
): GoalType {
  if (!events || events.length === 0) return "base_building";
  const nearest = [...events].sort((a, b) => a.date.localeCompare(b.date))[0];
  const d = nearest?.distanceMeters;
  if (!d) return "base_building";
  if (Math.abs(d - 5000) < 500) return "5k";
  if (Math.abs(d - 10000) < 500) return "10k";
  if (Math.abs(d - 21097) < 1000) return "half_marathon";
  if (Math.abs(d - 42195) < 1500) return "marathon";
  return "base_building";
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

export function TransitionScreen({ onDone }: TransitionScreenProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const planGenerationStarted = useRef(false);

  const generatePlan = useAction(api.plan.generate.generatePlan);
  const futureEvents = useQuery(api.plan.reads.listEvents, {
    startDate: new Date().toISOString().slice(0, 10),
  });

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

  // Trigger plan generation when spinner appears. Wait until the events
  // query has resolved so we can pick the right goal type.
  useEffect(() => {
    if (
      showSpinner &&
      !planGenerationStarted.current &&
      futureEvents !== undefined
    ) {
      planGenerationStarted.current = true;
      const goalType = inferGoalType(futureEvents);
      console.log("[TransitionScreen] Starting plan generation:", { goalType });

      generatePlan({ goalType })
        .then((result) => {
          console.log("[TransitionScreen] Plan generated successfully:", result);
          setPlanGenerated(true);
        })
        .catch((error) => {
          console.error("[TransitionScreen] Plan generation failed:", error);
          // Do NOT advance on error - keep spinner showing
          // User will need to retry or debug
        });
    }
  }, [showSpinner, generatePlan, futureEvents]);

  // Only advance when spinner is showing AND plan is generated
  useEffect(() => {
    if (showSpinner && planGenerated) {
      console.log("[TransitionScreen] Plan ready, advancing to next screen...");
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
