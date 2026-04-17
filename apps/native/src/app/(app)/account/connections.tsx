import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AppleHealthLogo,
  CorosLogo,
  GarminLogo,
  StravaLogo,
} from "@/components/icons/provider-logos";
import {
  SyncDataSheet,
  type SyncDataSheetHandle,
} from "@/components/app/account/SyncDataSheet";
import { Text } from "@/components/ui/text";
import { useStrava } from "@/hooks/use-strava";
import { useGarmin } from "@/hooks/use-garmin";
import { useHealthKit } from "@/hooks/use-healthkit";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";

type ConnectionDef = {
  key: "strava" | "appleHealth" | "garmin";
  provider: "STRAVA" | "HEALTHKIT" | "GARMIN";
  name: string;
  description: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
};

const CONNECTIONS: ConnectionDef[] = [
  {
    key: "strava",
    provider: "STRAVA",
    name: "Strava",
    description: "Sync activities, routes & training",
    logo: StravaLogo,
  },
  {
    key: "appleHealth",
    provider: "HEALTHKIT",
    name: "Apple Health",
    description: "Heart rate, sleep & recovery data",
    logo: AppleHealthLogo,
  },
  {
    key: "garmin",
    provider: "GARMIN",
    name: "Garmin",
    description: "GPS watch & wearable data",
    logo: GarminLogo,
  },
];

const COMING_SOON_PROVIDERS = [
  {
    key: "coros" as const,
    name: "COROS",
    description: "GPS watch & training data",
    logo: CorosLogo,
  },
];

