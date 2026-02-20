/**
 * CelebrationOverlay - Full-screen celebration animation
 * Reference: cadence-full-v10.jsx CelebrationOverlay (lines 599-633)
 *
 * Features:
 * - Phase-based animations (0=check, 1=text, 2=fadeout)
 * - Check circle with glow (celebCheck animation)
 * - SVG ring burst animations (celebRing, celebRing2)
 * - Text reveal animation (celebText)
 * - Auto-dismiss after 2800ms
 */

import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CelebrationOverlayProps {
  session: {
    type: string;
    zone: string;
    km: number;
  };
  onComplete: () => void;
}

export function CelebrationOverlay({
  session,
  onComplete,
}: CelebrationOverlayProps) {
  const [phase, setPhase] = useState(0); // 0=check, 1=text, 2=fadeout

  // Animation values
  const checkScale = useSharedValue(0);
  const checkRotation = useSharedValue(-20);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);
  const ringStrokeDashoffset = useSharedValue(220); // Animated strokeDashoffset
  const ring2Scale = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);
  const fadeOutOpacity = useSharedValue(1);

  useEffect(() => {
    // Phase transitions with timeouts matching prototype
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onComplete(), 2800);

    // Check circle animation (celebCheck) - 700ms total
    // 0%: scale(0) rotate(-20deg) opacity:0
    // 50%: scale(1.2) rotate(5deg) opacity:1
    // 70%: scale(0.95) rotate(-2deg)
    // 100%: scale(1) rotate(0)
    checkOpacity.value = withTiming(1, { duration: 350 });
    checkScale.value = withSequence(
      withTiming(1.2, { duration: 350, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
      withTiming(0.95, { duration: 140 }),
      withTiming(1, { duration: 210 })
    );
    checkRotation.value = withSequence(
      withTiming(5, { duration: 350 }),
      withTiming(-2, { duration: 140 }),
      withTiming(0, { duration: 210 })
    );

    // Ring burst animation (celebRing) - 1000ms total
    // 0%: scale(.3) opacity:0 stroke-dashoffset:220
    // 40%: opacity:1
    // 100%: scale(1) opacity:0 stroke-dashoffset:0
    ringScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    ringOpacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 600 })
    );
    ringStrokeDashoffset.value = withTiming(0, {
      duration: 1000,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });

    // Ring 2 animation (celebRing2)
    ring2Scale.value = withDelay(
      200,
      withTiming(1.8, { duration: 1200, easing: Easing.ease })
    );
    ring2Opacity.value = withDelay(
      200,
      withSequence(
        withTiming(0.6, { duration: 360 }),
        withTiming(0, { duration: 840 })
      )
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Text animation when phase 1
  useEffect(() => {
    if (phase >= 1) {
      textOpacity.value = withTiming(1, { duration: 500 });
      textTranslateY.value = withTiming(0, { duration: 500 });
    }
  }, [phase]);

  // Fade out when phase 2
  useEffect(() => {
    if (phase >= 2) {
      fadeOutOpacity.value = withTiming(0, { duration: 600 });
    }
  }, [phase]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotation.value}deg` },
    ],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  // Animated props for SVG strokeDashoffset
  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: ringStrokeDashoffset.value,
  }));

  const ring2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOutOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
    >
      <View style={styles.content}>
        {/* Outer ring burst */}
        <View style={styles.ringContainer}>
          {/* Primary ring with animated strokeDashoffset */}
          <Animated.View style={[styles.ringSvgContainer, ringAnimatedStyle]}>
            <Svg width={140} height={140} viewBox="0 0 140 140">
              <AnimatedCircle
                cx={70}
                cy={70}
                r={60}
                fill="none"
                stroke={COLORS.lime}
                strokeWidth={2}
                strokeDasharray={220}
                animatedProps={ringAnimatedProps}
              />
            </Svg>
          </Animated.View>

          {/* Secondary ring */}
          <Animated.View
            style={[styles.ring2, ring2AnimatedStyle]}
          />
        </View>

        {/* Check circle */}
        <Animated.View style={[styles.checkCircle, checkAnimatedStyle]}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 12.5l5.5 5.5L20 6"
              stroke={COLORS.black}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text
            className="text-[22px] font-coach-extrabold text-center"
            style={{ color: GRAYS.g1, letterSpacing: -0.03 * 22 }}
          >
            {session.type}
          </Text>
          <Text
            className="text-[14px] font-coach-medium text-center mt-[6px]"
            style={{ color: COLORS.lime, letterSpacing: 0.04 * 14 }}
          >
            Logged ✓
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    backgroundColor: COLORS.black,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  ringContainer: {
    position: "absolute",
    width: 140,
    height: 140,
  },
  ringSvgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  ring2: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: `${COLORS.lime}33`,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.lime,
    alignItems: "center",
    justifyContent: "center",
    // Box shadow for glow effect
    shadowColor: COLORS.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 60,
    elevation: 20,
  },
  textContainer: {
    marginTop: 28,
    alignItems: "center",
  },
});
