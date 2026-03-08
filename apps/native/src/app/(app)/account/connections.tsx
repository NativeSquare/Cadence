import { Text } from "@/components/ui/text";
import { useStrava } from "@/hooks/use-strava";
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
  backendField: "stravaConnected" | "wearableConnected";
  name: string;
  description: string;
  icon: string;
  color: string;
  wearableType?: "garmin" | "apple_watch";
};

const CONNECTIONS: ConnectionDef[] = [
  {
    key: "strava",
    backendField: "stravaConnected",
    name: "Strava",
    description: "Sync activities, routes & training",
    icon: "S",
    color: "#FC4C02",
  },
  {
    key: "appleHealth",
    backendField: "wearableConnected",
    name: "Apple Health",
    description: "Heart rate, sleep & recovery data",
    icon: "♥",
    color: "#FF2D55",
    wearableType: "apple_watch",
  },
  {
    key: "garmin",
    backendField: "wearableConnected",
    name: "Garmin",
    description: "GPS watch & wearable data",
    icon: "G",
    color: "#007CC3",
    wearableType: "garmin",
  },
];

export default function ConnectionsScreen() {
  const router = useRouter();
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const updateRunner = useMutation(api.table.runners.updateRunner);
  const disconnectStrava = useAction(
    api.integrations.strava.sync.disconnectStravaAccount,
  );
  const { connect: connectStrava, isConnecting: stravaConnecting, error: stravaError } =
    useStrava();

  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const isConnected = (conn: ConnectionDef): boolean => {
    if (!runner?.connections) return false;
    if (conn.key === "strava") return runner.connections.stravaConnected;
    if (conn.wearableType) {
      return (
        runner.connections.wearableConnected &&
        runner.connections.wearableType === conn.wearableType
      );
    }
    return false;
  };

  const handleConnectStrava = async () => {
    setError(null);
    const result = await connectStrava();
    if (result) {
      // Success: runner is marked connected and activities synced by backend
      return;
    }
    if (stravaError) setError(stravaError);
  };

  const handleToggle = async (conn: ConnectionDef) => {
    if (!runner?._id) return;

    const currentlyConnected = isConnected(conn);

    // Strava: "connect" is handled by Connect button (OAuth + sync). Toggle only disconnects.
    if (conn.key === "strava") {
      if (!currentlyConnected) return;
      setSaving(conn.key);
      setError(null);
      try {
        await disconnectStrava();
      } catch (err) {
        setError(getConvexErrorMessage(err));
      } finally {
        setSaving(null);
      }
      return;
    }

    setSaving(conn.key);
    setError(null);
    try {
      if (conn.wearableType) {
        await updateRunner({
          runnerId: runner._id,
          fields: {
            connections: {
              ...runner.connections,
              wearableConnected: !currentlyConnected,
              wearableType: currentlyConnected
                ? runner.connections.wearableType
                : conn.wearableType,
            },
          },
        });
      }
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

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
        <View className="w-full max-w-md gap-4 self-center">
          <Text
            className="font-coach text-[13px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            Connect your services to sync training data automatically.
          </Text>

          <View
            className="overflow-hidden rounded-[18px]"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderWidth: 1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            {CONNECTIONS.map((conn, index) => {
              const connected = isConnected(conn);
              const isLast = index === CONNECTIONS.length - 1;
              const isStrava = conn.key === "strava";
              const showConnectButton =
                isStrava && !connected && !stravaConnecting;
              const showStravaLoading = isStrava && !connected && stravaConnecting;

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
                    style={{ backgroundColor: conn.color + "18" }}
                  >
                    <Text
                      className="font-coach-extrabold"
                      style={{
                        fontSize: conn.icon === "♥" ? 16 : 14,
                        color: conn.color,
                      }}
                    >
                      {conn.icon}
                    </Text>
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

                  {showStravaLoading ? (
                    <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />
                  ) : showConnectButton ? (
                    <Pressable
                      onPress={handleConnectStrava}
                      className="rounded-full px-4 py-2 active:opacity-80"
                      style={{ backgroundColor: conn.color }}
                    >
                      <Text
                        className="font-coach-semibold text-[13px]"
                        style={{ color: "#fff" }}
                      >
                        Connect Strava
                      </Text>
                    </Pressable>
                  ) : saving === conn.key ? (
                    <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />
                  ) : (
                    <Pressable
                      onPress={() => handleToggle(conn)}
                      className="h-[28px] w-[48px] justify-center rounded-full p-0.5"
                      style={{
                        backgroundColor: connected
                          ? COLORS.lime
                          : "rgba(0,0,0,0.08)",
                      }}
                    >
                      <View
                        className="size-[24px] rounded-full shadow-sm"
                        style={{
                          backgroundColor: LIGHT_THEME.w1,
                          transform: [{ translateX: connected ? 20 : 0 }],
                        }}
                      />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          {(error || stravaError) && (
            <Text
              className="text-center font-coach text-sm"
              style={{ color: COLORS.red }}
            >
              {error ?? stravaError}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
