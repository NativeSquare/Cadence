import { useCallback, useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { ChevronDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, CARD_SHADOW } from "@/lib/design-tokens";

import { FeelingSelector, FEELING_OPTIONS, type FeelingValue } from "./FeelingSelector";
import { QuickTagPills } from "./QuickTagPills";
import { DebriefNoteInput } from "./DebriefNoteInput";

export interface SessionDebriefCardProps {
  sessionId: Id<"plannedSessions">;
  userRating?: number;
  userFeedback?: string;
  debriefTags?: string[];
}

const FEELING_TO_RATING: Record<FeelingValue, number> = {
  brutal: 1,
  tough: 2,
  okay: 3,
  good: 4,
  amazing: 5,
};

const RATING_TO_FEELING: Record<number, FeelingValue> = {
  1: "brutal",
  2: "tough",
  3: "okay",
  4: "good",
  5: "amazing",
};

export function SessionDebriefCard({
  sessionId,
  userRating,
  userFeedback,
  debriefTags,
}: SessionDebriefCardProps) {
  const submitDebrief = useMutation(api.training.mutations.submitSessionDebrief);

  const hasDebrief = userRating !== undefined;
  const [expanded, setExpanded] = useState(false);
  const [feeling, setFeeling] = useState<FeelingValue | null>(null);
  const [selectedPills, setSelectedPills] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");
  const [phase, setPhase] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Phase 2: Show quick tags after feeling selected
  useEffect(() => {
    if (feeling && phase < 2) {
      const t = setTimeout(() => setPhase(2), 400);
      return () => clearTimeout(t);
    }
  }, [feeling, phase]);

  const togglePill = useCallback((pill: string) => {
    setSelectedPills((prev) =>
      prev.includes(pill) ? prev.filter((x) => x !== pill) : [...prev, pill],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!feeling || submitting) return;
    setSubmitting(true);
    try {
      const tags = selectedPills.length > 0 ? selectedPills : undefined;
      const feedback = noteText.trim() || undefined;
      await submitDebrief({
        sessionId,
        userRating: FEELING_TO_RATING[feeling],
        userFeedback: feedback,
        debriefTags: tags,
      });
      // Convex reactive query will update the props, transitioning to summary state
    } catch {
      setSubmitting(false);
    }
  }, [feeling, submitting, selectedPills, noteText, submitDebrief, sessionId]);

  const handleSkip = useCallback(async () => {
    if (!feeling || submitting) return;
    setSubmitting(true);
    try {
      await submitDebrief({
        sessionId,
        userRating: FEELING_TO_RATING[feeling],
      });
    } catch {
      setSubmitting(false);
    }
  }, [feeling, submitting, submitDebrief, sessionId]);

  // --- Summary state (already debriefed) ---
  if (hasDebrief) {
    const feelingValue = RATING_TO_FEELING[userRating];
    const feelingOption = feelingValue
      ? FEELING_OPTIONS.find((o) => o.value === feelingValue)
      : undefined;

    return (
      <View className="mb-4">
        <Text
          className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
          style={{ letterSpacing: 0.55 }}
        >
          Debrief
        </Text>
        <View className="rounded-2xl bg-w1 p-4" style={CARD_SHADOW}>
          {/* Feeling */}
          {feelingOption && (
            <View className="flex-row items-center gap-2.5 mb-2">
              <Text style={{ fontSize: 20 }}>{feelingOption.emoji}</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Outfit-SemiBold",
                  color: LIGHT_THEME.wText,
                }}
              >
                {feelingOption.label}
              </Text>
              <Text
                style={{ fontSize: 13, color: LIGHT_THEME.wMute }}
              >
                {feelingOption.desc}
              </Text>
            </View>
          )}

          {/* Tags */}
          {debriefTags && debriefTags.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5 mb-2">
              {debriefTags.map((tag) => (
                <View
                  key={tag}
                  className="py-1 px-2.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(200,255,0,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(200,255,0,0.25)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Outfit-Regular",
                      color: LIGHT_THEME.wSub,
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Feedback text */}
          {userFeedback && (
            <Text
              style={{
                fontSize: 14,
                color: LIGHT_THEME.wSub,
                lineHeight: 20,
                fontStyle: "italic",
              }}
            >
              "{userFeedback}"
            </Text>
          )}
        </View>
      </View>
    );
  }

  // --- Collapsed state (not debriefed, not expanded) ---
  if (!expanded) {
    return (
      <View className="mb-4">
        <Text
          className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
          style={{ letterSpacing: 0.55 }}
        >
          Debrief
        </Text>
        <Pressable
          onPress={() => {
            setExpanded(true);
            setPhase(1);
          }}
          className="rounded-2xl bg-w1 p-4 flex-row items-center"
          style={{
            ...CARD_SHADOW,
            borderLeftWidth: 3,
            borderLeftColor: "rgba(200,255,0,0.5)",
          }}
        >
          <View className="flex-1">
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Outfit-SemiBold",
                color: LIGHT_THEME.wText,
              }}
            >
              How did it go?
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: LIGHT_THEME.wMute,
                marginTop: 2,
              }}
            >
              Tap to log how this session felt
            </Text>
          </View>
          <ChevronDown size={18} color={LIGHT_THEME.wMute} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }

  // --- Expanded state (debrief form) ---
  return (
    <Animated.View entering={FadeIn.duration(250)} className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Debrief
      </Text>
      <View className="rounded-2xl bg-w1 p-4" style={CARD_SHADOW}>
        {/* Feeling selector */}
        {phase >= 1 && (
          <FeelingSelector
            selectedFeeling={feeling}
            onSelectFeeling={setFeeling}
          />
        )}

        {/* Quick tags + note input */}
        {phase >= 2 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text className="text-[16px] font-coach-semibold text-wText mb-2.5">
              Anything else to note?
            </Text>

            <QuickTagPills
              selectedPills={selectedPills}
              onTogglePill={togglePill}
            />

            <DebriefNoteInput
              value={noteText}
              onChangeText={setNoteText}
              onMicPress={() => {}}
            />

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-wText mt-3.5 active:scale-[0.975]"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text className="text-[16px] font-coach-bold text-w1">
                {submitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>

            {/* Skip button */}
            <Pressable onPress={handleSkip} className="w-full py-3.5 mt-0.5">
              <Text className="text-[14px] font-coach text-wMute text-center">
                Skip — just save feeling
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
