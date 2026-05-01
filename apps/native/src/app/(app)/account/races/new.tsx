import { RaceForm } from "@/components/app/account/race-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";

export default function NewRaceScreen() {
  const createRace = useMutation(api.agoge.races.createMyRace);

  return (
    <RaceForm
      title="New race"
      mode="create"
      submitLabel="Create race"
      onSubmit={async (values) => {
        await createRace({
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
          courseType: values.courseType,
          surface: values.surface,
          itraCategory: values.itraCategory,
        });
      }}
    />
  );
}
