import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import type { TemplateOption } from "@/components/app/workout/workout-form";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

function formatDuration(sec?: number): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
}

function formatDistance(m?: number): string | null {
  if (m == null || m <= 0) return null;
  const km = Math.round((m / 1000) * 10) / 10;
  return `${km} km`;
}

export function TemplatePickerSheet({
  sheetRef,
  templates,
  onPick,
}: {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  templates: TemplateOption[];
  onPick: (template: TemplateOption) => void;
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
            {templates.map((t) => {
              const distance = formatDistance(t.content?.distanceMeters);
              const duration = formatDuration(t.content?.durationSeconds);
              const summary = [distance, duration]
                .filter(Boolean)
                .join(" · ");
              return (
                <Pressable
                  key={t._id}
                  onPress={() => onPick(t)}
                  className="flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80"
                  style={{
                    backgroundColor: LIGHT_THEME.w1,
                    borderColor: LIGHT_THEME.wBrd,
                  }}
                >
                  <View className="flex-1 gap-0.5">
                    <Text
                      className="font-coach-bold text-[15px]"
                      style={{ color: LIGHT_THEME.wText }}
                      numberOfLines={1}
                    >
                      {t.name}
                    </Text>
                    {summary.length > 0 && (
                      <Text
                        className="font-coach text-[12px]"
                        style={{ color: LIGHT_THEME.wMute }}
                        numberOfLines={1}
                      >
                        {summary}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={LIGHT_THEME.wMute}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
}
