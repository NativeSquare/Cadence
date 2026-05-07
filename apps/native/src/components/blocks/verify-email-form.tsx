import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import { VerifyEmailSchema } from "@/validation/auth";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { OtpInput } from "react-native-otp-entry";
import z from "zod";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VerifyEmailForm({ email, name }: { email: string; name?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<{ code?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  async function onSubmit(submittedCode?: string) {
    const value = submittedCode ?? code;
    setFormError(null);
    setFieldErrors({});

    const result = VerifyEmailSchema.safeParse({ code: value });
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      setFieldErrors({ code: tree.properties?.code?.errors?.[0] });
      return;
    }

    setIsLoading(true);
    try {
      await signIn("password", {
        email,
        code: value,
        flow: "email-verification",
        ...(name ? { name } : {}),
      });
    } catch (error) {
      setFormError(t("auth.verifyEmail.invalidCode"));
    } finally {
      setIsLoading(false);
    }
  }

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Back */}
      <Animated.View entering={FadeIn.duration(400)}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={GRAYS.g2} />
        </Pressable>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeIn.duration(500).delay(50)}>
        <Text style={styles.title}>{t("auth.verifyEmail.title")}</Text>
        <Text style={styles.subtitle}>
          {t("auth.verifyEmail.subtitle", { email })}
        </Text>
      </Animated.View>

      {formError && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.formError}>{formError}</Text>
        </Animated.View>
      )}

      {/* OTP */}
      <Animated.View entering={FadeInUp.duration(500).delay(100)}>
        <Text style={styles.label}>
          {t("auth.verifyEmail.verificationCode")}
        </Text>
        <OtpInput
          numberOfDigits={6}
          focusColor={GRAYS.g1}
          onTextChange={setCode}
          onFilled={(text) => onSubmit(text)}
          theme={{
            pinCodeContainerStyle: {
              borderWidth: 2,
              borderColor: SURFACES.brd,
              backgroundColor: SURFACES.card,
              borderRadius: 10,
              width: 44,
              height: 52,
            },
            focusedPinCodeContainerStyle: {
              borderColor: GRAYS.g1,
            },
            pinCodeTextStyle: {
              color: GRAYS.g1,
              fontFamily: "Outfit-Medium",
              fontSize: 20,
            },
          }}
        />
        {fieldErrors.code && (
          <Text style={styles.fieldError}>{fieldErrors.code}</Text>
        )}
      </Animated.View>

      {/* Submit */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)}>
        <AnimatedPressable
          onPress={() => onSubmit()}
          onPressIn={() => {
            scale.value = withSpring(0.975, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          disabled={isLoading}
          style={[styles.submitButton, animatedStyle]}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitText}>
              {t("auth.verifyEmail.submit")}
            </Text>
          )}
        </AnimatedPressable>
      </Animated.View>

      {/* Cancel */}
      <Animated.View entering={FadeIn.duration(400).delay(300)}>
        <Pressable
          onPress={() => router.navigate("/sign-in")}
          style={styles.cancelButton}
          hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        >
          <Text style={styles.cancelText}>{t("auth.verifyEmail.cancel")}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACES.card,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 26,
    lineHeight: 34,
    color: GRAYS.g1,
    letterSpacing: -0.52,
  },
  subtitle: {
    fontFamily: "Outfit-Light",
    fontSize: 15,
    color: GRAYS.g3,
    marginTop: 4,
    letterSpacing: -0.15,
  },
  formError: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: COLORS.red,
    textAlign: "center",
  },
  label: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: GRAYS.g2,
    marginBottom: 6,
    letterSpacing: -0.13,
  },
  fieldError: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: COLORS.red,
    marginTop: 4,
  },
  submitButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.16,
  },
  cancelButton: {
    alignSelf: "center",
  },
  cancelText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g3,
    textDecorationLine: "underline",
  },
});
