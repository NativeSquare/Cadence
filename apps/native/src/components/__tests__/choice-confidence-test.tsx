/**
 * Visual Integration Test for Story 2.11
 *
 * Tests:
 * - Choice component selection states
 * - Multi vs single select modes
 * - Flagged state styling
 * - Haptic feedback (manual verification)
 * - ConfidenceBadge at all levels
 *
 * Usage: Import and render this component to verify all ACs.
 */

import { useState } from "react";
import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Choice } from "../app/onboarding/generative/Choice";
import { ConfidenceBadge } from "../app/onboarding/generative/ConfidenceBadge";

export function ChoiceConfidenceTest() {
  // Single-select state
  const [singleSelected, setSingleSelected] = useState<string | null>(null);

  // Multi-select state
  const [multiSelected, setMultiSelected] = useState<string[]>([]);

  // Flagged selection state
  const [flaggedSelected, setFlaggedSelected] = useState<string | null>(null);

  const toggleMulti = (value: string) => {
    setMultiSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ padding: 24, gap: 32 }}
    >
      {/* Section: Single-Select Choices (AC#1, AC#2, AC#5, AC#6) */}
      <View style={{ gap: 16 }}>
        <Text className="text-g1 text-lg font-semibold">
          Single-Select (Radio) - AC#1, #2, #4, #5, #6
        </Text>
        <Text className="text-g3 text-sm">
          Round indicator (11px radius), auto-submit style
        </Text>

        <View style={{ gap: 12 }}>
          <Choice
            label="Beginner"
            desc="Just getting started with running"
            selected={singleSelected === "beginner"}
            onSelect={() => setSingleSelected("beginner")}
            delay={0}
          />
          <Choice
            label="Intermediate"
            desc="Running regularly for 6+ months"
            selected={singleSelected === "intermediate"}
            onSelect={() => setSingleSelected("intermediate")}
            delay={0.05}
          />
          <Choice
            label="Advanced"
            desc="Competing or training seriously"
            selected={singleSelected === "advanced"}
            onSelect={() => setSingleSelected("advanced")}
            delay={0.1}
          />
        </View>
      </View>

      {/* Section: Multi-Select Choices (AC#4) */}
      <View style={{ gap: 16 }}>
        <Text className="text-g1 text-lg font-semibold">
          Multi-Select (Checkbox) - AC#4
        </Text>
        <Text className="text-g3 text-sm">
          Square indicator (6px radius), multiple selections
        </Text>

        <View style={{ gap: 12 }}>
          <Choice
            label="Morning runner"
            selected={multiSelected.includes("morning")}
            onSelect={() => toggleMulti("morning")}
            multi
            delay={0}
          />
          <Choice
            label="Evening runner"
            selected={multiSelected.includes("evening")}
            onSelect={() => toggleMulti("evening")}
            multi
            delay={0.05}
          />
          <Choice
            label="Weekend warrior"
            selected={multiSelected.includes("weekend")}
            onSelect={() => toggleMulti("weekend")}
            multi
            delay={0.1}
          />
        </View>
      </View>

      {/* Section: Flagged Choices (AC#3) */}
      <View style={{ gap: 16 }}>
        <Text className="text-g1 text-lg font-semibold">
          Flagged State - AC#3
        </Text>
        <Text className="text-g3 text-sm">
          Red styling for risky/warning options
        </Text>

        <View style={{ gap: 12 }}>
          <Choice
            label="Take it easy"
            desc="Recommended for recovery"
            selected={flaggedSelected === "easy"}
            onSelect={() => setFlaggedSelected("easy")}
            delay={0}
          />
          <Choice
            label="Push through"
            desc="Not recommended if experiencing pain"
            selected={flaggedSelected === "push"}
            onSelect={() => setFlaggedSelected("push")}
            flagged
            delay={0.05}
          />
          <Choice
            label="Skip workout"
            desc="Rest day"
            selected={flaggedSelected === "skip"}
            onSelect={() => setFlaggedSelected("skip")}
            delay={0.1}
          />
        </View>
      </View>

      {/* Section: ConfidenceBadge (AC#7-#10) */}
      <View style={{ gap: 16 }}>
        <Text className="text-g1 text-lg font-semibold">
          ConfidenceBadge - AC#7, #8, #9, #10
        </Text>
        <Text className="text-g3 text-sm">
          Data confidence indicators with pill styling
        </Text>

        <View style={{ gap: 12 }}>
          {/* HIGH with wearable data */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ConfidenceBadge level="HIGH" hasData />
            <Text className="text-g3 text-sm">Wearable data detected</Text>
          </View>

          {/* MODERATE self-reported */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ConfidenceBadge level="MODERATE" hasData={false} />
            <Text className="text-g3 text-sm">Self-reported info</Text>
          </View>

          {/* LOW */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ConfidenceBadge level="LOW" hasData={false} />
            <Text className="text-g3 text-sm">Insufficient data</Text>
          </View>
        </View>
      </View>

      {/* Section: Selected State Summary */}
      <View
        style={{
          padding: 16,
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          gap: 8,
        }}
      >
        <Text className="text-g2 font-mono text-xs">
          Single: {singleSelected ?? "none"}
        </Text>
        <Text className="text-g2 font-mono text-xs">
          Multi: [{multiSelected.join(", ")}]
        </Text>
        <Text className="text-g2 font-mono text-xs">
          Flagged: {flaggedSelected ?? "none"}
        </Text>
      </View>
    </ScrollView>
  );
}
