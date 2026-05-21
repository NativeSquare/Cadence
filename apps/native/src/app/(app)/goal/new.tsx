import { FORMAT_DISTANCE_METERS } from "@/components/app/account/race-form";
import {
  StepChooseType,
  StepFitnessGoal,
  StepPlan,
  StepRaceDetails,
  StepRaceGoal,
  type FitnessGoal,
  type GoalBranch,
  type PlanValue,
  type RaceDetailsValue,
  type RaceGoalValue,
} from "@/components/app/goal";
import {
  EMPTY_RECENT_RACE,
  isRecentRaceValid,
  recentRaceToDistanceMeters,
  recentRaceToSeconds,
  StepRecentRace,
  type RecentRaceValue,
} from "@/components/app/onboarding";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";

type Step = 1 | 2 | 3 | 4 | 5;

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const EMPTY_RACE_DETAILS: RaceDetailsValue = {
  name: "",
  date: "",
  format: "",
  discipline: "",
  customDistanceKm: "",
};

const EMPTY_RACE_GOAL: RaceGoalValue = {
  type: null,
  targetHours: "",
  targetMinutes: "",
  targetSeconds: "",
};

const emptyPlan = (): PlanValue => ({ startDate: todayIso() });

function targetSeconds(g: RaceGoalValue): number {
  const total =
    Number.parseInt(g.targetHours || "0", 10) * 3600 +
    Number.parseInt(g.targetMinutes || "0", 10) * 60 +
    Number.parseInt(g.targetSeconds || "0", 10);
  return Number.isFinite(total) ? total : 0;
}

function buildRaceTarget(
  g: RaceGoalValue,
): { type: "finish" } | { type: "time"; seconds: number } {
  if (g.type === "completion") return { type: "finish" };
  return { type: "time", seconds: targetSeconds(g) };
}

function hasNonZeroTime(g: RaceGoalValue): boolean {
  return targetSeconds(g) > 0;
}

