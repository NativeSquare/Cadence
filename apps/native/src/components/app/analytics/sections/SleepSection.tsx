import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { SleepDurationCard } from "../cards/SleepDurationCard";

type Props = { width: number; isLocked: boolean };

export function SleepSection({ width, isLocked }: Props) {
  const startDate = weeksAgoIso(13);
  const nights = useQuery(api.analytics.sleep.list, { startDate });

  if (nights === undefined) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color={LIGHT_THEME.wText} />
      </View>
    );
  }

  return (
    <SleepDurationCard
      nights={nights}
      width={width}
      lockedDataType={isLocked ? "sleep" : undefined}
    />
  );
}

function weeksAgoIso(weeks: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  return d.toISOString();
}
