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

const VOICE_LABELS: Record<string, string> = {
  tough_love: "Tough Love",
  encouraging: "Encouraging",
  analytical: "Analytical",
  minimalist: "Minimalist",
};

const GOAL_LABELS: Record<string, string> = {
  race: "Race",
  speed: "Get Faster",
  base_building: "Base Building",
  return_to_fitness: "Return to Fitness",
  general_health: "General Health",
};

const RACE_LABELS: Record<number, string> = {
  5: "5K",
  10: "10K",
  21.1: "Half Marathon",
  42.2: "Marathon",
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.table.users.currentUser);
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const connections = useQuery(api.soma.index.listConnections);
  const isProviderConnected = (provider: string) =>
    connections?.some((c) => c.provider === provider && c.active) ?? false;
  const deleteAccount = useMutation(api.table.users.deleteAccount);

  const logoutSheetRef = React.useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = React.useRef<BottomSheetModal>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = user?.name || "Guest";
  const avatarInitial = React.useMemo(() => {
    const fromName = displayName?.trim()?.[0];
    return (fromName || "?").toUpperCase();
  }, [displayName]);

  // Derive display values from backend data
  const goalValue = (() => {
    const g = runner?.goals;
    if (!g?.goalType) return "Not set";
    const label = GOAL_LABELS[g.goalType] ?? g.goalType;
    if (g.goalType === "race" && g.raceDistance) {
      const dist = RACE_LABELS[g.raceDistance] ?? `${g.raceDistance} km`;
      return dist;
    }
    return label;
  })();

  const coachingValue =
    VOICE_LABELS[runner?.coaching?.coachingVoice ?? ""] ?? "Not set";

  const scheduleValue = (() => {
    const s = runner?.schedule;
    if (!s?.availableDays) return "Not set";
    return `${s.availableDays} days/week`;
  })();

  const bodyValue = (() => {
    const p = runner?.physical;
    if (!p) return "Not set";
    const parts: string[] = [];
    if (p.gender) parts.push(p.gender === "male" ? "M" : "F");
    if (p.weight) parts.push(`${p.weight} kg`);
    if (p.height) parts.push(`${p.height} cm`);
    if (p.maxHr) parts.push(`${p.maxHr} bpm`);
    return parts.length > 0 ? parts.join(" · ") : "Not set";
  })();

  const healthValue = (() => {
    const h = runner?.health;
    if (!h?.recoveryStyle && !h?.sleepQuality) return "Not set";
    const parts: string[] = [];
    if (h.sleepQuality) parts.push(`Sleep: ${h.sleepQuality}`);
    if (h.stressLevel) parts.push(`Stress: ${h.stressLevel}`);
    return parts.length > 0 ? parts.join(" · ") : "Not set";
  })();

  const connectionsValue = (() => {
    if (!connections) return "Not set";
    const connected: string[] = [];
    if (isProviderConnected("STRAVA")) connected.push("Strava");
    if (isProviderConnected("GARMIN")) connected.push("Garmin");
    if (isProviderConnected("HEALTHKIT")) connected.push("Apple Health");
    return connected.length > 0 ? connected.join(", ") : "None";
  })();

  const planPhase = (() => {
    const g = runner?.goals;
    if (!g?.goalType) return "No active plan";
    if (g.goalType === "race" && g.raceDistance) {
      const dist = RACE_LABELS[g.raceDistance] ?? `${g.raceDistance} km`;
      return `${dist} Training`;
    }
    return GOAL_LABELS[g.goalType] ?? "Training";
  })();

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
      <StatusBar
        animated
        barStyle={lightStatusBar ? "dark-content" : "light-content"}
      />

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
            {/* Training */}
            <SettingsGroup
              title="Training"
              items={[
                {
                  label: "Goal",
                  icon: "trophy-outline",
                  value: goalValue,
                  iconColor: ACTIVITY_COLORS.barHigh,
                  iconBgColor: "rgba(168,217,0,0.1)",
                  onPress: () => router.push("/account/goal"),
                },
                {
                  label: "Schedule",
                  icon: "calendar-outline",
                  value: scheduleValue,
                  iconColor: COLORS.ora,
                  iconBgColor: "rgba(255,149,0,0.1)",
                  onPress: () => router.push("/account/schedule"),
                },
                {
                  label: "Coaching Style",
                  icon: "chatbubble-ellipses-outline",
                  value: coachingValue,
                  iconColor: COLORS.blu,
                  iconBgColor: "rgba(91,158,255,0.1)",
                  onPress: () => router.push("/account/coaching"),
                },
              ]}
            />

            {/* Body & Health */}
            <SettingsGroup
              title="Body & Health"
              items={[
                {
                  label: "Physical Profile",
                  icon: "body-outline",
                  value: bodyValue,
                  iconColor: COLORS.blu,
                  iconBgColor: "rgba(91,158,255,0.1)",
                  onPress: () => router.push("/account/body"),
                },
                {
                  label: "Health & Recovery",
                  icon: "fitness-outline",
                  value: healthValue,
                  iconColor: COLORS.grn,
                  iconBgColor: "rgba(74,222,128,0.1)",
                  onPress: () => router.push("/account/health"),
                },
              ]}
            />

            {/* Connections */}
            <SettingsGroup
              title="Connections"
              items={[
                {
                  label: "Connected Services",
                  icon: "link-outline",
                  value: connectionsValue,
                  iconColor: COLORS.ora,
                  iconBgColor: "rgba(255,149,0,0.1)",
                  onPress: () => router.push("/account/connections"),
                },
              ]}
            />

            {/* Account */}
            <SettingsGroup
              title="Account"
              items={[
                {
                  label: "Edit Profile",
                  icon: "person-outline",
                  onPress: () => router.push("/account/edit"),
                },
                {
                  label: "Notifications",
                  icon: "notifications-outline",
                  value: "On",
                  onPress: () => {},
                },
                {
                  label: "Subscription",
                  icon: "lock-closed-outline",
                  value: "Pro",
                  valueColor: ACTIVITY_COLORS.barHigh,
                  onPress: () => {},
                },
              ]}
            />

            {/* Support */}
            <SettingsGroup
              title="Support"
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
