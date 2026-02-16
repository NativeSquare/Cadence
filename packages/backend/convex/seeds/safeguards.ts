import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../table/admin";

// =============================================================================
// Safeguards Seed Data (Story 6.4)
// =============================================================================
// AC #3: Minimum 10 safeguards seeded per specification.
//
// Categories covered:
// - Volume Safeguards (10% rule, injury history)
// - Frequency Safeguards (consecutive days, rest days)
// - Intensity Safeguards (hard sessions for beginners)
// - Recovery Safeguards (age 50+, injury return)
// - Phase Safeguards (speed work timing, taper)

type SafeguardSeedEntry = {
  name: string;
  description: string;
  category: "volume" | "intensity" | "frequency" | "recovery" | "safety";
  ruleType: "hard_limit" | "soft_limit" | "warning";
  condition: {
    field: string;
    operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "contains";
    threshold: unknown;
    applicableWhen?: {
      experienceLevel?: string[];
      hasInjuryHistory?: boolean;
      injuryTypes?: string[];
      age?: { operator: ">" | "<" | ">=" | "<=" | "==" | "!="; value: number };
      currentPhase?: string[];
    };
  };
  action: {
    type: "cap" | "reduce" | "block" | "warn" | "require_confirmation";
    adjustment?: unknown;
    message: string;
    severity: "info" | "warning" | "critical";
  };
  source: string;
  rationale: string;
  priority: number;
};

