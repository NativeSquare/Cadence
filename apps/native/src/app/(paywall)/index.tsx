import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import {
  getCurrentOffering,
  isProActive,
  purchase,
  restore,
} from "@/lib/purchases";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import type { PurchasesOffering } from "react-native-purchases";

const TERMS_URL = "https://cadencerun.fr/terms";
const PRIVACY_URL = "https://cadencerun.fr/privacy";

const FEATURE_KEYS = [
  "paywall.features.coach",
  "paywall.features.sync",
  "paywall.features.analytics",
  "paywall.features.recovery",
] as const;

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentOffering()
      .then((o) => {
        if (cancelled) return;
        setOffering(o);
        const annual = o?.availablePackages.find(
          (p) => p.packageType === "ANNUAL",
        );
        setSelectedId(
          annual?.identifier ?? o?.availablePackages[0]?.identifier ?? null,
        );
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const packages = useMemo(() => offering?.availablePackages ?? [], [offering]);
  const selected = packages.find((p) => p.identifier === selectedId) ?? null;
  const selectedIsAnnual = selected?.packageType === "ANNUAL";

  // Savings of the annual plan vs paying 12× the monthly plan.
  const savings = useMemo(() => {
    const monthly = packages.find((p) => p.packageType === "MONTHLY");
    const annual = packages.find((p) => p.packageType === "ANNUAL");
    if (!monthly || !annual || monthly.product.price <= 0) return null;
    const pct = Math.round(
      (1 - annual.product.price / (monthly.product.price * 12)) * 100,
    );
    return pct > 0 ? pct : null;
  }, [packages]);

  const handlePurchase = async () => {
    if (!selected || purchasing) return;
    selectionFeedback();
    setPurchasing(true);
    const res = await purchase(selected);
    setPurchasing(false);
    if (res.status === "error") {
      Alert.alert(t("paywall.errorTitle"), res.message);
    }
    // On success the entitlement listener flips `isPro` and the root router
    // guard navigates into the app automatically — nothing to do here.
  };

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
    <View
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={LIGHT_THEME.wMute} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-4 pt-6"
          >
            <View
              className="size-[64px] items-center justify-center self-start rounded-2xl"
              style={{ backgroundColor: COLORS.lime }}
            >
              <Ionicons name="flash" size={32} color={LIGHT_THEME.wText} />
            </View>

            <Text
              className="font-coach-extrabold mt-5 text-[32px]"
              style={{
                color: LIGHT_THEME.wText,
                letterSpacing: -0.02 * 32,
                lineHeight: 38,
              }}
            >
              {t("paywall.title")}
            </Text>
            <Text
              className="font-coach-medium mt-3 text-[15px]"
              style={{ color: LIGHT_THEME.wSub, lineHeight: 22 }}
            >
              {t("paywall.subtitle")}
            </Text>

            <View className="mt-7 gap-3.5">
              {FEATURE_KEYS.map((key) => (
                <View key={key} className="flex-row items-center gap-3">
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.lime}
                  />
                  <Text
                    className="font-coach-medium flex-1 text-[15px]"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    {t(key)}
                  </Text>
                </View>
              ))}
            </View>

            {loadError || packages.length === 0 ? (
              <View
                className="mt-7 rounded-2xl p-4"
                style={{
                  backgroundColor: LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-medium text-[14px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {t("paywall.loadError")}
                </Text>
              </View>
            ) : (
              <View className="mt-8 gap-3">
                {packages.map((pkg) => {
                  const isSelected = pkg.identifier === selectedId;
                  const isAnnual = pkg.packageType === "ANNUAL";
                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => {
                        selectionFeedback();
                        setSelectedId(pkg.identifier);
                      }}
                      className="flex-row items-center justify-between rounded-2xl p-4 active:opacity-90"
                      style={{
                        backgroundColor: isSelected
                          ? COLORS.limeDim
                          : LIGHT_THEME.w1,
                        borderWidth: 2,
                        borderColor: isSelected
                          ? COLORS.lime
                          : LIGHT_THEME.wBrd,
                      }}
                    >
                      <View className="gap-1">
                        <Text
                          className="font-coach-bold text-[17px]"
                          style={{ color: LIGHT_THEME.wText }}
                        >
                          {isAnnual
                            ? t("paywall.planAnnual")
                            : t("paywall.planMonthly")}
                        </Text>
                        <Text
                          className="font-coach-medium text-[13px]"
                          style={{ color: LIGHT_THEME.wSub }}
                        >
                          {t("paywall.trialBadge")}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-3">
                        <View className="items-end">
                          <Text
                            className="font-mono-medium text-[18px]"
                            style={{ color: LIGHT_THEME.wText }}
                          >
                            {pkg.product.priceString}
                          </Text>
                          <Text
                            className="font-coach text-[12px]"
                            style={{ color: LIGHT_THEME.wMute }}
                          >
                            {isAnnual
                              ? t("paywall.perYear")
                              : t("paywall.perMonth")}
                          </Text>
                        </View>
                        <View
                          className="size-[22px] items-center justify-center rounded-full"
                          style={{
                            borderWidth: 2,
                            borderColor: isSelected
                              ? COLORS.lime
                              : LIGHT_THEME.wBrd,
                          }}
                        >
                          {isSelected && (
                            <View
                              className="size-[12px] rounded-full"
                              style={{ backgroundColor: COLORS.lime }}
                            />
                          )}
                        </View>
                      </View>

                      {isAnnual && savings ? (
                        <View
                          className="absolute -top-2.5 right-4 rounded-full px-3 py-1"
                          style={{ backgroundColor: COLORS.lime }}
                        >
                          <Text
                            className="font-coach-bold text-[11px]"
                            style={{ color: LIGHT_THEME.wText }}
                          >
                            {t("paywall.save", { percent: savings })}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View
            className="pb-safe px-5 pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: LIGHT_THEME.wBrd,
              backgroundColor: LIGHT_THEME.w2,
            }}
          >
            <Pressable
              onPress={handlePurchase}
              disabled={!selected || purchasing}
              className="h-14 flex-row items-center justify-center rounded-2xl active:opacity-90"
              style={{
                backgroundColor: COLORS.lime,
                opacity: !selected || purchasing ? 0.6 : 1,
              }}
            >
              {purchasing ? (
                <ActivityIndicator color={LIGHT_THEME.wText} />
              ) : (
                <Text
                  className="font-coach-bold text-[16px]"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {t("paywall.cta")}
                </Text>
              )}
            </Pressable>

            {selected && (
              <Text
                className="font-coach mt-3 text-center text-[12px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {t(
                  selectedIsAnnual
                    ? "paywall.afterTrialAnnual"
                    : "paywall.afterTrialMonthly",
                  { price: selected.product.priceString },
                )}
              </Text>
            )}

            <View className="mt-3 flex-row items-center justify-center gap-5">
              <Pressable onPress={handleRestore} disabled={restoring}>
                <Text
                  className="font-coach-semibold text-[12px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {restoring ? t("paywall.restoring") : t("paywall.restore")}
                </Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
                <Text
                  className="font-coach-semibold text-[12px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {t("paywall.terms")}
                </Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
                <Text
                  className="font-coach-semibold text-[12px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {t("paywall.privacy")}
                </Text>
              </Pressable>
            </View>

            <Text
              className="font-coach mt-3 text-center text-[10px]"
              style={{ color: LIGHT_THEME.wMute, lineHeight: 14 }}
            >
              {t("paywall.legal")}
            </Text>

            <Pressable
              onPress={() => signOut()}
              className="mt-1 items-center py-2"
            >
              <Text
                className="font-coach-medium text-[12px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {t("paywall.signOut")}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
