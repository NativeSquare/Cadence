import { SettingsGroup } from "@/components/app/account/settings-group";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { ACTIVITY_COLORS, COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { LEGAL_URLS } from "@/lib/constants";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";

import {
  Pressable,
  StatusBar,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { signOut } = useAuthActions();
  const user = useQuery(api.table.users.currentUser);
  const deleteAccount = useMutation(api.table.users.deleteAccount);

  const logoutSheetRef = React.useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = React.useRef<BottomSheetModal>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = user?.name || "Guest";
  const avatarInitial = React.useMemo(() => {
    const fromName = displayName?.trim()?.[0];
    return (fromName || "?").toUpperCase();
  }, [displayName]);

  const planPhase = "No active plan";

  // Scroll-driven status bar transition (dark -> light)
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      headerHeight.value = e.nativeEvent.layout.height;
    },
    [headerHeight]
  );

  const [lightStatusBar, setLightStatusBar] = useState(false);

  useAnimatedReaction(
    () => {
      const threshold =
        headerHeight.value > 0 ? headerHeight.value - insets.top : 1;
      return scrollY.value / threshold >= 0.95;
    },
    (isLight, prev) => {
      if (isLight !== prev) {
        runOnJS(setLightStatusBar)(isLight);
      }
    }
  );

  const safeAreaCoverStyle = useAnimatedStyle(() => {
    const threshold =
      headerHeight.value > 0 ? headerHeight.value - insets.top : 1;
    const progress = Math.min(1, Math.max(0, scrollY.value / threshold));
    const backgroundColor = interpolateColor(
      progress,
      [0, 0.85, 1],
      ["#000000", "#000000", LIGHT_THEME.w2]
    );
    return { backgroundColor };
  });

  const handleLogout = () => {
    logoutSheetRef.current?.dismiss();
    signOut();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      deleteAccountSheetRef.current?.dismiss();
      signOut();
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />
      {isFocused && (
        <StatusBar
          animated
          barStyle={lightStatusBar ? "dark-content" : "light-content"}
        />
      )}

      <Animated.ScrollView
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Black header with avatar + profile info */}
        <View className="bg-black" onLayout={handleHeaderLayout}>
          <View
            className="items-center px-6 pb-6"
            style={{ paddingTop: insets.top + 20 }}
          >
            {user?.image ? (
              <Avatar alt={displayName} className="mb-3 size-20">
                <AvatarImage source={{ uri: user.image }} />
              </Avatar>
            ) : (
              <LinearGradient
                colors={[COLORS.lime, ACTIVITY_COLORS.barHigh]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="mb-3 size-20 items-center justify-center rounded-full"
              >
                <Text className="font-coach-extrabold text-[34px] text-black">
                  {avatarInitial}
                </Text>
              </LinearGradient>
            )}

            <View className="flex-row items-center gap-2">
              <Text className="font-coach-bold text-[22px] text-g1">
                {displayName}
              </Text>
              <View className="rounded-md bg-lime px-2 py-0.5">
                <Text className="font-coach-extrabold text-[9px] tracking-wider text-black">
                  PRO
                </Text>
              </View>
            </View>

            <Text className="mt-1 font-coach text-[13px] text-g3">
              {planPhase}
            </Text>
          </View>

          <View
            className="h-7 bg-w2"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        {/* Light content */}
        <View className="flex-1 bg-w2 px-4 pb-6">
          <View className="w-full max-w-2xl gap-5 self-center">
            {/* Account */}
            <SettingsGroup
              title="Account"
              items={[
                {
                  label: "Profile",
                  icon: "person-outline",
                  onPress: () => router.push("/account/edit"),
                },
                {
                  label: "Subscription",
                  icon: "lock-closed-outline",
                  onPress: () => router.push("/account/subscription"),
                },
              ]}
            />

            {/* Training */}
            <SettingsGroup
              title="Training"
              items={[
                {
                  label: "Races",
                  icon: "flag-outline",
                  onPress: () => router.push("/account/races"),
                },
                {
                  label: "Goals",
                  icon: "trophy-outline",
                  onPress: () => router.push("/account/goals"),
                },
                {
                  label: "Zones",
                  icon: "pulse-outline",
                  onPress: () => router.push("/account/zones"),
                },
                {
                  label: "Workout Templates",
                  icon: "barbell-outline",
                  onPress: () => router.push("/account/workout-templates"),
                },
              ]}
            />

            {/* Integrations */}
            <SettingsGroup
              title="Integrations"
              items={[
                {
                  label: "Apps & Devices",
                  icon: "apps-outline",
                  onPress: () => router.push("/account/connections"),
                },
                {
                  label: "Calendars",
                  icon: "calendar-outline",
                  onPress: () => router.push("/account/calendars"),
                },
              ]}
            />

            {/* Preferences */}
            <SettingsGroup
              title="Preferences"
              items={[
                {
                  label: "Notifications",
                  icon: "notifications-outline",
                  onPress: () => router.push("/account/notifications"),
                },
                {
                  label: "Units & Language",
                  icon: "globe-outline",
                  onPress: () => router.push("/account/units"),
                },
              ]}
            />

            {/* About */}
            <SettingsGroup
              title="About"
              items={[
                {
                  label: "Send Feedback",
                  icon: "chatbox-outline",
                  onPress: () => router.push("/account/send-feedback"),
                },
                {
                  label: "Privacy Policy",
                  icon: "shield-checkmark-outline",
                  showChevron: false,
                  onPress: () =>
                    WebBrowser.openBrowserAsync(LEGAL_URLS.privacy),
                },
                {
                  label: "Terms of Service",
                  icon: "document-text-outline",
                  showChevron: false,
                  onPress: () => WebBrowser.openBrowserAsync(LEGAL_URLS.terms),
                },
              ]}
            />

            {/* Sign Out */}
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
              onPress={() => logoutSheetRef.current?.present()}
            >
              <Ionicons
                name="log-out-outline"
                size={15}
                color={LIGHT_THEME.wSub}
              />
              <Text
                className="font-coach-medium text-sm"
                style={{ color: LIGHT_THEME.wSub }}
              >
                Sign Out
              </Text>
            </Pressable>

            {/* Delete Account */}
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteAccountSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                Delete Account
              </Text>
            </Pressable>

            {/* Version */}
            <View className="items-center pt-1">
              <Text
                className="font-coach text-[11px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Cadence v0.1
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Safe area cover - transitions from black to light as header scrolls away */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            zIndex: 1,
          },
          safeAreaCoverStyle,
        ]}
      />

      <ConfirmationSheet
        sheetRef={logoutSheetRef}
        icon="log-out-outline"
        title="Sign out"
        description="Are you sure you want to sign out? You'll need to sign in again to access your account."
        confirmLabel="Sign Out"
        onConfirm={handleLogout}
      />

      <ConfirmationSheet
        sheetRef={deleteAccountSheetRef}
        icon="trash-outline"
        title="Delete Account"
        description="This action is permanent and cannot be undone. All your data will be permanently deleted."
        confirmLabel="Delete Account"
        destructive
        loading={isDeleting}
        onConfirm={handleDeleteAccount}
      />
    </View>
  );
}
