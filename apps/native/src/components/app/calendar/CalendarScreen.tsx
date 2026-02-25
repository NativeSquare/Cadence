/**
 * CalendarScreen - Main container for Calendar tab.
 * Manages month/year state, view toggle, and dark header.
 * Reference: cadence-calendar-final.jsx lines 366-805
 */

import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { COLORS, GRAYS, LIGHT_THEME } from "@/lib/design-tokens";
import { CalendarFocusContext } from "./CalendarFocusContext";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { MONTH_NAMES, CAL_SESSIONS, TODAY_KEY } from "./constants";
import type { CalendarView } from "./types";

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "week", label: "Sem." },
  { key: "month", label: "Mois" },
];

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [view, setView] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState(1); // February (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState(TODAY_KEY);

  // Lazy-mount: WeekView only mounts once the user first switches to it
  const hasShownWeek = useRef(false);
  if (view === "week") hasShownWeek.current = true;

  const prevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  return (
    <CalendarFocusContext.Provider value={isFocused}>
    <View style={styles.root}>
      {/* Dark header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={prevMonth}
              style={styles.navButton}
              hitSlop={8}
            >
              <ChevronLeft
                size={14}
                color={GRAYS.g3}
                strokeWidth={1.8}
              />
            </Pressable>
            <Text style={styles.monthName}>
              {MONTH_NAMES[currentMonth]}
            </Text>
            <Text style={styles.yearText}>{currentYear}</Text>
            <Pressable
              onPress={nextMonth}
              style={styles.navButton}
              hitSlop={8}
            >
              <ChevronRight
                size={14}
                color={GRAYS.g3}
                strokeWidth={1.8}
              />
            </Pressable>
          </View>

          {/* View toggle */}
          <View style={styles.toggleContainer}>
            {VIEWS.map((v) => (
              <Pressable
                key={v.key}
                onPress={() => setView(v.key)}
                style={[
                  styles.toggleButton,
                  view === v.key && styles.toggleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    view === v.key && styles.toggleTextActive,
                  ]}
                >
                  {v.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Rounded corner transition */}
      <View style={styles.cornerTransition} />

      {/* Content — WeekView lazy-mounted on first toggle, then kept alive */}
      <View style={[styles.viewContainer, view !== "month" && styles.hidden]}>
        <MonthView
          year={currentYear}
          month={currentMonth}
          sessions={CAL_SESSIONS}
        />
      </View>
      {hasShownWeek.current && (
        <View style={[styles.viewContainer, view !== "week" && styles.hidden]}>
          <WeekView
            selectedDate={selectedDate}
            sessions={CAL_SESSIONS}
            todayKey={TODAY_KEY}
          />
        </View>
      )}
    </View>
    </CalendarFocusContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  // Header
  header: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  navButton: {
    padding: 4,
  },
  monthName: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: GRAYS.g1,
  },
  yearText: {
    fontSize: 17,
    fontWeight: "300",
    fontFamily: "Outfit-Light",
    color: GRAYS.g3,
    marginLeft: 2,
  },
  // Toggle
  toggleContainer: {
    flexDirection: "row",
    padding: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  toggleButton: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "400",
    fontFamily: "Outfit-Regular",
    color: GRAYS.g4,
  },
  toggleTextActive: {
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: GRAYS.g1,
  },
  // View containers
  viewContainer: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
  // Corner transition
  cornerTransition: {
    height: 28,
    backgroundColor: LIGHT_THEME.w2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
