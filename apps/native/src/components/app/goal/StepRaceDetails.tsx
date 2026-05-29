import {
  DISCIPLINES,
  FORMATS,
  getRaceDateBounds,
  getRaceDateError,
  type Discipline,
  type Format,
} from "@/components/app/account/race-form";
import { DateField, FormField, PillSelect } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import type { RaceDetailsValue } from "./types";

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

const CUSTOM_DISTANCE_MAX_KM = 500;

function clampDistanceKm(input: string): string {
  let cleaned = input.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (cleaned === "" || cleaned === ".") return cleaned;
  const num = Number.parseFloat(cleaned);
  if (Number.isFinite(num) && num > CUSTOM_DISTANCE_MAX_KM) {
    return String(CUSTOM_DISTANCE_MAX_KM);
  }
  return cleaned;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function StepRaceDetails({
  value,
  onChange,
}: {
  value: RaceDetailsValue;
  onChange: (next: RaceDetailsValue) => void;
}) {
  const { t } = useTranslation();

  const formatLabels = useMemo<Record<Format, string>>(
    () => ({
      "5k": t("account.races.form.formats.5k"),
      "10k": t("account.races.form.formats.10k"),
      "15k": t("account.races.form.formats.15k"),
      half_marathon: t("account.races.form.formats.half_marathon"),
      marathon: t("account.races.form.formats.marathon"),
      custom: t("account.races.form.formats.custom"),
    }),
    [t],
  );

  const disciplineLabels = useMemo<Record<Discipline, string>>(
    () => ({
      road: t("account.races.form.disciplines.road"),
      trail: t("account.races.form.disciplines.trail"),
      track: t("account.races.form.disciplines.track"),
      cross_country: t("account.races.form.disciplines.cross_country"),
    }),
    [t],
  );

  const dateBounds = useMemo(
    () => getRaceDateBounds(todayIso(), value.format === "" ? undefined : value.format),
    [value.format],
  );

  const dateError = useMemo(() => {
    const err = getRaceDateError(
      todayIso(),
      value.date,
      value.format === "" ? undefined : value.format,
    );
    if (!err) return undefined;
    const key =
      err.kind === "too_far"
        ? "goal.raceDetails.tooFarForFormat"
        : "goal.raceDetails.tooSoonForFormat";
    return t(key, {
      format: formatLabels[err.format],
      minWeeks: err.weeks,
      maxWeeks: err.weeks,
      days: err.days,
    });
  }, [t, value.date, value.format, formatLabels]);

  return (
    <View className="gap-5">
      <Text
        className="font-coach-extrabold text-[24px]"
        style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
      >
        {t("goal.raceDetails.heading")}
      </Text>

      <FormField label={t("goal.raceDetails.name")}>
        <TextInput
          className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
          style={inputStyle}
          placeholder={t("goal.raceDetails.namePlaceholder")}
          placeholderTextColor={LIGHT_THEME.wMute}
          value={value.name}
          onChangeText={(v) => onChange({ ...value, name: v })}
          selectionColor={COLORS.lime}
          cursorColor={COLORS.lime}
        />
      </FormField>

      <FormField label={t("goal.raceDetails.format")}>
        <PillSelect
          options={FORMATS}
          labels={formatLabels}
          value={value.format || undefined}
          onChange={(v) => onChange({ ...value, format: v })}
        />
      </FormField>

      {value.format === "custom" && (
        <FormField label={t("goal.raceDetails.customDistance")}>
          <View className="flex-row items-center gap-3">
            <TextInput
              className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
              style={inputStyle}
              placeholder={t("goal.raceDetails.customDistancePlaceholder")}
              placeholderTextColor={LIGHT_THEME.wMute}
              keyboardType="decimal-pad"
              value={value.customDistanceKm}
              onChangeText={(v) =>
                onChange({ ...value, customDistanceKm: clampDistanceKm(v) })
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

      <DateField
        label={t("goal.raceDetails.date")}
        value={value.date || undefined}
        onChange={(v) => onChange({ ...value, date: v })}
        minDate={dateBounds.minYmd}
        maxDate={dateBounds.maxYmd}
        error={dateError}
        calendar
        disabled={value.format === ""}
        note={
          value.format === "5k"
            ? t("goal.raceDetails.fiveKWindowNote")
            : undefined
        }
      />

      <FormField label={t("goal.raceDetails.discipline")}>
        <PillSelect
          options={DISCIPLINES}
          labels={disciplineLabels}
          value={value.discipline || undefined}
          onChange={(v) => onChange({ ...value, discipline: v })}
        />
      </FormField>
    </View>
  );
}
