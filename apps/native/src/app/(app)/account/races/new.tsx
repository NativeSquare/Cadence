import { RaceForm } from "@/components/app/account/race-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import React from "react";

export default function NewRaceScreen() {
  const createRace = useMutation(api.plan.events.createMyEvent);

  return (
    <RaceForm
      title="New race"
      submitLabel="Create race"
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
        });
      }}
    />
  );
}
