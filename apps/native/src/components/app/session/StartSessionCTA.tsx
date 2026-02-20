/**
 * StartSessionCTA - Sticky bottom button to start session
 * Reference: cadence-full-v10.jsx lines 388-396
 *
 * Features:
 * - Sticky positioning with gradient fade
 * - Full width button with lime play icon circle
 * - Press feedback animation (scale 0.97)
 * - Box shadow for depth
 */

import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Play } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface StartSessionCTAProps {
  /** Callback when start is pressed */
  onStart: () => void;
}

export function StartSessionCTA({ onStart }: StartSessionCTAProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 z-[400]"
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={["transparent", LIGHT_THEME.w2]}
        locations={[0, 0.2]}
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <AnimatedPressable
          onPress={onStart}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            {
              width: "100%",
              paddingVertical: 18,
              paddingHorizontal: 24,
              borderRadius: 18,
              backgroundColor: LIGHT_THEME.wText,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 32,
              elevation: 8,
            },
            animatedStyle,
          ]}
        >
          {/* Play icon in lime circle */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: COLORS.lime,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play
              size={14}
              color="#000000"
              fill="#000000"
            />
          </View>

          {/* Button text */}
          <Text
            style={{
              fontSize: 17,
              fontFamily: FONT_WEIGHTS.bold,
              color: LIGHT_THEME.w1,
            }}
          >
            Start Session
          </Text>
        </AnimatedPressable>
      </LinearGradient>
    </View>
  );
}
