import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { BodyWeightCard } from "../cards/BodyWeightCard";

type Props = { width: number; isLocked: boolean };

export function BodySection({ width, isLocked }: Props) {
  const startDate = weeksAgoIso(52);
  const measures = useQuery(api.analytics.body.list, { startDate });

  if (measures === undefined) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color={LIGHT_THEME.wText} />
      </View>
    );
  }

  return (
    <BodyWeightCard
      measures={measures}
      width={width}
      lockedDataType={isLocked ? "body" : undefined}
    />
  );
}

function weeksAgoIso(weeks: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  return d.toISOString();
}
