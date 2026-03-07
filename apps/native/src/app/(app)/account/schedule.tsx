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

type PreferredTime = "morning" | "midday" | "evening" | "varies";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const TIME_OPTIONS: { value: PreferredTime; label: string; icon: string }[] = [
  { value: "morning", label: "Morning", icon: "sunny-outline" },
  { value: "midday", label: "Midday", icon: "partly-sunny-outline" },
  { value: "evening", label: "Evening", icon: "moon-outline" },
  { value: "varies", label: "Varies", icon: "shuffle-outline" },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const updateRunner = useMutation(api.table.runners.updateRunner);

  const [availableDays, setAvailableDays] = React.useState<number | undefined>();
  const [blockedDays, setBlockedDays] = React.useState<string[]>([]);
  const [preferredTime, setPreferredTime] = React.useState<
    PreferredTime | undefined
  >();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (runner?.schedule && !initialized.current) {
      initialized.current = true;
      setAvailableDays(runner.schedule.availableDays);
      setBlockedDays(runner.schedule.blockedDays ?? []);
      setPreferredTime(runner.schedule.preferredTime);
    }
  }, [runner]);

  const toggleBlockedDay = (day: string) => {
    setBlockedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const hasChanges =
    availableDays !== (runner?.schedule?.availableDays ?? undefined) ||
    JSON.stringify(blockedDays.sort()) !==
      JSON.stringify([...(runner?.schedule?.blockedDays ?? [])].sort()) ||
    preferredTime !== (runner?.schedule?.preferredTime ?? undefined);

  const handleSave = async () => {
    if (!runner?._id) return;
    setError(null);
    setIsLoading(true);

    try {
      await updateRunner({
        runnerId: runner._id,
        fields: {
          schedule: {
            ...runner.schedule,
            availableDays,
            blockedDays,
            preferredTime,
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
          Training Schedule
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* Available days per week */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Days per week
            </Text>
            <View className="flex-row gap-2">
              {[2, 3, 4, 5, 6, 7].map((n) => {
                const isActive = availableDays === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setAvailableDays(n)}
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
                      className="font-coach-semibold text-[15px]"
                      style={{
                        color: isActive ? "#FFFFFF" : LIGHT_THEME.wSub,
                      }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Rest days */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Rest days (blocked)
            </Text>
            <View className="flex-row gap-1.5">
              {DAYS.map((day) => {
                const isBlocked = blockedDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleBlockedDay(day)}
                    className="flex-1 items-center rounded-xl py-3 active:opacity-80"
                    style={{
                      backgroundColor: isBlocked
                        ? COLORS.redDim
                        : LIGHT_THEME.w1,
                      borderWidth: 1,
                      borderColor: isBlocked
                        ? COLORS.red
                        : LIGHT_THEME.wBrd,
                    }}
                  >
                    <Text
                      className="font-coach-semibold text-[12px]"
                      style={{
                        color: isBlocked ? COLORS.red : LIGHT_THEME.wSub,
                      }}
                    >
                      {DAY_LABELS[day]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Preferred time */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Preferred training time
            </Text>
            <View className="gap-2">
              {TIME_OPTIONS.map((opt) => {
                const isActive = preferredTime === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPreferredTime(opt.value)}
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
