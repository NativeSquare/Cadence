/**
 * TransitionMock - Transition screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 683-698
 */

import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { FlowProgressBar } from "../../FlowProgressBar";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface TransitionMockProps {
  onDone: () => void;
}

export function TransitionMock({ onDone }: TransitionMockProps) {
  const [showSpinner, setShowSpinner] = useState(false);

  const s1 = useStream({
    text: "Okay. I believe I have what I need to draft your game plan.",
    speed: 30,
    delay: 500,
  });

  const s2 = useStream({
    text: "Give me a second to put this together...",
    speed: 30,
    delay: 400,
    active: s1.done,
  });

  useEffect(() => {
    if (s2.done) {
      setTimeout(() => setShowSpinner(true), 600);
    }
  }, [s2.done]);

  useEffect(() => {
    if (showSpinner) {
      setTimeout(onDone, 2500);
    }
  }, [showSpinner, onDone]);

  return (
    <View style={styles.container}>
      <FlowProgressBar progress={100} />

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
            <View style={styles.spinner} />
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
    paddingHorizontal: 32,
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
