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
import {
  ConnectPermissionSheet,
  type ConnectPermissionSheetHandle,
} from "@/components/app/account/ConnectPermissionSheet";
import { Text } from "@/components/ui/text";
import { useStrava } from "@/hooks/use-strava";
import { useGarmin } from "@/hooks/use-garmin";
import { useHealthKit } from "@/hooks/use-healthkit";
import { useHealthKitSyncProgress } from "@/hooks/use-healthkit-sync-store";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
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
  slug: "strava" | "apple-health" | "garmin";
  provider: "STRAVA" | "HEALTHKIT" | "GARMIN";
  name: string;
  description: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
};

const CONNECTIONS: ConnectionDef[] = [
  {
    key: "strava",
    slug: "strava",
    provider: "STRAVA",
    name: "Strava",
    description: "Sync activities, routes & training",
    logo: StravaLogo,
  },
  {
    key: "appleHealth",
    slug: "apple-health",
    provider: "HEALTHKIT",
    name: "Apple Health",
    description: "Heart rate, sleep & recovery data",
    logo: AppleHealthLogo,
  },
  {
    key: "garmin",
    slug: "garmin",
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

function formatRelativeShort(iso: string | undefined): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const connections = useQuery(api.soma.index.listConnections);
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
    checkAuthStatus: checkHealthKitAuthStatus,
  } = useHealthKit();
  const healthKitSync = useHealthKitSyncProgress();
  const healthKitSyncing = healthKitSync.phase === "syncing";

  const syncSheetRef = React.useRef<SyncDataSheetHandle>(null);
  const permissionSheetRef = React.useRef<ConnectPermissionSheetHandle>(null);

  const [error, setError] = React.useState<string | null>(null);

  const findConnection = (conn: ConnectionDef) =>
    connections?.find(
      (c) => c.provider === conn.provider && (c.active ?? false),
    );

  const isConnected = (conn: ConnectionDef): boolean => !!findConnection(conn);

  const handleConnectStrava = () => {
    setError(null);
    permissionSheetRef.current?.present("strava", async () => {
      const success = await connectStrava();
      if (!success && stravaError) setError(stravaError);
    });
  };

  const handleConnectGarmin = () => {
    setError(null);
    permissionSheetRef.current?.present("garmin", async () => {
      const result = await connectGarminFlow();
      if (result) {
        syncSheetRef.current?.present();
        return;
      }
      if (garminError) setError(garminError);
    });
  };

  const handleConnectAppleHealth = async () => {
    setError(null);
    const runConnect = async () => {
      const result = await connectHealthKit();
      if (!result && healthKitError) setError(healthKitError);
    };
    // iOS only shows the permission sheet on first request. If it was
    // previously granted or denied, the disclosure would be misleading —
    // skip it and go straight to connect.
    const status = await checkHealthKitAuthStatus();
    if (status !== "shouldRequest") {
      runConnect();
      return;
    }
    permissionSheetRef.current?.present("appleHealth", runConnect);
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
          Data & Connections
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
                  const showSyncing =
                    conn.key === "appleHealth" && healthKitSyncing;
                  const connDoc = findConnection(conn);
                  const lastSync = formatRelativeShort(connDoc?.lastDataUpdate);
                  return (
                    <Pressable
                      key={conn.key}
                      onPress={() =>
                        router.push({
                          pathname: "/account/connections/[provider]",
                          params: { provider: conn.slug },
                        })
                      }
                      className="flex-row items-center gap-3.5 px-4 py-4 active:opacity-70"
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
                        {showSyncing ? (
                          <View className="mt-0.5 flex-row items-center gap-1">
                            <ActivityIndicator
                              size="small"
                              color={LIGHT_THEME.wMute}
                              style={{ transform: [{ scale: 0.7 }] }}
                            />
                            <Text
                              className="font-coach text-xs"
                              style={{ color: LIGHT_THEME.wMute }}
                            >
                              Syncing…
                            </Text>
                          </View>
                        ) : (
                          <Text
                            className="mt-0.5 font-coach text-xs"
                            style={{ color: LIGHT_THEME.wMute }}
                          >
                            {lastSync
                              ? `Last sync · ${lastSync}`
                              : conn.description}
                          </Text>
                        )}
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={LIGHT_THEME.wMute}
                      />
                    </Pressable>
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
                  const isLast = index === COMING_SOON_PROVIDERS.length - 1;
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
      <ConnectPermissionSheet ref={permissionSheetRef} />
    </View>
  );
}
