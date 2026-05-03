import { FormSection } from "@/components/app/form";
import { WorkoutFaceFields } from "@/components/app/workout/workout-face-fields";
import { WorkoutFormShell } from "@/components/app/workout/workout-form-shell";
import {
  EMPTY_STRUCTURE,
  type WorkoutTypeOption,
} from "@/components/app/workout/workout-helpers";
import { WorkoutMetadataFields } from "@/components/app/workout/workout-metadata-fields";
import {
  buildErrorByPath,
  firstStructureError,
  isValidIso,
  nowIso,
  workoutFaceSchema,
} from "@/components/app/workout/workout-form-helpers";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { type Workout as WorkoutStructure } from "@nativesquare/agoge";
import type {
  WorkoutTemplateDoc,
  WorkoutType,
} from "@nativesquare/agoge/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Keyboard } from "react-native";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.custom<WorkoutType>(),
  planned: workoutFaceSchema,
});
export type ScheduleWorkoutFormValues = z.infer<typeof formSchema>;

export function ScheduleWorkoutForm({
  initialDate,
  templates,
  onSubmit,
}: {
  initialDate?: string;
  templates?: WorkoutTemplateDoc[];
  onSubmit: (values: ScheduleWorkoutFormValues) => Promise<void>;
}) {
  const router = useRouter();

  const form = useForm<ScheduleWorkoutFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      type: "easy" as WorkoutTypeOption,
      planned: {
        date: initialDate ?? nowIso(),
        structure: EMPTY_STRUCTURE,
      },
    },
  });

  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [templateName, setTemplateName] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const planned = useWatch({ control: form.control, name: "planned" });
  const name = useWatch({ control: form.control, name: "name" });

  const plannedErrorByPath = React.useMemo(
    () => buildErrorByPath(planned.structure),
    [planned.structure],
  );
  const plannedError = React.useMemo(
    () => firstStructureError(planned.structure),
    [planned.structure],
  );

  const isSubmitting = form.formState.isSubmitting;
  const nowBoundary = nowIso();

  const canSave =
    !isSubmitting &&
    name.trim().length > 0 &&
    isValidIso(planned.date) &&
    planned.structure.blocks.length > 0 &&
    plannedError == null;

  const handlePickTemplate = (template: WorkoutTemplateDoc) => {
    selectionFeedback();
    const pickedStructure =
      (template.content?.structure as WorkoutStructure | undefined) ??
      EMPTY_STRUCTURE;
    const current = form.getValues();
    form.reset({
      ...current,
      name: template.name,
      description: template.description ?? "",
      type: template.type,
      planned: { ...current.planned, structure: pickedStructure },
    });
    setTemplateId(template._id);
    setTemplateName(template.name);
  };

  const clearTemplateLink = () => {
    selectionFeedback();
    setTemplateId(null);
    setTemplateName(null);
  };

  const handleSave = form.handleSubmit(
    async (data) => {
      setSubmitError(null);
      Keyboard.dismiss();
      try {
        await onSubmit(data);
        router.back();
      } catch (err) {
        setSubmitError(getConvexErrorMessage(err));
      }
    },
    (errors) => {
      const first = Object.values(errors).find(
        (e): e is { message?: string } => e != null && typeof e === "object",
      );
      setSubmitError(first?.message ?? "Please fix the highlighted fields.");
    },
  );

  return (
    <WorkoutFormShell
      title="Schedule a workout"
      submitLabel="Schedule"
      canSave={canSave}
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={() => handleSave()}
    >
      <FormSection title="Workout">
        <WorkoutMetadataFields
          control={form.control}
          templates={templates}
          templateId={templateId}
          templateName={templateName}
          onPickTemplate={handlePickTemplate}
          onClearTemplate={clearTemplateLink}
        />
      </FormSection>

      <FormSection title="Planned">
        <WorkoutFaceFields
          control={form.control}
          faceName="planned"
          minDate={nowBoundary}
          errorByPath={plannedErrorByPath}
          structureError={plannedError}
        />
      </FormSection>
    </WorkoutFormShell>
  );
}