const SAFEGUARDS_SEEDS: SafeguardSeedEntry[] = [
  // ==========================================================================
  // VOLUME SAFEGUARDS
  // ==========================================================================
  {
    name: "max_volume_increase_10_percent",
    description: "Weekly volume cannot increase more than 10% from previous week",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0.1,
    },
    action: {
      type: "cap",
      adjustment: 0.1,
      message: "Volume increase capped at 10% to prevent overuse injury",
      severity: "warning",
    },
    source: "established_practice",
    rationale:
      "Rapid volume increases are the #1 cause of running injuries. The 10% rule provides a safe progression guideline.",
    priority: 10,
  },
  {
    name: "max_volume_increase_injury_history",
    description:
      "Runners with injury history limited to 7% volume increase",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0.07,
      applicableWhen: {
        hasInjuryHistory: true,
      },
    },
    action: {
      type: "cap",
      adjustment: 0.07,
      message: "Volume increase capped at 7% due to injury history",
      severity: "warning",
    },
    source: "established_practice",
    rationale:
      "Injury history increases re-injury risk with rapid progressions. Conservative approach protects recovery.",
    priority: 5, // Higher priority than general 10% rule (lower number)
  },
  {
    name: "long_run_max_30_percent",
    description:
      "Long run should not exceed 30% of weekly volume",
    category: "volume",
    ruleType: "soft_limit",
    condition: {
      field: "longRunPercentage",
      operator: ">",
      threshold: 0.3,
    },
    action: {
      type: "cap",
      adjustment: 0.3,
      message: "Long run capped at 30% of weekly volume to balance training stress",
      severity: "info",
    },
    source: "daniels_running_formula",
    rationale:
      "Excessive long run percentage creates unbalanced training stress and increases injury risk.",
    priority: 20,
  },
  {
    name: "no_volume_increase_post_injury",
    description:
      "No volume increase for 4 weeks after returning from injury",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0,
      applicableWhen: {
        hasInjuryHistory: true,
      },
    },
    action: {
      type: "cap",
      adjustment: 0,
      message:
        "Volume maintained at current level during post-injury return period",
      severity: "critical",
    },
    source: "sports_medicine",
    rationale:
      "First 4 weeks post-injury require volume stabilization to prevent re-injury.",
    priority: 1, // Highest priority for safety
  },

  // ==========================================================================
  // FREQUENCY SAFEGUARDS
  // ==========================================================================
  {
    name: "no_consecutive_hard_days",
    description: "Hard workouts cannot be scheduled on consecutive days",
    category: "frequency",
    ruleType: "hard_limit",
    condition: {
      field: "consecutiveHardDays",
      operator: ">",
      threshold: 1,
    },
    action: {
      type: "block",
      message: "Cannot schedule hard workouts on consecutive days - recovery required",
      severity: "critical",
    },
    source: "established_practice",
    rationale:
      "Consecutive hard days prevent recovery and increase injury risk significantly.",
    priority: 3,
  },
  {
    name: "minimum_one_rest_day",
    description: "At least one complete rest day per week required",
    category: "frequency",
    ruleType: "hard_limit",
    condition: {
      field: "restDaysPerWeek",
      operator: "<",
      threshold: 1,
    },
    action: {
      type: "block",
      message: "Minimum one rest day per week required for recovery",
      severity: "critical",
    },
    source: "established_practice",
    rationale:
      "Complete rest is essential for physiological adaptation and injury prevention.",
    priority: 2,
  },

  // ==========================================================================
  // INTENSITY SAFEGUARDS
  // ==========================================================================
  {
    name: "max_hard_sessions_beginner",
    description:
      "Beginners limited to maximum 2 hard sessions per week",
    category: "intensity",
    ruleType: "hard_limit",
    condition: {
      field: "hardSessionsPerWeek",
      operator: ">",
      threshold: 2,
      applicableWhen: {
        experienceLevel: ["beginner"],
      },
    },
    action: {
      type: "cap",
      adjustment: 2,
      message: "Beginners limited to 2 hard sessions per week",
      severity: "warning",
    },
    source: "established_practice",
    rationale:
      "Beginners need more recovery time between quality sessions to adapt safely.",
    priority: 15,
  },
  {
    name: "no_speed_work_base_phase",
    description: "No speed work during base building phase",
    category: "intensity",
    ruleType: "soft_limit",
    condition: {
      field: "hasSpeedWork",
      operator: "==",
      threshold: true,
      applicableWhen: {
        currentPhase: ["base"],
      },
    },
    action: {
      type: "warn",
      message:
        "Speed work typically avoided during base phase - aerobic development prioritized",
      severity: "info",
    },
    source: "lydiard_method",
    rationale:
      "Base phase focuses on aerobic development; speed work is more effective after aerobic foundation is built.",
    priority: 25,
  },

  // ==========================================================================
  // RECOVERY SAFEGUARDS
  // ==========================================================================
  {
    name: "age_50_plus_extra_recovery",
    description:
      "Runners 50+ require additional recovery between hard sessions",
    category: "recovery",
    ruleType: "soft_limit",
    condition: {
      field: "daysBetweenHardSessions",
      operator: "<",
      threshold: 3,
      applicableWhen: {
        age: { operator: ">=", value: 50 },
      },
    },
    action: {
      type: "cap",
      adjustment: 3,
      message: "Runners 50+ benefit from 3+ days between hard sessions",
      severity: "info",
    },
    source: "masters_running",
    rationale:
      "Recovery capacity decreases with age; additional rest improves adaptation and reduces injury risk.",
    priority: 30,
  },
  {
    name: "marathon_taper_minimum_10_days",
    description: "Marathon requires minimum 10 days taper",
    category: "recovery",
    ruleType: "soft_limit",
    condition: {
      field: "taperDays",
      operator: "<",
      threshold: 10,
      applicableWhen: {
        currentPhase: ["taper"],
      },
    },
    action: {
      type: "cap",
      adjustment: 10,
      message: "Marathon taper extended to minimum 10 days for adequate recovery",
      severity: "warning",
    },
    source: "pfitzinger",
    rationale:
      "Marathon distance requires extended taper for glycogen restoration and tissue repair.",
    priority: 35,
  },

  // ==========================================================================
  // SAFETY SAFEGUARDS
  // ==========================================================================
  {
    name: "max_weekly_volume_absolute",
    description: "Absolute maximum weekly volume based on experience",
    category: "safety",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeKm",
      operator: ">",
      threshold: 100,
      applicableWhen: {
        experienceLevel: ["beginner", "intermediate"],
      },
    },
    action: {
      type: "cap",
      adjustment: 100,
      message:
        "Weekly volume capped at 100km for non-advanced runners",
      severity: "critical",
    },
    source: "established_practice",
    rationale:
      "Extreme volumes require years of progressive adaptation and are inappropriate for most runners.",
    priority: 4,
  },
  {
    name: "warn_high_intensity_ratio",
    description: "Warning when high intensity exceeds 20% of training",
    category: "safety",
    ruleType: "warning",
    condition: {
      field: "highIntensityRatio",
      operator: ">",
      threshold: 0.2,
    },
    action: {
      type: "warn",
      message:
        "High intensity work exceeds 20% of training - consider polarized approach",
      severity: "info",
    },
    source: "research",
    rationale:
      "Polarized training research suggests ~80/20 easy/hard split optimizes adaptation.",
    priority: 40,
  },
];

/**
 * Seed the safeguards table with safety rules.
 * AC #3: Creates 10+ safeguards per specification.
 */
export const seedSafeguards = mutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    safeguards: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const insertedSafeguards: string[] = [];

    for (const seed of SAFEGUARDS_SEEDS) {
      await ctx.db.insert("safeguards", {
        name: seed.name,
        description: seed.description,
        category: seed.category,
        ruleType: seed.ruleType,
        condition: seed.condition,
        action: seed.action,
        source: seed.source,
        rationale: seed.rationale,
        isActive: true,
        priority: seed.priority,
        createdAt: now,
        updatedAt: now,
      });
      insertedSafeguards.push(seed.name);
    }

    return {
      inserted: insertedSafeguards.length,
      safeguards: insertedSafeguards,
    };
  },
});

/**
 * Clear all safeguards entries.
 * Useful for re-seeding during development.
 * ADMIN ONLY - requires admin role to execute.
 */
export const clearSafeguards = mutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    // Require admin authorization for destructive operation
    await requireAdmin(ctx);

    const entries = await ctx.db.query("safeguards").collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    return {
      deleted: entries.length,
    };
  },
});
