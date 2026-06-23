/**
 * Cycle — the self-reported menstrual cycle page (ADR-0010). The runner logs the
 * day her period started ("Cycle Start" / J1); the page derives and shows the
 * current cycle day and Phase. Log-only for now: no daily flow, no next-period
 * prediction, no Soma integration. Visible to every runner.
 */

import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { DateField } from "@/components/app/form/date-field";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { formatLongDate } from "@/lib/format";
import { selectionFeedback } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

const PHASES: readonly Phase[] = [
  "menstrual",
  "follicular",
  "ovulatory",
  "luteal",
];

const PHASE_COLORS: Record<Phase, { fg: string; bg: string }> = {
  menstrual: { fg: COLORS.red, bg: COLORS.redDim },
  follicular: { fg: COLORS.grn, bg: COLORS.grnDim },
  ovulatory: { fg: "#5B9EFF", bg: "rgba(91,158,255,0.12)" },
  luteal: { fg: COLORS.ylw, bg: COLORS.ylwDim },
};

/** Local calendar day as YYYY-MM-DD (what the runner means by "today"). */
function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function CycleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const overview = useQuery(api.table.cycleStarts.getCycleOverview);
  const addCycleStart = useMutation(api.table.cycleStarts.addCycleStart);
  const removeCycleStart = useMutation(api.table.cycleStarts.removeCycleStart);

  const [error, setError] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<Id<"cycleStarts"> | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const deleteSheetRef = React.useRef<GorhomBottomSheetModal>(null);

  const loading = overview === undefined;

  const handleAdd = async (ymd: string) => {
    setError(null);
    // Client-side duplicate pre-check — the backend enforces it too, but this
    // gives an instant, localized message instead of a round-trip error.
    const exists = overview?.starts.some((s) => s.dayKey.slice(0, 10) === ymd);
    if (exists) {
      setError(t("account.cycle.duplicateError"));
      return;
    }
    try {
      await addCycleStart({ dayKey: `${ymd}T12:00:00.000Z` });
      selectionFeedback();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeCycleStart({ id: pendingDelete });
      deleteSheetRef.current?.dismiss();
      setPendingDelete(null);
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

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
          {t("account.cycle.title")}
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
          ) : (
            <>
              {overview && overview.derived.phase ? (
                <CurrentCard derived={overview.derived} />
              ) : (
                <EmptyCard />
              )}

              <AddCard onAdd={handleAdd} error={error} />

              {overview && overview.starts.length > 0 && (
                <HistoryCard
                  starts={overview.starts}
                  onDelete={(id) => {
                    setError(null);
                    setPendingDelete(id);
                    deleteSheetRef.current?.present();
                  }}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmationSheet
        sheetRef={deleteSheetRef}
        icon="trash-outline"
        title={t("account.cycle.deleteSheet.title")}
        description={t("account.cycle.deleteSheet.description")}
        confirmLabel={t("account.cycle.deleteSheet.confirm")}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

function Card({
  title,
  children,
}: {
  title?: string;
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
      {title ? (
        <Text
          className="font-coach-bold text-base"
          style={{ color: LIGHT_THEME.wText }}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function CurrentCard({
  derived,
}: {
  derived: NonNullable<
    NonNullable<
      ReturnType<typeof useQuery<typeof api.table.cycleStarts.getCycleOverview>>
    >
  >["derived"];
}) {
  const { t } = useTranslation();
  const phase = derived.phase as Phase;
  const colors = PHASE_COLORS[phase];

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View>
          <Text
            className="font-coach-semibold text-[11px] uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("account.cycle.cycleDayLabel")}
          </Text>
          <Text
            className="font-coach-bold text-[40px] tabular-nums"
            style={{ color: LIGHT_THEME.wText }}
          >
            {derived.cycleDay}
          </Text>
        </View>
        <View
          className="rounded-full px-3.5 py-1.5"
          style={{ backgroundColor: colors.bg }}
        >
          <Text
            className="font-coach-bold text-[13px]"
            style={{ color: colors.fg }}
          >
            {t(`account.cycle.phases.${phase}.label`)}
          </Text>
        </View>
      </View>

      <Text
        className="font-coach text-[13px]"
        style={{ color: LIGHT_THEME.wSub, lineHeight: 19 }}
      >
        {t(`account.cycle.phases.${phase}.hint`)}
      </Text>

      <View
        className="flex-row items-center gap-1.5 border-t pt-3"
        style={{ borderTopColor: LIGHT_THEME.wBrd }}
      >
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={LIGHT_THEME.wMute}
        />
        <Text
          className="flex-1 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {derived.phaseIsEstimate
            ? t("account.cycle.estimateNote")
            : t("account.cycle.cycleLengthNote", {
                days: derived.cycleLengthDays,
              })}
        </Text>
      </View>
    </Card>
  );
}

function EmptyCard() {
  const { t } = useTranslation();
  return (
    <Card title={t("account.cycle.emptyTitle")}>
      <Text
        className="font-coach text-sm"
        style={{ color: LIGHT_THEME.wMute, lineHeight: 20 }}
      >
        {t("account.cycle.emptyDescription")}
      </Text>
    </Card>
  );
}

function AddCard({
  onAdd,
  error,
}: {
  onAdd: (ymd: string) => void;
  error: string | null;
}) {
  const { t } = useTranslation();
  return (
    <Card title={t("account.cycle.addTitle")}>
      <DateField
        label={t("account.cycle.addFieldLabel")}
        placeholder={t("account.cycle.addPlaceholder")}
        maxDate={todayYmd()}
        calendar
        onChange={onAdd}
      />
      {error ? (
        <Text className="font-coach text-[13px]" style={{ color: COLORS.red }}>
          {error}
        </Text>
      ) : null}
    </Card>
  );
}

function HistoryCard({
  starts,
  onDelete,
}: {
  starts: { id: Id<"cycleStarts">; dayKey: string }[];
  onDelete: (id: Id<"cycleStarts">) => void;
}) {
  const { t } = useTranslation();
  const locale = useLanguage();
  return (
    <Card title={t("account.cycle.historyTitle")}>
      <View className="gap-1">
        {starts.map((s, i) => (
          <View
            key={s.id}
            className="flex-row items-center justify-between py-2.5"
            style={
              i < starts.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
                : undefined
            }
          >
            <Text
              className="font-coach-medium text-[15px] capitalize"
              style={{ color: LIGHT_THEME.wText }}
            >
              {formatLongDate(locale, new Date(`${s.dayKey.slice(0, 10)}T12:00:00`))}
            </Text>
            <Pressable
              onPress={() => onDelete(s.id)}
              hitSlop={10}
              className="size-8 items-center justify-center rounded-full active:opacity-70"
            >
              <Ionicons name="trash-outline" size={16} color={LIGHT_THEME.wMute} />
            </Pressable>
          </View>
        ))}
      </View>
    </Card>
  );
}
