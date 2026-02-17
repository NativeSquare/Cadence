/**
 * Permission Denied Card Tests (Story 8.4)
 *
 * Tests for permission guidance constants and structure.
 *
 * Source: Story 8.4 - AC#1 (guidance), AC#3 (instructions), AC#4 (HealthKit)
 */

import { describe, it, expect } from "vitest";
import {
  PERMISSION_GUIDANCE,
  type PermissionType,
  type PermissionGuidance,
} from "./PermissionDeniedCard";

// =============================================================================
// Test Fixtures
// =============================================================================

const ALL_PERMISSION_TYPES: PermissionType[] = [
  "healthkit",
  "microphone",
  "notifications",
  "camera",
  "location",
];

// =============================================================================
// Tests: Permission Guidance Constants (Story 8.4 Task 4)
// =============================================================================

describe("Permission Guidance Constants", () => {
  it("should have guidance for all permission types", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      expect(PERMISSION_GUIDANCE[type]).toBeDefined();
    }
  });

  it("should have required fields for all guidance entries", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      const guidance = PERMISSION_GUIDANCE[type];
      expect(guidance.title).toBeDefined();
      expect(guidance.title.length).toBeGreaterThan(0);
      expect(guidance.message).toBeDefined();
      expect(guidance.message.length).toBeGreaterThan(0);
      expect(guidance.instructions).toBeDefined();
      expect(guidance.instructions.length).toBeGreaterThan(0);
    }
  });

  it("should have user-friendly titles (not technical jargon)", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      const guidance = PERMISSION_GUIDANCE[type];
      // Titles should not contain technical terms
      expect(guidance.title.toLowerCase()).not.toContain("error");
      expect(guidance.title.toLowerCase()).not.toContain("exception");
      expect(guidance.title.toLowerCase()).not.toContain("permission denied");
    }
  });

  it("should have actionable instructions", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      const guidance = PERMISSION_GUIDANCE[type];
      // At least one instruction should mention Settings
      const hasSettingsInstruction = guidance.instructions.some(
        (i) => i.toLowerCase().includes("settings") || i.toLowerCase().includes("tap")
      );
      expect(hasSettingsInstruction).toBe(true);
    }
  });
});

// =============================================================================
// Tests: HealthKit Specific Guidance (Story 8.4 AC#4)
// =============================================================================

describe("HealthKit Permission Guidance", () => {
  const healthkitGuidance = PERMISSION_GUIDANCE.healthkit;

  it("should mention Apple Health in title", () => {
    expect(healthkitGuidance.title.toLowerCase()).toContain("health");
  });

  it("should explain how to enable in Settings", () => {
    const combinedInstructions = healthkitGuidance.instructions.join(" ").toLowerCase();
    expect(combinedInstructions).toContain("settings");
  });

  it("should provide alternative instructions", () => {
    expect(healthkitGuidance.alternativeInstructions).toBeDefined();
    expect(healthkitGuidance.alternativeInstructions!.length).toBeGreaterThan(0);
  });

  it("should mention Health app in alternative instructions", () => {
    const altInstructions = healthkitGuidance.alternativeInstructions!.join(" ").toLowerCase();
    expect(altInstructions).toContain("health");
  });
});

// =============================================================================
// Tests: Microphone Permission Guidance (Story 8.4 AC#2)
// =============================================================================

describe("Microphone Permission Guidance", () => {
  const microphoneGuidance = PERMISSION_GUIDANCE.microphone;

  it("should have clear title about microphone", () => {
    expect(microphoneGuidance.title.toLowerCase()).toContain("microphone");
  });

  it("should explain voice input requirement", () => {
    expect(microphoneGuidance.message.toLowerCase()).toContain("voice");
  });

  it("should provide Settings instructions", () => {
    const instructions = microphoneGuidance.instructions.join(" ").toLowerCase();
    expect(instructions).toContain("settings");
  });
});

// =============================================================================
// Tests: Guidance Structure Validation
// =============================================================================

describe("Guidance Structure", () => {
  it("should have numbered instructions (implied by array)", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      const guidance = PERMISSION_GUIDANCE[type];
      // Instructions should be an array to be rendered as numbered list
      expect(Array.isArray(guidance.instructions)).toBe(true);
      expect(guidance.instructions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("should have reasonable instruction lengths", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      const guidance = PERMISSION_GUIDANCE[type];
      for (const instruction of guidance.instructions) {
        // Instructions should be concise (under 100 chars each)
        expect(instruction.length).toBeLessThan(100);
        // But not too short to be useful
        expect(instruction.length).toBeGreaterThan(10);
      }
    }
  });

  it("should end instructions with return step", () => {
    for (const type of ALL_PERMISSION_TYPES) {
      const guidance = PERMISSION_GUIDANCE[type];
      const lastInstruction = guidance.instructions[guidance.instructions.length - 1].toLowerCase();
      // Last instruction should mention returning or trying again
      expect(
        lastInstruction.includes("return") ||
        lastInstruction.includes("try again") ||
        lastInstruction.includes("come back")
      ).toBe(true);
    }
  });
});
