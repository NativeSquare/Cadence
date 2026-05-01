import { FormField, FormSection } from "@/components/app/form";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { WorkoutStructureEditor } from "@/components/app/workout-templates/workout-structure-editor";
import { Text } from "@/components/ui/text";
import {
  COLORS,
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
} from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { safeParseWorkout, type Workout } from "@nativesquare/agoge";
import type {
  SubSport,
  WorkoutTemplate,
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
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

export const WORKOUT_TYPES = [
  "easy",
  "tempo",
  "long",
] as const satisfies readonly WorkoutType[];
export type WorkoutTypeOption = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_LABELS: Record<WorkoutTypeOption, string> = {
  easy: "Easy",
  tempo: "Tempo",
  long: "Long",
};

const WORKOUT_TYPE_COLORS: Record<WorkoutTypeOption, string> = {
  easy: SESSION_TYPE_COLORS.easy,
  tempo: SESSION_TYPE_COLORS.specific,
  long: SESSION_TYPE_COLORS.long,
};

export const SUB_SPORTS = [
  "track",
  "trail",
  "treadmill",
  "street",
  "indoor",
  "virtual",
] as const satisfies readonly SubSport[];
export type SubSportOption = (typeof SUB_SPORTS)[number];

export const SUB_SPORT_LABELS: Record<SubSportOption, string> = {
  track: "Track",
  trail: "Trail",
  treadmill: "Treadmill",
  street: "Street",
  indoor: "Indoor",
  virtual: "Virtual",
};

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.custom<WorkoutType>(),
  typeNotes: z.string().optional(),
  subSport: z.custom<SubSport>().optional(),
  structure: z.custom<Workout>(),
});

export type FormValues = z.infer<typeof formSchema>;

export function WorkoutTemplateForm({
  title,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  readOnly = false,
  readOnlyReason,
}: {
  title: string;
  mode: "create" | "edit";
  initial?: WorkoutTemplate;
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  readOnly?: boolean;
  readOnlyReason?: string;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      type: initial?.type ?? "easy",
      typeNotes: initial?.typeNotes ?? "",
      subSport: initial?.subSport,
      structure: initial?.content?.structure ?? {
        schema_version: 1,
        discipline: "endurance",
        sport: "run",
        blocks: [],
      },
    },
  });

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  const structure = useWatch({ control: form.control, name: "structure" });
  const name = useWatch({ control: form.control, name: "name" });

  const errorByPath = React.useMemo(() => {
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
  }, [structure]);

  const structureError = React.useMemo(() => {
    if (!structure || structure.blocks.length === 0) return null;
    const result = safeParseWorkout(structure);
    if (result.success) return null;
    const first = result.error.issues[0];
    if (!first) return null;
    return `${first.path.join(".") || "structure"}: ${first.message}`;
  }, [structure]);

  const isSubmitting = form.formState.isSubmitting;
  const canSave =
    !readOnly &&
    structureError == null &&
    !isSubmitting &&
    name.trim().length > 0 &&
    structure.blocks.length > 0;

  const handleSave = form.handleSubmit(async (data) => {
    if (structureError != null) return;
    setSubmitError(null);
    Keyboard.dismiss();
    try {
      await onSubmit({
        name: data.name,
        description: data.description?.trim() || undefined,
        type: data.type,
        typeNotes: data.typeNotes?.trim() || undefined,
        subSport: data.subSport,
        structure:
          data.structure.blocks.length > 0 ? data.structure : undefined,
      });
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
      router.back();
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
          <FormSection title="Template">
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
                    editable={!readOnly}
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
                    editable={!readOnly}
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
                    disabled={readOnly}
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
                    editable={!readOnly}
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
                    disabled={readOnly}
                    allowClear
                  />
                </FormField>
              )}
            />
          </FormSection>

          <FormSection title="Structure">
            <Controller
              control={form.control}
              name="structure"
              render={({ field }) => (
                <WorkoutStructureEditor
                  value={field.value}
                  onChange={field.onChange}
                  errorByPath={errorByPath}
                />
              )}
            />
            {structureError && (
              <Text
                className="font-coach text-[12px]"
                style={{ color: COLORS.red }}
              >
                {structureError}
              </Text>
            )}
          </FormSection>

          {readOnly && readOnlyReason && (
            <Text
              className="text-center font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {readOnlyReason}
            </Text>
          )}

          {onDelete && !readOnly && (
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                Delete template
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {!readOnly && (
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
      )}

      {onDelete && (
        <ConfirmationSheet
          sheetRef={deleteSheetRef}
          icon="trash-outline"
          title="Delete template"
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

// `value` is intentionally widened beyond T: persisted templates may carry
// a type/subSport outside the form's visible options, in which case no pill
// is highlighted but the original value still round-trips on save (as long
// as the user doesn't pick a new pill).
function PillSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
  disabled = false,
  allowClear = false,
  colorByValue,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: string | undefined;
  onChange: (v: T) => void;
  disabled?: boolean;
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
            disabled={disabled}
            onPress={() => {
              selectionFeedback();
              onChange(opt);
            }}
            className="rounded-full border px-[14px] py-2 active:opacity-80"
            style={{
              backgroundColor: selected ? selectedBg : LIGHT_THEME.w1,
              borderColor: selected ? selectedBg : LIGHT_THEME.wBrd,
              opacity: disabled ? 0.6 : 1,
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

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};