export default function ConnectionsScreen() {
  const router = useRouter();
  const connections = useQuery(api.soma.index.listConnections);
  const disconnectStrava = useAction(
    api.soma.strava.disconnect,
  );
  const disconnectGarmin = useAction(
    api.soma.garmin.disconnect,
  );
  const disconnectAppleHealth = useMutation(
    api.soma.index.disconnectAppleHealth,
  );
  const {
    connect: connectStrava,
    isConnecting: stravaConnecting,
    error: stravaError,
  } = useStrava();
  const {
    connect: connectGarminFlow,
    isConnecting: garminConnecting,
    error: garminError,
  } = useGarmin();
  const {
    connect: connectHealthKit,
    isConnecting: healthKitConnecting,
    error: healthKitError,
  } = useHealthKit();

  const syncSheetRef = React.useRef<SyncDataSheetHandle>(null);

  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] =
    React.useState<ConnectionDef | null>(null);

  const isConnected = (conn: ConnectionDef): boolean => {
    if (!connections) return false;
    return connections.some(
      (c) => c.provider === conn.provider && (c.active ?? false),
    );
  };

  const handleConnectStrava = async () => {
    setError(null);
    const success = await connectStrava();
    if (success) return;
    if (stravaError) setError(stravaError);
  };

  const handleConnectGarmin = async () => {
    setError(null);
    const result = await connectGarminFlow();
    if (result) {
      syncSheetRef.current?.present();
      return;
    }
    if (garminError) setError(garminError);
  };

  const handleConnectAppleHealth = async () => {
    setError(null);
    const result = await connectHealthKit();
    if (result) return;
    if (healthKitError) setError(healthKitError);
  };

  const handleDisconnect = async (conn: ConnectionDef) => {
    setSaving(conn.key);
    setError(null);
    try {
      if (conn.key === "strava") await disconnectStrava();
      else if (conn.key === "garmin") await disconnectGarmin();
      else if (conn.key === "appleHealth") await disconnectAppleHealth();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const connectedProviders = connections
    ? CONNECTIONS.filter(isConnected)
    : [];
  const notConnectedProviders = connections
    ? CONNECTIONS.filter((c) => !isConnected(c))
    : CONNECTIONS;

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
          Connections
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* ── Connected Providers ── */}
          {connectedProviders.length > 0 && (
            <View className="gap-3">
              <Text
                className="font-coach-semibold text-[13px] uppercase tracking-wider"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Connected
              </Text>

              <View
                className="overflow-hidden rounded-[18px]"
                style={{
                  backgroundColor: LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: LIGHT_THEME.wBrd,
                }}
              >
                {connectedProviders.map((conn, index) => {
                  const isLast = index === connectedProviders.length - 1;
                  return (
                    <View
                      key={conn.key}
                      className="flex-row items-center gap-3.5 px-4 py-4"
                      style={
                        isLast
                          ? undefined
                          : {
                              borderBottomWidth: 1,
                              borderBottomColor: LIGHT_THEME.wBrd,
                            }
                      }
                    >
                      <View
                        className="size-[38px] shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: LIGHT_THEME.w3 }}
                      >
                        <conn.logo size={18} />
                      </View>

                      <View className="flex-1">
                        <Text
                          className="font-coach-medium text-[15px]"
                          style={{ color: LIGHT_THEME.wText }}
                        >
                          {conn.name}
                        </Text>
                        <Text
                          className="mt-0.5 font-coach text-xs"
                          style={{ color: LIGHT_THEME.wMute }}
                        >
                          {conn.description}
                        </Text>
                      </View>

                      {saving === conn.key ? (
                        <ActivityIndicator
                          size="small"
                          color={LIGHT_THEME.wMute}
                        />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Pressable className="size-9 items-center justify-center rounded-full active:opacity-70">
                              <Ionicons
                                name="ellipsis-horizontal"
                                size={20}
                                color={LIGHT_THEME.wMute}
                              />
                            </Pressable>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={4}>
                            <DropdownMenuItem
                              variant="destructive"
                              onPress={() => setConfirmDisconnect(conn)}
                            >
                              <Text>Disconnect {conn.name}</Text>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Not Yet Connected ── */}
          {(notConnectedProviders.length > 0 ||
            COMING_SOON_PROVIDERS.length > 0) && (
            <View className="gap-3">
              <Text
                className="font-coach-semibold text-[13px] uppercase tracking-wider"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Not yet connected
              </Text>

              <View
                className="overflow-hidden rounded-[18px]"
                style={{
                  backgroundColor: LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: LIGHT_THEME.wBrd,
                }}
              >
                {notConnectedProviders.map((conn, index) => {
                  const isStrava = conn.key === "strava";
                  const isGarmin = conn.key === "garmin";
                  const isAppleHealth = conn.key === "appleHealth";
                  const isConnecting =
                    (isStrava && stravaConnecting) ||
                    (isGarmin && garminConnecting) ||
                    (isAppleHealth && healthKitConnecting);
                  const isLast =
                    index === notConnectedProviders.length - 1 &&
                    COMING_SOON_PROVIDERS.length === 0;

                  const handleConnect = isStrava
                    ? handleConnectStrava
                    : isGarmin
                      ? handleConnectGarmin
                      : handleConnectAppleHealth;

                  return (
                    <View
                      key={conn.key}
                      className="flex-row items-center gap-3.5 px-4 py-4"
                      style={
                        isLast
                          ? undefined
                          : {
                              borderBottomWidth: 1,
                              borderBottomColor: LIGHT_THEME.wBrd,
                            }
                      }
                    >
                      <View
                        className="size-[38px] shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: LIGHT_THEME.w3 }}
                      >
                        <conn.logo size={18} />
                      </View>

                      <View className="flex-1">
                        <Text
                          className="font-coach-medium text-[15px]"
                          style={{ color: LIGHT_THEME.wText }}
                        >
                          {conn.name}
                        </Text>
                        <Text
                          className="mt-0.5 font-coach text-xs"
                          style={{ color: LIGHT_THEME.wMute }}
                        >
                          {conn.description}
                        </Text>
                      </View>

                      {isConnecting ? (
                        <ActivityIndicator
                          size="small"
                          color={LIGHT_THEME.wMute}
                        />
                      ) : (
                        <Pressable
                          onPress={handleConnect}
                          className="rounded-full px-4 py-2 active:opacity-80"
                          style={{ backgroundColor: COLORS.lime }}
                        >
                          <Text
                            className="font-coach-semibold text-[13px]"
                            style={{ color: LIGHT_THEME.wText }}
                          >
                            Connect
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}

                {/* Coming Soon providers */}
                {COMING_SOON_PROVIDERS.map((provider, index) => {
                  const isLast =
                    index === COMING_SOON_PROVIDERS.length - 1;
                  return (
                    <View
                      key={provider.key}
                      className="flex-row items-center gap-3.5 px-4 py-4"
                      style={
                        isLast
                          ? { opacity: 0.55 }
                          : {
                              opacity: 0.55,
                              borderBottomWidth: 1,
                              borderBottomColor: LIGHT_THEME.wBrd,
                            }
                      }
                    >
                      <View
                        className="size-[38px] shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: LIGHT_THEME.w3 }}
                      >
                        <provider.logo size={18} />
                      </View>

                      <View className="flex-1">
                        <Text
                          className="font-coach-medium text-[15px]"
                          style={{ color: LIGHT_THEME.wText }}
                        >
                          {provider.name}
                        </Text>
                        <Text
                          className="mt-0.5 font-coach text-xs"
                          style={{ color: LIGHT_THEME.wMute }}
                        >
                          {provider.description}
                        </Text>
                      </View>

                      <View
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: LIGHT_THEME.w3 }}
                      >
                        <Text
                          className="font-coach-medium text-[12px]"
                          style={{ color: LIGHT_THEME.wMute }}
                        >
                          Coming soon
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {(error || stravaError || garminError || healthKitError) && (
            <Text
              className="text-center font-coach text-sm"
              style={{ color: COLORS.red }}
            >
              {error ?? stravaError ?? garminError ?? healthKitError}
            </Text>
          )}
        </View>
      </ScrollView>

      <SyncDataSheet ref={syncSheetRef} providerName="Garmin" />

      {/* ── Disconnect Confirmation Dialog ── */}
      <AlertDialog
        open={!!confirmDisconnect}
        onOpenChange={(open) => {
          if (!open) setConfirmDisconnect(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {confirmDisconnect?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your synced data will be kept, but new activities won't sync until
              you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onPress={() => {
                if (confirmDisconnect) handleDisconnect(confirmDisconnect);
                setConfirmDisconnect(null);
              }}
            >
              <Text>Disconnect</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
