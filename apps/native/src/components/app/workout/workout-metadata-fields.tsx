import { FormField, PillSelect } from "@/components/app/form";
import { CADENCE_WORKOUT_TYPES } from "@/components/app/workout/workout-helpers";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import type { CadenceWorkoutType } from "@packages/shared/types";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

// The owning form's shape must include `name: string`, `description?: string`,
// `type: CadenceWorkoutType` fields. We keep the generic constraint loose and cast
// internally to avoid `Control<T>` invariance issues at the call site.
export function WorkoutMetadataFields<T extends FieldValues>({
  control,
  hideType = false,
}: {
  control: Control<T>;
  hideType?: boolean;
}) {
  const { t } = useTranslation();
  const c = control as unknown as Control<FieldValues>;

  const workoutTypeLabels: Record<CadenceWorkoutType, string> = {
    easy: t("workout.types.easy"),
    tempo: t("workout.types.tempo"),
    long: t("workout.types.long"),
    race: t("workout.types.race"),
  };

  return (
    <View className="gap-5">
      <Controller
        control={c}
        name="name"
        render={({ field, fieldState }) => (
          <FormField label={t("workout.fields.name")} error={fieldState.error?.message}>
            <TextInput
              className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
              style={inputStyle}
              placeholder={t("workout.fields.namePlaceholder")}
              placeholderTextColor={LIGHT_THEME.wMute}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="words"
              selectionColor={COLORS.lime}
              cursorColor={COLORS.lime}
            />
          </FormField>
        )}
      />

      <Controller
        control={c}
        name="description"
        render={({ field, fieldState }) => (
          <FormField
            label={t("workout.fields.descriptionOptional")}
            error={fieldState.error?.message}
          >
            <TextInput
              className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
              style={inputStyle}
              placeholder={t("workout.fields.descriptionPlaceholder")}
              placeholderTextColor={LIGHT_THEME.wMute}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              multiline
              textAlignVertical="top"
              selectionColor={COLORS.lime}
              cursorColor={COLORS.lime}
            />
          </FormField>
        )}
      />

      {!hideType && (
        <Controller
          control={c}
          name="type"
          render={({ field, fieldState }) => (
            <FormField label={t("workout.fields.type")} error={fieldState.error?.message}>
              <PillSelect
                options={CADENCE_WORKOUT_TYPES}
                labels={workoutTypeLabels}
                value={field.value}
                onChange={field.onChange}
                colorByValue={WORKOUT_TYPES_COLORS}
              />
            </FormField>
          )}
        />
      )}
    </View>
  );
}
