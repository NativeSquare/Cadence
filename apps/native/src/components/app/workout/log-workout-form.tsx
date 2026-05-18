import { FormSection } from "@/components/app/form";
import { WorkoutFaceCard } from "@/components/app/workout/workout-face-card";
import { WorkoutFaceFields } from "@/components/app/workout/workout-face-fields";
import { WorkoutFormShell } from "@/components/app/workout/workout-form-shell";
import { EMPTY_STRUCTURE } from "@/components/app/workout/workout-helpers";
import { WorkoutMetadataFields } from "@/components/app/workout/workout-metadata-fields";
import {
  buildErrorByPath,
  firstStructureError,
  isValidIso,
  nowIso,
  workoutFaceSchema,
} from "@/components/app/workout/workout-form-helpers";
import {
  TemplateHeaderButton,
  TemplatePickerSheet,
} from "@/components/app/workout/template-picker-sheet";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { type Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutTemplateDoc, WorkoutType } from "@nativesquare/agoge/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.custom<WorkoutType>(),
  actual: workoutFaceSchema,
});
type LogWorkoutFormShape = z.infer<typeof formSchema>;

export type LogWorkoutFormValues = {
  name: string;
  description?: string;
  type: WorkoutType;
  actual: LogWorkoutFormShape["actual"];
};

export function LogWorkoutForm({
  initialDate,
  templates,
  onSubmit,
}: {
  initialDate?: string;
  templates?: WorkoutTemplateDoc[];
  onSubmit: (values: LogWorkoutFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const initialFaceDate = initialDate ?? nowIso();

  const form = useForm<LogWorkoutFormShape>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      type: "easy",
      actual: { date: initialFaceDate, structure: EMPTY_STRUCTURE },
    },
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const templateSheetRef = React.useRef<BottomSheetModal>(null);

  const actual = useWatch({ control: form.control, name: "actual" });
  const name = useWatch({ control: form.control, name: "name" });

  const actualErrorByPath = React.useMemo(
    () => buildErrorByPath(actual.structure),
    [actual.structure],
  );
  const actualError = React.useMemo(
    () => firstStructureError(actual.structure),
    [actual.structure],
  );

  const isSubmitting = form.formState.isSubmitting;
  const nowBoundary = nowIso();

  const canSave = (() => {
    if (isSubmitting) return false;
    if (name.trim().length === 0) return false;
    if (!isValidIso(actual.date)) return false;
    if (actual.structure.blocks.length === 0) return false;
    if (actualError != null) return false;
    return true;
  })();

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
      actual: { ...current.actual, structure: pickedStructure },
    });
    templateSheetRef.current?.dismiss();
  };

  const handleSave = form.handleSubmit(
    async (data) => {
      setSubmitError(null);
      Keyboard.dismiss();
      try {
        await onSubmit({
          name: data.name,
          description: data.description,
          type: data.type,
          actual: data.actual,
        });
        router.back();
      } catch (err) {
        setSubmitError(getConvexErrorMessage(err));
      }
    },
    (errors) => {
      const first = Object.values(errors).find(
        (e): e is { message?: string } => e != null && typeof e === "object",
      );
      setSubmitError(
        first?.message ?? t("workout.errors.fixHighlighted"),
      );
    },
  );

  return (
    <WorkoutFormShell
      title={t("workout.log.title")}
      submitLabel={t("workout.log.submit")}
      canSave={canSave}
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={() => handleSave()}
      headerRight={
        <TemplateHeaderButton
          onPress={() => templateSheetRef.current?.present()}
        />
      }
    >
      <FormSection title={t("workout.fields.workoutSection")}>
        <WorkoutMetadataFields control={form.control} />
      </FormSection>

      <WorkoutFaceCard
        variant="actual"
        title={t("workout.fields.actualSection")}
      >
        <WorkoutFaceFields
          control={form.control}
          faceName="actual"
          maxDate={nowBoundary}
          errorByPath={actualErrorByPath}
          structureError={actualError}
        />
      </WorkoutFaceCard>

      <TemplatePickerSheet
        sheetRef={templateSheetRef}
        templates={templates ?? []}
        onPick={handlePickTemplate}
      />
    </WorkoutFormShell>
  );
}
