import {
  AppleHealthLogo,
  CorosLogo,
  FitbitLogo,
  GarminLogo,
  GoogleFitLogo,
  InBodyLogo,
  OuraLogo,
  StravaLogo,
  SuuntoLogo,
  WithingsLogo,
} from "@/components/icons/provider-logos";
import {
  ConnectPermissionSheet,
  type ConnectPermissionSheetHandle,
} from "@/components/app/account/ConnectPermissionSheet";
import { ConnectionsDataTypesSheet } from "@/components/app/account/ConnectionsDataTypesSheet";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { useStrava } from "@/hooks/use-strava";
import { useGarmin } from "@/hooks/use-garmin";
import { useHealthKit } from "@/hooks/use-healthkit";
import { useHealthKitSyncProgress } from "@/hooks/use-healthkit-sync-store";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { formatRelativeShort } from "@/lib/format-relative";
import {
  ANALYTICS_DATA_TYPES,
  PROVIDER_CAPABILITIES,
  TERRA_DATA_TYPES,
  type DataTypeKey,
  type Provider,
} from "@/lib/providers/capabilities";
import { Info, type LucideIcon } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";

type ProviderKey = "strava" | "appleHealth" | "garmin";

type ConnectionDef = {
  key: ProviderKey;
  slug: "strava" | "apple-health" | "garmin";
  provider: Extract<Provider, "STRAVA" | "HEALTHKIT" | "GARMIN">;
  name: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
};

type ComingSoonKey =
  | "coros"
  | "withings"
  | "oura"
  | "googleFit"
  | "fitbit"
  | "suunto"
  | "inbody";

type ComingSoonDef = {
  key: ComingSoonKey;
  provider: Extract<
    Provider,
    | "COROS"
    | "WITHINGS"
    | "OURA"
    | "GOOGLE_FIT"
    | "FITBIT"
    | "SUUNTO"
    | "INBODY"
  >;
  name: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
};

const CONNECTIONS: ConnectionDef[] = [
  // Temporarily hidden — Strava only exposes Activity reads, which we don't use yet.
  // {
  //   key: "strava",
  //   slug: "strava",
  //   provider: "STRAVA",
  //   name: "Strava",
  //   logo: StravaLogo,
  // },
  {
    key: "appleHealth",
    slug: "apple-health",
    provider: "HEALTHKIT",
    name: "Apple Health",
    logo: AppleHealthLogo,
  },
  {
    key: "garmin",
    slug: "garmin",
    provider: "GARMIN",
    name: "Garmin",
    logo: GarminLogo,
  },
];

const COMING_SOON_PROVIDERS: ComingSoonDef[] = [
  {
    key: "coros",
    provider: "COROS",
    name: "COROS",
    logo: CorosLogo,
  },
  {
    key: "withings",
    provider: "WITHINGS",
    name: "Withings",
    logo: WithingsLogo,
  },
  {
    key: "oura",
    provider: "OURA",
    name: "Oura",
    logo: OuraLogo,
  },
  {
    key: "googleFit",
    provider: "GOOGLE_FIT",
    name: "Google Fit",
    logo: GoogleFitLogo,
  },
  {
    key: "fitbit",
    provider: "FITBIT",
    name: "Fitbit",
    logo: FitbitLogo,
  },
  {
    key: "suunto",
    provider: "SUUNTO",
    name: "Suunto",
    logo: SuuntoLogo,
  },
  {
    key: "inbody",
    provider: "INBODY",
    name: "InBody",
    logo: InBodyLogo,
  },
];

