import {
  FORMAT_DISTANCE_METERS,
  getRaceDateError,
} from "@/components/app/account/race-form";
import {
  StepPlan,
  StepRaceDetails,
  StepRaceGoal,
  type PlanValue,
  type RaceDetailsValue,
  type RaceGoalValue,
} from "@/components/app/goal";
import {
  EMPTY_SCHEDULE,
  isScheduleValid,
  StepSchedule,
  type ScheduleValue,
} from "@/components/app/onboarding";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
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

  const athlete = useQuery(api.agoge.athletes.getAthlete);
  const createRace = useMutation(api.agoge.races.createMyRaceWithGoal);
  const upsertAthlete = useMutation(api.agoge.athletes.upsertAthlete);

  const [step, setStep] = useState<Step>(1);
  const [raceDetails, setRaceDetails] =
    useState<RaceDetailsValue>(EMPTY_RACE_DETAILS);
  const [raceGoal, setRaceGoal] = useState<RaceGoalValue>(EMPTY_RACE_GOAL);
  const [plan, setPlan] = useState<PlanValue>(emptyPlan);
  const [schedule, setSchedule] = useState<ScheduleValue>(EMPTY_SCHEDULE);
  const [scheduleSeeded, setScheduleSeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill the schedule step from the athlete's saved availability (set during
  // onboarding) so we surface their current days/sessions rather than defaults.
  // Seed once — after that the user's in-wizard edits own the state.
  useEffect(() => {
    if (scheduleSeeded || athlete === undefined) return;
    const days = athlete?.availableDays;
    const sessions = athlete?.sessionsPerWeek;
    if (days && days.length > 0 && typeof sessions === "number") {
      setSchedule({ availableDays: days, sessionsPerWeek: sessions });
    }
    setScheduleSeeded(true);
  }, [athlete, scheduleSeeded]);

  // 1 details → 2 goal → 3 plan → 4 schedule. No recent-race step: a returning
  // athlete already has a VDOT baseline from onboarding (ADR-0006).
  const totalSteps = 4;

  const canProceed = useMemo(() => {
    if (step === 1) {
      const fieldsFilled =
        raceDetails.name.trim() !== "" &&
        raceDetails.date !== "" &&
        raceDetails.format !== "";
      if (!fieldsFilled) return false;
      // Mirror of backend rule: 5K needs ≥ 4 weeks lead time, marathon ≥ 10.
      // The other formats have no enforced minimum.
      const dateError = getRaceDateError(
        todayIso(),
        raceDetails.date,
        raceDetails.format === "" ? undefined : raceDetails.format,
      );
      return dateError === null;
    }
    if (step === 2) {
      if (raceGoal.type === "completion") return true;
      if (raceGoal.type === "performance") return hasNonZeroTime(raceGoal);
      return false;
    }
    if (step === 3) return plan.startDate !== "";
    if (step === 4) return isScheduleValid(schedule);
    return false;
  }, [step, raceDetails, raceGoal, plan, schedule]);

  const isFinalStep = step === 4;

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
      // Persist the chosen availability onto the athlete profile — the plan
      // engine reads `availableDays`/`sessionsPerWeek` from there when laying
      // out microcycles.
      await upsertAthlete({
        availableDays: schedule.availableDays,
        sessionsPerWeek: schedule.sessionsPerWeek,
      });

      const format = raceDetails.format;
      if (format === "") return;
      const distanceMeters = FORMAT_DISTANCE_METERS[format];
      await createRace({
        race: {
          name: raceDetails.name.trim(),
          date: raceDetails.date,
          priority: "A",
          // Discipline isn't a plan-generation input; default it so the
          // required backend field is satisfied.
          discipline: "road",
          format,
          distanceMeters,
          status: "upcoming",
        },
        goal: {
          raceTarget: buildRaceTarget(raceGoal),
        },
      });

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
            <StepRaceDetails value={raceDetails} onChange={setRaceDetails} />
          )}
          {step === 2 && (
            <StepRaceGoal value={raceGoal} onChange={setRaceGoal} />
          )}
          {step === 3 && (
            <StepPlan
              value={plan}
              onChange={setPlan}
              minDate={todayIso()}
              maxDate={raceDetails.date || undefined}
            />
          )}
          {step === 4 && (
            <StepSchedule value={schedule} onChange={setSchedule} />
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
