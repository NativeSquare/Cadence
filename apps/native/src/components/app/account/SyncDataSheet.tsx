/**
 * SyncDataSheet - Bottom sheet confirming data sync after provider connection.
 *
 * Shows a brief syncing animation, then transitions to a success checkmark
 * and auto-dismisses. Reuses the visual patterns from ExportToWatchSheet.
 *
 * Usage:
 *   const syncSheetRef = useRef<SyncDataSheetHandle>(null);
 *   syncSheetRef.current?.present();  // triggers the full flow
 */

import React, { useEffect, useRef, useImperativeHandle } from "react";
import { View } from "react-native";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

type SyncStep = "syncing" | "success";

const SYNCING_DURATION_MS = 800;
const SUCCESS_DISMISS_MS = 1400;

// ─── Animated components ─────────────────────────────────────────────────────

function SpinningSyncIcon() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
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

function SyncingStep({ providerName }: { providerName: string }) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className="items-center px-5 pb-2 py-6">
      <SpinningSyncIcon />
      <Animated.View style={pulseStyle}>
        <Text
          className="text-[16px] font-coach-semibold mt-5"
          style={{ color: LIGHT_THEME.wText }}
        >
          Syncing your {providerName} data...
        </Text>
      </Animated.View>
      <Text
        className="text-[13px] font-coach mt-2"
        style={{ color: LIGHT_THEME.wMute }}
      >
        Pulling activities, sleep & more
      </Text>
    </View>
  );
}

function SuccessStep({ providerName }: { providerName: string }) {
  return (
    <View className="items-center px-5 pb-2 py-6">
      <SuccessCheckmark />
      <Text
        className="text-[16px] font-coach-semibold mt-5"
        style={{ color: LIGHT_THEME.wText }}
      >
        {providerName} data is ready
      </Text>
      <Text
        className="text-[13px] font-coach mt-2"
        style={{ color: LIGHT_THEME.wMute }}
      >
        Your data has been synced
      </Text>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface SyncDataSheetHandle {
  present: () => void;
}

interface SyncDataSheetProps {
  providerName: string;
}

export const SyncDataSheet = React.forwardRef<
  SyncDataSheetHandle,
  SyncDataSheetProps
>(({ providerName }, ref) => {
  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const [step, setStep] = React.useState<SyncStep>("syncing");
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    present: () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      setStep("syncing");
      sheetRef.current?.present();

      syncTimerRef.current = setTimeout(() => {
        setStep("success");
        dismissTimerRef.current = setTimeout(() => {
          sheetRef.current?.dismiss();
        }, SUCCESS_DISMISS_MS);
      }, SYNCING_DURATION_MS);
    },
  }));

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor="#FFFFFF"
      borderRadius={28}
      onDismiss={() => setStep("syncing")}
    >
      {step === "syncing" && <SyncingStep providerName={providerName} />}
      {step === "success" && <SuccessStep providerName={providerName} />}
    </BottomSheetModal>
  );
});
