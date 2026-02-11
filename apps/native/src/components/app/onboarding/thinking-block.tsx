import { insightTap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";

type ThinkingBlockProps = {
  lines: string[];
  /** ms per line (default: 200) */
  lineDelay?: number;
  /** ms per character within a line (default: 8) */
  charDelay?: number;
  /** Called when all lines have finished streaming */
  onComplete?: () => void;
  /** Whether to auto-start (default: true) */
  autoStart?: boolean;
  className?: string;
};

export function ThinkingBlock({
  lines,
  lineDelay = 200,
  charDelay = 8,
  onComplete,
  autoStart = true,
  className,
}: ThinkingBlockProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseAnim = useRef(new Animated.Value(1)).current;

  const cleanup = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Auto-start
  useEffect(() => {
    if (autoStart && lines.length > 0) {
      insightTap();
      setCurrentLineIndex(0);
    }
    return cleanup;
  }, [autoStart]);

  // Stream characters for current line
  useEffect(() => {
    if (currentLineIndex < 0 || currentLineIndex >= lines.length) return;

    const line = lines[currentLineIndex];

    if (currentCharIndex === 0) {
      // Starting a new line
      setVisibleLines((prev) => {
        const next = [...prev];
        next[currentLineIndex] = "";
        return next;
      });
    }

    if (currentCharIndex < line.length) {
      timerRef.current = setTimeout(() => {
        setVisibleLines((prev) => {
          const next = [...prev];
          next[currentLineIndex] = line.slice(0, currentCharIndex + 1);
          return next;
        });
        setCurrentCharIndex((prev) => prev + 1);
      }, charDelay);
    } else if (currentCharIndex === line.length && line.length > 0) {
      // Line complete, move to next after delay
      timerRef.current = setTimeout(() => {
        if (currentLineIndex < lines.length - 1) {
          setCurrentLineIndex((prev) => prev + 1);
          setCurrentCharIndex(0);
        } else {
          // All lines done - collapse after a brief pause
          timerRef.current = setTimeout(() => {
            setIsDone(true);
            setIsCollapsed(true);
            Animated.timing(collapseAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              onComplete?.();
            });
          }, 400);
        }
      }, lineDelay);
    }

    return cleanup;
  }, [currentCharIndex, currentLineIndex]);

  const toggleCollapse = () => {
    if (!isDone) return;
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    Animated.timing(collapseAnim, {
      toValue: newCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  if (isDone && isCollapsed) {
    return (
      <Pressable
        onPress={toggleCollapse}
        className={cn(
          "rounded-lg bg-white/5 border border-white/10 px-4 py-3",
          className,
        )}
      >
        <Text className="text-sm text-white/50 font-medium">
          {"▸ Thinking"}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      className={cn(
        "rounded-lg bg-white/5 border border-white/10 p-4",
        className,
      )}
    >
      {isDone && (
        <Pressable onPress={toggleCollapse} className="mb-2">
          <Text className="text-sm text-white/50 font-medium">
            {"▾ Thinking"}
          </Text>
        </Pressable>
      )}

      <View className="gap-1">
        {visibleLines.map((line, index) => (
          <Text
            key={index}
            className="text-xs text-primary/80 font-mono leading-5"
            style={{ fontFamily: "monospace" }}
          >
            {line}
            {index === currentLineIndex && !isDone && (
              <Text className="text-primary/40">▌</Text>
            )}
          </Text>
        ))}
      </View>
    </View>
  );
}
