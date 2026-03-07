import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";

type GoalType =
  | "race"
  | "speed"
  | "base_building"
  | "return_to_fitness"
  | "general_health";

const GOAL_OPTIONS: { value: GoalType; label: string; icon: string }[] = [
  { value: "race", label: "Train for a Race", icon: "trophy-outline" },
  { value: "speed", label: "Get Faster", icon: "flash-outline" },
  { value: "base_building", label: "Build Base Fitness", icon: "layers-outline" },
  { value: "return_to_fitness", label: "Return to Running", icon: "refresh-outline" },
  { value: "general_health", label: "General Health", icon: "heart-outline" },
];

const RACE_DISTANCES: { value: number; label: string }[] = [
  { value: 5, label: "5K" },
  { value: 10, label: "10K" },
  { value: 21.1, label: "Half Marathon" },
  { value: 42.2, label: "Marathon" },
];

export default function GoalScreen() {
  const router = useRouter();
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const updateRunner = useMutation(api.table.runners.updateRunner);

  const [goalType, setGoalType] = React.useState<GoalType | undefined>();
  const [raceDistance, setRaceDistance] = React.useState<number | undefined>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (runner?.goals && !initialized.current) {
      initialized.current = true;
      setGoalType(runner.goals.goalType);
      setRaceDistance(runner.goals.raceDistance);
    }
  }, [runner]);

  const hasChanges =
    goalType !== (runner?.goals?.goalType ?? undefined) ||
    raceDistance !== (runner?.goals?.raceDistance ?? undefined);

  const handleSave = async () => {
    if (!runner?._id) return;
    setError(null);
    setIsLoading(true);

    try {
      await updateRunner({
        runnerId: runner._id,
        fields: {
          goals: {
            ...runner.goals,
            goalType,
            raceDistance: goalType === "race" ? raceDistance : undefined,
          },
        },
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

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
          Goal
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              What's your goal?
            </Text>
            <View className="gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const isActive = goalType === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGoalType(opt.value)}
                    className="flex-row items-center gap-3.5 rounded-xl px-4 py-3.5 active:opacity-80"
                    style={{
                      backgroundColor: isActive
                        ? LIGHT_THEME.wText
                        : LIGHT_THEME.w1,
                      borderWidth: 1,
                      borderColor: isActive
                        ? LIGHT_THEME.wText
                        : LIGHT_THEME.wBrd,
                    }}
                  >
                    <Ionicons
                      name={opt.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={isActive ? COLORS.lime : LIGHT_THEME.wSub}
                    />
                    <Text
                      className="font-coach-medium text-[15px]"
                      style={{
                        color: isActive ? "#FFFFFF" : LIGHT_THEME.wText,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {goalType === "race" && (
            <View className="gap-2">
              <Text
                className="font-coach-semibold text-[11px] uppercase tracking-wider"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Race distance
              </Text>
              <View className="flex-row gap-2">
                {RACE_DISTANCES.map((d) => {
                  const isActive = raceDistance === d.value;
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => setRaceDistance(d.value)}
                      className="flex-1 items-center rounded-xl py-3 active:opacity-80"
                      style={{
                        backgroundColor: isActive
                          ? LIGHT_THEME.wText
                          : LIGHT_THEME.w1,
                        borderWidth: 1,
                        borderColor: isActive
                          ? LIGHT_THEME.wText
                          : LIGHT_THEME.wBrd,
                      }}
                    >
                      <Text
                        className="font-coach-semibold text-[13px]"
                        style={{
                          color: isActive ? "#FFFFFF" : LIGHT_THEME.wSub,
                        }}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="w-full max-w-md gap-2 self-center px-4 pb-4 mb-safe">
        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={isLoading || !hasChanges}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !hasChanges ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isLoading || !hasChanges ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
