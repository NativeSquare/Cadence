import { ScheduleWorkoutForm } from "@/components/app/workout/schedule-workout-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import type { GenericId } from "convex/values";

function parseDateParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

function ymdToIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

export default function ScheduleWorkoutScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDateYmd = parseDateParam(params.date);
  const initialDate = initialDateYmd ? ymdToIso(initialDateYmd) : undefined;

  const createWorkout = useMutation(api.agoge.workouts.createWorkout);
  const templates = useQuery(api.agoge.workoutTemplates.listMyWorkoutTemplates);
  const blocks = useQuery(api.agoge.blocks.listBlocksForActiveAthletePlan);

  return (
    <ScheduleWorkoutForm
      initialDate={initialDate}
      templates={templates}
      blocks={blocks ?? []}
      onSubmit={async (values) => {
        await createWorkout({
          name: values.name,
          description: values.description?.trim() || undefined,
          type: values.type,
          sport: "run",
          status: "planned",
          blockId: (values.blockId ?? undefined) as
            | GenericId<"blocks">
            | undefined,
          planned: values.planned,
        });
      }}
    />
  );
}
