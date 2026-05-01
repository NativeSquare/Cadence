import { DateField, FormField, FormSection } from "@/components/app/form";
import { DatePart } from "@/components/app/form/date-part";
import { TemplatePickerSheet } from "@/components/app/workout/template-picker-sheet";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import {
  COLORS,
  LIGHT_THEME,
  type SessionCategory,
} from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type {
  SubSport,
  WorkoutType,
} from "@nativesquare/agoge/schema";
import { useRouter } from "expo-router";
import React from "react";
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

export const WORKOUT_TYPES = [
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
  cross_training: "Cross training",
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

const CATEGORY_TO_TYPE: Record<SessionCategory, WorkoutType> = {
  easy: "easy",
  specific: "tempo",
  long: "long",
  race: "race",
};

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type WorkoutFormMode = "create" | "edit";
export type WorkoutMode = "done" | "scheduled";

export type WorkoutFormInitial = {
  date: string;
  name: string;
  type: WorkoutType;
  subSport?: SubSport;
  description?: string;
  status: "planned" | "completed" | "missed" | "skipped";
  planned?: {
    durationSeconds?: number;
    distanceMeters?: number;
    notes?: string;
    structure?: unknown;
  };
  actual?: {
    durationSeconds?: number;
    distanceMeters?: number;
    notes?: string;
  };
};

export type WorkoutFormSubmit = {
  date: string;
  name: string;
  type: WorkoutType;
  subSport?: SubSport;
  description?: string;
  workoutMode: WorkoutMode;
  metrics: {
    durationSeconds?: number;
    distanceMeters?: number;
    notes?: string;
  };
  /** Carried through from a picked template's planned.structure on create. */
  plannedStructure?: unknown;
  templateId?: string;
};

export type TemplateOption = {
  _id: string;
  name: string;
  description?: string;
  type: WorkoutType;
  subSport?: SubSport;
  content?: {
    structure?: unknown;
    durationSeconds?: number;
    distanceMeters?: number;
    notes?: string;
  };
};

type FormState = {
  date: string;
  workoutMode: WorkoutMode;
  type: WorkoutType;
  subSport: SubSport | "";
  name: string;
  distanceKm: string;
  durHours: string;
  durMinutes: string;
  durSeconds: string;
  notes: string;
  templateId: string | null;
  templateName: string | null;
  plannedStructure: unknown;
};

function buildEmptyForm(opts: {
  initialDate?: string;
  category?: SessionCategory;
}): FormState {
  const type: WorkoutType = opts.category
    ? CATEGORY_TO_TYPE[opts.category]
    : "easy";
  return {
    date: opts.initialDate ?? todayDateString(),
    workoutMode: "done",
    type,
    subSport: "",
    name: WORKOUT_TYPE_LABELS[type],
    distanceKm: "",
    durHours: "",
    durMinutes: "",
    durSeconds: "",
    notes: "",
    templateId: null,
    templateName: null,
    plannedStructure: undefined,
  };
}

function initialToForm(initial: WorkoutFormInitial): FormState {
  const face =
    initial.status === "completed"
      ? initial.actual
      : initial.planned ?? initial.actual;
  const km =
    face?.distanceMeters != null
      ? String(Math.round((face.distanceMeters / 1000) * 10) / 10)
      : "";
  let durH = "";
  let durM = "";
  let durS = "";
  const sec = face?.durationSeconds;
  if (sec != null && sec > 0) {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.round(sec % 60);
    durH = hours > 0 ? String(hours) : "";
    durM = String(minutes).padStart(2, "0");
    durS = String(seconds).padStart(2, "0");
  }
  return {
    date: initial.date,
    workoutMode: initial.status === "completed" ? "done" : "scheduled",
    type: initial.type,
    subSport: initial.subSport ?? "",
    name: initial.name,
    distanceKm: km,
    durHours: durH,
    durMinutes: durM,
    durSeconds: durS,
    notes: face?.notes ?? "",
    templateId: null,
    templateName: null,
    plannedStructure: initial.planned?.structure,
  };
}

export function WorkoutForm({
  title,
  mode = "create",
  initial,
  category,
  initialDate,
  templates,
  submitLabel,
  onSubmit,
  onDelete,
  canDelete = true,
}: {
  title: string;
  mode?: WorkoutFormMode;
  initial?: WorkoutFormInitial;
  category?: SessionCategory;
  initialDate?: string;
  templates?: TemplateOption[];
  submitLabel: string;
  onSubmit: (values: WorkoutFormSubmit) => Promise<void>;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(() =>
    initial ? initialToForm(initial) : buildEmptyForm({ initialDate, category }),
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);
  const templateSheetRef = React.useRef<BottomSheetModal>(null);

  const dateIsValid = form.date.length === 10;
  const hasMetric =
    form.distanceKm.trim().length > 0 ||
    form.durHours.length > 0 ||
    form.durMinutes.length > 0 ||
    form.durSeconds.length > 0;

  const canSave =
    form.name.trim().length > 0 && dateIsValid && hasMetric;

  const handlePickTemplate = (template: TemplateOption) => {
    selectionFeedback();
    const km =
      template.content?.distanceMeters != null
        ? String(Math.round((template.content.distanceMeters / 1000) * 10) / 10)
        : "";
    let durH = "";
    let durM = "";
    let durS = "";
    const sec = template.content?.durationSeconds;
    if (sec != null && sec > 0) {
      const hours = Math.floor(sec / 3600);
      const minutes = Math.floor((sec % 3600) / 60);
      const seconds = Math.round(sec % 60);
      durH = hours > 0 ? String(hours) : "";
      durM = String(minutes).padStart(2, "0");
      durS = String(seconds).padStart(2, "0");
    }
    setForm((f) => ({
      ...f,
      name: template.name,
      type: template.type,
      subSport: template.subSport ?? "",
      distanceKm: km,
      durHours: durH,
      durMinutes: durM,
      durSeconds: durS,
      notes: template.content?.notes ?? "",
      templateId: template._id,
      templateName: template.name,
      plannedStructure: template.content?.structure,
    }));
    templateSheetRef.current?.dismiss();
  };

  const clearTemplateLink = () => {
    selectionFeedback();
    setForm((f) => ({
      ...f,
      templateId: null,
      templateName: null,
      plannedStructure: undefined,
    }));
  };

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();
    if (!canSave) {
      setError("Name, date and at least one of distance / duration are required");
      return;
    }

    let distanceMeters: number | undefined;
    if (form.distanceKm.trim().length > 0) {
      const km = Number.parseFloat(form.distanceKm.trim());
      if (!Number.isFinite(km) || km <= 0 || km > 500) {
        setError("Invalid distance");
        return;
      }
      distanceMeters = Math.round(km * 1000);
    }

    let durationSeconds: number | undefined;
    if (
      form.durHours.length > 0 ||
      form.durMinutes.length > 0 ||
      form.durSeconds.length > 0
    ) {
      const h = Number.parseInt(form.durHours || "0", 10);
      const m = Number.parseInt(form.durMinutes || "0", 10);
      const s = Number.parseInt(form.durSeconds || "0", 10);
      if (
        !Number.isFinite(h) ||
        !Number.isFinite(m) ||
        !Number.isFinite(s) ||
        m > 59 ||
        s > 59
      ) {
        setError("Invalid duration");
        return;
      }
      const total = h * 3600 + m * 60 + s;
      if (total > 0) durationSeconds = total;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        date: form.date,
        name: form.name.trim(),
        type: form.type,
        subSport: form.subSport || undefined,
        workoutMode: form.workoutMode,
        metrics: {
          durationSeconds,
          distanceMeters,
          notes: form.notes.trim() || undefined,
        },
        plannedStructure:
          form.workoutMode === "scheduled" ? form.plannedStructure : undefined,
        templateId: form.templateId ?? undefined,
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
      router.dismissAll();
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
              {form.templateId == null ? (
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
                    {form.templateName}
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
            <FormField label="Status">
              <View className="flex-row gap-2">
                {(
                  [
                    { mode: "done" as const, label: "Just did it" },
                    { mode: "scheduled" as const, label: "Scheduling it" },
                  ]
                ).map(({ mode: m, label }) => {
                  const selected = form.workoutMode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        selectionFeedback();
                        setForm((f) => ({ ...f, workoutMode: m }));
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

            <DateField
              label="Date"
              value={form.date || undefined}
              onChange={(v) => setForm((f) => ({ ...f, date: v }))}
            />

            <FormField label="Name">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="e.g. Easy run"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                autoCapitalize="sentences"
                returnKeyType="next"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            <FormField label="Type">
              <PillSelect
                options={WORKOUT_TYPES}
                labels={WORKOUT_TYPE_LABELS}
                value={form.type}
                onChange={(v) =>
                  setForm((f) => {
                    const nameWasDefault =
                      f.name === WORKOUT_TYPE_LABELS[f.type] ||
                      f.name.trim().length === 0;
                    return {
                      ...f,
                      type: v,
                      name: nameWasDefault ? WORKOUT_TYPE_LABELS[v] : f.name,
                    };
                  })
                }
              />
            </FormField>

            <FormField label="Surface (optional)">
              <PillSelect
                options={SUB_SPORTS}
                labels={SUB_SPORT_LABELS}
                value={form.subSport}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    subSport: f.subSport === v ? "" : v,
                  }))
                }
                allowClear
              />
            </FormField>
          </FormSection>

          <FormSection title="Metrics">
            <FormField label="Distance (km)">
              <View className="flex-row items-center gap-3">
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="e.g. 8.5"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="decimal-pad"
                  value={form.distanceKm}
                  onChangeText={(v) =>
                    setForm((f) => ({
                      ...f,
                      distanceKm: cleanDecimal(v),
                    }))
                  }
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <Text
                  className="font-coach-medium text-[13px]"
                  style={{ color: LIGHT_THEME.wMute, width: 36 }}
                >
                  km
                </Text>
              </View>
            </FormField>

            <FormField label="Duration">
              <View className="flex-row gap-2">
                <DatePart
                  placeholder="HH"
                  value={form.durHours}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, durHours: v }))}
                  widthClassName="flex-1"
                />
                <DatePart
                  placeholder="MM"
                  value={form.durMinutes}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, durMinutes: v }))}
                  widthClassName="flex-1"
                />
                <DatePart
                  placeholder="SS"
                  value={form.durSeconds}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, durSeconds: v }))}
                  widthClassName="flex-1"
                />
              </View>
            </FormField>

            <FormField label="Notes (optional)">
              <TextInput
                className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="How did it feel? Conditions, splits, etc."
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
                textAlignVertical="top"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>
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
          disabled={isLoading || !canSave}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !canSave ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isLoading || !canSave ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
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

function cleanDecimal(input: string): string {
  let cleaned = input.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

function PillSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
  allowClear = false,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | "";
  onChange: (v: T) => void;
  allowClear?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => {
              selectionFeedback();
              onChange(opt);
            }}
            className="rounded-full border px-[18px] py-2.5 active:opacity-80"
            style={{
              backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
              borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
            }}
          >
            <Text
              className="font-coach-semibold text-[14px]"
              style={{
                color: selected ? "#FFFFFF" : LIGHT_THEME.wText,
              }}
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
