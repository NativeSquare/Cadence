/**
 * TodayCard - Main card showing today's (or selected day's) workout.
 *
 * One unified body for non-rest days: header (kind + optional status badge) +
 * planned structure preview + total + (conditional) CTAs. The header badge
 * surfaces lifecycle status (missed / needs feedback / completed) when one
 * applies; otherwise the slot stays empty. Detailed actuals/adherence live on
 * the workout detail page.
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Svg, { Path, Circle } from "react-native-svg";
import type { Repeat, Step } from "@nativesquare/agoge";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import {
  INTENT_COLORS,
  formatDuration,
  formatTarget,
  intentLabel,
  workoutTypeLabel,
  type DerivedWorkoutStatus,
} from "@/components/app/workout/workout-helpers";
import { WorkoutStatusBadge } from "@/components/app/workout/workout-status-badge";
import { type WorkoutData } from "./types";
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

function statusForBadge(workout: WorkoutData): DerivedWorkoutStatus {
  if (workout.missed) return "missed";
  if (workout.needsFeedback) return "needs_feedback";
  if (workout.done) return "completed";
  return "planned";
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

// ─── Header (shared) ────────────────────────────────────────────────────────

function CardHeader({ workout }: { workout: WorkoutData }) {
  const { t } = useTranslation();
  // The label container has CSS uppercase, so the translated value can stay
  // sentence-case ("VO2 max" → rendered as "VO2 MAX").
  const kindLabel = workout.kind ? workoutTypeLabel(t, workout.kind) : null;
  const status = statusForBadge(workout);

  return (
    <View className="px-5 pt-5 pb-3">
      <View className="flex-row items-start justify-between mb-1.5">
        {kindLabel && workout.kind ? (
          <Text
            className="text-[15px] font-coach-bold uppercase"
            style={{
              letterSpacing: 0.08 * 15,
              color: WORKOUT_TYPES_COLORS[workout.kind],
            }}
            numberOfLines={1}
          >
            {kindLabel}
          </Text>
        ) : (
          <View />
        )}
        <WorkoutStatusBadge status={status} tone="dark" />
      </View>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[26px] font-coach-bold text-g1 flex-1"
          style={{ letterSpacing: -0.02 * 26, lineHeight: 30 }}
          numberOfLines={2}
        >
          {volumeSummary(workout) ?? workout.type}
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
  const showMarkDone = !!canMarkDone && !!onMarkDonePress;
  const showExport = !!canExport;

  return (
    <>
      <CardHeader workout={workout} />
      <StructurePreview workout={workout} />
      {showMarkDone || showExport ? (
        <View className="px-4 pb-4 pt-2 gap-2">
          {showMarkDone && <MarkAsDoneCTA onPress={onMarkDonePress} />}
          {showExport && <ExportToWatchCTA onPress={onExportPress} />}
        </View>
      ) : (
        // No action button: pad the bottom (8px) so it adds up to the header's
        // 20px top inset and the card stays vertically symmetric.
        <View className="pb-2" />
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

