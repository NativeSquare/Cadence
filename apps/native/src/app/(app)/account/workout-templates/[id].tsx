import {
  WorkoutTemplateForm,
  type FormValues,
} from "@/components/app/workout-templates/workout-template-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import type { WorkoutTemplate } from "@nativesquare/agoge/schema";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = useQuery(api.agoge.workoutTemplates.getMyWorkoutTemplate, {
    templateId: id,
  });
  const updateTemplate = useMutation(
    api.agoge.workoutTemplates.updateWorkoutTemplate,
  );
  const deleteTemplate = useMutation(
    api.agoge.workoutTemplates.deleteWorkoutTemplate,
  );

  if (template === undefined) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      />
    );
  }

  if (template === null) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center px-6"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach text-[14px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Template not found.
        </Text>
      </View>
    );
  }

  const isGlobal = template.athleteId == null;

  const handleSubmit = async (values: FormValues) => {
    await updateTemplate({
      templateId: id,
      name: values.name,
      description: values.description,
      type: values.type,
      content: values.content,
    });
  };

  const handleDelete = async () => {
    await deleteTemplate({ templateId: id });
  };

  return (
    <WorkoutTemplateForm
      title="Template"
      mode="edit"
      initial={template}
      submitLabel="Save"
      onSubmit={handleSubmit}
      onDelete={isGlobal ? undefined : handleDelete}
      readOnly={isGlobal}
      readOnlyReason={isGlobal ? "Shared template — read-only." : undefined}
    />
  );
}
