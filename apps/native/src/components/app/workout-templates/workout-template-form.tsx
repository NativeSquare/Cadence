import { FormField, FormSection } from "@/components/app/form";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { WorkoutStructureEditor } from "@/components/app/workout-templates/workout-structure-editor";
import { emptyWorkout } from "@/components/app/workout-templates/workout-helpers";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { safeParseWorkout, type Workout } from "@nativesquare/agoge";
import type { SubSport, WorkoutType } from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React from "react";
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

const WORKOUT_TYPES = [
  "easy",
  "long",
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "fartlek",
  "progression",
  "race_pace",
  "recovery",
  "strides",
  "hills",
  "race",
  "test",
  "cross_training",
  "strength",
  "rest",
  "other",
] as const satisfies readonly WorkoutType[];

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy",
  long: "Long",
  tempo: "Tempo",
  threshold: "Threshold",
  intervals: "Intervals",
  vo2max: "VO2max",
  fartlek: "Fartlek",
  progression: "Progression",
  race_pace: "Race pace",
  recovery: "Recovery",
  strides: "Strides",
  hills: "Hills",
  race: "Race",
  test: "Test",
  cross_training: "Cross-training",
  strength: "Strength",
  rest: "Rest",
  other: "Other",
};

const SUB_SPORTS = [
  "track",
  "trail",
  "treadmill",
  "street",
  "indoor",
  "virtual",
] as const satisfies readonly SubSport[];

const SUB_SPORT_LABELS: Record<SubSport, string> = {
  track: "Track",
  trail: "Trail",
  treadmill: "Treadmill",
  street: "Street",
  indoor: "Indoor",
  virtual: "Virtual",
};

export type TemplateFormValues = {
  name: string;
  description?: string;
  type: WorkoutType;
  typeNotes?: string;
  subSport?: SubSport;
  structure: Workout | undefined;
};

export type TemplateFormInitial = {
  name: string;
  description?: string;
  type: WorkoutType;
  typeNotes?: string;
  subSport?: SubSport;
  structure?: Workout;
};

const EMPTY_INITIAL: TemplateFormInitial = {
  name: "",
  type: "easy",
};

export function WorkoutTemplateForm({
  title,
  mode,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  readOnly = false,
  readOnlyReason,
}: {
  title: string;
  mode: "create" | "edit";
  initial?: TemplateFormInitial;
  submitLabel: string;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  readOnly?: boolean;
  readOnlyReason?: string;
}) {
  const router = useRouter();
  const seed = initial ?? EMPTY_INITIAL;
  const [name, setName] = React.useState(seed.name);
  const [description, setDescription] = React.useState(seed.description ?? "");
  const [type, setType] = React.useState<WorkoutType>(seed.type);
  const [typeNotes, setTypeNotes] = React.useState(seed.typeNotes ?? "");
  const [subSport, setSubSport] = React.useState<SubSport | undefined>(
    seed.subSport,
  );
  const [structure, setStructure] = React.useState<Workout>(
    seed.structure ?? emptyWorkout(),
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  const errorByPath = React.useMemo(() => {
    if (structure.blocks.length === 0) return {};
    const result = safeParseWorkout(structure);
    if (result.success) return {};
    const map: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      // Only surface block-level errors to per-block highlighting; root-level
      // sport/discipline errors fall into the general error banner below.
      if (path.startsWith("blocks.") && map[path] == null) {
        map[path] = issue.message;
      }
    }
    return map;
  }, [structure]);

  const structureError = React.useMemo(() => {
    if (structure.blocks.length === 0) return null;
    const result = safeParseWorkout(structure);
    if (result.success) return null;
    const first = result.error.issues[0];
    if (!first) return null;
    return `${first.path.join(".") || "structure"}: ${first.message}`;
  }, [structure]);

  const canSave =
    !readOnly &&
    name.trim().length > 0 &&
    structureError == null &&
    !isLoading;

  const handleSave = async () => {
    if (!canSave) return;
    setError(null);
    Keyboard.dismiss();
    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        typeNotes: typeNotes.trim() || undefined,
        subSport,
        structure: structure.blocks.length > 0 ? structure : undefined,
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      deleteSheetRef.current?.dismiss();
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
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
            <FormField label="Name">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="e.g. Tuesday Tempo"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={name}
                onChangeText={setName}
                editable={!readOnly}
                autoCapitalize="words"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            <FormField label="Description (optional)">
              <TextInput
                className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="What this workout is for"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={description}
                onChangeText={setDescription}
                editable={!readOnly}
                multiline
                textAlignVertical="top"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            <FormField label="Type">
              <PillSelect
                options={WORKOUT_TYPES}
                labels={WORKOUT_TYPE_LABELS}
                value={type}
                onChange={setType}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Type notes (optional)">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="Any extra context on the type"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={typeNotes}
                onChangeText={setTypeNotes}
                editable={!readOnly}
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            <FormField label="Sub-sport (optional)">
              <PillSelect
                options={SUB_SPORTS}
                labels={SUB_SPORT_LABELS}
                value={subSport ?? ""}
                onChange={(v) => setSubSport(subSport === v ? undefined : v)}
                disabled={readOnly}
                allowClear
              />
            </FormField>
          </FormSection>

          <FormSection title="Structure">
            <WorkoutStructureEditor
              value={structure}
              onChange={setStructure}
              errorByPath={errorByPath}
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
          {error && (
            <Text
              className="text-center font-coach text-sm"
              style={{ color: COLORS.red }}
            >
              {error}
            </Text>
          )}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className="items-center rounded-2xl py-3.5 active:opacity-90"
            style={{
              backgroundColor: !canSave ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
            }}
          >
            {isLoading ? (
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

function PillSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
  disabled = false,
  allowClear = false,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | "";
  onChange: (v: T) => void;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
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
              backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
              borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
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
      {allowClear && value !== "" && (
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
