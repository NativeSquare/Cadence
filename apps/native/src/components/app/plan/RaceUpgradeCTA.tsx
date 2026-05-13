/**
 * RaceUpgradeCTA - Prominent prompt at the bottom of the fitness-goal Home
 * tab. Lets the user upgrade from a vague fitness goal to a race-specific
 * plan. Tapping navigates to the existing goal-creation flow.
 *
 * In-place upgrade (preserve workout history, flip goal.category) is a
 * separate ticket — see plan.
 */

import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";

interface RaceUpgradeCTAProps {
  onPress: () => void;
}

const RACE_ACCENT = WORKOUT_TYPES_COLORS.race;

function FlagIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 22V15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRight({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RaceUpgradeCTA({ onPress }: RaceUpgradeCTAProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} className="active:opacity-90">
      <View
        className="rounded-2xl px-5 py-5"
        style={{
          backgroundColor: `${RACE_ACCENT}1A`,
          borderWidth: 1,
          borderColor: `${RACE_ACCENT}40`,
        }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <FlagIcon color={RACE_ACCENT} />
          <Text
            className="text-[10px] font-coach-semibold uppercase"
            style={{ color: RACE_ACCENT, letterSpacing: 0.05 * 10 }}
          >
            {t("plan.raceUpgrade.eyebrow")}
          </Text>
        </View>

        <Text
          className="text-[18px] font-coach-bold text-wText"
          style={{ letterSpacing: -0.01 * 18, lineHeight: 22 }}
        >
          {t("plan.raceUpgrade.title")}
        </Text>
        <Text
          className="text-[13px] font-coach-medium text-wSub mt-1"
          style={{ lineHeight: 18 }}
        >
          {t("plan.raceUpgrade.body")}
        </Text>

        <View
          className="self-start mt-4 flex-row items-center gap-2 rounded-full px-4 py-2.5"
          style={{ backgroundColor: RACE_ACCENT }}
        >
          <Text
            className="text-[13px] font-coach-bold"
            style={{ color: "#FFFFFF" }}
          >
            {t("plan.raceUpgrade.cta")}
          </Text>
          <ArrowRight color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}
