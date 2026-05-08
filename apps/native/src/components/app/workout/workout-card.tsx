/**
 * WorkoutCard - Full-width row card for a single workout.
 *
 * Used in lists where the user needs to see workout name, type, duration,
 * distance, and status at a glance. Tappable; navigates to workout detail/edit.
 */

import {
  workoutTypeColor,
  workoutTypeColorDim,
} from "@/components/app/training-plan/constants";
import {
  workoutStatusLabel,
  workoutTypeLabel,
} from "@/components/app/workout/workout-helpers";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { useLanguage, type Language } from "@/lib/i18n";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface WorkoutCardProps {
  workout: WorkoutDoc;
  onPress: () => void;
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

function formatDuration(seconds?: number): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m - h * 60;
  return rem === 0 ? `${h}h` : `${h}h${String(rem).padStart(2, "0")}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null || meters <= 0) return null;
  const km = meters / 1000;
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
}

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  const { t } = useTranslation();
  const locale = useLanguage();

  const date = workoutDate(workout);
  const day = date ? formatWorkoutDay(locale, date) : null;
  const duration = formatDuration(workout.planned?.durationSeconds);
  const distance = formatDistance(workout.planned?.distanceMeters);
  const typeColor = workoutTypeColor(workout.type);
  const typeColorDim = workoutTypeColorDim(workout.type);
  const dimmed = workout.status === "skipped" || workout.status === "missed";

  const subtitleParts = [workoutTypeLabel(t, workout.type)];
  const meta = [duration, distance].filter(Boolean).join(" · ");
  if (meta) subtitleParts.push(meta);
  if (
    workout.status === "completed" ||
    workout.status === "skipped" ||
    workout.status === "missed"
  ) {
    subtitleParts.push(workoutStatusLabel(t, workout.status));
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
          {workout.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {subtitleParts.join(" · ")}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}
