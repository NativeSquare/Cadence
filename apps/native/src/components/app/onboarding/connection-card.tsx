import { selectionFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { useRef, useEffect } from "react";
import {
  Animated,
  Platform,
  Pressable,
  View,
  ActivityIndicator,
} from "react-native";

type WearableProvider = {
  id: string;
  name: string;
  icon: string;
  platforms?: ("ios" | "android")[];
};

const ALL_PROVIDERS: WearableProvider[] = [
  { id: "garmin", name: "Garmin", icon: "⌚" },
  { id: "coros", name: "COROS", icon: "⌚" },
  { id: "apple", name: "Apple Health", icon: "⌚", platforms: ["ios"] },
  { id: "strava", name: "Strava", icon: "🏃" },
];

const PROVIDERS = ALL_PROVIDERS.filter(
  (p) => !p.platforms || p.platforms.includes(Platform.OS as "ios" | "android"),
);

type ConnectionCardProps = {
  onConnect: (providerId: string) => void;
  onSkip: () => void;
  isConnecting?: boolean;
  connectingProvider?: string | null;
  connectedProvider?: string | null;
  connectedAthleteName?: string | null;
  className?: string;
};

export function ConnectionCard({
  onConnect,
  onSkip,
  isConnecting = false,
  connectingProvider = null,
  connectedProvider = null,
  connectedAthleteName = null,
  className,
}: ConnectionCardProps) {
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
            {connectingProvider === provider.id && (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
            )}
            {connectedProvider === provider.id && (
              <Text className="text-emerald-400 text-sm font-medium">
                {connectedAthleteName
                  ? `Connected · ${connectedAthleteName}`
                  : "Connected"}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onSkip} disabled={isConnecting}>
        <Text className="text-white/40 text-sm text-center">
          I don't have a wearable right now
        </Text>
      </Pressable>
    </Animated.View>
  );
}
