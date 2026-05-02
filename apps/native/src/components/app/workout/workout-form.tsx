import { DateField, FormField, FormSection } from "@/components/app/form";
import { TemplatePickerSheet } from "@/components/app/workout/template-picker-sheet";
import { WorkoutStructureEditor } from "@/components/app/workout/workout-structure-editor";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import {
  safeParseWorkout,
  type Workout as WorkoutStructure,
  workoutSchemaValidated,
} from "@nativesquare/agoge";
import type {
  SubSport,
  Workout,
  WorkoutTemplate,
  WorkoutTemplateDoc,
  WorkoutType,
} from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import {
  EMPTY_STRUCTURE,
  SUB_SPORT_LABELS,
  SUB_SPORTS,
  WORKOUT_TYPE_COLORS,
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPES,
} from "./workout-helpers";

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const workoutFaceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  structure: workoutSchemaValidated,
  durationSeconds: z.number().optional(),
  distanceMeters: z.number().optional(),
  load: z.number().optional(),
  avgPaceMps: z.number().optional(),
  avgHr: z.number().optional(),
  maxHr: z.number().optional(),
  elevationGainMeters: z.number().optional(),
  rpe: z.number().optional(),
  notes: z.string().optional(),
});
type WorkoutFaceValues = z.infer<typeof workoutFaceSchema>;

const formSchema = z.object({
  workoutMode: z.enum(["done", "scheduled"]),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.custom<WorkoutType>(),
  typeNotes: z.string().optional(),
  subSport: z.custom<SubSport>().optional(),
  planned: workoutFaceSchema,
  actual: workoutFaceSchema,
});
export type FormValues = z.infer<typeof formSchema>;

export type WorkoutFormMode = "create" | "edit";

function buildErrorByPath(
  structure: WorkoutStructure | undefined,
): Record<string, string> {
  if (!structure || structure.blocks.length === 0) return {};
  const result = safeParseWorkout(structure);
  if (result.success) return {};
  const map: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (path.startsWith("blocks.") && map[path] == null) {
      map[path] = issue.message;
    }
  }
  return map;
}

function firstStructureError(
  structure: WorkoutStructure | undefined,
): string | null {
  if (!structure || structure.blocks.length === 0) return null;
  const result = safeParseWorkout(structure);
  if (result.success) return null;
  const first = result.error.issues[0];
  if (!first) return null;
  return `${first.path.join(".") || "structure"}: ${first.message}`;
}

