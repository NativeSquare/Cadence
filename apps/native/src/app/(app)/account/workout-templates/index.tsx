import { Text } from "@/components/ui/text";
import {
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
  SESSION_TYPE_COLORS_DIM,
  getSessionCategory,
} from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import type { WorkoutTemplateDoc } from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  long: "Long",
  tempo: "Tempo",
  threshold: "Threshold",
  intervals: "Intervals",
  vo2max: "VO2max",
  fartlek: "Fartlek",
  progression: "Progression",
  race_pace: "Race pace",
  recovery: "Recovery",
  strides: "Strides",
  hills: "Hills",
  race: "Race",
  test: "Test",
  cross_training: "Cross-training",
  strength: "Strength",
  rest: "Rest",
  other: "Other",
};

export default function WorkoutTemplatesListScreen() {
  const router = useRouter();
  const templates = useQuery(api.agoge.workoutTemplates.listMyWorkoutTemplates);

  return (
    <View
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          Workout Templates
        </Text>
        <Pressable
          onPress={() => router.push("/account/workout-templates/new")}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        {templates === undefined ? null : templates.length === 0 ? (
          <View className="w-full max-w-md items-center gap-3 self-center pt-20">
            <Text
              className="font-coach-medium text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              No templates yet
            </Text>
            <Text
              className="px-6 text-center font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Save the workouts you want to repeat — easy runs, intervals, your
              long-run plan.
            </Text>
            <Pressable
              onPress={() => router.push("/account/workout-templates/new")}
              className="mt-3 flex-row items-center gap-2 rounded-2xl px-5 py-3 active:opacity-90"
              style={{ backgroundColor: LIGHT_THEME.wText }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text
                className="font-coach-bold text-[13px]"
                style={{ color: "#FFFFFF" }}
              >
                Create your first template
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full max-w-md gap-3 self-center">
            {templates.map((template) => (
              <TemplateRow
                key={template._id}
                template={template}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/account/workout-templates/[id]",
                    params: { id: template._id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TemplateRow({
  template,
  onPress,
}: {
  template: Pick<WorkoutTemplateDoc, "name" | "type">;
  onPress: () => void;
}) {
  const typeLabel = WORKOUT_TYPE_LABELS[template.type] ?? template.type;
  const category = getSessionCategory(template.type);
  const typeColor = SESSION_TYPE_COLORS[category];
  const typeColorDim = SESSION_TYPE_COLORS_DIM[category];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: typeColorDim }}
      >
        <Ionicons name="barbell-outline" size={18} color={typeColor} />
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-semibold text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {template.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {typeLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}
