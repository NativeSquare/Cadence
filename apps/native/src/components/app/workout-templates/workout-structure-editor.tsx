import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { StepEditorSheet } from "@/components/app/workout-templates/step-editor-sheet";
import {
  formatDuration,
  formatTarget,
  INTENT_COLORS,
  INTENT_LABELS,
} from "@/components/app/workout-templates/workout-helpers";
import type { Block, Repeat, Step, Workout } from "@nativesquare/agoge";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { Pressable, TextInput, View } from "react-native";

type Props = {
  value: Workout;
  onChange: (next: Workout) => void;
  /**
   * Map of "blocks.<i>" or "blocks.<i>.children.<j>" → first error message,
   * derived from a Zod issue.path. Used to highlight problem rows.
   */
  errorByPath?: Record<string, string>;
};

type Editing =
  | { kind: "newTopStep" }
  | { kind: "topStep"; index: number }
  | { kind: "newChild"; repeatIndex: number }
  | { kind: "child"; repeatIndex: number; childIndex: number };

export function WorkoutStructureEditor({
  value,
  onChange,
  errorByPath,
}: Props) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const [editing, setEditing] = React.useState<Editing | null>(null);

  const openSheet = (next: Editing) => {
    setEditing(next);
    sheetRef.current?.present();
  };

  const closeSheet = () => {
    setEditing(null);
  };

  const updateBlocks = (next: Block[]) => onChange({ ...value, blocks: next });

  const handleAddTopStep = () => {
    selectionFeedback();
    openSheet({ kind: "newTopStep" });
  };

  const handleAddRepeat = () => {
    selectionFeedback();
    const repeat: Repeat = {
      kind: "repeat",
      count: 4,
      children: [
        {
          kind: "step",
          intent: "work",
          duration: { type: "time", seconds: 60 },
          target: { type: "none" },
        },
      ],
    };
    updateBlocks([...value.blocks, repeat]);
  };

  const handleSaveStep = (step: Step) => {
    if (!editing) return;
    if (editing.kind === "newTopStep") {
      updateBlocks([...value.blocks, step]);
    } else if (editing.kind === "topStep") {
      const next = value.blocks.slice();
      next[editing.index] = step;
      updateBlocks(next);
    } else if (editing.kind === "newChild") {
      const next = value.blocks.slice();
      const block = next[editing.repeatIndex];
      if (block && block.kind === "repeat") {
        next[editing.repeatIndex] = {
          ...block,
          children: [...block.children, step],
        };
        updateBlocks(next);
      }
    } else if (editing.kind === "child") {
      const next = value.blocks.slice();
      const block = next[editing.repeatIndex];
      if (block && block.kind === "repeat") {
        const children = block.children.slice();
        children[editing.childIndex] = step;
        next[editing.repeatIndex] = { ...block, children };
        updateBlocks(next);
      }
    }
  };

  const handleDeleteFromSheet = () => {
    if (!editing) return;
    if (editing.kind === "topStep") {
      updateBlocks(value.blocks.filter((_, i) => i !== editing.index));
    } else if (editing.kind === "child") {
      const next = value.blocks.slice();
      const block = next[editing.repeatIndex];
      if (block && block.kind === "repeat") {
        const children = block.children.filter(
          (_, j) => j !== editing.childIndex,
        );
        if (children.length === 0) {
          next.splice(editing.repeatIndex, 1);
        } else {
          next[editing.repeatIndex] = { ...block, children };
        }
        updateBlocks(next);
      }
    }
  };

  const moveBlock = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.blocks.length) return;
    const next = value.blocks.slice();
    const [removed] = next.splice(index, 1);
    if (removed) next.splice(target, 0, removed);
    updateBlocks(next);
  };

  const moveChild = (repeatIndex: number, childIndex: number, delta: number) => {
    const next = value.blocks.slice();
    const block = next[repeatIndex];
    if (!block || block.kind !== "repeat") return;
    const target = childIndex + delta;
    if (target < 0 || target >= block.children.length) return;
    const children = block.children.slice();
    const [removed] = children.splice(childIndex, 1);
    if (removed) children.splice(target, 0, removed);
    next[repeatIndex] = { ...block, children };
    updateBlocks(next);
  };

  const updateRepeatCount = (repeatIndex: number, count: number) => {
    const next = value.blocks.slice();
    const block = next[repeatIndex];
    if (!block || block.kind !== "repeat") return;
    next[repeatIndex] = { ...block, count: Math.max(1, Math.min(100, count)) };
    updateBlocks(next);
  };

  const sheetInitial: Step | null = (() => {
    if (!editing) return null;
    if (editing.kind === "topStep") {
      const b = value.blocks[editing.index];
      return b && b.kind === "step" ? b : null;
    }
    if (editing.kind === "child") {
      const b = value.blocks[editing.repeatIndex];
      if (b && b.kind === "repeat") return b.children[editing.childIndex] ?? null;
      return null;
    }
    return null;
  })();

  const canDeleteFromSheet =
    editing?.kind === "topStep" || editing?.kind === "child";

  return (
    <View className="gap-3">
      {value.blocks.length === 0 ? (
        <View
          className="items-center rounded-2xl border border-dashed px-4 py-8"
          style={{ borderColor: LIGHT_THEME.wBrd }}
        >
          <Text
            className="font-coach text-[13px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            No steps yet — add a step or repeat below.
          </Text>
        </View>
      ) : (
        value.blocks.map((block, i) => {
          if (block.kind === "step") {
            return (
              <StepCard
                key={i}
                step={block}
                error={errorByPath?.[`blocks.${i}`]}
                onPress={() => openSheet({ kind: "topStep", index: i })}
                onMoveUp={i > 0 ? () => moveBlock(i, -1) : undefined}
                onMoveDown={
                  i < value.blocks.length - 1
                    ? () => moveBlock(i, 1)
                    : undefined
                }
              />
            );
          }
          return (
            <RepeatCard
              key={i}
              repeat={block}
              errorByChild={(j) => errorByPath?.[`blocks.${i}.children.${j}`]}
              onMoveUp={i > 0 ? () => moveBlock(i, -1) : undefined}
              onMoveDown={
                i < value.blocks.length - 1 ? () => moveBlock(i, 1) : undefined
              }
              onDelete={() =>
                updateBlocks(value.blocks.filter((_, k) => k !== i))
              }
              onCountChange={(c) => updateRepeatCount(i, c)}
              onChildPress={(j) =>
                openSheet({ kind: "child", repeatIndex: i, childIndex: j })
              }
              onMoveChildUp={(j) => moveChild(i, j, -1)}
              onMoveChildDown={(j) => moveChild(i, j, 1)}
              onAddChild={() => openSheet({ kind: "newChild", repeatIndex: i })}
            />
          );
        })
      )}

      <View className="flex-row gap-2">
        <Pressable
          onPress={handleAddTopStep}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-3 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Ionicons name="add" size={16} color={LIGHT_THEME.wText} />
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            Add step
          </Text>
        </Pressable>
        <Pressable
          onPress={handleAddRepeat}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-3 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Ionicons name="repeat" size={16} color={LIGHT_THEME.wText} />
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            Add repeat
          </Text>
        </Pressable>
      </View>

      <StepEditorSheet
        sheetRef={sheetRef}
        initial={sheetInitial}
        onSave={handleSaveStep}
        onDelete={canDeleteFromSheet ? handleDeleteFromSheet : undefined}
        onDismiss={closeSheet}
      />
    </View>
  );
}

