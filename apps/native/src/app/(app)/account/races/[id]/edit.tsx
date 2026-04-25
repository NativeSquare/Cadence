import { RaceForm } from "@/components/app/account/race-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function EditRaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const race = useQuery(api.plan.events.getMyEvent, { eventId: id });
  const events = useQuery(api.plan.events.listMyEvents);
  const updateRace = useMutation(api.plan.events.updateMyEvent);
  const deleteRace = useMutation(api.plan.events.deleteMyEvent);

  const existingUpcomingARace = React.useMemo(() => {
    if (!events || !race) return null;
    const match = events.find(
      (e) =>
        e.priority === "A" &&
        e.status === "upcoming" &&
        e.raceId &&
        e.raceId !== race.raceId,
    );
    return match
      ? { raceId: match.raceId as string, name: match.name, date: match.date }
      : null;
  }, [events, race]);

  if (race === undefined) {
    return <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }} />;
  }

  if (race === null) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center px-4"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          Race not found
        </Text>
      </View>
    );
  }

  return (
    <RaceForm
      title="Edit race"
      mode="edit"
      submitLabel="Save"
      existingUpcomingARace={existingUpcomingARace}
      initial={{
        name: race.name,
        date: race.date,
        priority: race.priority,
        distanceMeters: race.distanceMeters,
        status: race.status,
        location: race.location,
        notes: race.notes,
        elevationGainMeters: race.elevationGainMeters,
        courseType: race.courseType,
        surface: race.surface,
        bibNumber: race.bibNumber,
        registrationUrl: race.registrationUrl,
        result: race.result,
      }}
      onSubmit={async (values) => {
        await updateRace({
          eventId: id,
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
          result: values.result,
          demoteExistingARaceId: values.demoteExistingARaceId,
        });
      }}
      onDelete={async () => {
        await deleteRace({ eventId: id });
      }}
    />
  );
}
