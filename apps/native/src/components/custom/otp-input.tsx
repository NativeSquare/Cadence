import { useColorScheme } from "nativewind";
import * as React from "react";
import { OtpInput, type OtpInputProps } from "react-native-otp-entry";

export function OTPInput({ ...props }: OtpInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const foreground = isDark ? "#FAFAFA" : "#0A0A0A";
  const ring = isDark ? "#737373" : "#A1A1A1";
  return (
    <OtpInput
      numberOfDigits={6}
      focusColor={foreground}
      theme={{
        pinCodeContainerStyle: {
          borderColor: isDark ? "#262626" : "#E5E5E5",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
        },

        focusedPinCodeContainerStyle: {
          borderColor: ring,
          shadowColor: ring,
          shadowOpacity: 0.4,
          shadowRadius: 4,
        },

        pinCodeTextStyle: {
          color: foreground,
          fontSize: 20,
        },
      }}
      {...props}
    />
  );
}
