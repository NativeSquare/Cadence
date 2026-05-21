import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { FormField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import {
  ALLOWED_DURATIONS_FOR_RUN,
  ALLOWED_TARGETS_FOR_RUN,
  type DurationKindOption,
  emptyDurationOf,
  emptyTargetOf,
  INTENT_COLORS,
  INTENTS,
  type IntentKindOption,
  mpsToPaceString,
  paceStringToMps,
  type TargetKindOption,
  useDurationDescriptions,
  useDurationLabels,
  useIntentDescriptions,
  useIntentLabels,
  useTargetDescriptions,
  useTargetLabels,
} from "@/components/app/workout/workout-helpers";
import type { Step } from "@nativesquare/agoge";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, TextInput, View } from "react-native";

type Props = {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  initial: Step | null;
  onSave: (step: Step) => void;
  onDelete?: () => void;
  onDismiss?: () => void;
};

export function StepEditorSheet({
  sheetRef,
  initial,
  onSave,
  onDelete,
  onDismiss,
}: Props) {
  return (
    <BottomSheetModal
      ref={sheetRef}
      scrollable
      snapPoints={["85%"]}
      onDismiss={onDismiss}
    >
      <StepEditorBody
        key={initial ? `edit-${JSON.stringify(initial)}` : "create"}
        initial={initial}
        onSave={(s) => {
          onSave(s);
          sheetRef.current?.dismiss();
        }}
        onCancel={() => sheetRef.current?.dismiss()}
        onDelete={
          onDelete
            ? () => {
                onDelete();
                sheetRef.current?.dismiss();
              }
            : undefined
        }
      />
    </BottomSheetModal>
  );
}

// Cross-axis rules: rest is stationary → no distance Duration, no
// pace/cadence Target. Forbidden chips are disabled in the picker rather
// than blocking save, so the user is guided into a coherent state.
function isDurationKindForbidden(
  kind: DurationKindOption,
  intent: Step["intent"],
  _targetKind: NonNullable<Step["target"]>["type"],
): boolean {
  return intent === "rest" && kind === "distance";
}

function isTargetKindForbidden(
  kind: TargetKindOption,
  intent: Step["intent"],
  _durationKind: Step["duration"]["type"],
): boolean {
  return (
    intent === "rest" && (kind === "pace_range" || kind === "cadence_range")
  );
}

