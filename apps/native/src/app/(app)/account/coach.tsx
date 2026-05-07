import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

import { SettingsGroup } from "@/components/app/account/settings-group";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

type CoachTone = "mentor" | "drillSergeant" | "pragmatic";
type CoachVerbosity = "concise" | "detailed";

const TONES: CoachTone[] = ["mentor", "drillSergeant", "pragmatic"];
const VERBOSITIES: CoachVerbosity[] = ["concise", "detailed"];

const DEFAULT_TONE: CoachTone = "mentor";
const DEFAULT_VERBOSITY: CoachVerbosity = "concise";

export default function CoachSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useQuery(api.table.users.currentUser);
  const setCoachPrefs = useMutation(api.table.users.setCoachPrefs);

  const tone: CoachTone = user?.coachPrefs?.tone ?? DEFAULT_TONE;
  const verbosity: CoachVerbosity =
    user?.coachPrefs?.verbosity ?? DEFAULT_VERBOSITY;

  const update = (next: { tone?: CoachTone; verbosity?: CoachVerbosity }) => {
    setCoachPrefs({
      prefs: {
        tone: next.tone ?? tone,
        verbosity: next.verbosity ?? verbosity,
      },
    }).catch((err) => console.warn("[coach] setCoachPrefs failed", err));
  };

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
          {t("account.coach.title")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <SettingsGroup title={t("account.coach.toneSection")}>
            {TONES.map((value, index) => (
              <OptionRow
                key={value}
                label={t(`account.coach.tones.${value}.label`)}
                description={t(`account.coach.tones.${value}.description`)}
                isActive={tone === value}
                isLast={index === TONES.length - 1}
                onPress={() => update({ tone: value })}
              />
            ))}
          </SettingsGroup>

          <SettingsGroup title={t("account.coach.verbositySection")}>
            {VERBOSITIES.map((value, index) => (
              <OptionRow
                key={value}
                label={t(`account.coach.verbosities.${value}.label`)}
                description={t(`account.coach.verbosities.${value}.description`)}
                isActive={verbosity === value}
                isLast={index === VERBOSITIES.length - 1}
                onPress={() => update({ verbosity: value })}
              />
            ))}
          </SettingsGroup>
        </View>
      </ScrollView>
    </View>
  );
}

function OptionRow({
  label,
  description,
  isActive,
  isLast,
  onPress,
}: {
  label: string;
  description: string;
  isActive: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-4 px-5 py-4 active:opacity-70"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
      }
    >
      <View className="flex-1">
        <Text
          className="font-coach-medium text-[17px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {label}
        </Text>
        <Text
          className="mt-0.5 font-coach text-[13px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {description}
        </Text>
      </View>
      {isActive && (
        <Ionicons
          name="checkmark"
          size={22}
          color={LIGHT_THEME.wText}
          style={{ marginTop: 2 }}
        />
      )}
    </Pressable>
  );
}
