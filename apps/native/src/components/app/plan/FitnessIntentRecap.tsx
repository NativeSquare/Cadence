/**
 * FitnessIntentRecap - Recap card for fitness goals on the Home tab.
 * Renders the chosen intent's label + supporting copy, no metrics.
 */

import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import type { FitnessGoalIntent } from "@nativesquare/agoge/schema";

interface FitnessIntentRecapProps {
  intent: FitnessGoalIntent;
}

const ACCENT = LIGHT_THEME.wText;

function CompassIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FitnessIntentRecap({ intent }: FitnessIntentRecapProps) {
  const { t } = useTranslation();

  return (
    <View
      className="rounded-2xl bg-w1 px-5 py-5"
      style={{
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.10)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View
        className="self-start rounded-full px-2.5 py-1 flex-row items-center gap-1.5 mb-3"
        style={{ backgroundColor: `${ACCENT}14` }}
      >
        <CompassIcon size={12} color={ACCENT} />
        <Text
          className="text-[10px] font-coach-semibold uppercase"
          style={{ color: ACCENT, letterSpacing: 0.05 * 10 }}
        >
          {t("plan.fitnessIntent.eyebrow")}
        </Text>
      </View>

      <Text
        className="text-[22px] font-coach-bold text-wText"
        style={{ letterSpacing: -0.02 * 22, lineHeight: 26 }}
      >
        {t(`goal.fitness.options.${intent}.label`)}
      </Text>
      <Text
        className="text-[13px] font-coach-medium text-wSub mt-1.5"
        style={{ lineHeight: 19 }}
      >
        {t(`goal.fitness.options.${intent}.desc`)}
      </Text>
    </View>
  );
}
