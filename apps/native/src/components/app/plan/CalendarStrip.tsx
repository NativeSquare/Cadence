/**
 * CalendarStrip - 7-day horizontal calendar with activity indicators
 * Reference: cadence-full-v9.jsx TodayTab calendar section (lines 160-184)
 *
 * Features:
 * - 7-day horizontal grid layout
 * - Day labels (Mon-Sun) and date numbers
 * - Activity dots colored by session type
 * - Selected state: 2px black border, white background
 * - Today state: 2px lime border, bold date text
 * - onDaySelect callback
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { DAYS, DATES, TODAY_INDEX, type SessionData } from "./types";
import { getSessionColor } from "./utils";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";

interface CalendarStripProps {
  /** Sessions for the week (7 items) */
  sessions: SessionData[];
  /** Currently selected day index (0-6) */
  selectedDay: number;
  /** Callback when a day is tapped */
  onDaySelect: (dayIndex: number) => void;
  /** Current week number */
  weekNumber: number;
  /** Current training phase */
  phase: string;
}

interface DayButtonProps {
  dayLabel: string;
  dateNum: number;
  session: SessionData;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Individual day button in the calendar strip
 * Reference: prototype lines 173-182
 */
function DayButton({
  dayLabel,
  dateNum,
  session,
  isToday,
  isSelected,
  onPress,
}: DayButtonProps) {
  // Get dot color based on session
  const dotColor = getSessionColor(session);
  const dotOpacity = session.done ? 1 : 0.4;

  // Determine border style
  const getBorderStyle = () => {
    if (isSelected) {
      return { borderWidth: 2, borderColor: LIGHT_THEME.wText };
    }
    if (isToday) {
      return { borderWidth: 2, borderColor: COLORS.lime };
    }
    return { borderWidth: 2, borderColor: "transparent" };
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 2,
          borderRadius: 14,
          alignItems: "center",
          gap: 3,
          backgroundColor: isSelected ? LIGHT_THEME.w1 : "transparent",
        },
        getBorderStyle(),
      ]}
    >
      {/* Day label */}
      <Text
        className="text-[11px] font-coach-medium"
        style={{ color: isSelected ? LIGHT_THEME.wText : LIGHT_THEME.wMute }}
      >
        {dayLabel}
      </Text>

      {/* Date number - use different font family based on isToday */}
      <Text
        className={`text-xl ${isToday ? "font-coach-bold" : "font-coach-medium"}`}
        style={{
          color: isToday || isSelected ? LIGHT_THEME.wText : LIGHT_THEME.wSub,
          lineHeight: 24,
        }}
      >
        {dateNum}
      </Text>

      {/* Activity dot */}
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: dotColor,
          opacity: dotOpacity,
          marginTop: 2,
        }}
      />
    </Pressable>
  );
}

/**
 * CalendarStrip component
 * Shows the week header and 7-day grid
 */
export function CalendarStrip({
  sessions,
  selectedDay,
  onDaySelect,
  weekNumber,
  phase,
}: CalendarStripProps) {
  return (
    <View>
      {/* Month header row */}
      <View className="flex-row items-center justify-between px-1 mb-3.5">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-xl font-coach-bold text-wText">February</Text>
          <Text className="text-xl font-coach-light text-wMute">2026</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-coach-medium text-wMute">
            Week {weekNumber} of 10
          </Text>
          <Text
            className="text-xs font-coach-semibold"
            style={{ color: ACTIVITY_COLORS.barHigh }}
          >
            {phase}
          </Text>
        </View>
      </View>

      {/* 7-day grid */}
      <View className="flex-row gap-1">
        {DAYS.map((day, index) => (
          <DayButton
            key={day}
            dayLabel={day}
            dateNum={DATES[index]}
            session={sessions[index]}
            isToday={index === TODAY_INDEX}
            isSelected={index === selectedDay}
            onPress={() => onDaySelect(index)}
          />
        ))}
      </View>
    </View>
  );
}
