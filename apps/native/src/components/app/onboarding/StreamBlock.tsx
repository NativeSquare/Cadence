import { useStream } from "@/hooks/use-stream";
import { STREAM_CHAR_MS } from "@/lib/animations";
import { GRAYS } from "@/lib/design-tokens";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Cursor } from "./Cursor";

export type StreamBlockProps = {
  /** Text to stream */
  text: string;
  /** Delay in ms before streaming starts (default: 0) */
  delay?: number;
  /** Whether streaming is active (default: true) */
  active?: boolean;
  /** Character speed in ms (default: 28) */
  speed?: number;
  /** Font size in pixels (default: 26) */
  size?: number;
  /** Text color (default: g1) */
  color?: string;
  /** Callback when streaming completes */
  onDone?: () => void;
};

/**
 * Streaming text block with blinking cursor.
 * Text appears character by character with configurable speed and delay.
 *
 * @example
 * ```tsx
 * <StreamBlock
 *   text="Hello, I'm your coach."
 *   delay={500}
 *   onDone={() => console.log("done")}
 * />
 * ```
 */
export function StreamBlock({
  text,
  delay = 0,
  active = true,
  speed = STREAM_CHAR_MS,
  size = 26,
  color = GRAYS.g1,
  onDone,
}: StreamBlockProps) {
  const { displayed, done, started } = useStream({
    text,
    speed,
    delay,
    active,
  });

  // Fire onDone callback when streaming completes
  useEffect(() => {
    if (done && onDone) {
      onDone();
    }
  }, [done, onDone]);

  // Don't render anything if not active or not started
  if (!active) {
    return null;
  }

  // Calculate cursor height based on font size (~1em)
  const cursorHeight = Math.round(size * 0.75);

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          {
            fontSize: size,
            color,
          },
        ]}
      >
        {displayed}
      </Text>
      {started && (
        <Cursor visible={!done && started} height={cursorHeight} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  text: {
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    lineHeight: undefined, // Let React Native calculate
    letterSpacing: -0.02 * 26, // -0.02em at base size
  },
});
