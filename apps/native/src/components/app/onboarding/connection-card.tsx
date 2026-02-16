import { selectionFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { COLORS } from "@/lib/design-tokens";
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
  onContinue?: () => void;
  isConnecting?: boolean;
  connectingProvider?: string | null;
  connectedProviders?: string[];
  className?: string;
};

export function ConnectionCard({
  onConnect,
  onSkip,
  onContinue,
  isConnecting = false,
  connectingProvider = null,
  connectedProviders = [],
  className,
}: ConnectionCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasConnected = connectedProviders.length > 0;

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
        {PROVIDERS.map((provider) => {
          const isConnected = connectedProviders.includes(provider.id);
          const isThisConnecting = connectingProvider === provider.id;

          return (
            <Pressable
              key={provider.id}
              onPress={() => {
                selectionFeedback();
                onConnect(provider.id);
              }}
              disabled={isConnecting || isConnected}
              className={cn(
                "flex-row items-center gap-3 rounded-lg px-4 py-3",
                isConnected
                  ? "bg-emerald-500/15 border border-emerald-500/30"
                  : isConnecting && !isThisConnecting
                    ? "bg-white/5 opacity-50"
                    : "bg-white/5 active:bg-white/10",
              )}
            >
              <Text className="text-2xl">{provider.icon}</Text>
              <Text className="text-base text-white font-medium flex-1">
                {provider.name}
              </Text>
              {isThisConnecting && (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
              )}
              {isConnected && (
                <Text className="text-emerald-400 text-sm font-medium">
                  Connected
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {hasConnected && onContinue ? (
        <Pressable
          onPress={onContinue}
          disabled={isConnecting}
          style={{
            backgroundColor: COLORS.lime,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            opacity: isConnecting ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              color: "#000",
              fontFamily: "Outfit-SemiBold",
              fontSize: 16,
            }}
          >
            Continue
          </Text>
        </Pressable>
      ) : null}

      <Pressable onPress={onSkip} disabled={isConnecting}>
        <Text className="text-white/40 text-sm text-center">
          {hasConnected
            ? "That's all for now"
            : "I don't have a wearable right now"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
