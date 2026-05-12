import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { WorkoutTemplateRow } from "@/components/app/workout-templates/workout-template-row";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { WorkoutTemplateDoc } from "@nativesquare/agoge/schema";

export function TemplatePickerSheet({
  sheetRef,
  templates,
  onPick,
}: {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  templates: WorkoutTemplateDoc[];
  onPick: (template: WorkoutTemplateDoc) => void;
}) {
  const router = useRouter();

  return (
    <BottomSheetModal ref={sheetRef} snapPoints={["70%"]} scrollable>
      <View className="px-4 pb-2 pt-2">
        <Text
          className="mb-3 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          Use a template
        </Text>

        {templates.length === 0 ? (
          <View className="gap-3 py-6">
            <Text
              className="text-center font-coach text-sm"
              style={{ color: LIGHT_THEME.wMute }}
            >
              No templates yet.
            </Text>
            <Pressable
              onPress={() => {
                selectionFeedback();
                sheetRef.current?.dismiss();
                router.push("/(app)/account/workout-templates");
              }}
              className="self-center rounded-full border px-4 py-2.5 active:opacity-80"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <Text
                className="font-coach-semibold text-[13px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                Create one in Account
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-2">
            {templates.map((tpl) => (
              <WorkoutTemplateRow
                key={tpl._id}
                template={tpl}
                onPress={() => onPick(tpl)}
              />
            ))}
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
}

/**
 * Header affordance for opening the template picker. Picking a template only
 * pre-fills the form — there's no persistent link to the source template, so
 * this button stays visually identical regardless of whether one was applied.
 */
export function TemplateHeaderButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        selectionFeedback();
        onPress();
      }}
      className="size-9 items-center justify-center rounded-full active:opacity-70"
      style={{ backgroundColor: LIGHT_THEME.w3 }}
    >
      <Ionicons name="albums-outline" size={18} color={LIGHT_THEME.wText} />
    </Pressable>
  );
}
