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
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

type Step = 1 | 2 | 3 | 4;

const MOCK_PLAN_GENERATION_MS = 2500;

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

  const [step, setStep] = useState<Step>(1);
  const [branch, setBranch] = useState<GoalBranch | null>(null);
  const [raceDetails, setRaceDetails] =
    useState<RaceDetailsValue>(EMPTY_RACE_DETAILS);
  const [raceGoal, setRaceGoal] = useState<RaceGoalValue>(EMPTY_RACE_GOAL);
  const [plan, setPlan] = useState<PlanValue>(emptyPlan);
  const [fitnessGoal, setFitnessGoalState] = useState<FitnessGoal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const totalSteps = branch === "fitness" ? 2 : 4;

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
    if (step === 4 && branch === "race") return plan.startDate !== "";
    return false;
  }, [step, branch, raceDetails, raceGoal, plan, fitnessGoal]);

  const isFinalStep =
    (step === 4 && branch === "race") || (step === 2 && branch === "fitness");

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
    await submit();
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (branch === "fitness" && fitnessGoal) {
        await createFitnessGoal({ fitnessIntent: fitnessGoal });
        router.replace("/(app)/(tabs)");
        return;
      }
      if (branch === "race") {
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
        setGeneratingPlan(true);
        return;
      }
    } catch (err) {
      setSubmitError(
        getConvexErrorMessage(err) || t("goal.errors.submitFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!generatingPlan) return;
    const id = setTimeout(() => {
      router.replace("/(app)/(tabs)");
    }, MOCK_PLAN_GENERATION_MS);
    return () => clearTimeout(id);
  }, [generatingPlan, router]);

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
          {step === 4 && branch === "race" && (
            <StepPlan
              value={plan}
              onChange={setPlan}
              minDate={todayIso()}
              maxDate={raceDetails.date || undefined}
            />
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

      {generatingPlan && (
        <View
          className="absolute inset-0 items-center justify-center px-8"
          style={{ backgroundColor: LIGHT_THEME.w2 }}
        >
          <View className="w-full max-w-md items-center gap-6">
            <ActivityIndicator size="large" color={LIGHT_THEME.wText} />
            <View className="items-center gap-2">
              <Text
                className="font-coach-extrabold text-[22px]"
                style={{
                  color: LIGHT_THEME.wText,
                  letterSpacing: -0.02 * 22,
                  textAlign: "center",
                }}
              >
                {t("goal.plan.generating.title")}
              </Text>
              <Text
                className="font-coach-medium text-[14px]"
                style={{
                  color: LIGHT_THEME.wSub,
                  lineHeight: 20,
                  textAlign: "center",
                }}
              >
                {t("goal.plan.generating.subtitle")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
