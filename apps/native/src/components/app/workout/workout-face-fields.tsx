import { DateField } from "@/components/app/form";
import { WorkoutStructureEditor } from "@/components/app/workout/workout-structure-editor";
import { Text } from "@/components/ui/text";
import { COLORS } from "@/lib/design-tokens";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function WorkoutFaceFields<T extends FieldValues>({
  control,
  faceName,
  dateLabel,
  minDate,
  maxDate,
  errorByPath,
  structureError,
}: {
  control: Control<T>;
  faceName: "planned" | "actual";
  dateLabel?: string;
  minDate?: string;
  maxDate?: string;
  errorByPath?: Record<string, string>;
  structureError?: string | null;
}) {
  const { t } = useTranslation();
  const c = control as unknown as Control<FieldValues>;
  const resolvedDateLabel = dateLabel ?? t("workout.fields.dateAndStartTime");
  return (
    <View className="gap-5">
      <Controller
        control={c}
        name={`${faceName}.date`}
        render={({ field }) => (
          <DateField
            label={resolvedDateLabel}
            mode="datetime"
            value={field.value || undefined}
            onChange={field.onChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        )}
      />
      <Controller
        control={c}
        name={`${faceName}.structure`}
        render={({ field }) => (
          <WorkoutStructureEditor
            value={field.value}
            onChange={field.onChange}
            errorByPath={errorByPath}
          />
        )}
      />
      {structureError && (
        <Text
          className="font-coach text-[12px]"
          style={{ color: COLORS.red }}
        >
          {structureError}
        </Text>
      )}
    </View>
  );
}
