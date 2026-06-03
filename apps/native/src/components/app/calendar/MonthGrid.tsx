import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import type { BlockDoc, WorkoutDoc } from "@nativesquare/agoge/schema";

import { cn } from "@/lib/utils";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { BLOCK_TYPE_COLORS, WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import { buildWeeks, blendWithBg } from "./helpers";

/**
 * Horizontal gap between day tiles. Exported because the parent's outer
 * padding and tile-size math must agree with what MonthGrid renders.
 */
export const GRID_GAP = 6;

/**
 * When set, the grid is in swap-selection mode: the source workout's day is
 * filled solid, eligible counterpart days keep a ring + stay tappable, and
 * every other day dims and stops responding to taps.
 */
export interface SwapMode {
  sourceKey: string;
  eligibleKeys: Set<string>;
  onTargetPress: (dateKey: string) => void;
}

interface MonthGridProps {
  year: number;
  month: number;
  tileSize: number;
  workoutsByDate: Record<string, WorkoutDoc[]>;
  blockLookup: Map<string, BlockDoc>;
  todayKey: string;
  onDayPress: (dateKey: string) => void;
  swapMode?: SwapMode | null;
}

export const MonthGrid = React.memo(function MonthGrid({
  year,
  month,
  tileSize,
  workoutsByDate,
  blockLookup,
  todayKey,
  onDayPress,
  swapMode,
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
            const dayWorkouts = workoutsByDate[day.key];
            const hasWorkout = dayWorkouts && dayWorkouts.length > 0;
            const isToday = day.key === todayKey;
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
              block && blockColor
                ? {
                    backgroundColor: blendWithBg(blockColor, 0.1),
                    borderWidth: 1,
                    borderColor: blendWithBg(blockColor, 0.16),
                  }
                : undefined;
            const baseTileStyle =
              blockTint ?? {
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              };
            // Today always wears the black ring, overlaid on top of any
            // block tint background so it remains visible regardless of mode.
            // Swap mode owns the visuals while active, so the today ring steps
            // aside to keep source/eligible/dimmed treatments unambiguous.
            const todayStyle =
              isToday && !swapMode
                ? { borderWidth: 2, borderColor: LIGHT_THEME.wText }
                : undefined;
            const isActive = !isToday && hasWorkout;

            // ─── Swap-mode classification for this day ──────────────────
            const isSwapSource = swapMode?.sourceKey === day.key;
            const isSwapEligible = swapMode?.eligibleKeys.has(day.key) ?? false;
            const isSwapDimmed = !!swapMode && !isSwapSource && !isSwapEligible;
            const swapSourceStyle = isSwapSource
              ? {
                  backgroundColor: LIGHT_THEME.wText,
                  borderWidth: 2,
                  borderColor: LIGHT_THEME.wText,
                }
              : undefined;
            const swapEligibleStyle = isSwapEligible
              ? { borderWidth: 2, borderColor: LIGHT_THEME.wText }
              : undefined;
            const swapDimStyle = isSwapDimmed ? { opacity: 0.3 } : undefined;

            const pressDisabled = swapMode
              ? !isSwapEligible
              : false;
            const handlePress = () => {
              if (swapMode) {
                if (isSwapEligible) swapMode.onTargetPress(day.key);
                return;
              }
              onDayPress(day.key);
            };

            return (
              <View key={day.key} className="items-center">
                <Pressable onPress={handlePress} disabled={pressDisabled}>
                  <View
                    className="rounded-[14px] items-center justify-center overflow-hidden"
                    style={[
                      tileSizeStyle,
                      baseTileStyle,
                      todayStyle,
                      swapEligibleStyle,
                      swapSourceStyle,
                      swapDimStyle,
                    ]}
                  >
                    <Text
                      className={cn(
                        "text-base font-coach text-wMute",
                        isToday && "font-coach-bold text-wText",
                        isActive && "font-coach-semibold text-wText",
                      )}
                      style={isSwapSource ? { color: "#FFFFFF" } : undefined}
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
                              backgroundColor: WORKOUT_TYPES_COLORS[w.type],
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
