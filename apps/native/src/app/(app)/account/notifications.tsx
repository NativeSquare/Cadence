import { Linking, Pressable, ScrollView, View } from "react-native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useEffect, useState } from "react";

import { SettingsGroup } from "@/components/app/account/settings-group";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const status = useQuery(api.notifications.getPushNotificationStatus);
  const setPaused = useMutation(api.notifications.setPushNotificationsPaused);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    Notifications.getPermissionsAsync().then((res) => {
      if (active) setPermissionGranted(res.status === "granted");
    });
    return () => {
      active = false;
    };
  }, []);

  const isReceiving = status ? !status.paused : false;
  const ready = status !== undefined && permissionGranted !== null;
  const blocked = permissionGranted === false;

  const onToggle = (next: boolean) => {
    setPaused({ paused: !next }).catch((err) =>
      console.warn("[push] setPaused failed", err),
    );
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
          {t("account.notifications.title")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-4 self-center">
          <SettingsGroup title={t("account.notifications.sectionTitle")}>
            <View className="flex-row items-center gap-4 px-5 py-4">
              <View className="flex-1">
                <Text
                  className="font-coach-medium text-[16px]"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {t("account.notifications.receiveLabel")}
                </Text>
                <Text
                  className="mt-1 font-coach text-[12px]"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {t("account.notifications.receiveHelper")}
                </Text>
              </View>
              <Switch
                checked={isReceiving}
                onCheckedChange={onToggle}
                disabled={!ready}
              />
            </View>
          </SettingsGroup>

          {blocked && (
            <Pressable
              onPress={() => Linking.openSettings()}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3 active:opacity-70"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={LIGHT_THEME.wSub}
              />
              <Text
                className="flex-1 font-coach text-[12px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {t("account.notifications.permissionDenied")}
              </Text>
              <Text
                className="font-coach-semibold text-[12px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {t("account.notifications.openSettings")}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
