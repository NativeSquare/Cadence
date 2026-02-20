/**
 * VoiceRecorderMode - Recording UI with waveform visualization
 * Reference: cadence-full-v10.jsx voice recorder mode (lines 766-781)
 *
 * Features:
 * - "Listening..." label
 * - 24-bar animated waveform (waveform keyframes)
 * - Timer display
 * - Cancel and Done buttons
 */

import { useEffect } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

export interface VoiceRecorderModeProps {
  recTime: number; // seconds
  onCancel: () => void;
  onDone: () => void;
}

function WaveformBar({ index }: { index: number }) {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    // Random duration between 0.4s and 0.8s
    const duration = 400 + Math.random() * 400;
    const delay = index * 40;

    scaleY.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.ease }),
        -1, // infinite
        true // reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          height: 40,
          borderRadius: 2,
          backgroundColor: COLORS.lime,
          opacity: 0.7,
          minHeight: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

export function VoiceRecorderMode({
  recTime,
  onCancel,
  onDone,
}: VoiceRecorderModeProps) {
  const minutes = Math.floor(recTime / 60);
  const seconds = recTime % 60;

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      className="p-5 rounded-[18px] mb-6"
      style={{
        backgroundColor: "rgba(200,255,0,0.04)",
        borderWidth: 1,
        borderColor: "rgba(200,255,0,0.27)",
      }}
    >
      {/* Listening label */}
      <View className="items-center mb-[14px]">
        <Text
          className="text-[12px] font-coach-semibold"
          style={{ color: LIGHT_THEME.wText, letterSpacing: 0.04 * 12 }}
        >
          Listening...
        </Text>
      </View>

      {/* Waveform */}
      <View className="flex-row items-center justify-center gap-[2px] h-10 mb-[14px]">
        {Array.from({ length: 24 }, (_, i) => (
          <WaveformBar key={i} index={i} />
        ))}
      </View>

      {/* Timer */}
      <View className="items-center mb-[14px]">
        <Text className="text-[20px] font-coach-semibold text-wText">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>
      </View>

      {/* Buttons */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onCancel}
          className="flex-1 py-3 rounded-xl items-center"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderWidth: 1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text className="text-[14px] font-coach text-wSub">Cancel</Text>
        </Pressable>

        <Pressable
          onPress={onDone}
          className="flex-1 py-3 rounded-xl items-center"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Text
            className="text-[14px] font-coach-semibold"
            style={{ color: LIGHT_THEME.w1 }}
          >
            Done
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
