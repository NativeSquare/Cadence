import { ScheduleWorkoutForm } from "@/components/app/workout/schedule-workout-form";
import { api } from "@packages/backend/convex/_generated/api";
import { calendarToInstant } from "@packages/shared/utils";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

function parseDateParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ScheduleWorkoutScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDateYmd = parseDateParam(params.date);
  const initialDate = initialDateYmd ? calendarToInstant(initialDateYmd) : undefined;

  const createWorkout = useMutation(api.agoge.workouts.createWorkout);
  const templates = useQuery(api.agoge.workoutTemplates.listMyWorkoutTemplates);

  // 12-month window around today — covers the picker's plausible range without
  // overfetching. Dates further out remain unblocked; the backend still allows
  // them, but a collision there is extremely rare.
  const workoutRange = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 180);
    const end = new Date(today);
    end.setDate(end.getDate() + 365);
    return {
      startDate: `${toYmd(start)}T00:00:00.000Z`,
      endDate: `${toYmd(end)}T23:59:59.999Z`,
    };
  }, []);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, workoutRange);

  const takenYmds = useMemo(() => {
    const set = new Set<string>();
    if (!workouts) return set;
    for (const w of workouts) {
      const iso = w.planned?.date ?? w.actual?.date;
      if (iso) set.add(iso.slice(0, 10));
    }
    return set;
  }, [workouts]);

  return (
    <ScheduleWorkoutForm
      initialDate={initialDate}
      templates={templates}
      takenYmds={takenYmds}
      onSubmit={async (values) => {
        await createWorkout({
          name: values.name,
          description: values.description?.trim() || undefined,
          type: values.type,
          sport: "run",
          status: "planned",
          planned: values.planned,
        });
      }}
    />
  );
}
