import {
  GoalForm,
  type GoalFormInitial,
  type GoalFormValues,
} from "@/components/app/account/goal-form";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import type {
  GoalRank,
  GoalStatus,
  GoalType,
} from "@nativesquare/agoge/schema";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";

type RaceDoc = NonNullable<
  ReturnType<typeof useQuery<typeof api.plan.races.getMyRace>>
>;

type GoalDoc = {
  _id: string;
  type: GoalType;
  title: string;
  description?: string;
  targetValue: string;
  targetDate?: string;
  rank?: GoalRank;
  status: GoalStatus;
};

const PRIORITY_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.lime,
  B: COLORS.ora,
  C: LIGHT_THEME.w3,
};

const PRIORITY_TEXT_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.black,
  B: COLORS.black,
  C: LIGHT_THEME.wSub,
};

const STATUS_LABELS: Record<
  "upcoming" | "completed" | "cancelled" | "dnf" | "dns",
  string
> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  dnf: "DNF",
  dns: "DNS",
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  loop: "Loop",
  point_to_point: "Point to point",
  out_and_back: "Out & back",
  laps: "Laps",
  other: "Other",
};

const SURFACE_LABELS: Record<string, string> = {
  pavement: "Pavement",
  mixed: "Mixed",
  trail: "Trail",
  technical_trail: "Technical trail",
  track: "Track",
  other: "Other",
};

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  performance: "Performance",
  completion: "Completion",
  process: "Process",
  volume: "Volume",
  body: "Body",
  other: "Other",
};

const GOAL_RANK_COLORS: Record<GoalRank, string> = {
  primary: COLORS.lime,
  stretch: COLORS.ora,
  minimum: LIGHT_THEME.wMute,
  process: COLORS.blu,
};

const GOAL_RANK_LABELS: Record<GoalRank, string> = {
  primary: "Primary",
  stretch: "Stretch",
  minimum: "Minimum",
  process: "Process",
};

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  missed: "Missed",
  abandoned: "Abandoned",
  paused: "Paused",
};

const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  active: LIGHT_THEME.wMute,
  achieved: COLORS.grn,
  missed: COLORS.red,
  abandoned: LIGHT_THEME.wMute,
  paused: COLORS.ylw,
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    const rounded = Math.round(km * 10) / 10;
    return `${rounded} km`;
  }
  return `${meters} m`;
}

function formatLocation(loc?: RaceDoc["location"]): string | null {
  if (!loc) return null;
  const parts = [loc.city, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function RaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const race = useQuery(api.plan.races.getMyRace, { raceId: id });
  const goals = useQuery(
    api.plan.goals.listGoalsForRace,
    race ? { raceId: race._id } : "skip",
  ) as GoalDoc[] | undefined;

  const createGoal = useMutation(api.plan.goals.createGoalForRace);
  const updateGoal = useMutation(api.plan.goals.updateGoal);
  const deleteGoal = useMutation(api.plan.goals.deleteGoal);

  const goalSheetRef = React.useRef<GorhomBottomSheetModal>(null);
  const [editingGoal, setEditingGoal] = React.useState<GoalDoc | null>(null);

  const openCreateGoal = () => {
    setEditingGoal(null);
    goalSheetRef.current?.present();
  };

  const openEditGoal = (goal: GoalDoc) => {
    setEditingGoal(goal);
    goalSheetRef.current?.present();
  };

  const handleSubmitGoal = async (values: GoalFormValues) => {
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
    } else if (race) {
      await createGoal({
        raceId: race._id,
        type: values.type,
        title: values.title,
        targetValue: values.targetValue,
        description: values.description,
        targetDate: values.targetDate,
        rank: values.rank,
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!editingGoal) return;
    await deleteGoal({ goalId: editingGoal._id });
  };

  if (race === undefined) {
    return <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }} />;
  }

  if (race === null) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center px-4"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          Race not found
        </Text>
      </View>
    );
  }

  const priority = race.priority as "A" | "B" | "C";
  const distance = formatDistance(race.distanceMeters);
  const locationText = formatLocation(race.location);
  const hasRaceDetails =
    race.courseType ||
    race.surface ||
    race.elevationGainMeters != null ||
    race.bibNumber ||
    race.registrationUrl;
  const hasResult =
    race.status === "completed" &&
    race.result &&
    (race.result.finishTime ||
      race.result.placement != null ||
      race.result.notes);

  const goalFormInitial: GoalFormInitial | undefined = editingGoal
    ? {
        type: editingGoal.type,
        title: editingGoal.title,
        targetValue: editingGoal.targetValue,
        description: editingGoal.description,
        targetDate: editingGoal.targetDate,
        rank: editingGoal.rank,
        status: editingGoal.status,
      }
    : undefined;

  return (
    <View className="pt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
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
          Race
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(app)/account/races/[id]/edit",
              params: { id },
            })
          }
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="create-outline" size={18} color={LIGHT_THEME.wText} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-5 self-center">
          <View
            className="flex-row items-center gap-4 rounded-3xl border px-5 py-5"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <View
              className="size-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: PRIORITY_COLORS[priority] }}
            >
              <Text
                className="font-coach-extrabold text-[22px]"
                style={{ color: PRIORITY_TEXT_COLORS[priority] }}
              >
                {priority}
              </Text>
            </View>
            <View className="flex-1 gap-1">
              <Text
                className="font-coach-bold text-[18px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {race.name}
              </Text>
              <Text
                className="font-coach text-[13px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {formatDate(race.date)}
                {distance ? ` · ${distance}` : ""}
              </Text>
              <View
                className="mt-1 self-start rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: LIGHT_THEME.w3 }}
              >
                <Text
                  className="font-coach-semibold text-[10px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {STATUS_LABELS[race.status]}
                </Text>
              </View>
            </View>
          </View>

          <GoalsSection
            goals={goals}
            onAdd={openCreateGoal}
            onTapGoal={openEditGoal}
          />

          {(locationText || race.notes) && (
            <DetailSection title="Event">
              {locationText && (
                <DetailRow label="Location" value={locationText} />
              )}
              {race.notes && <DetailRow label="Notes" value={race.notes} />}
            </DetailSection>
          )}

          {hasRaceDetails && (
            <DetailSection title="Race details">
              {race.courseType && (
                <DetailRow
                  label="Course"
                  value={COURSE_TYPE_LABELS[race.courseType] ?? race.courseType}
                />
              )}
              {race.surface && (
                <DetailRow
                  label="Surface"
                  value={SURFACE_LABELS[race.surface] ?? race.surface}
                />
              )}
              {race.elevationGainMeters != null && (
                <DetailRow
                  label="Elevation gain"
                  value={`${race.elevationGainMeters} m`}
                />
              )}
              {race.bibNumber && (
                <DetailRow label="Bib" value={race.bibNumber} />
              )}
              {race.registrationUrl && (
                <DetailRow
                  label="Registration"
                  value={race.registrationUrl}
                  onPress={() =>
                    Linking.openURL(race.registrationUrl as string).catch(
                      () => undefined,
                    )
                  }
                />
              )}
            </DetailSection>
          )}

          {hasResult && race.result && (
            <DetailSection title="Result">
              {race.result.finishTime && (
                <DetailRow
                  label="Finish time"
                  value={race.result.finishTime}
                />
              )}
              {race.result.placement != null && (
                <DetailRow
                  label="Placement"
                  value={`#${race.result.placement}`}
                />
              )}
              {race.result.notes && (
                <DetailRow label="Notes" value={race.result.notes} />
              )}
            </DetailSection>
          )}
        </View>
      </ScrollView>

      <GoalForm
        sheetRef={goalSheetRef}
        mode={editingGoal ? "edit" : "create"}
        initial={goalFormInitial}
        onSubmit={handleSubmitGoal}
        onDelete={editingGoal ? handleDeleteGoal : undefined}
        onDismiss={() => setEditingGoal(null)}
      />
    </View>
  );
}

