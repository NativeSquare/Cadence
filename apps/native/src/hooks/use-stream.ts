import { useCallback, useEffect, useRef, useState } from "react";
import { STREAM_CHAR_MS } from "@/lib/animations";

export type UseStreamOptions = {
  /** Text to stream character by character */
  text: string;
  /** Speed in ms per character (default: 28ms) */
  speed?: number;
  /** Delay in ms before streaming starts (default: 0) */
  delay?: number;
  /** Whether streaming is active (default: true) */
  active?: boolean;
};

export type UseStreamResult = {
  /** Currently displayed text (partial during streaming) */
  displayed: string;
  /** Whether streaming has completed */
  done: boolean;
  /** Whether streaming has started (after delay) */
  started: boolean;
};

/**
 * Hook for character-by-character text streaming with delay support.
 *
 * @example
 * ```tsx
 * const { displayed, done, started } = useStream({
 *   text: "Hello world",
 *   speed: 28,
 *   delay: 500,
 *   active: true,
 * });
 * ```
 */
export function useStream({
  text,
  speed = STREAM_CHAR_MS,
  delay = 0,
  active = true,
}: UseStreamOptions): UseStreamResult {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  // Refs to track intervals/timeouts for cleanup
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset state when text, active, or delay changes
  useEffect(() => {
    cleanup();

    if (!active) {
      setDisplayed("");
      setDone(false);
      setStarted(false);
      indexRef.current = 0;
      return;
    }

    // Reset for new streaming
    setDisplayed("");
    setDone(false);
    setStarted(false);
    indexRef.current = 0;

    // Start delay timer
    delayTimeoutRef.current = setTimeout(() => {
      setStarted(true);
    }, delay);

    return cleanup;
  }, [active, text, delay, cleanup]);

  // Handle character streaming after started
  useEffect(() => {
    if (!started || !active) {
      return;
    }

    // If text is empty, mark as done immediately
    if (text.length === 0) {
      setDone(true);
      return;
    }

    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDone(true);
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [started, active, text, speed]);

  return { displayed, done, started };
}
