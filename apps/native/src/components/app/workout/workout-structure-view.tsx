import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  formatDuration,
  formatTarget,
  INTENT_COLORS,
  INTENT_LABELS,
} from "@/components/app/workout/workout-helpers";
import type { Repeat, Step, Workout } from "@nativesquare/agoge";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function WorkoutStructureView({
  structure,
}: {
  structure: Workout;
}) {
  if (structure.blocks.length === 0) return null;
  return (
    <View className="gap-2">
      {structure.blocks.map((block, i) =>
        block.kind === "repeat" ? (
          <ReadRepeatCard key={i} repeat={block} />
        ) : (
          <ReadStepCard key={i} step={block} />
        ),
      )}
    </View>
  );
}

function ReadStepCard({ step }: { step: Step }) {
  const target = formatTarget(step.target);
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border px-3 py-3"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        className="size-2 rounded-full"
        style={{ backgroundColor: INTENT_COLORS[step.intent] }}
      />
      <View className="flex-1">
        <Text
          className="font-coach-semibold text-[14px]"
          style={{ color: LIGHT_THEME.wText }}
          numberOfLines={1}
        >
          {step.name ?? INTENT_LABELS[step.intent]}
        </Text>
        <Text
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
          numberOfLines={1}
        >
          {formatDuration(step.duration)}
          {target ? ` · ${target}` : ""}
        </Text>
      </View>
    </View>
  );
}

function ReadRepeatCard({ repeat }: { repeat: Repeat }) {
  return (
    <View
      className="gap-3 rounded-2xl border px-3 py-3"
      style={{
        backgroundColor: LIGHT_THEME.w2,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="repeat" size={16} color={LIGHT_THEME.wSub} />
        <Text
          className="font-coach-semibold text-[13px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {repeat.count}× Repeat
        </Text>
      </View>
      <View className="gap-2 pl-3">
        {repeat.children.map((child, j) => (
          <ReadStepCard key={j} step={child} />
        ))}
      </View>
    </View>
  );
}
