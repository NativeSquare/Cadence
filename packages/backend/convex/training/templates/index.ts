/**
 * Plan Templates Index (Story 6.5 - Task 2)
 *
 * Template registry and selection logic.
 * Exports all templates and the selectTemplate function.
 */

export * from "./types";

import type { GoalType, PlanTemplate } from "./types";
import { fiveKTemplate } from "./5k";
import { tenKTemplate } from "./10k";
import { halfMarathonTemplate } from "./half-marathon";
import { marathonTemplate } from "./marathon";
import { baseBuildingTemplate } from "./base-building";

/**
 * Template registry - all available plan templates
 */
export const TEMPLATES: Record<GoalType, PlanTemplate> = {
  "5k": fiveKTemplate,
  "10k": tenKTemplate,
  "half_marathon": halfMarathonTemplate,
  "marathon": marathonTemplate,
  "base_building": baseBuildingTemplate,
};

/**
 * Select the appropriate template based on goal type and duration.
 *
 * @param goalType - The type of goal (5k, 10k, half_marathon, marathon, base_building)
 * @param durationWeeks - Requested plan duration in weeks
 * @returns The matching PlanTemplate
 * @throws Error if no suitable template found or duration out of range
 */
export function selectTemplate(goalType: GoalType, durationWeeks: number): PlanTemplate {
  const template = TEMPLATES[goalType];

  if (!template) {
    throw new Error(`No template found for goal type: ${goalType}`);
  }

  // Validate duration falls within template constraints
  if (durationWeeks < template.minWeeks) {
    throw new Error(
      `Plan duration ${durationWeeks} weeks is below minimum of ${template.minWeeks} weeks for ${goalType}`
    );
  }

  if (durationWeeks > template.maxWeeks) {
    throw new Error(
      `Plan duration ${durationWeeks} weeks exceeds maximum of ${template.maxWeeks} weeks for ${goalType}`
    );
  }

  return template;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): PlanTemplate[] {
  return Object.values(TEMPLATES);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PlanTemplate | undefined {
  return Object.values(TEMPLATES).find(t => t.id === id);
}

/**
 * Check if a duration is valid for a given goal type
 */
export function isValidDuration(goalType: GoalType, durationWeeks: number): boolean {
  const template = TEMPLATES[goalType];
  if (!template) return false;
  return durationWeeks >= template.minWeeks && durationWeeks <= template.maxWeeks;
}

/**
 * Get recommended duration for a goal type
 */
export function getRecommendedDuration(goalType: GoalType): number {
  const template = TEMPLATES[goalType];
  if (!template) {
    throw new Error(`No template found for goal type: ${goalType}`);
  }
  return template.recommendedWeeks;
}

// Re-export individual templates for direct access if needed
export { fiveKTemplate } from "./5k";
export { tenKTemplate } from "./10k";
export { halfMarathonTemplate } from "./half-marathon";
export { marathonTemplate } from "./marathon";
export { baseBuildingTemplate } from "./base-building";