export function WorkoutForm({
  title,
  mode = "create",
  initial,
  initialDate,
  templates,
  submitLabel,
  onSubmit,
  onDelete,
  canDelete = true,
}: {
  title: string;
  mode?: WorkoutFormMode;
  initial?: Workout;
  initialDate?: string;
  templates?: WorkoutTemplateDoc[];
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
}) {
  const router = useRouter();

  const fallbackDate = initialDate ?? todayDateString();

  const initialPlannedFace: WorkoutFaceValues = {
    date: initial?.planned?.date?.slice(0, 10) ?? fallbackDate,
    structure:
      (initial?.planned?.structure as WorkoutStructure | undefined) ??
      EMPTY_STRUCTURE,
    notes: initial?.planned?.notes,
    durationSeconds: initial?.planned?.durationSeconds,
    distanceMeters: initial?.planned?.distanceMeters,
    load: initial?.planned?.load,
    avgPaceMps: initial?.planned?.avgPaceMps,
    avgHr: initial?.planned?.avgHr,
    maxHr: initial?.planned?.maxHr,
    elevationGainMeters: initial?.planned?.elevationGainMeters,
    rpe: initial?.planned?.rpe,
  };

  const initialActualFace: WorkoutFaceValues = {
    date: initial?.actual?.date?.slice(0, 10) ?? fallbackDate,
    structure:
      (initial?.actual?.structure as WorkoutStructure | undefined) ??
      EMPTY_STRUCTURE,
    notes: initial?.actual?.notes,
    durationSeconds: initial?.actual?.durationSeconds,
    distanceMeters: initial?.actual?.distanceMeters,
    load: initial?.actual?.load,
    avgPaceMps: initial?.actual?.avgPaceMps,
    avgHr: initial?.actual?.avgHr,
    maxHr: initial?.actual?.maxHr,
    elevationGainMeters: initial?.actual?.elevationGainMeters,
    rpe: initial?.actual?.rpe,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      workoutMode: initial?.status === "planned" ? "scheduled" : "done",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      type: initial?.type ?? "easy",
      typeNotes: initial?.typeNotes ?? "",
      subSport: initial?.subSport,
      planned: initialPlannedFace,
      actual: initialActualFace,
    },
  });

  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [templateName, setTemplateName] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);
  const templateSheetRef = React.useRef<BottomSheetModal>(null);

  const planned = useWatch({ control: form.control, name: "planned" });
  const actual = useWatch({ control: form.control, name: "actual" });
  const name = useWatch({ control: form.control, name: "name" });
  const workoutMode = useWatch({ control: form.control, name: "workoutMode" });

  const plannedErrorByPath = React.useMemo(
    () => buildErrorByPath(planned.structure),
    [planned.structure],
  );
  const actualErrorByPath = React.useMemo(
    () => buildErrorByPath(actual.structure),
    [actual.structure],
  );
  const plannedError = React.useMemo(
    () => firstStructureError(planned.structure),
    [planned.structure],
  );
  const actualError = React.useMemo(
    () => firstStructureError(actual.structure),
    [actual.structure],
  );

  const isSubmitting = form.formState.isSubmitting;
  const isDoneMode = workoutMode === "done";

  const canSave = (() => {
    if (isSubmitting) return false;
    if (name.trim().length === 0) return false;
    if (isDoneMode) {
      // Actual is required; Planned is optional but must be valid if present.
      if (actual.date.length !== 10) return false;
      if (actual.structure.blocks.length === 0) return false;
      if (actualError != null) return false;
      if (planned.structure.blocks.length > 0 && plannedError != null) {
        return false;
      }
    } else {
      // Scheduling: Planned is required.
      if (planned.date.length !== 10) return false;
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
    // Route picked structure to whichever face is the primary for the mode.
    const targetFaceKey = isDoneMode ? "actual" : "planned";
    form.reset({
      ...current,
      name: template.name,
      description: template.description ?? "",
      type: template.type,
      typeNotes: template.typeNotes ?? "",
      subSport: template.subSport,
      [targetFaceKey]: {
        ...current[targetFaceKey],
        structure: pickedStructure,
      },
    });
    setTemplateId(template._id);
    setTemplateName(template.name);
    templateSheetRef.current?.dismiss();
  };

  const clearTemplateLink = () => {
    selectionFeedback();
    setTemplateId(null);
    setTemplateName(null);
  };

  const handleSave = form.handleSubmit(async (data) => {
    setSubmitError(null);
    Keyboard.dismiss();
    try {
      await onSubmit(data);
      router.back();
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err));
    }
  });

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      deleteSheetRef.current?.dismiss();
      router.dismissAll();
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <StatusBar barStyle="dark-content" animated />
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {title}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-8 self-center">
          {mode === "create" && (
            <View className="gap-2">
              {templateId == null ? (
                <Pressable
                  onPress={() => {
                    selectionFeedback();
                    templateSheetRef.current?.present();
                  }}
                  className="flex-row items-center gap-2 self-start rounded-full border px-4 py-2.5 active:opacity-80"
                  style={{
                    backgroundColor: LIGHT_THEME.w1,
                    borderColor: LIGHT_THEME.wBrd,
                  }}
                >
                  <Ionicons
                    name="albums-outline"
                    size={16}
                    color={LIGHT_THEME.wText}
                  />
                  <Text
                    className="font-coach-semibold text-[13px]"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    Use a template
                  </Text>
                </Pressable>
              ) : (
                <View
                  className="flex-row items-center gap-2 self-start rounded-full px-3 py-2"
                  style={{ backgroundColor: COLORS.limeDim }}
                >
                  <Ionicons name="link" size={14} color={LIGHT_THEME.wText} />
                  <Text
                    className="font-coach-semibold text-[12px]"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    {templateName}
                  </Text>
                  <Pressable
                    onPress={clearTemplateLink}
                    className="ml-1 size-5 items-center justify-center rounded-full active:opacity-70"
                    style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                  >
                    <Ionicons
                      name="close"
                      size={12}
                      color={LIGHT_THEME.wText}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <FormSection title="Workout">
            <Controller
              control={form.control}
              name="workoutMode"
              render={({ field }) => (
                <FormField label="Status">
                  <View className="flex-row gap-2">
                    {[
                      { mode: "done" as const, label: "Just did it" },
                      { mode: "scheduled" as const, label: "Scheduling it" },
                    ].map(({ mode: m, label }) => {
                      const selected = field.value === m;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => {
                            selectionFeedback();
                            field.onChange(m);
                          }}
                          className="flex-1 items-center rounded-2xl py-3.5 active:opacity-80"
                          style={{
                            backgroundColor: selected
                              ? LIGHT_THEME.wText
                              : LIGHT_THEME.w1,
                            borderWidth: 1,
                            borderColor: selected
                              ? LIGHT_THEME.wText
                              : LIGHT_THEME.wBrd,
                          }}
                        >
                          <Text
                            className="font-coach-bold text-[14px]"
                            style={{
                              color: selected ? "#FFFFFF" : LIGHT_THEME.wText,
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormField label="Name" error={fieldState.error?.message}>
                  <TextInput
                    className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                    style={inputStyle}
                    placeholder="e.g. Tuesday Tempo"
                    placeholderTextColor={LIGHT_THEME.wMute}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="words"
                    selectionColor={COLORS.lime}
                    cursorColor={COLORS.lime}
                  />
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormField
                  label="Description (optional)"
                  error={fieldState.error?.message}
                >
                  <TextInput
                    className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
                    style={inputStyle}
                    placeholder="What this workout is for"
                    placeholderTextColor={LIGHT_THEME.wMute}
                    value={field.value ?? ""}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    multiline
                    textAlignVertical="top"
                    selectionColor={COLORS.lime}
                    cursorColor={COLORS.lime}
                  />
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <FormField label="Type" error={fieldState.error?.message}>
                  <PillSelect
                    options={WORKOUT_TYPES}
                    labels={WORKOUT_TYPE_LABELS}
                    value={field.value}
                    onChange={field.onChange}
                    colorByValue={WORKOUT_TYPE_COLORS}
                  />
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="typeNotes"
              render={({ field, fieldState }) => (
                <FormField
                  label="Type notes (optional)"
                  error={fieldState.error?.message}
                >
                  <TextInput
                    className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                    style={inputStyle}
                    placeholder="Any extra context on the type"
                    placeholderTextColor={LIGHT_THEME.wMute}
                    value={field.value ?? ""}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    selectionColor={COLORS.lime}
                    cursorColor={COLORS.lime}
                  />
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="subSport"
              render={({ field, fieldState }) => (
                <FormField
                  label="Sub-sport (optional)"
                  error={fieldState.error?.message}
                >
                  <PillSelect
                    options={SUB_SPORTS}
                    labels={SUB_SPORT_LABELS}
                    value={field.value ?? ""}
                    onChange={(v) =>
                      field.onChange(field.value === v ? undefined : v)
                    }
                    allowClear
                  />
                </FormField>
              )}
            />
          </FormSection>

          {isDoneMode && (
            <FormSection title="Actual">
              <Controller
                control={form.control}
                name="actual.date"
                render={({ field }) => (
                  <DateField
                    label="Date"
                    value={field.value || undefined}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="actual.structure"
                render={({ field }) => (
                  <WorkoutStructureEditor
                    value={field.value}
                    onChange={field.onChange}
                    errorByPath={actualErrorByPath}
                  />
                )}
              />
              {actualError && (
                <Text
                  className="font-coach text-[12px]"
                  style={{ color: COLORS.red }}
                >
                  {actualError}
                </Text>
              )}
            </FormSection>
          )}

          <FormSection title={isDoneMode ? "Planned (optional)" : "Planned"}>
            <Controller
              control={form.control}
              name="planned.date"
              render={({ field }) => (
                <DateField
                  label="Date"
                  value={field.value || undefined}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name="planned.structure"
              render={({ field }) => (
                <WorkoutStructureEditor
                  value={field.value}
                  onChange={field.onChange}
                  errorByPath={plannedErrorByPath}
                />
              )}
            />
            {plannedError && (
              <Text
                className="font-coach text-[12px]"
                style={{ color: COLORS.red }}
              >
                {plannedError}
              </Text>
            )}
          </FormSection>

          {onDelete && canDelete && (
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                Delete workout
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View className="mb-safe w-full max-w-md gap-2 self-center px-4 pb-4">
        {submitError && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {submitError}
          </Text>
        )}
        <Pressable
          onPress={() => handleSave()}
          disabled={!canSave}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: !canSave ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{ color: !canSave ? LIGHT_THEME.wMute : "#FFFFFF" }}
            >
              {submitLabel}
            </Text>
          )}
        </Pressable>
      </View>

      {mode === "create" && (
        <TemplatePickerSheet
          sheetRef={templateSheetRef}
          templates={templates ?? []}
          onPick={handlePickTemplate}
        />
      )}

      {onDelete && canDelete && (
        <ConfirmationSheet
          sheetRef={deleteSheetRef}
          icon="trash-outline"
          title="Delete workout"
          description="This cannot be undone."
          confirmLabel="Delete"
          destructive
          loading={isDeleting}
          onConfirm={handleDelete}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

function PillSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
  allowClear = false,
  colorByValue,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: string | undefined;
  onChange: (v: T) => void;
  allowClear?: boolean;
  colorByValue?: Partial<Record<T, string>>;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        const accent = colorByValue?.[opt];
        const selectedBg = accent ?? LIGHT_THEME.wText;
        return (
          <Pressable
            key={opt}
            onPress={() => {
              selectionFeedback();
              onChange(opt);
            }}
            className="rounded-full border px-[14px] py-2 active:opacity-80"
            style={{
              backgroundColor: selected ? selectedBg : LIGHT_THEME.w1,
              borderColor: selected ? selectedBg : LIGHT_THEME.wBrd,
            }}
          >
            <Text
              className="font-coach-semibold text-[13px]"
              style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
            >
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
      {allowClear && value != null && value !== "" && (
        <Text
          className="px-2 py-2 font-coach text-[11px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Tap again to clear
        </Text>
      )}
    </View>
  );
}
