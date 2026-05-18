import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { WeeklyDistanceCard } from "../cards/WeeklyDistanceCard";
import { TypeMixCard } from "../cards/TypeMixCard";
import { EasyPaceDriftCard } from "../cards/EasyPaceDriftCard";
import { PlannedVsActualCard } from "../cards/PlannedVsActualCard";

type Props = { width: number };

export function TrainingSection({ width }: Props) {
  const startDate = oneYearAgoIso();
  const workouts = useQuery(api.agoge.workouts.listWorkouts, { startDate });

  if (workouts === undefined) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color={LIGHT_THEME.wText} />
      </View>
    );
  }

  return (
    <>
      <WeeklyDistanceCard workouts={workouts} width={width} />
      <TypeMixCard workouts={workouts} width={width} />
      <EasyPaceDriftCard workouts={workouts} width={width} />
      <PlannedVsActualCard workouts={workouts} width={width} />
    </>
  );
}

function oneYearAgoIso(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString();
}
