/**
 * NeedsFeedbackCard - Compact prompt on PlanScreen for past-planned workouts
 * the user hasn't triaged yet.
 *
 * Renders only when at least one workout in the supplied range is in the
 * derived `needs_feedback` state. Tapping opens the dedicated triage screen.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  deriveWorkoutStatus,
  localTodayYmd,
} from "@/components/app/workout/workout-helpers";
import type { AgogeWorkout } from "./utils";

interface NeedsFeedbackCardProps {
  workouts: AgogeWorkout[];
  today: Date;
}

function AlertIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6V14" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path
        d="M12 18V18.01"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NeedsFeedbackCard({ workouts, today }: NeedsFeedbackCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const count = useMemo(() => {
    const todayYmd = localTodayYmd(today);
    let n = 0;
    for (const w of workouts) {
      if (deriveWorkoutStatus(w, todayYmd) === "needs_feedback") n += 1;
    }
    return n;
  }, [workouts, today]);

  if (count === 0) return null;

  return (
    <Pressable
      onPress={() => router.push("/(app)/workouts/needs-feedback")}
      className="active:opacity-90"
    >
      <View
        className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
        style={{
          backgroundColor: "rgba(255,196,0,0.10)",
          borderWidth: 1,
          borderColor: "rgba(255,196,0,0.30)",
        }}
      >
        <View
          className="size-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,196,0,0.18)" }}
        >
          <AlertIcon color={COLORS.ylw} />
        </View>
        <View className="flex-1">
          <Text
            className="font-coach-bold text-[15px]"
            style={{ color: LIGHT_THEME.wText }}
            numberOfLines={1}
          >
            {t("workout.needsFeedback.cardTitle")}
          </Text>
          <Text
            className="mt-0.5 font-coach-medium text-[12px]"
            style={{ color: LIGHT_THEME.wSub }}
            numberOfLines={1}
          >
            {t("workout.needsFeedback.cardSubtitle", { count })}
          </Text>
        </View>
        <ChevronRight color={LIGHT_THEME.wMute} />
      </View>
    </Pressable>
  );
}
