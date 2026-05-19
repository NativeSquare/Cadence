import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { formatLongDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { AddWorkoutButton } from "@/components/app/workout/add-workout-button";
import { WorkoutCard } from "@/components/app/workout/workout-card";

interface CalendarDaySheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  selectedDate: string;
  workouts: WorkoutDoc[];
  onWorkoutPress: (workoutId: string) => void;
  onAddWorkout: () => void;
}

export function CalendarDaySheet({
  sheetRef,
  selectedDate,
  workouts,
  onWorkoutPress,
  onAddWorkout,
}: CalendarDaySheetProps) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const selectedDateObj = new Date(selectedDate + "T00:00:00");

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
            workouts.map((w) => (
              <WorkoutCard
                key={w._id}
                workout={w}
                onPress={() => onWorkoutPress(w._id)}
              />
            ))
          )}
          <AddWorkoutButton
            label={t("calendar.selectedDay.addWorkout")}
            onPress={onAddWorkout}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}
