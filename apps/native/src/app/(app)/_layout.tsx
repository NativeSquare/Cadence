import { Stack } from "expo-router";
import { View } from "react-native";

export default function AppLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen
          name="active-session"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
            gestureEnabled: false,
          }}
        />
      </Stack>
    </View>
  );
}
