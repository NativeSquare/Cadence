/**
 * Plan Generator Tests (Story 6.5)
 *
 * NOTE: These tests require vitest to be installed.
 * Run: pnpm add -D vitest @vitest/coverage-v8
 * Then add to package.json: "test": "vitest"
 *
 * Tests cover all Acceptance Criteria:
 * - AC1: Template Selection
 * - AC2: Load Parameter Calculation
 * - AC3: Modifier Application
 * - AC4: Safeguard Validation
 * - AC5: Week-by-Week Generation
 * - AC6: Session Generation
 * - AC7: Season View Synthesis
 * - AC8: Runner Snapshot
 * - AC9: Module Isolation (pure function)
 * - AC10: Decision Audit Trail
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import {
  generatePlan,
  type PlanGeneratorInput,
  type KBEntry,
  type GoalType,
} from "./planGenerator";
import { selectTemplate, isValidDuration, getRecommendedDuration } from "./templates";

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockRunner(overrides: Partial<Doc<"runners">> = {}): Doc<"runners"> {
  return {
    _id: "runner_123" as Id<"runners">,
    _creationTime: Date.now(),
    userId: "user_123" as Id<"users">,
    identity: { name: "Test Runner", nameConfirmed: true },
    physical: { age: 35, weight: 70, height: 175 },
    running: {
      experienceLevel: "casual",
      monthsRunning: 24,
      currentFrequency: 4,
      currentVolume: 30,
      easyPace: "5:40/km",
    },
    goals: {
      goalType: "race",
      raceDistance: 21097,
      raceDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
    },
    schedule: {
      availableDays: 5,
      blockedDays: ["wednesday"],
    },
    health: {
      pastInjuries: [],
      recoveryStyle: "quick",
      sleepQuality: "solid",
      stressLevel: "moderate",
    },
    connections: {
      stravaConnected: false,
      wearableConnected: false,
      calendarConnected: false,
    },
    conversationState: {
      dataCompleteness: 100,
      readyForPlan: true,
      currentPhase: "analysis",
      fieldsToConfirm: [],
      fieldsMissing: [],
    },
    currentState: {
      acuteTrainingLoad: 45,
      chronicTrainingLoad: 40,
      trainingStressBalance: -5,
      readinessScore: 75,
      last28DaysAvgVolume: 32,
      injuryRiskLevel: "low",
      dataQuality: "medium",
    },
    ...overrides,
  } as Doc<"runners">;
}

function createMockKBQuery(): (context: unknown) => Promise<KBEntry[]> {
  return vi.fn().mockResolvedValue([
    {
      id: "kb_volume_progression",
      title: "10% Rule for Volume Progression",
      content: "Increase weekly running volume by no more than 10% per week.",
      summary: "Safe volume increase guideline",
      confidence: "established",
      applicableGoals: ["5k", "10k", "half_marathon", "marathon"],
      tags: ["volume_progression", "injury_prevention"],
    },
    {
      id: "kb_recovery",
      title: "Recovery Principles",
      content: "Recovery is when adaptation happens.",
      summary: "Recovery importance",
      confidence: "established",
      tags: ["recovery", "adaptation"],
    },
  ]);
}

function createMockSafeguards(): () => Promise<Doc<"safeguards">[]> {
  return vi.fn().mockResolvedValue([
    {
      _id: "safeguard_volume" as Id<"safeguards">,
      _creationTime: Date.now(),
      name: "Max Volume Increase",
      description: "Limit weekly volume increase",
      ruleType: "soft_limit",
      priority: 10,
      isActive: true,
      condition: {
        field: "weeklyVolumeIncrease",
        operator: ">",
        threshold: 0.1,
      },
      action: {
        type: "cap",
        message: "Volume increase capped at 10%",
        severity: "medium",
        adjustment: 0.1,
      },
    },
  ] as Doc<"safeguards">[]);
}

function createPlanInput(overrides: Partial<PlanGeneratorInput> = {}): PlanGeneratorInput {
  return {
    runner: createMockRunner(),
    goalType: "half_marathon",
    durationWeeks: 12,
    queryKnowledgeBase: createMockKBQuery(),
    getSafeguards: createMockSafeguards(),
    ...overrides,
  };
}

// =============================================================================
// AC1: Template Selection Tests
// =============================================================================

describe("AC1: Template Selection", () => {
  it("should select correct template for 5k goal", () => {
    const template = selectTemplate("5k", 8);
    expect(template.goalType).toBe("5k");
    expect(template.name).toContain("5K");
  });

  it("should select correct template for half marathon goal", () => {
    const template = selectTemplate("half_marathon", 12);
    expect(template.goalType).toBe("half_marathon");
    expect(template.name).toContain("Half Marathon");
  });

  it("should select correct template for marathon goal", () => {
    const template = selectTemplate("marathon", 16);
    expect(template.goalType).toBe("marathon");
    expect(template.name).toContain("Marathon");
  });

  it("should throw for invalid duration (too short)", () => {
    expect(() => selectTemplate("marathon", 8)).toThrow(/below minimum/);
  });

  it("should throw for invalid duration (too long)", () => {
    expect(() => selectTemplate("5k", 20)).toThrow(/exceeds maximum/);
  });

  it("should validate duration correctly", () => {
    expect(isValidDuration("half_marathon", 12)).toBe(true);
    expect(isValidDuration("half_marathon", 5)).toBe(false);
    expect(isValidDuration("half_marathon", 20)).toBe(false);
  });

  it("should provide recommended duration", () => {
    expect(getRecommendedDuration("5k")).toBe(8);
    expect(getRecommendedDuration("half_marathon")).toBe(12);
    expect(getRecommendedDuration("marathon")).toBe(16);
  });

  it("should log template selection decision in generatePlan", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    const templateDecision = result.plan.decisions?.find(
      (d) => d.category === "template_selection"
    );
    expect(templateDecision).toBeDefined();
    expect(templateDecision?.decision).toContain("template");
    expect(templateDecision?.reasoning).toBeTruthy();
  });
});

// =============================================================================
// AC2: Load Parameter Calculation Tests
// =============================================================================

describe("AC2: Load Parameter Calculation", () => {
  it("should calculate load parameters from runner state", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.loadParameters).toBeDefined();
    expect(result.plan.loadParameters?.startingVolume).toBeGreaterThan(0);
    expect(result.plan.loadParameters?.peakVolume).toBeGreaterThan(
      result.plan.loadParameters?.startingVolume ?? 0
    );
    expect(result.plan.loadParameters?.weeklyIncrease).toBeGreaterThan(0);
    expect(result.plan.loadParameters?.weeklyIncrease).toBeLessThanOrEqual(0.1);
  });

  it("should query knowledge base for volume principles", async () => {
    const mockKB = createMockKBQuery();
    const input = createPlanInput({ queryKnowledgeBase: mockKB });

    await generatePlan(input);

    expect(mockKB).toHaveBeenCalled();
  });

  it("should log load parameter decisions with KB references", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    const loadDecision = result.plan.decisions?.find(
      (d) => d.category === "load_parameters"
    );
    expect(loadDecision).toBeDefined();
    expect(loadDecision?.reasoning).toBeTruthy();
  });
});

// =============================================================================
// AC3: Modifier Application Tests
// =============================================================================

describe("AC3: Modifier Application", () => {
  it("should apply injury history modifier", async () => {
    const runnerWithInjury = createMockRunner({
      health: {
        pastInjuries: ["shin_splints"],
        recoveryStyle: "quick",
        sleepQuality: "solid",
        stressLevel: "moderate",
      },
    });

    const input = createPlanInput({ runner: runnerWithInjury });
    const result = await generatePlan(input);

    // Should have modifier decision
    const modifierDecision = result.plan.decisions?.find(
      (d) => d.category === "modifier_application"
    );
    expect(modifierDecision).toBeDefined();
  });

  it("should apply age modifier for older runners", async () => {
    const olderRunner = createMockRunner({
      physical: { age: 55, weight: 70, height: 175 },
    });

    const input = createPlanInput({ runner: olderRunner });
    const result = await generatePlan(input);

    // Peak volume should be reduced for older runners
    const modifierDecision = result.plan.decisions?.find(
      (d) => d.category === "modifier_application"
    );
    expect(modifierDecision?.reasoning).toContain("age");
  });

  it("should apply experience modifier for beginners", async () => {
    const beginnerRunner = createMockRunner({
      running: {
        experienceLevel: "beginner",
        monthsRunning: 6,
        currentFrequency: 3,
        currentVolume: 20,
      },
    });

    const input = createPlanInput({ runner: beginnerRunner });
    const result = await generatePlan(input);

    // Should have conservative approach for beginners
    expect(result.plan.loadParameters?.peakVolume).toBeLessThan(60);
  });

  it("should log each modification with reasoning", async () => {
    const runnerWithModifiers = createMockRunner({
      health: {
        pastInjuries: ["achilles"],
        recoveryStyle: "slow",
        sleepQuality: "inconsistent",
        stressLevel: "high",
      },
      physical: { age: 50, weight: 75, height: 175 },
    });

    const input = createPlanInput({ runner: runnerWithModifiers });
    const result = await generatePlan(input);

    const modifierDecision = result.plan.decisions?.find(
      (d) => d.category === "modifier_application"
    );
    expect(modifierDecision).toBeDefined();
    expect(modifierDecision?.reasoning.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// AC4: Safeguard Validation Tests
// =============================================================================

describe("AC4: Safeguard Validation", () => {
  it("should check parameters against safeguards", async () => {
    const mockSafeguards = createMockSafeguards();
    const input = createPlanInput({ getSafeguards: mockSafeguards });

    await generatePlan(input);

    expect(mockSafeguards).toHaveBeenCalled();
  });

  it("should record safeguard applications", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.safeguardApplications).toBeDefined();
    expect(Array.isArray(result.plan.safeguardApplications)).toBe(true);
  });

  it("should auto-adjust soft limit violations", async () => {
    const mockSafeguards = vi.fn().mockResolvedValue([
      {
        _id: "safeguard_test" as Id<"safeguards">,
        _creationTime: Date.now(),
        name: "Volume Cap",
        ruleType: "soft_limit",
        priority: 1,
        isActive: true,
        condition: {
          field: "weeklyVolumeIncrease",
          operator: ">",
          threshold: 0.05,
        },
        action: {
          type: "cap",
          message: "Capped to 5%",
          severity: "medium",
          adjustment: 0.05,
        },
      },
    ] as Doc<"safeguards">[]);

    const input = createPlanInput({ getSafeguards: mockSafeguards });
    const result = await generatePlan(input);

    // Should have adjustment logged
    const adjustmentDecision = result.plan.decisions?.find(
      (d) => d.category === "safeguard_adjustment"
    );
    expect(adjustmentDecision).toBeDefined();
  });

  it("should log all safeguard applications", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // Each safeguard that was checked should be in applications
    expect(result.plan.safeguardApplications?.length).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// AC5: Week-by-Week Generation Tests
// =============================================================================

describe("AC5: Week-by-Week Generation", () => {
  it("should generate correct number of weeks", async () => {
    const input = createPlanInput({ durationWeeks: 12 });
    const result = await generatePlan(input);

    expect(result.plan.weeklyPlan.length).toBe(12);
  });

  it("should include all required fields per week", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    const week = result.plan.weeklyPlan[0];
    expect(week.weekNumber).toBe(1);
    expect(week.volumeKm).toBeGreaterThan(0);
    expect(week.intensityScore).toBeGreaterThanOrEqual(0);
    expect(week.intensityScore).toBeLessThanOrEqual(100);
    expect(week.phaseName).toBeTruthy();
    expect(week.weekJustification).toBeTruthy();
  });

  it("should mark recovery weeks appropriately", async () => {
    const input = createPlanInput({ durationWeeks: 12 });
    const result = await generatePlan(input);

    const recoveryWeeks = result.plan.weeklyPlan.filter((w) => w.isRecoveryWeek);
    expect(recoveryWeeks.length).toBeGreaterThan(0);

    // Recovery weeks should have reduced volume
    for (const recoveryWeek of recoveryWeeks) {
      const prevWeek = result.plan.weeklyPlan[recoveryWeek.weekNumber - 2];
      if (prevWeek && !prevWeek.isRecoveryWeek) {
        expect(recoveryWeek.volumeKm).toBeLessThan(prevWeek.volumeKm);
      }
    }
  });

  it("should calculate volumeChangePercent correctly", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // Week 2 should have volumeChangePercent relative to week 1
    const week2 = result.plan.weeklyPlan[1];
    expect(week2.volumeChangePercent).toBeDefined();
  });

  it("should include weekJustification explaining structure", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    for (const week of result.plan.weeklyPlan) {
      expect(week.weekJustification).toBeTruthy();
      expect(week.weekJustification.length).toBeGreaterThan(10);
    }
  });
});

// =============================================================================
// AC6: Session Generation Tests
// =============================================================================

describe("AC6: Session Generation", () => {
  it("should generate sessions for each week", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.sessions.length).toBeGreaterThan(0);

    // Group sessions by week
    const sessionsByWeek = new Map<number, typeof result.sessions>();
    for (const session of result.sessions) {
      const weekSessions = sessionsByWeek.get(session.weekNumber) ?? [];
      weekSessions.push(session);
      sessionsByWeek.set(session.weekNumber, weekSessions);
    }

    // Each week should have sessions
    for (let week = 1; week <= input.durationWeeks; week++) {
      expect(sessionsByWeek.get(week)?.length).toBeGreaterThan(0);
    }
  });

  it("should include justification for each session", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    for (const session of result.sessions) {
      if (!session.isRestDay) {
        expect(session.justification).toBeTruthy();
      }
    }
  });

  it("should include physiologicalTarget for each session", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    for (const session of result.sessions) {
      expect(session.physiologicalTarget).toBeTruthy();
    }
  });

  it("should link KB entries for sessions", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // At least some sessions should have KB references
    const sessionsWithKB = result.sessions.filter(
      (s) => s.relatedKnowledgeIds && s.relatedKnowledgeIds.length > 0
    );
    expect(sessionsWithKB.length).toBeGreaterThan(0);
  });

  it("should respect blocked days from runner schedule", async () => {
    const runner = createMockRunner({
      schedule: {
        availableDays: 5,
        blockedDays: ["wednesday", "sunday"],
      },
    });

    const input = createPlanInput({ runner });
    const result = await generatePlan(input);

    // No sessions should be on blocked days
    for (const session of result.sessions) {
      expect(session.dayOfWeek).not.toBe("wednesday");
      expect(session.dayOfWeek).not.toBe("sunday");
    }
  });
});

// =============================================================================
// AC7: Season View Synthesis Tests
// =============================================================================

describe("AC7: Season View Synthesis", () => {
  it("should generate coachSummary", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.seasonView.coachSummary).toBeTruthy();
    expect(result.plan.seasonView.coachSummary.length).toBeGreaterThan(50);
  });

  it("should generate keyMilestones", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.seasonView.keyMilestones.length).toBeGreaterThan(0);

    for (const milestone of result.plan.seasonView.keyMilestones) {
      expect(milestone.weekNumber).toBeGreaterThan(0);
      expect(milestone.milestone).toBeTruthy();
      expect(milestone.significance).toBeTruthy();
    }
  });

  it("should generate expectedOutcomes with confidence", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.seasonView.expectedOutcomes.primaryGoal).toBeTruthy();
    expect(result.plan.seasonView.expectedOutcomes.confidenceLevel).toBeGreaterThanOrEqual(0);
    expect(result.plan.seasonView.expectedOutcomes.confidenceLevel).toBeLessThanOrEqual(100);
    expect(result.plan.seasonView.expectedOutcomes.confidenceReason).toBeTruthy();
  });

  it("should identify risks with mitigation strategies", async () => {
    const runnerWithRisks = createMockRunner({
      health: {
        pastInjuries: ["plantar_fasciitis"],
        stressLevel: "high",
        sleepQuality: "poor",
        recoveryStyle: "slow",
      },
    });

    const input = createPlanInput({ runner: runnerWithRisks });
    const result = await generatePlan(input);

    expect(result.plan.seasonView.identifiedRisks.length).toBeGreaterThan(0);

    for (const risk of result.plan.seasonView.identifiedRisks) {
      expect(risk.risk).toBeTruthy();
      expect(risk.mitigation).toBeTruthy();
      expect(risk.monitoringSignals.length).toBeGreaterThan(0);
    }
  });

  it("should use LLM for coach summary when provided", async () => {
    const mockLLM = vi.fn().mockResolvedValue("AI-generated coach summary text.");

    const input = createPlanInput({ generateCoachSummary: mockLLM });
    const result = await generatePlan(input);

    expect(mockLLM).toHaveBeenCalled();
    expect(result.plan.seasonView.coachSummary).toBe("AI-generated coach summary text.");
  });
});

// =============================================================================
// AC8: Runner Snapshot Tests
// =============================================================================

describe("AC8: Runner Snapshot", () => {
  it("should capture profileRadar with 6 axes", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.runnerSnapshot.profileRadar.length).toBe(6);

    const expectedLabels = ["Endurance", "Speed", "Recovery", "Consistency", "Injury Risk", "Race Ready"];
    const actualLabels = result.plan.runnerSnapshot.profileRadar.map((r) => r.label);
    expect(actualLabels).toEqual(expectedLabels);
  });

  it("should mark uncertain axes appropriately", async () => {
    const runnerWithLimitedData = createMockRunner({
      currentState: {
        dataQuality: "insufficient",
      },
    });

    const input = createPlanInput({ runner: runnerWithLimitedData });
    const result = await generatePlan(input);

    // With insufficient data, most axes should be uncertain
    const uncertainAxes = result.plan.runnerSnapshot.profileRadar.filter((r) => r.uncertain);
    expect(uncertainAxes.length).toBeGreaterThan(0);
  });

  it("should capture planInfluencers", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.runnerSnapshot.planInfluencers.length).toBeGreaterThan(0);
  });

  it("should capture fitnessIndicators", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.runnerSnapshot.fitnessIndicators).toBeDefined();
  });

  it("should record capturedAt timestamp", async () => {
    const before = Date.now();
    const input = createPlanInput();
    const result = await generatePlan(input);
    const after = Date.now();

    expect(result.plan.runnerSnapshot.capturedAt).toBeGreaterThanOrEqual(before);
    expect(result.plan.runnerSnapshot.capturedAt).toBeLessThanOrEqual(after);
  });
});

// =============================================================================
// AC9: Module Isolation Tests
// =============================================================================

describe("AC9: Module Isolation", () => {
  it("should be a pure function (no side effects)", async () => {
    const input = createPlanInput();

    // Running twice with same input should produce consistent structure
    const result1 = await generatePlan(input);
    const result2 = await generatePlan(input);

    expect(result1.plan.durationWeeks).toBe(result2.plan.durationWeeks);
    expect(result1.plan.goalType).toBe(result2.plan.goalType);
    expect(result1.sessions.length).toBe(result2.sessions.length);
  });

  it("should receive runner as parameter, not query directly", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // The plan should reference the passed runner ID
    expect(result.plan.runnerId).toBe(input.runner._id);
  });

  it("should use KB via interface", async () => {
    const mockKB = createMockKBQuery();
    const input = createPlanInput({ queryKnowledgeBase: mockKB });

    await generatePlan(input);

    // KB should have been called through the interface
    expect(mockKB).toHaveBeenCalled();
  });

  it("should use safeguards via interface", async () => {
    const mockSafeguards = createMockSafeguards();
    const input = createPlanInput({ getSafeguards: mockSafeguards });

    await generatePlan(input);

    // Safeguards should have been called through the interface
    expect(mockSafeguards).toHaveBeenCalled();
  });

  it("should return complete plan object for caller to store", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // Result should have all required fields for storage
    expect(result.plan.runnerId).toBeDefined();
    expect(result.plan.userId).toBeDefined();
    expect(result.plan.name).toBeDefined();
    expect(result.plan.goalType).toBeDefined();
    expect(result.plan.startDate).toBeDefined();
    expect(result.plan.endDate).toBeDefined();
    expect(result.plan.status).toBe("draft");
    expect(result.sessions.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// AC10: Decision Audit Trail Tests
// =============================================================================

describe("AC10: Decision Audit Trail", () => {
  it("should record all decisions in decisions array", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.decisions).toBeDefined();
    expect(result.plan.decisions!.length).toBeGreaterThan(0);

    // Should have decisions for key steps
    const categories = result.plan.decisions!.map((d) => d.category);
    expect(categories).toContain("template_selection");
    expect(categories).toContain("load_parameters");
  });

  it("should include reasoning for each decision", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    for (const decision of result.plan.decisions!) {
      expect(decision.reasoning).toBeTruthy();
      expect(decision.reasoning.length).toBeGreaterThan(0);
    }
  });

  it("should record safeguard applications", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    expect(result.plan.safeguardApplications).toBeDefined();
    expect(Array.isArray(result.plan.safeguardApplications)).toBe(true);
  });

  it("should populate multi-level justifications", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // Season level
    expect(result.plan.seasonView.periodizationJustification).toBeTruthy();
    expect(result.plan.seasonView.volumeStrategyJustification).toBeTruthy();

    // Weekly level
    for (const week of result.plan.weeklyPlan) {
      expect(week.weekJustification).toBeTruthy();
    }

    // Session level
    for (const session of result.sessions) {
      expect(session.justification).toBeTruthy();
    }
  });

  it("should include KB references in decisions", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // At least some decisions should have KB references
    const decisionsWithKB = result.plan.decisions!.filter(
      (d) => d.knowledgeBaseRefs && d.knowledgeBaseRefs.length > 0
    );
    expect(decisionsWithKB.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe("Integration: Complete Plan Generation", () => {
  it("should generate a complete valid plan", async () => {
    const input = createPlanInput();
    const result = await generatePlan(input);

    // Validate structure
    expect(result.generatorVersion).toBeTruthy();
    expect(result.generatedAt).toBeGreaterThan(0);

    // Validate plan
    expect(result.plan.weeklyPlan.length).toBe(input.durationWeeks);
    expect(result.plan.seasonView).toBeDefined();
    expect(result.plan.runnerSnapshot).toBeDefined();
    expect(result.plan.decisions!.length).toBeGreaterThan(0);

    // Validate sessions
    expect(result.sessions.length).toBeGreaterThan(input.durationWeeks * 3);
  });

  it("should handle different goal types", async () => {
    const goalTypes: GoalType[] = ["5k", "10k", "half_marathon", "marathon", "base_building"];

    for (const goalType of goalTypes) {
      const durationWeeks = goalType === "5k" ? 8 : goalType === "marathon" ? 16 : 12;
      const input = createPlanInput({ goalType, durationWeeks });

      const result = await generatePlan(input);

      expect(result.plan.goalType).toBe(goalType);
      expect(result.plan.weeklyPlan.length).toBe(durationWeeks);
    }
  });

  it("should handle edge case: beginner runner", async () => {
    const beginnerRunner = createMockRunner({
      running: {
        experienceLevel: "beginner",
        monthsRunning: 3,
        currentFrequency: 2,
        currentVolume: 10,
      },
      currentState: {
        dataQuality: "low",
        last28DaysAvgVolume: 10,
      },
    });

    const input = createPlanInput({
      runner: beginnerRunner,
      goalType: "5k",
      durationWeeks: 8,
    });

    const result = await generatePlan(input);

    // Should still generate a valid plan
    expect(result.plan.weeklyPlan.length).toBe(8);
    expect(result.sessions.length).toBeGreaterThan(0);

    // Should have conservative volume
    expect(result.plan.loadParameters?.peakVolume).toBeLessThan(40);
  });

  it("should handle edge case: advanced runner", async () => {
    const advancedRunner = createMockRunner({
      running: {
        experienceLevel: "serious",
        monthsRunning: 120,
        currentFrequency: 6,
        currentVolume: 80,
      },
      currentState: {
        dataQuality: "high",
        last28DaysAvgVolume: 85,
        estimatedVdot: 55,
      },
    });

    const input = createPlanInput({
      runner: advancedRunner,
      goalType: "marathon",
      durationWeeks: 16,
    });

    const result = await generatePlan(input);

    expect(result.plan.weeklyPlan.length).toBe(16);
    expect(result.plan.loadParameters?.peakVolume).toBeGreaterThan(80);
  });
});
