import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { SignInSchema, SignUpSchema } from "@/validation/auth";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AUTH_ERROR_MAP: Record<string, string> = {
  InvalidAccountId: "No account found with this email.",
  InvalidSecret: "Incorrect password.",
  TooManyFailedAttempts: "Too many attempts. Please try again later.",
  AccountAlreadyExists: "An account with this email already exists.",
  InvalidVerificationCode: "Invalid verification code.",
};

function friendlyAuthError(raw: string): string {
  for (const [key, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (raw.includes(key)) return friendly;
  }
  return raw;
}

type Mode = "sign-in" | "sign-up";

export function EmailAuthForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [mode, setMode] = React.useState<Mode>("sign-in");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string | undefined>
  >({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const nameRef = React.useRef<TextInput>(null);
  const emailRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const confirmPasswordRef = React.useRef<TextInput>(null);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const isSignUp = mode === "sign-up";

  function resetErrors() {
    setFieldErrors({});
    setFormError(null);
  }

  function toggleMode() {
    setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
    resetErrors();
  }

  async function onSubmit() {
    resetErrors();

    if (!isSignUp) {
      const result = SignInSchema.safeParse({ email, password });
      if (!result.success) {
        const tree = z.treeifyError(result.error);
        setFieldErrors({
          email: tree.properties?.email?.errors?.[0],
          password: tree.properties?.password?.errors?.[0],
        });
        return;
      }

      setIsLoading(true);
      try {
        await signIn("password", { email, password, flow: "signIn" });
      } catch (error) {
        setFormError(friendlyAuthError(getConvexErrorMessage(error)));
      } finally {
        setIsLoading(false);
      }
    } else {
      const result = SignUpSchema.safeParse({
        name,
        email,
        password,
        confirmPassword,
        acceptTerms,
      });
      if (!result.success) {
        const tree = z.treeifyError(result.error);
        setFieldErrors({
          name: tree.properties?.name?.errors?.[0],
          email: tree.properties?.email?.errors?.[0],
          password: tree.properties?.password?.errors?.[0],
          confirmPassword: tree.properties?.confirmPassword?.errors?.[0],
          acceptTerms: tree.properties?.acceptTerms?.errors?.[0],
        });
        setFormError(tree.errors?.[0] ?? null);
        return;
      }

      setIsLoading(true);
      try {
        const { signingIn } = await signIn("password", {
          name,
          email,
          password,
          flow: "signUp",
        });
        if (!signingIn) {
          router.replace({ pathname: "/verify-email", params: { email, name } });
        }
      } catch (error) {
        setFormError(friendlyAuthError(getConvexErrorMessage(error)));
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Back button */}
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
        <Text style={styles.title}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? "Fill in the details to get started."
            : "Sign in with your email and password."}
        </Text>
      </Animated.View>

      {formError && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.formError}>{formError}</Text>
        </Animated.View>
      )}

      {/* Form fields */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(100)}
        style={styles.fields}
      >
        {isSignUp && (
          <View>
            <Text style={styles.label}>Name</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "name" && styles.inputContainerFocused,
              ]}
            >
              <TextInput
                ref={nameRef}
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={GRAYS.g4}
                autoComplete="name"
                autoCapitalize="words"
                returnKeyType="next"
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={() => emailRef.current?.focus()}
                value={name}
                onChangeText={setName}
              />
            </View>
            {fieldErrors.name && (
              <Text style={styles.fieldError}>{fieldErrors.name}</Text>
            )}
          </View>
        )}

        <View>
          <Text style={styles.label}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "email" && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="m@example.com"
              placeholderTextColor={GRAYS.g4}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              returnKeyType="next"
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {fieldErrors.email && (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          )}
        </View>

        <View>
          <Text style={styles.label}>Password</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "password" && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              ref={passwordRef}
              style={[styles.input, { paddingRight: 52 }]}
              placeholder={isSignUp ? "Set a password" : "Your password"}
              placeholderTextColor={GRAYS.g4}
              secureTextEntry={!showPassword}
              returnKeyType={isSignUp ? "next" : "done"}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={
                isSignUp
                  ? () => confirmPasswordRef.current?.focus()
                  : onSubmit
              }
              value={password}
              onChangeText={setPassword}
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
          {fieldErrors.password && (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          )}
        </View>

        {isSignUp && (
          <>
            <View>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === "confirmPassword" &&
                    styles.inputContainerFocused,
                ]}
              >
                <TextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, { paddingRight: 52 }]}
                  placeholder="Confirm password"
                  placeholderTextColor={GRAYS.g4}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={onSubmit}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((p) => !p)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={GRAYS.g3}
                  />
                </Pressable>
              </View>
              {fieldErrors.confirmPassword && (
                <Text style={styles.fieldError}>
                  {fieldErrors.confirmPassword}
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => setAcceptTerms((v) => !v)}
              style={styles.termsRow}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptTerms && styles.checkboxChecked,
                ]}
              >
                {acceptTerms && (
                  <Ionicons name="checkmark" size={14} color="#000" />
                )}
              </View>
              <Text style={styles.termsText}>
                Accept terms and conditions
              </Text>
            </Pressable>
            {fieldErrors.acceptTerms && (
              <Text style={styles.fieldError}>{fieldErrors.acceptTerms}</Text>
            )}
          </>
        )}
      </Animated.View>

      {/* Submit button */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)}>
        <SubmitButton
          onPress={onSubmit}
          loading={isLoading}
          label={isSignUp ? "Continue" : "Sign In"}
        />
      </Animated.View>

      {/* Forgot password (sign-in only) */}
      {!isSignUp && (
        <Animated.View entering={FadeIn.duration(400).delay(250)}>
          <Pressable
            onPress={() => router.navigate("/forgot-password")}
            style={styles.forgotButton}
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Mode toggle */}
      <Animated.View
        entering={FadeIn.duration(400).delay(300)}
        style={styles.toggleRow}
      >
        <Text style={styles.toggleLabel}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </Text>
        <Pressable
          onPress={toggleMode}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <Text style={styles.toggleLink}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function SubmitButton({
  onPress,
  loading,
  label,
}: {
  onPress: () => void;
  loading: boolean;
  label: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.975, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      disabled={loading}
      style={[styles.submitButton, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text style={styles.submitText}>{label}</Text>
      )}
    </AnimatedPressable>
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },
  termsText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g2,
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
  forgotButton: {
    alignSelf: "center",
  },
  forgotText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: GRAYS.g3,
    textDecorationLine: "underline",
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
