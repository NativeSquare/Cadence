/**
 * ConnectPermissionSheet - Pre-OAuth disclosure sheet.
 *
 * Shown when the user taps "Connect" on a provider card. Explains what data
 * will be shared so the user knows to grant full historical access on the
 * next screen (provider OAuth / iOS HealthKit sheet).
 *
 * Usage:
 *   const sheetRef = useRef<ConnectPermissionSheetHandle>(null);
 *   sheetRef.current?.present("garmin", () => connectGarminFlow());
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Image, Pressable, View } from "react-native";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import {
  AppleHealthLogo,
  GarminLogo,
  StravaLogo,
} from "@/components/icons/provider-logos";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

type ProviderKey = "strava" | "garmin" | "appleHealth";

type ProviderConfig = {
  name: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
  intro: string;
  image: number;
  caption: string;
};

const IMAGE_ASPECT = 1179 / 2556;
const IMAGE_HEIGHT = 380;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT;

const PROVIDER_CONTENT: Record<ProviderKey, ProviderConfig> = {
  garmin: {
    name: "Garmin",
    logo: GarminLogo,
    intro:
      "On the next screen, Garmin will ask what to share. Historical Data is off by default — turn it on so we can analyze your past training.",
    image: require("../../../../assets/images/connect-permissions/garmin-oauth.jpeg"),
    caption: "Turn on Historical Data, then tap Save.",
  },
  appleHealth: {
    name: "Apple Health",
    logo: AppleHealthLogo,
    intro:
      "iOS will show a permission sheet next. Tap Turn On All so your coach gets the full picture — heart rate, sleep, workouts and more.",
    image: require("../../../../assets/images/connect-permissions/healthkit-permissions.jpeg"),
    caption: "Tap Turn On All at the top, then Allow.",
  },
  strava: {
    name: "Strava",
    logo: StravaLogo,
    intro:
      "Strava defaults to checking all boxes. Keep private activities checked so your full history imports — otherwise we only see your public workouts.",
    image: require("../../../../assets/images/connect-permissions/strava-oauth.jpeg"),
    caption: "Leave private activities checked, then tap Authorize.",
  },
};

// ─── Handle & props ──────────────────────────────────────────────────────────

export interface ConnectPermissionSheetHandle {
  present: (provider: ProviderKey, onContinue: () => void) => void;
}

export const ConnectPermissionSheet = forwardRef<ConnectPermissionSheetHandle>(
  (_props, ref) => {
  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const [provider, setProvider] = useState<ProviderKey | null>(null);
  const continueRef = useRef<(() => void) | null>(null);
  const shouldRunOnDismissRef = useRef(false);

  useImperativeHandle(ref, () => ({
    present: (p, onContinue) => {
      setProvider(p);
      continueRef.current = onContinue;
      shouldRunOnDismissRef.current = false;
      sheetRef.current?.present();
    },
  }));

  const handleContinue = () => {
    shouldRunOnDismissRef.current = true;
    sheetRef.current?.dismiss();
  };

  const handleCancel = () => {
    shouldRunOnDismissRef.current = false;
    sheetRef.current?.dismiss();
  };

  const handleDismiss = () => {
    const run = shouldRunOnDismissRef.current;
    const cb = continueRef.current;
    shouldRunOnDismissRef.current = false;
    continueRef.current = null;
    setProvider(null);
    if (run && cb) cb();
  };

  const config = provider ? PROVIDER_CONTENT[provider] : null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor={LIGHT_THEME.w1}
      borderRadius={28}
      onDismiss={handleDismiss}
    >
      {config && (
        <View className="px-5 pb-2 pt-2">
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <View
              className="size-[44px] items-center justify-center rounded-xl"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <config.logo size={22} />
            </View>
            <View className="flex-1">
              <Text
                className="font-coach-bold text-[17px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                Connect {config.name}
              </Text>
              <Text
                className="mt-0.5 font-coach text-[12px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                One more step
              </Text>
            </View>
          </View>

          {/* Intro */}
          <Text
            className="mt-4 font-coach text-[14px] leading-[20px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {config.intro}
          </Text>

          {/* Screenshot */}
          <View className="mt-4 items-center">
            <View
              className="overflow-hidden rounded-2xl"
              style={{
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
                backgroundColor: LIGHT_THEME.w2,
              }}
            >
              <Image
                source={config.image}
                style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
                resizeMode="contain"
              />
            </View>
            <Text
              className="mt-3 text-center font-coach-medium text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {config.caption}
            </Text>
          </View>

          {/* Actions */}
          <Pressable
            onPress={handleContinue}
            className="mt-5 items-center justify-center rounded-full py-3.5 active:opacity-80"
            style={{ backgroundColor: COLORS.lime }}
          >
            <Text
              className="font-coach-semibold text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              Continue
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCancel}
            className="mt-2 items-center justify-center py-2.5 active:opacity-60"
          >
            <Text
              className="font-coach-medium text-[14px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      )}
    </BottomSheetModal>
  );
  },
);

ConnectPermissionSheet.displayName = "ConnectPermissionSheet";
