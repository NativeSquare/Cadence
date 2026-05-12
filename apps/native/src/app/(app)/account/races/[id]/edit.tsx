import {
  DISCIPLINES,
  FORMATS,
  type Discipline,
  type Format,
  type ObjectiveType,
  RaceForm,
} from "@/components/app/account/race-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function EditRaceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useQuery(api.agoge.races.getMyRaceWithGoal, { raceId: id });
  const updateRace = useMutation(api.agoge.races.updateMyRaceWithGoal);
  const deleteRace = useMutation(api.agoge.races.deleteMyRace);

  if (data === undefined) {
    return <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }} />;
  }

  if (data === null) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center px-4"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("account.races.notFound")}
        </Text>
      </View>
    );
  }

  const { race, goal } = data;
  const goalType: ObjectiveType =
    goal?.type === "completion" ? "completion" : "performance";

  return (
    <RaceForm
      title={t("account.races.editTitle")}
      mode="edit"
      submitLabel={t("account.races.saveSubmit")}
      initial={{
        name: race.name,
        date: race.date,
        priority: race.priority,
        discipline: (DISCIPLINES as readonly string[]).includes(
          race.discipline ?? "",
        )
          ? (race.discipline as Discipline)
          : undefined,
        format: (FORMATS as readonly string[]).includes(race.format ?? "")
          ? (race.format as Format)
          : undefined,
        distanceMeters: race.distanceMeters,
        status: race.status,
        location: race.location,
        notes: race.notes,
        elevationGainMeters: race.elevationGainMeters,
        elevationLossMeters: race.elevationLossMeters,
        itraCategory: race.itraCategory,
        result: race.result,
        goal: goal
          ? {
              type: goalType,
              targetValue: goal.targetValue,
            }
          : undefined,
      }}
      onSubmit={async (values) => {
        await updateRace({
          raceId: id,
          race: {
            name: values.name,
            date: values.date,
            priority: values.priority,
            discipline: values.discipline,
            format: values.format,
            distanceMeters: values.distanceMeters,
            status: values.status,
            location: values.location,
            notes: values.notes,
            elevationGainMeters: values.elevationGainMeters,
            elevationLossMeters: values.elevationLossMeters,
            itraCategory: values.itraCategory,
            result: values.result,
          },
          goal: values.goal,
        });
      }}
      onDelete={async () => {
        await deleteRace({ raceId: id });
      }}
    />
  );
}
