import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { conversations, messages } from "./ai/messages";
import { candidates } from "./intelligence/candidates";
import { events } from "./intelligence/events";
import { adminInvites } from "./table/adminInvites";
import { audienceMembers } from "./table/audienceMembers";
import { audiences } from "./table/audiences";
import { broadcastRecipients } from "./table/broadcastRecipients";
import { broadcasts } from "./table/broadcasts";
import { contacts } from "./table/contacts";
import { feedback } from "./table/feedback";
import { knowledgeBase } from "./table/knowledgeBase";
import { pushTokens } from "./table/pushTokens";
import { safeguards } from "./table/safeguards";
import { users } from "./table/users";

// NOTE: Training-domain tables (athletes, zones, events, plans, blocks, workouts,
// workoutTemplates) are owned by the Agoge component (@nativesquare/agoge).
// Access via: ctx.runQuery/Mutation(components.agoge.public.*, { ... })
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
  candidates,
  contacts,
  conversations,
  events,
  feedback,
  knowledgeBase,
  messages,
  pushTokens,
  safeguards,
  users,
});
