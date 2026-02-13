import { CoachText } from "./coach-text";
import {
  SingleSelectInput,
  MultiSelectInput,
  PaceInput,
  DistanceInput,
  FreeTextInput,
  DatePickerInput,
} from "./question-inputs";
import {
  ONBOARDING_SECTIONS,
  getVisibleQuestions,
  type QuestionConfig,
  type SectionConfig,
} from "./question-data";
import { Text } from "@/components/ui/text";
import { arrivalPulse, insightTap, questionPause } from "@/lib/haptics";
import { useRef, useState, useEffect } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingResponses = Record<string, string | string[]>;

type SectionFlowProps = {
  onComplete: (responses: OnboardingResponses) => void;
};

type FlowPhase =
  | { type: "section-intro"; sectionIndex: number }
  | { type: "question"; sectionIndex: number; questionIndex: number }
  | { type: "section-reaction"; sectionIndex: number };

// ─── Main Component ──────────────────────────────────────────────────────────

export function SectionFlow({ onComplete }: SectionFlowProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [responses, setResponses] = useState<OnboardingResponses>({});
  const [multiSelectBuffer, setMultiSelectBuffer] = useState<string[]>([]);
  const [phase, setPhase] = useState<FlowPhase>({
    type: "section-intro",
    sectionIndex: 0,
  });

  // Scroll to top when phase changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [
    phase.type,
    phase.sectionIndex,
    phase.type === "question" ? (phase as any).questionIndex : 0,
  ]);

  // ─── Navigation Helpers ──────────────────────────────────────────────

  const currentSection = ONBOARDING_SECTIONS[phase.sectionIndex];
  const visibleQuestions = getVisibleQuestions(currentSection, responses);

  const currentQuestion =
    phase.type === "question" ? visibleQuestions[phase.questionIndex] : null;

  const fireHaptic = (type?: "arrival" | "insight" | "question") => {
    if (type === "arrival") arrivalPulse();
    if (type === "insight") insightTap();
    if (type === "question") questionPause();
  };

  const advanceToNextQuestion = (
    sectionIdx: number,
    currentQIdx: number,
    updatedResponses: OnboardingResponses,
  ) => {
    // Recompute visible questions with updated responses
    const section = ONBOARDING_SECTIONS[sectionIdx];
    const nextVisible = getVisibleQuestions(section, updatedResponses);

    // Find the next question index after current
    const currentQId = visibleQuestions[currentQIdx]?.id;
    const currentIdxInNew = nextVisible.findIndex((q) => q.id === currentQId);
    const nextIdx = currentIdxInNew + 1;

    if (nextIdx < nextVisible.length) {
      setPhase({
        type: "question",
        sectionIndex: sectionIdx,
        questionIndex: nextIdx,
      });
    } else {
      // Section complete -> show reaction
      setPhase({ type: "section-reaction", sectionIndex: sectionIdx });
    }
  };

  const advanceToNextSection = () => {
    const nextSectionIdx = phase.sectionIndex + 1;
    if (nextSectionIdx < ONBOARDING_SECTIONS.length) {
      setPhase({ type: "section-intro", sectionIndex: nextSectionIdx });
    } else {
      // All sections done
      onComplete(responses);
    }
  };

  const handleBack = () => {
    if (phase.type === "question" && phase.questionIndex > 0) {
      // Go to previous question in this section
      setPhase({
        type: "question",
        sectionIndex: phase.sectionIndex,
        questionIndex: phase.questionIndex - 1,
      });
    } else if (phase.type === "question" && phase.questionIndex === 0) {
      // Go back to section intro
      setPhase({
        type: "section-intro",
        sectionIndex: phase.sectionIndex,
      });
    } else if (phase.type === "section-intro" && phase.sectionIndex > 0) {
      // Go back to previous section's reaction
      setPhase({
        type: "section-reaction",
        sectionIndex: phase.sectionIndex - 1,
      });
    } else if (phase.type === "section-reaction") {
      // Go back to last question of this section
      const lastQIdx = visibleQuestions.length - 1;
      setPhase({
        type: "question",
        sectionIndex: phase.sectionIndex,
        questionIndex: Math.max(0, lastQIdx),
      });
    }
  };

  // ─── Answer Handlers ─────────────────────────────────────────────────

  const handleSingleSelect = (value: string) => {
    if (phase.type !== "question" || !currentQuestion) return;

    const updated = { ...responses, [currentQuestion.id]: value };
    setResponses(updated);

    // Auto-advance after highlight delay
    setTimeout(() => {
      advanceToNextQuestion(phase.sectionIndex, phase.questionIndex, updated);
    }, 400);
  };

  const handleMultiSelectToggle = (value: string) => {
    setMultiSelectBuffer((prev) => {
      if (value === "none") return ["none"];
      const without = prev.filter((v) => v !== "none");
      if (without.includes(value)) {
        return without.filter((v) => v !== value);
      }
      return [...without, value];
    });
  };

  const handleMultiSelectConfirm = () => {
    if (phase.type !== "question" || !currentQuestion) return;

    const updated = { ...responses, [currentQuestion.id]: multiSelectBuffer };
    setResponses(updated);
    setMultiSelectBuffer([]);

    setTimeout(() => {
      advanceToNextQuestion(phase.sectionIndex, phase.questionIndex, updated);
    }, 300);
  };

  const handleTextSubmit = (value: string) => {
    if (phase.type !== "question" || !currentQuestion) return;

    const updated = { ...responses, [currentQuestion.id]: value };
    setResponses(updated);

    setTimeout(() => {
      advanceToNextQuestion(phase.sectionIndex, phase.questionIndex, updated);
    }, 300);
  };

  // ─── Progress Calculation ────────────────────────────────────────────

  const calculateProgress = (): number => {
    let answeredTotal = 0;
    let totalQuestions = 0;

    for (let i = 0; i < ONBOARDING_SECTIONS.length; i++) {
      const section = ONBOARDING_SECTIONS[i];
      const visible = getVisibleQuestions(section, responses);
      totalQuestions += visible.length;

      if (i < phase.sectionIndex) {
        // Past sections: all answered
        answeredTotal += visible.length;
      } else if (i === phase.sectionIndex) {
        // Current section: count answered questions
        if (phase.type === "section-reaction") {
          answeredTotal += visible.length;
        } else if (phase.type === "question") {
          answeredTotal += phase.questionIndex;
        }
      }
    }

    return totalQuestions > 0 ? answeredTotal / totalQuestions : 0;
  };

  // ─── Render Question Input ───────────────────────────────────────────

  const renderQuestionInput = (question: QuestionConfig) => {
    switch (question.inputType) {
      case "single-select":
        return (
          <SingleSelectInput
            options={question.options || []}
            selectedValue={responses[question.id] as string | undefined}
            onSelect={handleSingleSelect}
          />
        );

      case "multi-select":
        return (
          <MultiSelectInput
            options={question.options || []}
            selectedValues={multiSelectBuffer}
            onToggle={handleMultiSelectToggle}
            onConfirm={handleMultiSelectConfirm}
          />
        );

      case "pace-input":
        return (
          <PaceInput
            onSubmit={handleTextSubmit}
            allowSkip={question.allowSkip}
            skipLabel={question.skipLabel}
          />
        );

      case "distance-input":
        return (
          <DistanceInput
            onSubmit={handleTextSubmit}
            placeholder={question.placeholder}
          />
        );

      case "text-input":
        return (
          <FreeTextInput
            onSubmit={handleTextSubmit}
            placeholder={question.placeholder}
          />
        );

      case "date-picker":
        return <DatePickerInput onSubmit={handleTextSubmit} />;

      default:
        return null;
    }
  };

  // ─── Render Phases ───────────────────────────────────────────────────

  const renderContent = () => {
    if (phase.type === "section-intro") {
      return (
        <SectionIntro
          section={currentSection}
          onComplete={() => {
            fireHaptic(currentSection.haptic);
            setPhase({
              type: "question",
              sectionIndex: phase.sectionIndex,
              questionIndex: 0,
            });
          }}
        />
      );
    }

    if (phase.type === "question" && currentQuestion) {
      return (
        <StepContent key={`${currentSection.id}-${currentQuestion.id}`}>
          <View className="gap-8">
            <Text className="text-2xl text-white font-light tracking-wide leading-8">
              {currentQuestion.prompt}
            </Text>
            {renderQuestionInput(currentQuestion)}
          </View>
        </StepContent>
      );
    }

    if (phase.type === "section-reaction") {
      const reaction = currentSection.getReaction(responses);
      return (
        <View className="gap-5">
          <CoachText
            lines={[{ text: reaction, haptic: "insight" }]}
            onComplete={() => {
              setTimeout(advanceToNextSection, 800);
            }}
          />
        </View>
      );
    }

    return null;
  };

  // ─── Render ──────────────────────────────────────────────────────────

  const canGoBack = phase.type !== "section-intro" || phase.sectionIndex > 0;

  return (
    <View className="flex-1 pt-safe">
      {/* Header: progress bar + back button */}
      <View className="px-6 pt-4">
        <ProgressBar progress={calculateProgress()} />

        {canGoBack ? (
          <Pressable
            onPress={handleBack}
            className="py-3 self-start -ml-1"
            hitSlop={8}
          >
            <Text className="text-white/50 text-sm font-medium">
              {"\u2190"} Back
            </Text>
          </Pressable>
        ) : (
          <View className="h-10" />
        )}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pt-4">{renderContent()}</View>
      </ScrollView>
    </View>
  );
}

// ─── Section Intro ────────────────────────────────────────────────────────────

function SectionIntro({
  section,
  onComplete,
}: {
  section: SectionConfig;
  onComplete: () => void;
}) {
  return (
    <View className="gap-5">
      <CoachText
        lines={[
          {
            text: section.intro || "",
            haptic: section.haptic,
          },
        ]}
        onComplete={onComplete}
      />
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View className="h-1 bg-white/10 rounded-full overflow-hidden">
      <Animated.View
        className="h-full bg-primary rounded-full"
        style={{
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}

// ─── Step Content Wrapper (fade + slide) ──────────────────────────────────────

function StepContent({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}
      className="flex-1 pt-4"
    >
      {children}
    </Animated.View>
  );
}
