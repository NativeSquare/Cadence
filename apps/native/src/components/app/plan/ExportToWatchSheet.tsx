/**
 * ExportToWatchSheet - Bottom sheet for exporting a session to a watch provider.
 *
 * 3-step flow:
 * 1. Provider selection (Garmin, Coros)
 * 2. Exporting animation (spinning icon + progress feel)
 * 3. Success confirmation (checkmark + auto-dismiss)
 */

import React, { useState, useCallback, useEffect } from "react";
import { View, Pressable } from "react-native";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Circle, Rect } from "react-native-svg";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

export type WatchProvider = "garmin" | "coros";

export interface ExportToWatchSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  sessionType: string;
  onExportComplete: (provider: WatchProvider) => void;
}

type ExportStep = "select" | "exporting" | "success";

const EXPORT_DURATION_MS = 2200;
const SUCCESS_DISMISS_MS = 1400;

// ─── Provider logos ──────────────────────────────────────────────────────────

function GarminLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke="#1A1A1A" strokeWidth={1.5} />
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 6v6l4 2"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8l2-2"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 16l2 2"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CorosLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={4}
        width={16}
        height={16}
        rx={4}
        stroke="#1A1A1A"
        strokeWidth={1.5}
      />
      <Circle cx={12} cy={12} r={4} stroke="#1A1A1A" strokeWidth={1.5} />
      <Path
        d="M12 8v4l2.5 1.5"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 2v3"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 2v3"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8 19v3"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 19v3"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Animated components ─────────────────────────────────────────────────────

function SpinningExportIcon() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12C21 16.97 16.97 21 12 21C9.36 21 7.01 19.88 5.34 18.1L7.5 15.94C8.6 17.22 10.21 18 12 18C15.31 18 18 15.31 18 12H15L19 8L23 12H21Z"
          fill={LIGHT_THEME.wMute}
        />
        <Path
          d="M3 12C3 7.03 7.03 3 12 3C14.64 3 16.99 4.12 18.66 5.9L16.5 8.06C15.4 6.78 13.79 6 12 6C8.69 6 6 8.69 6 12H9L5 16L1 12H3Z"
          fill={LIGHT_THEME.wMute}
        />
      </Svg>
    </Animated.View>
  );
}

function SuccessCheckmark() {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: COLORS.lime,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 12.5L9.5 18L20 6"
          stroke="#1A1A1A"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Step screens ────────────────────────────────────────────────────────────

function ProviderCard({
  name,
  logo,
  onPress,
}: {
  name: string;
  logo: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4 rounded-2xl active:scale-[0.98]"
      style={{
        backgroundColor: LIGHT_THEME.w2,
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: LIGHT_THEME.w1,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {logo}
      </View>
      <View className="flex-1 ml-4">
        <Text
          className="text-[16px] font-coach-semibold"
          style={{ color: LIGHT_THEME.wText }}
        >
          {name}
        </Text>
        <Text
          className="text-[13px] font-coach"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Export workout to {name}
        </Text>
      </View>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 18l6-6-6-6"
          stroke={LIGHT_THEME.wMute}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

function SelectStep({
  onSelectProvider,
}: {
  onSelectProvider: (p: WatchProvider) => void;
}) {
  return (
    <View className="px-5 pb-2">
      <Text
        className="text-[20px] font-coach-bold mb-1"
        style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4 }}
      >
        Export to Watch
      </Text>
      <Text
        className="text-[14px] font-coach mb-5"
        style={{ color: LIGHT_THEME.wMute }}
      >
        Choose your watch to send the workout
      </Text>
      <View className="gap-3">
        <ProviderCard
          name="Garmin"
          logo={<GarminLogo />}
          onPress={() => onSelectProvider("garmin")}
        />
        <ProviderCard
          name="Coros"
          logo={<CorosLogo />}
          onPress={() => onSelectProvider("coros")}
        />
      </View>
    </View>
  );
}

function ExportingStep({
  provider,
  sessionType,
}: {
  provider: WatchProvider;
  sessionType: string;
}) {
  const providerName = provider === "garmin" ? "Garmin" : "Coros";
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className="px-5 pb-2 items-center py-6">
      <SpinningExportIcon />
      <Animated.View style={pulseStyle}>
        <Text
          className="text-[16px] font-coach-semibold mt-5"
          style={{ color: LIGHT_THEME.wText }}
        >
          Exporting to {providerName}…
        </Text>
      </Animated.View>
      <Text
        className="text-[13px] font-coach mt-2"
        style={{ color: LIGHT_THEME.wMute }}
      >
        Sending {sessionType} workout
      </Text>
    </View>
  );
}

function SuccessStep({ provider }: { provider: WatchProvider }) {
  const providerName = provider === "garmin" ? "Garmin" : "Coros";

  return (
    <View className="px-5 pb-2 items-center py-6">
      <SuccessCheckmark />
      <Text
        className="text-[16px] font-coach-semibold mt-5"
        style={{ color: LIGHT_THEME.wText }}
      >
        Exported to {providerName}
      </Text>
      <Text
        className="text-[13px] font-coach mt-2"
        style={{ color: LIGHT_THEME.wMute }}
      >
        Workout is ready on your watch
      </Text>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ExportToWatchSheet({
  sheetRef,
  sessionType,
  onExportComplete,
}: ExportToWatchSheetProps) {
  const [step, setStep] = useState<ExportStep>("select");
  const [selectedProvider, setSelectedProvider] =
    useState<WatchProvider | null>(null);

  const handleSelectProvider = useCallback(
    (provider: WatchProvider) => {
      setSelectedProvider(provider);
      setStep("exporting");

      setTimeout(() => {
        setStep("success");
        onExportComplete(provider);

        setTimeout(() => {
          sheetRef.current?.dismiss();
        }, SUCCESS_DISMISS_MS);
      }, EXPORT_DURATION_MS);
    },
    [onExportComplete, sheetRef]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor="#FFFFFF"
      borderRadius={28}
    >
      {step === "select" && (
        <SelectStep onSelectProvider={handleSelectProvider} />
      )}
      {step === "exporting" && selectedProvider && (
        <ExportingStep provider={selectedProvider} sessionType={sessionType} />
      )}
      {step === "success" && selectedProvider && (
        <SuccessStep provider={selectedProvider} />
      )}
    </BottomSheetModal>
  );
}
