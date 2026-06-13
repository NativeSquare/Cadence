/**
 * Card rendered on the workout detail page when the coach has auto-modified
 * the session in response to a readiness signal (e.g. low HRV).
 *
 * The user reaches this surface either by tapping the push notification or by
 * opening the workout from the today card. The card shows the deterministic
 * signals that triggered the change, the original vs. new shape of the
 * session, and a one-tap "revert" path.
 */

import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";
import type { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Intervention = Doc<"coachInterventions">;

function formatKm(m?: number): string | null {
  if (m == null || m <= 0) return null;
  const km = Math.round((m / 1000) * 10) / 10;
  return `${km} km`;
}

function formatDuration(sec?: number): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const min = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(min).padStart(2, "0")}`;
  return `${min}min`;
}

function summary(args: {
  distanceMeters?: number;
  durationSeconds?: number;
}): string {
  const km = formatKm(args.distanceMeters);
  const dur = formatDuration(args.durationSeconds);
  if (km && dur) return `${km} · ${dur}`;
  return km ?? dur ?? "—";
}

export function CoachInterventionCard({
  intervention,
}: {
  intervention: Intervention;
}) {
  const { t } = useTranslation();
  const revert = useMutation(api.engine.interventions.revertIntervention);
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reverted = intervention.revertedAt != null;
  const title = intervention.notificationTitle ?? t("workout.coachIntervention.cardTitle");

  // Signals section depends on which rule fired. Adherence-driven interventions
  // surface the missed-count; HRV-driven ones surface HRV/sleep/RHR.
  const isAdherence = intervention.ruleId === "adherence_low_v1";
  const signalLines: string[] = [];
  if (isAdherence) {
    signalLines.push(
      t("workout.coachIntervention.signals.adherence", {
        count: intervention.signals.weekMissedQualityCount ?? 0,
      }),
    );
  } else {
    if (intervention.signals.hrvToday != null && intervention.signals.hrvBaseline14d != null) {
      signalLines.push(
        t("workout.coachIntervention.signals.hrv", {
          today: Math.round(intervention.signals.hrvToday),
          baseline: Math.round(intervention.signals.hrvBaseline14d),
        }),
      );
    }
    if (intervention.signals.sleepHoursLastNight != null) {
      signalLines.push(
        t("workout.coachIntervention.signals.sleep", {
          hours: intervention.signals.sleepHoursLastNight.toFixed(1),
        }),
      );
    }
    if (intervention.signals.rhrToday != null) {
      signalLines.push(
        t("workout.coachIntervention.signals.rhr", {
          bpm: Math.round(intervention.signals.rhrToday),
        }),
      );
    }
  }

  const handleRevert = async () => {
    setBusy(true);
    setError(null);
    try {
      await revert({ interventionId: intervention._id });
      sheetRef.current?.dismiss();
    } catch (err) {
      setError(getConvexErrorMessage(err) ?? t("workout.coachIntervention.revertError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      className="gap-4 rounded-2xl border p-4"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: reverted ? LIGHT_THEME.wBrd : COLORS.lime + "55",
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="size-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: reverted
              ? LIGHT_THEME.w3
              : "rgba(200,255,0,0.18)",
          }}
        >
          <Ionicons
            name={reverted ? "arrow-undo-outline" : "sparkles-outline"}
            size={18}
            color={reverted ? LIGHT_THEME.wMute : "#5C7700"}
          />
        </View>
        <View className="flex-1">
          <Text
            className="font-coach-bold text-[15px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {title}
          </Text>
          {intervention.notificationBody && !reverted && (
            <Text
              className="mt-0.5 font-coach text-[13px] leading-5"
              style={{ color: LIGHT_THEME.wSub }}
            >
              {intervention.notificationBody}
            </Text>
          )}
          {reverted && (
            <Text
              className="mt-0.5 font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t("workout.coachIntervention.revertedLabel")}
            </Text>
          )}
        </View>
      </View>

      {signalLines.length > 0 && (
        <View className="gap-1">
          <Text
            className="font-coach-semibold text-[11px] uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.coachIntervention.subtitle")}
          </Text>
          {signalLines.map((line, i) => (
            <Text
              key={i}
              className="font-coach text-[13px] leading-5"
              style={{ color: LIGHT_THEME.wText }}
            >
              • {line}
            </Text>
          ))}
        </View>
      )}

      <View className="flex-row gap-3">
        <DiffColumn
          label={t("workout.coachIntervention.diffOriginal")}
          name={intervention.originalName}
          detail={summary({
            distanceMeters: intervention.originalDistanceMeters,
            durationSeconds: intervention.originalDurationSeconds,
          })}
          strike={!reverted}
        />
        <View
          className="size-6 self-center items-center justify-center rounded-full"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons
            name="arrow-forward"
            size={14}
            color={LIGHT_THEME.wMute}
          />
        </View>
        <DiffColumn
          label={t("workout.coachIntervention.diffNew")}
          name={intervention.newName}
          detail={summary({
            distanceMeters: intervention.newDistanceMeters,
            durationSeconds: intervention.newDurationSeconds,
          })}
          accent={!reverted}
        />
      </View>

      {!reverted && (
        <Pressable
          onPress={() => {
            selectionFeedback();
            sheetRef.current?.present();
          }}
          className="items-center rounded-xl border py-2.5 active:opacity-70"
          style={{
            borderColor: LIGHT_THEME.wBrd,
            backgroundColor: LIGHT_THEME.w1,
          }}
        >
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.coachIntervention.revert")}
          </Text>
        </Pressable>
      )}

      {error && (
        <Text
          className="text-center font-coach text-[12px]"
          style={{ color: COLORS.red }}
        >
          {error}
        </Text>
      )}

      <ConfirmationSheet
        sheetRef={sheetRef}
        icon="arrow-undo-outline"
        title={t("workout.coachIntervention.revertConfirmTitle")}
        description={t("workout.coachIntervention.revertConfirmBody")}
        confirmLabel={t("workout.coachIntervention.revert")}
        loading={busy}
        onConfirm={handleRevert}
      />
    </View>
  );
}

function DiffColumn({
  label,
  name,
  detail,
  strike,
  accent,
}: {
  label: string;
  name: string;
  detail: string;
  strike?: boolean;
  accent?: boolean;
}) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="font-coach-semibold text-[10px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={2}
        className="font-coach-semibold text-[13px]"
        style={{
          color: accent ? "#5C7700" : LIGHT_THEME.wText,
          textDecorationLine: strike ? "line-through" : undefined,
          opacity: strike ? 0.7 : 1,
        }}
      >
        {name}
      </Text>
      <Text
        className="font-coach text-[12px]"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {detail}
      </Text>
    </View>
  );
}
