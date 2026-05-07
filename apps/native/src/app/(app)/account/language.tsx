import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { SettingsGroup } from "@/components/app/account/settings-group";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  Language,
  setLanguage,
  SUPPORTED_LANGUAGES,
  useLanguage,
} from "@/lib/i18n";

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const current = useLanguage();

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
          {t("account.language.title")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <SettingsGroup title={t("account.language.sectionTitle")}>
            {SUPPORTED_LANGUAGES.map((code, index) => (
              <LanguageRow
                key={code}
                code={code}
                label={t(`account.language.${code === "en" ? "english" : "french"}`)}
                isActive={current === code}
                isLast={index === SUPPORTED_LANGUAGES.length - 1}
              />
            ))}
          </SettingsGroup>
        </View>
      </ScrollView>
    </View>
  );
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
};

function LanguageRow({
  code,
  label,
  isActive,
  isLast,
}: {
  code: Language;
  label: string;
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <Pressable
      onPress={() => setLanguage(code)}
      className="flex-row items-center gap-4 px-5 py-5 active:opacity-70"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
      }
    >
      <Text className="text-[26px]">{LANGUAGE_FLAGS[code]}</Text>
      <Text
        className="flex-1 font-coach-medium text-[17px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {label}
      </Text>
      {isActive && (
        <Ionicons name="checkmark" size={22} color={LIGHT_THEME.wText} />
      )}
    </Pressable>
  );
}
