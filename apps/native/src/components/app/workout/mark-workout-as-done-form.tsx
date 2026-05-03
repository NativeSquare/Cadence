import { FormSection } from "@/components/app/form";
import { WorkoutFaceFields } from "@/components/app/workout/workout-face-fields";
import { WorkoutFormShell } from "@/components/app/workout/workout-form-shell";
import { EMPTY_STRUCTURE } from "@/components/app/workout/workout-helpers";
import {
  buildErrorByPath,
  firstStructureError,
  isValidIso,
  nowIso,
  workoutFaceSchema,
} from "@/components/app/workout/workout-form-helpers";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { type Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { z } from "zod";

const formSchema = z.object({
  actual: workoutFaceSchema,
});
export type MarkWorkoutAsDoneFormValues = z.infer<typeof formSchema>;

function clonePlannedStructure(
  structure: unknown | undefined,
): WorkoutStructure {
  if (structure == null) return EMPTY_STRUCTURE;
  // Deep clone so the form's edits don't mutate the cached query result.
  return JSON.parse(JSON.stringify(structure)) as WorkoutStructure;
}

export function MarkWorkoutAsDoneForm({
  workout,
  onSubmit,
}: {
  workout: WorkoutDoc;
  onSubmit: (values: MarkWorkoutAsDoneFormValues) => Promise<void>;
}) {
  const router = useRouter();

  const form = useForm<MarkWorkoutAsDoneFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      actual: {
        date: nowIso(),
        structure: clonePlannedStructure(workout.planned?.structure),
      },
    },
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const actual = useWatch({ control: form.control, name: "actual" });

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

  const canSave =
    !isSubmitting &&
    isValidIso(actual.date) &&
    actual.structure.blocks.length > 0 &&
    actualError == null;

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
      title={`Mark "${workout.name}" as done`}
      submitLabel="Mark as done"
      canSave={canSave}
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={() => handleSave()}
    >
      <View>
        <Text
          className="font-coach text-[13px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Recording what you actually did. The plan stays as-is — use Edit to
          tweak name, type, or the planned version.
        </Text>
      </View>

      <FormSection title="Actual">
        <WorkoutFaceFields
          control={form.control}
          faceName="actual"
          maxDate={nowBoundary}
          errorByPath={actualErrorByPath}
          structureError={actualError}
        />
      </FormSection>
    </WorkoutFormShell>
  );
}
