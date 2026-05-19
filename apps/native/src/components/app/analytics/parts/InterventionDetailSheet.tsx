/**
 * Tap-detail bottom sheet for an intervention dot on an Analytics chart.
 *
 * Designed for the runner first: leads with the plain-language sentence the
 * push notification already showed (or a deterministic fallback), then
 * surfaces the original→new diff. The numeric signals (z-score, baseline)
 * stay collapsed under a small "Details" disclosure so a non-technical
 * reader doesn't get hit with units up front.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import type { ChartIntervention } from "./InterventionMarkers";

type Props = {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  intervention: ChartIntervention | null;
};

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

export function InterventionDetailSheet({ sheetRef, intervention }: Props) {
  const { t, i18n } = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);

  // Reset disclosure each time a new intervention is opened.
  React.useEffect(() => {
    setShowDetails(false);
  }, [intervention?._id]);

  if (!intervention) {
    return <BottomSheetModal ref={sheetRef}>{null}</BottomSheetModal>;
  }

  const reverted = intervention.revertedAt != null;
  const date = new Date(intervention.firedAt);
  const dateLabel = date.toLocaleDateString(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Prefer the LLM-generated prose if present; fall back to a deterministic
  // sentence so the sheet is always readable.
  const sentence =
    intervention.notificationBody?.trim() ||
    t("analytics.intervention.fallbackSentence", {
      original: intervention.originalName,
      newName: intervention.newName,
    });

  return (
    <BottomSheetModal ref={sheetRef}>
      <View className="gap-5 px-6 pb-2 pt-1">
        <View className="flex-row items-center gap-2.5">
          <View
            className="size-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(200,255,0,0.18)" }}
          >
            <Ionicons name="sparkles-outline" size={18} color="#5C7700" />
          </View>
          <View className="flex-1">
            <Text
              className="font-coach-bold text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {t("analytics.intervention.sheetTitle")}
            </Text>
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {dateLabel}
            </Text>
          </View>
        </View>

        <Text
          className="font-coach text-[14px] leading-5"
          style={{ color: LIGHT_THEME.wText }}
        >
          {sentence}
        </Text>

        <View className="flex-row gap-3">
          <DiffColumn
            label={t("analytics.intervention.diffOriginal")}
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
            label={t("analytics.intervention.diffNew")}
            name={intervention.newName}
            detail={summary({
              distanceMeters: intervention.newDistanceMeters,
              durationSeconds: intervention.newDurationSeconds,
            })}
            accent={!reverted}
          />
        </View>

        {reverted ? (
          <Text
            className="font-coach text-[12px] italic"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("analytics.intervention.revertedLabel")}
          </Text>
        ) : null}

        <View>
          <Text
            onPress={() => setShowDetails((v) => !v)}
            className="font-coach-semibold text-[12px]"
            style={{ color: LIGHT_THEME.wSub }}
          >
            {showDetails
              ? t("analytics.intervention.hideDetails")
              : t("analytics.intervention.showDetails")}
          </Text>
          {showDetails ? (
            <View className="mt-2 gap-1">
              <Text
                className="font-coach text-[12px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                •{" "}
                {t("analytics.intervention.signals.hrv", {
                  today: Math.round(intervention.signals.hrvToday),
                  baseline: Math.round(intervention.signals.hrvBaseline14d),
                  z: intervention.signals.hrvZScore.toFixed(1),
                })}
              </Text>
              {intervention.signals.sleepHoursLastNight != null ? (
                <Text
                  className="font-coach text-[12px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  •{" "}
                  {t("analytics.intervention.signals.sleep", {
                    hours:
                      intervention.signals.sleepHoursLastNight.toFixed(1),
                  })}
                </Text>
              ) : null}
              {intervention.signals.rhrToday != null ? (
                <Text
                  className="font-coach text-[12px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  •{" "}
                  {t("analytics.intervention.signals.rhr", {
                    bpm: Math.round(intervention.signals.rhrToday),
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </BottomSheetModal>
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
