import { COLORS, GRAYS } from "@/lib/design-tokens";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

export function CommunityPulse() {
  const [count, setCount] = useState(12847);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.3);

  // Simulate live counter ticking up
  useEffect(() => {
    const iv = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  // Pulse ring animation
  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 0 }),
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
  }, [ringScale, ringOpacity]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Live pulse indicator */}
      <View style={styles.pulseContainer}>
        <View style={styles.pulseDot} />
        <Animated.View style={[styles.pulseRing, ringAnimatedStyle]} />
      </View>

      <Text style={styles.text}>
        <Text style={styles.count}>{count.toLocaleString()}</Text> runners
        training with Cadence
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(200,255,0,0.06)",
    borderWidth: 1,
    borderColor: "rgba(200,255,0,0.1)",
  },
  pulseContainer: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lime,
  },
  pulseRing: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.lime,
  },
  text: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 11,
    color: GRAYS.g2,
    letterSpacing: 0.22,
  },
  count: {
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.lime,
  },
});
