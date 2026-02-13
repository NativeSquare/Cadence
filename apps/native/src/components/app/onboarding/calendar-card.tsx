import { selectionFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { useRef, useEffect, useState } from "react";
import { Animated, Pressable, View, ActivityIndicator } from "react-native";

type CalendarProvider = {
  id: string;
  name: string;
  icon: string;
};

const PROVIDERS: CalendarProvider[] = [
  { id: "google", name: "Google Calendar", icon: "\uD83D\uDCC5" },
  { id: "apple", name: "Apple Calendar", icon: "\uD83C\uDF4E" },
  { id: "outlook", name: "Outlook", icon: "\uD83D\uDCE7" },
];

type CalendarCardProps = {
  onConnect: (providerId: string) => void;
  onSkip: () => void;
  isConnecting?: boolean;
  connectedProvider?: string | null;
  className?: string;
};

export function CalendarCard({
  onConnect,
  onSkip,
  isConnecting = false,
  connectedProvider = null,
  className,
}: CalendarCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={cn("gap-4", className)}
    >
      <View className="rounded-xl bg-white/5 border border-white/10 p-4 gap-3">
        {PROVIDERS.map((provider) => (
          <Pressable
            key={provider.id}
            onPress={() => {
              selectionFeedback();
              onConnect(provider.id);
            }}
            disabled={isConnecting || !!connectedProvider}
            className={cn(
              "flex-row items-center gap-3 rounded-lg px-4 py-3",
              connectedProvider === provider.id
                ? "bg-emerald-500/15 border border-emerald-500/30"
                : "bg-white/5 active:bg-white/10",
            )}
          >
            <Text className="text-2xl">{provider.icon}</Text>
            <Text className="text-base text-white font-medium flex-1">
              {provider.name}
            </Text>
            {isConnecting && connectedProvider === null && (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
            )}
            {connectedProvider === provider.id && (
              <Text className="text-emerald-400 text-sm font-medium">
                Connected
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onSkip} disabled={isConnecting}>
        <Text className="text-white/40 text-sm text-center">Skip for now</Text>
      </Pressable>
    </Animated.View>
  );
}
