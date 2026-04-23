/**
 * WearableScreen - Wearable connection or skip path selection.
 *
 * Light-sheet Act 2 entry. Reuses the provider-card pattern and
 * ConnectPermissionSheet from the Data & Connections screen so onboarding and
 * settings stay visually aligned.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { useHealthKit } from "@/hooks/use-healthkit";
import { useStrava } from "@/hooks/use-strava";
import { useGarmin } from "@/hooks/use-garmin";
import {
  ConnectPermissionSheet,
  type ConnectPermissionSheetHandle,
} from "@/components/app/account/ConnectPermissionSheet";
import {
  AppleHealthLogo,
  CorosLogo,
  GarminLogo,
  StravaLogo,
} from "@/components/icons/provider-logos";
import { Cursor } from "../Cursor";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface WearableScreenProps {
  /** Called when user completes this screen */
  onComplete: () => void;
}

type ProviderKey = "strava" | "appleHealth" | "garmin";

type ProviderDef = {
  key: ProviderKey;
  provider: "STRAVA" | "HEALTHKIT" | "GARMIN";
  name: string;
  description: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
  iosOnly?: boolean;
};

// =============================================================================
// Constants
// =============================================================================

const ALL_PROVIDERS: ProviderDef[] = [
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
    iosOnly: true,
  },
  {
    key: "garmin",
    provider: "GARMIN",
    name: "Garmin",
    description: "GPS watch & wearable data",
    logo: GarminLogo,
  },
];

const PROVIDERS: ProviderDef[] = ALL_PROVIDERS.filter(
  (p) => !p.iosOnly || Platform.OS === "ios",
);

const COMING_SOON_PROVIDERS = [
  {
    key: "coros" as const,
    name: "COROS",
    description: "GPS watch & training data",
    logo: CorosLogo,
  },
];

// =============================================================================
// Component
// =============================================================================

