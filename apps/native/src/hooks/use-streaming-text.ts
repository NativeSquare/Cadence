import { useEffect, useRef, useState } from "react";

export type StreamPhrase = {
  text: string;
  /** Haptic to fire when this phrase starts */
  haptic?: "arrival" | "insight" | "question";
  /** Pause in ms after this phrase finishes streaming (default: 800) */
  pauseAfter?: number;
  /** Whether this is a "thinking" line (monospace, muted) */
  isThinking?: boolean;
};

type UseStreamingTextOptions = {
  /** Phrases to stream */
  phrases: StreamPhrase[];
  /** ms per character (default: 12) */
  charDelay?: number;
  /** Default pause between phrases in ms (default: 400) */
  defaultPause?: number;
  /** Called when all phrases have finished streaming */
  onComplete?: () => void;
  /** Called when each phrase starts */
  onPhraseStart?: (phrase: StreamPhrase, index: number) => void;
  /** Whether to start streaming immediately (default: true) */
  autoStart?: boolean;
  /** Initial delay before streaming starts in ms (default: 0) */
  initialDelay?: number;
};

export function useStreamingText({
  phrases,
  charDelay = 12,
  defaultPause = 400,
  onComplete,
  onPhraseStart,
  autoStart = true,
  initialDelay = 0,
}: UseStreamingTextOptions) {
  const [visiblePhrases, setVisiblePhrases] = useState<string[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(-1);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false);
  const isCancelledRef = useRef(false);

  const cleanup = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    isCancelledRef.current = false;
    setIsStreaming(true);

    if (initialDelay > 0) {
      timerRef.current = setTimeout(() => {
        if (!isCancelledRef.current) {
          setCurrentPhraseIndex(0);
        }
      }, initialDelay);
    } else {
      setCurrentPhraseIndex(0);
    }
  };

  const skip = () => {
    cleanup();
    const allTexts = phrases.map((p) => p.text);
    setVisiblePhrases(allTexts);
    setCurrentPhraseIndex(phrases.length);
    setCurrentCharIndex(0);
    setIsComplete(true);
    setIsStreaming(false);
  };

  // Start streaming when a new phrase begins
  useEffect(() => {
    if (currentPhraseIndex < 0 || currentPhraseIndex >= phrases.length) return;
    if (isCancelledRef.current) return;

    const phrase = phrases[currentPhraseIndex];
    onPhraseStart?.(phrase, currentPhraseIndex);

    // Initialize this phrase's text as empty
    setVisiblePhrases((prev) => {
      const next = [...prev];
      next[currentPhraseIndex] = "";
      return next;
    });
    setCurrentCharIndex(0);
  }, [currentPhraseIndex]);

  // Stream characters for the current phrase
  useEffect(() => {
    if (currentPhraseIndex < 0 || currentPhraseIndex >= phrases.length) return;
    if (isCancelledRef.current) return;

    const phrase = phrases[currentPhraseIndex];
    const text = phrase.text;

    if (currentCharIndex < text.length) {
      timerRef.current = setTimeout(() => {
        if (isCancelledRef.current) return;
        setVisiblePhrases((prev) => {
          const next = [...prev];
          next[currentPhraseIndex] = text.slice(0, currentCharIndex + 1);
          return next;
        });
        setCurrentCharIndex((prev) => prev + 1);
      }, charDelay);
    } else if (currentCharIndex === text.length && text.length > 0) {
      // Phrase complete, pause then move to next
      const pause = phrase.pauseAfter ?? defaultPause;
      timerRef.current = setTimeout(() => {
        if (isCancelledRef.current) return;
        if (currentPhraseIndex < phrases.length - 1) {
          setCurrentPhraseIndex((prev) => prev + 1);
        } else {
          // All done
          setIsComplete(true);
          setIsStreaming(false);
          onComplete?.();
        }
      }, pause);
    }

    return cleanup;
  }, [currentCharIndex, currentPhraseIndex]);

  // Auto-start
  useEffect(() => {
    if (autoStart && phrases.length > 0) {
      start();
    }
    return () => {
      isCancelledRef.current = true;
      cleanup();
    };
  }, [autoStart]);

  return {
    /** Array of visible phrase texts (partially or fully streamed) */
    visiblePhrases,
    /** Index of the phrase currently streaming (-1 if not started) */
    currentPhraseIndex,
    /** Whether all phrases have finished */
    isComplete,
    /** Whether currently streaming */
    isStreaming,
    /** Start streaming manually (if autoStart is false) */
    start,
    /** Skip to show all text immediately */
    skip,
  };
}
