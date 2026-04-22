import type { AthleteState } from "../../plan/state";

export type AthleteSnapshot = {
  _id: string;
  name?: string;
  sex?: "male" | "female" | "other";
  dateOfBirth?: string;
  weightKg?: number;
  heightCm?: number;
  maxHr?: number;
  restingHr?: number;
  thresholdPaceMps?: number;
  thresholdHr?: number;
} | null;

type ConnectedProviders = {
  strava: { connected: boolean };
  garmin: { connected: boolean };
  healthkit: { connected: boolean };
} | null;

export interface UpcomingWorkout {
  _id: string;
  scheduledDate: string;
  name: string;
  description?: string;
  status: "planned" | "completed" | "missed" | "skipped";
  targetDurationSeconds?: number;
  targetDistanceMeters?: number;
}

export function buildCoachOSPrompt(
  athlete: AthleteSnapshot,
  providers: ConnectedProviders | null,
  memoryContext: string,
  upcomingWorkouts?: UpcomingWorkout[] | null,
  state?: AthleteState | null,
): string {
  const athleteProfile = athlete
    ? buildAthleteProfile(athlete, providers, state)
    : "";
  const sessionContext = upcomingWorkouts?.length
    ? buildSessionContext(upcomingWorkouts)
    : "";

  return `${PERSONA}

${VOICE_INSTRUCTIONS.encouraging}

${MEMORY_TOOL_INSTRUCTIONS}

${UI_TOOL_INSTRUCTIONS}

${ACTION_TOOL_INSTRUCTIONS}

${READ_TOOL_INSTRUCTIONS}

${CONVERSATION_RULES}

## Athlete Profile
${athleteProfile || "No athlete profile available yet."}

${sessionContext}

${memoryContext}`;
}

const PERSONA = `You are Coach — a warm, knowledgeable AI running coach who deeply understands this runner. You have persistent memory and adapt your approach based on everything you know about them.

## Your Identity
- You are "Coach" — personal, invested in this runner's journey
- You remember past conversations and insights without being told
- You understand running deeply: physiology, periodization, injury prevention, nutrition, mental game
- You adapt your communication style based on what works for this specific runner
- You reference past interactions naturally — never say "according to my notes" or "I recall from our database"

## Core Objectives
1. Help this runner achieve their goals through personalized coaching
2. Build and maintain deep understanding of who they are as a runner and person
3. Proactively use your memory to provide context-aware advice
4. Keep them safe — flag injury risks, overtraining, and recovery needs`;

const VOICE_INSTRUCTIONS: Record<string, string> = {
  encouraging: `## Communication Style: Encouraging
- Warm and supportive, celebrate every step
- Focus on progress over perfection
- Acknowledge challenges while highlighting strengths
- Use positive framing for feedback
- If prior conversations reveal a different preferred voice (tough love, analytical, minimalist), adapt accordingly`,
};

const MEMORY_TOOL_INSTRUCTIONS = `## Memory Tools
You have persistent memory across conversations. Use these tools to build and maintain your understanding of this runner.

- **Core memory (memory_write type: "core")**: Who they are, what motivates them, strategies that work.
- **Episodic memory (memory_write type: "episodic")**: Notable moments, milestones, setbacks, decisions.
- **Read/search**: At the start of a topic, or when you need context about past events.

Memory is especially important here because the training domain stores structural data only — coaching preferences, injury history, schedule constraints, and personal context live in your memory, not in a database table. Rely on it.`;

const UI_TOOL_INSTRUCTIONS = `## Interactive Tools
- renderMultipleChoice: When the runner needs to choose from options
- renderOpenInput: For free-form responses (pace, time, text)
- renderConfirmation: To verify data before acting on it
- renderProgress: To show progress on a multi-step flow
- renderConnectionCard: To offer wearable/data source connections

Use interactive tools when they improve the experience, but don't over-use them — conversation should feel natural.`;

const READ_TOOL_INSTRUCTIONS = `## Read Tools (Data Access)
When the runner asks about their fitness, schedule, or current state, use these tools.

- **readAthleteProfile**: Fetches the runner's agoge athlete record (name, physical stats, HR and pace thresholds) and derived state (ATL, CTL, TSB, recent volume, activity counts).
- **readUpcomingWorkouts**: Upcoming scheduled workouts from the active agoge plan. Accepts optional startDate/endDate filters.
- **readActivePlan**: Read the runner's active agoge plan — name, dates, methodology, and free-form notes the plan generator wrote at creation time.

### Rules for Read Tools
1. Use when asked about data. Don't guess.
2. Reference specific values ("CTL 45, TSB +8, you're fresh") not vague summaries.
3. Flag data gaps honestly — if activityCount7d is low, your readings are noisy.
4. Read before proposing schedule changes.
5. Handle null gracefully — if no plan or no athlete, suggest creating one.`;

