import { View, Pressable, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  type SharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";
import { X, ArrowUp } from "lucide-react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";

import type { VoiceRecorderProps } from "./types";

const BAR_COUNT = 24;
const POLL_MS = 250;
const MIN_DB = -60;
const MAX_DB = 0;
const MIN_BAR_HEIGHT = 4;
const MAX_BAR_HEIGHT = 24;

function normalizeMetering(db: number): number {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  const ratio = (clamped - MIN_DB) / (MAX_DB - MIN_DB);
  return MIN_BAR_HEIGHT + ratio * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
}

// Bar count is a module constant, so the hook call order is stable.
function useWaveformBars(): SharedValue<number>[] {
  return Array.from(
    { length: BAR_COUNT },
    // eslint-disable-next-line react-hooks/rules-of-hooks
    () => useSharedValue(MIN_BAR_HEIGHT),
  );
}

function WaveformBar({ heightSV }: { heightSV: SharedValue<number> }) {
  const animStyle = useAnimatedStyle(() => ({
    height: heightSV.value,
  }));
  return (
    <View className="flex-1 items-center justify-center">
      <Animated.View
        style={animStyle}
        className="w-full max-w-[3px] rounded-full bg-wMute opacity-70"
      />
    </View>
  );
}

function Waveform({
  getMetering,
  isActive,
}: {
  getMetering: () => number | null;
  isActive: boolean;
}) {
  const bars = useWaveformBars();

  useEffect(() => {
    if (!isActive) return;
    const timing = { duration: POLL_MS, easing: Easing.linear };
    const interval = setInterval(() => {
      const db = getMetering() ?? MIN_DB;
      const next = normalizeMetering(db);
      // FIFO shift left, append newest sample on the right.
      for (let i = 0; i < BAR_COUNT - 1; i++) {
        bars[i].value = withTiming(bars[i + 1].value, timing);
      }
      bars[BAR_COUNT - 1].value = withTiming(next, timing);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [isActive, getMetering, bars]);

  return (
    <View className="flex-1 flex-row items-center gap-0.5 h-9 px-2">
      {bars.map((bar, i) => (
        <WaveformBar key={i} heightSV={bar} />
      ))}
    </View>
  );
}

export function VoiceRecorder({
  onCancel,
  onSend,
  isBusy = false,
  getMetering,
  isMeteringActive,
}: VoiceRecorderProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="flex-row items-end gap-2 px-4 pt-1.5 pb-2"
    >
      <Pressable
        onPress={onCancel}
        className="w-11 h-11 rounded-full bg-w1 items-center justify-center mb-[1px] active:opacity-60"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <X size={20} color={LIGHT_THEME.wSub} strokeWidth={2} />
      </Pressable>

      <View
        className="flex-1 flex-row items-center rounded-[24px] bg-w1 pl-2 pr-1.5 py-1.5"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Waveform getMetering={getMetering} isActive={isMeteringActive} />

        <Pressable
          onPress={onSend}
          disabled={isBusy}
          className="w-9 h-9 rounded-full bg-wText items-center justify-center mb-[1px]"
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#C8FF00" />
          ) : (
            <ArrowUp size={18} color="#C8FF00" strokeWidth={2.5} />
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}
