/**
 * TrainingPulseCard - Progression card for fitness goals on the Home tab.
 *
 * Combines three coach-grade signals into a single card:
 *   • Fitness intent label + supporting copy (subtitle)
 *   • Current streak (consecutive weeks with ≥1 completed workout)
 *   • This-week frequency (completed / median-prior-4w target)
 *   • Last-4-weeks volume sparkline + delta vs prior 4 weeks
 *
 * Empty state takes over when the user has zero completed workouts in the
 * trailing 8 weeks — there's nothing to plot yet.
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import type { FitnessGoalIntent } from "@nativesquare/agoge/schema";
import type { TrainingPulse } from "./utils";

interface TrainingPulseCardProps {
  intent: FitnessGoalIntent;
  pulse: TrainingPulse;
}

const ACCENT = LIGHT_THEME.wText;

function CompassIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlameIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-5 0 2 3 3 3 6a6 6 0 1 1-12 0c0-5 6-6 6-10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Sparkline ─────────────────────────────────────────────────────────────

function SparkBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <View className="flex-row items-end gap-1.5" style={{ height: 28 }}>
      {values.map((v, i) => {
        const isCurrent = i === values.length - 1;
        return (
          <AnimatedBar
            key={i}
            heightPercent={(v / max) * 100}
            color={isCurrent ? ACCENT : "rgba(0,0,0,0.18)"}
            delay={i * 80}
          />
        );
      })}
    </View>
  );
}

function AnimatedBar({
  heightPercent,
  color,
  delay,
}: {
  heightPercent: number;
  color: string;
  delay: number;
}) {
  const target = Math.max(6, heightPercent); // 6% floor so empty weeks stay visible
  const h = useSharedValue(6);

  useEffect(() => {
    h.value = withDelay(
      300 + delay,
      withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    return () => cancelAnimation(h);
  }, [target, delay, h]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${h.value}%`,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 14,
          backgroundColor: color,
          borderRadius: 3,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─── Stat tiles ────────────────────────────────────────────────────────────

function StreakTile({ weeks }: { weeks: number }) {
  const { t } = useTranslation();
  const hasStreak = weeks > 0;
  const accent = hasStreak ? COLORS.lime : LIGHT_THEME.wMute;
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-1.5 mb-1">
        <FlameIcon size={12} color={accent} />
        <Text
          className="text-[10px] font-coach-semibold uppercase"
          style={{ color: LIGHT_THEME.wSub, letterSpacing: 0.05 * 10 }}
        >
          {hasStreak
            ? t("plan.trainingPulse.streakWeeks", { count: weeks })
            : t("plan.trainingPulse.noStreak")}
        </Text>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text
          className="text-[28px] font-coach-extrabold text-wText"
          style={{ lineHeight: 32 }}
        >
          {weeks}
        </Text>
        <Text className="text-[12px] font-coach-medium text-wSub">
          {t("plan.trainingPulse.streakLabel")}
        </Text>
      </View>
    </View>
  );
}

function ThisWeekTile({ count, target }: { count: number; target: number }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1">
      <Text
        className="text-[10px] font-coach-semibold uppercase mb-1"
        style={{ color: LIGHT_THEME.wSub, letterSpacing: 0.05 * 10 }}
      >
        {t("plan.trainingPulse.thisWeek")}
      </Text>
      <View className="flex-row items-baseline gap-1">
        <Text
          className="text-[28px] font-coach-extrabold text-wText"
          style={{ lineHeight: 32 }}
        >
          {count}
        </Text>
        <Text className="text-[14px] font-coach-medium text-wMute">
          / {target}
        </Text>
      </View>
      <Text className="text-[12px] font-coach-medium text-wSub mt-0.5">
        {t("plan.trainingPulse.thisWeekFraction", { count, target })}
      </Text>
    </View>
  );
}

// ─── Trend row ─────────────────────────────────────────────────────────────

function TrendRow({ pulse }: { pulse: TrainingPulse }) {
  const { t } = useTranslation();
  const counts = pulse.weeks.map((w) =>
    w.volumeKm > 0 ? w.volumeKm : w.count,
  );

  let deltaLabel: string;
  if (pulse.delta4wPercent == null) {
    deltaLabel = t("plan.trainingPulse.noHistory");
  } else if (pulse.delta4wPercent > 0) {
    deltaLabel = t("plan.trainingPulse.trendDeltaUp", {
      percent: pulse.delta4wPercent,
    });
  } else if (pulse.delta4wPercent < 0) {
    deltaLabel = t("plan.trainingPulse.trendDeltaDown", {
      percent: pulse.delta4wPercent,
    });
  } else {
    deltaLabel = t("plan.trainingPulse.trendDeltaFlat");
  }

  return (
    <View
      className="flex-row items-end justify-between mt-4 pt-4"
      style={{ borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)" }}
    >
      <View>
        <Text
          className="text-[10px] font-coach-semibold uppercase"
          style={{ color: LIGHT_THEME.wSub, letterSpacing: 0.05 * 10 }}
        >
          {t("plan.trainingPulse.trend")}
        </Text>
        <Text className="text-[12px] font-coach-medium text-wText mt-0.5">
          {deltaLabel}
        </Text>
      </View>
      <SparkBars values={counts} />
    </View>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyPulse({ intent }: { intent: FitnessGoalIntent }) {
  const { t } = useTranslation();
  return (
    <>
      <Text
        className="text-[22px] font-coach-bold text-wText"
        style={{ letterSpacing: -0.02 * 22, lineHeight: 26 }}
      >
        {t(`goal.fitness.options.${intent}.label`)}
      </Text>
      <Text
        className="text-[13px] font-coach-medium text-wSub mt-1.5"
        style={{ lineHeight: 19 }}
      >
        {t(`goal.fitness.options.${intent}.desc`)}
      </Text>

      {/* <View
        className="mt-4 pt-4"
        style={{ borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)" }}
      >
        <Text
          className="text-[15px] font-coach-bold text-wText"
          style={{ lineHeight: 20 }}
        >
          {t("plan.trainingPulse.emptyTitle")}
        </Text>
        <Text
          className="text-[13px] font-coach-medium text-wSub mt-1"
          style={{ lineHeight: 19 }}
        >
          {t("plan.trainingPulse.emptyBody")}
        </Text>
      </View> */}
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export function TrainingPulseCard({ intent, pulse }: TrainingPulseCardProps) {
  const { t } = useTranslation();
  const isEmpty = pulse.trailing8wCompleted === 0;

  return (
    <View
      className="rounded-2xl bg-w1 px-5 py-5"
      style={{
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.10)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View
        className="self-start rounded-full px-2.5 py-1 flex-row items-center gap-1.5 mb-3"
        style={{ backgroundColor: `${ACCENT}14` }}
      >
        <CompassIcon size={12} color={ACCENT} />
        <Text
          className="text-[10px] font-coach-semibold uppercase"
          style={{ color: ACCENT, letterSpacing: 0.05 * 10 }}
        >
          {t("plan.trainingPulse.eyebrow")}
        </Text>
      </View>

      {isEmpty ? (
        <EmptyPulse intent={intent} />
      ) : (
        <>
          <Text
            className="text-[18px] font-coach-bold text-wText"
            style={{ letterSpacing: -0.01 * 18, lineHeight: 22 }}
          >
            {t(`goal.fitness.options.${intent}.label`)}
          </Text>
          <Text
            className="text-[12px] font-coach-medium text-wSub mt-0.5"
            style={{ lineHeight: 17 }}
          >
            {t(`goal.fitness.options.${intent}.desc`)}
          </Text>

          <View className="flex-row gap-6 mt-4">
            <StreakTile weeks={pulse.streakWeeks} />
            <View
              className="w-px self-stretch"
              style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
            />
            <ThisWeekTile
              count={pulse.thisWeekCount}
              target={pulse.thisWeekTarget}
            />
          </View>

          <TrendRow pulse={pulse} />
        </>
      )}
    </View>
  );
}
