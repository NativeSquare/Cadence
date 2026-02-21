/**
 * DateHeader - Header showing date, greeting, and notification bell
 * Reference: cadence-full-v9.jsx TodayTab header (lines 144-156)
 *
 * Two variants:
 * - full: Complete header with date, greeting, and notification bell
 * - collapsed: Condensed header for sticky bar when scrolled
 */

import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { formatDate, formatShortDate, getGreeting } from "./utils";

interface DateHeaderProps {
  /** Display variant */
  variant: "full" | "collapsed";
  /** User's name for greeting */
  userName: string;
  /** Current week number */
  weekNumber: number;
  /** Callback when notification bell is pressed */
  onNotificationPress?: () => void;
}

/**
 * Full DateHeader variant
 * Shows date, personalized greeting, and notification bell
 */
function FullDateHeader({ userName, onNotificationPress }: Omit<DateHeaderProps, "variant" | "weekNumber">) {
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

      {/* Right side: Notification bell */}
      <Pressable
        onPress={onNotificationPress}
        className="p-2 -mr-2 active:opacity-70"
        hitSlop={8}
      >
        <Ionicons name="notifications-outline" size={24} color="#9CA3AF" />
      </Pressable>
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
export function DateHeader({ variant, userName, weekNumber, onNotificationPress }: DateHeaderProps) {
  if (variant === "collapsed") {
    return <CollapsedDateHeader userName={userName} weekNumber={weekNumber} />;
  }
  return <FullDateHeader userName={userName} onNotificationPress={onNotificationPress} />;
}