function GoalsSection({
  goals,
  onAdd,
  onTapGoal,
}: {
  goals: GoalDoc[] | undefined;
  onAdd: () => void;
  onTapGoal: (goal: GoalDoc) => void;
}) {
  const items = goals ?? [];
  const hasGoals = items.length > 0;

  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        Goals
      </Text>
      <View
        className="rounded-2xl border"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {items.map((goal, idx) => (
          <GoalRow
            key={goal._id}
            goal={goal}
            onPress={() => onTapGoal(goal)}
            isLast={idx === items.length - 1}
          />
        ))}
        <Pressable
          onPress={onAdd}
          className="flex-row items-center gap-2 px-4 py-5 active:opacity-70"
          style={
            hasGoals
              ? { borderTopWidth: 1, borderTopColor: LIGHT_THEME.wBrd }
              : undefined
          }
        >
          <Ionicons name="add" size={16} color={LIGHT_THEME.wSub} />
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wSub }}
          >
            Add a goal
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function GoalRow({
  goal,
  onPress,
  isLast,
}: {
  goal: GoalDoc;
  onPress: () => void;
  isLast: boolean;
}) {
  const rankColor = goal.rank ? GOAL_RANK_COLORS[goal.rank] : LIGHT_THEME.w3;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-3 active:opacity-70"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
      }
    >
      <View
        className="mt-1.5 size-2.5 rounded-full"
        style={{ backgroundColor: rankColor }}
      />
      <View className="flex-1 gap-0.5">
        <Text
          className="font-coach-semibold text-[10px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {GOAL_TYPE_LABELS[goal.type]}
          {goal.rank ? ` · ${GOAL_RANK_LABELS[goal.rank]}` : ""}
        </Text>
        <Text
          className="font-coach-bold text-[14px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {goal.title}
        </Text>
        {goal.targetDate && (
          <Text
            className="font-coach text-[11px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            by {formatDate(goal.targetDate)}
          </Text>
        )}
        {goal.status !== "active" && (
          <View
            className="mt-1 self-start rounded-full px-2 py-0.5"
            style={{ backgroundColor: LIGHT_THEME.w3 }}
          >
            <Text
              className="font-coach-semibold text-[10px]"
              style={{ color: GOAL_STATUS_COLORS[goal.status] }}
            >
              {GOAL_STATUS_LABELS[goal.status]}
            </Text>
          </View>
        )}
      </View>
      <Text
        className="max-w-[40%] text-right font-coach-extrabold text-[14px]"
        style={{ color: LIGHT_THEME.wText }}
        numberOfLines={2}
      >
        {goal.targetValue}
      </Text>
    </Pressable>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-start justify-between gap-3 px-4 py-3">
      <Text
        className="font-coach-semibold text-[12px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Text
        className="flex-1 text-right font-coach-medium text-[14px]"
        style={{ color: onPress ? COLORS.lime : LIGHT_THEME.wText }}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }
  return content;
}
