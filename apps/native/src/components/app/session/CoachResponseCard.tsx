/**
 * CoachResponseCard - Dark background card with streaming coach message
 * Reference: cadence-full-v10.jsx coach response card (lines 809-821)
 *
 * Features:
 * - Dark background with radial gradient decoration
 * - Coach avatar (lime circle with "C")
 * - Streaming text with blinking cursor
 * - Uses use-stream hook (22ms speed, 300ms delay)
 */

import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, LIGHT_THEME } from "@/lib/design-tokens";
import { useStream } from "@/hooks/use-stream";

// Blinking cursor component
function BlinkingCursor() {
  return (
    <Animated.View
      className="w-[2px] h-[18px] ml-[2px]"
      style={{
        backgroundColor: COLORS.lime,
        // Note: Animation handled via CSS animation class or JS interval
        // For simplicity, using static cursor - can enhance with animated opacity
      }}
    />
  );
}

export interface CoachResponseCardProps {
  message: string;
  onStreamComplete?: () => void;
}

export function CoachResponseCard({
  message,
  onStreamComplete,
}: CoachResponseCardProps) {
  const { displayed, done, started } = useStream({
    text: message,
    speed: 22,
    delay: 300,
    active: true,
  });

  // Call onStreamComplete when done
  if (done && onStreamComplete) {
    // Using a slight delay to ensure the UI updates first
    setTimeout(onStreamComplete, 0);
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="p-[22px] rounded-[22px] mb-4 overflow-hidden"
      style={{ backgroundColor: LIGHT_THEME.wText }}
    >
      {/* Radial gradient decoration */}
      <View
        className="absolute top-0 right-0 w-[120px] h-[120px]"
        style={{
          // Simulating radial gradient with solid color for RN
          // In production, use expo-linear-gradient or similar
          backgroundColor: "transparent",
        }}
      />

      {/* Content */}
      <View className="relative z-[2]">
        {/* Coach header */}
        <View className="flex-row items-center gap-2 mb-[14px]">
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.lime }}
          >
            <Text
              className="text-[13px] font-coach-extrabold"
              style={{ color: COLORS.black }}
            >
              C
            </Text>
          </View>
          <Text
            className="text-[13px] font-coach-semibold"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Coach
          </Text>
        </View>

        {/* Streaming message */}
        <View className="flex-row flex-wrap items-baseline">
          <Text
            className="text-[17px] font-coach leading-[1.6]"
            style={{ color: GRAYS.g1, letterSpacing: -0.01 * 17 }}
          >
            {displayed}
          </Text>
          {!done && started && <BlinkingCursor />}
        </View>
      </View>
    </Animated.View>
  );
}
