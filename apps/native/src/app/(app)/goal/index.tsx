import { RaceCountdown } from "@/components/app/plan/RaceCountdown";
import { mapRaceToGoalData } from "@/components/app/plan/utils";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, View } from "react-native";

function formatSecondsAsClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  if (meters >= 1000) {
    const km = Math.round((meters / 1000) * 10) / 10;
    return `${km} km`;
  }
  return `${meters} m`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-2.5">
      <Text
        className="font-coach-medium text-[13px]"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {label}
      </Text>
      <Text
        className="flex-1 text-right font-coach-semibold text-[13px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function MyGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const activeGoal = useQuery(api.agoge.goals.getMyActiveGoal);
  const abandonGoal = useMutation(api.agoge.goals.abandonMyActiveGoal);

  const confirmSheetRef = React.useRef<BottomSheetModal>(null);
  const [changing, setChanging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirmChange = async () => {
    if (changing) return;
    setChanging(true);
    setError(null);
    try {
      await abandonGoal();
      confirmSheetRef.current?.dismiss();
      router.push("/(app)/goal/new");
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setChanging(false);
    }
  };

  const goal = activeGoal?.goal;
  const race = activeGoal?.race ?? null;

  const targetText =
    goal?.category === "race" && goal.raceTarget
      ? goal.raceTarget.type === "time"
        ? formatSecondsAsClock(goal.raceTarget.seconds)
        : t("goal.myGoal.targetFinish")
      : null;

  const distanceText = race ? formatDistance(race.distanceMeters) : null;

  const locationText = race?.location
    ? [race.location.city, race.location.country].filter(Boolean).join(", ")
    : null;

  return (
    <View className="pt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
      <StatusBar barStyle="dark-content" />
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
          {t("goal.myGoal.title")}
        </Text>
      </View>

      {activeGoal === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={LIGHT_THEME.wMute} />
        </View>
      ) : activeGoal === null ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="text-center font-coach-semibold text-[11px] uppercase"
            style={{ color: LIGHT_THEME.wSub, letterSpacing: 0.05 * 11 }}
          >
            {t("plan.setGoal.eyebrow")}
          </Text>
          <Text
            className="mt-2 text-center font-coach-bold text-[24px]"
            style={{ color: LIGHT_THEME.wText, lineHeight: 30 }}
          >
            {t("plan.setGoal.title")}
          </Text>
          <Text
            className="mt-3 text-center font-coach-medium text-[14px]"
            style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
          >
            {t("plan.setGoal.body")}
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/goal/new")}
            className="mt-8 items-center justify-center self-stretch rounded-full py-4 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            <Text className="font-coach-bold text-[15px]" style={{ color: "#FFFFFF" }}>
              {t("plan.setGoal.cta")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 py-6"
        >
          <View className="w-full max-w-md gap-5 self-center">
            {goal?.category === "race" && race ? (
              <>
                <RaceCountdown race={mapRaceToGoalData(race, activeGoal.plan)} />

                <View
                  className="rounded-2xl px-4 py-2"
                  style={{
                    backgroundColor: LIGHT_THEME.w1,
                    borderWidth: 1,
                    borderColor: LIGHT_THEME.wBrd,
                  }}
                >
                  <Text
                    className="py-2 font-coach-semibold text-[11px] uppercase"
                    style={{ color: LIGHT_THEME.wSub, letterSpacing: 0.05 * 11 }}
                  >
                    {t("goal.myGoal.raceDetailsTitle")}
                  </Text>
                  {targetText && (
                    <DetailRow label={t("goal.myGoal.target")} value={targetText} />
                  )}
                  {distanceText && (
                    <DetailRow
                      label={t("goal.myGoal.distance")}
                      value={distanceText}
                    />
                  )}
                  {locationText && (
                    <DetailRow
                      label={t("goal.myGoal.location")}
                      value={locationText}
                    />
                  )}
                </View>
              </>
            ) : null}

            {error && (
              <Text
                className="font-coach-medium text-[13px]"
                style={{ color: COLORS.red }}
              >
                {error}
              </Text>
            )}

            <Pressable
              onPress={() => {
                setError(null);
                confirmSheetRef.current?.present();
              }}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <Ionicons name="swap-horizontal" size={16} color={LIGHT_THEME.wText} />
              <Text
                className="font-coach-semibold text-sm"
                style={{ color: LIGHT_THEME.wText }}
              >
                {t("goal.myGoal.changeGoal")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <ConfirmationSheet
        sheetRef={confirmSheetRef}
        icon="swap-horizontal"
        title={t("goal.myGoal.confirm.title")}
        description={
          goal?.category === "race"
            ? t("goal.myGoal.confirm.descriptionRace")
            : t("goal.myGoal.confirm.description")
        }
        confirmLabel={t("goal.myGoal.confirm.cta")}
        destructive
        loading={changing}
        onConfirm={handleConfirmChange}
      />
    </View>
  );
}
