import { View, Image, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";
import { RotateCcw, WifiOff } from "lucide-react-native";

const CADENCE_ICON = require("../../../../assets/icons/ios-icon.png");

interface ChatErrorCardProps {
  message: string;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export function ChatErrorCard({
  message,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: ChatErrorCardProps) {
  const isExhausted = retryCount >= maxRetries;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="flex-row justify-start mb-2.5"
    >
      {/* Coach avatar */}
      <View className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-1">
        <Image source={CADENCE_ICON} className="w-7 h-7" />
      </View>

      <View
        className="max-w-[75%] px-4 py-3.5"
        style={{
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.2)",
          backgroundColor: "rgba(239,68,68,0.06)",
        }}
      >
        {/* Badge with red dot */}
        <View className="flex-row items-center gap-1.5 mb-2">
          <View className="w-[5px] h-[5px] rounded-full bg-red-400" />
          <Text className="text-[10px] font-coach-semibold text-red-400">
            Coach
          </Text>
        </View>

        {/* Error icon + message */}
        <View className="flex-row items-start gap-2 mb-3">
          <View className="mt-0.5">
            <WifiOff size={14} color="#f87171" />
          </View>
          <Text
            className="text-[14px] font-coach text-wText flex-1"
            style={{ lineHeight: 14 * 1.55 }}
          >
            {message}
          </Text>
        </View>

        {/* Retry button */}
        {onRetry && !isExhausted && (
          <Pressable
            onPress={onRetry}
            className="flex-row items-center justify-center gap-1.5 bg-wText py-2.5 rounded-xl active:opacity-80"
          >
            <RotateCcw size={13} color="#ffffff" />
            <Text className="text-[13px] font-coach-medium text-w1">
              Retry{retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ""}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
