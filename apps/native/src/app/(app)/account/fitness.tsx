import { ManualPaceSheet } from "@/components/app/workout/manual-pace-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { formatRelativeShort } from "@/lib/format-relative";
import { paceMpsToMinPerKm } from "@/lib/format-pace";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type RaceKey = "5k" | "10k" | "half" | "marathon";
const RACES: readonly RaceKey[] = ["5k", "10k", "half", "marathon"];

const PACE_KEYS = ["E", "M", "T", "I", "R"] as const;
type PaceKey = (typeof PACE_KEYS)[number];

function formatRaceTime(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s - h * 3600) / 60);
  const sec = s - h * 3600 - m * 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export default function FitnessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snapshot = useQuery(api.agoge.fitness.getFitnessSnapshot);
  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);

  const loading = snapshot === undefined;
  const hasVdot = !!snapshot && snapshot.vdot !== null;

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
          {t("account.fitness.title")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-5 self-center">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={LIGHT_THEME.wText} />
            </View>
          ) : hasVdot ? (
            <>
              <RaceTimesCard predictions={snapshot.predictions!} />
              <PacesCard paces={snapshot.paces!} />
              <VdotCard
                vdot={snapshot.vdot!}
                lastMeasuredAt={snapshot.lastMeasuredAt}
                history={snapshot.history}
              />
              <ReportRaceButton onPress={() => sheetRef.current?.present()} />
            </>
          ) : (
            <EmptyState onReport={() => sheetRef.current?.present()} />
          )}
        </View>
      </ScrollView>

      <ManualPaceSheet sheetRef={sheetRef} />
    </View>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="gap-4 rounded-2xl p-5"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <Text
        className="font-coach-bold text-base"
        style={{ color: LIGHT_THEME.wText }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function RaceTimesCard({
  predictions,
}: {
  predictions: Record<RaceKey, number>;
}) {
  const { t } = useTranslation();
  return (
    <Card title={t("account.fitness.racesTitle")}>
      <View className="gap-2.5">
        {RACES.map((race) => (
          <View
            key={race}
            className="flex-row items-baseline justify-between"
          >
            <Text
              className="font-coach text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {t(`account.fitness.races.${race}`)}
            </Text>
            <Text
              className="font-coach-bold text-[17px] tabular-nums"
              style={{ color: LIGHT_THEME.wText }}
            >
              {formatRaceTime(predictions[race])}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function PacesCard({ paces }: { paces: Record<PaceKey, number> }) {
  const { t } = useTranslation();
  return (
    <Card title={t("account.fitness.pacesTitle")}>
      <View className="gap-3">
        {PACE_KEYS.map((p) => (
          <View key={p} className="gap-0.5">
            <View className="flex-row items-baseline justify-between">
              <Text
                className="font-coach-semibold text-[14px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {t(`account.fitness.paces.${p}.label`)}
              </Text>
              <Text
                className="font-coach-bold text-[15px] tabular-nums"
                style={{ color: LIGHT_THEME.wText }}
              >
                {paceMpsToMinPerKm(paces[p])}
                <Text
                  className="font-coach text-[12px]"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {t("account.fitness.perKm")}
                </Text>
              </Text>
            </View>
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t(`account.fitness.paces.${p}.description`)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function VdotCard({
  vdot,
  lastMeasuredAt,
  history,
}: {
  vdot: number;
  lastMeasuredAt: number | null;
  history: { measuredAt: number; value: number }[];
}) {
  const { t } = useTranslation();
  const relative = lastMeasuredAt
    ? formatRelativeShort(t, new Date(lastMeasuredAt).toISOString())
    : null;

  return (
    <Card title={t("account.fitness.vdotTitle")}>
      <View className="flex-row items-end justify-between">
        <View>
          <Text
            className="font-coach-bold text-[36px] tabular-nums"
            style={{ color: LIGHT_THEME.wText }}
          >
            {vdot.toFixed(1)}
          </Text>
          {relative && (
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t("account.fitness.lastMeasured", { relative })}
            </Text>
          )}
        </View>
        {history.length >= 2 && <VdotSparkline values={history.map((h) => h.value)} />}
      </View>
      <Text
        className="font-coach text-[12px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {t("account.fitness.vdotExplainer")}
      </Text>
    </Card>
  );
}

function VdotSparkline({ values }: { values: number[] }) {
  // Local floor/ceiling so small VDOT moves still look like change. The
  // visual stays "trend in the recent past", not "absolute scale".
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <View className="flex-row items-end gap-1" style={{ height: 36 }}>
      {values.map((v, i) => {
        const isLatest = i === values.length - 1;
        const heightPercent = 20 + ((v - min) / range) * 80;
        return (
          <View
            key={i}
            style={{
              width: 6,
              height: `${heightPercent}%`,
              borderRadius: 2,
              backgroundColor: isLatest ? LIGHT_THEME.wText : "rgba(0,0,0,0.18)",
            }}
          />
        );
      })}
    </View>
  );
}

function ReportRaceButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
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
        {t("account.fitness.reportRaceCta")}
      </Text>
    </Pressable>
  );
}

function EmptyState({ onReport }: { onReport: () => void }) {
  const { t } = useTranslation();
  return (
    <Card title={t("account.fitness.emptyTitle")}>
      <Text
        className="font-coach text-sm"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {t("account.fitness.emptyDescription")}
      </Text>
      <Pressable
        onPress={onReport}
        className="items-center rounded-2xl py-3.5 active:opacity-90"
        style={{ backgroundColor: LIGHT_THEME.wText }}
      >
        <Text
          className="font-coach-bold text-sm"
          style={{ color: "#FFFFFF" }}
        >
          {t("account.fitness.reportRaceCta")}
        </Text>
      </Pressable>
    </Card>
  );
}
