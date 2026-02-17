import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { conversations, messages } from "./ai/messages";
import { adminInvites } from "./table/adminInvites";
import { feedback } from "./table/feedback";
import { knowledgeBase } from "./table/knowledgeBase";
import { runners } from "./table/runners";
import { safeguards } from "./table/safeguards";
import { plannedSessions } from "./table/plannedSessions";
import { trainingPlans } from "./table/trainingPlans";
import { users } from "./table/users";

// NOTE: The following tables are now owned by Soma component (@nativesquare/soma):
// - activities → api.soma.listActivities / ingestActivity
// - sleepSessions → api.soma.listSleep / ingestSleep
// - dailySummaries → api.soma.listDaily / ingestDaily
// - bodyMeasurements → api.soma.listBody / ingestBody
// - stravaConnections → api.soma.listConnections / connect
// Access via: const soma = new Soma(components.soma);

export default defineSchema({
  ...authTables,
  adminInvites,
  conversations,
  feedback,
  knowledgeBase,
  messages,
  plannedSessions,
  runners,
  safeguards,
  trainingPlans,
  users,
});
