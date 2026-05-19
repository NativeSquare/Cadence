import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { DailyStepsCard } from "../cards/DailyStepsCard";

type Props = { width: number; isLocked: boolean };

export function DailySection({ width, isLocked }: Props) {
  const startDate = weeksAgoIso(13);
  const days = useQuery(api.analytics.daily.list, { startDate });

  if (days === undefined) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color={LIGHT_THEME.wText} />
      </View>
    );
  }

  return (
    <DailyStepsCard
      days={days}
      width={width}
      lockedDataType={isLocked ? "daily" : undefined}
    />
  );
}

function weeksAgoIso(weeks: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  return d.toISOString();
}
