import { ProfileHeader } from "@/components/app/profile/profile-header";
import { ConnectedServiceCard } from "@/components/app/profile/connected-service-card";
import { SettingsRow } from "@/components/app/account/settings-row";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

/**
 * Profile Screen (Tab 4)
 * Reference: cadence-full-v9.jsx ProfileTab (lines 604-695)
 *
 * Design: Two-tone dark header / light content pattern
 * - Dark header: Avatar with progress ring, name, PRO badge, stats, Share button
 * - Light content: Connected services, Settings list
 * - Collapsed header appears on scroll (mini avatar + name)
 */
export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.table.users.currentUser);
  const deleteAccount = useMutation(api.table.users.deleteAccount);

  // Scroll state for collapsed header
  const [scrollY, setScrollY] = useState(0);
  const progress = Math.min(1, Math.max(0, (scrollY - 10) / 110));
  const showCollapsedHeader = progress > 0.85;

  // Animated collapsed header
  const collapsedHeaderOpacity = useSharedValue(0);
  const collapsedHeaderTranslateY = useSharedValue(-10);

  // Update animation values when showCollapsedHeader changes
  React.useEffect(() => {
    if (showCollapsedHeader) {
      collapsedHeaderOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      collapsedHeaderTranslateY.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    } else {
      collapsedHeaderOpacity.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
      collapsedHeaderTranslateY.value = withTiming(-10, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [showCollapsedHeader, collapsedHeaderOpacity, collapsedHeaderTranslateY]);

  const collapsedHeaderStyle = useAnimatedStyle(() => ({
    opacity: collapsedHeaderOpacity.value,
    transform: [{ translateY: collapsedHeaderTranslateY.value }],
  }));

  const logoutSheetRef = React.useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = React.useRef<BottomSheetModal>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "guest@example.com";
  const avatarInitial = React.useMemo(() => {
    const fromName = displayName?.trim()?.[0];
    const fromEmail = displayEmail?.trim()?.[0];
    return (fromName || fromEmail || "?").toUpperCase();
  }, [displayName, displayEmail]);

  // Mock data for profile stats
  const profileStats = {
    km: 387,
    runs: 31,
    streak: 12,
    planCompletion: 0.74, // 74%
    planPhase: "Half Marathon · Week 4 Build",
    isPro: true,
  };

  // Mock data for connected services
  const connectedServices = [
    {
      name: "Strava",
      description: "Sync activities",
      connected: true,
      color: "#FC4C02",
      icon: "S",
    },
    {
      name: "Apple Health",
      description: "HR, sleep & recovery",
      connected: true,
      color: "#FF2D55",
      icon: "♥",
    },
    {
      name: "Garmin",
      description: "GPS watch sync",
      connected: false,
      color: "#007CC3",
      icon: "G",
    },
  ];

  // Mock data for settings values
  const settingsItems = [
    { label: "Edit Profile", value: "", icon: "person-outline" as const },
    { label: "Goal", value: "Sub 1:45", icon: "flag-outline" as const },
    {
      label: "Coaching Style",
      value: "Balanced",
      icon: "fitness-outline" as const,
    },
    { label: "Units", value: "Metric", icon: "speedometer-outline" as const },
    {
      label: "Notifications",
      value: "On",
      icon: "notifications-outline" as const,
    },
    { label: "Subscription", value: "Pro", icon: "card-outline" as const },
  ];

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollY(event.nativeEvent.contentOffset.y);
    },
    []
  );

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

  const handleShareOnStrava = () => {
    // TODO: Implement Strava share functionality
    console.log("Share on Strava");
  };

  return (
    <>
      {/* Collapsed Header - appears on scroll with slide-in animation */}
      <Animated.View
        className="absolute top-0 left-0 right-0 z-[90] px-6 pb-3 pt-[54px]"
        style={[
          {
            backgroundColor: "rgba(0,0,0,0.92)",
          },
          collapsedHeaderStyle,
        ]}
        pointerEvents={showCollapsedHeader ? "auto" : "none"}
      >
        <View className="flex-row items-center gap-3">
          <View className="size-8 items-center justify-center rounded-full bg-lime">
            <Text className="font-coach-extrabold text-sm text-black">
              {avatarInitial}
            </Text>
          </View>
          <Text className="font-coach-bold text-base text-g1">
            {displayName}
          </Text>
          {profileStats.isPro && (
            <View className="rounded-md bg-lime px-2 py-0.5">
              <Text className="font-coach-extrabold text-[9px] text-black">
                PRO
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-black"
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Dark Header Section */}
        <ProfileHeader
          name={displayName}
          avatarInitial={avatarInitial}
          avatarUri={user?.image}
          isPro={profileStats.isPro}
          planPhase={profileStats.planPhase}
          planCompletion={profileStats.planCompletion}
          stats={{ km: profileStats.km, runs: profileStats.runs, streak: profileStats.streak }}
          scrollProgress={progress}
          onShareStrava={handleShareOnStrava}
        />

        {/* Light Content Section */}
        <View className="min-h-[500px] -mt-1 rounded-t-[28px] bg-w2">
          <View className="px-4 pb-[100px] pt-[22px]">
            {/* Connected Services Section */}
            <Text className="mb-2.5 px-1 font-coach-semibold text-[11px] uppercase tracking-wider text-wMute">
              Connected Services
            </Text>
            <View className="mb-5 gap-2">
              {connectedServices.map((service) => (
                <ConnectedServiceCard
                  key={service.name}
                  name={service.name}
                  description={service.description}
                  icon={service.icon}
                  color={service.color}
                  connected={service.connected}
                  onPress={() => console.log(`Pressed ${service.name}`)}
                />
              ))}
            </View>

            {/* Settings Section */}
            <Text className="mb-2.5 mt-5 px-1 font-coach-semibold text-[11px] uppercase tracking-wider text-wMute">
              Settings
            </Text>
            <View className="overflow-hidden rounded-2xl border border-wBrd bg-w1">
              <View className="divide-y divide-wBrd">
                {settingsItems.map((item) => (
                  <SettingsRow
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    value={item.value}
                    onPress={() => console.log(`Pressed ${item.label}`)}
                  />
                ))}
              </View>
            </View>

            {/* Account Actions */}
            <View className="mt-5 overflow-hidden rounded-2xl border border-wBrd bg-w1">
              <View className="divide-y divide-wBrd">
                <SettingsRow
                  label="Log out"
                  icon="log-out-outline"
                  showChevron={false}
                  onPress={() => logoutSheetRef.current?.present()}
                />
                <SettingsRow
                  label="Delete Account"
                  icon="trash-outline"
                  destructive
                  showChevron={false}
                  onPress={() => deleteAccountSheetRef.current?.present()}
                />
              </View>
            </View>

            {/* Version Footer */}
            <View className="mt-6 items-center">
              <Text className="font-coach text-xs text-wMute">
                Cadence v0.1
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmationSheet
        sheetRef={logoutSheetRef}
        icon="log-out-outline"
        title="Log out"
        description="Are you sure you want to log out? You'll need to sign in again to access your account."
        confirmLabel="Log out"
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
    </>
  );
}
