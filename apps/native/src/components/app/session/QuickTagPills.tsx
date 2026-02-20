/**
 * QuickTagPills - Flex-wrap tag buttons for quick session notes
 * Reference: cadence-full-v10.jsx DEBRIEF_PILLS (line 645) and pills UI (lines 754-763)
 *
 * Features:
 * - Flex-wrap layout
 * - Toggle selection (dashed → solid border)
 * - Multi-select support
 */

import { View, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

export const DEBRIEF_PILLS = [
  "Legs felt heavy",
  "Breathing was easy",
  "Side stitch",
  "Felt fast",
  "Needed more rest",
  "Perfect weather",
  "Too hot",
  "Had to walk",
] as const;

export interface QuickTagPillsProps {
  selectedPills: string[];
  onTogglePill: (pill: string) => void;
}

export function QuickTagPills({
  selectedPills,
  onTogglePill,
}: QuickTagPillsProps) {
  return (
    <View className="flex-row flex-wrap gap-[6px] mb-3">
      {DEBRIEF_PILLS.map((pill, i) => {
        const isActive = selectedPills.includes(pill);

        return (
          <Animated.View
            key={pill}
            entering={FadeIn.delay(i * 30).duration(300)}
          >
            <Pressable
              onPress={() => onTogglePill(pill)}
              className="py-2 px-[14px] rounded-[20px]"
              style={{
                backgroundColor: isActive
                  ? "rgba(200,255,0,0.06)"
                  : LIGHT_THEME.w1,
                borderWidth: 1,
                borderStyle: isActive ? "solid" : "dashed",
                borderColor: isActive
                  ? "rgba(200,255,0,0.4)"
                  : LIGHT_THEME.wBrd,
              }}
            >
              <Text
                className="text-[13px] font-coach"
                style={{
                  color: isActive ? LIGHT_THEME.wText : LIGHT_THEME.wSub,
                }}
              >
                {pill}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