function StepCard({
  step,
  error,
  onPress,
  onMoveUp,
  onMoveDown,
}: {
  step: Step;
  error?: string;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const target = formatTarget(step.target);
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border px-3 py-3"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: error ? COLORS.red : LIGHT_THEME.wBrd,
      }}
    >
      <View
        className="size-2 rounded-full"
        style={{ backgroundColor: INTENT_COLORS[step.intent] }}
      />
      <Pressable onPress={onPress} className="flex-1 active:opacity-80">
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
        {error && (
          <Text
            className="mt-0.5 font-coach text-[11px]"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}
      </Pressable>
      <ReorderControls onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
    </View>
  );
}

function RepeatCard({
  repeat,
  errorByChild,
  onMoveUp,
  onMoveDown,
  onDelete,
  onCountChange,
  onChildPress,
  onMoveChildUp,
  onMoveChildDown,
  onAddChild,
}: {
  repeat: Repeat;
  errorByChild: (j: number) => string | undefined;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onCountChange: (count: number) => void;
  onChildPress: (j: number) => void;
  onMoveChildUp: (j: number) => void;
  onMoveChildDown: (j: number) => void;
  onAddChild: () => void;
}) {
  return (
    <View
      className="gap-3 rounded-2xl border px-3 py-3"
      style={{
        backgroundColor: LIGHT_THEME.w2,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons name="repeat" size={16} color={LIGHT_THEME.wSub} />
        <View className="flex-row items-center gap-2">
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            Repeat ×
          </Text>
          <TextInput
            className="h-9 w-14 rounded-lg border px-2 text-center font-coach-medium text-[14px]"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderColor: LIGHT_THEME.wBrd,
              color: LIGHT_THEME.wText,
            }}
            keyboardType="number-pad"
            value={String(repeat.count)}
            onChangeText={(t) => {
              const n = Number.parseInt(t.replace(/[^0-9]/g, "") || "0", 10);
              onCountChange(n || 1);
            }}
            selectionColor={COLORS.lime}
            cursorColor={COLORS.lime}
          />
        </View>
        <View className="flex-1" />
        <ReorderControls onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          className="size-7 items-center justify-center active:opacity-60"
        >
          <Ionicons name="trash-outline" size={14} color={COLORS.red} />
        </Pressable>
      </View>

      <View className="gap-2 pl-3">
        {repeat.children.map((child, j) => (
          <StepCard
            key={j}
            step={child}
            error={errorByChild(j)}
            onPress={() => onChildPress(j)}
            onMoveUp={j > 0 ? () => onMoveChildUp(j) : undefined}
            onMoveDown={
              j < repeat.children.length - 1
                ? () => onMoveChildDown(j)
                : undefined
            }
          />
        ))}
        <Pressable
          onPress={onAddChild}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 active:opacity-70"
          style={{ borderColor: LIGHT_THEME.wBrd }}
        >
          <Ionicons name="add" size={14} color={LIGHT_THEME.wSub} />
          <Text
            className="font-coach-semibold text-[12px]"
            style={{ color: LIGHT_THEME.wSub }}
          >
            Add step inside repeat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReorderControls({
  onMoveUp,
  onMoveDown,
}: {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <View className="flex-row gap-1">
      <Pressable
        onPress={onMoveUp}
        disabled={!onMoveUp}
        hitSlop={6}
        className="size-7 items-center justify-center active:opacity-60"
        style={{ opacity: onMoveUp ? 1 : 0.25 }}
      >
        <Ionicons name="chevron-up" size={14} color={LIGHT_THEME.wSub} />
      </Pressable>
      <Pressable
        onPress={onMoveDown}
        disabled={!onMoveDown}
        hitSlop={6}
        className="size-7 items-center justify-center active:opacity-60"
        style={{ opacity: onMoveDown ? 1 : 0.25 }}
      >
        <Ionicons name="chevron-down" size={14} color={LIGHT_THEME.wSub} />
      </Pressable>
    </View>
  );
}
