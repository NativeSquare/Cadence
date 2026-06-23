import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { adminInvites } from "./table/adminInvites";
import { audienceMembers } from "./table/audienceMembers";
import { audiences } from "./table/audiences";
import { broadcastRecipients } from "./table/broadcastRecipients";
import { broadcasts } from "./table/broadcasts";
import { coachMemories } from "./table/coachMemories";
import { contacts } from "./table/contacts";
import { cycleStarts } from "./table/cycleStarts";
import { feedback } from "./table/feedback";
import { journalEntry } from "./table/journalEntry";
// `sessionFeedback` is superseded by `journalEntry`. It stays registered only
// so the `journalEntry.backfillFromSessionFeedback` migration can read it; once
// that migration has run in production, both this table and its file are
// removed in a follow-up.
import { sessionFeedback } from "./table/sessionFeedback";
import { users } from "./table/users";

// NOTE: Training-domain tables (athletes, zones, events, races, goals, plans,
// blocks, workouts, workoutTemplates) are owned by the Agoge component
// (@nativesquare/agoge). Access via:
// ctx.runQuery/Mutation(components.agoge.public.*, { ... })
// or the Agoge client wrapper: new Agoge(components.agoge).
//
// Biometrics/activities (activities, sleepSessions, dailySummaries, bodyMeasurements,
// stravaConnections) are owned by the Soma component (@nativesquare/soma).

export default defineSchema({
  ...authTables,
  adminInvites,
  audienceMembers,
  audiences,
  broadcastRecipients,
  broadcasts,
  coachMemories,
  contacts,
  cycleStarts,
  feedback,
  journalEntry,
  sessionFeedback,
  users,
});
