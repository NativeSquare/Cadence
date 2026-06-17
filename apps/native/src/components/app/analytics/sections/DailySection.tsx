import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { DailyStepsCard } from "../cards/DailyStepsCard";
import { HrvCard } from "../cards/HrvCard";

type Props = { width: number; isLocked: boolean };

// 12-week window covers both the 4w and 12w pills on the daily charts.
const WEEKS_BACK = 13;

export function DailySection({ width, isLocked }: Props) {
  const startDate = weeksAgoIso(WEEKS_BACK);

  const days = useQuery(api.analytics.daily.list, { startDate });
  const hrvDays = useQuery(api.analytics.hrv.list, { startDate });

  if (days === undefined || hrvDays === undefined) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color={LIGHT_THEME.wText} />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <DailyStepsCard
        days={days}
        width={width}
        lockedDataType={isLocked ? "daily" : undefined}
      />
      <HrvCard
        days={hrvDays}
        width={width}
        lockedDataType={isLocked ? "daily" : undefined}
      />
    </View>
  );
}

function weeksAgoIso(weeks: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  return d.toISOString();
}
