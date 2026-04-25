import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import {
  DateField,
  DatePart,
  FormField,
  FormSection,
} from "@/components/app/form";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import type {
  GoalRank,
  GoalStatus,
  GoalType,
} from "@nativesquare/agoge/schema";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from "react-native";

const GOAL_TYPES = [
  "performance",
  "completion",
  "process",
  "volume",
  "body",
  "other",
] as const satisfies readonly GoalType[];

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  performance: "Performance",
  completion: "Completion",
  process: "Process",
  volume: "Volume",
  body: "Body",
  other: "Other",
};

const GOAL_RANKS = [
  "primary",
  "stretch",
  "minimum",
  "process",
] as const satisfies readonly GoalRank[];

const GOAL_RANK_LABELS: Record<GoalRank, string> = {
  primary: "Primary",
  stretch: "Stretch",
  minimum: "Minimum",
  process: "Process",
};

const GOAL_STATUSES = [
  "active",
  "achieved",
  "missed",
  "abandoned",
  "paused",
] as const satisfies readonly GoalStatus[];

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  missed: "Missed",
  abandoned: "Abandoned",
  paused: "Paused",
};

const PERFORMANCE_MODES = ["time", "pace", "place"] as const;
type PerformanceMode = (typeof PERFORMANCE_MODES)[number];
const PERFORMANCE_MODE_LABELS: Record<PerformanceMode, string> = {
  time: "Time",
  pace: "Pace",
  place: "Placement",
};

export type GoalFormValues = {
  type: GoalType;
  title: string;
  targetValue: string;
  description?: string;
  targetDate?: string;
  rank?: GoalRank;
  status?: GoalStatus;
};

export type GoalFormInitial = GoalFormValues;

const TIME_RE = /^(\d+):(\d{2}):(\d{2})$/;
const PACE_RE = /^(\d+):(\d{2})\/km$/;
const PLACE_RE = /^#(\d+)$/;
const VOLUME_RE = /^(\d+(?:\.\d+)?)\s*km$/;
const BODY_RE = /^(\d+(?:\.\d+)?)\s*kg$/;

type FormState = {
  type: GoalType;
  perfMode: PerformanceMode;
  title: string;
  description: string;
  targetDate: string;
  rank: GoalRank | "";
  status: GoalStatus;
  // performance / time
  hours: string;
  minutes: string;
  seconds: string;
  // performance / pace
  paceMin: string;
  paceSec: string;
  // performance / place
  placement: string;
  // volume
  volumeKm: string;
  // body
  bodyKg: string;
  // process / other / fallback
  freeText: string;
  freeTextOverride: boolean;
};

function emptyForm(): FormState {
  return {
    type: "performance",
    perfMode: "time",
    title: "",
    description: "",
    targetDate: "",
    rank: "",
    status: "active",
    hours: "",
    minutes: "",
    seconds: "",
    paceMin: "",
    paceSec: "",
    placement: "",
    volumeKm: "",
    bodyKg: "",
    freeText: "",
    freeTextOverride: false,
  };
}

function initialToForm(initial: GoalFormInitial): FormState {
  const base = emptyForm();
  base.type = initial.type;
  base.title = initial.title;
  base.description = initial.description ?? "";
  base.targetDate = initial.targetDate ?? "";
  base.rank = initial.rank ?? "";
  base.status = initial.status ?? "active";

  const v = initial.targetValue ?? "";
  if (initial.type === "performance") {
    const t = TIME_RE.exec(v);
    if (t) {
      base.perfMode = "time";
      base.hours = t[1];
      base.minutes = t[2];
      base.seconds = t[3];
      return base;
    }
    const p = PACE_RE.exec(v);
    if (p) {
      base.perfMode = "pace";
      base.paceMin = p[1];
      base.paceSec = p[2];
      return base;
    }
    const pl = PLACE_RE.exec(v);
    if (pl) {
      base.perfMode = "place";
      base.placement = pl[1];
      return base;
    }
    base.freeTextOverride = true;
    base.freeText = v;
    return base;
  }
  if (initial.type === "completion") {
    if (v && v !== "Finish") {
      base.freeTextOverride = true;
      base.freeText = v;
    }
    return base;
  }
  if (initial.type === "volume") {
    const m = VOLUME_RE.exec(v);
    if (m) {
      base.volumeKm = m[1];
      return base;
    }
    base.freeTextOverride = true;
    base.freeText = v;
    return base;
  }
  if (initial.type === "body") {
    const m = BODY_RE.exec(v);
    if (m) {
      base.bodyKg = m[1];
      return base;
    }
    base.freeTextOverride = true;
    base.freeText = v;
    return base;
  }
  base.freeText = v;
  return base;
}

