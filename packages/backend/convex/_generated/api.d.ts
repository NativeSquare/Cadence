/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_http_action from "../ai/http_action.js";
import type * as ai_messages from "../ai/messages.js";
import type * as ai_prompts_onboarding_coach from "../ai/prompts/onboarding_coach.js";
import type * as ai_tools_index from "../ai/tools/index.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as healthkit from "../healthkit.js";
import type * as http from "../http.js";
import type * as integrations_healthkit_sync from "../integrations/healthkit/sync.js";
import type * as knowledge_index from "../knowledge/index.js";
import type * as knowledge_query from "../knowledge/query.js";
import type * as lib_adapters_healthkit from "../lib/adapters/healthkit.js";
import type * as lib_adapters_index from "../lib/adapters/index.js";
import type * as lib_adapters_registry from "../lib/adapters/registry.js";
import type * as lib_adapters_types from "../lib/adapters/types.js";
import type * as lib_auth_ResendOTP from "../lib/auth/ResendOTP.js";
import type * as lib_auth_ResendOTPPasswordReset from "../lib/auth/ResendOTPPasswordReset.js";
import type * as lib_inferenceEngine from "../lib/inferenceEngine.js";
import type * as lib_provenanceHelpers from "../lib/provenanceHelpers.js";
import type * as migrations from "../migrations.js";
import type * as safeguards_check from "../safeguards/check.js";
import type * as safeguards_index from "../safeguards/index.js";
import type * as seeds_knowledgeBase from "../seeds/knowledgeBase.js";
import type * as seeds_safeguards from "../seeds/safeguards.js";
import type * as storage from "../storage.js";
import type * as strava from "../strava.js";
import type * as table_activities from "../table/activities.js";
import type * as table_admin from "../table/admin.js";
import type * as table_adminInvites from "../table/adminInvites.js";
import type * as table_bodyMeasurements from "../table/bodyMeasurements.js";
import type * as table_dailySummaries from "../table/dailySummaries.js";
import type * as table_feedback from "../table/feedback.js";
import type * as table_knowledgeBase from "../table/knowledgeBase.js";
import type * as table_plannedSessions from "../table/plannedSessions.js";
import type * as table_runners from "../table/runners.js";
import type * as table_safeguards from "../table/safeguards.js";
import type * as table_sleepSessions from "../table/sleepSessions.js";
import type * as table_stravaConnections from "../table/stravaConnections.js";
import type * as table_trainingPlans from "../table/trainingPlans.js";
import type * as table_users from "../table/users.js";
import type * as utils_generateFunctions from "../utils/generateFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/http_action": typeof ai_http_action;
  "ai/messages": typeof ai_messages;
  "ai/prompts/onboarding_coach": typeof ai_prompts_onboarding_coach;
  "ai/tools/index": typeof ai_tools_index;
  auth: typeof auth;
  crons: typeof crons;
  emails: typeof emails;
  healthkit: typeof healthkit;
  http: typeof http;
  "integrations/healthkit/sync": typeof integrations_healthkit_sync;
  "knowledge/index": typeof knowledge_index;
  "knowledge/query": typeof knowledge_query;
  "lib/adapters/healthkit": typeof lib_adapters_healthkit;
  "lib/adapters/index": typeof lib_adapters_index;
  "lib/adapters/registry": typeof lib_adapters_registry;
  "lib/adapters/types": typeof lib_adapters_types;
  "lib/auth/ResendOTP": typeof lib_auth_ResendOTP;
  "lib/auth/ResendOTPPasswordReset": typeof lib_auth_ResendOTPPasswordReset;
  "lib/inferenceEngine": typeof lib_inferenceEngine;
  "lib/provenanceHelpers": typeof lib_provenanceHelpers;
  migrations: typeof migrations;
  "safeguards/check": typeof safeguards_check;
  "safeguards/index": typeof safeguards_index;
  "seeds/knowledgeBase": typeof seeds_knowledgeBase;
  "seeds/safeguards": typeof seeds_safeguards;
  storage: typeof storage;
  strava: typeof strava;
  "table/activities": typeof table_activities;
  "table/admin": typeof table_admin;
  "table/adminInvites": typeof table_adminInvites;
  "table/bodyMeasurements": typeof table_bodyMeasurements;
  "table/dailySummaries": typeof table_dailySummaries;
  "table/feedback": typeof table_feedback;
  "table/knowledgeBase": typeof table_knowledgeBase;
  "table/plannedSessions": typeof table_plannedSessions;
  "table/runners": typeof table_runners;
  "table/safeguards": typeof table_safeguards;
  "table/sleepSessions": typeof table_sleepSessions;
  "table/stravaConnections": typeof table_stravaConnections;
  "table/trainingPlans": typeof table_trainingPlans;
  "table/users": typeof table_users;
  "utils/generateFunctions": typeof utils_generateFunctions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
          oneBatchOnly?: boolean;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: Array<string> | string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bcc?: Array<string>;
          bounced?: boolean;
          cc?: Array<string>;
          clicked?: boolean;
          complained: boolean;
          createdAt: number;
          deliveryDelayed?: boolean;
          errorMessage?: string;
          failed?: boolean;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bounced: boolean;
          clicked: boolean;
          complained: boolean;
          deliveryDelayed: boolean;
          errorMessage: string | null;
          failed: boolean;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          bcc?: Array<string>;
          cc?: Array<string>;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
