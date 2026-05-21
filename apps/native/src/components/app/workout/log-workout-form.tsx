import { FormSection } from "@/components/app/form";
import { WorkoutActualFaceFields } from "@/components/app/workout/workout-actual-face-fields";
import { WorkoutFaceCard } from "@/components/app/workout/workout-face-card";
import { WorkoutFormShell } from "@/components/app/workout/workout-form-shell";
import { WorkoutMetadataFields } from "@/components/app/workout/workout-metadata-fields";
import {
  actualFaceSchema,
  isValidIso,
  nowIso,
} from "@/components/app/workout/workout-form-helpers";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import type { WorkoutType } from "@nativesquare/agoge/schema";
import { zodResolver } from "@hookform/resolvers/zod";
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
  actual: actualFaceSchema,
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
  onSubmit,
}: {
  initialDate?: string;
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
      actual: { date: initialFaceDate },
    },
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const actual = useWatch({ control: form.control, name: "actual" });
  const name = useWatch({ control: form.control, name: "name" });

  const isSubmitting = form.formState.isSubmitting;
  const nowBoundary = nowIso();

  const canSave = (() => {
    if (isSubmitting) return false;
    if (name.trim().length === 0) return false;
    if (!isValidIso(actual.date)) return false;
    return true;
  })();

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
      setSubmitError(first?.message ?? t("workout.errors.fixHighlighted"));
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
    >
      <FormSection title={t("workout.fields.workoutSection")}>
        <WorkoutMetadataFields control={form.control} />
      </FormSection>

      <WorkoutFaceCard
        variant="actual"
        title={t("workout.fields.actualSection")}
      >
        <WorkoutActualFaceFields
          control={form.control}
          faceName="actual"
          maxDate={nowBoundary}
        />
      </WorkoutFaceCard>
    </WorkoutFormShell>
  );
}