export function WearableScreen({ onComplete }: WearableScreenProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const permissionSheetRef = useRef<ConnectPermissionSheetHandle>(null);

  const connections = useQuery(api.soma.index.listConnections);

  const {
    connect: connectStrava,
    isConnecting: stravaConnecting,
    error: stravaError,
  } = useStrava();
  const {
    connect: connectGarmin,
    isConnecting: garminConnecting,
    error: garminError,
  } = useGarmin();
  const {
    connect: connectHealthKit,
    isConnecting: healthKitConnecting,
    error: healthKitError,
    checkAuthStatus: checkHealthKitAuthStatus,
  } = useHealthKit();

  const isConnected = useCallback(
    (provider: ProviderDef["provider"]) =>
      !!connections?.find(
        (c) => c.provider === provider && (c.active ?? false),
      ),
    [connections],
  );

  const hasAnyConnection = PROVIDERS.some((p) => isConnected(p.provider));

  const s1 = useStream({
    text: "I'm your running coach. I learn, I adapt, and I get better the more I know.",
    speed: 32,
    delay: 300,
  });

  const s2 = useStream({
    text: "Fastest way to get started — connect your watch or running app.",
    speed: 32,
    delay: 400,
    active: s1.done,
  });

  useEffect(() => {
    if (s2.done) {
      const t = setTimeout(() => setShowOptions(true), 400);
      return () => clearTimeout(t);
    }
  }, [s2.done]);

  const handleConnectStrava = useCallback(() => {
    setError(null);
    permissionSheetRef.current?.present("strava", async () => {
      const success = await connectStrava();
      if (!success && stravaError) setError(stravaError);
    });
  }, [connectStrava, stravaError]);

  const handleConnectGarmin = useCallback(() => {
    setError(null);
    permissionSheetRef.current?.present("garmin", async () => {
      const result = await connectGarmin();
      if (!result && garminError) setError(garminError);
    });
  }, [connectGarmin, garminError]);

  const handleConnectAppleHealth = useCallback(async () => {
    setError(null);
    const runConnect = async () => {
      const result = await connectHealthKit();
      if (!result && healthKitError) setError(healthKitError);
    };
    const status = await checkHealthKitAuthStatus();
    if (status !== "shouldRequest") {
      runConnect();
      return;
    }
    permissionSheetRef.current?.present("appleHealth", runConnect);
  }, [connectHealthKit, healthKitError, checkHealthKitAuthStatus]);

  const handleConnect = useCallback(
    (key: ProviderKey) => {
      if (key === "strava") return handleConnectStrava();
      if (key === "garmin") return handleConnectGarmin();
      if (key === "appleHealth") return handleConnectAppleHealth();
    },
    [handleConnectStrava, handleConnectGarmin, handleConnectAppleHealth],
  );

  const isProviderConnecting = (key: ProviderKey) =>
    (key === "strava" && stravaConnecting) ||
    (key === "garmin" && garminConnecting) ||
    (key === "appleHealth" && healthKitConnecting);

  const displayError = error ?? stravaError ?? garminError ?? healthKitError;

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <View style={styles.textArea}>
          <Text style={styles.headline}>
            {s1.displayed}
            {!s1.done && s1.started && <Cursor visible height={26} />}
          </Text>

          {s2.started && (
            <Text style={[styles.subheadline, styles.marginTop]}>
              {s2.displayed}
              {!s2.done && <Cursor visible height={26} />}
            </Text>
          )}
        </View>

        {showOptions && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.optionsSection}
          >
            <View style={styles.card}>
              {PROVIDERS.map((p, index) => {
                const connected = isConnected(p.provider);
                const connecting = isProviderConnecting(p.key);
                const isLast =
                  index === PROVIDERS.length - 1 &&
                  COMING_SOON_PROVIDERS.length === 0;

                return (
                  <View
                    key={p.key}
                    style={[styles.row, !isLast && styles.rowDivider]}
                  >
                    <View style={styles.logoBadge}>
                      <p.logo size={18} />
                    </View>

                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{p.name}</Text>
                      <Text style={styles.rowSubtitle}>{p.description}</Text>
                    </View>

                    {connecting ? (
                      <ActivityIndicator
                        size="small"
                        color={LIGHT_THEME.wMute}
                      />
                    ) : connected ? (
                      <View style={styles.connectedChip}>
                        <Text style={styles.connectedChipText}>Connected</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleConnect(p.key)}
                        style={styles.connectPill}
                      >
                        <Text style={styles.connectPillText}>Connect</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}

              {COMING_SOON_PROVIDERS.map((p, index) => {
                const isLast = index === COMING_SOON_PROVIDERS.length - 1;
                return (
                  <View
                    key={p.key}
                    style={[
                      styles.row,
                      styles.rowComingSoon,
                      !isLast && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.logoBadge}>
                      <p.logo size={18} />
                    </View>

                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{p.name}</Text>
                      <Text style={styles.rowSubtitle}>{p.description}</Text>
                    </View>

                    <View style={styles.comingSoonChip}>
                      <Text style={styles.comingSoonChipText}>Coming soon</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {displayError && (
              <Text style={styles.errorText}>{displayError}</Text>
            )}

            {hasAnyConnection ? (
              <Animated.View entering={FadeInUp.duration(300)}>
                <Pressable onPress={onComplete} style={styles.continueButton}>
                  <Text style={styles.continueText}>Continue</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Pressable onPress={onComplete} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        <ConnectPermissionSheet ref={permissionSheetRef} />
      </View>
    </BottomSheetModalProvider>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  textArea: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headline: {
    fontSize: 26,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: LIGHT_THEME.wText,
    lineHeight: 36,
    letterSpacing: -0.52,
  },
  subheadline: {
    fontSize: 26,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: LIGHT_THEME.wSub,
    lineHeight: 36,
    letterSpacing: -0.52,
  },
  marginTop: {
    marginTop: 12,
  },
  optionsSection: {
    gap: 12,
  },
  card: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
    backgroundColor: LIGHT_THEME.w1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_THEME.wBrd,
  },
  rowComingSoon: {
    opacity: 0.55,
  },
  logoBadge: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: LIGHT_THEME.w3,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: "Outfit-Medium",
    fontSize: 15,
    color: LIGHT_THEME.wText,
  },
  rowSubtitle: {
    marginTop: 2,
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: LIGHT_THEME.wMute,
  },
  connectPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lime,
  },
  connectPillText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 13,
    color: LIGHT_THEME.wText,
  },
  connectedChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(52,211,153,0.15)",
  },
  connectedChipText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "rgb(16,128,88)",
  },
  comingSoonChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: LIGHT_THEME.w3,
  },
  comingSoonChipText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: LIGHT_THEME.wMute,
  },
  errorText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: COLORS.red,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: COLORS.lime,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  continueText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: COLORS.black,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipText: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    color: LIGHT_THEME.wMute,
  },
});
