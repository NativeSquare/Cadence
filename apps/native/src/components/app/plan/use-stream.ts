/**
 * useStream - Hook for streaming text animation (typing effect)
 * Reference: cadence-full-v9.jsx useStream hook (lines 40-45)
 *
 * Creates a typewriter effect for text, revealing characters one at a time.
 */

import { useState, useEffect } from "react";

interface UseStreamOptions {
  /** Characters to reveal per interval (default: 1) */
  speed?: number;
  /** Delay in ms before starting (default: 0) */
  delay?: number;
  /** Whether the animation is active (default: true) */
  active?: boolean;
}

interface UseStreamResult {
  /** Currently displayed portion of the text */
  displayed: string;
  /** Whether the entire text has been revealed */
  done: boolean;
  /** Whether the animation has started */
  started: boolean;
}

/**
 * Hook for creating a streaming text animation effect
 *
 * @param text - The full text to stream
 * @param options - Configuration options
 * @returns Object with displayed text, done status, and started status
 *
 * @example
 * const { displayed, done, started } = useStream("Hello world", { speed: 28, delay: 800 });
 */
export function useStream(
  text: string,
  { speed = 28, delay = 0, active = true }: UseStreamOptions = {}
): UseStreamResult {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      setStarted(false);
      return;
    }

    // Reset state when text changes
    setDisplayed("");
    setDone(false);
    setStarted(false);

    // Start delay timeout
    const delayTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(delayTimeout);
  }, [active, text, delay]);

  useEffect(() => {
    if (!started || !active) return;

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        currentIndex++;
        setDisplayed(text.slice(0, currentIndex));
      } else {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, active, text, speed]);

  return { displayed, done, started };
}
