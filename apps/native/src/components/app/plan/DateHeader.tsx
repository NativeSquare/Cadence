/**
 * DateHeader - Header showing date, greeting, and week indicator
 * Reference: cadence-full-v9.jsx TodayTab header (lines 144-156)
 *
 * Two variants:
 * - full: Complete header with date, greeting, and week badge
 * - collapsed: Condensed header for sticky bar when scrolled
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { formatDate, formatShortDate, getGreeting } from "./utils";

interface DateHeaderProps {
  /** Display variant */
  variant: "full" | "collapsed";
  /** User's name for greeting */
  userName: string;
  /** Current week number */
  weekNumber: number;
}

/**
 * Pulsing dot indicator for the week badge
 * Reference: prototype line 152
 */
function PulsingDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
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
      className="w-1.5 h-1.5 rounded-full bg-lime"
    />
  );
}

/**
 * Full DateHeader variant
 * Shows date, personalized greeting, and week indicator badge
 */
function FullDateHeader({ userName, weekNumber }: Omit<DateHeaderProps, "variant">) {
  const greeting = getGreeting();
  const dateStr = formatDate();

  return (
    <View className="flex-row items-center justify-between">
      {/* Left side: Date and greeting */}
      <View>
        <Text className="text-sm font-coach text-g4">{dateStr}</Text>
        <Text
          className="text-[28px] font-coach-bold text-g1 mt-0.5"
          style={{ letterSpacing: -0.03 * 28, lineHeight: 31 }}
        >
          {greeting},{" "}
          <Text className="text-[28px] font-coach-bold text-lime">{userName}</Text>
        </Text>
      </View>

      {/* Right side: Week badge */}
      <View className="flex-row gap-2">
        <View className="px-3 py-1.5 rounded-full bg-card-surface border border-brd flex-row items-center gap-1.5">
          <PulsingDot />
          <Text className="text-xs font-coach-semibold text-g2">W{weekNumber}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Collapsed DateHeader variant
 * Condensed header shown in sticky bar when scrolled
 * Reference: prototype lines 130-141
 */
function CollapsedDateHeader({ userName, weekNumber }: Omit<DateHeaderProps, "variant">) {
  const shortDate = formatShortDate();

  return (
    <View className="flex-row items-center justify-between">
      {/* Left side: Today label and date */}
      <View className="flex-row items-center gap-2.5">
        <Text className="text-[17px] font-coach-bold text-g1">Today</Text>
        <Text className="text-[13px] font-coach text-g4">{shortDate}</Text>
      </View>

      {/* Right side: Week indicator */}
      <View className="flex-row items-center gap-1.5">
        <View className="w-1.5 h-1.5 rounded-full bg-lime" />
        <Text className="text-xs font-coach-semibold text-g3">Week {weekNumber}</Text>
      </View>
    </View>
  );
}

/**
 * DateHeader component
 * Renders either full or collapsed variant based on props
 */
export function DateHeader({ variant, userName, weekNumber }: DateHeaderProps) {
  if (variant === "collapsed") {
    return <CollapsedDateHeader userName={userName} weekNumber={weekNumber} />;
  }
  return <FullDateHeader userName={userName} weekNumber={weekNumber} />;
}
