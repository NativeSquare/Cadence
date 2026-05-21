import { LogWorkoutForm } from "@/components/app/workout/log-workout-form";
import { api } from "@packages/backend/convex/_generated/api";
import { calendarToInstant } from "@packages/shared/utils";
import { useMutation } from "convex/react";
import { useLocalSearchParams } from "expo-router";

function parseDateParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

export default function LogWorkoutScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDateYmd = parseDateParam(params.date);
  const initialDate = initialDateYmd ? calendarToInstant(initialDateYmd) : undefined;

  const createWorkout = useMutation(api.agoge.workouts.createWorkout);

  return (
    <LogWorkoutForm
      initialDate={initialDate}
      onSubmit={async (values) => {
        await createWorkout({
          name: values.name,
          description: values.description?.trim() || undefined,
          type: values.type,
          sport: "run",
          status: "completed",
          actual: values.actual,
        });
      }}
    />
  );
}
