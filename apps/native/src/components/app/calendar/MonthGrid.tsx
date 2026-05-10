import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { BlockDoc, WorkoutDoc } from "@nativesquare/agoge/schema";

import { LIGHT_THEME } from "@/lib/design-tokens";
import { BLOCK_TYPE_COLORS, WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import { getCadenceWorkoutType } from "@packages/shared/utils";
import { buildWeeks, blendWithBg } from "./helpers";

/**
 * Horizontal gap between day tiles. Exported because the parent's outer
 * padding and tile-size math must agree with what MonthGrid renders.
 */
export const GRID_GAP = 6;

interface MonthGridProps {
  year: number;
  month: number;
  tileSize: number;
  workoutsByDate: Record<string, WorkoutDoc[]>;
  blockLookup: Map<string, BlockDoc>;
  todayKey: string;
  isBlocksMode: boolean;
  selectedDate: string;
  onDayPress: (dateKey: string) => void;
}

export const MonthGrid = React.memo(function MonthGrid({
  year,
  month,
  tileSize,
  workoutsByDate,
  blockLookup,
  todayKey,
  isBlocksMode,
  selectedDate,
  onDayPress,
}: MonthGridProps) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  return (
    <View>
      {weeks.map((week, wi) => (
        <View key={`w-${wi}`} style={st.weekRow}>
          {week.map((day) => {
            const dayWorkouts = workoutsByDate[day.key]?.filter(
              (w) => w.status !== "skipped",
            );
            const hasWorkout = dayWorkouts && dayWorkouts.length > 0;
            const isToday = day.key === todayKey;
            const isSelected = day.key === selectedDate;
            const block = blockLookup.get(day.key);
            const blockColor = block ? BLOCK_TYPE_COLORS[block.type] : undefined;
            const tileStyle = { width: tileSize, height: tileSize };

            // Days outside the current month section render dimmed + non-pressable
            // so the user only ever taps the canonical month they belong to.
            if (day.outside) {
              return (
                <View key={day.key} style={st.cellWrapper}>
                  <View style={[st.tile, tileStyle]}>
                    <Text style={[st.dayNum, st.dayNumOutside]}>{day.day}</Text>
                  </View>
                </View>
              );
            }

            const blockTileBg =
              isBlocksMode && blockColor
                ? {
                    backgroundColor: blendWithBg(blockColor, 0.18),
                    borderWidth: 1,
                    borderColor: blendWithBg(blockColor, 0.25),
                  }
                : undefined;

            const baseTileBg = isBlocksMode && block ? blockTileBg : st.tileWhite;
            // Gray today-marker only applies when no block tint is active,
            // so block coloring still wins in blocks mode.
            const isTodayMarker = isToday && !isSelected && !(isBlocksMode && block);

            return (
              <View key={day.key} style={st.cellWrapper}>
                <Pressable onPress={() => onDayPress(day.key)}>
                  <View
                    style={[
                      st.tile,
                      tileStyle,
                      baseTileBg,
                      isTodayMarker && st.tileToday,
                      isSelected && st.tileSelected,
                    ]}
                  >
                    <Text
                      style={[
                        st.dayNum,
                        isSelected && st.dayNumSelected,
                        !isSelected && isToday && st.dayNumToday,
                        !isSelected &&
                          !isToday &&
                          ((isBlocksMode && block) ||
                            (!isBlocksMode && hasWorkout)) &&
                          st.dayNumActive,
                      ]}
                    >
                      {day.day}
                    </Text>

                    {isBlocksMode ? (
                      block && day.key === block.startDate ? (
                        <View style={st.dotsRow}>
                          <View
                            style={[
                              st.workoutDot,
                              { backgroundColor: blockColor },
                            ]}
                          />
                        </View>
                      ) : (
                        <View style={st.dotsSpacer} />
                      )
                    ) : hasWorkout ? (
                      <View style={st.dotsRow}>
                        {dayWorkouts!.map((w, di) => (
                          <View
                            key={di}
                            style={[
                              st.workoutDot,
                              {
                                backgroundColor:
                                  WORKOUT_TYPES_COLORS[
                                    getCadenceWorkoutType(w.type)
                                  ],
                              },
                              w.status === "completed" && st.workoutDotDone,
                            ]}
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={st.dotsSpacer} />
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
});

const st = StyleSheet.create({
  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  cellWrapper: {
    alignItems: "center",
  },
  tile: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tileWhite: {
    backgroundColor: LIGHT_THEME.w1,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
  },
  tileToday: {
    backgroundColor: LIGHT_THEME.w3,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: LIGHT_THEME.wText,
  },

  dayNum: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: LIGHT_THEME.wMute,
  },
  dayNumOutside: {
    opacity: 0.2,
  },
  dayNumToday: {
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: LIGHT_THEME.wText,
  },
  dayNumSelected: {
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: LIGHT_THEME.wText,
  },
  dayNumActive: {
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: LIGHT_THEME.wText,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  workoutDotDone: {
    opacity: 0.45,
  },
  dotsSpacer: {
    height: 10,
  },
});
