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
  AppleHealthLogo,
  GarminLogo,
  StravaLogo,
} from "@/components/icons/provider-logos";
import { Text } from "@/components/ui/text";
import { useHealthKitSyncProgress } from "@/hooks/use-healthkit-sync-store";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";

type Slug = "strava" | "garmin" | "apple-health";

type ProviderConfig = {
  slug: Slug;
  provider: "STRAVA" | "HEALTHKIT" | "GARMIN";
  name: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
};

const PROVIDER_CONFIGS: Record<Slug, ProviderConfig> = {
  strava: {
    slug: "strava",
    provider: "STRAVA",
    name: "Strava",
    logo: StravaLogo,
  },
  garmin: {
    slug: "garmin",
    provider: "GARMIN",
    name: "Garmin",
    logo: GarminLogo,
  },
  "apple-health": {
    slug: "apple-health",
    provider: "HEALTHKIT",
    name: "Apple Health",
    logo: AppleHealthLogo,
  },
};

type DataTypeKey =
  | "activities"
  | "body"
  | "daily"
  | "menstruation"
  | "nutrition"
  | "sleep";

const DATA_TYPE_ORDER: DataTypeKey[] = [
  "activities",
  "sleep",
  "daily",
  "body",
  "nutrition",
  "menstruation",
];

const DATA_TYPE_LABELS: Record<DataTypeKey, string> = {
  activities: "Activities",
  body: "Body measurements",
  daily: "Daily metrics",
  menstruation: "Menstruation",
  nutrition: "Nutrition",
  sleep: "Sleep",
};

function formatCount(key: DataTypeKey, count: number): string {
  const n = count.toLocaleString();
  switch (key) {
    case "sleep":
      return `${n} ${count === 1 ? "night" : "nights"}`;
    case "daily":
      return `${n} ${count === 1 ? "day" : "days"}`;
    case "body":
    case "nutrition":
    case "menstruation":
      return `${n} ${count === 1 ? "entry" : "entries"}`;
    case "activities":
    default:
      return n;
  }
}

