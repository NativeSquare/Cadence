/**
 * DebriefSummary - Logged indicator with selected feeling, pills, and note
 * Reference: cadence-full-v10.jsx session recorded summary (lines 823-834)
 *
 * Features:
 * - "Logged" indicator with checkmark
 * - Selected feeling badge
 * - Selected pills as small tags
 * - Note indicator if note was added
 * - "Done" button with springUp animation
 */

import { View, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { FEELING_OPTIONS, type FeelingValue } from "./FeelingSelector";

export interface DebriefSummaryProps {
  feeling: FeelingValue | null;
  selectedPills: string[];
  hasNote: boolean;
  onDone: () => void;
}

export function DebriefSummary({
  feeling,
  selectedPills,
  hasNote,
  onDone,
}: DebriefSummaryProps) {
  const feelingOption = feeling
    ? FEELING_OPTIONS.find((f) => f.value === feeling)
    : null;

  return (
    <Animated.View entering={FadeInUp.duration(400).springify()}>
      {/* Logged card */}
      <View
        className="p-4 px-[18px] rounded-2xl mb-4"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {/* Logged header */}
        <View className="flex-row items-center gap-2 mb-[10px]">
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <Path
              d="M3 8l3.5 3.5L13 4"
              stroke={ACTIVITY_COLORS.barHigh}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text
            className="text-[12px] font-coach-semibold"
            style={{ color: ACTIVITY_COLORS.barHigh }}
          >
            Logged
          </Text>
        </View>

        {/* Tags row */}
        <View className="flex-row flex-wrap gap-[6px]">
          {/* Feeling badge */}
          {feelingOption && (
            <View
              className="py-[6px] px-3 rounded-[10px]"
              style={{
                backgroundColor: "rgba(168,217,0,0.08)",
                borderWidth: 1,
                borderColor: "rgba(168,217,0,0.15)",
              }}
            >
              <Text className="text-[12px] font-coach-medium text-wText">
                {feelingOption.emoji} {feelingOption.label}
              </Text>
            </View>
          )}

          {/* Selected pills */}
          {selectedPills.map((pill, i) => (
            <View
              key={i}
              className="py-[6px] px-3 rounded-[10px]"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Text className="text-[12px] font-coach-medium text-wSub">
                {pill}
              </Text>
            </View>
          ))}

          {/* Note indicator */}
          {hasNote && (
            <View
              className="py-[6px] px-3 rounded-[10px]"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Text className="text-[12px] font-coach-medium text-wSub">
                💬 Note added
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Done button */}
      <Animated.View entering={FadeInUp.delay(200).duration(500).springify()}>
        <Pressable
          onPress={onDone}
          className="w-full py-[18px] px-6 rounded-2xl active:scale-[0.975]"
          style={{
            backgroundColor: LIGHT_THEME.wText,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text
            className="text-[16px] font-coach-bold"
            style={{ color: LIGHT_THEME.w1 }}
          >
            Done
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
