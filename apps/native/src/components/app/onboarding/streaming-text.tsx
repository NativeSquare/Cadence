import { arrivalPulse, insightTap, questionPause } from "@/lib/haptics";
import { StreamPhrase, useStreamingText } from "@/hooks/use-streaming-text";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Cursor } from "./Cursor";

// Re-export StreamBlock for convenience
export { StreamBlock } from "./StreamBlock";

type StreamingTextProps = {
  phrases: StreamPhrase[];
  onComplete?: () => void;
  charDelay?: number;
  defaultPause?: number;
  autoStart?: boolean;
  initialDelay?: number;
  className?: string;
};

function fireHaptic(type: StreamPhrase["haptic"]) {
  switch (type) {
    case "arrival":
      arrivalPulse();
      break;
    case "insight":
      insightTap();
      break;
    case "question":
      questionPause();
      break;
  }
}

export function StreamingText({
  phrases,
  onComplete,
  charDelay = 12,
  defaultPause = 400,
  autoStart = true,
  initialDelay = 0,
  className,
}: StreamingTextProps) {
  const { visiblePhrases, currentPhraseIndex, isComplete } = useStreamingText({
    phrases,
    charDelay,
    defaultPause,
    onComplete,
    autoStart,
    initialDelay,
    onPhraseStart: (phrase) => {
      if (phrase.haptic) {
        fireHaptic(phrase.haptic);
      }
    },
  });

  return (
    <View className={cn("gap-4", className)}>
      {visiblePhrases.map((text, index) => {
        if (!text) return null;
        return (
          <PhraseText
            key={index}
            text={text}
            isCurrentlyStreaming={index === currentPhraseIndex && !isComplete}
          />
        );
      })}
    </View>
  );
}

function PhraseText({
  text,
  isCurrentlyStreaming,
}: {
  text: string;
  isCurrentlyStreaming: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, flexDirection: "row", alignItems: "flex-end" }}>
      <Text className="text-lg leading-7 text-white font-light tracking-wide">
        {text}
      </Text>
      <Cursor visible={isCurrentlyStreaming} height={18} />
    </Animated.View>
  );
}
