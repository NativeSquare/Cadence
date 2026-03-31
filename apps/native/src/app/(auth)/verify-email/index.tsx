import { VerifyEmailForm } from "@/components/blocks/verify-email-form";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const { email, name } = useLocalSearchParams<{ email: string; name?: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={20}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <VerifyEmailForm email={email} name={name} />
      </KeyboardAwareScrollView>
    </View>
  );
}
