import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../table/admin";

// =============================================================================
// Knowledge Base Seed Data (Story 6.3)
// =============================================================================
// Minimum 15 entries covering training science knowledge.
// AC #3: Seed data per specification
//
// Categories covered:
// - Training Principles (10% rule, periodization)
// - Physiology (HR zones, easy running)
// - Injury Prevention (shin splints, IT band, plantar fasciitis)
// - Recovery Guidance

type KnowledgeSeedEntry = {
  category:
    | "physiology"
    | "training_principles"
    | "periodization"
    | "recovery"
    | "injury_prevention"
    | "nutrition"
    | "mental";
  subcategory?: string;
  tags: string[];
  title: string;
  content: string;
  summary: string;
  applicableGoals?: string[];
  applicableExperience?: string[];
  applicablePhases?: string[];
  source: string;
  sourceReference?: string;
  confidence: "established" | "well_supported" | "emerging" | "experimental";
  usageContext: "plan_generation" | "coaching_advice" | "explanation" | "safety";
};

const KNOWLEDGE_BASE_SEEDS: KnowledgeSeedEntry[] = [
  // ==========================================================================
  // TRAINING PRINCIPLES
  // ==========================================================================
  {
    category: "training_principles",
    subcategory: "progression",
    title: "10% Rule for Volume Increase",
    content:
      "Weekly training volume should not increase by more than 10% week-over-week to minimize injury risk. This applies to total distance, not individual workout intensity. The rule provides a safe progression guideline that allows the musculoskeletal system adequate time to adapt. Exceptions may apply during base building phases with very low starting volumes, or for experienced runners returning from a planned break.",
    summary: "Limit weekly volume increase to 10% to prevent overuse injuries",
    tags: ["volume", "progression", "injury_prevention", "safety"],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base", "build"],
    source: "established_practice",
    sourceReference: "Multiple studies including Nielsen et al. (2012)",
    confidence: "established",
    usageContext: "plan_generation",
  },
  {
    category: "training_principles",
    subcategory: "intensity_distribution",
    title: "Polarized Training Distribution",
    content:
      "The polarized training model suggests approximately 80% of training should be at low intensity (Zone 1-2) and 20% at high intensity (Zone 4-5), with minimal time spent in Zone 3 (tempo/threshold). This approach maximizes aerobic development while allowing adequate recovery between hard sessions. Research shows this distribution produces better performance outcomes than threshold-heavy approaches for distance runners.",
    summary: "80% easy, 20% hard - minimize moderate intensity",
    tags: ["intensity", "zones", "aerobic", "distribution"],
    applicableGoals: ["race", "base_building"],
    applicableExperience: ["intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak"],
    source: "research_paper",
    sourceReference: "Seiler & Kjerland (2006), Stöggl & Sperlich (2014)",
    confidence: "established",
    usageContext: "plan_generation",
  },
  {
    category: "training_principles",
    subcategory: "long_run",
    title: "Long Run Percentage Guidelines",
    content:
      "The weekly long run should typically comprise 25-30% of total weekly mileage for most runners. For beginners, staying closer to 25% provides adequate stimulus with lower injury risk. Advanced runners may safely push toward 30-35% during peak training. The long run should never exceed 3 hours for most recreational runners to limit excessive stress and optimize recovery.",
    summary: "Long run should be 25-30% of weekly volume",
    tags: ["long_run", "volume", "endurance", "percentage"],
    applicableGoals: ["race", "base_building"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak"],
    source: "daniels_running_formula",
    sourceReference: "Jack Daniels - Daniels Running Formula, 3rd Ed.",
    confidence: "established",
    usageContext: "plan_generation",
  },
  {
    category: "training_principles",
    subcategory: "speed_work",
    title: "Speed Work Introduction Timing",
    content:
      "Speed work (intervals, tempo runs, repetitions) should only be introduced after establishing a solid aerobic base of 4-8 weeks of consistent running. For beginners, this means completing at least 4 weeks of regular easy running before any structured faster work. Introducing intensity too early increases injury risk and limits long-term development. The aerobic base provides the foundation that makes quality speed work effective.",
    summary: "Build 4-8 weeks aerobic base before adding speed work",
    tags: ["speed_work", "intervals", "base_building", "progression"],
    applicableGoals: ["race", "general_fitness"],
    applicableExperience: ["beginner", "intermediate"],
    applicablePhases: ["base", "build"],
    source: "established_practice",
    sourceReference: "Lydiard method, Pfitzinger Advanced Marathoning",
    confidence: "well_supported",
    usageContext: "plan_generation",
  },

  // ==========================================================================
  // PERIODIZATION
  // ==========================================================================
  {
    category: "periodization",
    subcategory: "general",
    title: "Periodization Principles",
    content:
      "Training should be organized into distinct phases (periods) with specific goals: Base phase builds aerobic foundation with high volume/low intensity. Build phase introduces quality workouts and race-specific training. Peak phase includes race-pace work and sharpening. Taper phase reduces volume while maintaining intensity before goal race. Each phase typically lasts 3-6 weeks depending on race distance and timeline.",
    summary: "Organize training into Base → Build → Peak → Taper phases",
    tags: ["periodization", "phases", "planning", "structure"],
    applicableGoals: ["race"],
    applicableExperience: ["intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak", "taper"],
    source: "established_practice",
    sourceReference: "Bompa Periodization Theory, multiple sources",
    confidence: "established",
    usageContext: "plan_generation",
  },
  {
    category: "periodization",
    subcategory: "taper",
    title: "Taper Guidelines",
    content:
      "An effective taper reduces training volume by 40-60% over 2-3 weeks while maintaining workout intensity and frequency. For 5K-10K races, a 10-14 day taper is typically sufficient. Half marathons benefit from 2 weeks. Marathons require 3 weeks. The key is reducing volume while keeping legs sharp with shorter, faster efforts. Avoid introducing new workouts during taper.",
    summary: "Reduce volume 40-60% over 2-3 weeks, maintain intensity",
    tags: ["taper", "race_prep", "volume", "recovery"],
    applicableGoals: ["race"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["taper"],
    source: "research_paper",
    sourceReference: "Mujika & Padilla (2003) tapering meta-analysis",
    confidence: "established",
    usageContext: "plan_generation",
  },

  // ==========================================================================
  // PHYSIOLOGY
  // ==========================================================================
  {
    category: "physiology",
    subcategory: "heart_rate",
    title: "Easy Running Heart Rate Zones",
    content:
      "Easy running should be performed at 65-75% of maximum heart rate (HRmax), or roughly Zone 1-2. At this intensity, runners should be able to hold a conversation comfortably. This pace develops aerobic capacity, builds capillary density, strengthens connective tissue, and allows for daily training. Most runners run their easy days too fast, which compromises recovery and limits the effectiveness of hard days.",
    summary: "Easy runs at 65-75% HRmax - conversational pace",
    tags: ["heart_rate", "easy_running", "zones", "aerobic"],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak", "taper"],
    source: "established_practice",
    sourceReference: "Multiple sources including Maffetone, Fitzgerald",
    confidence: "established",
    usageContext: "coaching_advice",
  },
  {
    category: "physiology",
    subcategory: "vo2max",
    title: "VO2max Training Intensity",
    content:
      "VO2max intervals should be run at 95-100% of VO2max pace, typically 3K-5K race pace effort. Standard protocols include 3-5 minute repeats with equal recovery, or shorter 1000m-1200m repeats. Total hard running volume should be 3-5km per session. These workouts improve maximal aerobic capacity and running economy. They are highly effective but also highly stressful - limit to once per week maximum.",
    summary: "VO2max work at 95-100% effort, 3-5km total hard volume per session",
    tags: ["vo2max", "intervals", "high_intensity", "aerobic_capacity"],
    applicableGoals: ["race"],
    applicableExperience: ["intermediate", "advanced"],
    applicablePhases: ["build", "peak"],
    source: "daniels_running_formula",
    sourceReference: "Jack Daniels Running Formula",
    confidence: "established",
    usageContext: "plan_generation",
  },

  // ==========================================================================
  // INJURY PREVENTION
  // ==========================================================================
  {
    category: "injury_prevention",
    subcategory: "shin_splints",
    title: "Managing Shin Splints",
    content:
      "Shin splints (medial tibial stress syndrome) typically result from too rapid increases in training load. Management includes: reducing weekly mileage by 25-50%, avoiding hard surfaces when possible, incorporating calf strengthening (heel raises, toe walks), checking shoe wear and considering gait analysis. Return to full training gradually over 2-4 weeks once pain-free. Persistent pain beyond 2 weeks warrants medical evaluation to rule out stress fracture.",
    summary: "Reduce volume 25-50%, strengthen calves, gradual return",
    tags: [
      "shin_splints",
      "injury",
      "overuse",
      "tibial",
      "lower_leg",
      "prevention",
    ],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate"],
    source: "established_practice",
    sourceReference: "Sports medicine consensus guidelines",
    confidence: "well_supported",
    usageContext: "safety",
  },
  {
    category: "injury_prevention",
    subcategory: "it_band",
    title: "Managing IT Band Syndrome",
    content:
      "Iliotibial band syndrome causes lateral knee pain, often occurring after a consistent distance or time. Management includes: foam rolling the lateral thigh (not directly on IT band), hip strengthening exercises (especially hip abductors like clamshells), reducing weekly volume, avoiding excessive downhill running. Cross-training with cycling or swimming maintains fitness during recovery. Gradual return over 2-4 weeks once pain-free during easy running.",
    summary: "Hip strengthening, foam rolling, reduce volume, avoid downhills",
    tags: [
      "it_band",
      "itbs",
      "injury",
      "knee",
      "hip",
      "overuse",
      "lateral_knee",
      "prevention",
    ],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    source: "established_practice",
    sourceReference: "Sports medicine consensus, physical therapy protocols",
    confidence: "well_supported",
    usageContext: "safety",
  },
  {
    category: "injury_prevention",
    subcategory: "plantar_fasciitis",
    title: "Managing Plantar Fasciitis",
    content:
      "Plantar fasciitis causes heel/arch pain, often worst with first steps in the morning. Management includes: calf stretching and strengthening, rolling foot on frozen water bottle, night splints to maintain stretch, supportive footwear. Running may continue at reduced volume if pain stays below 3/10. Complete rest is rarely necessary but avoid barefoot walking. Recovery typically takes 6-12 weeks with consistent treatment.",
    summary: "Calf work, ice massage, supportive shoes, gradual return",
    tags: [
      "plantar_fasciitis",
      "injury",
      "foot",
      "heel",
      "arch",
      "overuse",
      "prevention",
    ],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    source: "established_practice",
    sourceReference: "ACSM guidelines, podiatric medicine consensus",
    confidence: "well_supported",
    usageContext: "safety",
  },

  // ==========================================================================
  // RECOVERY
  // ==========================================================================
  {
    category: "recovery",
    subcategory: "age_adjustment",
    title: "Recovery Requirements by Age",
    content:
      "Recovery capacity decreases with age, requiring adjustments to training structure. Runners over 40 benefit from additional easy days between hard workouts (2 easy days vs 1). Runners over 50 may need 3 easy days between quality sessions. Cross-training can maintain fitness while reducing impact stress. Sleep quality and duration become increasingly important. Consider replacing one run per week with cross-training for runners over 45.",
    summary: "Older runners need more recovery days between hard efforts",
    tags: ["recovery", "age", "masters", "rest", "adaptation"],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak"],
    source: "established_practice",
    sourceReference: "Fitzgerald Run Strong Stay Hungry, Galloway",
    confidence: "well_supported",
    usageContext: "plan_generation",
  },
  {
    category: "recovery",
    subcategory: "post_race",
    title: "Post-Race Recovery Guidelines",
    content:
      "Recovery time after races depends on distance: 5K requires 3-5 days easy running. 10K needs 5-7 days. Half marathon needs 10-14 days before quality work. Marathon requires 3-4 weeks of reduced training. The rule of thumb is one easy day per mile raced before resuming hard training. During recovery, easy running aids blood flow and healing. Avoid racing again within 2 weeks of any race over 10K.",
    summary: "One easy day per mile raced before hard training resumes",
    tags: ["recovery", "post_race", "rest", "adaptation", "racing"],
    applicableGoals: ["race"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base"],
    source: "established_practice",
    sourceReference: "Multiple coaching sources",
    confidence: "established",
    usageContext: "plan_generation",
  },
  {
    category: "recovery",
    subcategory: "sleep",
    title: "Sleep Requirements for Runners",
    content:
      "Sleep is critical for training adaptation. Most runners need 7-9 hours per night, with athletes in heavy training benefiting from 8-10 hours. Sleep is when growth hormone peaks and tissue repair occurs. Poor sleep increases injury risk, impairs glycogen restoration, and reduces training adaptations. Naps of 20-30 minutes can supplement nighttime sleep but should not replace it. Consistent sleep schedule is more important than total hours.",
    summary: "7-9 hours sleep needed; more during heavy training",
    tags: ["sleep", "recovery", "rest", "adaptation", "hormones"],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak", "taper"],
    source: "research_paper",
    sourceReference: "Cheri Mah Stanford sleep studies, ACSM guidelines",
    confidence: "established",
    usageContext: "coaching_advice",
  },

  // ==========================================================================
  // ADDITIONAL ENTRIES (to reach 15+)
  // ==========================================================================
  {
    category: "training_principles",
    subcategory: "frequency",
    title: "Minimum Training Frequency",
    content:
      "For meaningful fitness gains, runners need a minimum of 3 runs per week. Four to five days per week is optimal for most recreational runners balancing improvement with recovery. Elite runners may run 6-7 days or double some days. For beginners, 3-4 days allows tissue adaptation while minimizing overuse injury risk. Quality matters more than quantity at lower frequencies.",
    summary: "Minimum 3 runs/week; 4-5 optimal for most runners",
    tags: ["frequency", "training", "structure", "beginner"],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate"],
    applicablePhases: ["base", "build"],
    source: "established_practice",
    sourceReference: "ACSM guidelines, multiple coaching sources",
    confidence: "established",
    usageContext: "plan_generation",
  },
  {
    category: "training_principles",
    subcategory: "consistency",
    title: "Consistency Over Intensity",
    content:
      "Consistent moderate training produces better results than sporadic hard training. Missing workouts has compounding effects - three weeks of consistent training beats alternating hard weeks with missed weeks. Building habits of regular running creates adaptations that flashy single workouts cannot match. When choosing between a hard workout or an easy run when fatigued, the easy run serves long-term goals better.",
    summary: "Regular moderate training beats sporadic intense efforts",
    tags: ["consistency", "habits", "adaptation", "long_term"],
    applicableGoals: ["race", "base_building", "general_fitness"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak"],
    source: "established_practice",
    sourceReference: "Multiple coaching philosophies",
    confidence: "established",
    usageContext: "coaching_advice",
  },
  {
    category: "injury_prevention",
    subcategory: "general",
    title: "Recovery Week Frequency",
    content:
      "A recovery or cutback week every 3-4 weeks reduces injury risk and allows physiological adaptations to consolidate. During recovery weeks, reduce volume by 20-40% while maintaining workout frequency. Keep one quality session but reduce its volume. This pattern prevents accumulated fatigue and allows the body to supercompensate. Skipping recovery weeks increases injury risk significantly, especially for runners over 35.",
    summary: "Take a 20-40% cutback week every 3-4 weeks",
    tags: ["recovery_week", "cutback", "injury_prevention", "adaptation"],
    applicableGoals: ["race", "base_building"],
    applicableExperience: ["beginner", "intermediate", "advanced"],
    applicablePhases: ["base", "build", "peak"],
    source: "established_practice",
    sourceReference: "Pfitzinger, Daniels, Hudson",
    confidence: "established",
    usageContext: "plan_generation",
  },
];

/**
 * Seed the knowledge base with training science entries.
 * AC #3: Creates 15+ knowledge entries.
 */
export const seedKnowledgeBase = mutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    entries: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const insertedEntries: string[] = [];

    for (const seed of KNOWLEDGE_BASE_SEEDS) {
      await ctx.db.insert("knowledgeBase", {
        category: seed.category,
        subcategory: seed.subcategory,
        tags: seed.tags,
        title: seed.title,
        content: seed.content,
        summary: seed.summary,
        applicableGoals: seed.applicableGoals,
        applicableExperience: seed.applicableExperience,
        applicablePhases: seed.applicablePhases,
        source: seed.source,
        sourceReference: seed.sourceReference,
        confidence: seed.confidence,
        usageContext: seed.usageContext,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });
      insertedEntries.push(seed.title);
    }

    return {
      inserted: insertedEntries.length,
      entries: insertedEntries,
    };
  },
});

/**
 * Clear all knowledge base entries.
 * Useful for re-seeding during development.
 * ADMIN ONLY - requires admin role to execute.
 */
export const clearKnowledgeBase = mutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    // Require admin authorization for destructive operation
    await requireAdmin(ctx);

    const entries = await ctx.db.query("knowledgeBase").collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    return {
      deleted: entries.length,
    };
  },
});
