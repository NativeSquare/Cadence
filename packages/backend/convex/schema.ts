import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { conversations, messages } from "./cadence/messages";
import { adminInvites } from "./table/adminInvites";
import { audienceMembers } from "./table/audienceMembers";
import { audiences } from "./table/audiences";
import { broadcastRecipients } from "./table/broadcastRecipients";
import { broadcasts } from "./table/broadcasts";
import { contacts } from "./table/contacts";
import { feedback } from "./table/feedback";
import { pushTokens } from "./table/pushTokens";
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
  contacts,
  conversations,
  feedback,
  messages,
  pushTokens,
  users,
});
