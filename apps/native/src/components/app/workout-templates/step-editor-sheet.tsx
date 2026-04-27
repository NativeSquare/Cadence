import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { FormField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import {
  ALLOWED_TARGETS_FOR_RUN,
  type DurationKind,
  DURATION_LABELS,
  emptyDurationOf,
  emptyTargetOf,
  INTENT_LABELS,
  INTENTS,
  mpsToPaceString,
  paceStringToMps,
  TARGET_LABELS,
} from "@/components/app/workout-templates/workout-helpers";
import type { Step } from "@nativesquare/agoge";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { Pressable, TextInput, View } from "react-native";

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
  const [step, setStep] = React.useState<Step>(
    initial ?? {
      kind: "step",
      intent: "work",
      duration: { type: "time", seconds: 60 },
      target: { type: "none" },
    },
  );

  const handleSave = () => {
    onSave(step);
  };

  return (
    <View className="gap-5 px-5 pb-2 pt-1">
      <Text
        className="font-coach-bold text-[16px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {initial ? "Edit step" : "Add step"}
      </Text>

      <FormField label="Intent">
        <View className="flex-row flex-wrap gap-2">
          {INTENTS.map((intent) => {
            const selected = step.intent === intent;
            return (
              <Pressable
                key={intent}
                onPress={() => {
                  selectionFeedback();
                  setStep((s) => ({ ...s, intent }));
                }}
                className="rounded-full border px-4 py-2 active:opacity-80"
                style={{
                  backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-semibold text-[13px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  {INTENT_LABELS[intent]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>

      <DurationField
        value={step.duration}
        onChange={(d) => setStep((s) => ({ ...s, duration: d }))}
      />

      <TargetField
        value={step.target ?? { type: "none" }}
        onChange={(t) =>
          setStep((s) => ({ ...s, target: t.type === "none" ? undefined : t }))
        }
      />

      <FormField label="Name (optional)">
        <TextInput
          className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
          style={inputStyle}
          placeholder="e.g. Tempo block"
          placeholderTextColor={LIGHT_THEME.wMute}
          value={step.name ?? ""}
          onChangeText={(v) =>
            setStep((s) => ({ ...s, name: v.length > 0 ? v : undefined }))
          }
          maxLength={100}
          selectionColor={COLORS.lime}
          cursorColor={COLORS.lime}
        />
      </FormField>

      <FormField label="Notes (optional)">
        <TextInput
          className="min-h-[64px] rounded-xl border px-4 py-3 font-coach-medium text-[14px]"
          style={inputStyle}
          placeholder="Cues, focus points…"
          placeholderTextColor={LIGHT_THEME.wMute}
          value={step.notes ?? ""}
          onChangeText={(v) =>
            setStep((s) => ({ ...s, notes: v.length > 0 ? v : undefined }))
          }
          maxLength={500}
          multiline
          textAlignVertical="top"
          selectionColor={COLORS.lime}
          cursorColor={COLORS.lime}
        />
      </FormField>

      <View className="gap-2 pt-2">
        <Pressable
          onPress={handleSave}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Text
            className="font-coach-bold text-sm"
            style={{ color: "#FFFFFF" }}
          >
            {initial ? "Save changes" : "Add step"}
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
            Cancel
          </Text>
        </Pressable>
        {onDelete && (
          <Pressable
            onPress={onDelete}
            className="items-center py-2 active:opacity-70"
          >
            <Text
              className="font-coach text-[13px]"
              style={{ color: COLORS.red }}
            >
              Delete step
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function DurationField({
  value,
  onChange,
}: {
  value: Step["duration"];
  onChange: (d: Step["duration"]) => void;
}) {
  return (
    <FormField label="Duration">
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(DURATION_LABELS) as DurationKind[]).map((kind) => {
            const selected = value.type === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => {
                  selectionFeedback();
                  if (value.type !== kind) onChange(emptyDurationOf(kind));
                }}
                className="rounded-full border px-4 py-2 active:opacity-80"
                style={{
                  backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-semibold text-[13px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  {DURATION_LABELS[kind]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  if (value.type === "open") {
    return (
      <Text
        className="font-coach text-[12px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        Athlete decides when to lap.
      </Text>
    );
  }
  if (value.type === "time") {
    const minutes = Math.floor(value.seconds / 60);
    const secs = value.seconds - minutes * 60;
    return (
      <View className="flex-row items-center gap-2">
        <NumericInput
          value={minutes > 0 ? String(minutes) : ""}
          placeholder="min"
          onChangeText={(t) => {
            const m = Number.parseInt(t || "0", 10);
            onChange({ type: "time", seconds: Math.max(1, m * 60 + secs) });
          }}
        />
        <Text style={{ color: LIGHT_THEME.wMute }}>:</Text>
        <NumericInput
          value={String(secs).padStart(2, "0")}
          placeholder="sec"
          onChangeText={(t) => {
            const s = Math.min(59, Math.max(0, Number.parseInt(t || "0", 10)));
            onChange({
              type: "time",
              seconds: Math.max(1, minutes * 60 + s),
            });
          }}
        />
      </View>
    );
  }
  if (value.type === "distance") {
    const km = value.meters / 1000;
    return (
      <NumericInput
        value={km > 0 ? String(km) : ""}
        placeholder="km"
        decimal
        suffix="km"
        onChangeText={(t) => {
          const n = Number.parseFloat(t);
          onChange({
            type: "distance",
            meters: Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 1,
          });
        }}
      />
    );
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
  if (value.type === "hr_gate" || value.type === "power_gate") {
    const isHr = value.type === "hr_gate";
    const numericValue = isHr ? value.bpm : value.watts;
    const suffix = isHr ? "bpm" : "W";
    return (
      <View className="gap-2">
        <View className="flex-row gap-2">
          {(["above", "below"] as const).map((cmp) => {
            const selected = value.comparator === cmp;
            return (
              <Pressable
                key={cmp}
                onPress={() => {
                  selectionFeedback();
                  onChange({ ...value, comparator: cmp });
                }}
                className="flex-1 items-center rounded-xl border py-2.5 active:opacity-80"
                style={{
                  backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-semibold text-[13px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  Until {cmp}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <NumericInput
          value={numericValue > 0 ? String(numericValue) : ""}
          placeholder={suffix}
          suffix={suffix}
          onChangeText={(t) => {
            const n = Number.parseInt(t || "0", 10);
            const next = Math.max(1, n);
            onChange(
              isHr
                ? { type: "hr_gate", bpm: next, comparator: value.comparator }
                : {
                    type: "power_gate",
                    watts: next,
                    comparator: value.comparator,
                  },
            );
          }}
        />
      </View>
    );
  }
  return null;
}

function TargetField({
  value,
  onChange,
}: {
  value: NonNullable<Step["target"]>;
  onChange: (t: NonNullable<Step["target"]>) => void;
}) {
  return (
    <FormField label="Target">
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {ALLOWED_TARGETS_FOR_RUN.map((kind) => {
            const selected = value.type === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => {
                  selectionFeedback();
                  if (value.type !== kind) onChange(emptyTargetOf(kind));
                }}
                className="rounded-full border px-4 py-2 active:opacity-80"
                style={{
                  backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-semibold text-[13px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  {TARGET_LABELS[kind]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  onChange: (t: NonNullable<Step["target"]>) => void;
}) {
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
          <Text style={{ color: LIGHT_THEME.wMute }}>to</Text>
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
            min/km
          </Text>
        </View>
      </View>
    );
  }
  if (value.type === "hr_range") {
    return (
      <View className="flex-row items-center gap-2">
        <NumericInput
          value={value.min_bpm > 0 ? String(value.min_bpm) : ""}
          placeholder="min"
          onChangeText={(t) => {
            const n = Number.parseInt(t || "0", 10);
            onChange({ ...value, min_bpm: Math.max(1, n) });
          }}
        />
        <Text style={{ color: LIGHT_THEME.wMute }}>to</Text>
        <NumericInput
          value={value.max_bpm > 0 ? String(value.max_bpm) : ""}
          placeholder="max"
          onChangeText={(t) => {
            const n = Number.parseInt(t || "0", 10);
            onChange({ ...value, max_bpm: Math.max(1, n) });
          }}
        />
        <Text
          className="font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          bpm
        </Text>
      </View>
    );
  }
  if (value.type === "hr_zone") {
    return (
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((z) => {
          const selected = value.zone === z;
          return (
            <Pressable
              key={z}
              onPress={() => {
                selectionFeedback();
                onChange({ type: "hr_zone", zone: z });
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
                {z}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (value.type === "cadence_range") {
    return (
      <View className="flex-row items-center gap-2">
        <NumericInput
          value={value.min_spm > 0 ? String(value.min_spm) : ""}
          placeholder="min"
          onChangeText={(t) => {
            const n = Number.parseInt(t || "0", 10);
            onChange({ ...value, min_spm: Math.max(1, n) });
          }}
        />
        <Text style={{ color: LIGHT_THEME.wMute }}>to</Text>
        <NumericInput
          value={value.max_spm > 0 ? String(value.max_spm) : ""}
          placeholder="max"
          onChangeText={(t) => {
            const n = Number.parseInt(t || "0", 10);
            onChange({ ...value, max_spm: Math.max(1, n) });
          }}
        />
        <Text
          className="font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          spm
        </Text>
      </View>
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

function NumericInput({
  value,
  placeholder,
  onChangeText,
  decimal = false,
  suffix,
}: {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  decimal?: boolean;
  suffix?: string;
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
