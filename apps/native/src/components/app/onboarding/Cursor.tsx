import { createBlinkValue } from "@/lib/animations";
import { COLORS } from "@/lib/design-tokens";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

export type CursorProps = {
  /** Whether the cursor is visible (controls blink animation) */
  visible: boolean;
  /** Height of the cursor in pixels (default: 16, ~1em at standard size) */
  height?: number;
};

/**
 * Blinking cursor component for streaming text.
 * Uses Reanimated for smooth 0.8s blink animation.
 *
 * @example
 * ```tsx
 * <Cursor visible={!done && started} />
 * ```
 */
export function Cursor({ visible, height = 16 }: CursorProps) {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      // Start blink animation
      opacity.value = createBlinkValue();
    } else {
      // Stop and hide
      opacity.value = 0;
    }
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.cursor, { height }, animatedStyle]}
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  cursor: {
    width: 2,
    backgroundColor: COLORS.lime,
    marginLeft: 2,
  },
});
