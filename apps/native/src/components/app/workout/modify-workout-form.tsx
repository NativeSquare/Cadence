import { FormSection } from "@/components/app/form";
import { WorkoutActualFaceFields } from "@/components/app/workout/workout-actual-face-fields";
import { WorkoutBlockField } from "@/components/app/workout/workout-block-field";
import { WorkoutFaceCard } from "@/components/app/workout/workout-face-card";
import { WorkoutFaceFields } from "@/components/app/workout/workout-face-fields";
import { WorkoutFormShell } from "@/components/app/workout/workout-form-shell";
import { EMPTY_STRUCTURE } from "@/components/app/workout/workout-helpers";
import { WorkoutMetadataFields } from "@/components/app/workout/workout-metadata-fields";
import {
  actualFaceSchema,
  buildErrorByPath,
  firstStructureError,
  isValidIso,
  nowIso,
  plannedFaceSchema,
} from "@/components/app/workout/workout-form-helpers";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { type Workout as WorkoutStructure } from "@nativesquare/agoge";
import type {
  BlockDoc,
  WorkoutDoc,
  WorkoutStatus,
} from "@nativesquare/agoge/schema";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Keyboard } from "react-native";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  blockId: z.string().nullable().optional(),
  planned: plannedFaceSchema,
  actual: actualFaceSchema,
});
type ModifyWorkoutFormShape = z.infer<typeof formSchema>;

export type ModifyWorkoutFormValues = {
  name: string;
  description?: string;
  status: WorkoutStatus;
  blockId: string | null;
  planned?: ModifyWorkoutFormShape["planned"];
  actual?: ModifyWorkoutFormShape["actual"];
};

function plannedFaceFromExisting(
  face: WorkoutDoc["planned"] | undefined,
  fallbackDate: string,
): ModifyWorkoutFormShape["planned"] {
  if (!face) {
    return { date: fallbackDate, structure: EMPTY_STRUCTURE };
  }
  return {
    date: face.date ?? fallbackDate,
    structure:
      (face.structure as WorkoutStructure | undefined) ?? EMPTY_STRUCTURE,
  };
}

function actualFaceFromExisting(
  face: WorkoutDoc["actual"] | undefined,
  fallbackDate: string,
): ModifyWorkoutFormShape["actual"] {
  if (!face) {
    return { date: fallbackDate };
  }
  return {
    date: face.date ?? fallbackDate,
    durationSeconds: face.durationSeconds,
    distanceMeters: face.distanceMeters,
    avgHr: face.avgHr,
    maxHr: face.maxHr,
    elevationGainMeters: face.elevationGainMeters,
    rpe: face.rpe,
    notes: face.notes,
  };
}

function inferNextStatus(
  existing: WorkoutStatus,
  hasPlanned: boolean,
  hasActual: boolean,
): WorkoutStatus {
  if (hasActual) return "completed";
  if (existing === "missed") return "missed";
  return "planned";
}

export function ModifyWorkoutForm({
  workout,
  blocks,
  onSubmit,
  onDelete,
}: {
  workout: WorkoutDoc;
  blocks: BlockDoc[];
  onSubmit: (values: ModifyWorkoutFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const fallbackDate = workout.planned?.date ?? workout.actual?.date ?? nowIso();

  const form = useForm<ModifyWorkoutFormShape>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: workout.name,
      description: workout.description ?? "",
      blockId: workout.blockId ?? null,
      planned: plannedFaceFromExisting(workout.planned, fallbackDate),
      actual: actualFaceFromExisting(workout.actual, fallbackDate),
    },
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const planned = useWatch({ control: form.control, name: "planned" });
  const actual = useWatch({ control: form.control, name: "actual" });
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
  const plannedFilled = planned.structure.blocks.length > 0;
  // Actual no longer has a structure — count it as filled when the user has
  // entered any concrete data (or when the loaded workout already had an
  // actual face we're editing).
  const actualFilled =
    actual.durationSeconds != null ||
    actual.distanceMeters != null ||
    actual.rpe != null ||
    (actual.notes?.trim().length ?? 0) > 0 ||
    workout.actual != null;

  const canSave = (() => {
    if (isSubmitting) return false;
    if (name.trim().length === 0) return false;
    if (!plannedFilled && !actualFilled) return false;
    if (plannedFilled && (!isValidIso(planned.date) || plannedError != null)) {
      return false;
    }
    if (actualFilled && !isValidIso(actual.date)) {
      return false;
    }
    return true;
  })();

  const handleSave = form.handleSubmit(
    async (data) => {
      setSubmitError(null);
      Keyboard.dismiss();
      const nextStatus = inferNextStatus(
        workout.status,
        plannedFilled,
        actualFilled,
      );
      try {
        await onSubmit({
          name: data.name,
          description: data.description,
          status: nextStatus,
          blockId: data.blockId ?? null,
          planned: plannedFilled ? data.planned : undefined,
          actual: actualFilled ? data.actual : undefined,
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
      title={t("workout.modify.title")}
      submitLabel={t("workout.modify.submit")}
      canSave={canSave}
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={() => handleSave()}
      onDelete={onDelete}
    >
      <FormSection title={t("workout.fields.workoutSection")}>
        <WorkoutMetadataFields control={form.control} hideType />
        <WorkoutBlockField control={form.control} blocks={blocks} />
      </FormSection>

      <WorkoutFaceCard
        variant="planned"
        title={t("workout.fields.plannedSection")}
      >
        <WorkoutFaceFields
          control={form.control}
          faceName="planned"
          errorByPath={plannedErrorByPath}
          structureError={plannedError}
        />
      </WorkoutFaceCard>

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
