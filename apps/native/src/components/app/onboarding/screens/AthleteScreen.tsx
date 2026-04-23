/**
 * AthleteScreen - Fill missing Agoge athlete fields (Act 3).
 *
 * Reads the current athlete, shows only the fields still missing
 * ({ sex, dateOfBirth, weightKg, heightCm }), and writes them back through
 * `api.plan.athlete.upsertAthlete`. Silently skips if all four are already set.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../Cursor";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";

interface AthleteScreenProps {
  onNext: () => void;
}

type Sex = "male" | "female" | "other";

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

function isValidDate(d: string, m: string, y: string): boolean {
  const day = Number.parseInt(d, 10);
  const month = Number.parseInt(m, 10);
  const year = Number.parseInt(y, 10);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return false;
  }
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function AthleteScreen({ onNext }: AthleteScreenProps) {
  const athlete = useQuery(api.plan.reads.getAthlete);
  const upsertAthlete = useMutation(api.plan.athlete.upsertAthlete);

  const hasSex = !!athlete?.sex;
  const hasDob = !!athlete?.dateOfBirth;
  const hasWeight = athlete?.weightKg != null;
  const hasHeight = athlete?.heightCm != null;
  const allFilled =
    athlete !== undefined &&
    athlete !== null &&
    hasSex &&
    hasDob &&
    hasWeight &&
    hasHeight;

  const [sex, setSex] = useState<Sex | null>(null);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Skip silently if everything is already on the athlete record
  useEffect(() => {
    if (allFilled) onNext();
  }, [allFilled, onNext]);

  const showForm = athlete !== undefined && !allFilled;

  const intro = useStream({
    text: "Just a few basics — helps me calibrate intensity.",
    speed: 32,
    delay: 400,
    active: showForm,
  });

  const formValid = useMemo(() => {
    if (!hasSex && sex === null) return false;
    if (!hasDob && !isValidDate(dobDay, dobMonth, dobYear)) return false;
    if (!hasWeight) {
      const w = Number.parseFloat(weightKg);
      if (!Number.isFinite(w) || w <= 0 || w > 400) return false;
    }
    if (!hasHeight) {
      const h = Number.parseFloat(heightCm);
      if (!Number.isFinite(h) || h <= 0 || h > 260) return false;
    }
    return true;
  }, [
    hasSex,
    sex,
    hasDob,
    dobDay,
    dobMonth,
    dobYear,
    hasWeight,
    weightKg,
    hasHeight,
    heightCm,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!formValid || submitting) return;
    setSubmitting(true);
    Keyboard.dismiss();
    try {
      const patch: {
        sex?: Sex;
        dateOfBirth?: string;
        weightKg?: number;
        heightCm?: number;
      } = {};
      if (!hasSex && sex) patch.sex = sex;
      if (!hasDob) {
        patch.dateOfBirth = `${dobYear.padStart(4, "0")}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;
      }
      if (!hasWeight) patch.weightKg = Number.parseFloat(weightKg);
      if (!hasHeight) patch.heightCm = Number.parseFloat(heightCm);
      await upsertAthlete(patch);
      onNext();
    } finally {
      setSubmitting(false);
    }
  }, [
    formValid,
    submitting,
    hasSex,
    sex,
    hasDob,
    dobDay,
    dobMonth,
    dobYear,
    hasWeight,
    weightKg,
    hasHeight,
    heightCm,
    upsertAthlete,
    onNext,
  ]);

  if (!showForm) {
    return <View style={styles.container} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        <View style={styles.textArea}>
          <Text style={styles.headline}>
            {intro.displayed}
            {!intro.done && intro.started && <Cursor visible height={26} />}
          </Text>
        </View>

        {intro.done && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.form}>
          {!hasSex && (
            <View style={styles.field}>
              <Text style={styles.label}>Sex</Text>
              <View style={styles.sexRow}>
                {SEX_OPTIONS.map((opt) => {
                  const selected = sex === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        selectionFeedback();
                        setSex(opt.value);
                      }}
                      style={[
                        styles.sexPill,
                        selected && styles.sexPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sexPillText,
                          selected && styles.sexPillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {!hasDob && (
            <View style={styles.field}>
              <Text style={styles.label}>Date of birth</Text>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.input, styles.dobPart]}
                  placeholder="DD"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dobDay}
                  onChangeText={setDobDay}
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <TextInput
                  style={[styles.input, styles.dobPart]}
                  placeholder="MM"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dobMonth}
                  onChangeText={setDobMonth}
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <TextInput
                  style={[styles.input, styles.dobYear]}
                  placeholder="YYYY"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={dobYear}
                  onChangeText={setDobYear}
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
              </View>
            </View>
          )}

          {!hasWeight && (
            <View style={styles.field}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.measureRow}>
                <TextInput
                  style={[styles.input, styles.measureInput]}
                  placeholder="—"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="decimal-pad"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>
          )}

          {!hasHeight && (
            <View style={styles.field}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.measureRow}>
                <TextInput
                  style={[styles.input, styles.measureInput]}
                  placeholder="—"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={!formValid || submitting}
            style={[
              styles.primaryButton,
              (!formValid || submitting) && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "..." : "Continue"}
            </Text>
          </Pressable>
        </Animated.View>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
  },
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  textArea: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headline: {
    fontSize: 26,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: LIGHT_THEME.wText,
    lineHeight: 36,
    letterSpacing: -0.52,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: LIGHT_THEME.wMute,
    paddingHorizontal: 12,
  },
  sexRow: {
    flexDirection: "row",
    gap: 8,
  },
  sexPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
    backgroundColor: LIGHT_THEME.w1,
    alignItems: "center",
  },
  sexPillActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },
  sexPillText: {
    fontFamily: "Outfit-Medium",
    fontSize: 15,
    color: LIGHT_THEME.wSub,
  },
  sexPillTextActive: {
    color: COLORS.black,
  },
  dobRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
    backgroundColor: LIGHT_THEME.w1,
    paddingHorizontal: 16,
    fontFamily: "Outfit-Regular",
    fontSize: 17,
    color: LIGHT_THEME.wText,
  },
  dobPart: {
    width: 72,
    textAlign: "center",
  },
  dobYear: {
    flex: 1,
    textAlign: "center",
  },
  measureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  measureInput: {
    flex: 1,
  },
  unit: {
    fontFamily: "Outfit-Medium",
    fontSize: 15,
    color: LIGHT_THEME.wMute,
    width: 28,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.black,
    letterSpacing: -0.17,
  },
});
