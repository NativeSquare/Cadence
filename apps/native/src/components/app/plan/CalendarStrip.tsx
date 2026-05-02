import { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Pressable,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from "react-native";
import { Text } from "@/components/ui/text";
import type { WorkoutData } from "./types";
import { getSessionColor } from "./utils";
import { LIGHT_THEME } from "@/lib/design-tokens";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKS_BUFFER = 12;
const INITIAL_INDEX = WEEKS_BUFFER;

interface CalendarStripProps {
  sessionsByDate: Record<string, WorkoutData>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface WeekData {
  key: string;
  days: DayInfo[];
}

interface DayInfo {
  date: Date;
  dayLabel: string;
  dateNum: number;
}

interface DayButtonProps {
  dayLabel: string;
  dateNum: number;
  session: WorkoutData | undefined;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function generateWeeks(): WeekData[] {
  const today = new Date();
  const currentMonday = getMonday(today);
  const weeks: WeekData[] = [];

  for (let w = -WEEKS_BUFFER; w <= WEEKS_BUFFER; w++) {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() + w * 7);

    const days: DayInfo[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + d);
      days.push({
        date,
        dayLabel: DAY_LABELS[d],
        dateNum: date.getDate(),
      });
    }

    weeks.push({ key: monday.toISOString(), days });
  }

  return weeks;
}

function DayButton({
  dayLabel,
  dateNum,
  session,
  isToday,
  isSelected,
  onPress,
}: DayButtonProps) {
  const dotColor =
    session && session.type !== "Rest" ? getSessionColor(session) : "transparent";

  const getBorderStyle = () => {
    if (isSelected) return { borderWidth: 2, borderColor: LIGHT_THEME.wText };
    return { borderWidth: 2, borderColor: "transparent" };
  };

  const getTodayBackground = () => {
    if (isToday && !isSelected) {
      return { backgroundColor: LIGHT_THEME.w3 };
    }
    return {};
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
        getTodayBackground(),
      ]}
    >
      <Text
        className="text-[11px] font-coach-medium"
        style={{ color: isSelected ? LIGHT_THEME.wText : LIGHT_THEME.wMute }}
      >
        {dayLabel}
      </Text>

      <Text
        className={`text-xl ${isToday ? "font-coach-bold" : "font-coach-medium"}`}
        style={{
          color: isToday || isSelected ? LIGHT_THEME.wText : LIGHT_THEME.wSub,
          lineHeight: 24,
        }}
      >
        {dateNum}
      </Text>

      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: dotColor,
          marginTop: 2,
        }}
      />
    </Pressable>
  );
}

export function CalendarStrip({
  sessionsByDate,
  selectedDate,
  onDateSelect,
}: CalendarStripProps) {
  const today = useMemo(() => new Date(), []);
  const weeks = useMemo(generateWeeks, []);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const didInitialScroll = useRef(false);

  const [displayMonth, setDisplayMonth] = useState(() => ({
    month: today.getMonth(),
    year: today.getFullYear(),
  }));

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerWidth === 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
      const week = weeks[index];
      if (!week) return;
      const ref = week.days[3].date;
      setDisplayMonth((prev) => {
        if (
          prev.month !== ref.getMonth() ||
          prev.year !== ref.getFullYear()
        ) {
          return { month: ref.getMonth(), year: ref.getFullYear() };
        }
        return prev;
      });
    },
    [containerWidth, weeks]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const handleScrollViewLayout = useCallback(() => {
    if (didInitialScroll.current || containerWidth === 0) return;
    didInitialScroll.current = true;
    scrollRef.current?.scrollTo({
      x: INITIAL_INDEX * containerWidth,
      animated: false,
    });
  }, [containerWidth]);

  return (
    <View>
      <View className="flex-row items-baseline gap-2 px-1 mb-1">
        <Text className="text-xl font-coach-bold text-wText">
          {MONTH_NAMES[displayMonth.month]}
        </Text>
        <Text className="text-xl font-coach-light text-wMute">
          {displayMonth.year}
        </Text>
      </View>

      <View onLayout={handleLayout}>
        {containerWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={handleScrollViewLayout}
            onMomentumScrollEnd={handleMomentumEnd}
          >
            {weeks.map((week) => (
              <View
                key={week.key}
                style={{ width: containerWidth, flexDirection: "row", gap: 4 }}
              >
                {week.days.map((day) => (
                  <DayButton
                    key={day.date.toISOString()}
                    dayLabel={day.dayLabel}
                    dateNum={day.dateNum}
                    session={sessionsByDate[toDateKey(day.date)]}
                    isToday={isSameDay(day.date, today)}
                    isSelected={isSameDay(day.date, selectedDate)}
                    onPress={() => onDateSelect(day.date)}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
