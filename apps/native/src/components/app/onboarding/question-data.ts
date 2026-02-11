// ─── Types ────────────────────────────────────────────────────────────────────

export type InputType =
  | "single-select"
  | "multi-select"
  | "text-input"
  | "pace-input"
  | "distance-input"
  | "date-picker";

export type QuestionOption = {
  label: string;
  value: string;
  /** If set, stores this key in responses to drive downstream branching */
  branchKey?: string;
};

export type QuestionConfig = {
  id: string;
  /** The coach's question text (streamed) */
  prompt: string;
  inputType: InputType;
  options?: QuestionOption[];
  placeholder?: string;
  /** Allow the user to skip this question */
  allowSkip?: boolean;
  skipLabel?: string;
  /** Only show this question if the predicate returns true */
  condition?: (responses: Record<string, string | string[]>) => boolean;
};

export type SectionConfig = {
  id: string;
  name: string;
  haptic?: "arrival" | "insight" | "question";
  /** Coach intro line before questions start */
  intro?: string;
  questions: QuestionConfig[];
  /** Contextual coach reaction shown after section completes */
  getReaction: (responses: Record<string, string | string[]>) => string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function is(
  responses: Record<string, string | string[]>,
  key: string,
  value: string,
): boolean {
  return responses[key] === value;
}

// ─── Section 2: Runner Profile ────────────────────────────────────────────────

const runnerProfileSection: SectionConfig = {
  id: "runner-profile",
  name: "Runner Profile",
  haptic: "arrival",
  intro: "First things first -- where are you at with running right now?",
  questions: [
    // Q2.1 — Runner type (always shown)
    {
      id: "runner_type",
      prompt: "First things first -- where are you at with running right now?",
      inputType: "single-select",
      options: [
        {
          label: "Just getting started",
          value: "beginner",
          branchKey: "beginner",
        },
        {
          label: "Getting back into it after a break",
          value: "returning",
          branchKey: "returning",
        },
        {
          label: "I run regularly, keeping it casual",
          value: "casual",
          branchKey: "casual",
        },
        {
          label: "I train seriously",
          value: "serious",
          branchKey: "serious",
        },
      ],
    },

    // ── Branch A: Beginner ──────────────────────────────────────────────

    {
      id: "beginner_duration",
      prompt: "How long have you been at it?",
      inputType: "single-select",
      options: [
        { label: "Less than a month", value: "less_than_month" },
        { label: "A few months", value: "few_months" },
        { label: "About a year", value: "about_year" },
      ],
      condition: (r) => is(r, "runner_type", "beginner"),
    },
    {
      id: "beginner_frequency",
      prompt: "How many days a week are you running?",
      inputType: "single-select",
      options: [
        { label: "1\u20132", value: "1-2" },
        { label: "3\u20134", value: "3-4" },
        { label: "5+", value: "5+" },
      ],
      condition: (r) => is(r, "runner_type", "beginner"),
    },

    // ── Branch B: Returning ─────────────────────────────────────────────

    {
      id: "returning_time_away",
      prompt: "How long were you out?",
      inputType: "single-select",
      options: [
        { label: "A few weeks", value: "few_weeks" },
        { label: "A few months", value: "few_months" },
        { label: "A year or more", value: "year_plus" },
      ],
      condition: (r) => is(r, "runner_type", "returning"),
    },
    {
      id: "returning_previous_level",
      prompt: "Before the break, how much were you running?",
      inputType: "single-select",
      options: [
        { label: "1\u20132 days/week", value: "1-2" },
        { label: "3\u20134 days/week", value: "3-4" },
        { label: "5+ days/week", value: "5+" },
      ],
      condition: (r) => is(r, "runner_type", "returning"),
    },
    {
      id: "returning_longest_run",
      prompt: "What's your longest run been since coming back?",
      inputType: "single-select",
      options: [
        { label: "Haven't started yet", value: "not_started" },
        { label: "Under 5K", value: "under_5k" },
        { label: "5\u201310K", value: "5-10k" },
        { label: "10K+", value: "10k_plus" },
      ],
      condition: (r) => is(r, "runner_type", "returning"),
    },

    // ── Branch C: Casual ────────────────────────────────────────────────

    {
      id: "casual_frequency",
      prompt: "How many days a week?",
      inputType: "single-select",
      options: [
        { label: "1\u20132", value: "1-2" },
        { label: "3\u20134", value: "3-4" },
        { label: "5+", value: "5+" },
      ],
      condition: (r) => is(r, "runner_type", "casual"),
    },
    {
      id: "casual_volume",
      prompt: "What's a typical week look like distance-wise?",
      inputType: "single-select",
      options: [
        { label: "Under 20K", value: "under_20k" },
        { label: "20\u201340K", value: "20-40k" },
        { label: "40\u201360K", value: "40-60k" },
        { label: "60K+", value: "60k_plus" },
      ],
      condition: (r) => is(r, "runner_type", "casual"),
    },
    {
      id: "casual_pace",
      prompt: "What's your comfortable pace?",
      inputType: "pace-input",
      allowSkip: true,
      skipLabel: "Not sure",
      condition: (r) => is(r, "runner_type", "casual"),
    },

    // ── Branch D: Serious ───────────────────────────────────────────────

    {
      id: "serious_frequency",
      prompt: "How many days a week?",
      inputType: "single-select",
      options: [
        { label: "4\u20135", value: "4-5" },
        { label: "6", value: "6" },
        { label: "7", value: "7" },
      ],
      condition: (r) => is(r, "runner_type", "serious"),
    },
    {
      id: "serious_volume",
      prompt: "Weekly volume?",
      inputType: "single-select",
      options: [
        { label: "40\u201360K", value: "40-60k" },
        { label: "60\u201380K", value: "60-80k" },
        { label: "80\u2013100K", value: "80-100k" },
        { label: "100K+", value: "100k_plus" },
      ],
      condition: (r) => is(r, "runner_type", "serious"),
    },
    {
      id: "serious_longest_run",
      prompt: "Longest run in the last month?",
      inputType: "distance-input",
      placeholder: "e.g. 18km",
      condition: (r) => is(r, "runner_type", "serious"),
    },
    {
      id: "serious_pace",
      prompt: "Easy pace?",
      inputType: "pace-input",
      condition: (r) => is(r, "runner_type", "serious"),
    },
  ],
  getReaction: (r) => {
    switch (r.runner_type) {
      case "beginner":
        return "Alright, early days. That\u2019s actually a great time to build the right habits from the start.";
      case "returning":
        return "Coming back is its own skill. The fitness is still in there \u2014 we just need to get at it the right way.";
      case "casual":
        return "Solid base. You\u2019ve got consistency going for you \u2014 that\u2019s half the battle.";
      case "serious":
        return "Okay, you\u2019re putting in real work. Let\u2019s make sure every session is earning its spot.";
      default:
        return "Good to know where you\u2019re at. Let\u2019s keep going.";
    }
  },
};

// ─── Section 3: Goals ─────────────────────────────────────────────────────────

const goalsSection: SectionConfig = {
  id: "goals",
  name: "Goals",
  haptic: "insight",
  intro: "Now the big one -- what are you working toward?",
  questions: [
    // Q3.1 — Goal type (always shown)
    {
      id: "goal_type",
      prompt: "Now the big one -- what are you working toward?",
      inputType: "single-select",
      options: [
        { label: "Training for a specific race", value: "race" },
        { label: "Getting faster (no race in mind)", value: "faster" },
        {
          label: "Building up my mileage / base building",
          value: "base_building",
        },
        { label: "Getting back in shape", value: "back_in_shape" },
        { label: "General fitness & health", value: "general_fitness" },
      ],
    },

    // ── Branch: Race ────────────────────────────────────────────────────

    {
      id: "race_distance",
      prompt: "What distance?",
      inputType: "single-select",
      options: [
        { label: "5K", value: "5k" },
        { label: "10K", value: "10k" },
        { label: "Half Marathon", value: "half_marathon" },
        { label: "Marathon", value: "marathon" },
        { label: "Ultra", value: "ultra" },
      ],
      condition: (r) => is(r, "goal_type", "race"),
    },
    {
      id: "race_target_time",
      prompt: "Got a target time in mind?",
      inputType: "single-select",
      options: [
        { label: "Yes", value: "yes" },
        { label: "Not yet \u2014 help me figure that out", value: "help_me" },
        { label: "Just want to finish", value: "just_finish" },
      ],
      condition: (r) => is(r, "goal_type", "race"),
    },
    {
      id: "race_target_time_value",
      prompt: "What time are you going for?",
      inputType: "text-input",
      placeholder: "e.g. 35:00 or sub-1:45",
      condition: (r) =>
        is(r, "goal_type", "race") && is(r, "race_target_time", "yes"),
    },
    {
      id: "race_date",
      prompt: "When's the race?",
      inputType: "single-select",
      options: [
        { label: "I have a date", value: "has_date" },
        { label: "Not registered yet", value: "not_registered" },
        { label: "Just exploring", value: "exploring" },
      ],
      condition: (r) => is(r, "goal_type", "race"),
    },
    {
      id: "race_date_value",
      prompt: "When is it?",
      inputType: "date-picker",
      condition: (r) =>
        is(r, "goal_type", "race") && is(r, "race_date", "has_date"),
    },

    // ── Branch: Getting faster ──────────────────────────────────────────

    {
      id: "faster_meaning",
      prompt: "What does faster look like for you?",
      inputType: "single-select",
      options: [
        { label: "A specific pace goal", value: "pace_goal" },
        { label: "A distance PR", value: "distance_pr" },
        {
          label: "I just want to feel faster \u2014 no specific number",
          value: "feel_faster",
        },
      ],
      condition: (r) => is(r, "goal_type", "faster"),
    },
    {
      id: "faster_pace_value",
      prompt: "What pace are you targeting?",
      inputType: "pace-input",
      condition: (r) =>
        is(r, "goal_type", "faster") && is(r, "faster_meaning", "pace_goal"),
    },
    {
      id: "faster_pr_distance",
      prompt: "Which distance?",
      inputType: "single-select",
      options: [
        { label: "5K", value: "5k" },
        { label: "10K", value: "10k" },
        { label: "Half Marathon", value: "half_marathon" },
        { label: "Marathon", value: "marathon" },
      ],
      condition: (r) =>
        is(r, "goal_type", "faster") && is(r, "faster_meaning", "distance_pr"),
    },
    {
      id: "faster_current_pr",
      prompt: "What's your current PR?",
      inputType: "text-input",
      placeholder: "e.g. 36:20",
      condition: (r) =>
        is(r, "goal_type", "faster") && is(r, "faster_meaning", "distance_pr"),
    },

    // ── Branch: Base building ───────────────────────────────────────────

    {
      id: "base_target",
      prompt: "Where do you want to get to?",
      inputType: "single-select",
      options: [
        { label: "Running 3x/week comfortably", value: "3x_week" },
        {
          label: "Running 30+ minutes without stopping",
          value: "30_min",
        },
        { label: "Hitting consistent 40K weeks", value: "40k_weeks" },
        { label: "Hitting consistent 60K+ weeks", value: "60k_weeks" },
      ],
      condition: (r) => is(r, "goal_type", "base_building"),
    },

    // ── Branch: Getting back in shape ───────────────────────────────────

    {
      id: "shape_target",
      prompt: "What does 'back in shape' look like?",
      inputType: "single-select",
      options: [
        { label: "Get back to where I was before", value: "previous_level" },
        { label: "Surpass where I was", value: "surpass" },
        { label: "Just feel good running again", value: "feel_good" },
      ],
      condition: (r) => is(r, "goal_type", "back_in_shape"),
    },

    // ── Branch: General fitness ─────────────────────────────────────────

    {
      id: "fitness_specificity",
      prompt: "Any distance or time targets, or just stay active?",
      inputType: "single-select",
      options: [
        { label: "I have something in mind", value: "has_target" },
        { label: "No, just keep me moving", value: "just_moving" },
      ],
      condition: (r) => is(r, "goal_type", "general_fitness"),
    },
    {
      id: "fitness_target_value",
      prompt: "What do you have in mind?",
      inputType: "text-input",
      placeholder: "e.g. run a 5K, 30 min 3x/week",
      condition: (r) =>
        is(r, "goal_type", "general_fitness") &&
        is(r, "fitness_specificity", "has_target"),
    },
  ],
  getReaction: (r) => {
    const runnerType = r.runner_type as string;
    const goalType = r.goal_type as string;

    if (runnerType === "beginner" && goalType === "race") {
      const dist = r.race_distance as string;
      if (dist === "5k") {
        return "A first 5K. That\u2019s a real milestone \u2014 and we\u2019re going to get you there feeling strong, not just surviving.";
      }
      return "That\u2019s a real target. We\u2019ll build you up the right way.";
    }
    if (runnerType === "serious" && goalType === "faster") {
      return "Clear target, tight ambition. I like it. Let me see what we\u2019re working with.";
    }
    if (runnerType === "returning" && goalType === "back_in_shape") {
      return "Getting back. You already know what it feels like to be fit \u2014 that memory is an advantage.";
    }
    if (goalType === "general_fitness") {
      return "Keep moving, keep it fun. I can work with that \u2014 and I\u2019ll make sure the plan doesn\u2019t kill the joy.";
    }
    if (goalType === "race") {
      return "Race day gives us a finish line. I like coaching toward something concrete.";
    }
    if (goalType === "faster") {
      return "Speed is a skill. Let\u2019s sharpen it.";
    }
    if (goalType === "base_building") {
      return "Building the base is the smartest thing you can do. Everything else gets easier on top of it.";
    }
    return "Good. Now I know what we\u2019re aiming for.";
  },
};

// ─── Section 4: Schedule & Life ───────────────────────────────────────────────

const scheduleSection: SectionConfig = {
  id: "schedule",
  name: "Schedule & Life",
  haptic: "question",
  intro: "Let's talk about your week. I need to know what I'm working with.",
  questions: [
    {
      id: "available_days",
      prompt: "How many days can you realistically train?",
      inputType: "single-select",
      options: [
        { label: "2\u20133", value: "2-3" },
        { label: "4\u20135", value: "4-5" },
        { label: "6\u20137", value: "6-7" },
      ],
    },
    {
      id: "off_limits_days",
      prompt: "Any days that are completely off-limits?",
      inputType: "multi-select",
      options: [
        { label: "Mon", value: "mon" },
        { label: "Tue", value: "tue" },
        { label: "Wed", value: "wed" },
        { label: "Thu", value: "thu" },
        { label: "Fri", value: "fri" },
        { label: "Sat", value: "sat" },
        { label: "Sun", value: "sun" },
        { label: "None", value: "none" },
      ],
    },
    {
      id: "preferred_time",
      prompt: "When do you usually run?",
      inputType: "single-select",
      options: [
        { label: "Morning", value: "morning" },
        { label: "Midday", value: "midday" },
        { label: "Evening", value: "evening" },
        { label: "It varies", value: "varies" },
      ],
    },
    // Calendar connection is handled as a special step in section-flow,
    // not as a regular question. We use a sentinel question to trigger it.
    {
      id: "calendar_connection",
      prompt:
        "Got a calendar you'd connect? I can spot the busy days myself.",
      inputType: "single-select",
      options: [
        { label: "Connect my calendar", value: "connect" },
        { label: "Skip for now", value: "skip" },
      ],
    },
  ],
  getReaction: () =>
    "Got it. That gives me the frame \u2014 I\u2019ll build around your life, not the other way around.",
};

// ─── Section 5: Injury & Risk Profile ─────────────────────────────────────────

const injurySection: SectionConfig = {
  id: "injury",
  name: "Injury & Risk",
  haptic: "arrival",
  intro: "Now let me ask about the less fun stuff.",
  questions: [
    {
      id: "past_injuries",
      prompt: "Any past injuries that have affected your running?",
      inputType: "multi-select",
      options: [
        { label: "Shin splints", value: "shin_splints" },
        { label: "IT band syndrome", value: "it_band" },
        { label: "Plantar fasciitis", value: "plantar_fasciitis" },
        {
          label: "Knee pain (runner\u2019s knee / patella)",
          value: "knee_pain",
        },
        { label: "Achilles issues", value: "achilles" },
        { label: "Stress fracture", value: "stress_fracture" },
        { label: "Hip / glute issues", value: "hip_glute" },
        { label: "None \u2014 I\u2019ve been lucky", value: "none" },
      ],
    },
    {
      id: "current_pain",
      prompt: "Anything bothering you right now?",
      inputType: "single-select",
      options: [
        { label: "Yes", value: "yes" },
        { label: "Nothing right now", value: "no" },
      ],
    },
    {
      id: "current_pain_area",
      prompt: "What's bothering you?",
      inputType: "multi-select",
      options: [
        { label: "Shin splints", value: "shin_splints" },
        { label: "IT band syndrome", value: "it_band" },
        { label: "Plantar fasciitis", value: "plantar_fasciitis" },
        { label: "Knee pain", value: "knee_pain" },
        { label: "Achilles issues", value: "achilles" },
        { label: "Hip / glute issues", value: "hip_glute" },
        { label: "Other", value: "other" },
      ],
      condition: (r) => is(r, "current_pain", "yes"),
    },
    {
      id: "recovery_style",
      prompt:
        "When you've been hurt before, how would you describe your recovery?",
      inputType: "single-select",
      options: [
        { label: "I bounce back quick", value: "quick" },
        {
          label: "It takes a while but I get there",
          value: "slow_but_steady",
        },
        { label: "I tend to push through it", value: "push_through" },
        { label: "Haven\u2019t had a real injury yet", value: "no_injury" },
      ],
    },
    {
      id: "sleep",
      prompt: "How's your sleep these days?",
      inputType: "single-select",
      options: [
        { label: "Solid 7\u20138 hours", value: "solid" },
        {
          label: "Inconsistent \u2014 some good nights, some bad",
          value: "inconsistent",
        },
        { label: "I\u2019m running on fumes", value: "bad" },
      ],
    },
    {
      id: "stress",
      prompt: "General stress level outside of running?",
      inputType: "single-select",
      options: [
        { label: "Low \u2014 life\u2019s good", value: "low" },
        { label: "Moderate \u2014 the usual stuff", value: "moderate" },
        { label: "High \u2014 a lot going on", value: "high" },
        { label: "Survival mode", value: "survival" },
      ],
    },
  ],
  getReaction: (r) => {
    const injuries = r.past_injuries as string[] | string;
    const hasShinSplints = Array.isArray(injuries)
      ? injuries.includes("shin_splints")
      : injuries === "shin_splints";
    const pushesThrough = is(r, "recovery_style", "push_through");
    const noInjuries = Array.isArray(injuries)
      ? injuries.includes("none")
      : injuries === "none";
    const solidSleep = is(r, "sleep", "solid");
    const hasPain = is(r, "current_pain", "yes");
    const highStress =
      is(r, "stress", "high") || is(r, "stress", "survival");
    const badSleep = is(r, "sleep", "bad");

    if (hasShinSplints && pushesThrough) {
      return "Shin splints and a tendency to push through \u2014 I hear you. That\u2019s a pattern I\u2019ll watch for. We\u2019ll build in a way that doesn\u2019t trigger it.";
    }
    if (hasPain && highStress && badSleep) {
      return "I want to be honest \u2014 the combination of pain, stress, and sleep debt means we start conservative. The smartest thing right now is protecting your body while we build.";
    }
    if (noInjuries && solidSleep) {
      return "Clean bill of health and sleeping well? That\u2019s a strong foundation. Let\u2019s build on it.";
    }
    if (pushesThrough) {
      return "You tend to push through \u2014 noted. I\u2019ll flag the early signs before you have to make that call.";
    }
    if (highStress || badSleep) {
      return "Stress and sleep affect everything. I\u2019ll factor that into your load \u2014 the plan has to fit your life, not the other way around.";
    }
    return "Good to know the full picture. I\u2019ll keep all of this in mind.";
  },
};

// ─── Section 6: Coaching Style ────────────────────────────────────────────────

const coachingStyleSection: SectionConfig = {
  id: "coaching-style",
  name: "Coaching Style",
  haptic: "question",
  intro: "Almost there. This one's about how you want me to show up.",
  questions: [
    {
      id: "coaching_voice",
      prompt: "What kind of coaching works best for you?",
      inputType: "single-select",
      options: [
        {
          label: "Tough love \u2014 push me, call me out",
          value: "tough_love",
        },
        {
          label: "Encouraging \u2014 keep it positive, celebrate the wins",
          value: "encouraging",
        },
        {
          label: "Analytical \u2014 give me the data and the reasoning",
          value: "analytical",
        },
        {
          label: "Minimalist \u2014 just tell me what to do",
          value: "minimalist",
        },
      ],
    },
  ],
  getReaction: (r) => {
    switch (r.coaching_voice) {
      case "tough_love":
        return "Good. I won\u2019t sugarcoat it then. When something\u2019s off, you\u2019ll hear it.";
      case "encouraging":
        return "I like that. We\u2019ll focus on what\u2019s going right and build from there.";
      case "analytical":
        return "My kind of runner. You\u2019ll get the full breakdown \u2014 numbers, reasoning, all of it.";
      case "minimalist":
        return "Clean and simple. Session shows up, you run it. I\u2019ll save the deep stuff for when it matters.";
      default:
        return "Noted. I\u2019ll calibrate how I show up.";
    }
  },
};

// ─── Section 7: The Mental Game ───────────────────────────────────────────────

const mentalGameSection: SectionConfig = {
  id: "mental-game",
  name: "The Mental Game",
  haptic: "insight",
  intro: "Last one. Let's go a bit deeper.",
  questions: [
    {
      id: "biggest_challenge",
      prompt: "What's the biggest thing holding you back right now?",
      inputType: "single-select",
      options: [
        {
          label: "Consistency \u2014 I struggle to stick with it",
          value: "consistency",
        },
        { label: "Time \u2014 there\u2019s never enough", value: "time" },
        {
          label: "Motivation \u2014 I lose steam",
          value: "motivation",
        },
        {
          label: "Fear of injury \u2014 I hold back",
          value: "fear_of_injury",
        },
        {
          label: "Pacing \u2014 I don\u2019t know how to go easy",
          value: "pacing",
        },
        {
          label: "I\u2019m not sure \u2014 I just feel stuck",
          value: "stuck",
        },
      ],
    },
    {
      id: "skip_trigger",
      prompt: "When you skip a run, what's usually the reason?",
      inputType: "single-select",
      options: [
        { label: "Too tired", value: "tired" },
        { label: "Too busy", value: "busy" },
        { label: "Weather", value: "weather" },
        { label: "Lost motivation", value: "lost_motivation" },
        { label: "Pain or injury worry", value: "pain_worry" },
        { label: "I rarely skip", value: "rarely_skip" },
      ],
    },
    {
      id: "data_orientation",
      prompt:
        "When it comes to numbers -- pace, heart rate, mileage -- are you...",
      inputType: "single-select",
      options: [
        {
          label: "Data-driven \u2014 I love the numbers",
          value: "data_driven",
        },
        {
          label: "Curious \u2014 I check them but don\u2019t obsess",
          value: "curious",
        },
        {
          label: "Feel-based \u2014 I\u2019d rather just run",
          value: "feel_based",
        },
      ],
    },
  ],
  getReaction: (r) => {
    const challenge = r.biggest_challenge as string;
    const skipTrigger = r.skip_trigger as string;
    const dataOrientation = r.data_orientation as string;

    if (
      challenge === "consistency" &&
      skipTrigger === "tired" &&
      dataOrientation === "feel_based"
    ) {
      return "Consistency and fatigue \u2014 that\u2019s usually a plan problem, not a willpower problem. If the plan respects your energy, showing up gets easier.";
    }
    if (
      challenge === "pacing" &&
      dataOrientation === "data_driven" &&
      skipTrigger === "rarely_skip"
    ) {
      return "You show up every day but can\u2019t slow down. That\u2019s discipline without a governor. I\u2019ll be that governor.";
    }
    if (challenge === "fear_of_injury" && skipTrigger === "pain_worry") {
      return "There\u2019s a loop there \u2014 stress, fear, tension. Part of coaching you is breaking that cycle. We\u2019ll start easy. Nothing to fear.";
    }
    if (challenge === "stuck" && skipTrigger === "lost_motivation") {
      return "Being stuck usually means you\u2019ve been doing the same thing long enough to stop seeing change. Fresh eyes \u2014 that\u2019s what I\u2019m for.";
    }
    if (challenge === "consistency") {
      return "Consistency is the unlock. Once we nail that, everything else follows.";
    }
    if (challenge === "pacing") {
      return "Pacing is coachable. That\u2019s exactly what I\u2019m here for.";
    }
    if (challenge === "time") {
      return "Limited time means every session has to count. I\u2019ll make sure they do.";
    }
    return "I\u2019ve got a clear picture now. Let me put this all together.";
  },
};

// ─── Exported Sections Array ──────────────────────────────────────────────────

export const ONBOARDING_SECTIONS: SectionConfig[] = [
  runnerProfileSection,
  goalsSection,
  scheduleSection,
  injurySection,
  coachingStyleSection,
  mentalGameSection,
];

// ─── Helper: resolve visible questions for a section ──────────────────────────

export function getVisibleQuestions(
  section: SectionConfig,
  responses: Record<string, string | string[]>,
): QuestionConfig[] {
  return section.questions.filter(
    (q) => !q.condition || q.condition(responses),
  );
}

// ─── Helper: count total visible questions across all sections ────────────────

export function getTotalVisibleQuestions(
  responses: Record<string, string | string[]>,
): number {
  return ONBOARDING_SECTIONS.reduce(
    (total, section) => total + getVisibleQuestions(section, responses).length,
    0,
  );
}
