import { View, Image, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";

const CADENCE_ICON = require("../../../../assets/icons/ios-icon.png");

interface CoachEmptyStateProps {
  onSuggestionPress: (text: string) => void;
  disabled?: boolean;
}

export function CoachEmptyState({
  onSuggestionPress,
  disabled,
}: CoachEmptyStateProps) {
  const { t } = useTranslation();
  const suggestions = t("coach.emptyState.suggestions", {
    returnObjects: true,
  }) as string[];
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-6 pb-8"
    >
      {/* Coach avatar */}
      <View
        className="w-16 h-16 rounded-2xl overflow-hidden mb-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Image source={CADENCE_ICON} className="w-16 h-16" />
      </View>

      {/* Heading */}
      <Text
        className="text-[20px] font-coach-bold text-wText mb-1.5"
        style={{ letterSpacing: -0.03 * 20 }}
      >
        {t("coach.emptyState.heading")}
      </Text>

      {/* Subheading */}
      <Text className="text-[14px] font-coach text-wMute text-center mb-8 max-w-[260px]">
        {t("coach.emptyState.subheading")}
      </Text>

      {/* Suggestion chips */}
      <View className="w-full gap-2">
        {suggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => onSuggestionPress(suggestion)}
            disabled={disabled}
            className="bg-w1 px-4 py-3 active:opacity-70"
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Text className="text-[14px] font-coach text-wText">
              {suggestion}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
