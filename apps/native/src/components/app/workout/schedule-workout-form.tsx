import { FormSection } from "@/components/app/form";
import { WorkoutBlockField } from "@/components/app/workout/workout-block-field";
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
import type {
  BlockDoc,
  WorkoutTemplateDoc,
  WorkoutType,
} from "@nativesquare/agoge/schema";
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
  blockId: z.string().nullable().optional(),
  planned: workoutFaceSchema,
});
export type ScheduleWorkoutFormValues = z.infer<typeof formSchema>;

export function ScheduleWorkoutForm({
  initialDate,
  initialBlockId,
  templates,
  blocks,
  onSubmit,
}: {
  initialDate?: string;
  initialBlockId?: string;
  templates?: WorkoutTemplateDoc[];
  blocks: BlockDoc[];
  onSubmit: (values: ScheduleWorkoutFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<ScheduleWorkoutFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      type: "easy",
      blockId: initialBlockId ?? null,
      planned: {
        date: initialDate ?? nowIso(),
        structure: EMPTY_STRUCTURE,
      },
    },
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const templateSheetRef = React.useRef<BottomSheetModal>(null);

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
    templateSheetRef.current?.dismiss();
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
      setSubmitError(
        first?.message ?? t("workout.errors.fixHighlighted"),
      );
    },
  );

  return (
    <WorkoutFormShell
      title={t("workout.schedule.title")}
      submitLabel={t("workout.schedule.submit")}
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
        <WorkoutBlockField control={form.control} blocks={blocks} />
      </FormSection>

      <WorkoutFaceCard
        variant="planned"
        title={t("workout.fields.plannedSection")}
      >
        <WorkoutFaceFields
          control={form.control}
          faceName="planned"
          minDate={nowBoundary}
          errorByPath={plannedErrorByPath}
          structureError={plannedError}
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
