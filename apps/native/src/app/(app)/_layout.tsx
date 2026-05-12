import { Stack } from "expo-router";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";

export default function AppLayout() {
  const athlete = useQuery(api.agoge.athletes.getAthlete);

  if (athlete === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workouts/[id]/index"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
      </Stack>
    </View>
  );
}
