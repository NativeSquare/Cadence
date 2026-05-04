import { GoalRow, type GoalRowDoc } from "@/components/app/account/goal-row";
import {
  GoalForm,
  type GoalFormInitial,
  type GoalFormValues,
} from "@/components/app/account/goal-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

const ACTIVE: GoalRowDoc["status"] = "active";

function partition(goals: GoalRowDoc[]) {
  const active: GoalRowDoc[] = [];
  const resolved: GoalRowDoc[] = [];
  for (const g of goals) {
    if (g.status === ACTIVE) active.push(g);
    else resolved.push(g);
  }
  const byTargetDate = (a: GoalRowDoc, b: GoalRowDoc) => {
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return 0;
  };
  active.sort(byTargetDate);
  resolved.sort((a, b) => byTargetDate(b, a));
  return { active, resolved };
}

export default function GoalsListScreen() {
  const router = useRouter();
  const goals = useQuery(api.agoge.goals.listMyGoals) as
    | GoalRowDoc[]
    | undefined;
  const races = useQuery(api.agoge.races.listMyRaces);

  const racesById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const r of races ?? []) map.set(r._id, r.name);
    return map;
  }, [races]);

  const { active, resolved } = React.useMemo(
    () => (goals ? partition(goals) : { active: [], resolved: [] }),
    [goals],
  );

  const createGoal = useMutation(api.agoge.goals.createGoal);
  const updateGoal = useMutation(api.agoge.goals.updateGoal);
  const deleteGoal = useMutation(api.agoge.goals.deleteGoal);

  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);
  const [editingGoal, setEditingGoal] = React.useState<GoalRowDoc | null>(null);

  const openCreate = () => {
    setEditingGoal(null);
    sheetRef.current?.present();
  };

  const openEdit = (goal: GoalRowDoc) => {
    setEditingGoal(goal);
    sheetRef.current?.present();
  };

  const handleSubmit = async (values: GoalFormValues) => {
    if (editingGoal) {
      await updateGoal({
        goalId: editingGoal._id,
        type: values.type,
        title: values.title,
        targetValue: values.targetValue,
        description: values.description,
        targetDate: values.targetDate,
        rank: values.rank,
        status: values.status,
      });
    } else {
      await createGoal({
        raceId: values.raceId,
        type: values.type,
        title: values.title,
        targetValue: values.targetValue,
        description: values.description,
        targetDate: values.targetDate,
        rank: values.rank,
        status: values.status ?? "active",
      });
    }
  };

  const handleDelete = async () => {
    if (!editingGoal) return;
    await deleteGoal({ goalId: editingGoal._id });
  };

  const initial: GoalFormInitial | undefined = editingGoal
    ? {
        type: editingGoal.type,
        title: editingGoal.title,
        targetValue: editingGoal.targetValue,
        description: editingGoal.description,
        targetDate: editingGoal.targetDate,
        rank: editingGoal.rank,
        status: editingGoal.status,
        raceId: editingGoal.raceId,
      }
    : undefined;

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
          Goals
        </Text>
        <Pressable
          onPress={openCreate}
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
        {goals === undefined ? null : active.length === 0 &&
          resolved.length === 0 ? (
          <View className="w-full max-w-md items-center gap-2 self-center pt-20">
            <Text
              className="font-coach-medium text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              No goals yet
            </Text>
            <Text
              className="text-center font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Set targets to focus your training.
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-md gap-6 self-center">
            {active.length > 0 && (
              <GoalsSection
                title="Active"
                goals={active}
                racesById={racesById}
                onTap={openEdit}
              />
            )}
            {resolved.length > 0 && (
              <GoalsSection
                title="Resolved"
                goals={resolved}
                racesById={racesById}
                dimmed
                onTap={openEdit}
              />
            )}
          </View>
        )}
      </ScrollView>

      <GoalForm
        sheetRef={sheetRef}
        mode={editingGoal ? "edit" : "create"}
        initial={initial}
        onSubmit={handleSubmit}
        onDelete={editingGoal ? handleDelete : undefined}
        onDismiss={() => setEditingGoal(null)}
      />
    </View>
  );
}

function GoalsSection({
  title,
  goals,
  racesById,
  dimmed = false,
  onTap,
}: {
  title: string;
  goals: GoalRowDoc[];
  racesById: Map<string, string>;
  dimmed?: boolean;
  onTap: (goal: GoalRowDoc) => void;
}) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {title}
      </Text>
      <View
        className="rounded-2xl border"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {goals.map((goal, idx) => (
          <GoalRow
            key={goal._id}
            goal={goal}
            raceName={goal.raceId ? racesById.get(goal.raceId) : undefined}
            dimmed={dimmed}
            isLast={idx === goals.length - 1}
            onPress={() => onTap(goal)}
          />
        ))}
      </View>
    </View>
  );
}
