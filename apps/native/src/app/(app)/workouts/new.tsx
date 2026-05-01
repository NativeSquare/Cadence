import {
  type TemplateOption,
  WorkoutForm,
} from "@/components/app/workout/workout-form";
import type { SessionCategory } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const VALID_CATEGORIES: readonly SessionCategory[] = [
  "easy",
  "specific",
  "long",
  "race",
];

function parseCategory(
  raw: string | string[] | undefined,
): SessionCategory | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && (VALID_CATEGORIES as readonly string[]).includes(value)) {
    return value as SessionCategory;
  }
  return undefined;
}

function parseDate(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

export default function NewWorkoutScreen() {
  const params = useLocalSearchParams<{ type?: string; date?: string }>();
  const category = parseCategory(params.type);
  const initialDate = parseDate(params.date);

  const createWorkout = useMutation(api.agoge.workouts.createWorkout);
  const templates = useQuery(api.agoge.workoutTemplates.listMyWorkoutTemplates);

  const templateOptions: TemplateOption[] = React.useMemo(() => {
    if (!templates) return [];
    return templates.map((t) => ({
      _id: t._id,
      name: t.name,
      description: t.description,
      type: t.type,
      typeNotes: t.typeNotes,
      subSport: t.subSport,
      content: t.content,
    }));
  }, [templates]);

  return (
    <WorkoutForm
      title="New workout"
      mode="create"
      submitLabel="Save workout"
      category={category}
      initialDate={initialDate}
      templates={templateOptions}
      onSubmit={async (values) => {
        const isDone = values.workoutMode === "done";
        const face = {
          date: `${values.date}T00:00:00.000Z`,
          structure: values.structure,
        };
        await createWorkout({
          name: values.name,
          description: values.description,
          type: values.type,
          typeNotes: values.typeNotes,
          sport: "run",
          subSport: values.subSport,
          status: isDone ? "completed" : "planned",
          planned: isDone ? undefined : face,
          actual: isDone ? face : undefined,
        });
      }}
    />
  );
}
