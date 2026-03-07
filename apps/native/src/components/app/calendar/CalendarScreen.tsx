/**
 * CalendarScreen - Clean monthly calendar with session type indicators.
 *
 * Training days show a tinted circle + colored dot beneath the day number,
 * colored by session type (easy / specific / long / race).
 * Rest days appear plain so the contrast is immediately scannable.
 *
 * - Animated month navigation with haptic feedback
 * - Tap month name to return to today
 * - Tap a training day to view session details in a bottom sheet
 * - Legend card at the bottom for the four session type colors
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";

import {
  COLORS,
  GRAYS,
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
} from "@/lib/design-tokens";
import { CalendarSessionSheet } from "./CalendarSessionSheet";
import {
  MONTH_NAMES,
  DAY_HEADERS,
  CAL_SESSIONS,
  SESSION_LABELS,
  TODAY_KEY,
} from "./constants";
import { buildWeeks } from "./helpers";
import type { CalSession, CalSessionType } from "./types";

const CIRCLE_SIZE = 40;

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const todayDate = useMemo(() => new Date(TODAY_KEY + "T00:00:00"), []);

  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());

  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const [selectedSession, setSelectedSession] = useState<CalSession | null>(
    null,
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const contentFade = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);

  const weeks = useMemo(
    () => buildWeeks(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // ─── Month navigation ──────────────────────────────────────────────

  const updateMonth = useCallback((direction: "prev" | "next") => {
    if (direction === "next") {
      setCurrentMonth((m) => {
        if (m === 11) {
          setCurrentYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      });
    } else {
      setCurrentMonth((m) => {
        if (m === 0) {
          setCurrentYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      });
    }
  }, []);

  const animateMonthChange = useCallback(
    (direction: "prev" | "next") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const exit = direction === "next" ? -1 : 1;
      contentFade.value = withTiming(0, { duration: 100 });
      contentTranslateX.value = withTiming(
        exit * 40,
        { duration: 100 },
        () => {
          runOnJS(updateMonth)(direction);
          contentTranslateX.value = exit * -40;
          contentFade.value = withTiming(1, { duration: 200 });
          contentTranslateX.value = withSpring(0, {
            damping: 18,
            stiffness: 180,
          });
        },
      );
    },
    [contentFade, contentTranslateX, updateMonth],
  );

  const handleReturnToToday = useCallback(() => {
    if (
      currentMonth !== todayDate.getMonth() ||
      currentYear !== todayDate.getFullYear()
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      contentFade.value = withTiming(0, { duration: 100 }, () => {
        runOnJS(setCurrentMonth)(todayDate.getMonth());
        runOnJS(setCurrentYear)(todayDate.getFullYear());
        contentFade.value = withTiming(1, { duration: 250 });
      });
    }
  }, [currentMonth, currentYear, contentFade, todayDate]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentFade.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  // ─── Day press ────────────────────────────────────────────────────

  const handleDayPress = useCallback((dateKey: string) => {
    const sessions = CAL_SESSIONS[dateKey];
    if (sessions && sessions.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedSession(sessions[0]);
      setSelectedDateKey(dateKey);
      sheetRef.current?.present();
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────

  const isCurrentMonth =
    currentMonth === todayDate.getMonth() &&
    currentYear === todayDate.getFullYear();

  return (
    <View style={st.root}>
      {/* Dark header */}
      <View style={[st.header, { paddingTop: insets.top + 12 }]}>
        <View style={st.nav}>
          <Pressable
            onPress={() => animateMonthChange("prev")}
            hitSlop={16}
            style={st.navBtn}
          >
            <ChevronLeft size={20} color={GRAYS.g2} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={handleReturnToToday} hitSlop={8}>
            <View style={st.monthRow}>
              <Text style={st.monthText}>
                {MONTH_NAMES[currentMonth]}
              </Text>
              <Text style={st.yearText}>{currentYear}</Text>
              {!isCurrentMonth && <View style={st.returnDot} />}
            </View>
          </Pressable>
          <Pressable
            onPress={() => animateMonthChange("next")}
            hitSlop={16}
            style={st.navBtn}
          >
            <ChevronRight size={20} color={GRAYS.g2} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Rounded transition from dark header to light content */}
      <View style={st.cornerTransition} />

      {/* Calendar body */}
      <ScrollView
        style={st.body}
        contentContainerStyle={st.bodyContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={contentAnimStyle}>
          {/* Day-of-week headers */}
          <View style={st.dayHeaders}>
            {DAY_HEADERS.map((label) => (
              <View key={label} style={st.dayHeaderCell}>
                <Text style={st.dayHeaderText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <View key={`w-${wi}`} style={st.weekRow}>
              {week.map((day) => {
                const sessions = CAL_SESSIONS[day.key];
                const hasSession = sessions && sessions.length > 0;
                const type = hasSession ? sessions[0].type : null;
                const color = type ? SESSION_TYPE_COLORS[type] : null;
                const isToday = day.key === TODAY_KEY;

                return (
                  <Pressable
                    key={day.key}
                    style={st.cell}
                    onPress={() => !day.outside && handleDayPress(day.key)}
                  >
                    <View
                      style={[
                        st.circle,
                        isToday && st.circleToday,
                        hasSession &&
                          !isToday &&
                          !day.outside &&
                          color != null && {
                            backgroundColor: color + "26",
                          },
                      ]}
                    >
                      <Text
                        style={[
                          st.dayNum,
                          day.outside && st.dayNumOutside,
                          isToday && st.dayNumToday,
                          hasSession &&
                            !isToday &&
                            !day.outside &&
                            st.dayNumActive,
                        ]}
                      >
                        {day.day}
                      </Text>
                    </View>
                    {hasSession && !day.outside ? (
                      <View
                        style={[st.dot, { backgroundColor: color! }]}
                      />
                    ) : (
                      <View style={st.dotSpacer} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Session type legend */}
          <View style={st.legend}>
            <View style={st.legendCard}>
              {(
                Object.entries(SESSION_LABELS) as [CalSessionType, string][]
              ).map(([type, label]) => (
                <View key={type} style={st.legendItem}>
                  <View
                    style={[
                      st.legendDot,
                      { backgroundColor: SESSION_TYPE_COLORS[type] },
                    ]}
                  />
                  <Text style={st.legendLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Session detail sheet */}
      <CalendarSessionSheet
        sheetRef={sheetRef}
        session={selectedSession}
        dateKey={selectedDateKey}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  header: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    padding: 8,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  monthText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: GRAYS.g1,
  },
  yearText: {
    fontSize: 20,
    fontWeight: "300",
    fontFamily: "Outfit-Light",
    color: GRAYS.g3,
  },
  returnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
    position: "absolute",
    top: -2,
    right: -10,
  },

  cornerTransition: {
    height: 24,
    backgroundColor: LIGHT_THEME.w2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  body: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
  },
  bodyContent: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },

  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    fontWeight: "500",
    color: LIGHT_THEME.wMute,
  },

  weekRow: {
    flexDirection: "row",
  },

  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
    minHeight: 54,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleToday: {
    backgroundColor: LIGHT_THEME.wText,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },
  dotSpacer: {
    width: 6,
    height: 6,
    marginTop: 3,
  },

  dayNum: {
    fontSize: 15,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: LIGHT_THEME.wSub,
  },
  dayNumOutside: {
    opacity: 0.25,
  },
  dayNumToday: {
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dayNumActive: {
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: LIGHT_THEME.wText,
  },

  legend: {
    marginTop: 24,
  },
  legendCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: LIGHT_THEME.w1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LIGHT_THEME.wBrd,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%" as unknown as number,
    paddingVertical: 8,
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: LIGHT_THEME.wSub,
  },
});
