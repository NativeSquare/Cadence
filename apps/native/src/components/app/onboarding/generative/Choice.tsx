/**
 * Choice Component - Selection card for single/multi-select options.
 *
 * Features:
 * - springUp entrance animation with staggered delays
 * - checkPop animation on selection
 * - Press scale feedback (0.98)
 * - Haptic feedback on selection
 * - Single-select (round) vs multi-select (square) indicators
 * - Flagged state with red/warning styling
 *
 * Source: Story 2.11 - AC#1-#6
 */

import { useCallback, useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/text";
import { SPRING_CONFIG, SPRING_SNAPPY } from "@/lib/animations";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

interface ChoiceProps {
  /** Display label for the choice */
  label: string;
  /** Optional description text */
  desc?: string;
  /** Whether this choice is selected */
  selected: boolean;
  /** Callback when choice is tapped */
  onSelect: () => void;
  /** Animation delay in seconds for staggered entrance */
  delay?: number;
  /** Multi-select mode uses square indicators */
  multi?: boolean;
  /** Flagged state shows red/warning styling */
  flagged?: boolean;
  /** Disable interaction */
  disabled?: boolean;
}

// =============================================================================
// Animation Constants
// =============================================================================

const PRESS_SCALE = 0.98;
const PRESS_DURATION = 100;
const CARD_RADIUS = 14;
const INDICATOR_SIZE = 22;
const MULTI_RADIUS = 6;
const SINGLE_RADIUS = 11;

// =============================================================================
// Animated Pressable
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// =============================================================================
// Checkmark Component
// =============================================================================

function Checkmark({ visible, flagged }: { visible: boolean; flagged?: boolean }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // checkPop animation: 0 → 1.15 → 1
      scale.value = withSequence(
        withTiming(1.15, { duration: 150, easing: Easing.out(Easing.ease) }),
        withSpring(1, SPRING_SNAPPY)
      );
    } else {
      scale.value = withTiming(0, { duration: 100 });
    }
  }, [visible, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 0 ? 1 : 0,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke={flagged ? COLORS.red : COLORS.black}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

// =============================================================================
// Choice Component
// =============================================================================

// =============================================================================
// Btn Component (Primary Action Button)
// =============================================================================

interface BtnProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Ghost variant (outlined) */
  ghost?: boolean;
  /** Animation delay in seconds */
  delay?: number;
  /** Disable interaction */
  disabled?: boolean;
}

export function Btn({
  label,
  onPress,
  ghost = false,
  delay = 0,
  disabled = false,
}: BtnProps) {
  const pressed = useSharedValue(0);
  const entrance = useSharedValue(0);

  // Entrance animation
  useEffect(() => {
    entrance.value = withDelay(
      delay * 1000,
      withSpring(1, SPRING_CONFIG)
    );
  }, [delay, entrance]);

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: 100 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 100 });
  }, [pressed]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = 1 - pressed.value * 0.025; // 0.975 when pressed

    return {
      opacity: entrance.value,
      transform: [
        { translateY: (1 - entrance.value) * 24 },
        { scale: entrance.value * scale },
      ],
    };
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        {
          width: "100%",
          paddingVertical: ghost ? 14 : 18,
          paddingHorizontal: ghost ? 20 : 24,
          borderRadius: 14,
          borderWidth: ghost ? 1 : 0,
          borderColor: ghost ? SURFACES.brd : "transparent",
          backgroundColor: ghost ? SURFACES.card : COLORS.lime,
          alignItems: "center",
          justifyContent: "center",
        },
        animatedStyle,
      ]}
    >
      <Text
        className="font-coach"
        style={{
          fontSize: ghost ? 14 : 17,
          fontWeight: ghost ? "400" : "600",
          color: ghost ? GRAYS.g3 : COLORS.black,
          letterSpacing: -0.17, // -0.01em at 17px
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// =============================================================================
// Choice Component
// =============================================================================

export function Choice({
  label,
  desc,
  selected,
  onSelect,
  delay = 0,
  multi = false,
  flagged = false,
  disabled = false,
}: ChoiceProps) {
  // Animation values
  const pressed = useSharedValue(0);
  const entrance = useSharedValue(0);
  const selection = useSharedValue(selected ? 1 : 0);

  // Entrance animation
  useEffect(() => {
    entrance.value = withDelay(
      delay * 1000,
      withSpring(1, SPRING_CONFIG)
    );
  }, [delay, entrance]);

  // Selection animation
  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, selection]);

  // Haptic feedback handler
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Press handlers
  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: PRESS_DURATION });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: PRESS_DURATION });
  }, [pressed]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (!selected) {
      runOnJS(triggerHaptic)();
    }
    onSelect();
  }, [disabled, selected, onSelect, triggerHaptic]);

  // Card animated style
  const cardStyle = useAnimatedStyle(() => {
    const scale = 1 - pressed.value * (1 - PRESS_SCALE);

    // Border color interpolation
    const borderColor = flagged
      ? "rgba(255,90,90,0.2)"
      : interpolateColor(
          selection.value,
          [0, 1],
          [SURFACES.brd, SURFACES.sb]
        );

    // Background color interpolation
    const backgroundColor = flagged
      ? COLORS.redDim
      : interpolateColor(
          selection.value,
          [0, 1],
          ["transparent", SURFACES.sg]
        );

    return {
      opacity: entrance.value,
      transform: [
        { translateY: (1 - entrance.value) * 24 },
        { scale: entrance.value * scale },
      ],
      borderColor,
      backgroundColor,
    };
  });

  // Indicator animated style
  const indicatorStyle = useAnimatedStyle(() => {
    const borderColor = flagged
      ? interpolateColor(selection.value, [0, 1], [GRAYS.g4, COLORS.red])
      : interpolateColor(selection.value, [0, 1], [GRAYS.g4, COLORS.lime]);

    const backgroundColor = flagged
      ? interpolateColor(selection.value, [0, 1], ["transparent", COLORS.red])
      : interpolateColor(selection.value, [0, 1], ["transparent", COLORS.lime]);

    return {
      borderColor,
      backgroundColor,
    };
  });

  const indicatorRadius = multi ? MULTI_RADIUS : SINGLE_RADIUS;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        {
          width: "100%",
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        },
        cardStyle,
      ]}
    >
      {/* Indicator (checkbox/radio) */}
      <Animated.View
        style={[
          {
            width: INDICATOR_SIZE,
            height: INDICATOR_SIZE,
            borderRadius: indicatorRadius,
            borderWidth: 1.5,
            alignItems: "center",
            justifyContent: "center",
          },
          indicatorStyle,
        ]}
      >
        <Checkmark visible={selected} flagged={flagged} />
      </Animated.View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          className="font-coach"
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: selected ? GRAYS.g1 : GRAYS.g2,
          }}
        >
          {label}
        </Text>
        {desc && (
          <Text
            className="font-coach"
            style={{
              fontSize: 12,
              color: flagged ? COLORS.red : GRAYS.g3,
              marginTop: 3,
            }}
          >
            {desc}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}