export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const activeFilter: DataTypeKey | null = isDataType(filterParam)
    ? filterParam
    : null;
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

  const permissionSheetRef = React.useRef<ConnectPermissionSheetHandle>(null);
  const dataTypesSheetRef = React.useRef<GorhomBottomSheetModal>(null);

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
      if (!result && garminError) setError(garminError);
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

  const passesFilter = (provider: Provider): boolean =>
    activeFilter === null
      ? true
      : PROVIDER_CAPABILITIES[provider].includes(activeFilter);

  const visibleConnections = CONNECTIONS.filter((c) => passesFilter(c.provider));
  const visibleComingSoon = COMING_SOON_PROVIDERS.filter((c) =>
    passesFilter(c.provider),
  );

  const connectedProviders = connections
    ? visibleConnections.filter(isConnected)
    : [];
  const notConnectedProviders = connections
    ? visibleConnections.filter((c) => !isConnected(c))
    : visibleConnections;

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
          {t("account.connections.title")}
        </Text>
        <Pressable
          onPress={() => dataTypesSheetRef.current?.present()}
          accessibilityRole="button"
          accessibilityLabel={t("account.connections.dataTypesSheet.open")}
          hitSlop={10}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Info size={16} color={LIGHT_THEME.wText} strokeWidth={1.75} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {activeFilter ? (
            <View
              className="flex-row items-center gap-2 self-start rounded-full px-3 py-2"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <Text
                className="font-coach-medium text-[12px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {t("account.connections.filter.label", {
                  dataType: t(`analytics.dataTypes.${activeFilter}`),
                })}
              </Text>
              <Pressable
                onPress={() => router.setParams({ filter: undefined })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={14}
                  color={LIGHT_THEME.wText}
                />
              </Pressable>
            </View>
          ) : null}

          {/* ── Connected Providers ── */}
          {connectedProviders.length > 0 && (
            <View className="gap-3">
              <Text
                className="font-coach-semibold text-[13px] uppercase tracking-wider"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {t("account.connections.connected")}
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
                  const lastSync = formatRelativeShort(t, connDoc?.lastDataUpdate);
                  return (
                    <Pressable
                      key={conn.key}
                      onPress={() =>
                        router.push({
                          pathname: "/account/connections/[provider]",
                          params: { provider: conn.slug },
                        })
                      }
                      className="px-4 py-4 active:opacity-70"
                      style={
                        isLast
                          ? undefined
                          : {
                              borderBottomWidth: 1,
                              borderBottomColor: LIGHT_THEME.wBrd,
                            }
                      }
                    >
                      <View className="flex-row items-center gap-3.5">
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
                                {t("account.connections.syncing")}
                              </Text>
                            </View>
                          ) : (
                            <Text
                              className="mt-0.5 font-coach text-xs"
                              style={{ color: LIGHT_THEME.wMute }}
                            >
                              {lastSync
                                ? t("account.connections.lastSync", { time: lastSync })
                                : t(`account.connections.providers.${conn.key}.description`)}
                            </Text>
                          )}
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={LIGHT_THEME.wMute}
                        />
                      </View>

                      <CapabilitySection provider={conn.provider} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Not Yet Connected ── */}
          {(notConnectedProviders.length > 0 ||
            visibleComingSoon.length > 0) && (
            <View className="gap-3">
              <Text
                className="font-coach-semibold text-[13px] uppercase tracking-wider"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {t("account.connections.notYetConnected")}
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
                    visibleComingSoon.length === 0;

                  const handleConnect = isStrava
                    ? handleConnectStrava
                    : isGarmin
                      ? handleConnectGarmin
                      : handleConnectAppleHealth;

                  return (
                    <View
                      key={conn.key}
                      className="px-4 py-4"
                      style={
                        isLast
                          ? undefined
                          : {
                              borderBottomWidth: 1,
                              borderBottomColor: LIGHT_THEME.wBrd,
                            }
                      }
                    >
                      <View className="flex-row items-center gap-3.5">
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
                            {t(`account.connections.providers.${conn.key}.description`)}
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
                              {t("account.connections.connect")}
                            </Text>
                          </Pressable>
                        )}
                      </View>

                      <CapabilitySection provider={conn.provider} />
                    </View>
                  );
                })}

                {/* Coming Soon providers */}
                {visibleComingSoon.map((provider, index) => {
                  const isLast = index === visibleComingSoon.length - 1;
                  return (
                    <View
                      key={provider.key}
                      className="px-4 py-4"
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
                      <View className="flex-row items-center gap-3.5">
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
                            {t(`account.connections.providers.${provider.key}.description`)}
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
                            {t("account.connections.comingSoon")}
                          </Text>
                        </View>
                      </View>

                      <CapabilitySection provider={provider.provider} />
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

      <ConnectPermissionSheet ref={permissionSheetRef} />
      <ConnectionsDataTypesSheet sheetRef={dataTypesSheetRef} />
    </View>
  );
}

function isDataType(v: unknown): v is DataTypeKey {
  return (
    typeof v === "string" && ANALYTICS_DATA_TYPES.some((d) => d.key === v)
  );
}

function CapabilitySection({ provider }: { provider: Provider }) {
  const { t } = useTranslation();
  const capabilities = PROVIDER_CAPABILITIES[provider];

  return (
    <View className="mt-3.5 flex-row flex-wrap gap-1.5 pl-[50px]">
      {TERRA_DATA_TYPES.map(({ key, Icon }) => (
        <CapabilityPill
          key={key}
          Icon={Icon}
          label={t(`account.connections.capabilities.dataTypes.${key}`)}
          active={capabilities.includes(key)}
        />
      ))}
    </View>
  );
}

function CapabilityPill({
  Icon,
  label,
  active,
}: {
  Icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <View
      className="flex-row items-center gap-1 rounded-full"
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: active ? LIGHT_THEME.w3 : "transparent",
        borderWidth: active ? 0 : 1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: active ? 1 : 0.55,
      }}
    >
      <Icon
        size={11}
        color={active ? LIGHT_THEME.wText : LIGHT_THEME.wMute}
        strokeWidth={2.25}
      />
      <Text
        className="font-coach-medium text-[11px]"
        style={{ color: active ? LIGHT_THEME.wText : LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
    </View>
  );
}
