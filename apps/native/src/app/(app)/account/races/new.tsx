import { RaceForm } from "@/components/app/account/race-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React from "react";

export default function NewRaceScreen() {
  const createRace = useMutation(api.plan.races.createMyRace);
  const races = useQuery(api.plan.races.listMyRaces);

  const existingUpcomingARace = React.useMemo(() => {
    if (!races) return null;
    const match = races.find(
      (r) => r.priority === "A" && r.status === "upcoming",
    );
    return match
      ? { raceId: match._id, name: match.name, date: match.date }
      : null;
  }, [races]);

  return (
    <RaceForm
      title="New race"
      mode="create"
      submitLabel="Create race"
      existingUpcomingARace={existingUpcomingARace}
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
          demoteExistingARaceId: values.demoteExistingARaceId,
        });
      }}
    />
  );
}
