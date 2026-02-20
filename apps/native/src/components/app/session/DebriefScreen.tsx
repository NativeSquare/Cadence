/**
 * DebriefScreen - Post-workout debrief flow
 * Reference: cadence-full-v10.jsx DebriefScreen (lines 647-848)
 *
 * Flow phases:
 * 0 (initial): Show header only
 * 1: Feeling question appears (delay 500ms)
 * 2: Quick tags + note input (after feeling selected, delay 400ms)
 * submitted: Coach streaming response
 * coachReply: Logged summary + Done button
 * celebrating: Celebration overlay (2800ms)
 */

import { useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

import { DebriefHeader } from "./DebriefHeader";
import { FeelingSelector, FEELING_OPTIONS, type FeelingValue } from "./FeelingSelector";
import { QuickTagPills, DEBRIEF_PILLS } from "./QuickTagPills";
import { DebriefNoteInput } from "./DebriefNoteInput";
import { VoiceRecorderMode } from "./VoiceRecorderMode";
import { CoachResponseCard } from "./CoachResponseCard";
import { DebriefSummary } from "./DebriefSummary";
import { CelebrationOverlay } from "./CelebrationOverlay";

export interface DebriefScreenProps {
  session: {
    type: string;
    zone: string;
    km: number;
  };
  elapsedTime: number; // seconds
  distanceCovered: number; // km (actual)
  onDone: () => void;
}

export function DebriefScreen({
  session,
  elapsedTime,
  distanceCovered,
  onDone,
}: DebriefScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Flow state
  const [phase, setPhase] = useState(0);
  const [feeling, setFeeling] = useState<FeelingValue | null>(null);
  const [noteText, setNoteText] = useState("");
  const [selectedPills, setSelectedPills] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [coachReply, setCoachReply] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  // Entrance animation
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.97);

  useEffect(() => {
    // Entrance animation: debriefIn .5s ease
    containerOpacity.value = withTiming(1, { duration: 500, easing: Easing.ease });
    containerScale.value = withTiming(1, { duration: 500, easing: Easing.ease });

    // Phase 1: Show feeling question after 500ms
    const t1 = setTimeout(() => setPhase(1), 500);
    return () => clearTimeout(t1);
  }, []);

  // Phase 2: Show quick tags after feeling selected
  useEffect(() => {
    if (feeling) {
      const t = setTimeout(() => setPhase(2), 400);
      return () => clearTimeout(t);
    }
  }, [feeling]);

  // Voice recording timer
  useEffect(() => {
    if (!recording) return;
    setRecTime(0);
    const iv = setInterval(() => setRecTime((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  // Auto-scroll on phase changes
  useEffect(() => {
    const scrollToBottom = () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    };
    // Small delay to let content render
    const t = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(t);
  }, [phase, submitted, coachReply]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  // Coach message based on feeling
  const coachMsg =
    feeling === "amazing" || feeling === "good"
      ? "That's what I like to see. You showed up, you executed, and you earned every meter. Keep stacking days like this and the race will take care of itself."
      : feeling === "tough" || feeling === "brutal"
        ? "Hey — the hard days are where the real work happens. The fact that you got out there and finished says more than any split time. I'm going to dial things back a touch for the next couple of sessions. Trust the process."
        : "You showed up. That's the hardest part and you did it. Not every run needs to feel great — some just need to get done. I'll take it from here.";

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleSkip = () => {
    setSubmitted(true);
  };

  const togglePill = (pill: string) => {
    setSelectedPills((prev) =>
      prev.includes(pill) ? prev.filter((x) => x !== pill) : [...prev, pill]
    );
  };

  const handleVoiceStart = () => {
    setRecording(true);
  };

  const handleVoiceCancel = () => {
    setRecording(false);
    setRecTime(0);
  };

  const handleVoiceDone = () => {
    setRecording(false);
    // Mock: Set sample transcribed text
    setNoteText("Legs felt heavier than usual on the last km. Might need more sleep.");
  };

  const handleCoachStreamComplete = () => {
    setTimeout(() => setCoachReply(true), 300);
  };

  const handleDone = () => {
    setCelebrating(true);
  };

  const handleCelebrationComplete = () => {
    onDone();
  };

  // Calculate stats
  const eM = Math.floor(elapsedTime / 60);
  const eS = elapsedTime % 60;
  const avgPace = distanceCovered > 0.05 ? elapsedTime / 60 / distanceCovered : 0;
  const pM = Math.floor(avgPace);
  const pS = Math.floor((avgPace - pM) * 60);

  const stats = [
    { label: "Time", value: `${eM}:${eS.toString().padStart(2, "0")}` },
    { label: "Distance", value: distanceCovered.toFixed(2), unit: "km" },
    {
      label: "Avg Pace",
      value: distanceCovered > 0.05 ? `${pM}:${pS.toString().padStart(2, "0")}` : "--",
      unit: "/km",
    },
  ];

  return (
    <View className="absolute inset-0 z-[500] bg-black">
      <Animated.View style={[{ flex: 1 }, containerStyle]}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {/* Dark hero header */}
          <DebriefHeader
            session={session}
            stats={stats}
            insetTop={insets.top}
          />

          {/* Light content area */}
          <View
            className="bg-w2 -mt-1"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              minHeight: 500,
            }}
          >
            <View className="px-4 py-6 pb-12">
              {/* Feeling question - Phase 1 */}
              {phase >= 1 && !submitted && (
                <FeelingSelector
                  selectedFeeling={feeling}
                  onSelectFeeling={setFeeling}
                />
              )}

              {/* Quick tags + Note input - Phase 2 */}
              {phase >= 2 && !submitted && (
                <Animated.View entering={FadeIn.duration(300)}>
                  {recording ? (
                    <VoiceRecorderMode
                      recTime={recTime}
                      onCancel={handleVoiceCancel}
                      onDone={handleVoiceDone}
                    />
                  ) : (
                    <>
                      <Text className="text-[16px] font-coach-semibold text-wText mb-[10px]">
                        Anything else to note?
                      </Text>

                      <QuickTagPills
                        selectedPills={selectedPills}
                        onTogglePill={togglePill}
                      />

                      <DebriefNoteInput
                        value={noteText}
                        onChangeText={setNoteText}
                        onMicPress={handleVoiceStart}
                      />

                      {/* Submit button */}
                      <Pressable
                        onPress={handleSubmit}
                        className="w-full py-[18px] px-6 rounded-2xl bg-wText mt-[14px] active:scale-[0.975]"
                        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        <Text className="text-[16px] font-coach-bold text-w1">
                          Save & Wrap Up
                        </Text>
                      </Pressable>

                      {/* Skip button */}
                      <Pressable
                        onPress={handleSkip}
                        className="w-full py-[14px] mt-[2px]"
                      >
                        <Text className="text-[14px] font-coach text-wMute text-center">
                          Skip — just save
                        </Text>
                      </Pressable>
                    </>
                  )}
                </Animated.View>
              )}

              {/* Coach response after submit */}
              {submitted && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <CoachResponseCard
                    message={coachMsg}
                    onStreamComplete={handleCoachStreamComplete}
                  />

                  {/* Session recorded summary */}
                  {coachReply && (
                    <DebriefSummary
                      feeling={feeling}
                      selectedPills={selectedPills}
                      hasNote={noteText.trim().length > 0}
                      onDone={handleDone}
                    />
                  )}
                </Animated.View>
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Celebration overlay */}
      {celebrating && (
        <CelebrationOverlay
          session={session}
          onComplete={handleCelebrationComplete}
        />
      )}
    </View>
  );
}
