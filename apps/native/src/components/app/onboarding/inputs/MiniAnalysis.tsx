/**
 * MiniAnalysis Component
 *
 * Displays visible AI processing when user submits freeform text.
 * Shows terminal-style line reveals, pattern extraction, and warning flags.
 *
 * Source: Story 2.10 - AC#1-#6
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import { MINI_ANALYSIS_LINE_MS } from "@/lib/animations";
import { useFadeUp, usePulseGlow } from "@/lib/use-animations";

// =============================================================================
// Types
// =============================================================================

/** Line types for analysis output */
type LineType = "sys" | "extract" | "flag" | "done" | "sp";

interface AnalysisLine {
  text: string;
  type: LineType;
}

export interface MiniAnalysisProps {
  /** User's input text to analyze */
  text: string;
  /** Callback when analysis completes */
  onDone?: () => void;
}

// =============================================================================
// Pattern Detection
// =============================================================================

/**
 * Analyzes user input text and returns formatted analysis lines.
 * Detects race goals, timelines, injuries, and schedule preferences.
 */
function getAnalysisLines(input: string): AnalysisLine[] {
  const lower = input.toLowerCase();
  const results: AnalysisLine[] = [];

  // Initial processing message
  results.push({ text: "Processing response...", type: "sys" });
  results.push({ text: "", type: "sp" });

  // Race goal detection
  if (lower.includes("half") || lower.includes("marathon") || lower.includes("10k") || lower.includes("5k")) {
    if (lower.includes("half")) {
      results.push({ text: "Race goal detected: Half Marathon", type: "extract" });
    } else if (lower.includes("marathon") && !lower.includes("half")) {
      results.push({ text: "Race goal detected: Marathon", type: "extract" });
    } else if (lower.includes("10k")) {
      results.push({ text: "Race goal detected: 10K", type: "extract" });
    } else if (lower.includes("5k")) {
      results.push({ text: "Race goal detected: 5K", type: "extract" });
    }
  }

  // Time goal detection
  const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    results.push({ text: `Target time extracted: ${timeMatch[0]}`, type: "extract" });
  }

  // Timeline detection
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const foundMonth = months.find(m => lower.includes(m));
  if (foundMonth) {
    results.push({ text: `Timeline extracted → planning window set`, type: "extract" });
  } else if (lower.includes("week") || lower.includes("month")) {
    results.push({ text: `Timeline extracted → planning window set`, type: "extract" });
  }

  // Injury/break detection - flagged warnings
  if (lower.includes("baby") || lower.includes("break") || lower.includes("off")) {
    results.push({ text: "⚠ Return from extended break detected", type: "flag" });
    results.push({ text: "→ Conservative ramp-up applied", type: "flag" });
  }

  if (lower.includes("injury") || lower.includes("injured") || lower.includes("pain") || lower.includes("hurt")) {
    results.push({ text: "⚠ Injury history detected", type: "flag" });
    results.push({ text: "→ Recovery protocols engaged", type: "flag" });
  }

  if (lower.includes("knee") || lower.includes("shin") || lower.includes("achilles") || lower.includes("plantar")) {
    results.push({ text: "⚠ Specific injury area noted", type: "flag" });
    results.push({ text: "→ Targeted prevention added", type: "flag" });
  }

  // Schedule detection
  if (lower.includes("morning") || lower.includes("evening") || lower.includes("night") || lower.includes("afternoon")) {
    results.push({ text: "Schedule preference noted", type: "extract" });
  }

  if (lower.includes("work") || lower.includes("busy") || lower.includes("travel")) {
    results.push({ text: "Availability constraints logged", type: "extract" });
  }

  // Fallback if no specific patterns detected
  if (results.length === 2) {
    results.push({ text: "Context captured", type: "extract" });
  }

  // Completion line
  results.push({ text: "", type: "sp" });
  results.push({ text: "Added to profile ✓", type: "done" });

  return results;
}

