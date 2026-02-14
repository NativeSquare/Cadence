/**
 * WelcomeMock - Welcome screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 376-394
 */

import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { Btn } from "../../generative/Choice";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface WelcomeMockProps {
  userName?: string;
  onNext: () => void;
}

export function WelcomeMock({ userName = "Alex", onNext }: WelcomeMockProps) {
  const [ready, setReady] = useState(false);

  const s1 = useStream({
    text: `${userName}, every runner's different.`,
    speed: 32,
    delay: 500,
  });

  const s2 = useStream({
    text: "Before I coach you, I need to know who I'm working with.",
    speed: 32,
    delay: 400,
    active: s1.done,
  });

  const s3 = useStream({
    text: "Mind a few questions?",
    speed: 32,
    delay: 600,
    active: s2.done,
  });

  useEffect(() => {
    if (s3.done) {
      setTimeout(() => setReady(true), 400);
    }
  }, [s3.done]);

  return (
    <View style={styles.container}>
      <View style={styles.textArea}>
        <Text style={styles.headline}>
          <Text style={styles.headlineBold}>{s1.displayed}</Text>
          {!s1.done && s1.started && <Cursor visible height={36} />}
        </Text>

        {s2.started && (
          <Text style={[styles.headline, styles.marginTop]}>
            {s2.displayed}
            {!s2.done && <Cursor visible height={36} />}
          </Text>
        )}

        {s3.started && (
          <Text style={[styles.subheadline, styles.marginTopLarge]}>
            {s3.displayed}
            {!s3.done && <Cursor visible height={36} />}
          </Text>
        )}
      </View>

      {ready && <Btn label="Get Started" onPress={onNext} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: "space-between",
    paddingTop: 120,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  textArea: {
    flex: 1,
  },
  headline: {
    fontSize: 42,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 50, // 1.18
    letterSpacing: -1.26, // -0.03em
  },
  headlineBold: {
    fontFamily: "Outfit-Medium",
    fontWeight: "500",
  },
  subheadline: {
    fontSize: 42,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g2,
    lineHeight: 50,
    letterSpacing: -1.26,
  },
  marginTop: {
    marginTop: 8,
  },
  marginTopLarge: {
    marginTop: 24,
  },
});
