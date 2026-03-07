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

type RecoveryStyle = "quick" | "slow" | "push_through" | "no_injuries";
type SleepQuality = "solid" | "inconsistent" | "poor";
type StressLevel = "low" | "moderate" | "high" | "survival";

const RECOVERY_OPTIONS: { value: RecoveryStyle; label: string }[] = [
  { value: "quick", label: "Quick recovery" },
  { value: "slow", label: "Slow recovery" },
  { value: "push_through", label: "Push through" },
  { value: "no_injuries", label: "No injury history" },
];

const SLEEP_OPTIONS: { value: SleepQuality; label: string; icon: string }[] = [
  { value: "solid", label: "Solid", icon: "moon-outline" },
  { value: "inconsistent", label: "Inconsistent", icon: "cloudy-night-outline" },
  { value: "poor", label: "Poor", icon: "alert-circle-outline" },
];

const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "survival", label: "Survival mode" },
];

export default function HealthScreen() {
  const router = useRouter();
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const updateRunner = useMutation(api.table.runners.updateRunner);

  const [recoveryStyle, setRecoveryStyle] = React.useState<
    RecoveryStyle | undefined
  >();
  const [sleepQuality, setSleepQuality] = React.useState<
    SleepQuality | undefined
  >();
  const [stressLevel, setStressLevel] = React.useState<
    StressLevel | undefined
  >();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (runner?.health && !initialized.current) {
      initialized.current = true;
      setRecoveryStyle(runner.health.recoveryStyle);
      setSleepQuality(runner.health.sleepQuality);
      setStressLevel(runner.health.stressLevel);
    }
  }, [runner]);

  const hasChanges =
    recoveryStyle !== (runner?.health?.recoveryStyle ?? undefined) ||
    sleepQuality !== (runner?.health?.sleepQuality ?? undefined) ||
    stressLevel !== (runner?.health?.stressLevel ?? undefined);

  const handleSave = async () => {
    if (!runner?._id) return;
    setError(null);
    setIsLoading(true);

    try {
      await updateRunner({
        runnerId: runner._id,
        fields: {
          health: {
            ...runner.health,
            recoveryStyle,
            sleepQuality,
            stressLevel,
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
          Health & Recovery
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* Recovery Style */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Recovery style
            </Text>
            <View className="gap-2">
              {RECOVERY_OPTIONS.map((opt) => {
                const isActive = recoveryStyle === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setRecoveryStyle(opt.value)}
                    className="rounded-xl px-4 py-3.5 active:opacity-80"
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

          {/* Sleep Quality */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Sleep quality
            </Text>
            <View className="flex-row gap-2">
              {SLEEP_OPTIONS.map((opt) => {
                const isActive = sleepQuality === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSleepQuality(opt.value)}
                    className="flex-1 items-center gap-1.5 rounded-xl py-3 active:opacity-80"
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
                      className="font-coach-semibold text-[12px]"
                      style={{
                        color: isActive ? "#FFFFFF" : LIGHT_THEME.wSub,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Stress Level */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Stress level
            </Text>
            <View className="flex-row gap-2">
              {STRESS_OPTIONS.map((opt) => {
                const isActive = stressLevel === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStressLevel(opt.value)}
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
                      className="font-coach-semibold text-[12px]"
                      style={{
                        color: isActive ? "#FFFFFF" : LIGHT_THEME.wSub,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
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