function StepEditorBody({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Step | null;
  onSave: (step: Step) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const intentLabels = useIntentLabels();
  const intentDescriptions = useIntentDescriptions();
  const [step, setStep] = React.useState<Step>(
    initial ?? {
      kind: "step",
      intent: "work",
      // Empty time so a fresh sheet shows blank inputs; the schema requires
      // a positive duration, which the Save button enforces below.
      duration: { type: "time", seconds: 0 },
      target: { type: "none" },
    },
  );

  // The schema requires positive numeric values everywhere. We carry 0 in
  // the working state to support blank inputs, then refuse to save until
  // every field the user populated is real.
  const isDurationValid = (() => {
    const d = step.duration;
    if (d.type === "time") return d.seconds > 0;
    if (d.type === "distance") return d.meters > 0;
    return true;
  })();

  const isTargetValid = (() => {
    const t = step.target;
    if (!t || t.type === "none") return true;
    if (t.type === "pace_range")
      return t.min_speed_mps > 0 && t.max_speed_mps > 0;
    if (t.type === "cadence_range") return t.min_spm > 0 && t.max_spm > 0;
    if (t.type === "rpe") return t.value >= 1 && t.value <= 10;
    return true;
  })();

  const isValid = isDurationValid && isTargetValid;

  const handleSave = () => {
    if (!isValid) return;
    onSave(step);
  };

  // Switching to "rest" can leave behind selections that don't physically
  // apply (you can't auto-lap on distance or hit a pace target while
  // standing still). Auto-clear them so the user lands in a coherent state
  // instead of staring at a forbidden combo with disabled chips.
  const handleIntentChange = (intent: IntentKindOption) => {
    selectionFeedback();
    setStep((s) => {
      let next: Step = { ...s, intent };
      if (intent === "rest" && next.duration.type === "distance") {
        next = { ...next, duration: { type: "time", seconds: 0 } };
      }
      if (
        intent === "rest" &&
        next.target &&
        (next.target.type === "pace_range" ||
          next.target.type === "cadence_range")
      ) {
        next = { ...next, target: undefined };
      }
      return next;
    });
  };

  return (
    <View className="gap-7 px-5 pb-2 pt-1">
      <Text
        className="font-coach-bold text-[16px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {initial
          ? t("workout.stepEditor.titleEdit")
          : t("workout.stepEditor.titleAdd")}
      </Text>

      <FormField label={t("workout.stepEditor.intent")}>
        <View className="gap-2">
          <View className="flex-row flex-wrap gap-2">
            {INTENTS.map((intent) => {
              const selected = step.intent === intent;
              return (
                <Pressable
                  key={intent}
                  onPress={() => handleIntentChange(intent)}
                  className="flex-row items-center gap-2 rounded-full border px-4 py-2.5 active:opacity-80"
                  style={{
                    backgroundColor: selected
                      ? LIGHT_THEME.wText
                      : LIGHT_THEME.w1,
                    borderColor: selected
                      ? LIGHT_THEME.wText
                      : LIGHT_THEME.wBrd,
                  }}
                >
                  <View
                    className="size-2 rounded-full"
                    style={{ backgroundColor: INTENT_COLORS[intent] }}
                  />
                  <Text
                    className="font-coach-semibold text-[13px]"
                    style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                  >
                    {intentLabels[intent]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {intentDescriptions[step.intent]}
          </Text>
        </View>
      </FormField>

      <DurationField
        value={step.duration}
        intent={step.intent}
        targetKind={step.target?.type ?? "none"}
        onChange={(d) => setStep((s) => ({ ...s, duration: d }))}
      />

      <TargetField
        value={step.target ?? { type: "none" }}
        intent={step.intent}
        durationKind={step.duration.type}
        onChange={(target) =>
          setStep((s) => ({
            ...s,
            target: target.type === "none" ? undefined : target,
          }))
        }
      />

      <View className="gap-2.5 pt-3">
        <Pressable
          onPress={handleSave}
          disabled={!isValid}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: isValid ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
            opacity: isValid ? 1 : 0.6,
          }}
        >
          <Text
            className="font-coach-bold text-sm"
            style={{ color: "#FFFFFF" }}
          >
            {initial
              ? t("workout.stepEditor.submitSave")
              : t("workout.stepEditor.submitAdd")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          className="items-center rounded-2xl border py-3.5 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text
            className="font-coach-semibold text-sm"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("common.cancel")}
          </Text>
        </Pressable>
        {onDelete && (
          <Pressable
            onPress={() => {
              Alert.alert(
                t("workout.stepEditor.delete.title"),
                t("workout.stepEditor.delete.message"),
                [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("workout.stepEditor.delete.confirm"),
                    style: "destructive",
                    onPress: onDelete,
                  },
                ],
              );
            }}
            className="flex-row items-center justify-center gap-1.5 py-3 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={14} color={COLORS.red} />
            <Text
              className="font-coach text-[13px]"
              style={{ color: COLORS.red }}
            >
              {t("workout.stepEditor.deleteStep")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function DurationField({
  value,
  intent,
  targetKind,
  onChange,
}: {
  value: Step["duration"];
  intent: Step["intent"];
  targetKind: NonNullable<Step["target"]>["type"];
  onChange: (d: Step["duration"]) => void;
}) {
  const { t } = useTranslation();
  const durationLabels = useDurationLabels();
  const durationDescriptions = useDurationDescriptions();
  // Only run-allowed kinds have descriptions; older imported steps (calories,
  // hr_gate, power_gate) get a blank line rather than crashing the lookup.
  const description =
    value.type === "time" ||
    value.type === "distance" ||
    value.type === "open"
      ? durationDescriptions[value.type]
      : null;

  return (
    <FormField label={t("workout.stepEditor.duration")}>
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {ALLOWED_DURATIONS_FOR_RUN.map((kind) => {
            const selected = value.type === kind;
            const disabled = isDurationKindForbidden(kind, intent, targetKind);
            return (
              <Pressable
                key={kind}
                disabled={disabled}
                onPress={() => {
                  selectionFeedback();
                  if (value.type !== kind) onChange(emptyDurationOf(kind));
                }}
                className="rounded-full border px-4 py-2.5 active:opacity-80"
                style={{
                  backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <Text
                  className="font-coach-semibold text-[13px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  {durationLabels[kind]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {description && (
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {description}
          </Text>
        )}
        <DurationInputs value={value} onChange={onChange} />
      </View>
    </FormField>
  );
}

function DurationInputs({
  value,
  onChange,
}: {
  value: Step["duration"];
  onChange: (d: Step["duration"]) => void;
}) {
  const { t } = useTranslation();
  if (value.type === "open") return null;
  if (value.type === "time") {
    return <TimeInput value={value} onChange={onChange} />;
  }
  if (value.type === "distance") {
    return <DistanceInput value={value} onChange={onChange} />;
  }
  if (value.type === "calories") {
    return (
      <NumericInput
        value={value.kcal > 0 ? String(value.kcal) : ""}
        placeholder="kcal"
        suffix="kcal"
        onChangeText={(t) => {
          const n = Number.parseInt(t || "0", 10);
          onChange({ type: "calories", kcal: Math.max(1, n) });
        }}
      />
    );
  }
  return null;
}

function TargetField({
  value,
  intent,
  durationKind,
  onChange,
}: {
  value: NonNullable<Step["target"]>;
  intent: Step["intent"];
  durationKind: Step["duration"]["type"];
  onChange: (target: NonNullable<Step["target"]>) => void;
}) {
  const { t } = useTranslation();
  const targetLabels = useTargetLabels();
  const targetDescriptions = useTargetDescriptions();
  // Only run-allowed kinds have descriptions; older imported steps
  // (hr_range, hr_zone, power_range, power_zone) get no helper text rather
  // than crashing.
  const description =
    value.type === "none" ||
    value.type === "pace_range" ||
    value.type === "cadence_range" ||
    value.type === "rpe"
      ? targetDescriptions[value.type]
      : null;

  return (
    <FormField label={t("workout.stepEditor.target")}>
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {ALLOWED_TARGETS_FOR_RUN.map((kind) => {
            const selected = value.type === kind;
            const disabled = isTargetKindForbidden(kind, intent, durationKind);
            return (
              <Pressable
                key={kind}
                disabled={disabled}
                onPress={() => {
                  selectionFeedback();
                  if (value.type !== kind) onChange(emptyTargetOf(kind));
                }}
                className="rounded-full border px-4 py-2.5 active:opacity-80"
                style={{
                  backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <Text
                  className="font-coach-semibold text-[13px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  {targetLabels[kind]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {description && (
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {description}
          </Text>
        )}
        <TargetInputs value={value} onChange={onChange} />
      </View>
    </FormField>
  );
}

function TargetInputs({
  value,
  onChange,
}: {
  value: NonNullable<Step["target"]>;
  onChange: (target: NonNullable<Step["target"]>) => void;
}) {
  const { t } = useTranslation();
  if (value.type === "none") return null;
  if (value.type === "pace_range") {
    const fastPace = mpsToPaceString(value.max_speed_mps);
    const slowPace = mpsToPaceString(value.min_speed_mps);
    return (
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <PaceInput
            value={fastPace}
            placeholder="4:30"
            onChangeText={(text) => {
              const mps = paceStringToMps(text);
              if (mps == null) return;
              onChange({
                ...value,
                max_speed_mps: mps,
                min_speed_mps: Math.min(value.min_speed_mps, mps),
              });
            }}
          />
          <Text style={{ color: LIGHT_THEME.wMute }}>
            {t("workout.stepEditor.to")}
          </Text>
          <PaceInput
            value={slowPace}
            placeholder="5:00"
            onChangeText={(text) => {
              const mps = paceStringToMps(text);
              if (mps == null) return;
              onChange({
                ...value,
                min_speed_mps: mps,
                max_speed_mps: Math.max(value.max_speed_mps, mps),
              });
            }}
          />
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.stepEditor.pacePerKm")}
          </Text>
        </View>
      </View>
    );
  }
  if (value.type === "cadence_range") {
    return (
      <RangeInput
        min={value.min_spm}
        max={value.max_spm}
        suffix="spm"
        maxLength={3}
        onChange={({ min, max }) =>
          onChange({ type: "cadence_range", min_spm: min, max_spm: max })
        }
      />
    );
  }
  if (value.type === "rpe") {
    return (
      <View className="flex-row flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => {
          const selected = value.value === r;
          return (
            <Pressable
              key={r}
              onPress={() => {
                selectionFeedback();
                onChange({ type: "rpe", value: r });
              }}
              className="size-10 items-center justify-center rounded-xl border active:opacity-80"
              style={{
                backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
              }}
            >
              <Text
                className="font-coach-bold text-[14px]"
                style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
              >
                {r}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  return null;
}

// Composed min:sec input with local-draft state. Drafts are kept raw (no
// zero-padding) so the user can type "5" → "50" without the field jumping
// to "05" mid-stroke. The model is committed on every keystroke (including
// total = 0, which represents the empty "user hasn't filled this in" state).
// Display formatting (mm:ss with padded seconds) lives in formatDuration,
// which only sees committed positive values.
function TimeInput({
  value,
  onChange,
}: {
  value: Extract<Step["duration"], { type: "time" }>;
  onChange: (d: Step["duration"]) => void;
}) {
  const minutes = Math.floor(value.seconds / 60);
  const secs = value.seconds - minutes * 60;

  const [minDraft, setMinDraft] = React.useState(
    minutes > 0 ? String(minutes) : "",
  );
  const [secDraft, setSecDraft] = React.useState(
    secs > 0 ? String(secs) : "",
  );

  React.useEffect(() => {
    setMinDraft(minutes > 0 ? String(minutes) : "");
    setSecDraft(secs > 0 ? String(secs) : "");
  }, [minutes, secs]);

  const commit = (newMin: string, newSec: string) => {
    const m = Number.parseInt(newMin || "0", 10);
    const s = Math.min(59, Number.parseInt(newSec || "0", 10));
    onChange({ type: "time", seconds: m * 60 + s });
  };

  return (
    <View className="flex-row items-center gap-2">
      <NumericInput
        value={minDraft}
        placeholder="min"
        suffix="min"
        onChangeText={(t) => {
          setMinDraft(t);
          commit(t, secDraft);
        }}
      />
      <Text style={{ color: LIGHT_THEME.wMute }}>:</Text>
      <NumericInput
        value={secDraft}
        placeholder="sec"
        suffix="sec"
        maxLength={2}
        onChangeText={(t) => {
          setSecDraft(t);
          commit(minDraft, t);
        }}
      />
    </View>
  );
}

// Composed km:m input mirroring TimeInput. The m field is hard-capped to
// 3 digits via the input's maxLength so we never need a post-hoc clamp;
// 1 km ≡ 1000 m always lives in the km field. The model is committed on
// every keystroke including total = 0 (empty sentinel).
function DistanceInput({
  value,
  onChange,
}: {
  value: Extract<Step["duration"], { type: "distance" }>;
  onChange: (d: Step["duration"]) => void;
}) {
  const km = Math.floor(value.meters / 1000);
  const m = value.meters - km * 1000;

  const [kmDraft, setKmDraft] = React.useState(km > 0 ? String(km) : "");
  const [mDraft, setMDraft] = React.useState(m > 0 ? String(m) : "");

  React.useEffect(() => {
    setKmDraft(km > 0 ? String(km) : "");
    setMDraft(m > 0 ? String(m) : "");
  }, [km, m]);

  const commit = (newKm: string, newM: string) => {
    const k = Number.parseInt(newKm || "0", 10);
    const meters = Number.parseInt(newM || "0", 10);
    onChange({ type: "distance", meters: k * 1000 + meters });
  };

  return (
    <View className="flex-row items-center gap-2">
      <NumericInput
        value={kmDraft}
        placeholder="km"
        suffix="km"
        onChangeText={(t) => {
          setKmDraft(t);
          commit(t, mDraft);
        }}
      />
      <NumericInput
        value={mDraft}
        placeholder="m"
        suffix="m"
        maxLength={3}
        onChangeText={(t) => {
          setMDraft(t);
          commit(kmDraft, t);
        }}
      />
    </View>
  );
}

// Generic min/max range input shared by hr_range and cadence_range. Local-
// draft pattern (raw strings, no clamping during typing) and blur-based
// auto-swap keep the inputs from jumping while the user is mid-edit. The
// model commits on every keystroke including 0 — the parent's isStepValid
// catches the empty case and disables Save.
function RangeInput({
  min,
  max,
  suffix,
  maxLength,
  onChange,
}: {
  min: number;
  max: number;
  suffix: string;
  maxLength?: number;
  onChange: (next: { min: number; max: number }) => void;
}) {
  const { t } = useTranslation();
  const [minDraft, setMinDraft] = React.useState(min > 0 ? String(min) : "");
  const [maxDraft, setMaxDraft] = React.useState(max > 0 ? String(max) : "");

  React.useEffect(() => {
    setMinDraft(min > 0 ? String(min) : "");
    setMaxDraft(max > 0 ? String(max) : "");
  }, [min, max]);

  const commit = (newMin: string, newMax: string) => {
    const a = Number.parseInt(newMin || "0", 10);
    const b = Number.parseInt(newMax || "0", 10);
    onChange({ min: a, max: b });
  };

  const handleBlur = () => {
    const a = Number.parseInt(minDraft || "0", 10);
    const b = Number.parseInt(maxDraft || "0", 10);
    if (a > 0 && b > 0 && a > b) {
      setMinDraft(String(b));
      setMaxDraft(String(a));
      onChange({ min: b, max: a });
    }
  };

  return (
    <View className="flex-row items-center gap-2">
      <NumericInput
        value={minDraft}
        placeholder="min"
        suffix={suffix}
        maxLength={maxLength}
        onChangeText={(t) => {
          setMinDraft(t);
          commit(t, maxDraft);
        }}
        onBlur={handleBlur}
      />
      <Text style={{ color: LIGHT_THEME.wMute }}>
        {t("workout.stepEditor.to")}
      </Text>
      <NumericInput
        value={maxDraft}
        placeholder="max"
        suffix={suffix}
        maxLength={maxLength}
        onChangeText={(t) => {
          setMaxDraft(t);
          commit(minDraft, t);
        }}
        onBlur={handleBlur}
      />
    </View>
  );
}

function NumericInput({
  value,
  placeholder,
  onChangeText,
  onBlur,
  decimal = false,
  suffix,
  maxLength,
}: {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  decimal?: boolean;
  suffix?: string;
  maxLength?: number;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <TextInput
        className="h-11 w-20 rounded-xl border px-3 text-center font-coach-medium text-[15px]"
        style={inputStyle}
        placeholder={placeholder}
        placeholderTextColor={LIGHT_THEME.wMute}
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        value={value}
        onChangeText={(t) =>
          onChangeText(t.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, ""))
        }
        onBlur={onBlur}
        maxLength={maxLength}
        selectionColor={COLORS.lime}
        cursorColor={COLORS.lime}
      />
      {suffix && (
        <Text
          className="font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {suffix}
        </Text>
      )}
    </View>
  );
}

function PaceInput({
  value,
  placeholder,
  onChangeText,
}: {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <TextInput
      className="h-11 w-20 rounded-xl border px-3 text-center font-coach-medium text-[15px]"
      style={inputStyle}
      placeholder={placeholder}
      placeholderTextColor={LIGHT_THEME.wMute}
      keyboardType="numbers-and-punctuation"
      value={value}
      onChangeText={(t) => onChangeText(t.replace(/[^0-9:]/g, ""))}
      selectionColor={COLORS.lime}
      cursorColor={COLORS.lime}
      maxLength={5}
    />
  );
}

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};
