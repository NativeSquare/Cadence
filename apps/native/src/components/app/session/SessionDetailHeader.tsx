/**
 * SessionDetailHeader - Hero header with zone badge and session info
 * Reference: cadence-full-v10.jsx lines 274-291
 *
 * Features:
 * - Back button with chevron
 * - Zone badge with dynamic color
 * - "Today" indicator with pulse animation
 * - "Completed" indicator with checkmark
 * - Session type title (34px, -0.04em letter-spacing)
 * - Subtitle with date, duration, distance
 */

import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import { ChevronLeft, Check } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { GRAYS, COLORS, FONT_WEIGHTS } from "@/lib/design-tokens";
import type { SessionDetailData } from "./types";
import { DAYS, DATES } from "../plan/types";
import { useEffect } from "react";

export interface SessionDetailHeaderProps {
  /** Session data */
  session: SessionDetailData;
  /** Day index (0-6) */
  dayIdx: number;
  /** Computed session color */
  sessionColor: string;
  /** Back button callback */
  onBack: () => void;
}

/**
 * Animated pulse dot for "Today" indicator
 * Animation: scale 1→1.3→1, opacity 0.6→1→0.6 (2s ease infinite)
 */
function PulseDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.ease }),
        withTiming(0.6, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: COLORS.lime,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Zone badge with colored background
 */
function ZoneBadge({
  zone,
  color,
  size = "default",
}: {
  zone: string;
  color: string;
  size?: "default" | "small";
}) {
  const isSmall = size === "small";

  return (
    <View
      style={{
        paddingVertical: isSmall ? 4 : 5,
        paddingHorizontal: isSmall ? 10 : 12,
        borderRadius: isSmall ? 8 : 10,
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}33`,
      }}
    >
      <Text
        style={{
          fontSize: isSmall ? 11 : 12,
          fontFamily: FONT_WEIGHTS.bold,
          color: color,
        }}
      >
        {zone}
      </Text>
    </View>
  );
}

export function SessionDetailHeader({
  session,
  dayIdx,
  sessionColor,
  onBack,
}: SessionDetailHeaderProps) {
  const isRest = session.intensity === "rest";

  return (
    <View>
      {/* Back button */}
      <Pressable
        onPress={onBack}
        className="flex-row items-center gap-1.5 mb-5 -ml-0.5"
        hitSlop={8}
      >
        <ChevronLeft size={18} color={GRAYS.g3} strokeWidth={2} />
        <Text className="text-sm font-coach-medium text-g3">Back</Text>
      </Pressable>

      {/* Zone badge and indicators row */}
      <View className="flex-row items-center gap-2.5 mb-2">
        <ZoneBadge zone={session.zone} color={sessionColor} />

        {/* Today indicator */}
        {session.today && (
          <View className="flex-row items-center gap-1.5">
            <PulseDot />
            <Text className="text-xs font-coach-medium text-g3">Today</Text>
          </View>
        )}

        {/* Completed indicator */}
        {session.done && (
          <View className="flex-row items-center gap-1.5">
            <Check size={14} color={COLORS.lime} strokeWidth={2} />
            <Text
              className="text-xs font-coach-medium"
              style={{ color: COLORS.lime }}
            >
              Completed
            </Text>
          </View>
        )}
      </View>

      {/* Session type title */}
      <Text
        className="text-g1 font-coach-extrabold"
        style={{
          fontSize: 34,
          letterSpacing: -0.04 * 34,
          lineHeight: 34 * 1.1,
        }}
      >
        {session.type}
      </Text>

      {/* Subtitle: date, duration, distance */}
      <Text className="text-sm text-g3 mt-2">
        {DAYS[dayIdx]}, Feb {DATES[dayIdx]}
        {!isRest && ` · ${session.dur} · ${session.km} km`}
      </Text>
    </View>
  );
}

export { ZoneBadge };
