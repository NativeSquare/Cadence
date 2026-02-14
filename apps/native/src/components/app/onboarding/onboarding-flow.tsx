import { WelcomeScreen } from "./welcome-screen";
import { SectionFlow, OnboardingResponses } from "./section-flow";
import { ConnectionCard } from "./connection-card";
import { CoachText, CoachLine } from "./coach-text";
import { StreamingText } from "./streaming-text";
import { ThinkingBlock } from "./thinking-block";
import { ProgressBar } from "./ProgressBar";
import { Text } from "@/components/ui/text";
import { selectionFeedback } from "@/lib/haptics";
import { useStravaAuth } from "@/hooks/use-strava-auth";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { useOnboardingResume } from "@/hooks/use-onboarding-resume";
import { StreamPhrase } from "@/hooks/use-streaming-text";
import { useRef, useState, useEffect } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import Reanimated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

// ─── Types ───────────────────────────────────────────────────────────────────

type Scene =
  | "welcome-intro"
  | "welcome-got-it"
  | "welcome-transition"
  | "questions"
  | "wearable"
  | "thinking-stream"
  | "coaching-response"
  | "honest-limits"
  | "synthesis"
  | "handoff";

type OnboardingFlowProps = {
  userName: string;
  onComplete: () => void;
};

// ─── Mock Data Generators ────────────────────────────────────────────────────

function getThinkingStreamLines(
  responses: OnboardingResponses,
  hasWearable: boolean,
): string[] {
  const runnerType = responses.runner_type as string;
  const goalType = responses.goal_type as string;
  const coachingVoice = responses.coaching_voice as string;
  const biggestChallenge = responses.biggest_challenge as string;
  const sleep = responses.sleep as string;
  const stress = responses.stress as string;
  const recoveryStyle = responses.recovery_style as string;
  const injuries = responses.past_injuries;
  const dataOrientation = responses.data_orientation as string;

  const lines: string[] = [];

  // Runner profile summary
  lines.push(`Runner profile: ${runnerType}, goal: ${goalType}`);

  if (hasWearable) {
    lines.push("Loading training history from wearable...");
    lines.push("Weekly volume: analyzing recent patterns...");
    lines.push("Long run pattern: checking consistency...");
    lines.push("Easy run pace: cross-referencing with aerobic threshold...");
  } else {
    lines.push(
      "No wearable connected \u2014 working from conversation data only.",
    );
    lines.push(
      "Note: with wearable data I could analyze pace trends, HR drift, and recovery patterns.",
    );
  }

  // Goal analysis
  if (goalType === "race") {
    const dist = responses.race_distance as string;
    const targetTime = responses.race_target_time as string;
    lines.push(`Race goal: ${dist || "unspecified"}`);
    if (targetTime === "yes") {
      lines.push(
        `Target time: ${responses.race_target_time_value || "specified"}`,
      );
    } else if (targetTime === "just_finish") {
      lines.push("Target: finish strong, no time pressure.");
    }
  } else if (goalType === "faster") {
    lines.push("Goal: getting faster. Analyzing current limiters...");
  } else if (goalType === "base_building") {
    lines.push("Goal: base building. Progressive volume plan needed.");
  } else if (goalType === "back_in_shape") {
    lines.push("Goal: getting back in shape. Gradual ramp-up required.");
  } else {
    lines.push("Goal: general fitness. Sustainable, enjoyable plan focus.");
  }

  // Injury & risk cross-reference
  const hasInjuries =
    Array.isArray(injuries) &&
    !injuries.includes("none") &&
    injuries.length > 0;
  if (hasInjuries) {
    lines.push(`\u26A0 Past injuries: ${(injuries as string[]).join(", ")}`);
    if (recoveryStyle === "push_through") {
      lines.push(
        '\u26A0 Recovery style: "pushes through" \u2014 flagged for proactive monitoring.',
      );
      lines.push(
        "\u2192 Volume ramps capped conservatively. Early warning signals prioritized.",
      );
    }
  } else {
    lines.push("No significant injury history. Clean build path.");
  }

  // Sleep & stress
  if (sleep === "bad" || stress === "survival" || stress === "high") {
    lines.push(`\u26A0 Sleep: ${sleep}. Stress: ${stress}.`);
    lines.push(
      "\u2192 Recovery capacity reduced. Plan must account for external load.",
    );
  } else if (sleep === "inconsistent") {
    lines.push("\u26A0 Sleep: inconsistent. Rest day enforcement important.");
  }

  // Biggest challenge
  if (biggestChallenge === "pacing") {
    lines.push(
      '\u26A0 Noted: pacing is biggest challenge \u2014 "I don\'t know how to go easy"',
    );
    if (hasWearable) {
      lines.push(
        "\u2192 Will cross-reference easy pace data with aerobic threshold.",
      );
    }
  } else if (biggestChallenge === "consistency") {
    lines.push(
      "\u26A0 Consistency is the primary challenge. Plan must minimize friction.",
    );
  }

  // Coaching calibration
  lines.push(`Coaching preference: ${coachingVoice}.`);
  lines.push(`Data orientation: ${dataOrientation}.`);
  if (coachingVoice === "analytical") {
    lines.push(
      "\u2192 Full reasoning in all sessions. Extended thinking blocks.",
    );
  } else if (coachingVoice === "minimalist") {
    lines.push(
      "\u2192 Concise session descriptions. Reasoning on demand only.",
    );
  }

  // Schedule
  const availDays = responses.available_days as string;
  const preferredTime = responses.preferred_time as string;
  lines.push(
    `Schedule: ${availDays} days available. Prefers ${preferredTime}.`,
  );

  // Final assessment
  lines.push("Assembling personalized plan parameters...");

  return lines;
}

