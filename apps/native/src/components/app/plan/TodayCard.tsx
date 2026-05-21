/**
 * TodayCard - Main card showing today's (or selected day's) workout.
 *
 * One unified body for non-rest days: header (kind + status badge) + planned
 * structure preview + total + (conditional) CTAs. Status — missed, needs
 * feedback, completed, coach-adjusted — is communicated entirely through the
 * header badge; the body stays consistent so the card doesn't reflow between
 * states. Detailed actuals/adherence live on the workout detail page.
 *
 * Sync state is a small inline badge (top-right) shown only for active states
 * (exported / syncing / synced / failed) when no status badge takes priority.
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Svg, { Path, Circle } from "react-native-svg";
import type { Repeat, Step } from "@nativesquare/agoge";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  INTENT_COLORS,
  formatDuration,
  formatTarget,
  intentLabel,
  workoutTypeLabel,
  type DerivedWorkoutStatus,
} from "@/components/app/workout/workout-helpers";
import { WorkoutStatusBadge } from "@/components/app/workout/workout-status-badge";
import { type WorkoutData, type SyncStatus } from "./types";
import { formatShortDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";

interface TodayCardProps {
  workout: WorkoutData;
  selectedDate?: Date;
  isToday?: boolean;
  onExportPress?: () => void;
  onCardPress?: () => void;
  onMarkDonePress?: () => void;
  canMarkDone?: boolean;
  canExport?: boolean;
}

// ─── Animation primitives ───────────────────────────────────────────────────

function SpinningSyncIcon({ color, size = 12 }: { color: string; size?: number }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1, false
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12C21 16.97 16.97 21 12 21C9.36 21 7.01 19.88 5.34 18.1L7.5 15.94C8.6 17.22 10.21 18 12 18C15.31 18 18 15.31 18 12H15L19 8L23 12H21Z"
          fill={color}
        />
        <Path
          d="M3 12C3 7.03 7.03 3 12 3C14.64 3 16.99 4.12 18.66 5.9L16.5 8.06C15.4 6.78 13.79 6 12 6C8.69 6 6 8.69 6 12H9L5 16L1 12H3Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── SVG icons ──────────────────────────────────────────────────────────────

function WatchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 2V6" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 2V6" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 18V22" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 18V22" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={7} stroke="#1A1A1A" strokeWidth={2} />
      <Path d="M12 9V12L14 14" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 10, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12.5L9.5 18L20 6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DoubleCheckIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size + 2} height={size} viewBox="0 0 28 24" fill="none">
      <Path d="M2 12.5L7.5 18L18 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 12.5L15.5 18L26 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertIcon({ size = 10, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6V14" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M12 18V18.01" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Sync badge (inline) ────────────────────────────────────────────────────

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  garmin: "Garmin",
  coros: "Coros",
};

function providerShort(syncSource?: string): string {
  if (!syncSource) return "watch";
  return PROVIDER_DISPLAY_NAMES[syncSource] ?? syncSource;
}

interface SyncBadgeContent {
  icon: ReactNode;
  label: string;
  color: string;
}

function syncBadgeContent(
  status: SyncStatus,
  t: TFunction,
  syncSource?: string,
): SyncBadgeContent | null {
  const provider = providerShort(syncSource);
  switch (status) {
    case "exported":
      return {
        icon: <CheckIcon color="rgba(255,255,255,0.7)" />,
        label: provider,
        color: "rgba(255,255,255,0.7)",
      };
    case "syncing":
      return {
        icon: <SpinningSyncIcon color={COLORS.ylw} />,
        label: t("plan.todayCard.syncing"),
        color: COLORS.ylw,
      };
    case "synced":
      return {
        icon: <DoubleCheckIcon color={COLORS.lime} />,
        label: provider,
        color: COLORS.lime,
      };
    case "failed":
      return {
        icon: <AlertIcon color={COLORS.red} />,
        label: t("plan.todayCard.syncFailed"),
        color: COLORS.red,
      };
    default:
      return null;
  }
}

function SyncBadge({ workout }: { workout: WorkoutData }) {
  const { t } = useTranslation();
  if (!workout.syncStatus || workout.syncStatus === "planned") return null;
  const content = syncBadgeContent(workout.syncStatus, t, workout.syncSource);
  if (!content) return null;
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      {content.icon}
      <Text
        className="text-[11px] font-coach-semibold"
        style={{ color: content.color }}
      >
        {content.label}
      </Text>
    </View>
  );
}

function statusForBadge(workout: WorkoutData): DerivedWorkoutStatus | null {
  if (workout.missed) return "missed";
  if (workout.needsFeedback) return "needs_feedback";
  if (workout.done) return "completed";
  return null;
}

function CoachAdjustedBadge() {
  const { t } = useTranslation();
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        backgroundColor: "rgba(200,255,0,0.16)",
        borderWidth: 1,
        borderColor: "rgba(200,255,0,0.35)",
      }}
    >
      <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
          fill={COLORS.lime}
        />
      </Svg>
      <Text
        className="text-[11px] font-coach-semibold"
        style={{ color: COLORS.lime }}
      >
        {t("plan.todayCard.coachAdjusted")}
      </Text>
    </View>
  );
}

// ─── Structure preview ──────────────────────────────────────────────────────

const MAX_STRUCTURE_LINES = 4;

function formatBlockLine(
  block: Step | Repeat,
  t: TFunction,
): { label: string; dot: string } {
  if (block.kind === "step") {
    const dur = formatDuration(t, block.duration);
    const target = formatTarget(block.target);
    const dot = INTENT_COLORS[block.intent];

    if (block.intent === "work") {
      return {
        label: target ? `${dur} @ ${target}` : dur,
        dot,
      };
    }
    const head = block.name ?? intentLabel(t, block.intent);
    const tail = target ? ` @ ${target}` : "";
    return { label: `${head} · ${dur}${tail}`, dot };
  }

  const work = block.children.find((c) => c.intent === "work") ?? block.children[0];
  const rec = block.children.find(
    (c) => c.intent === "recovery" || c.intent === "rest" || c.intent === "active",
  );
  if (!work) return { label: `${block.count}× repeat`, dot: INTENT_COLORS.work };

  const workDur = formatDuration(t, work.duration);
  const workTarget = formatTarget(work.target);
  const workStr = workTarget ? `${workDur} @ ${workTarget}` : workDur;
  const recStr = rec ? ` · rec ${formatDuration(t, rec.duration)}` : "";
  return {
    label: `${block.count}× ${workStr}${recStr}`,
    dot: INTENT_COLORS.work,
  };
}

function StructurePreview({ workout }: { workout: WorkoutData }) {
  const { t } = useTranslation();
  const blocks = workout.structure?.blocks;
  if (!blocks || blocks.length === 0) return null;

  const visible = blocks.slice(0, MAX_STRUCTURE_LINES);
  const overflow = blocks.length - visible.length;

  return (
    <View className="px-5 pb-3 gap-2">
      {visible.map((block, i) => {
        const line = formatBlockLine(block, t);
        return (
          <View key={i} className="flex-row items-center gap-2.5">
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: line.dot,
              }}
            />
            <Text
              numberOfLines={1}
              className="flex-1 text-[13px] font-coach-medium text-g1"
            >
              {line.label}
            </Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <Text
          className="text-[12px] font-coach-medium pl-[14px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {t("plan.todayCard.moreItems", { count: overflow })}
        </Text>
      )}
    </View>
  );
}

// ─── Volume summary ─────────────────────────────────────────────────────────

function volumeSummary(workout: WorkoutData): string | null {
  const hasKm = workout.km && workout.km !== "-";
  const hasDur = workout.dur && workout.dur !== "-";
  if (!hasKm && !hasDur) return null;
  if (hasKm && hasDur) return `${workout.km} km · ${workout.dur}`;
  return hasKm ? `${workout.km} km` : (workout.dur ?? null);
}

function StructureTotal({ workout }: { workout: WorkoutData }) {
  const { t } = useTranslation();
  const total = volumeSummary(workout);
  if (!total) return null;
  return (
    <View className="px-5 pb-3">
      <Text
        className="text-[12px] font-coach-medium"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        {t("plan.todayCard.totalSuffix", { total })}
      </Text>
    </View>
  );
}

// ─── Header (shared) ────────────────────────────────────────────────────────

function CardHeader({
  workout,
  showSyncBadge,
}: {
  workout: WorkoutData;
  showSyncBadge: boolean;
}) {
  const { t } = useTranslation();
  // The label container has CSS uppercase, so the translated value can stay
  // sentence-case ("VO2 max" → rendered as "VO2 MAX").
  const kindLabel = workout.kind ? workoutTypeLabel(t, workout.kind) : null;

  return (
    <View className="px-5 pt-5 pb-3">
      <View className="flex-row items-start justify-between mb-1.5">
        {kindLabel ? (
          <Text
            className="text-[11px] font-coach-semibold uppercase"
            style={{ letterSpacing: 0.08 * 11, color: "rgba(255,255,255,0.45)" }}
            numberOfLines={1}
          >
            {kindLabel}
          </Text>
        ) : (
          <View />
        )}
        {(() => {
          const status = statusForBadge(workout);
          if (status) return <WorkoutStatusBadge status={status} tone="dark" />;
          if (workout.coachAdjusted) return <CoachAdjustedBadge />;
          return showSyncBadge ? <SyncBadge workout={workout} /> : null;
        })()}
      </View>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[26px] font-coach-bold text-g1 flex-1"
          style={{ letterSpacing: -0.02 * 26, lineHeight: 30 }}
          numberOfLines={2}
        >
          {workout.type}
        </Text>
        <ChevronRight />
      </View>
    </View>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────

function ExportToWatchCTA({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      className="py-[14px] px-5 rounded-[14px] flex-row items-center justify-center gap-2 active:scale-[0.98]"
      style={{ backgroundColor: "#FFFFFF" }}
      onPress={(e) => {
        e.stopPropagation();
        onPress?.();
      }}
    >
      <WatchIcon />
      <Text className="text-[15px] font-coach-semibold" style={{ color: "#1A1A1A" }}>
        {t("plan.todayCard.exportToWatch")}
      </Text>
    </Pressable>
  );
}

function MarkAsDoneCTA({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      className="py-[14px] px-5 rounded-[14px] flex-row items-center justify-center gap-2 active:scale-[0.98]"
      style={{ backgroundColor: COLORS.lime }}
      onPress={(e) => {
        e.stopPropagation();
        onPress?.();
      }}
    >
      <CheckIcon color="#1A1A1A" size={14} />
      <Text className="text-[15px] font-coach-semibold" style={{ color: "#1A1A1A" }}>
        {t("plan.todayCard.markAsDone")}
      </Text>
    </Pressable>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

function WorkoutBody({
  workout,
  onExportPress,
  onMarkDonePress,
  canMarkDone,
  canExport,
}: {
  workout: WorkoutData;
  onExportPress?: () => void;
  onMarkDonePress?: () => void;
  canMarkDone?: boolean;
  canExport?: boolean;
}) {
  const isExported =
    workout.syncStatus === "exported" || workout.syncStatus === "synced";
  const showMarkDone = !!canMarkDone && !!onMarkDonePress;
  const showExport = !!canExport && !isExported;

  return (
    <>
      <CardHeader workout={workout} showSyncBadge />
      <StructurePreview workout={workout} />
      <StructureTotal workout={workout} />
      {(showMarkDone || showExport) && (
        <View className="px-4 pb-4 pt-2 gap-2">
          {showMarkDone && <MarkAsDoneCTA onPress={onMarkDonePress} />}
          {showExport && <ExportToWatchCTA onPress={onExportPress} />}
        </View>
      )}
    </>
  );
}

// ─── Rest day ───────────────────────────────────────────────────────────────

function RestDayCard({
  dateLabel,
  onCardPress,
}: {
  dateLabel: string;
  onCardPress?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {dateLabel}
      </Text>

      <Pressable onPress={onCardPress} className="active:opacity-95">
        <View
          className="rounded-[20px] overflow-hidden px-5 pt-5 pb-5"
          style={{
            backgroundColor: LIGHT_THEME.w3,
            borderWidth: 1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <View className="flex-row items-center gap-2.5 mb-1.5">
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: LIGHT_THEME.wMute,
              }}
            />
            <Text
              className="text-xs font-coach-medium uppercase"
              style={{ letterSpacing: 0.05 * 12, color: LIGHT_THEME.wMute }}
            >
              {t("plan.todayCard.restDay")}
            </Text>
          </View>

          <Text
            className="text-[22px] font-coach-semibold"
            style={{
              letterSpacing: -0.02 * 22,
              lineHeight: 28,
              color: LIGHT_THEME.wSub,
            }}
          >
            {t("plan.todayCard.noWorkoutScheduled")}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function TodayCard({
  workout,
  selectedDate,
  isToday = true,
  onExportPress,
  onCardPress,
  onMarkDonePress,
  canMarkDone,
  canExport,
}: TodayCardProps) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const dateLabel = isToday
    ? t("plan.today")
    : formatShortDate(locale, selectedDate ?? new Date());
  const isRest = workout.intensity === "rest";

  if (isRest) {
    return (
      <RestDayCard
        dateLabel={dateLabel}
        onCardPress={onCardPress}
      />
    );
  }

  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {dateLabel}
      </Text>

      <Pressable onPress={onCardPress} className="active:opacity-95">
        <View
          className="rounded-[20px] overflow-hidden"
          style={{
            backgroundColor: "#1A1A1A",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <WorkoutBody
            workout={workout}
            onExportPress={onExportPress}
            onMarkDonePress={onMarkDonePress}
            canMarkDone={canMarkDone}
            canExport={canExport}
          />
        </View>
      </Pressable>
    </View>
  );
}

