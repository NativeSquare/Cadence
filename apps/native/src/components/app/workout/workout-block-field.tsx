import { FormField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import type { BlockDoc } from "@nativesquare/agoge/schema";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export function WorkoutBlockField<T extends FieldValues>({
  control,
  blocks,
}: {
  control: Control<T>;
  blocks: BlockDoc[];
}) {
  const { t } = useTranslation();
  const c = control as unknown as Control<FieldValues>;

  return (
    <Controller
      control={c}
      name="blockId"
      render={({ field, fieldState }) => {
        const selected: string | null = field.value ?? null;
        return (
          <FormField
            label={t("workout.fields.blockOptional")}
            error={fieldState.error?.message}
          >
            <View className="flex-row flex-wrap gap-2">
              <BlockPill
                label={t("workout.fields.blockNone")}
                isSelected={selected === null}
                onPress={() => {
                  selectionFeedback();
                  field.onChange(null);
                }}
              />
              {blocks.map((block) => (
                <BlockPill
                  key={block._id}
                  label={block.name}
                  isSelected={selected === block._id}
                  onPress={() => {
                    selectionFeedback();
                    field.onChange(block._id);
                  }}
                />
              ))}
            </View>
          </FormField>
        );
      }}
    />
  );
}

function BlockPill({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-[14px] py-2 active:opacity-80"
      style={{
        backgroundColor: isSelected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
        borderColor: isSelected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
      }}
    >
      <Text
        className="font-coach-semibold text-[13px]"
        style={{ color: isSelected ? "#FFFFFF" : LIGHT_THEME.wText }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