function buildTargetValue(form: FormState): string {
  if (form.freeTextOverride) return form.freeText.trim();
  switch (form.type) {
    case "performance": {
      if (form.perfMode === "time") {
        const h = Number.parseInt(form.hours || "0", 10);
        const m = Number.parseInt(form.minutes || "0", 10);
        const s = Number.parseInt(form.seconds || "0", 10);
        if (!h && !m && !s) return "";
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
      if (form.perfMode === "pace") {
        const m = Number.parseInt(form.paceMin || "0", 10);
        const s = Number.parseInt(form.paceSec || "0", 10);
        if (!m && !s) return "";
        return `${m}:${String(s).padStart(2, "0")}/km`;
      }
      const p = form.placement.trim();
      if (!p) return "";
      return `#${p}`;
    }
    case "completion":
      return "Finish";
    case "volume": {
      const km = form.volumeKm.trim();
      return km ? `${km} km` : "";
    }
    case "body": {
      const kg = form.bodyKg.trim();
      return kg ? `${kg} kg` : "";
    }
    case "process":
    case "other":
      return form.freeText.trim();
  }
}

export function GoalForm({
  sheetRef,
  mode,
  initial,
  onSubmit,
  onDelete,
  onDismiss,
}: {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  mode: "create" | "edit";
  initial?: GoalFormInitial;
  onSubmit: (values: GoalFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  onDismiss?: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(
    initial ? initialToForm(initial) : emptyForm(),
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<GorhomBottomSheetModal>(null);

  React.useEffect(() => {
    setForm(initial ? initialToForm(initial) : emptyForm());
    setError(null);
  }, [initial]);

  const targetValue = buildTargetValue(form);
  const canSave =
    form.title.trim().length > 0 &&
    (form.type === "completion" || targetValue.length > 0) &&
    !isSaving;

  const handleSave = async () => {
    setError(null);
    if (!canSave) {
      setError("Title and target are required.");
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({
        type: form.type,
        title: form.title.trim(),
        targetValue: targetValue || "Finish",
        description: form.description.trim() || undefined,
        targetDate: form.targetDate || undefined,
        rank: form.rank || undefined,
        status: mode === "edit" ? form.status : undefined,
      });
      sheetRef.current?.dismiss();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      deleteSheetRef.current?.dismiss();
      sheetRef.current?.dismiss();
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        scrollable
        snapPoints={["90%"]}
        onDismiss={onDismiss}
      >
        <View className="gap-6 px-4 pb-2 pt-2">
          <View className="flex-row items-center justify-between">
            <Text
              className="font-coach-bold text-lg"
              style={{ color: LIGHT_THEME.wText }}
            >
              {mode === "create" ? "New goal" : "Edit goal"}
            </Text>
            <Pressable
              onPress={() => sheetRef.current?.dismiss()}
              className="size-9 items-center justify-center rounded-full active:opacity-70"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Ionicons name="close" size={18} color={LIGHT_THEME.wText} />
            </Pressable>
          </View>

          <FormSection title="Goal">
            <FormField label="Type">
              <PillSelect
                options={GOAL_TYPES}
                labels={GOAL_TYPE_LABELS}
                value={form.type}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    type: v,
                    freeTextOverride: false,
                  }))
                }
              />
            </FormField>

            <FormField label="Title">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="e.g. Sub-3 marathon"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            {form.type === "performance" && !form.freeTextOverride && (
              <>
                <FormField label="Metric">
                  <PillSelect
                    options={PERFORMANCE_MODES}
                    labels={PERFORMANCE_MODE_LABELS}
                    value={form.perfMode}
                    onChange={(v) => setForm((f) => ({ ...f, perfMode: v }))}
                  />
                </FormField>
                {form.perfMode === "time" && (
                  <FormField label="Finish time (HH:MM:SS)">
                    <View className="flex-row gap-2">
                      <DatePart
                        placeholder="HH"
                        value={form.hours}
                        maxLength={2}
                        onChange={(v) => setForm((f) => ({ ...f, hours: v }))}
                        widthClassName="flex-1"
                      />
                      <DatePart
                        placeholder="MM"
                        value={form.minutes}
                        maxLength={2}
                        onChange={(v) => setForm((f) => ({ ...f, minutes: v }))}
                        widthClassName="flex-1"
                      />
                      <DatePart
                        placeholder="SS"
                        value={form.seconds}
                        maxLength={2}
                        onChange={(v) => setForm((f) => ({ ...f, seconds: v }))}
                        widthClassName="flex-1"
                      />
                    </View>
                  </FormField>
                )}
                {form.perfMode === "pace" && (
                  <FormField label="Pace (per km)">
                    <View className="flex-row items-center gap-2">
                      <DatePart
                        placeholder="MM"
                        value={form.paceMin}
                        maxLength={2}
                        onChange={(v) => setForm((f) => ({ ...f, paceMin: v }))}
                        widthClassName="flex-1"
                      />
                      <DatePart
                        placeholder="SS"
                        value={form.paceSec}
                        maxLength={2}
                        onChange={(v) => setForm((f) => ({ ...f, paceSec: v }))}
                        widthClassName="flex-1"
                      />
                      <Text
                        className="font-coach-medium text-[13px]"
                        style={{ color: LIGHT_THEME.wMute, width: 36 }}
                      >
                        /km
                      </Text>
                    </View>
                  </FormField>
                )}
                {form.perfMode === "place" && (
                  <FormField label="Placement">
                    <TextInput
                      className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                      style={inputStyle}
                      placeholder="e.g. 10"
                      placeholderTextColor={LIGHT_THEME.wMute}
                      keyboardType="number-pad"
                      value={form.placement}
                      onChangeText={(v) =>
                        setForm((f) => ({
                          ...f,
                          placement: v.replace(/[^0-9]/g, ""),
                        }))
                      }
                      selectionColor={COLORS.lime}
                      cursorColor={COLORS.lime}
                    />
                  </FormField>
                )}
              </>
            )}

            {form.type === "volume" && !form.freeTextOverride && (
              <FormField label="Distance">
                <View className="flex-row items-center gap-3">
                  <TextInput
                    className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                    style={inputStyle}
                    placeholder="—"
                    placeholderTextColor={LIGHT_THEME.wMute}
                    keyboardType="decimal-pad"
                    value={form.volumeKm}
                    onChangeText={(v) =>
                      setForm((f) => ({
                        ...f,
                        volumeKm: v.replace(/[^0-9.]/g, ""),
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
            )}

            {form.type === "body" && !form.freeTextOverride && (
              <FormField label="Weight">
                <View className="flex-row items-center gap-3">
                  <TextInput
                    className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                    style={inputStyle}
                    placeholder="—"
                    placeholderTextColor={LIGHT_THEME.wMute}
                    keyboardType="decimal-pad"
                    value={form.bodyKg}
                    onChangeText={(v) =>
                      setForm((f) => ({
                        ...f,
                        bodyKg: v.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    selectionColor={COLORS.lime}
                    cursorColor={COLORS.lime}
                  />
                  <Text
                    className="font-coach-medium text-[13px]"
                    style={{ color: LIGHT_THEME.wMute, width: 36 }}
                  >
                    kg
                  </Text>
                </View>
              </FormField>
            )}

            {form.type === "completion" && !form.freeTextOverride && (
              <View
                className="rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: LIGHT_THEME.w1,
                  borderColor: LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-medium text-[13px]"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  Target:{" "}
                  <Text
                    className="font-coach-bold"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    Finish
                  </Text>
                </Text>
              </View>
            )}

            {(form.type === "process" ||
              form.type === "other" ||
              form.freeTextOverride) && (
              <FormField label="Target">
                <TextInput
                  className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="e.g. Hit fueling plan"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  value={form.freeText}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, freeText: v }))
                  }
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
              </FormField>
            )}

            <FormField label="Rank (optional)">
              <PillSelect
                options={GOAL_RANKS}
                labels={GOAL_RANK_LABELS}
                value={form.rank}
                onChange={(v) =>
                  setForm((f) => ({ ...f, rank: f.rank === v ? "" : v }))
                }
                allowClear
              />
            </FormField>

            <DateField
              label="Target date (optional)"
              value={form.targetDate || undefined}
              onChange={(v) => setForm((f) => ({ ...f, targetDate: v }))}
            />

            <FormField label="Description (optional)">
              <TextInput
                className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="Why this goal? Any context…"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.description}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, description: v }))
                }
                multiline
                textAlignVertical="top"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            {mode === "edit" && (
              <FormField label="Status">
                <PillSelect
                  options={GOAL_STATUSES}
                  labels={GOAL_STATUS_LABELS}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                />
              </FormField>
            )}
          </FormSection>

          {error && (
            <Text
              className="text-center font-coach text-sm"
              style={{ color: COLORS.red }}
            >
              {error}
            </Text>
          )}

          <View className="gap-2">
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className="items-center rounded-2xl py-3.5 active:opacity-90"
              style={{
                backgroundColor: !canSave ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className="font-coach-bold text-sm"
                  style={{ color: !canSave ? LIGHT_THEME.wMute : "#FFFFFF" }}
                >
                  {mode === "create" ? "Add goal" : "Save goal"}
                </Text>
              )}
            </Pressable>

            {onDelete && mode === "edit" && (
              <Pressable
                className="items-center py-2 active:opacity-70"
                onPress={() => {
                  selectionFeedback();
                  deleteSheetRef.current?.present();
                }}
              >
                <Text
                  className="font-coach text-[13px]"
                  style={{ color: COLORS.red }}
                >
                  Delete goal
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </BottomSheetModal>

      {onDelete && (
        <ConfirmationSheet
          sheetRef={deleteSheetRef}
          icon="trash-outline"
          title="Delete goal"
          description="This cannot be undone."
          confirmLabel="Delete"
          destructive
          loading={isDeleting}
          onConfirm={handleDelete}
        />
      )}
    </>
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
