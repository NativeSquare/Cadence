import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { conversations, messages } from "./ai/messages";
import { adminInvites } from "./table/adminInvites";
import { feedback } from "./table/feedback";
import { runners } from "./table/runners";
import { stravaConnections } from "./table/stravaConnections";
import { users } from "./table/users";

export default defineSchema({
  ...authTables,
  adminInvites,
  conversations,
  feedback,
  messages,
  runners,
  stravaConnections,
  users,
});
