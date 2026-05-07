import {
  WorkoutTemplateForm,
  type FormValues,
} from "@/components/app/workout-templates/workout-template-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import React from "react";
import { useTranslation } from "react-i18next";

export default function NewTemplateScreen() {
  const { t } = useTranslation();
  const createTemplate = useMutation(
    api.agoge.workoutTemplates.createWorkoutTemplate,
  );

  const handleSubmit = async (values: FormValues) => {
    await createTemplate({
      name: values.name,
      description: values.description,
      type: values.type,
      content: values.content,
    });
  };

  return (
    <WorkoutTemplateForm
      title={t("account.workoutTemplates.newTitle")}
      mode="create"
      submitLabel={t("account.workoutTemplates.createSubmit")}
      onSubmit={handleSubmit}
    />
  );
}
