import {
  FORMAT_DISTANCE_METERS,
  getRaceDateError,
  type RaceFormSubmit,
} from "@/components/app/account/race-form";
import {
  StepRaceDetails,
  StepRaceGoal,
  type RaceDetailsValue,
  type RaceGoalValue,
} from "@/components/app/goal";
import {
  EMPTY_RECENT_RACE,
  EMPTY_SCHEDULE,
  isRecentRaceValid,
  isScheduleValid,
  recentRaceToDistanceMeters,
  recentRaceToSeconds,
  StepExperience,
  StepProfile,
  StepRecentRace,
  StepSchedule,
  StepWelcome,
  type ProfileValue,
  type RecentRaceValue,
  type ScheduleValue,
} from "@/components/app/onboarding";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import type { ExperienceLevel } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
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

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const EMPTY_PROFILE: ProfileValue = { sex: null, dateOfBirth: "" };

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

function raceTargetSeconds(g: RaceGoalValue): number {
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
  return { type: "time", seconds: raceTargetSeconds(g) };
}

export default function Onboarding() {
  const { t } = useTranslation();
  const user = useQuery(api.table.users.currentUser);

  const patchUser = useMutation(api.table.users.patch);
  const upsertAthlete = useMutation(api.agoge.athletes.upsertAthlete);
  const createRaceWithGoal = useMutation(api.agoge.races.createMyRaceWithGoal);
  const setVdotFromRaceResult = useMutation(
    api.engine.baselineTest.setVdotFromRaceResult,
  );

  // Step indexing is 1-based.
  //   1 Welcome  2 Profile  3 Experience  4 Schedule
  //   5 RaceDetails  6 RaceGoal  7 RecentRace
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<ProfileValue>(EMPTY_PROFILE);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [schedule, setSchedule] = useState<ScheduleValue>(EMPTY_SCHEDULE);
  const [raceDetails, setRaceDetails] =
    useState<RaceDetailsValue>(EMPTY_RACE_DETAILS);
  const [raceGoal, setRaceGoal] = useState<RaceGoalValue>(EMPTY_RACE_GOAL);
  const [recentRace, setRecentRace] =
    useState<RecentRaceValue>(EMPTY_RECENT_RACE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = 7;
  const isRecentRaceStep = step === 7;
  const isFinalStep = isRecentRaceStep;

  const canProceed = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return profile.sex !== null && profile.dateOfBirth !== "";
    if (step === 3) return experience !== null;
    if (step === 4) return isScheduleValid(schedule);
    if (step === 5) {
      const fieldsFilled =
        raceDetails.name.trim() !== "" &&
        raceDetails.date !== "" &&
        raceDetails.format !== "";
      if (!fieldsFilled) return false;
      // Mirror StepRaceDetails' lead-time guard so the red error and the
      // Next button stay in agreement (e.g. a 5K must be 4–12 weeks out,
      // a marathon at least 10 weeks).
      return (
        getRaceDateError(
          todayIso(),
          raceDetails.date,
          raceDetails.format === "" ? undefined : raceDetails.format,
        ) === null
      );
    }
    if (step === 6) {
      if (raceGoal.type === "completion") return true;
      if (raceGoal.type === "performance") return raceTargetSeconds(raceGoal) > 0;
      return false;
    }
    // Recent race is optional — caller can submit with a valid time or skip.
    if (step === 7) return true;
    return false;
  }, [step, profile, experience, schedule, raceDetails, raceGoal]);

  const handleBack = () => {
    if (step === 1) return;
    setSubmitError(null);
    setStep((s) => s - 1);
  };

  const handleNext = async () => {
    if (!canProceed || submitting) return;
    setSubmitError(null);

    if (!isFinalStep) {
      setStep((s) => s + 1);
      return;
    }

    await submit({ withRaceResult: isRecentRaceValid(recentRace) });
  };

  const submit = async ({ withRaceResult }: { withRaceResult: boolean }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      // 1. Patch athlete profile fields
      await upsertAthlete({
        sex: profile.sex ?? undefined,
        dateOfBirth: profile.dateOfBirth || undefined,
        experienceLevel: experience ?? undefined,
        availableDays: schedule.availableDays,
        sessionsPerWeek: schedule.sessionsPerWeek,
      });

      // 2. Create the race goal (and plan + baseline-test gating)
      if (raceDetails.format === "") {
        throw new Error("Race details incomplete");
      }
      const distanceMeters = FORMAT_DISTANCE_METERS[raceDetails.format];
      await createRaceWithGoal({
        race: {
          name: raceDetails.name.trim(),
          date: raceDetails.date,
          priority: "A",
          // Discipline isn't a plan-generation input; default it so the
          // required backend field is satisfied.
          discipline: "road",
          format: raceDetails.format,
          distanceMeters,
          status: "upcoming",
        } satisfies Omit<RaceFormSubmit, "goal">,
        goal: { raceTarget: buildRaceTarget(raceGoal) },
      });

      // 3. Optionally seed VDOT from a recent race — skips the in-app 5K test
      if (withRaceResult) {
        await setVdotFromRaceResult({
          distanceMeters: recentRaceToDistanceMeters(recentRace),
          timeSeconds: recentRaceToSeconds(recentRace),
        });
      }

      // 4. Flip the onboarding flag — _layout.tsx then routes to (app)
      await patchUser({
        id: user._id,
        data: { hasCompletedOnboarding: true },
      });
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err) || String(err));
      setSubmitting(false);
    }
  };

  // "I'll do the 5K test instead" — submit without writing the pace zone.
  const handleSkipRecentRace = async () => {
    if (submitting) return;
    setSubmitError(null);
    await submit({ withRaceResult: false });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <StatusBar barStyle="dark-content" />

      {step > 1 && (
        <View
          className="flex-row items-center gap-3 px-4 pb-3 pt-4"
          style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
        >
          <Text
            className="flex-1 font-coach-bold text-lg"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("onboarding.title")}
          </Text>
          <Text
            className="font-coach-medium text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("onboarding.stepOf", { current: step - 1, total: totalSteps - 1 })}
          </Text>
        </View>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {step === 1 && <StepWelcome />}
          {step === 2 && <StepProfile value={profile} onChange={setProfile} />}
          {step === 3 && (
            <StepExperience value={experience} onChange={setExperience} />
          )}
          {step === 4 && (
            <StepSchedule value={schedule} onChange={setSchedule} />
          )}
          {step === 5 && (
            <StepRaceDetails value={raceDetails} onChange={setRaceDetails} />
          )}
          {step === 6 && (
            <StepRaceGoal value={raceGoal} onChange={setRaceGoal} />
          )}
          {step === 7 && (
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
        {step > 1 && (
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
              {t("onboarding.back")}
            </Text>
          </Pressable>
        )}

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
              {step === 1
                ? t("onboarding.welcome.cta")
                : isFinalStep
                ? t("onboarding.finish")
                : t("onboarding.next")}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
