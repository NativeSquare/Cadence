import React from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { formatLongDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { AddWorkoutButton } from "@/components/app/workout/add-workout-button";
import { WorkoutCard } from "@/components/app/workout/workout-card";
import { dateKey } from "@/components/app/calendar/helpers";

interface CalendarDaySheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  selectedDate: string;
  workouts: WorkoutDoc[];
  onWorkoutPress: (workoutId: string) => void;
  onAddWorkout: () => void;
  onReschedule: (workout: WorkoutDoc) => void;
  onSwap: (workout: WorkoutDoc) => void;
}

export function CalendarDaySheet({
  sheetRef,
  selectedDate,
  workouts,
  onWorkoutPress,
  onAddWorkout,
  onReschedule,
  onSwap,
}: CalendarDaySheetProps) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const isPast = selectedDate < dateKey(new Date());

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor={LIGHT_THEME.w2}
      borderRadius={28}
      scrollable
    >
      <View className="px-5 pt-1 pb-2 gap-4">
        <Text
          className="text-[18px] font-coach-bold capitalize"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.36 }}
        >
          {formatLongDate(locale, selectedDateObj)}
        </Text>

        <View className="gap-2.5">
          {workouts.length === 0 ? (
            <Text
              className="text-[14px] font-coach text-center py-4"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t("calendar.selectedDay.empty")}
            </Text>
          ) : (
            workouts.map((w) => {
              // Race day is fixed in the calendar — never reschedulable or swappable.
              const canEdit =
                w.planned != null &&
                w.status !== "completed" &&
                w.type !== "race";
              return (
                <View key={w._id} className="gap-1.5">
                  <WorkoutCard
                    workout={w}
                    onPress={() => onWorkoutPress(w._id)}
                  />
                  {canEdit && (
                    <View className="flex-row gap-1.5 pl-1">
                      <DayAction
                        icon="calendar-outline"
                        label={t("workout.detail.actions.reschedule")}
                        onPress={() => onReschedule(w)}
                        disabled={isPast}
                      />
                      {w.blockId != null && (
                        <DayAction
                          icon="swap-horizontal-outline"
                          label={t("workout.detail.actions.swap")}
                          onPress={() => onSwap(w)}
                          disabled={isPast}
                        />
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
          {workouts.length === 0 && (
            <AddWorkoutButton
              label={t("calendar.selectedDay.addWorkout")}
              onPress={onAddWorkout}
            />
          )}
        </View>
      </View>
    </BottomSheetModal>
  );
}

function DayAction({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-2 rounded-full border px-4 py-2.5 active:opacity-70"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Ionicons name={icon} size={15} color={LIGHT_THEME.wMute} />
      <Text
        className="font-coach-semibold text-[13px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
