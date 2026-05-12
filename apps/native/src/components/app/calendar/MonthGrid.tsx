import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import type { BlockDoc, WorkoutDoc } from "@nativesquare/agoge/schema";

import { cn } from "@/lib/utils";
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
        <View
          key={`w-${wi}`}
          className="flex-row justify-center"
          style={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
        >
          {week.map((day) => {
            const dayWorkouts = workoutsByDate[day.key]?.filter(
              (w) => w.status !== "skipped",
            );
            const hasWorkout = dayWorkouts && dayWorkouts.length > 0;
            const isToday = day.key === todayKey;
            const isSelected = day.key === selectedDate;
            const block = blockLookup.get(day.key);
            const blockColor = block ? BLOCK_TYPE_COLORS[block.type] : undefined;
            const tileSizeStyle = { width: tileSize, height: tileSize };

            // Days outside the current month section render dimmed + non-pressable
            // so the user only ever taps the canonical month they belong to.
            if (day.outside) {
              return (
                <View key={day.key} className="items-center">
                  <View
                    className="rounded-[14px] items-center justify-center overflow-hidden"
                    style={tileSizeStyle}
                  >
                    <Text className="text-base font-coach text-wMute opacity-20">
                      {day.day}
                    </Text>
                  </View>
                </View>
              );
            }

            const blockTint =
              isBlocksMode && block && blockColor
                ? {
                    backgroundColor: blendWithBg(blockColor, 0.18),
                    borderWidth: 1,
                    borderColor: blendWithBg(blockColor, 0.25),
                  }
                : undefined;
            const baseTileStyle =
              blockTint ?? {
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              };
            // Gray today-marker only applies when no block tint is active,
            // so block coloring still wins in blocks mode.
            const isTodayMarker = isToday && !isSelected && !blockTint;
            const todayStyle = isTodayMarker
              ? {
                  backgroundColor: LIGHT_THEME.w3,
                  borderWidth: 1,
                  borderColor: LIGHT_THEME.wBrd,
                }
              : undefined;
            const selectedStyle = isSelected
              ? { borderWidth: 2, borderColor: LIGHT_THEME.wText }
              : undefined;
            const isActive = !isSelected && !isToday && hasWorkout;

            return (
              <View key={day.key} className="items-center">
                <Pressable onPress={() => onDayPress(day.key)}>
                  <View
                    className="rounded-[14px] items-center justify-center overflow-hidden"
                    style={[
                      tileSizeStyle,
                      baseTileStyle,
                      todayStyle,
                      selectedStyle,
                    ]}
                  >
                    <Text
                      className={cn(
                        "text-base font-coach text-wMute",
                        isSelected && "font-coach-bold text-wText",
                        !isSelected && isToday && "font-coach-bold text-wText",
                        isActive && "font-coach-semibold text-wText",
                      )}
                    >
                      {day.day}
                    </Text>

                    {hasWorkout ? (
                      <View className="flex-row items-center mt-1 gap-[3px]">
                        {dayWorkouts!.map((w, di) => (
                          <View
                            key={di}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              w.status === "completed" && "opacity-[0.45]",
                            )}
                            style={{
                              backgroundColor:
                                WORKOUT_TYPES_COLORS[
                                  getCadenceWorkoutType(w.type)
                                ],
                            }}
                          />
                        ))}
                      </View>
                    ) : (
                      <View className="h-2.5" />
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
