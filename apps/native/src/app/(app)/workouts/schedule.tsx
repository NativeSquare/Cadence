import { ScheduleWorkoutForm } from "@/components/app/workout/schedule-workout-form";
import { api } from "@packages/backend/convex/_generated/api";
import { calendarToInstant } from "@packages/shared/utils";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";

function parseDateParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

export default function ScheduleWorkoutScreen() {
  const params = useLocalSearchParams<{ date?: string; blockId?: string }>();
  const initialDateYmd = parseDateParam(params.date);
  const initialDate = initialDateYmd ? calendarToInstant(initialDateYmd) : undefined;
  const initialBlockId =
    typeof params.blockId === "string" && params.blockId.length > 0
      ? params.blockId
      : undefined;

  const createWorkout = useMutation(api.agoge.workouts.createWorkout);
  const templates = useQuery(api.agoge.workoutTemplates.listMyWorkoutTemplates);
  const blocks = useQuery(api.agoge.blocks.listBlocksForActiveAthletePlan);

  return (
    <ScheduleWorkoutForm
      initialDate={initialDate}
      initialBlockId={initialBlockId}
      templates={templates}
      blocks={blocks ?? []}
      onSubmit={async (values) => {
        await createWorkout({
          name: values.name,
          description: values.description?.trim() || undefined,
          type: values.type,
          sport: "run",
          status: "planned",
          blockId: values.blockId ?? undefined,
          planned: values.planned,
        });
      }}
    />
  );
}