export default function NewGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const createRace = useMutation(api.agoge.races.createMyRaceWithGoal);
  const createFitnessGoal = useMutation(api.agoge.goals.createMyFitnessGoal);
  const setVdotFromRaceResult = useMutation(
    api.agoge.baselineTest.setVdotFromRaceResult,
  );

  const [step, setStep] = useState<Step>(1);
  const [branch, setBranch] = useState<GoalBranch | null>(null);
  const [raceDetails, setRaceDetails] =
    useState<RaceDetailsValue>(EMPTY_RACE_DETAILS);
  const [raceGoal, setRaceGoal] = useState<RaceGoalValue>(EMPTY_RACE_GOAL);
  const [plan, setPlan] = useState<PlanValue>(emptyPlan);
  const [fitnessGoal, setFitnessGoalState] = useState<FitnessGoal | null>(null);
  const [recentRace, setRecentRace] =
    useState<RecentRaceValue>(EMPTY_RECENT_RACE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Race branch: 1 type → 2 details → 3 goal → 4 plan → 5 recent race
  // Fitness branch: 1 type → 2 intent → 3 plan → 4 recent race
  const totalSteps = branch === "fitness" ? 4 : 5;
  const isRecentRaceStep =
    (branch === "race" && step === 5) || (branch === "fitness" && step === 4);

  const canProceed = useMemo(() => {
    if (step === 1) return branch != null;
    if (step === 2 && branch === "race") {
      return (
        raceDetails.name.trim() !== "" &&
        raceDetails.date !== "" &&
        raceDetails.format !== "" &&
        raceDetails.discipline !== "" &&
        (raceDetails.format !== "custom" ||
          raceDetails.customDistanceKm.trim() !== "")
      );
    }
    if (step === 2 && branch === "fitness") return fitnessGoal != null;
    if (step === 3 && branch === "race") {
      if (raceGoal.type === "completion") return true;
      if (raceGoal.type === "performance") return hasNonZeroTime(raceGoal);
      return false;
    }
    if (step === 3 && branch === "fitness") return plan.startDate !== "";
    if (step === 4 && branch === "race") return plan.startDate !== "";
    // Recent race is optional — caller can submit with a valid time or skip.
    if (isRecentRaceStep) return true;
    return false;
  }, [step, branch, raceDetails, raceGoal, plan, fitnessGoal, isRecentRaceStep]);

  const isFinalStep = isRecentRaceStep;

  const handleClose = () => {
    router.back();
  };

  const handleBack = () => {
    if (step === 1) {
      handleClose();
      return;
    }
    setSubmitError(null);
    setStep((s) => (s - 1) as Step);
  };

  const handleNext = async () => {
    if (!canProceed || submitting) return;
    setSubmitError(null);
    if (!isFinalStep) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    await submit({ withRaceResult: isRecentRaceValid(recentRace) });
  };

  // "I'll do the 5K test instead" — submit without seeding VDOT.
  const handleSkipRecentRace = async () => {
    if (submitting) return;
    selectionFeedback();
    setSubmitError(null);
    await submit({ withRaceResult: false });
  };

  const submit = async ({ withRaceResult }: { withRaceResult: boolean }) => {
    setSubmitting(true);
    try {
      if (branch === "fitness" && fitnessGoal) {
        await createFitnessGoal({ fitnessIntent: fitnessGoal });
      } else if (branch === "race") {
        const format = raceDetails.format;
        if (format === "" || raceDetails.discipline === "") return;
        const distanceMeters =
          format === "custom"
            ? Math.round(Number.parseFloat(raceDetails.customDistanceKm) * 1000)
            : FORMAT_DISTANCE_METERS[format];
        await createRace({
          race: {
            name: raceDetails.name.trim(),
            date: raceDetails.date,
            priority: "A",
            discipline: raceDetails.discipline,
            format,
            distanceMeters,
            status: "upcoming",
          },
          goal: {
            raceTarget: buildRaceTarget(raceGoal),
          },
        });
      } else {
        return;
      }

      // Optionally seed VDOT from a recent race — skips the in-app 5K test
      // by giving the plan generator something to base paces on right away.
      if (withRaceResult) {
        await setVdotFromRaceResult({
          distanceMeters: recentRaceToDistanceMeters(recentRace),
          timeSeconds: recentRaceToSeconds(recentRace),
        });
      }

      router.replace("/(app)/(tabs)");
    } catch (err) {
      setSubmitError(
        getConvexErrorMessage(err) || t("goal.errors.submitFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <StatusBar barStyle="dark-content" />
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={handleClose}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="close" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("goal.title")}
        </Text>
        <Text
          className="font-coach-medium text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("goal.stepOf", { current: step, total: totalSteps })}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {step === 1 && (
            <StepChooseType
              onSelect={(b) => {
                setBranch(b);
                setSubmitError(null);
                setStep(2);
              }}
            />
          )}
          {step === 2 && branch === "race" && (
            <StepRaceDetails value={raceDetails} onChange={setRaceDetails} />
          )}
          {step === 2 && branch === "fitness" && (
            <StepFitnessGoal
              value={fitnessGoal}
              onChange={setFitnessGoalState}
            />
          )}
          {step === 3 && branch === "race" && (
            <StepRaceGoal value={raceGoal} onChange={setRaceGoal} />
          )}
          {step === 3 && branch === "fitness" && (
            <StepPlan
              value={plan}
              onChange={setPlan}
              branch="fitness"
              minDate={todayIso()}
            />
          )}
          {step === 4 && branch === "race" && (
            <StepPlan
              value={plan}
              onChange={setPlan}
              branch="race"
              minDate={todayIso()}
              maxDate={raceDetails.date || undefined}
            />
          )}
          {isRecentRaceStep && (
            <StepRecentRace value={recentRace} onChange={setRecentRace} />
          )}

          {isRecentRaceStep && (
            <Pressable
              onPress={handleSkipRecentRace}
              disabled={submitting}
              className="items-center py-2 active:opacity-70"
            >
              <Text
                className="font-coach-semibold text-[13px] underline"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {t("onboarding.recentRace.skipForTest")}
              </Text>
            </Pressable>
          )}

          {submitError && (
            <Text
              className="font-coach-medium text-[13px]"
              style={{ color: COLORS.red }}
            >
              {submitError}
            </Text>
          )}
        </View>
      </ScrollView>

      <View
        className="flex-row gap-3 px-4 pb-safe pt-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: LIGHT_THEME.wBrd,
          backgroundColor: LIGHT_THEME.w2,
        }}
      >
        <Pressable
          onPress={handleBack}
          disabled={submitting}
          className="h-12 flex-row items-center justify-center rounded-2xl px-5 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderWidth: 1,
            borderColor: LIGHT_THEME.wBrd,
            opacity: submitting ? 0.5 : 1,
          }}
        >
          <Text
            className="font-coach-semibold text-[14px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {step === 1 ? t("goal.cancel") : t("goal.back")}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={!canProceed || submitting}
          className="h-12 flex-1 flex-row items-center justify-center rounded-2xl active:opacity-90"
          style={{
            backgroundColor: canProceed ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-[14px]"
              style={{
                color: canProceed ? "#FFFFFF" : LIGHT_THEME.wMute,
              }}
            >
              {isFinalStep ? t("goal.done") : t("goal.next")}
            </Text>
          )}
        </Pressable>
      </View>

    </KeyboardAvoidingView>
  );
}
