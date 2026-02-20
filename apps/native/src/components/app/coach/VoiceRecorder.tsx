/**
 * VoiceRecorder - Voice recording mode with waveform and transcription
 * Reference: cadence-full-v9.jsx CoachTab recording mode (lines 356-392)
 *
 * Layout from prototype:
 * - Live transcription card: rounded-14, bg:T.w1, border:"1px solid "+T.wBrd
 * - Recording indicator: 5px dot, bg:T.red, animation:"pulseGlow 1s ease infinite"
 * - Label: fontSize:10, fontWeight:600, color:T.wMute
 * - Transcript text: fontSize:14, color:T.wText, lineHeight:1.5
 *
 * Recording bar:
 * - Cancel button: 42x42, rounded-14, bg:T.w1, border:"1px solid "+T.wBrd
 * - Waveform: 20 animated bars, bg:T.red, animation:"waveform"
 * - Send button: 42x42, rounded-14, bg:T.wText
 *
 * Waveform animation from prototype:
 * @keyframes waveform {
 *   0%, 100% { transform: scaleY(0.3); }
 *   50% { transform: scaleY(1); }
 * }
 *
 * Source: Story 10.3 - AC#4, AC#5, Task 7
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useEffect } from "react";
import { X, Send } from "lucide-react-native";
import { LIGHT_THEME, COLORS } from "@/lib/design-tokens";

import type { VoiceRecorderProps } from "./types";

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Pulsing recording indicator dot
 * Reference: prototype line 360
 */
function RecordingDot() {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="w-[5px] h-[5px] rounded-full bg-red" />
  );
}

/**
 * Blinking cursor for live transcription
 * Reference: prototype Blink component (line 53)
 */
function BlinkingCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0, { duration: 400 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-0.5 h-4 bg-wText ml-0.5"
    />
  );
}

/**
 * Single waveform bar with animation
 * Reference: prototype waveform animation (lines 384-385)
 */
function WaveformBar({ index }: { index: number }) {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    // Random duration between 0.4s and 0.8s for natural look
    const duration = 400 + Math.random() * 400;
    // Staggered delay based on index
    const delay = index * 40;

    scaleY.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [index, scaleY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, { minHeight: 4 }]}
      className="w-[3px] rounded-sm bg-red opacity-70"
    />
  );
}

/**
 * Waveform visualization with 20 bars
 * Reference: prototype line 385
 */
function Waveform() {
  return (
    <View className="flex-1 flex-row items-center justify-center gap-0.5 h-[42px] px-2">
      {Array.from({ length: 20 }).map((_, i) => (
        <WaveformBar key={i} index={i} />
      ))}
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * VoiceRecorder component
 *
 * Renders the voice recording interface with:
 * - Live transcription preview with blinking cursor
 * - Cancel button
 * - Waveform visualization
 * - Send button
 */
export function VoiceRecorder({ transcript, onCancel, onSend }: VoiceRecorderProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="px-4"
    >
      {/* Live transcription card */}
      {transcript ? (
        <View className="p-4 mb-1.5 mt-2.5 rounded-[14px] bg-w1 border border-wBrd">
          {/* Recording indicator */}
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <RecordingDot />
            <Text className="text-[10px] font-coach-semibold text-wMute">
              Live transcription
            </Text>
          </View>

          {/* Transcript text with cursor */}
          <View className="flex-row items-center flex-wrap">
            <Text
              className="text-[14px] font-coach text-wText"
              style={{ lineHeight: 14 * 1.5 }}
            >
              {transcript}
            </Text>
            <BlinkingCursor />
          </View>
        </View>
      ) : null}

      {/* Recording controls */}
      <View className="flex-row gap-2 items-center py-2.5">
        {/* Cancel button */}
        <Pressable
          onPress={onCancel}
          className="w-[42px] h-[42px] rounded-[14px] bg-w1 border border-wBrd items-center justify-center active:opacity-70"
        >
          <X size={14} color={LIGHT_THEME.wMute} strokeWidth={1.8} />
        </Pressable>

        {/* Waveform container */}
        <View
          className="flex-1 h-[42px] rounded-[14px] items-center justify-center"
          style={{
            backgroundColor: "rgba(255,90,90,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,90,90,0.12)",
          }}
        >
          <Waveform />
        </View>

        {/* Send button */}
        <Pressable
          onPress={() => onSend(transcript)}
          className="w-[42px] h-[42px] rounded-[14px] bg-wText items-center justify-center active:opacity-80"
        >
          <Send size={16} color={COLORS.lime} strokeWidth={2} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
