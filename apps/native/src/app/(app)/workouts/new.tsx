import { WorkoutForm } from "@/components/app/workout/workout-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";

function parseDate(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

export default function NewWorkoutScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = parseDate(params.date);

  const createWorkout = useMutation(api.agoge.workouts.createWorkout);
  const templates = useQuery(api.agoge.workoutTemplates.listMyWorkoutTemplates);

  return (
    <WorkoutForm
      title="New workout"
      mode="create"
      submitLabel="Save workout"
      initialDate={initialDate}
      templates={templates}
      onSubmit={async (values) => {
        const isDone = values.workoutMode === "done";
        await createWorkout({
          name: values.name,
          description: values.description?.trim() || undefined,
          type: values.type,
          sport: "run",
          status: isDone ? "completed" : "planned",
          planned:
            values.planned.structure.blocks.length > 0
              ? values.planned
              : undefined,
          actual:
            isDone && values.actual.structure.blocks.length > 0
              ? values.actual
              : undefined,
        });
      }}
    />
  );
}
