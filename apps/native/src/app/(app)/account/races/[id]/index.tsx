import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import type { GoalStatus } from "@nativesquare/agoge/schema";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, View } from "react-native";
import type { TFunction } from "i18next";

type RaceWithGoal = NonNullable<
  ReturnType<typeof useQuery<typeof api.agoge.races.getMyRaceWithGoal>>
>;
type RaceDoc = RaceWithGoal["race"];

const PRIORITY_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.lime,
  B: LIGHT_THEME.w3,
  C: LIGHT_THEME.w3,
};

const PRIORITY_TEXT_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.black,
  B: LIGHT_THEME.wText,
  C: LIGHT_THEME.wSub,
};

const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  active: COLORS.lime,
  achieved: COLORS.lime,
  missed: COLORS.red,
  abandoned: LIGHT_THEME.wMute,
  paused: LIGHT_THEME.wMute,
};

function statusLabel(t: TFunction, status: string): string {
  const key = `account.races.form.statusLabels.${status}`;
  const translated = t(key);
  return translated && translated !== key ? translated : status;
}

function goalStatusLabel(t: TFunction, status: GoalStatus): string {
  const key = `account.races.goal.statuses.${status}`;
  const translated = t(key);
  return translated && translated !== key ? translated : status;
}

function goalTypeLabel(
  t: TFunction,
  raceTarget: { type: "finish" } | { type: "time"; seconds: number },
): string {
  const goalKey = raceTarget.type === "finish" ? "completion" : "performance";
  const key = `account.races.form.goalTypes.${goalKey}`;
  const translated = t(key);
  return translated && translated !== key ? translated : goalKey;
}

function formatRaceTargetValue(
  t: TFunction,
  raceTarget: { type: "finish" } | { type: "time"; seconds: number },
): string {
  if (raceTarget.type === "finish") {
    return t("account.races.goal.targetFinish");
  }
  const seconds = raceTarget.seconds;
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    const rounded = Math.round(km * 10) / 10;
    return `${rounded} km`;
  }
  return `${meters} m`;
}

function formatLocation(loc?: RaceDoc["location"]): string | null {
  if (!loc) return null;
  const parts = [loc.city, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function RaceDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useQuery(api.agoge.races.getMyRaceWithGoal, { raceId: id });

  if (data === undefined) {
    return <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }} />;
  }

  if (data === null) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center px-4"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("account.races.notFound")}
        </Text>
      </View>
    );
  }

  const { race, goal } = data;
  const priority = race.priority as "A" | "B" | "C";
  const distance = formatDistance(race.distanceMeters);
  const locationText = formatLocation(race.location);
  const hasRaceDetails =
    race.elevationGainMeters != null ||
    race.bibNumber ||
    race.registrationUrl;
  const hasResult =
    race.status === "completed" &&
    race.result &&
    (race.result.finishTime ||
      race.result.placement != null ||
      race.result.notes);

  return (
    <View className="pt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("account.races.detail.header")}
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(app)/account/races/[id]/edit",
              params: { id },
            })
          }
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="create-outline" size={18} color={LIGHT_THEME.wText} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-5 self-center">
          <View
            className="flex-row items-center gap-4 rounded-3xl border px-5 py-5"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <View
              className="size-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: PRIORITY_COLORS[priority] }}
            >
              <Text
                className="font-coach-extrabold text-[22px]"
                style={{ color: PRIORITY_TEXT_COLORS[priority] }}
              >
                {priority}
              </Text>
            </View>
            <View className="flex-1 gap-1">
              <Text
                className="font-coach-bold text-[18px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {race.name}
              </Text>
              <Text
                className="font-coach text-[13px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {formatDate(race.date)}
                {distance ? ` · ${distance}` : ""}
              </Text>
              <View
                className="mt-1 self-start rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: LIGHT_THEME.w3 }}
              >
                <Text
                  className="font-coach-semibold text-[10px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {statusLabel(t, race.status)}
                </Text>
              </View>
            </View>
          </View>

          {goal && goal.category === "race" && goal.raceTarget && (
            <View className="gap-2">
              <Text
                className="px-1 font-coach-extrabold text-[11px] uppercase tracking-widest"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {t("account.races.detail.goalSection")}
              </Text>
              <View
                className="gap-2 rounded-2xl border p-4"
                style={{
                  backgroundColor: LIGHT_THEME.w1,
                  borderColor: LIGHT_THEME.wBrd,
                }}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text
                    className="font-coach-semibold text-[10px] uppercase tracking-wider"
                    style={{ color: LIGHT_THEME.wMute }}
                  >
                    {goalTypeLabel(t, goal.raceTarget)}
                  </Text>
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: LIGHT_THEME.w3 }}
                  >
                    <Text
                      className="font-coach-semibold text-[10px]"
                      style={{ color: GOAL_STATUS_COLORS[goal.status] }}
                    >
                      {goalStatusLabel(t, goal.status)}
                    </Text>
                  </View>
                </View>
                <Text
                  className="font-coach-extrabold text-[18px]"
                  style={{ color: LIGHT_THEME.wText }}
                  numberOfLines={1}
                >
                  {formatRaceTargetValue(t, goal.raceTarget)}
                </Text>
              </View>
            </View>
          )}

          {(locationText || race.notes) && (
            <DetailSection title={t("account.races.detail.eventSection")}>
              {locationText && (
                <DetailRow
                  label={t("account.races.detail.rows.location")}
                  value={locationText}
                />
              )}
              {race.notes && (
                <DetailRow
                  label={t("account.races.detail.rows.notes")}
                  value={race.notes}
                />
              )}
            </DetailSection>
          )}

          {hasRaceDetails && (
            <DetailSection title={t("account.races.detail.raceDetailsSection")}>
              {race.elevationGainMeters != null && (
                <DetailRow
                  label={t("account.races.detail.rows.elevationGain")}
                  value={`${race.elevationGainMeters} m`}
                />
              )}
              {race.bibNumber && (
                <DetailRow
                  label={t("account.races.detail.rows.bib")}
                  value={race.bibNumber}
                />
              )}
              {race.registrationUrl && (
                <DetailRow
                  label={t("account.races.detail.rows.registration")}
                  value={race.registrationUrl}
                  onPress={() =>
                    Linking.openURL(race.registrationUrl as string).catch(
                      () => undefined,
                    )
                  }
                />
              )}
            </DetailSection>
          )}

          {hasResult && race.result && (
            <DetailSection title={t("account.races.detail.resultSection")}>
              {race.result.finishTime && (
                <DetailRow
                  label={t("account.races.detail.rows.finishTime")}
                  value={race.result.finishTime}
                />
              )}
              {race.result.placement != null && (
                <DetailRow
                  label={t("account.races.detail.rows.placement")}
                  value={`#${race.result.placement}`}
                />
              )}
              {race.result.notes && (
                <DetailRow
                  label={t("account.races.detail.rows.notes")}
                  value={race.result.notes}
                />
              )}
            </DetailSection>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {title}
      </Text>
      <View
        className="rounded-2xl border"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-start justify-between gap-3 px-4 py-3">
      <Text
        className="font-coach-semibold text-[12px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Text
        className="flex-1 text-right font-coach-medium text-[14px]"
        style={{ color: onPress ? COLORS.lime : LIGHT_THEME.wText }}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }
  return content;
}
