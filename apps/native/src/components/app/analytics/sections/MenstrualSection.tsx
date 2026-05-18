import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CyclePhaseCard } from "../cards/CyclePhaseCard";

type Props = { width: number; isLocked: boolean };

export function MenstrualSection({ width, isLocked }: Props) {
  const startDate = monthsAgoIso(4);
  const cycles = useQuery(api.analytics.menstrual.list, { startDate });

  if (cycles === undefined) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color={LIGHT_THEME.wText} />
      </View>
    );
  }

  return (
    <CyclePhaseCard
      cycles={cycles}
      width={width}
      lockedDataType={isLocked ? "menstruation" : undefined}
    />
  );
}

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}
