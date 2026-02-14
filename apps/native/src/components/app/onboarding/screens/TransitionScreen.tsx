/**
 * TransitionScreen - Bridge between conversation and plan visualization.
 *
 * Streams coach messages, animates progress bar to 100%, shows spinner,
 * then auto-advances to RadarScreen.
 *
 * Source: Story 2.13 - AC#1-#10
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StreamBlock } from "../StreamBlock";
import { COLORS, GRAYS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

type TransitionState =
  | "streaming-1" // First message streaming
  | "streaming-2" // Second message streaming
  | "animating-bar" // Progress bar filling
  | "spinning" // Spinner active, waiting
  | "transitioning"; // Fade out, advancing

interface TransitionScreenProps {
  /** Progress percentage before this screen (default: 95) */
  currentProgress?: number;
  /** Called when auto-advance triggers */
  onComplete: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const MESSAGES = {
  first: "Okay. I believe I have what I need to draft your game plan.",
  second: "Give me a second to put this together...",
};

const TIMING = {
  secondMessageDelay: 500, // Delay after first message
  progressBarDuration: 2000, // Progress bar animation
  spinnerDelay: 2500, // Auto-advance delay after spinner
  fadeOutDuration: 300, // Fade out transition
};

// =============================================================================
// Spinner Component
// =============================================================================

function Spinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1, // Infinite
      false // Don't reverse
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.spinner, animatedStyle]}>
      <View style={styles.spinnerInner} />
    </Animated.View>
  );
}

// =============================================================================
// Progress Bar Component
// =============================================================================

interface ProgressBarProps {
  progress: number; // 0-100
  animateTo?: number; // Target to animate to
  onAnimationComplete?: () => void;
}

function ProgressBar({ progress, animateTo, onAnimationComplete }: ProgressBarProps) {
  const width = useSharedValue(progress);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (animateTo !== undefined && !hasAnimated.current) {
      hasAnimated.current = true;
      width.value = withTiming(
        animateTo,
        {
          duration: TIMING.progressBarDuration,
          easing: Easing.inOut(Easing.ease),
        },
        (finished) => {
          "worklet";
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
    }
  }, [animateTo, width, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, animatedStyle]} />
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TransitionScreen({
  currentProgress = 95,
  onComplete,
}: TransitionScreenProps) {
  const [state, setState] = useState<TransitionState>("streaming-1");
  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle first message completion
  const handleFirstMessageDone = useCallback(() => {
    // Delay before second message
    setTimeout(() => {
      setState("streaming-2");
      setShowSecondMessage(true);
    }, TIMING.secondMessageDelay);
  }, []);

  // Handle second message completion
  const handleSecondMessageDone = useCallback(() => {
    setState("animating-bar");
  }, []);

  // Handle progress bar animation complete
  const handleProgressComplete = useCallback(() => {
    setState("spinning");
    setShowSpinner(true);
  }, []);

  // Auto-advance timer after spinner appears
  useEffect(() => {
    if (state === "spinning") {
      spinnerTimerRef.current = setTimeout(() => {
        setState("transitioning");
        // Delay for fade-out, then call onComplete
        setTimeout(onComplete, TIMING.fadeOutDuration);
      }, TIMING.spinnerDelay);

      return () => {
        if (spinnerTimerRef.current) {
          clearTimeout(spinnerTimerRef.current);
        }
      };
    }
  }, [state, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current);
      }
    };
  }, []);

  const isTransitioning = state === "transitioning";

  return (
    <Animated.View
      style={styles.container}
      exiting={isTransitioning ? FadeOut.duration(TIMING.fadeOutDuration) : undefined}
    >
      {/* Messages Section - Upper Third */}
      <View style={styles.messagesSection}>
        {/* First Message - Always visible */}
        <StreamBlock
          text={MESSAGES.first}
          onDone={handleFirstMessageDone}
        />

        {/* Second Message */}
        {showSecondMessage && (
          <View style={styles.secondMessage}>
            <StreamBlock
              text={MESSAGES.second}
              onDone={handleSecondMessageDone}
            />
          </View>
        )}
      </View>

      {/* Loading Section */}
      <View style={styles.loadingSection}>
        {/* Progress Bar */}
        <ProgressBar
          progress={currentProgress}
          animateTo={state === "animating-bar" || showSpinner ? 100 : undefined}
          onAnimationComplete={handleProgressComplete}
        />

        {/* Spinner */}
        {showSpinner && (
          <View style={styles.spinnerContainer}>
            <Spinner />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
  },
  messagesSection: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 100, // Push messages to upper portion
  },
  secondMessage: {
    marginTop: 24,
  },
  loadingSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 60,
    alignItems: "center",
  },
  progressTrack: {
    width: "90%",
    height: 4,
    backgroundColor: GRAYS.g6,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.lime,
    borderRadius: 2,
  },
  spinnerContainer: {
    marginTop: 48,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: GRAYS.g6,
    borderTopColor: COLORS.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerInner: {
    // Inner circle not needed, just using border styling
  },
});
