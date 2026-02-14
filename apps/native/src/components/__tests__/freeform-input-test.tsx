/**
 * Visual Integration Test for Story 2.10
 *
 * Tests FreeformInput and MiniAnalysis components.
 * Run by temporarily rendering this component in the app.
 *
 * Test coverage:
 * - FreeformInput pill interactions
 * - FreeformInput text submission
 * - FreeformInput voice recording UI
 * - MiniAnalysis pattern detection
 * - MiniAnalysis line timing (280ms)
 * - MiniAnalysis completion callback
 */

import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { FreeformInput } from "@/components/app/onboarding/generative/FreeformInput";
import { MiniAnalysis } from "@/components/app/onboarding/generative/MiniAnalysis";
import { COLORS, GRAYS } from "@/lib/design-tokens";

type TestState = "input" | "analysis";

export function FreeformInputTest() {
  const [testState, setTestState] = useState<TestState>("input");
  const [submittedText, setSubmittedText] = useState("");
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleSubmit = (text: string) => {
    console.log("[Test] Text submitted:", text);
    setSubmittedText(text);
    setTestState("analysis");
    setAnalysisComplete(false);
  };

  const handlePill = (pill: string) => {
    console.log("[Test] Pill tapped:", pill);
    setSubmittedText(pill);
    setTestState("analysis");
    setAnalysisComplete(false);
  };

  const handleAnalysisDone = () => {
    console.log("[Test] Analysis complete");
    setAnalysisComplete(true);
  };

  const resetTest = () => {
    setTestState("input");
    setSubmittedText("");
    setAnalysisComplete(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Story 2.10 Test</Text>
          <Text style={styles.subtitle}>FreeformInput & MiniAnalysis</Text>
        </View>

        {/* Test content */}
        <View style={styles.testArea}>
          {testState === "input" && (
            <>
              <Text style={styles.sectionTitle}>Test 1: FreeformInput</Text>
              <Text style={styles.description}>
                Try typing text, tapping pills, or using voice input.
              </Text>
              <FreeformInput
                placeholder="Tell me about your running goals..."
                pills={[
                  "Training for a race",
                  "General fitness",
                  "Returning from injury",
                ]}
                onSubmit={handleSubmit}
                onPill={handlePill}
              />
            </>
          )}

          {testState === "analysis" && (
            <>
              <Text style={styles.sectionTitle}>Test 2: MiniAnalysis</Text>
              <Text style={styles.description}>
                Watch the line-by-line reveal and pattern detection.
              </Text>
              <MiniAnalysis
                text={submittedText}
                onDone={handleAnalysisDone}
              />

              {analysisComplete && (
                <View style={styles.completionBadge}>
                  <Text style={styles.completionText}>
                    ✓ onDone callback fired
                  </Text>
                </View>
              )}

              <Pressable onPress={resetTest} style={styles.resetButton}>
                <Text style={styles.resetText}>Reset Test</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Test cases */}
        <View style={styles.testCases}>
          <Text style={styles.sectionTitle}>Test Inputs to Try:</Text>

          <View style={styles.testCase}>
            <Text style={styles.testCaseLabel}>Race detection:</Text>
            <Text style={styles.testCaseValue}>
              "I want to run a half marathon in 1:45"
            </Text>
          </View>

          <View style={styles.testCase}>
            <Text style={styles.testCaseLabel}>Injury flag:</Text>
            <Text style={styles.testCaseValue}>
              "Had knee pain last month"
            </Text>
          </View>

          <View style={styles.testCase}>
            <Text style={styles.testCaseLabel}>Break detection:</Text>
            <Text style={styles.testCaseValue}>
              "Just had a baby, getting back into running"
            </Text>
          </View>

          <View style={styles.testCase}>
            <Text style={styles.testCaseLabel}>Schedule:</Text>
            <Text style={styles.testCaseValue}>
              "I prefer morning runs, busy with work"
            </Text>
          </View>

          <View style={styles.testCase}>
            <Text style={styles.testCaseLabel}>Combined:</Text>
            <Text style={styles.testCaseValue}>
              "Half marathon in October, had injury last year, prefer evenings"
            </Text>
          </View>
        </View>

        {/* AC checklist */}
        <View style={styles.checklist}>
          <Text style={styles.sectionTitle}>Acceptance Criteria:</Text>
          <Text style={styles.checkItem}>AC1: ☐ User message in bordered card</Text>
          <Text style={styles.checkItem}>AC2: ☐ Orange pulsing dot during processing</Text>
          <Text style={styles.checkItem}>AC3: ☐ Lines appear with 280ms delay</Text>
          <Text style={styles.checkItem}>AC4: ☐ Pattern extractions shown</Text>
          <Text style={styles.checkItem}>AC5: ☐ Warning flags in orange</Text>
          <Text style={styles.checkItem}>AC6: ☐ Border transitions to lime on completion</Text>
          <Text style={styles.checkItem}>AC7: ☐ TextInput with placeholder</Text>
          <Text style={styles.checkItem}>AC8: ☐ Pills with dashed border, fadeIn</Text>
          <Text style={styles.checkItem}>AC9: ☐ Mic button present</Text>
          <Text style={styles.checkItem}>AC10: ☐ Character count shows</Text>
          <Text style={styles.checkItem}>AC11: ☐ Send button scaleIn animation</Text>
          <Text style={styles.checkItem}>AC12: ☐ Voice recording UI works</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 20,
    gap: 24,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 24,
    color: COLORS.lime,
  },
  subtitle: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g3,
  },
  testArea: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: GRAYS.g1,
    marginBottom: 4,
  },
  description: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g3,
  },
  completionBadge: {
    backgroundColor: COLORS.limeDim,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  completionText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 12,
    color: COLORS.lime,
  },
  resetButton: {
    backgroundColor: GRAYS.g6,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  resetText: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: GRAYS.g2,
  },
  testCases: {
    gap: 8,
    padding: 16,
    backgroundColor: GRAYS.g6,
    borderRadius: 12,
  },
  testCase: {
    gap: 2,
  },
  testCaseLabel: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: GRAYS.g3,
  },
  testCaseValue: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: GRAYS.g2,
  },
  checklist: {
    gap: 6,
    padding: 16,
    backgroundColor: GRAYS.g6,
    borderRadius: 12,
  },
  checkItem: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: GRAYS.g3,
  },
});
