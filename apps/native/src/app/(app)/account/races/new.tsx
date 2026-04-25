import { RaceForm } from "@/components/app/account/race-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React from "react";

export default function NewRaceScreen() {
  const createRace = useMutation(api.plan.events.createMyEvent);
  const events = useQuery(api.plan.events.listMyEvents);

  const existingUpcomingARace = React.useMemo(() => {
    if (!events) return null;
    const match = events.find(
      (e) => e.priority === "A" && e.status === "upcoming" && e.raceId,
    );
    return match
      ? { raceId: match.raceId as string, name: match.name, date: match.date }
      : null;
  }, [events]);

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
          distanceMeters: values.distanceMeters,
          status: values.status,
          location: values.location,
          notes: values.notes,
          elevationGainMeters: values.elevationGainMeters,
          courseType: values.courseType,
          surface: values.surface,
          bibNumber: values.bibNumber,
          registrationUrl: values.registrationUrl,
          demoteExistingARaceId: values.demoteExistingARaceId,
        });
      }}
    />
  );
}
