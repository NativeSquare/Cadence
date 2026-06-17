/**
 * Coach dashboard — the Coach tab's landing surface. A vertical read, not a
 * chat box: the Portrait (who the Coach understands you to be), the Decisions
 * list (the calls you've made at a session fork), and an entry into the pushed
 * chat. Analytics stays its own tab; this does not fold it in.
 *
 * The Portrait renders Coach Memories verbatim and so also carries the
 * transparency guarantee at MVP (the old chat-header Context sheet is folded
 * in here). The Decisions list is strict and near-empty by design — it stakes
 * out the moat surface; it earns its name once Outcomes label the rows.
 */

import { ScrollView, View, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { ChevronRight, MessageCircle } from "lucide-react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { useLanguage } from "@/lib/i18n";
import { formatShortDate } from "@/lib/format";
import { LIGHT_THEME } from "@/lib/design-tokens";

export function CoachDashboard() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />

      <View className="bg-black">
        <View
          className="px-6 pb-5"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Text
            className="text-[28px] font-coach-bold text-g1"
            style={{ letterSpacing: -0.03 * 28 }}
          >
            {t("coach.title")}
          </Text>
        </View>
        <View
          className="bg-w2 h-7"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        />
      </View>

      <ScrollView
        className="flex-1 bg-w2"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: insets.bottom + 32,
          gap: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PortraitSection />
        <DecisionsSection />
        <ChatEntryCard />
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      className="font-coach-bold text-[19px] mb-3"
      style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 19 }}
    >
      {children}
    </Text>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <View
      className="rounded-2xl px-4 py-5"
      style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
    >
      <Text
        className="font-coach text-[14px] leading-5"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {children}
      </Text>
    </View>
  );
}

function PortraitSection() {
  const { t } = useTranslation();
  const memories = useQuery(api.table.coachMemories.listMine, {});

  return (
    <View>
      <SectionTitle>{t("coach.portrait.title")}</SectionTitle>
      {memories === undefined ? (
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      ) : memories.length === 0 ? (
        <EmptyState>{t("coach.portrait.empty")}</EmptyState>
      ) : (
        <View className="gap-3">
          {memories.map((m) => (
            <View
              key={m._id}
              className="flex-row gap-3 rounded-2xl"
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: "rgba(0,0,0,0.03)",
              }}
            >
              <View
                className="mt-1.5 size-1.5 rounded-full"
                style={{ backgroundColor: "#5C7700" }}
              />
              <Text
                className="flex-1 font-coach text-[14px] leading-5"
                style={{ color: LIGHT_THEME.wText }}
              >
                {m.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function DecisionsSection() {
  const { t } = useTranslation();
  const decisions = useQuery(api.table.journalEntry.listDecisions, {});

  return (
    <View>
      <SectionTitle>{t("coach.decisions.title")}</SectionTitle>
      {decisions === undefined ? (
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      ) : decisions.length === 0 ? (
        <EmptyState>{t("coach.decisions.empty")}</EmptyState>
      ) : (
        <View className="gap-2.5">
          {decisions.map((d) => (
            <DecisionRow key={d.entryId} decision={d} />
          ))}
        </View>
      )}
    </View>
  );
}

type DecisionRowData = {
  entryId: string;
  workoutId: string;
  dayKey: string;
  decision: "go" | "ease";
  workoutName: string | null;
  workoutType: string | null;
};

function DecisionRow({ decision: d }: { decision: DecisionRowData }) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const kept = d.decision === "go";

  const dateLabel = formatShortDate(locale, new Date(d.dayKey));
  const name = d.workoutName ?? t("coach.decisions.deletedWorkout");
  const typeLabel = d.workoutType ? t(`workout.types.${d.workoutType}`) : null;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/workouts/${d.workoutId}`)}
      className="flex-row items-center gap-3 rounded-2xl active:opacity-70"
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: "rgba(0,0,0,0.03)",
      }}
    >
      <View className="flex-1 min-w-0">
        <Text
          className="font-coach-semibold text-[14px]"
          style={{ color: LIGHT_THEME.wText }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          className="font-coach text-[12px] mt-0.5"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {typeLabel ? `${dateLabel} · ${typeLabel}` : dateLabel}
        </Text>
      </View>

      <View
        className="rounded-full px-2.5 py-1"
        style={{
          backgroundColor: kept
            ? "rgba(200,255,0,0.18)"
            : "rgba(245,158,11,0.15)",
        }}
      >
        <Text
          className="font-coach-semibold text-[12px]"
          style={{ color: kept ? "#5C7700" : "#B45309" }}
        >
          {kept
            ? t("coach.decisions.badge.kept")
            : t("coach.decisions.badge.eased")}
        </Text>
      </View>
    </Pressable>
  );
}

function ChatEntryCard() {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.push("/(app)/coach/chat")}
      className="flex-row items-center gap-3 rounded-2xl active:opacity-80"
      style={{ padding: 16, backgroundColor: "#111111" }}
    >
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(200,255,0,0.18)" }}
      >
        <MessageCircle size={20} color="#C8FF00" strokeWidth={1.75} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-coach-bold text-[15px] text-g1">
          {t("coach.chatEntry.title")}
        </Text>
        <Text className="font-coach text-[12px] text-g3 mt-0.5">
          {t("coach.chatEntry.subtitle")}
        </Text>
      </View>
      <ChevronRight size={20} color="rgba(255,255,255,0.45)" strokeWidth={2} />
    </Pressable>
  );
}
