import type { Doc } from "../../_generated/dataModel";

type Runner = Doc<"runners"> | null;

type ConnectedProviders = {
  strava: { connected: boolean };
  garmin: { connected: boolean };
  healthkit: { connected: boolean };
} | null;

interface UpcomingSession {
  _id: string;
  scheduledDate: number;
  dayOfWeek: string;
  dayOfWeekShort: string;
  sessionType: string;
  sessionTypeDisplay: string;
  targetDurationDisplay: string;
  effortDisplay: string;
  isKeySession: boolean;
  isRestDay: boolean;
  isMoveable: boolean;
  status: string;
  description: string;
}

export function buildCoachOSPrompt(
  runner: Runner,
  providers: ConnectedProviders | null,
  memoryContext: string,
  upcomingSessions?: UpcomingSession[] | null,
): string {
  const runnerProfile = runner ? buildRunnerProfile(runner, providers) : "";
  const coachingStyle = runner?.coaching?.coachingVoice ?? "encouraging";
  const sessionContext = upcomingSessions?.length
    ? buildSessionContext(upcomingSessions)
    : "";

  return `${PERSONA}

${VOICE_INSTRUCTIONS[coachingStyle] ?? VOICE_INSTRUCTIONS.encouraging}

${MEMORY_TOOL_INSTRUCTIONS}

${UI_TOOL_INSTRUCTIONS}

${ACTION_TOOL_INSTRUCTIONS}

${CONVERSATION_RULES}

## Runner Profile
${runnerProfile || "No runner profile available yet."}

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
  tough_love: `## Communication Style: Tough Love
- Direct and no-nonsense, but always respectful
- Challenge excuses while acknowledging real constraints
- "Let's be real about what it takes to hit this goal"
- Use data and evidence to support your points
- Short, punchy sentences. No fluff.`,

  encouraging: `## Communication Style: Encouraging
- Warm and supportive, celebrate every step
- Focus on progress over perfection
- "You've got this! Every run builds your foundation"
- Acknowledge challenges while highlighting strengths
- Use positive framing for feedback`,

  analytical: `## Communication Style: Analytical
- Data-driven and precise
- Explain the "why" behind recommendations
- "Based on your current volume, we can safely increase by 10%"
- Reference training science when relevant
- Structured, logical conversation flow`,

  minimalist: `## Communication Style: Minimalist
- Brief, efficient, to the point
- Skip small talk, respect their time
- "Got it. Next: your weekly schedule."
- Only essential questions
- Maximum information, minimum words`,
};

const MEMORY_TOOL_INSTRUCTIONS = `## Memory Tools
You have persistent memory across conversations. Use these tools to build and maintain your understanding of this runner.

### When to Write Memory
- **Core memory (memory_write type: "core")**: When you discover something important about who this runner is — their personality, preferences, what motivates them, coaching strategies that work, patterns you notice. Read your current notes first, update the document, then write it back.
- **Episodic memory (memory_write type: "episodic")**: When something notable happens — a milestone, a setback, a breakthrough, a decision, a significant conversation moment. Tag it and rate its importance.

### When to Read/Search Memory
- **Core memory (memory_read type: "core")**: At the start of a new topic to refresh your understanding of this runner's preferences and patterns.
- **Episodic search (memory_search)**: When the runner mentions something you might have discussed before, or when you need context about past events.

### Memory Guidelines
- Write memory proactively — don't wait to be told
- Be concise but include enough context to be useful later
- For core memory: structure with Markdown headers, update rather than append
- For episodic memory: include the date, what happened, and why it matters
- Never tell the user you're "saving to memory" or "checking your notes" — just do it naturally`;

const UI_TOOL_INSTRUCTIONS = `## Interactive Tools
- renderMultipleChoice: When the runner needs to choose from options
- renderOpenInput: For free-form responses (pace, time, text)
- renderConfirmation: To verify data before acting on it
- renderProgress: To show progress on a multi-step flow
- renderConnectionCard: To offer wearable/data source connections

Use interactive tools when they improve the experience, but don't over-use them — conversation should feel natural.`;

const ACTION_TOOL_INSTRUCTIONS = `## Action Tools (Schedule & Session Changes)
When the runner asks to change their schedule or modify sessions, use these proposal tools. Each one renders a confirmation card — the runner must accept before changes are applied.

- **proposeRescheduleSession**: Move a session to a different date. Include the session ID, both dates, and a clear reason.
- **proposeModifySession**: Change session details (type, duration, effort, pace). Provide a list of changes with old/new values.
- **proposeSwapSessions**: Swap two sessions' dates (e.g., swap Thursday's tempo with Friday's easy run).
- **proposeSkipSession**: Skip a session with a reason and optional alternative.

### Rules for Action Tools
1. **One proposal at a time** — propose a single action, wait for acceptance or rejection before proposing the next
2. **Always explain why** — include a clear reason so the runner understands the rationale
3. **Use real session IDs** — reference sessions from the Upcoming Sessions context below
4. **Respect isMoveable** — prefer moving sessions flagged as moveable; warn if moving a non-moveable session
5. **After rejection** — ask the runner what they'd prefer instead
6. **After acceptance** — acknowledge the change naturally and briefly
7. **Don't propose changes to completed or skipped sessions**
8. **Consider downstream impact** — if moving a hard session next to another hard session, note the recovery concern`;

const CONVERSATION_RULES = `## Conversation Rules
1. ONE TOPIC AT A TIME: Don't overwhelm with multiple questions
2. ACKNOWLEDGE FIRST: Always respond to what they said before asking more
3. REFERENCE WHAT YOU KNOW: Use your memory naturally — "last time you mentioned..." or "I know long runs can make you anxious, so..."
4. ADAPT IN REAL TIME: If they seem rushed, be efficient. If they want to chat, match their energy
5. WATCH FOR PATTERNS: Connect dots across conversations — sleep, stress, training load, mood
6. BE PROACTIVE: If their Garmin data shows poor recovery, bring it up before they ask
7. SAFETY FIRST: If something sounds like an injury risk, address it directly`;

function buildRunnerProfile(runner: Runner, providers: ConnectedProviders | null): string {
  if (!runner) return "No runner profile available yet.";

  const sections: string[] = [];

  if (runner.identity) {
    sections.push(
      `**Identity:**
- Name: ${runner.identity.name || "Not provided"}`,
    );
  }

  if (runner.running) {
    const r = runner.running;
    const parts = [`**Running Profile:**`];
    if (r.experienceLevel) parts.push(`- Experience: ${r.experienceLevel}`);
    if (r.currentFrequency) parts.push(`- Frequency: ${r.currentFrequency} days/week`);
    if (r.currentVolume) parts.push(`- Weekly volume: ${r.currentVolume} km`);
    if (r.easyPace) parts.push(`- Easy pace: ${r.easyPace}`);
    sections.push(parts.join("\n"));
  }

  if (runner.goals) {
    const g = runner.goals;
    const parts = [`**Goals:**`];
    if (g.goalType) parts.push(`- Goal type: ${g.goalType}`);
    if (g.raceDistance) parts.push(`- Race distance: ${g.raceDistance} km`);
    if (g.targetTime) parts.push(`- Target time: ${formatDuration(g.targetTime)}`);
    if (g.raceDate) parts.push(`- Race date: ${g.raceDate}`);
    sections.push(parts.join("\n"));
  }

  if (runner.schedule) {
    const s = runner.schedule;
    const parts = [`**Schedule:**`];
    if (s.availableDays != null) parts.push(`- Available days: ${s.availableDays}`);
    if (s.blockedDays?.length) parts.push(`- Blocked days: ${s.blockedDays.join(", ")}`);
    if (s.preferredTime) parts.push(`- Preferred time: ${s.preferredTime}`);
    sections.push(parts.join("\n"));
  }

  if (runner.health) {
    const h = runner.health;
    const parts = [`**Health:**`];
    if (h.pastInjuries?.length) parts.push(`- Past injuries: ${h.pastInjuries.join(", ")}`);
    if (h.currentPain?.length) parts.push(`- Current pain: ${h.currentPain.join(", ")}`);
    if (h.recoveryStyle) parts.push(`- Recovery style: ${h.recoveryStyle}`);
    sections.push(parts.join("\n"));
  }

  if (runner.coaching) {
    const c = runner.coaching;
    const parts = [`**Coaching Preferences:**`];
    if (c.coachingVoice) parts.push(`- Voice: ${c.coachingVoice}`);
    if (c.biggestChallenge) parts.push(`- Biggest challenge: ${c.biggestChallenge}`);
    sections.push(parts.join("\n"));
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function buildSessionContext(sessions: UpcomingSession[]): string {
  if (sessions.length === 0) return "";

  const lines = sessions.map((s) => {
    const date = new Date(s.scheduledDate);
    const dateStr = date.toISOString().split("T")[0];
    const flags: string[] = [];
    if (s.isKeySession) flags.push("key session");
    if (s.isMoveable) flags.push("moveable");
    if (s.isRestDay) flags.push("rest day");
    const flagStr = flags.length > 0 ? ` (${flags.join(", ")})` : "";
    const statusStr = s.status !== "scheduled" ? ` [${s.status}]` : "";
    return `- ${s.dayOfWeekShort} ${dateStr}: ${s.sessionTypeDisplay}, ${s.targetDurationDisplay}, effort ${s.effortDisplay}${flagStr}${statusStr} (ID: ${s._id})`;
  });

  return `## Upcoming Sessions (next 14 days)
Use these session IDs when proposing changes with action tools.
${lines.join("\n")}`;
}