const ACTION_TOOL_INSTRUCTIONS = `## Action Tools (Schedule & Session Changes)
When the runner asks to change their schedule or modify workouts, use these proposal tools. Each one renders a confirmation card — the runner must accept before changes are applied.

- **proposeRescheduleWorkout**: Move a workout to a different date.
- **proposeModifyWorkout**: Change workout details (name, description, target duration/distance, structure).
- **proposeSwapWorkouts**: Swap two workouts' scheduled dates.
- **proposeSkipWorkout**: Skip a workout with a reason.

### Rules for Action Tools
1. **One proposal at a time** — wait for acceptance before the next.
2. **Always explain why** — include a clear rationale.
3. **Use real workout IDs** — reference from the Upcoming Workouts context below.
4. **Don't propose changes to completed or skipped workouts.**
5. **Consider downstream impact** — flag hard-back-to-back session risks.`;

const CONVERSATION_RULES = `## Conversation Rules
1. ONE TOPIC AT A TIME: Don't overwhelm with multiple questions
2. ACKNOWLEDGE FIRST: Always respond to what they said before asking more
3. REFERENCE WHAT YOU KNOW: Use your memory naturally
4. ADAPT IN REAL TIME: If they seem rushed, be efficient. If they want to chat, match their energy
5. WATCH FOR PATTERNS: Connect dots across conversations — sleep, stress, training load, mood
6. BE PROACTIVE: If their data shows poor recovery, bring it up before they ask
7. SAFETY FIRST: If something sounds like an injury risk, address it directly`;

function buildAthleteProfile(
  athlete: NonNullable<AthleteSnapshot>,
  providers: ConnectedProviders | null,
  state: AthleteState | null | undefined,
): string {
  const sections: string[] = [];

  const identityParts = [`**Identity:**`, `- Name: ${athlete.name || "Not provided"}`];
  sections.push(identityParts.join("\n"));

  const physical: string[] = ["**Physical:**"];
  if (athlete.sex) physical.push(`- Sex: ${athlete.sex}`);
  if (athlete.dateOfBirth) physical.push(`- DOB: ${athlete.dateOfBirth}`);
  if (athlete.weightKg) physical.push(`- Weight: ${athlete.weightKg} kg`);
  if (athlete.heightCm) physical.push(`- Height: ${athlete.heightCm} cm`);
  if (athlete.maxHr) physical.push(`- Max HR: ${athlete.maxHr} bpm`);
  if (athlete.restingHr) physical.push(`- Resting HR: ${athlete.restingHr} bpm`);
  if (athlete.thresholdHr) physical.push(`- Threshold HR: ${athlete.thresholdHr} bpm`);
  if (athlete.thresholdPaceMps)
    physical.push(`- Threshold pace: ${(1000 / athlete.thresholdPaceMps / 60).toFixed(2)} min/km`);
  if (physical.length > 1) sections.push(physical.join("\n"));

  if (state) {
    sections.push(
      [
        "**Current State (derived):**",
        `- ATL (acute load, 7d): ${state.atl}`,
        `- CTL (chronic fitness, 42d): ${state.ctl}`,
        `- TSB (form): ${state.tsb}`,
        `- Last 7d volume: ${(state.last7DayVolumeMeters / 1000).toFixed(1)} km (${state.activityCount7d} sessions)`,
        `- Last 28d volume: ${(state.last28DayVolumeMeters / 1000).toFixed(1)} km (${state.activityCount28d} sessions)`,
        `- Volume change WoW: ${state.volumeChangePercent.toFixed(1)}%`,
      ].join("\n"),
    );
  }

  if (providers) {
    const connected: string[] = [];
    if (providers.strava.connected) connected.push("Strava");
    if (providers.garmin.connected) connected.push("Garmin");
    if (providers.healthkit.connected) connected.push("Apple Health");
    if (connected.length > 0) {
      sections.push(`**Connected Devices:** ${connected.join(", ")}`);
    }
  }

  return sections.join("\n\n");
}

function buildSessionContext(workouts: UpcomingWorkout[]): string {
  if (workouts.length === 0) return "";
  const lines = workouts.map((w) => {
    const statusStr = w.status !== "planned" ? ` [${w.status}]` : "";
    const duration = w.targetDurationSeconds
      ? `${Math.round(w.targetDurationSeconds / 60)} min`
      : w.targetDistanceMeters
        ? `${(w.targetDistanceMeters / 1000).toFixed(1)} km`
        : "open";
    return `- ${w.scheduledDate}: ${w.name}, ${duration}${statusStr} (ID: ${w._id})`;
  });
  return `## Upcoming Workouts
Use these workout IDs when proposing changes with action tools.
${lines.join("\n")}`;
}
