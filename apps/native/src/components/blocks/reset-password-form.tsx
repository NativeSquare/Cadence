import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { ResetPasswordSchema } from "@/validation/auth";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
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

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    newPassword?: string;
    code?: string;
  }>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  async function onSubmit(submittedCode?: string) {
    const value = submittedCode ?? code;
    setFormError(null);
    setFieldErrors({});

    const result = ResetPasswordSchema.safeParse({
      newPassword,
      code: value,
    });
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      setFieldErrors({
        newPassword: tree.properties?.newPassword?.errors?.[0],
        code: tree.properties?.code?.errors?.[0],
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn("password", {
        code: value,
        newPassword,
        email,
        flow: "reset-verification",
      });
    } catch (error) {
      setFormError(getConvexErrorMessage(error));
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
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to {email} and set a new password.
        </Text>
      </Animated.View>

      {formError && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.formError}>{formError}</Text>
        </Animated.View>
      )}

      {/* New password */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(100)}
        style={styles.fields}
      >
        <View>
          <Text style={styles.label}>New password</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "password" && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              style={[styles.input, { paddingRight: 52 }]}
              placeholder="New password"
              placeholderTextColor={GRAYS.g4}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Pressable
              onPress={() => setShowPassword((p) => !p)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={GRAYS.g3}
              />
            </Pressable>
          </View>
          {fieldErrors.newPassword && (
            <Text style={styles.fieldError}>{fieldErrors.newPassword}</Text>
          )}
        </View>

        {/* OTP code */}
        <View>
          <Text style={styles.label}>Verification code</Text>
          <OtpInput
            numberOfDigits={6}
            focusColor={GRAYS.g1}
            autoFocus={false}
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
        </View>
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
            <Text style={styles.submitText}>Reset Password</Text>
          )}
        </AnimatedPressable>
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
  fields: {
    gap: 18,
  },
  label: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: GRAYS.g2,
    marginBottom: 6,
    letterSpacing: -0.13,
  },
  inputContainer: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainerFocused: {
    borderColor: GRAYS.g1,
  },
  input: {
    flex: 1,
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: GRAYS.g1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 4,
    padding: 12,
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
});
