/**
 * FeelingSelector - 5 vertically stacked feeling options
 * Reference: cadence-full-v10.jsx FEELING_OPTIONS (lines 638-644) and selection UI (lines 728-747)
 *
 * Features:
 * - 5 feeling options with emoji, label, description
 * - Selection state with checkmark animation (checkPop)
 * - Staggered springUp animation per option
 */

import { View, Pressable } from "react-native";
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

export const FEELING_OPTIONS = [
  {
    emoji: "🔥",
    label: "Amazing",
    value: "amazing" as const,
    desc: "Felt strong the whole way",
  },
  {
    emoji: "👍",
    label: "Good",
    value: "good" as const,
    desc: "Solid effort, nothing special",
  },
  {
    emoji: "😐",
    label: "Okay",
    value: "okay" as const,
    desc: "Got it done, that's what counts",
  },
  {
    emoji: "😮‍💨",
    label: "Tough",
    value: "tough" as const,
    desc: "Harder than expected",
  },
  {
    emoji: "🥵",
    label: "Brutal",
    value: "brutal" as const,
    desc: "Really struggled today",
  },
] as const;

export type FeelingValue = (typeof FEELING_OPTIONS)[number]["value"];

export interface FeelingSelectorProps {
  selectedFeeling: FeelingValue | null;
  onSelectFeeling: (value: FeelingValue) => void;
}

export function FeelingSelector({
  selectedFeeling,
  onSelectFeeling,
}: FeelingSelectorProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="mb-5"
    >
      <Text className="text-[20px] font-coach-bold text-wText mb-[14px]">
        How did that feel?
      </Text>

      <View className="gap-[6px]">
        {FEELING_OPTIONS.map((option, i) => {
          const isSelected = selectedFeeling === option.value;

          return (
            <Animated.View
              key={option.value}
              entering={FadeInUp.delay(i * 40).duration(450).springify()}
            >
              <Pressable
                onPress={() => onSelectFeeling(option.value)}
                className="w-full py-[14px] px-4 rounded-[14px] flex-row items-center gap-[14px]"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(200,255,0,0.06)"
                    : LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? "rgba(200,255,0,0.4)"
                    : LIGHT_THEME.wBrd,
                }}
              >
                <Text className="text-[22px]">{option.emoji}</Text>

                <View className="flex-1">
                  <Text
                    className="text-[15px] font-coach-semibold"
                    style={{
                      color: isSelected
                        ? LIGHT_THEME.wText
                        : LIGHT_THEME.wSub,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    className="text-[12px] font-coach mt-[1px]"
                    style={{ color: LIGHT_THEME.wMute }}
                  >
                    {option.desc}
                  </Text>
                </View>

                {isSelected && (
                  <Animated.View
                    entering={ZoomIn.duration(250).springify()}
                    className="w-[22px] h-[22px] rounded-full items-center justify-center"
                    style={{ backgroundColor: LIGHT_THEME.wText }}
                  >
                    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                      <Path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke={COLORS.lime}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}