function getSynthesisThinkingLines(responses: OnboardingResponses): string[] {
  const goalType = responses.goal_type as string;
  const recoveryStyle = responses.recovery_style as string;
  const sleep = responses.sleep as string;
  const coachingVoice = responses.coaching_voice as string;

  const lines = [`Building plan framework for: ${goalType}`];

  if (goalType === "race") {
    lines.push(
      "Phase structure: base \u2192 build \u2192 race-specific \u2192 taper",
    );
  } else if (goalType === "faster") {
    lines.push(
      "Phase structure: aerobic base \u2192 threshold \u2192 speed development",
    );
  } else {
    lines.push("Phase structure: gradual build with consistency focus");
  }

  if (recoveryStyle === "push_through") {
    lines.push("Volume ramp: conservative, max 8-10% (push-through tendency)");
  } else {
    lines.push("Volume ramp: standard progressive overload");
  }

  if (sleep === "bad" || sleep === "inconsistent") {
    lines.push(
      "Rest: minimum 1 full rest day/week (non-negotiable given sleep pattern)",
    );
  }

  lines.push(`Coaching mode: ${coachingVoice} (per preference)`);
  lines.push("Key changes identified and prioritized.");

  return lines;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function OnboardingFlow({ userName, onComplete }: OnboardingFlowProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [displayName, setDisplayName] = useState(userName || "there");

  // Scene state
  const [scene, setScene] = useState<Scene>("welcome-intro");
  const [scenePhase, setScenePhase] = useState(0);

  // Data state
  const [connectedProvider, setConnectedProvider] = useState<string | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);

  // Responses from section flow
  const [onboardingResponses, setOnboardingResponses] =
    useState<OnboardingResponses>({});

  // Progress tracking (Story 1.6)
  const { completeness } = useOnboardingProgress();

  // Resume detection (Story 1.6)
  // Only check resume on initial mount, not after user interactions
  const { isResuming, targetScene, isLoading: isResumeLoading } = useOnboardingResume();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const hasCheckedResume = useRef(false);

  // Handle resume ONLY on initial mount
  useEffect(() => {
    // Only run once when loading completes for the first time
    if (!isResumeLoading && !hasCheckedResume.current) {
      hasCheckedResume.current = true;

      if (isResuming && targetScene !== "welcome-intro") {
        setShowWelcomeBack(true);
        setScene(targetScene);

        // Auto-dismiss welcome back message after 2 seconds
        const timer = setTimeout(() => {
          setShowWelcomeBack(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [isResumeLoading]); // Only depend on loading state, not on isResuming/targetScene

  // Determine if progress bar should be visible
  // Hidden during welcome scenes, visible after name confirmation
  const showProgressBar =
    scene === "questions" ||
    scene === "wearable" ||
    scene === "thinking-stream" ||
    scene === "coaching-response" ||
    scene === "honest-limits" ||
    scene === "synthesis" ||
    scene === "handoff";

  // Auto-scroll on content change (for analysis scenes)
  useEffect(() => {
    if (
      scene !== "welcome-intro" &&
      scene !== "welcome-transition" &&
      scene !== "questions" &&
      scene !== "wearable"
    ) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scene, scenePhase]);

  // ─── Scene Transition Helpers ────────────────────────────────────────

  const goToScene = (nextScene: Scene, phase = 0) => {
    setScenePhase(phase);
    setScene(nextScene);
  };

  // ─── Welcome Handlers ───────────────────────────────────────────────

  const handleWelcomeIntroContinue = () => {
    goToScene("welcome-transition");
  };

  const handleNameChanged = (newName: string) => {
    setDisplayName(newName);
    goToScene("welcome-got-it");
  };

  const handleGotItContinue = () => {
    goToScene("welcome-transition");
  };

  const handleWelcomeTransitionContinue = () => {
    goToScene("questions");
  };

  // ─── Questions Complete Handler ─────────────────────────────────────

  const handleQuestionsComplete = (responses: OnboardingResponses) => {
    setOnboardingResponses(responses);
    goToScene("wearable");
  };

  // ─── Wearable Handlers ──────────────────────────────────────────────

  const { connect: connectStrava } = useStravaAuth();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  );
  const [connectedAthleteName, setConnectedAthleteName] = useState<
    string | null
  >(null);

  const handleConnect = async (providerId: string) => {
    if (providerId === "strava") {
      setIsConnecting(true);
      setConnectingProvider("strava");

      try {
        const result = await connectStrava();

        if (result) {
          const name =
            [result.athleteFirstName, result.athleteLastName]
              .filter(Boolean)
              .join(" ") || null;
          setConnectedAthleteName(name);
          setConnectedProvider("strava");
        }
      } finally {
        setIsConnecting(false);
        setConnectingProvider(null);
      }
    } else {
      // Other providers remain mocked for now
      setIsConnecting(true);
      setConnectingProvider(providerId);
      setTimeout(() => {
        setConnectedProvider(providerId);
        setIsConnecting(false);
        setConnectingProvider(null);
      }, 2000);
    }
  };

  const handleSkipConnect = () => {
    selectionFeedback();
    goToScene("thinking-stream");
  };

  // Auto-advance after wearable connection
  useEffect(() => {
    if (scene === "wearable" && connectedProvider && !isConnecting) {
      const timer = setTimeout(() => {
        goToScene("thinking-stream");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connectedProvider, isConnecting, scene]);

  // ─── Scene: Thinking Stream ─────────────────────────────────────────

  const renderThinkingStream = () => {
    const lines = getThinkingStreamLines(
      onboardingResponses,
      !!connectedProvider,
    );

    return (
      <View className="gap-5">
        <CoachText
          lines={[
            {
              text: connectedProvider
                ? "Got your data. Let me take a look."
                : "Let me work with what you\u2019ve told me.",
              haptic: "insight",
            },
          ]}
          onComplete={() => setScenePhase(1)}
        />
        {scenePhase >= 1 && (
          <>
            <ThinkingBlock
              lines={lines}
              lineDelay={180}
              charDelay={6}
              onComplete={() => {
                setScenePhase(2);
              }}
            />
            {scenePhase >= 2 && (
              <CoachText
                lines={[
                  {
                    text: "You\u2019ll always see this \u2014 how I got to what I got to.",
                    haptic: "insight",
                  },
                ]}
                onComplete={() => {
                  setTimeout(() => goToScene("coaching-response"), 300);
                }}
              />
            )}
          </>
        )}
      </View>
    );
  };

  // ─── Scene: Coaching Response ───────────────────────────────────────

  const renderCoachingResponse = () => {
    const runnerType = onboardingResponses.runner_type as string;
    const biggestChallenge = onboardingResponses.biggest_challenge as string;
    const sleep = onboardingResponses.sleep as string;
    const stress = onboardingResponses.stress as string;
    const recoveryStyle = onboardingResponses.recovery_style as string;
    const injuries = onboardingResponses.past_injuries;
    const coachingVoice = onboardingResponses.coaching_voice as string;

    const hasInjuries =
      Array.isArray(injuries) &&
      !injuries.includes("none") &&
      injuries.length > 0;

    const phrases: StreamPhrase[] = [
      {
        text: `Okay ${displayName}, here\u2019s what I see.`,
        haptic: "arrival",
        pauseAfter: 500,
      },
    ];

    // Personalized based on runner profile
    if (runnerType === "serious" || runnerType === "casual") {
      phrases.push({
        text: "The good news \u2014 you\u2019ve got a real base. You show up consistently, and that\u2019s the hardest part. You\u2019re not starting from scratch.",
        pauseAfter: 600,
      });
    } else if (runnerType === "returning") {
      phrases.push({
        text: "The good news \u2014 you\u2019ve done this before. The fitness memory is still there, and it comes back faster than you think.",
        pauseAfter: 600,
      });
    } else {
      phrases.push({
        text: "You\u2019re early in this, and that\u2019s actually an advantage. No bad habits to undo. We build it right from the start.",
        pauseAfter: 600,
      });
    }

    // Pacing insight (if applicable)
    if (biggestChallenge === "pacing") {
      phrases.push({
        text: "The thing that jumped out at me is pacing. You told me it\u2019s your biggest challenge \u2014 and that self-awareness alone puts you ahead. I\u2019ll help you hold the line on easy days.",
        haptic: "insight",
        pauseAfter: 600,
      });
    }

    // Sleep/stress (if concerning)
    if (
      sleep === "bad" ||
      sleep === "inconsistent" ||
      stress === "high" ||
      stress === "survival"
    ) {
      phrases.push({
        text: `Your sleep is ${sleep === "bad" ? "rough" : "inconsistent"} and stress is ${stress === "survival" ? "in survival mode" : "high"}. That directly affects recovery. The plan has to account for what\u2019s happening off the road, not just on it.`,
        pauseAfter: 500,
      });
    }

    // Injury insight (if applicable)
    if (hasInjuries && recoveryStyle === "push_through") {
      phrases.push({
        text: "And the injury history combined with your tendency to push through \u2014 that\u2019s a pattern I\u2019ll actively watch for. We\u2019ll build conservatively and I\u2019ll flag the early signs before you have to.",
        pauseAfter: 600,
      });
    } else if (hasInjuries) {
      phrases.push({
        text: "I\u2019m noting the injury history. We\u2019ll build in a way that respects what your body\u2019s been through.",
        pauseAfter: 500,
      });
    }

    // Coaching style acknowledgment
    if (coachingVoice === "analytical") {
      phrases.push({
        text: "You want the full breakdown \u2014 numbers, reasoning, all of it. You\u2019ll get that with every session.",
        pauseAfter: 300,
      });
    } else if (coachingVoice === "tough_love") {
      phrases.push({
        text: "And since you want it straight \u2014 I won\u2019t sugarcoat anything going forward.",
        pauseAfter: 300,
      });
    }

    return (
      <View className="gap-5">
        <StreamingText
          phrases={phrases}
          charDelay={10}
          onComplete={() => {
            setTimeout(() => goToScene("honest-limits"), 300);
          }}
        />
      </View>
    );
  };

  // ─── Scene: Honest Limits ───────────────────────────────────────────

  const renderHonestLimits = () => {
    const hasWearable = !!connectedProvider;

    const lines: (string | CoachLine)[] = hasWearable
      ? [
          "Quick note \u2014 there were some gaps in your data where I was estimating. I flagged those spots in the thinking.",
          {
            text: "When I\u2019m sure, you\u2019ll know. When I\u2019m not, you\u2019ll know that too.",
            haptic: "insight",
          },
        ]
      : [
          "Quick note \u2014 without wearable data I\u2019m working from what you\u2019ve told me. The plan will be good, but it gets sharper once I can see your actual training data.",
          {
            text: "When I\u2019m sure, you\u2019ll know. When I\u2019m not, you\u2019ll know that too.",
            haptic: "insight",
          },
        ];

    return (
      <View className="gap-5">
        <CoachText
          lines={lines}
          onComplete={() => {
            setTimeout(() => goToScene("synthesis"), 300);
          }}
        />
      </View>
    );
  };

  // ─── Scene: Synthesis ───────────────────────────────────────────────

  const renderSynthesis = () => {
    const synthesisLines = getSynthesisThinkingLines(onboardingResponses);

    const coachingPhrases: StreamPhrase[] = [
      {
        text: `Alright ${displayName}. Here\u2019s what I think we should do.`,
        haptic: "arrival",
        pauseAfter: 500,
      },
    ];

    const goalType = onboardingResponses.goal_type as string;
    const sleep = onboardingResponses.sleep as string;
    const recoveryStyle = onboardingResponses.recovery_style as string;

    // Personalized plan points
    if (goalType === "race") {
      coachingPhrases.push({
        text: "I\u2019m building a phased plan toward your race. Base first, then race-specific work, then a proper taper. Each phase has a purpose.",
        pauseAfter: 500,
      });
    } else if (goalType === "faster") {
      coachingPhrases.push({
        text: "Getting faster starts with a stronger aerobic base. We\u2019ll layer in speed work once the foundation is solid.",
        pauseAfter: 500,
      });
    } else {
      coachingPhrases.push({
        text: "We\u2019re building gradually. The goal is sustainable progress \u2014 the kind that compounds over weeks and months.",
        pauseAfter: 500,
      });
    }

    // Recovery changes
    if (
      sleep === "bad" ||
      sleep === "inconsistent" ||
      recoveryStyle === "push_through"
    ) {
      coachingPhrases.push({
        text: "One real rest day every week. Not a shakeout. Nothing. Your recovery needs protecting.",
        haptic: "insight",
        pauseAfter: 350,
      });
    }

    coachingPhrases.push({
      text: "That\u2019s the big picture. Let me worry about the day-to-day.",
      pauseAfter: 300,
    });

    return (
      <View className="gap-5">
        <ThinkingBlock
          lines={synthesisLines}
          lineDelay={250}
          charDelay={8}
          onComplete={() => setScenePhase(1)}
        />
        {scenePhase >= 1 && (
          <StreamingText
            phrases={coachingPhrases}
            charDelay={10}
            onComplete={() => {
              setTimeout(() => goToScene("handoff"), 300);
            }}
          />
        )}
      </View>
    );
  };

  // ─── Scene: Handoff ─────────────────────────────────────────────────

  const renderHandoff = () => {
    const lines: (string | CoachLine)[] = [
      "I\u2019ll have your session ready in the morning. Full reasoning, as always \u2014 you\u2019ll see why I picked it and how it fits.",
      "And remember \u2014 if something doesn\u2019t feel right, just tell me. That\u2019s how we get better at this.",
      { text: "We good?", haptic: "question", pauseAfter: 150 },
    ];

    return (
      <View className="gap-6">
        <CoachText lines={lines} onComplete={() => setScenePhase(1)} />
        {scenePhase >= 1 && <LetsRunButton onPress={onComplete} />}
      </View>
    );
  };

  // ─── Scene Router ───────────────────────────────────────────────────

  const renderAnalysisScene = () => {
    switch (scene) {
      case "thinking-stream":
        return renderThinkingStream();
      case "coaching-response":
        return renderCoachingResponse();
      case "honest-limits":
        return renderHonestLimits();
      case "synthesis":
        return renderSynthesis();
      case "handoff":
        return renderHandoff();
      default:
        return null;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  // Welcome intro scene
  if (scene === "welcome-intro") {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        <WelcomeScreen
          key="intro"
          userName={displayName}
          part="intro"
          onContinue={handleWelcomeIntroContinue}
          onNameChanged={handleNameChanged}
        />
      </View>
    );
  }

  // "Got it" intermediary scene after name change
  if (scene === "welcome-got-it") {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        <WelcomeScreen
          key="got-it"
          userName={displayName}
          part="got-it"
          onContinue={handleGotItContinue}
        />
      </View>
    );
  }

  // Welcome transition scene
  if (scene === "welcome-transition") {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        <WelcomeScreen
          key="transition"
          userName={displayName}
          part="transition"
          onContinue={handleWelcomeTransitionContinue}
        />
      </View>
    );
  }

  // Questions scene — delegates to SectionFlow
  if (scene === "questions") {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        {showProgressBar && (
          <Reanimated.View
            entering={FadeIn.duration(400)}
            className="absolute top-0 left-0 right-0 z-10 px-6 pt-safe"
          >
            <View className="pt-4">
              <ProgressBar value={completeness} />
            </View>
          </Reanimated.View>
        )}
        <SectionFlow onComplete={handleQuestionsComplete} />
        <WelcomeBackToast visible={showWelcomeBack} />
      </View>
    );
  }

  // Wearable connection scene — Scene 8
  if (scene === "wearable") {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        {showProgressBar && (
          <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-safe">
            <View className="pt-4">
              <ProgressBar value={completeness} />
            </View>
          </View>
        )}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          contentContainerClassName="px-6 pt-safe pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center gap-6 pt-20">
            <CoachText
              lines={[
                {
                  text: "I can already work with what you\u2019ve told me.",
                  haptic: "insight",
                  pauseAfter: 400,
                },
                {
                  text: "But I get sharper with more data. If you\u2019ve got a watch, let me see what your body\u2019s been up to.",
                  haptic: "question",
                },
              ]}
              onComplete={() => setScenePhase(1)}
            />
            {scenePhase >= 1 && (
              <ConnectionCard
                onConnect={handleConnect}
                onSkip={handleSkipConnect}
                isConnecting={isConnecting}
                connectingProvider={connectingProvider}
                connectedProvider={connectedProvider}
                connectedAthleteName={connectedAthleteName}
              />
            )}
          </View>
        </ScrollView>
        <WelcomeBackToast visible={showWelcomeBack} />
      </View>
    );
  }

  // Analysis scenes — bottom-aligned scroll layout
  return (
    <View className="flex-1 bg-[#0a0a0a]">
      {showProgressBar && (
        <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-safe">
          <View className="pt-4">
            <ProgressBar value={completeness} />
          </View>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 pt-safe pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-end min-h-full pt-20">
          {renderAnalysisScene()}
        </View>
      </ScrollView>
      <WelcomeBackToast visible={showWelcomeBack} />
    </View>
  );
}

// ─── Let's Run Button ────────────────────────────────────────────────────────

function LetsRunButton({ onPress }: { onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
    >
      <Pressable
        onPress={() => {
          selectionFeedback();
          onPress();
        }}
        className="bg-primary rounded-2xl py-4 items-center active:bg-primary/90"
      >
        <Text className="text-primary-foreground font-bold text-lg tracking-wide">
          Let's run.
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Welcome Back Toast ────────────────────────────────────────────────────────

function WelcomeBackToast({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Reanimated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      className="absolute bottom-20 left-6 right-6 z-20"
    >
      <View className="bg-secondary/90 rounded-2xl py-3 px-4 items-center">
        <Text className="text-secondary-foreground font-medium">
          Welcome back! Picking up where you left off.
        </Text>
      </View>
    </Reanimated.View>
  );
}
