import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

type TemplateDoc = NonNullable<
  ReturnType<typeof useQuery<typeof api.plan.workoutTemplates.listMyTemplates>>
>[number];

function countSteps(structure: unknown): number {
  if (!Array.isArray(structure)) return 0;
  let total = 0;
  const walk = (nodes: unknown[]) => {
    for (const raw of nodes) {
      if (raw == null || typeof raw !== "object") continue;
      const node = raw as { kind?: string; count?: number; children?: unknown };
      if (node.kind === "step") total += 1;
      else if (node.kind === "repeat" && Array.isArray(node.children)) {
        const times = typeof node.count === "number" ? node.count : 1;
        for (let i = 0; i < times; i++) walk(node.children);
      }
    }
  };
  walk(structure);
  return total;
}

export default function WorkoutTemplatesListScreen() {
  const router = useRouter();
  const templates = useQuery(api.plan.workoutTemplates.listMyTemplates);

  return (
    <View className="mt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        {templates === undefined ? null : templates.length === 0 ? (
          <View className="w-full max-w-md items-center gap-2 self-center pt-20">
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
              Ask your Coach to save a workout as a template.
            </Text>
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
  template: TemplateDoc;
  onPress: () => void;
}) {
  const stepCount = countSteps(template.structure);
  const tagsPreview = template.tags.slice(0, 3).join(" · ");

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
        style={{ backgroundColor: "rgba(168,217,0,0.12)" }}
      >
        <Ionicons name="barbell-outline" size={18} color={COLORS.lime} />
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
          {stepCount} {stepCount === 1 ? "step" : "steps"}
          {tagsPreview ? ` · ${tagsPreview}` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}
