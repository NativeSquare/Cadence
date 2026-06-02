/**
 * RescheduleSheet — move a planned workout by exactly ±1 day.
 *
 * The only valid targets are the day before and the day after the workout's
 * current date. Each is offered as a selectable date option, disabled (with a
 * localized reason) when it falls in the past, already holds a workout, or
 * would break a coaching cap. The authoritative answer comes from the backend
 * `dryRunRescheduleAdjacent` query — we never duplicate that logic client-side.
 */

import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { formatLongDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import type { TFunction } from "i18next";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

export interface RescheduleSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  workoutId: string;
  plannedDate: string;
  onSuccess?: () => void;
}

/** Add `days` to a YYYY-MM-DD calendar date, returning YYYY-MM-DD. */
function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Noon-UTC instant for a calendar day — matches the backend date contract. */
function ymdToNoonUtc(ymd: string): string {
  return `${ymd}T12:00:00.000Z`;
}

function reasonLabel(t: TFunction, reason: string, fallback: string): string {
  const key = `workout.reschedule.reasons.${reason}`;
  const translated = t(key);
  return translated && translated !== key ? translated : fallback;
}

export function RescheduleSheet({
  sheetRef,
  workoutId,
  plannedDate,
  onSuccess,
}: RescheduleSheetProps) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const reschedule = useMutation(api.agoge.workouts.rescheduleWorkoutAdjacent);

  const plannedYmd = plannedDate.slice(0, 10);
  const options = React.useMemo(
    () => [
      { ymd: addDaysYmd(plannedYmd, -1), labelKey: "previousDay" as const },
      { ymd: addDaysYmd(plannedYmd, 1), labelKey: "nextDay" as const },
    ],
    [plannedYmd],
  );

  const [selectedYmd, setSelectedYmd] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedYmd) return;
    setSubmitting(true);
    setError(null);
    try {
      await reschedule({ workoutId, date: ymdToNoonUtc(selectedYmd) });
      sheetRef.current?.dismiss();
      onSuccess?.();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor={LIGHT_THEME.w2}
      borderRadius={28}
      onDismiss={() => {
        setSelectedYmd(null);
        setError(null);
      }}
    >
      <View className="gap-5 px-5 pb-2 pt-2">
        <View className="gap-1">
          <Text
            className="font-coach-bold text-xl"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.reschedule.title")}
          </Text>
          <Text
            className="font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.reschedule.subtitle")}
          </Text>
        </View>

        <View className="gap-2.5">
          {options.map((opt) => (
            <RescheduleOption
              key={opt.ymd}
              workoutId={workoutId}
              ymd={opt.ymd}
              labelKey={opt.labelKey}
              locale={locale}
              selected={selectedYmd === opt.ymd}
              onSelect={() => {
                selectionFeedback();
                setSelectedYmd(opt.ymd);
                setError(null);
              }}
            />
          ))}
        </View>

        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleConfirm}
          disabled={!selectedYmd || submitting}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: LIGHT_THEME.wText,
            opacity: !selectedYmd || submitting ? 0.4 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-coach-bold text-sm" style={{ color: "#FFFFFF" }}>
              {t("workout.reschedule.confirm")}
            </Text>
          )}
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function RescheduleOption({
  workoutId,
  ymd,
  labelKey,
  locale,
  selected,
  onSelect,
}: {
  workoutId: string;
  ymd: string;
  labelKey: "previousDay" | "nextDay";
  locale: ReturnType<typeof useLanguage>;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const check = useQuery(api.agoge.workouts.dryRunRescheduleAdjacent, {
    workoutId,
    date: ymdToNoonUtc(ymd),
  });

  const loading = check === undefined;
  const disabled = loading || !check.ok;
  const reason =
    check && !check.ok ? reasonLabel(t, check.reason, check.message) : null;

  const dateLabel = formatLongDate(locale, new Date(`${ymd}T12:00:00`));

  return (
    <Pressable
      onPress={disabled ? undefined : onSelect}
      disabled={disabled}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{
        backgroundColor: selected ? LIGHT_THEME.w3 : LIGHT_THEME.w1,
        borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons
        name={labelKey === "previousDay" ? "arrow-back" : "arrow-forward"}
        size={18}
        color={LIGHT_THEME.wMute}
      />
      <View className="flex-1">
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t(`workout.reschedule.${labelKey}`)}
        </Text>
        <Text
          className="mt-0.5 font-coach-semibold text-[15px] capitalize"
          style={{ color: LIGHT_THEME.wText }}
        >
          {dateLabel}
        </Text>
        {reason && (
          <Text
            className="mt-0.5 font-coach text-[12px]"
            style={{ color: COLORS.red }}
          >
            {reason}
          </Text>
        )}
      </View>
      {loading ? (
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={20} color={LIGHT_THEME.wText} />
      ) : null}
    </Pressable>
  );
}

export default RescheduleSheet;
