import { SignInCard } from "@/components/app/auth/sign-in-card";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignIn() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <ImageBackground
        source={require("../../../../assets/images/runner-background.jpg")}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1" />
        <View
          className="px-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <SignInCard />
        </View>
      </ImageBackground>
    </View>
  );
}
