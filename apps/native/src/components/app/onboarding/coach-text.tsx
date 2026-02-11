import { arrivalPulse, insightTap, questionPause } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CoachLine = {
  text: string;
  /** ms to wait after this line before showing next (overrides lineDelay) */
  pauseAfter?: number;
  /** Fire a haptic when this line appears */
  haptic?: "arrival" | "insight" | "question";
};

type CoachTextProps = {
  /** Lines to display. Strings are auto-wrapped. */
  lines: (string | CoachLine)[];
  /** ms between lines appearing (default: 500) */
  lineDelay?: number;
  /** ms before the first line (default: 200) */
  initialDelay?: number;
  /** Called when all lines are visible */
  onComplete?: () => void;
  className?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(line: string | CoachLine): CoachLine {
  return typeof line === "string" ? { text: line } : line;
}

function fireHaptic(type: CoachLine["haptic"]) {
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

// ─── Component ────────────────────────────────────────────────────────────────

export function CoachText({
  lines,
  lineDelay = 250,
  initialDelay = 100,
  onComplete,
  className,
}: CoachTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const completeCalledRef = useRef(false);
  const normalized = lines.map(normalize);

  useEffect(() => {
    // All lines visible → fire onComplete once
    if (visibleCount >= normalized.length) {
      if (!completeCalledRef.current) {
        completeCalledRef.current = true;
        onComplete?.();
      }
      return;
    }

    // Determine delay before showing the next line
    const delay =
      visibleCount === 0
        ? initialDelay
        : (normalized[visibleCount - 1]?.pauseAfter ?? lineDelay);

    const timer = setTimeout(() => {
      const nextLine = normalized[visibleCount];
      if (nextLine?.haptic) fireHaptic(nextLine.haptic);
      setVisibleCount((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleCount, normalized.length]);

  return (
    <View className={cn("gap-3", className)}>
      {normalized.slice(0, visibleCount).map((line, index) => (
        <FadeInLine
          key={`${index}-${line.text.slice(0, 20)}`}
          text={line.text}
        />
      ))}
    </View>
  );
}

// ─── Fade-in line ─────────────────────────────────────────────────────────────

function FadeInLine({ text }: { text: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text className="text-lg leading-7 text-white font-light tracking-wide">
        {text}
      </Text>
    </Animated.View>
  );
}
