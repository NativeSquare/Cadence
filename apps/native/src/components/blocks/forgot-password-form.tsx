import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { ForgotPasswordSchema } from "@/validation/auth";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
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
import z from "zod";
import { api } from "@packages/backend/convex/_generated/api";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ForgotPasswordForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const convex = useConvex();

  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  async function onSubmit() {
    setFormError(null);
    setFieldErrors({});

    const result = ForgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      setFieldErrors({ email: tree.properties?.email?.errors?.[0] });
      return;
    }

    const user = await convex.query(api.table.users.getUserByEmail, {
      email,
    });
    if (!user) {
      setFormError("No account found with this email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("password", { email, flow: "reset" });
      if (res) {
        router.replace({
          pathname: "/reset-password",
          params: { email },
        });
      }
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
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email to receive a reset code.
        </Text>
      </Animated.View>

      {formError && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.formError}>{formError}</Text>
        </Animated.View>
      )}

      {/* Email field */}
      <Animated.View entering={FadeInUp.duration(500).delay(100)}>
        <Text style={styles.label}>Email</Text>
        <View
          style={[styles.inputContainer, focused && styles.inputContainerFocused]}
        >
          <TextInput
            style={styles.input}
            placeholder="m@example.com"
            placeholderTextColor={GRAYS.g4}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            returnKeyType="send"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmit}
            value={email}
            onChangeText={setEmail}
          />
        </View>
        {fieldErrors.email && (
          <Text style={styles.fieldError}>{fieldErrors.email}</Text>
        )}
      </Animated.View>

      {/* Submit */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)}>
        <AnimatedPressable
          onPress={onSubmit}
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
            <Text style={styles.submitText}>Reset your password</Text>
          )}
        </AnimatedPressable>
      </Animated.View>

      {/* Back to sign in */}
      <Animated.View
        entering={FadeIn.duration(400).delay(300)}
        style={styles.toggleRow}
      >
        <Text style={styles.toggleLabel}>Remember your password?</Text>
        <Pressable
          onPress={() => router.navigate("/email-auth")}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <Text style={styles.toggleLink}>Sign In</Text>
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  toggleLabel: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g3,
  },
  toggleLink: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: COLORS.lime,
    textDecorationLine: "underline",
  },
});