// =============================================================================
// Sub-components
// =============================================================================

/** Pulsing orange dot for processing state */
function ProcessingDot({ active }: { active: boolean }) {
  const pulseStyle = usePulseGlow();

  if (!active) {
    return (
      <View style={[styles.dot, { backgroundColor: COLORS.lime }]} />
    );
  }

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: COLORS.ora }, pulseStyle]}
    />
  );
}

/** Single analysis line with fade-up animation */
function AnalysisLineItem({
  line,
  index,
  visible,
}: {
  line: AnalysisLine;
  index: number;
  visible: boolean;
}) {
  const fadeStyle = useFadeUp(visible, 0, 200);

  if (line.type === "sp") {
    return <View style={styles.spacer} />;
  }

  const getLineStyle = () => {
    switch (line.type) {
      case "sys":
        return { color: GRAYS.g4 };
      case "extract":
        return { color: GRAYS.g2 };
      case "flag":
        return { color: COLORS.ora };
      case "done":
        return { color: COLORS.lime, fontWeight: "600" as const };
      default:
        return { color: GRAYS.g2 };
    }
  };

  return (
    <Animated.View style={fadeStyle}>
      <Text style={[styles.lineText, getLineStyle()]}>{line.text}</Text>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MiniAnalysis({ text, onDone }: MiniAnalysisProps) {
  const [visibleLines, setVisibleLines] = useState<AnalysisLine[]>([]);
  const [done, setDone] = useState(false);
  const analysisLines = useRef<AnalysisLine[]>([]);
  const lineIndex = useRef(0);

  // Animated values for border/background transition
  const borderColor = useSharedValue<string>(SURFACES.brd);
  const backgroundColor = useSharedValue<string>(SURFACES.card);

  // Compute analysis lines on mount
  useEffect(() => {
    analysisLines.current = getAnalysisLines(text);
  }, [text]);

  // Line reveal interval
  useEffect(() => {
    const addNextLine = () => {
      if (lineIndex.current < analysisLines.current.length) {
        const line = analysisLines.current[lineIndex.current];
        setVisibleLines(prev => [...prev, line]);
        lineIndex.current++;

        // Determine delay for next line
        const nextDelay = line?.type === "sp" ? 120 : MINI_ANALYSIS_LINE_MS;
        setTimeout(addNextLine, nextDelay);
      } else {
        // Analysis complete
        setTimeout(() => {
          setDone(true);
          onDone?.();
        }, 600);
      }
    };

    // Initial delay before first line
    const timeout = setTimeout(addNextLine, 500);
    return () => clearTimeout(timeout);
  }, [text, onDone]);

  // Border/background transition on completion
  useEffect(() => {
    if (done) {
      borderColor.value = withTiming(SURFACES.sb, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      backgroundColor.value = withTiming(SURFACES.sg, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [done]);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    backgroundColor: backgroundColor.value,
  }));

  return (
    <View style={styles.wrapper}>
      {/* User message card */}
      <View style={styles.userMessageCard}>
        <Text style={styles.userMessageText}>{text}</Text>
      </View>

      {/* Analysis card */}
      <Animated.View style={[styles.analysisCard, containerStyle]}>
        {/* Header with processing indicator */}
        <View style={styles.header}>
          <ProcessingDot active={!done} />
          <Text style={[styles.statusText, done && { color: COLORS.lime }]}>
            {done ? "Processed" : "Analyzing..."}
          </Text>
        </View>

        {/* Analysis lines */}
        <View style={styles.linesContainer}>
          {visibleLines.map((line, index) => (
            <AnalysisLineItem
              key={index}
              line={line}
              index={index}
              visible={true}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  userMessageCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
  },
  userMessageText: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: GRAYS.g1,
    lineHeight: 24,
  },
  analysisCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 12,
    color: GRAYS.g3,
  },
  linesContainer: {
    gap: 4,
  },
  lineText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  spacer: {
    height: 8,
  },
});
