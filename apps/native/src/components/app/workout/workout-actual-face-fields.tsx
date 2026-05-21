import { DateField, FormField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

type TierKey = "easy" | "moderate" | "hard" | "max";
const RPE_TIERS: { key: TierKey; min: number; max: number; color: string }[] = [
  { key: "easy", min: 1, max: 3, color: COLORS.grn },
  { key: "moderate", min: 4, max: 6, color: COLORS.ylw },
  { key: "hard", min: 7, max: 8, color: COLORS.red },
  { key: "max", min: 9, max: 10, color: COLORS.red },
];
function rpeTier(value: number | undefined): (typeof RPE_TIERS)[number] | null {
  if (value == null) return null;
  return RPE_TIERS.find((t) => value >= t.min && value <= t.max) ?? null;
}

export function WorkoutActualFaceFields<T extends FieldValues>({
  control,
  faceName,
  dateLabel,
  maxDate,
  dateError,
}: {
  control: Control<T>;
  faceName: string;
  dateLabel?: string;
  maxDate?: string;
  dateError?: string | null;
}) {
  const { t } = useTranslation();
  const c = control as unknown as Control<FieldValues>;
  const resolvedDateLabel = dateLabel ?? t("workout.fields.dateAndStartTime");

  return (
    <View className="gap-5">
      <Controller
        control={c}
        name={`${faceName}.date`}
        render={({ field }) => (
          <DateField
            label={resolvedDateLabel}
            mode="datetime"
            value={field.value || undefined}
            onChange={field.onChange}
            maxDate={maxDate}
            error={dateError ?? undefined}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={c}
            name={`${faceName}.distanceMeters`}
            render={({ field, fieldState }) => (
              <DistanceField
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={c}
            name={`${faceName}.durationSeconds`}
            render={({ field, fieldState }) => (
              <DurationField
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={c}
        name={`${faceName}.rpe`}
        render={({ field }) => (
          <RpeField value={field.value} onChange={field.onChange} />
        )}
      />

      <Controller
        control={c}
        name={`${faceName}.notes`}
        render={({ field, fieldState }) => (
          <FormField
            label={t("workout.fields.notesOptional")}
            error={fieldState.error?.message}
          >
            <TextInput
              className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
              style={inputStyle}
              placeholder={t("workout.fields.notesPlaceholder")}
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
    </View>
  );
}

function DistanceField({
  value,
  onChange,
  error,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const initialKm = value != null ? (value / 1000).toString() : "";
  const [text, setText] = React.useState<string>(initialKm);
  React.useEffect(() => {
    setText(value != null ? (value / 1000).toString() : "");
  }, [value]);

  return (
    <FormField label={t("workout.fields.distanceKm")} error={error}>
      <View
        className="h-12 flex-row items-center rounded-xl border px-4"
        style={inputStyle}
      >
        <TextInput
          value={text}
          onChangeText={(raw) => {
            const normalized = raw.replace(",", ".");
            setText(normalized);
            if (normalized === "") {
              onChange(undefined);
              return;
            }
            const parsed = Number.parseFloat(normalized);
            onChange(
              Number.isFinite(parsed) ? Math.round(parsed * 1000) : undefined,
            );
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="5.0"
          placeholderTextColor={LIGHT_THEME.wMute}
          className="flex-1 font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
          selectionColor={COLORS.lime}
          cursorColor={COLORS.lime}
        />
        <Text
          className="font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("workout.fields.distanceUnit")}
        </Text>
      </View>
    </FormField>
  );
}

function DurationField({
  value,
  onChange,
  error,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const initial = secondsToHm(value);
  const [hours, setHours] = React.useState<string>(initial.hours);
  const [minutes, setMinutes] = React.useState<string>(initial.minutes);

  React.useEffect(() => {
    const next = secondsToHm(value);
    setHours(next.hours);
    setMinutes(next.minutes);
  }, [value]);

  const commit = (h: string, m: string) => {
    const hh = Number.parseInt(h, 10);
    const mm = Number.parseInt(m, 10);
    const total =
      (Number.isFinite(hh) ? hh : 0) * 3600 +
      (Number.isFinite(mm) ? mm : 0) * 60;
    onChange(total > 0 ? total : undefined);
  };

  return (
    <FormField label={t("workout.fields.duration")} error={error}>
      <View className="flex-row gap-2">
        <View
          className="h-12 flex-1 flex-row items-center rounded-xl border px-3"
          style={inputStyle}
        >
          <TextInput
            value={hours}
            onChangeText={(raw) => {
              const digits = raw.replace(/\D/g, "");
              setHours(digits);
              commit(digits, minutes);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={2}
            placeholder="0"
            placeholderTextColor={LIGHT_THEME.wMute}
            className="flex-1 text-center font-coach-medium text-[15px]"
            style={{ color: LIGHT_THEME.wText }}
            selectionColor={COLORS.lime}
            cursorColor={COLORS.lime}
          />
          <Text
            className="font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.fields.durationHours")}
          </Text>
        </View>
        <View
          className="h-12 flex-1 flex-row items-center rounded-xl border px-3"
          style={inputStyle}
        >
          <TextInput
            value={minutes}
            onChangeText={(raw) => {
              const digits = raw.replace(/\D/g, "");
              setMinutes(digits);
              commit(hours, digits);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={2}
            placeholder="0"
            placeholderTextColor={LIGHT_THEME.wMute}
            className="flex-1 text-center font-coach-medium text-[15px]"
            style={{ color: LIGHT_THEME.wText }}
            selectionColor={COLORS.lime}
            cursorColor={COLORS.lime}
          />
          <Text
            className="font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.fields.durationMinutes")}
          </Text>
        </View>
      </View>
    </FormField>
  );
}

function secondsToHm(total: number | undefined): {
  hours: string;
  minutes: string;
} {
  if (total == null || total <= 0) return { hours: "", minutes: "" };
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return { hours: h > 0 ? String(h) : "", minutes: m > 0 ? String(m) : "" };
}

function RpeField({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const tier = rpeTier(value);

  return (
    <FormField label={t("workout.fields.rpe")}>
      <View className="gap-2">
        <View className="flex-row gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = value === n;
            return (
              <Pressable
                key={n}
                onPress={() => {
                  selectionFeedback();
                  onChange(selected ? undefined : n);
                }}
                className="flex-1 items-center justify-center rounded-xl active:opacity-80"
                style={{
                  paddingVertical: 10,
                  backgroundColor: selected
                    ? LIGHT_THEME.wText
                    : LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                }}
                accessibilityLabel={t("workout.markDone.rpeValueLabel", {
                  value: n,
                })}
                accessibilityState={{ selected }}
              >
                <Text
                  className="font-coach-bold text-[14px]"
                  style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="min-h-[16px] items-center">
          {tier && (
            <View className="flex-row items-center gap-2">
              <View
                className="size-2 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              <Text
                className="font-coach-bold text-[11px] uppercase tracking-widest"
                style={{ color: tier.color }}
              >
                {t(`workout.markDone.tiers.${tier.key}`)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </FormField>
  );
}
