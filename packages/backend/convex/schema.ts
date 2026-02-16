import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { conversations, messages } from "./ai/messages";
import { activities } from "./table/activities";
import { adminInvites } from "./table/adminInvites";
import { bodyMeasurements } from "./table/bodyMeasurements";
import { dailySummaries } from "./table/dailySummaries";
import { feedback } from "./table/feedback";
import { knowledgeBase } from "./table/knowledgeBase";
import { runners } from "./table/runners";
import { safeguards } from "./table/safeguards";
import { plannedSessions } from "./table/plannedSessions";
import { sleepSessions } from "./table/sleepSessions";
import { stravaConnections } from "./table/stravaConnections";
import { trainingPlans } from "./table/trainingPlans";
import { users } from "./table/users";

export default defineSchema({
  ...authTables,
  activities,
  adminInvites,
  bodyMeasurements,
  conversations,
  dailySummaries,
  feedback,
  knowledgeBase,
  messages,
  plannedSessions,
  runners,
  safeguards,
  sleepSessions,
  stravaConnections,
  trainingPlans,
  users,
});
