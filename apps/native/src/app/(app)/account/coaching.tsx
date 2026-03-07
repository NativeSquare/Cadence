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

type CoachingVoice = "tough_love" | "encouraging" | "analytical" | "minimalist";
type DataOrientation = "data_driven" | "curious" | "feel_based";

const VOICE_OPTIONS: {
  value: CoachingVoice;
  label: string;
  description: string;
}[] = [
  {
    value: "tough_love",
    label: "Tough Love",
    description: "Direct, no-nonsense feedback",
  },
  {
    value: "encouraging",
    label: "Encouraging",
    description: "Positive, supportive motivation",
  },
  {
    value: "analytical",
    label: "Analytical",
    description: "Data-focused, detailed insights",
  },
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Brief, essential info only",
  },
];

const DATA_OPTIONS: {
  value: DataOrientation;
  label: string;
  description: string;
}[] = [
  {
    value: "data_driven",
    label: "Data-Driven",
    description: "Show me all the numbers",
  },
  {
    value: "curious",
    label: "Curious",
    description: "Some data, some feel",
  },
  {
    value: "feel_based",
    label: "Feel-Based",
    description: "Keep it simple, trust my body",
  },
];

export default function CoachingScreen() {
  const router = useRouter();
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const updateRunner = useMutation(api.table.runners.updateRunner);

  const [coachingVoice, setCoachingVoice] = React.useState<
    CoachingVoice | undefined
  >();
  const [dataOrientation, setDataOrientation] = React.useState<
    DataOrientation | undefined
  >();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (runner?.coaching && !initialized.current) {
      initialized.current = true;
      setCoachingVoice(runner.coaching.coachingVoice);
      setDataOrientation(runner.coaching.dataOrientation);
    }
  }, [runner]);

  const hasChanges =
    coachingVoice !== (runner?.coaching?.coachingVoice ?? undefined) ||
    dataOrientation !== (runner?.coaching?.dataOrientation ?? undefined);

  const handleSave = async () => {
    if (!runner?._id) return;
    setError(null);
    setIsLoading(true);

    try {
      await updateRunner({
        runnerId: runner._id,
        fields: {
          coaching: {
            ...runner.coaching,
            coachingVoice,
            dataOrientation,
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
          Coaching Style
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* Coaching Voice */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Coaching voice
            </Text>
            <View className="gap-2">
              {VOICE_OPTIONS.map((opt) => {
                const isActive = coachingVoice === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setCoachingVoice(opt.value)}
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
                    <Text
                      className="mt-0.5 font-coach text-[12px]"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.6)" : LIGHT_THEME.wMute,
                      }}
                    >
                      {opt.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Data Orientation */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Data preference
            </Text>
            <View className="gap-2">
              {DATA_OPTIONS.map((opt) => {
                const isActive = dataOrientation === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setDataOrientation(opt.value)}
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
                    <Text
                      className="mt-0.5 font-coach text-[12px]"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.6)" : LIGHT_THEME.wMute,
                      }}
                    >
                      {opt.description}
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