function formatOldest(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return `Since ${new Date(time).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

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

function formatConnectedOn(ms: number | undefined): string | null {
  if (!ms) return null;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type SyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "synced"; newItems: number }
  | { status: "up-to-date" };

export default function ProviderDetailScreen() {
  const router = useRouter();
  const { provider: slugParam } = useLocalSearchParams<{ provider: string }>();

  const config =
    slugParam && slugParam in PROVIDER_CONFIGS
      ? PROVIDER_CONFIGS[slugParam as Slug]
      : null;

  const connections = useQuery(api.soma.index.listConnections);
  const disconnectStrava = useAction(api.soma.strava.disconnect);
  const disconnectGarmin = useAction(api.soma.garmin.disconnect);
  const disconnectAppleHealth = useMutation(api.soma.healthkit.disconnect);

  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);
  const [disconnectError, setDisconnectError] = React.useState<string | null>(
    null,
  );
  const [syncState, setSyncState] = React.useState<SyncState>({ status: "idle" });
  const healthKitSync = useHealthKitSyncProgress();
  const isHealthKitSyncing =
    config?.slug === "apple-health" && healthKitSync.phase === "syncing";

  const connDoc = React.useMemo(() => {
    if (!connections || !config) return null;
    return (
      connections.find(
        (c) => c.provider === config.provider && (c.active ?? false),
      ) ?? null
    );
  }, [connections, config]);

  // If the connection is gone (never connected, or just disconnected),
  // bounce back to the list. Wait for the query to resolve first.
  React.useEffect(() => {
    if (!config) {
      router.replace("/account/connections");
      return;
    }
    if (connections !== undefined && !connDoc && !disconnecting) {
      router.replace("/account/connections");
    }
  }, [config, connections, connDoc, disconnecting, router]);

  // Auto-clear sync status after a short delay.
  React.useEffect(() => {
    if (syncState.status === "synced" || syncState.status === "up-to-date") {
      const t = setTimeout(
        () => setSyncState({ status: "idle" }),
        4000,
      );
      return () => clearTimeout(t);
    }
  }, [syncState]);

  if (!config) return null;

  const connectedOn = formatConnectedOn(connDoc?._creationTime);
  const lastSync = formatRelativeShort(connDoc?.lastDataUpdate);

  const dataRows = React.useMemo(() => {
    const stats = connDoc?.stats;
    if (!stats) return [];
    return DATA_TYPE_ORDER.flatMap((key) => {
      const entry = stats[key];
      if (!entry || entry.count === 0) return [];
      return [
        {
          key,
          label: DATA_TYPE_LABELS[key],
          count: formatCount(key, entry.count),
          meta: formatOldest(entry.oldest) ?? "",
        },
      ];
    });
  }, [connDoc]);

  const handleMockSync = () => {
    setSyncState({ status: "syncing" });
    // Mock: 1.5s delay, then a fake "3 new items" result.
    // TODO: wire to real incremental-sync endpoint per provider.
    setTimeout(() => {
      setSyncState({ status: "synced", newItems: 3 });
    }, 1500);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      if (config.slug === "strava") await disconnectStrava();
      else if (config.slug === "garmin") await disconnectGarmin();
      else if (config.slug === "apple-health") await disconnectAppleHealth();
      router.replace("/account/connections");
    } catch (err) {
      setDisconnectError(getConvexErrorMessage(err));
      setDisconnecting(false);
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
          {config.name}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* ── Hero card ── */}
          <View
            className="items-center gap-3 rounded-[18px] px-4 py-6"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderWidth: 1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <View
              className="size-[64px] items-center justify-center rounded-2xl"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <config.logo size={32} />
            </View>
            <Text
              className="font-coach-bold text-[20px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {config.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="size-1.5 rounded-full"
                style={{ backgroundColor: COLORS.lime }}
              />
              <Text
                className="font-coach-medium text-[12px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {connectedOn ? `Connected on ${connectedOn}` : "Connected"}
              </Text>
            </View>
          </View>

          {/* ── Data we have ── */}
          <View className="gap-3">
            <Text
              className="font-coach-semibold text-[13px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Data we have
            </Text>

            <View
              className="overflow-hidden rounded-[18px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              {dataRows.length === 0 ? (
                <View className="px-4 py-6">
                  <Text
                    className="text-center font-coach text-sm"
                    style={{ color: LIGHT_THEME.wMute }}
                  >
                    No data synced yet.
                  </Text>
                </View>
              ) : (
                dataRows.map((dt, i) => {
                  const isLast = i === dataRows.length - 1;
                  return (
                    <View
                      key={dt.key}
                      className="flex-row items-center gap-3 px-4 py-3.5"
                      style={
                        isLast
                          ? undefined
                          : {
                              borderBottomWidth: 1,
                              borderBottomColor: LIGHT_THEME.wBrd,
                            }
                      }
                    >
                      <View className="flex-1">
                        <Text
                          className="font-coach-medium text-[15px]"
                          style={{ color: LIGHT_THEME.wText }}
                        >
                          {dt.label}
                        </Text>
                        {dt.meta ? (
                          <Text
                            className="mt-0.5 font-coach text-xs"
                            style={{ color: LIGHT_THEME.wMute }}
                          >
                            {dt.meta}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        className="font-coach-semibold text-[14px]"
                        style={{ color: LIGHT_THEME.wText }}
                      >
                        {dt.count}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* ── Actions ── */}
          <View className="gap-3">
            <Text
              className="font-coach-semibold text-[13px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Actions
            </Text>

            <View
              className="overflow-hidden rounded-[18px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              {/* Sync now */}
              <Pressable
                onPress={handleMockSync}
                disabled={syncState.status === "syncing" || isHealthKitSyncing}
                className="flex-row items-center gap-3 px-4 py-4 active:opacity-70"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: LIGHT_THEME.wBrd,
                  opacity:
                    syncState.status === "syncing" || isHealthKitSyncing
                      ? 0.6
                      : 1,
                }}
              >
                <View
                  className="size-[34px] items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: "rgba(166,227,88,0.18)" }}
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={LIGHT_THEME.wText}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-coach-medium text-[15px]"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    Sync now
                  </Text>
                  {isHealthKitSyncing ? (
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
                      style={{
                        color:
                          syncState.status === "synced"
                            ? COLORS.lime
                            : LIGHT_THEME.wMute,
                      }}
                    >
                      {syncState.status === "syncing"
                        ? "Checking for new data…"
                        : syncState.status === "synced"
                          ? `Synced · ${syncState.newItems} new items`
                          : syncState.status === "up-to-date"
                            ? "Up to date · just now"
                            : lastSync
                              ? `Last sync · ${lastSync}`
                              : "Tap to check for new data"}
                    </Text>
                  )}
                </View>
                {syncState.status === "syncing" && !isHealthKitSyncing && (
                  <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />
                )}
              </Pressable>

              {/* Disconnect */}
              <Pressable
                onPress={() => setConfirmDisconnect(true)}
                disabled={disconnecting}
                className="flex-row items-center gap-3 px-4 py-4 active:opacity-70"
              >
                <View
                  className="size-[34px] items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: "rgba(255,59,48,0.12)" }}
                >
                  <Ionicons name="unlink-outline" size={16} color={COLORS.red} />
                </View>
                <Text
                  className="flex-1 font-coach-medium text-[15px]"
                  style={{ color: COLORS.red }}
                >
                  Disconnect {config.name}
                </Text>
                {disconnecting && (
                  <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />
                )}
              </Pressable>
            </View>

            {disconnectError && (
              <Text
                className="text-center font-coach text-sm"
                style={{ color: COLORS.red }}
              >
                {disconnectError}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <AlertDialog
        open={confirmDisconnect}
        onOpenChange={(open) => {
          if (!open) setConfirmDisconnect(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
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
                setConfirmDisconnect(false);
                handleDisconnect();
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
