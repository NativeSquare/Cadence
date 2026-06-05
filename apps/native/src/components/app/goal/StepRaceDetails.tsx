import {
  FORMATS,
  getRaceDateBounds,
  getRaceDateError,
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

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Where the date spinner opens when nothing's chosen yet: a comfortable
// 6 weeks out rather than the bare 4-week minimum. DateField clamps this
// into the format's allowed window, so it's only a starting hint.
const DEFAULT_RACE_LEAD_WEEKS = 6;

function defaultRaceDateIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + DEFAULT_RACE_LEAD_WEEKS * 7);
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
      half_marathon: t("account.races.form.formats.half_marathon"),
      marathon: t("account.races.form.formats.marathon"),
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

      <DateField
        label={t("goal.raceDetails.date")}
        value={value.date || undefined}
        onChange={(v) => onChange({ ...value, date: v })}
        minDate={dateBounds.minYmd}
        maxDate={dateBounds.maxYmd}
        defaultDate={defaultRaceDateIso()}
        error={dateError}
        calendar
        disabled={value.format === ""}
        note={
          value.format === "5k"
            ? t("goal.raceDetails.fiveKWindowNote")
            : undefined
        }
      />
    </View>
  );
}
