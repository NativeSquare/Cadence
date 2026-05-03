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
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { type Workout as WorkoutStructure } from "@nativesquare/agoge";
import type {
  WorkoutTemplateDoc,
  WorkoutType,
} from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Keyboard, Pressable, View } from "react-native";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.custom<WorkoutType>(),
  actual: workoutFaceSchema,
  planned: workoutFaceSchema,
});
type LogWorkoutFormShape = z.infer<typeof formSchema>;

export type LogWorkoutFormValues = {
  name: string;
  description?: string;
  type: WorkoutType;
  actual: LogWorkoutFormShape["actual"];
  planned?: LogWorkoutFormShape["planned"];
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
  const router = useRouter();
  const initialFaceDate = initialDate ?? nowIso();

  const form = useForm<LogWorkoutFormShape>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      type: "easy" as WorkoutTypeOption,
      actual: { date: initialFaceDate, structure: EMPTY_STRUCTURE },
      planned: { date: initialFaceDate, structure: EMPTY_STRUCTURE },
    },
  });

  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [templateName, setTemplateName] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showPlanned, setShowPlanned] = React.useState(false);

  const actual = useWatch({ control: form.control, name: "actual" });
  const planned = useWatch({ control: form.control, name: "planned" });
  const name = useWatch({ control: form.control, name: "name" });

  const actualErrorByPath = React.useMemo(
    () => buildErrorByPath(actual.structure),
    [actual.structure],
  );
  const plannedErrorByPath = React.useMemo(
    () => buildErrorByPath(planned.structure),
    [planned.structure],
  );
  const actualError = React.useMemo(
    () => firstStructureError(actual.structure),
    [actual.structure],
  );
  const plannedError = React.useMemo(
    () => firstStructureError(planned.structure),
    [planned.structure],
  );

  const isSubmitting = form.formState.isSubmitting;
  const nowBoundary = nowIso();

  const canSave = (() => {
    if (isSubmitting) return false;
    if (name.trim().length === 0) return false;
    if (!isValidIso(actual.date)) return false;
    if (actual.structure.blocks.length === 0) return false;
    if (actualError != null) return false;
    if (showPlanned) {
      if (!isValidIso(planned.date)) return false;
      if (planned.structure.blocks.length === 0) return false;
      if (plannedError != null) return false;
    }
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
    setTemplateId(template._id);
    setTemplateName(template.name);
  };

  const clearTemplateLink = () => {
    selectionFeedback();
    setTemplateId(null);
    setTemplateName(null);
  };

  const togglePlanned = () => {
    selectionFeedback();
    if (showPlanned) {
      // Clear planned face when hiding so we never accidentally submit stale data.
      form.setValue("planned", {
        date: actual.date,
        structure: EMPTY_STRUCTURE,
      });
      setShowPlanned(false);
    } else {
      // When opening, default planned date to actual date.
      form.setValue("planned.date", actual.date);
      setShowPlanned(true);
    }
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
          planned: showPlanned ? data.planned : undefined,
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
      setSubmitError(first?.message ?? "Please fix the highlighted fields.");
    },
  );

  return (
    <WorkoutFormShell
      title="Log a workout"
      submitLabel="Save workout"
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

      <FormSection title="Actual">
        <WorkoutFaceFields
          control={form.control}
          faceName="actual"
          maxDate={nowBoundary}
          errorByPath={actualErrorByPath}
          structureError={actualError}
        />
      </FormSection>

      {showPlanned && (
        <FormSection title="Planned (optional)">
          <WorkoutFaceFields
            control={form.control}
            faceName="planned"
            maxDate={actual.date}
            errorByPath={plannedErrorByPath}
            structureError={plannedError}
          />
        </FormSection>
      )}

      <View>
        <Pressable
          onPress={togglePlanned}
          className="flex-row items-center justify-center gap-2 self-center rounded-full border px-4 py-2.5 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Ionicons
            name={showPlanned ? "remove-circle-outline" : "add-circle-outline"}
            size={16}
            color={LIGHT_THEME.wText}
          />
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {showPlanned ? "Remove planned version" : "Add planned version"}
          </Text>
        </Pressable>
      </View>
    </WorkoutFormShell>
  );
}
