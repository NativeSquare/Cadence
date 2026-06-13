/**
 * WorkoutCard - Full-width row card for a single workout.
 *
 * Used in lists where the user needs to see workout name, type, duration,
 * distance, and status at a glance. Tappable; navigates to workout detail/edit.
 */

import {
  deriveWorkoutStatus,
  localTodayYmd,
  workoutStatusLabel,
  workoutTitle,
  workoutTypeLabel,
} from "@/components/app/workout/workout-helpers";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useLanguage, type Language } from "@/lib/i18n";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import {
  WORKOUT_TYPES_COLORS,
  WORKOUT_TYPES_COLORS_DIM,
} from "@packages/shared/colors";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface WorkoutCardProps {
  workout: WorkoutDoc;
  onPress: () => void;
  /** True when an active (non-reverted) coach intervention reshaped this
   *  session — surfaces a small "Adjusted by coach" badge. */
  coachAdjusted?: boolean;
}

function workoutDate(w: WorkoutDoc): string | undefined {
  return w.planned?.date ?? w.actual?.date;
}

function formatWorkoutDay(
  locale: Language,
  iso: string,
): { weekday: string; day: string } {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" })
    .format(d)
    .slice(0, 3);
  return { weekday, day: String(d.getDate()) };
}

export function WorkoutCard({
  workout,
  onPress,
  coachAdjusted,
}: WorkoutCardProps) {
  const { t } = useTranslation();
  const locale = useLanguage();

  const date = workoutDate(workout);
  const day = date ? formatWorkoutDay(locale, date) : null;
  const typeColor = WORKOUT_TYPES_COLORS[workout.type];
  const typeColorDim = WORKOUT_TYPES_COLORS_DIM[workout.type];
  const effectiveStatus = deriveWorkoutStatus(workout, localTodayYmd());
  // Strike through closed-out workouts (missed). Needs-feedback rows
  // need attention, not finality — render at full opacity with a label.
  const dimmed = effectiveStatus === "missed";

  // Title carries the volume; the subtitle keeps type + (non-planned) status.
  const subtitleParts = [workoutTypeLabel(t, workout.type)];
  if (effectiveStatus !== "planned") {
    subtitleParts.push(workoutStatusLabel(t, effectiveStatus));
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: typeColorDim }}
      >
        {day ? (
          <>
            <Text
              className="font-coach-extrabold uppercase"
              style={{
                color: typeColor,
                fontSize: 9,
                letterSpacing: 0.5,
                lineHeight: 11,
              }}
            >
              {day.weekday}
            </Text>
            <Text
              className="font-coach-extrabold"
              style={{
                color: typeColor,
                fontSize: 14,
                lineHeight: 16,
              }}
            >
              {day.day}
            </Text>
          </>
        ) : (
          <Ionicons name="calendar-outline" size={18} color={typeColor} />
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-semibold text-[15px]"
          style={{
            color: LIGHT_THEME.wText,
            textDecorationLine: dimmed ? "line-through" : undefined,
          }}
        >
          {workoutTitle(workout)}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {subtitleParts.join(" · ")}
        </Text>
        {coachAdjusted && (
          <View
            className="mt-1.5 flex-row items-center gap-1 self-start rounded-full px-2 py-0.5"
            style={{ backgroundColor: "rgba(140,170,0,0.14)" }}
          >
            <Ionicons name="sparkles" size={10} color={COLORS.grn} />
            <Text
              className="font-coach-semibold text-[10px] uppercase"
              style={{ letterSpacing: 0.04 * 10, color: COLORS.grn }}
            >
              {t("plan.todayCard.coachAdjusted")}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}
