import { ConnectionRow } from "@/components/app/account/connection-row";
import { SettingsGroup } from "@/components/app/account/settings-group";
import { SettingsRow } from "@/components/app/account/settings-row";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { ACTIVITY_COLORS, COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

/**
 * Profile Screen (Tab 4)
 * Reference: cadence-settings.tsx design
 *
 * Design: Light theme settings screen
 * - Header with avatar, name, PRO badge, training info
 * - Training settings with colored icons
 * - Connections with toggle switches
 * - Account settings
 * - Share on Strava / Sign Out buttons
 */
export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.table.users.currentUser);
  const deleteAccount = useMutation(api.table.users.deleteAccount);

  const logoutSheetRef = React.useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = React.useRef<BottomSheetModal>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Connection toggle states
  const [connections, setConnections] = useState({
    strava: true,
    appleHealth: true,
    garmin: false,
  });

  const toggleConnection = (key: keyof typeof connections) => {
    setConnections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const displayName = user?.name || "Guest";
  const avatarInitial = React.useMemo(() => {
    const fromName = displayName?.trim()?.[0];
    return (fromName || "?").toUpperCase();
  }, [displayName]);

  // DEBUG: Log avatar image resolution
  console.log("[Profile] user?.image:", user?.image, "| hasImage:", !!user?.image);

  // Mock data for profile
  const profileData = {
    isPro: true,
    planPhase: "Half Marathon · Week 4 Build",
  };

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
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
        contentContainerClassName="px-4 pb-10 pt-[68px]"
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="w-full max-w-2xl gap-5 self-center">
          {/* Header - Avatar + Name + Badge + Training Info */}
          <View className="flex-row items-center gap-4 pb-2">
            {user?.image ? (
              <Avatar alt={displayName} className="size-14">
                <AvatarImage source={{ uri: user.image }} />
              </Avatar>
            ) : (
              <LinearGradient
                colors={[COLORS.lime, ACTIVITY_COLORS.barHigh]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="size-14 items-center justify-center rounded-full"
              >
                <Text className="font-coach-extrabold text-2xl text-black">
                  {avatarInitial}
                </Text>
              </LinearGradient>
            )}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="font-coach-bold text-xl tracking-tight"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {displayName}
                </Text>
                {profileData.isPro && (
                  <View
                    className="rounded-md px-2 py-0.5"
                    style={{ backgroundColor: LIGHT_THEME.wText }}
                  >
                    <Text
                      className="font-coach-extrabold text-[9px] tracking-wider"
                      style={{ color: COLORS.lime }}
                    >
                      PRO
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="mt-0.5 font-coach text-[13px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {profileData.planPhase}
              </Text>
            </View>
          </View>

          {/* Training Section */}
          <SettingsGroup
            title="Training"
            items={[
              {
                label: "Goal",
                icon: "layers-outline",
                value: "Sub 1:45 HM",
                iconColor: ACTIVITY_COLORS.barHigh,
                iconBgColor: "rgba(168,217,0,0.1)",
                onPress: () => {},
              },
              {
                label: "Coaching Style",
                icon: "bar-chart-outline",
                value: "Balanced",
                iconColor: COLORS.blu,
                iconBgColor: "rgba(91,158,255,0.1)",
                onPress: () => {},
              },
              {
                label: "Weekly Volume",
                icon: "time-outline",
                value: "42-48 km",
                iconColor: COLORS.ora,
                iconBgColor: "rgba(255,138,0,0.1)",
                onPress: () => {},
              },
              {
                label: "Units",
                icon: "flag-outline",
                value: "Metric (km)",
                iconColor: ACTIVITY_COLORS.barHigh,
                iconBgColor: "rgba(168,217,0,0.1)",
                onPress: () => {},
              },
            ]}
          />

          {/* Connections Section */}
          <SettingsGroup title="Connections">
            <ConnectionRow
              name="Strava"
              description="Activities synced"
              icon="S"
              color="#FC4C02"
              connected={connections.strava}
              onToggle={() => toggleConnection("strava")}
            />
            <ConnectionRow
              name="Apple Health"
              description="HR, sleep & recovery"
              icon="♥"
              color="#FF2D55"
              connected={connections.appleHealth}
              onToggle={() => toggleConnection("appleHealth")}
            />
            <ConnectionRow
              name="Garmin"
              description="GPS watch"
              icon="G"
              color="#007CC3"
              connected={connections.garmin}
              onToggle={() => toggleConnection("garmin")}
              isLast
            />
          </SettingsGroup>

          {/* Account Section */}
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

          {/* Share on Strava Button */}
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
            onPress={() => {}}
          >
            <Ionicons name="share-outline" size={16} color={COLORS.lime} />
            <Text className="font-coach-bold text-sm text-white ">
              Share on Strava
            </Text>
          </Pressable>

          {/* Sign Out Button */}
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl border py-3.5 active:opacity-80"
            style={{ borderColor: LIGHT_THEME.wBrd }}
            onPress={() => logoutSheetRef.current?.present()}
          >
            <Text
              className="font-coach-medium text-sm"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Sign Out
            </Text>
          </Pressable>

          {/* Version Footer */}
          <View className="items-center pt-2">
            <Text
              className="font-coach text-[11px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Cadence v0.1
            </Text>
          </View>
        </View>
      </ScrollView>

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
    </>
  );
}
