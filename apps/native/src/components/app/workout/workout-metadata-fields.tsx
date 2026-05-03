import { FormField, PillSelect } from "@/components/app/form";
import { TemplatePickerSheet } from "@/components/app/workout/template-picker-sheet";
import {
  WORKOUT_TYPE_COLORS,
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPES,
} from "@/components/app/workout/workout-helpers";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import type { WorkoutTemplateDoc } from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { Pressable, TextInput, View } from "react-native";

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

// The owning form's shape must include `name: string`, `description?: string`,
// `type: WorkoutType` fields. We keep the generic constraint loose and cast
// internally to avoid `Control<T>` invariance issues at the call site.
export function WorkoutMetadataFields<T extends FieldValues>({
  control,
  templates,
  templateId,
  templateName,
  onPickTemplate,
  onClearTemplate,
  hideType = false,
}: {
  control: Control<T>;
  templates?: WorkoutTemplateDoc[];
  templateId: string | null;
  templateName: string | null;
  onPickTemplate?: (template: WorkoutTemplateDoc) => void;
  onClearTemplate: () => void;
  hideType?: boolean;
}) {
  const c = control as unknown as Control<FieldValues>;
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const showTemplateAffordance = onPickTemplate != null;

  return (
    <View className="gap-5">
      {showTemplateAffordance && (
        <View className="gap-2">
          {templateId == null ? (
            <Pressable
              onPress={() => {
                selectionFeedback();
                sheetRef.current?.present();
              }}
              className="flex-row items-center gap-2 self-start rounded-full border px-4 py-2.5 active:opacity-80"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <Ionicons
                name="albums-outline"
                size={16}
                color={LIGHT_THEME.wText}
              />
              <Text
                className="font-coach-semibold text-[13px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                Use a template
              </Text>
            </Pressable>
          ) : (
            <View
              className="flex-row items-center gap-2 self-start rounded-full px-3 py-2"
              style={{ backgroundColor: COLORS.limeDim }}
            >
              <Ionicons name="link" size={14} color={LIGHT_THEME.wText} />
              <Text
                className="font-coach-semibold text-[12px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {templateName}
              </Text>
              <Pressable
                onPress={onClearTemplate}
                className="ml-1 size-5 items-center justify-center rounded-full active:opacity-70"
                style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
              >
                <Ionicons name="close" size={12} color={LIGHT_THEME.wText} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      <Controller
        control={c}
        name="name"
        render={({ field, fieldState }) => (
          <FormField label="Name" error={fieldState.error?.message}>
            <TextInput
              className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
              style={inputStyle}
              placeholder="e.g. Tuesday Tempo"
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
            label="Description (optional)"
            error={fieldState.error?.message}
          >
            <TextInput
              className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
              style={inputStyle}
              placeholder="What this workout is for"
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
            <FormField label="Type" error={fieldState.error?.message}>
              <PillSelect
                options={WORKOUT_TYPES}
                labels={WORKOUT_TYPE_LABELS}
                value={field.value}
                onChange={field.onChange}
                colorByValue={WORKOUT_TYPE_COLORS}
              />
            </FormField>
          )}
        />
      )}

      {showTemplateAffordance && (
        <TemplatePickerSheet
          sheetRef={sheetRef}
          templates={templates ?? []}
          onPick={(template) => {
            onPickTemplate?.(template);
            sheetRef.current?.dismiss();
          }}
        />
      )}
    </View>
  );
}
