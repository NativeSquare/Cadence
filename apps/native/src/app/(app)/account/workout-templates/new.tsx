import {
  WorkoutTemplateForm,
  type TemplateFormValues,
} from "@/components/app/workout-templates/workout-template-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import React from "react";

export default function NewTemplateScreen() {
  const createTemplate = useMutation(
    api.agoge.workoutTemplates.createWorkoutTemplate,
  );

  const handleSubmit = async (values: TemplateFormValues) => {
    await createTemplate({
      name: values.name,
      description: values.description,
      type: values.type,
      typeNotes: values.typeNotes,
      subSport: values.subSport,
      content: { structure: values.structure },
    });
  };

  return (
    <WorkoutTemplateForm
      title="New Template"
      mode="create"
      submitLabel="Create"
      onSubmit={handleSubmit}
    />
  );
}
