import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { LIGHT_THEME } from "@/lib/design-tokens";

export default function AppLayout() {
  const athlete = useQuery(api.plan.reads.getAthlete);
  const plan = useQuery(api.plan.reads.getAthletePlan);
  const ensurePlan = useMutation(api.plan.athlete.ensurePlan);
  const ensureAttempted = useRef(false);

  useEffect(() => {
    if (athlete && plan === null && !ensureAttempted.current) {
      ensureAttempted.current = true;
      ensurePlan({}).catch((err) => {
        console.error("[AppLayout] ensurePlan failed:", err);
        ensureAttempted.current = false;
      });
    }
  }, [athlete, plan, ensurePlan]);

  if (athlete === undefined || plan === undefined || plan === null) {
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
          name="session/[id]"
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
