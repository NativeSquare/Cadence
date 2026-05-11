import { RaceForm } from "@/components/app/account/race-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useTranslation } from "react-i18next";

export default function NewRaceScreen() {
  const { t } = useTranslation();
  const createRace = useMutation(api.agoge.races.createMyRaceWithGoal);

  return (
    <RaceForm
      title={t("account.races.newTitle")}
      mode="create"
      submitLabel={t("account.races.createSubmit")}
      onSubmit={async (values) => {
        await createRace({
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
    />
  );
}
