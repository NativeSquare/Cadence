import { SettingsGroup } from "@/components/app/account/settings-group";
import { Text } from "@/components/ui/text";
import { useEntitlement } from "@/contexts/entitlement-context";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useLanguage } from "@/lib/i18n";
import { isProActive, restore } from "@/lib/purchases";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, ScrollView, View } from "react-native";

const MANAGE_URL = "https://apps.apple.com/account/subscriptions";

function formatDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLanguage();
  const { isPro } = useEntitlement();
  const user = useQuery(api.table.users.currentUser);
  const sub = user?.subscription;
  const [restoring, setRestoring] = useState(false);

  const isAnnual = sub?.productId?.toLowerCase().includes("annual");
  const planLabel = isAnnual
    ? t("paywall.planAnnual")
    : t("paywall.planMonthly");
  const renewalDate = formatDate(sub?.expiresAt, locale);

  const statusLine = !isPro
    ? t("account.subscription.statusInactive")
    : sub?.isTrial
      ? t("account.subscription.statusTrial")
      : sub?.willRenew === false
        ? t("account.subscription.statusCancelled")
        : t("account.subscription.statusActive");

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    const res = await restore();
    setRestoring(false);
    if (res.status === "error") {
      Alert.alert(t("paywall.errorTitle"), res.message);
    } else if (res.status === "success" && !isProActive(res.customerInfo)) {
      Alert.alert(t("paywall.restoreNoneTitle"), t("paywall.restoreNoneBody"));
    }
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
          {t("account.subscription.title")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* Status card */}
          <View
            className="gap-4 rounded-3xl p-5"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderWidth: 1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="size-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: isPro ? COLORS.lime : LIGHT_THEME.w3 }}
              >
                <Ionicons
                  name={isPro ? "flash" : "lock-closed"}
                  size={22}
                  color={LIGHT_THEME.wText}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="font-coach-bold text-[17px]"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {isPro ? t("account.subscription.proTitle") : planLabel}
                </Text>
                <Text
                  className="font-coach-medium text-[13px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {statusLine}
                </Text>
              </View>
            </View>

            {isPro && (
              <View className="gap-2">
                <Row label={t("account.subscription.plan")} value={planLabel} />
                {renewalDate && (
                  <Row
                    label={
                      sub?.willRenew === false
                        ? t("account.subscription.accessUntil")
                        : t("account.subscription.renewsOn")
                    }
                    value={renewalDate}
                  />
                )}
              </View>
            )}
          </View>

          <SettingsGroup title={t("account.subscription.manageSection")}>
            <ActionRow
              icon="open-outline"
              label={t("account.subscription.manageApple")}
              onPress={() => Linking.openURL(MANAGE_URL)}
            />
            <ActionRow
              icon="refresh-outline"
              label={
                restoring
                  ? t("paywall.restoring")
                  : t("account.subscription.restore")
              }
              onPress={handleRestore}
              isLast
            />
          </SettingsGroup>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className="font-coach-medium text-[14px]"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {label}
      </Text>
      <Text
        className="font-coach-semibold text-[14px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 px-5 py-5 active:opacity-70"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
      }
    >
      <Ionicons name={icon} size={20} color={LIGHT_THEME.wText} />
      <Text
        className="flex-1 font-coach-medium text-[16px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}
