import { FORMAT_DISTANCE_METERS } from "@/components/app/account/race-form";
import { FormField, PillSelect, TimeField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export type SeedRaceFormat = "5k" | "10k" | "15k" | "half_marathon" | "marathon";

export type RecentRaceValue = {
  format: SeedRaceFormat | "";
  hours: string;
  minutes: string;
  seconds: string;
};

export const EMPTY_RECENT_RACE: RecentRaceValue = {
  format: "",
  hours: "",
  minutes: "",
  seconds: "",
};

const FORMATS: readonly SeedRaceFormat[] = [
  "5k",
  "10k",
  "15k",
  "half_marathon",
  "marathon",
];

export function recentRaceToSeconds(value: RecentRaceValue): number {
  const h = Number.parseInt(value.hours || "0", 10);
  const m = Number.parseInt(value.minutes || "0", 10);
  const s = Number.parseInt(value.seconds || "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return 0;
  if (m >= 60 || s >= 60) return 0;
  return h * 3600 + m * 60 + s;
}

export function recentRaceToDistanceMeters(value: RecentRaceValue): number {
  if (value.format === "") return 0;
  return FORMAT_DISTANCE_METERS[value.format];
}

export function isRecentRaceValid(value: RecentRaceValue): boolean {
  return recentRaceToDistanceMeters(value) > 0 && recentRaceToSeconds(value) > 0;
}

export function StepRecentRace({
  value,
  onChange,
}: {
  value: RecentRaceValue;
  onChange: (next: RecentRaceValue) => void;
}) {
  const { t } = useTranslation();

  const formatLabels: Record<SeedRaceFormat, string> = {
    "5k": t("account.races.form.formats.5k"),
    "10k": t("account.races.form.formats.10k"),
    "15k": t("account.races.form.formats.15k"),
    half_marathon: t("account.races.form.formats.half_marathon"),
    marathon: t("account.races.form.formats.marathon"),
  };

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text
          className="font-coach-extrabold text-[24px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
        >
          {t("onboarding.recentRace.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[14px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
        >
          {t("onboarding.recentRace.helper")}
        </Text>
      </View>

      <FormField label={t("onboarding.recentRace.distanceLabel")}>
        <PillSelect
          options={FORMATS}
          labels={formatLabels}
          value={value.format}
          onChange={(v) => onChange({ ...value, format: v })}
        />
      </FormField>

      <TimeField
        label={t("onboarding.recentRace.timeLabel")}
        hours={Number.parseInt(value.hours || "0", 10) || 0}
        minutes={Number.parseInt(value.minutes || "0", 10) || 0}
        seconds={Number.parseInt(value.seconds || "0", 10) || 0}
        onChange={({ hours, minutes, seconds }) =>
          onChange({
            ...value,
            hours: String(hours),
            minutes: String(minutes),
            seconds: String(seconds),
          })
        }
        labels={{
          hours: t("onboarding.recentRace.hours"),
          minutes: t("onboarding.recentRace.minutes"),
          seconds: t("onboarding.recentRace.seconds"),
        }}
      />
    </View>
  );
}
