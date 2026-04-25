/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agoge from "../agoge.js";
import type * as ai_http_action from "../ai/http_action.js";
import type * as ai_messages from "../ai/messages.js";
import type * as ai_prompts_coach_os from "../ai/prompts/coach_os.js";
import type * as ai_prompts_onboarding_coach from "../ai/prompts/onboarding_coach.js";
import type * as ai_prompts_plan_generator from "../ai/prompts/plan_generator.js";
import type * as ai_tools_actions from "../ai/tools/actions.js";
import type * as ai_tools_index from "../ai/tools/index.js";
import type * as ai_tools_reads from "../ai/tools/reads.js";
import type * as audiences from "../audiences.js";
import type * as auth from "../auth.js";
import type * as broadcastSend from "../broadcastSend.js";
import type * as broadcasts from "../broadcasts.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as integrations_notifications from "../integrations/notifications.js";
import type * as intelligence_candidates from "../intelligence/candidates.js";
import type * as intelligence_context from "../intelligence/context.js";
import type * as intelligence_delivery from "../intelligence/delivery.js";
import type * as intelligence_events from "../intelligence/events.js";
import type * as intelligence_prompts from "../intelligence/prompts.js";
import type * as intelligence_router from "../intelligence/router.js";
import type * as intelligence_specialists_body from "../intelligence/specialists/body.js";
import type * as intelligence_specialists_mind from "../intelligence/specialists/mind.js";
import type * as intelligence_specialists_types from "../intelligence/specialists/types.js";
import type * as knowledge_index from "../knowledge/index.js";
import type * as knowledge_query from "../knowledge/query.js";
import type * as lib_auth_ResendOTP from "../lib/auth/ResendOTP.js";
import type * as lib_auth_ResendOTPPasswordReset from "../lib/auth/ResendOTPPasswordReset.js";
import type * as lib_provenanceHelpers from "../lib/provenanceHelpers.js";
import type * as migrations from "../migrations.js";
import type * as plan_actions from "../plan/actions.js";
import type * as plan_athlete from "../plan/athlete.js";
import type * as plan_events from "../plan/events.js";
import type * as plan_generate from "../plan/generate.js";
import type * as plan_index from "../plan/index.js";
import type * as plan_legacy from "../plan/legacy.js";
import type * as plan_reads from "../plan/reads.js";
import type * as plan_state from "../plan/state.js";
import type * as plan_tools from "../plan/tools.js";
import type * as plan_transcript from "../plan/transcript.js";
import type * as plan_workoutTemplates from "../plan/workoutTemplates.js";
import type * as plan_zones from "../plan/zones.js";
import type * as safeguards_check from "../safeguards/check.js";
import type * as safeguards_index from "../safeguards/index.js";
import type * as seeds_knowledgeBase from "../seeds/knowledgeBase.js";
import type * as seeds_safeguards from "../seeds/safeguards.js";
import type * as soma_adapter_fromSoma from "../soma/adapter/fromSoma.js";
import type * as soma_adapter_index from "../soma/adapter/index.js";
import type * as soma_adapter_toSoma from "../soma/adapter/toSoma.js";
import type * as soma_adapter_types from "../soma/adapter/types.js";
import type * as soma_garmin from "../soma/garmin.js";
import type * as soma_healthkit from "../soma/healthkit.js";
import type * as soma_index from "../soma/index.js";
import type * as soma_strava from "../soma/strava.js";
import type * as soma_webhook from "../soma/webhook.js";
import type * as storage from "../storage.js";
import type * as table_activities from "../table/activities.js";
import type * as table_admin from "../table/admin.js";
import type * as table_adminInvites from "../table/adminInvites.js";
import type * as table_audienceMembers from "../table/audienceMembers.js";
import type * as table_audiences from "../table/audiences.js";
import type * as table_broadcastRecipients from "../table/broadcastRecipients.js";
import type * as table_broadcasts from "../table/broadcasts.js";
import type * as table_contacts from "../table/contacts.js";
import type * as table_feedback from "../table/feedback.js";
import type * as table_knowledgeBase from "../table/knowledgeBase.js";
import type * as table_pushTokens from "../table/pushTokens.js";
import type * as table_safeguards from "../table/safeguards.js";
import type * as table_users from "../table/users.js";
import type * as unsubscribe from "../unsubscribe.js";
import type * as utils_generateFunctions from "../utils/generateFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agoge: typeof agoge;
  "ai/http_action": typeof ai_http_action;
  "ai/messages": typeof ai_messages;
  "ai/prompts/coach_os": typeof ai_prompts_coach_os;
  "ai/prompts/onboarding_coach": typeof ai_prompts_onboarding_coach;
  "ai/prompts/plan_generator": typeof ai_prompts_plan_generator;
  "ai/tools/actions": typeof ai_tools_actions;
  "ai/tools/index": typeof ai_tools_index;
  "ai/tools/reads": typeof ai_tools_reads;
  audiences: typeof audiences;
  auth: typeof auth;
  broadcastSend: typeof broadcastSend;
  broadcasts: typeof broadcasts;
  contacts: typeof contacts;
  crons: typeof crons;
  emails: typeof emails;
  http: typeof http;
  "integrations/notifications": typeof integrations_notifications;
  "intelligence/candidates": typeof intelligence_candidates;
  "intelligence/context": typeof intelligence_context;
  "intelligence/delivery": typeof intelligence_delivery;
  "intelligence/events": typeof intelligence_events;
  "intelligence/prompts": typeof intelligence_prompts;
  "intelligence/router": typeof intelligence_router;
  "intelligence/specialists/body": typeof intelligence_specialists_body;
  "intelligence/specialists/mind": typeof intelligence_specialists_mind;
  "intelligence/specialists/types": typeof intelligence_specialists_types;
  "knowledge/index": typeof knowledge_index;
  "knowledge/query": typeof knowledge_query;
  "lib/auth/ResendOTP": typeof lib_auth_ResendOTP;
  "lib/auth/ResendOTPPasswordReset": typeof lib_auth_ResendOTPPasswordReset;
  "lib/provenanceHelpers": typeof lib_provenanceHelpers;
  migrations: typeof migrations;
  "plan/actions": typeof plan_actions;
  "plan/athlete": typeof plan_athlete;
  "plan/events": typeof plan_events;
  "plan/generate": typeof plan_generate;
  "plan/index": typeof plan_index;
  "plan/legacy": typeof plan_legacy;
  "plan/reads": typeof plan_reads;
  "plan/state": typeof plan_state;
  "plan/tools": typeof plan_tools;
  "plan/transcript": typeof plan_transcript;
  "plan/workoutTemplates": typeof plan_workoutTemplates;
  "plan/zones": typeof plan_zones;
  "safeguards/check": typeof safeguards_check;
  "safeguards/index": typeof safeguards_index;
  "seeds/knowledgeBase": typeof seeds_knowledgeBase;
  "seeds/safeguards": typeof seeds_safeguards;
  "soma/adapter/fromSoma": typeof soma_adapter_fromSoma;
  "soma/adapter/index": typeof soma_adapter_index;
  "soma/adapter/toSoma": typeof soma_adapter_toSoma;
  "soma/adapter/types": typeof soma_adapter_types;
  "soma/garmin": typeof soma_garmin;
  "soma/healthkit": typeof soma_healthkit;
  "soma/index": typeof soma_index;
  "soma/strava": typeof soma_strava;
  "soma/webhook": typeof soma_webhook;
  storage: typeof storage;
  "table/activities": typeof table_activities;
  "table/admin": typeof table_admin;
  "table/adminInvites": typeof table_adminInvites;
  "table/audienceMembers": typeof table_audienceMembers;
  "table/audiences": typeof table_audiences;
  "table/broadcastRecipients": typeof table_broadcastRecipients;
  "table/broadcasts": typeof table_broadcasts;
  "table/contacts": typeof table_contacts;
  "table/feedback": typeof table_feedback;
  "table/knowledgeBase": typeof table_knowledgeBase;
  "table/pushTokens": typeof table_pushTokens;
  "table/safeguards": typeof table_safeguards;
  "table/users": typeof table_users;
  unsubscribe: typeof unsubscribe;
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
          reset?: boolean;
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
  agoge: {
    public: {
      createAthlete: FunctionReference<
        "mutation",
        "internal",
        {
          dateOfBirth?: string;
          experienceLevel?: string;
          heightCm?: number;
          injuryStatus?: string;
          name?: string;
          sex?: "male" | "female" | "other";
          userId: string;
          weightKg?: number;
          yearsRunning?: number;
        },
        any
      >;
      createBlock: FunctionReference<
        "mutation",
        "internal",
        {
          endDate: string;
          focus?: string;
          name: string;
          order: number;
          planId: string;
          startDate: string;
          type: "base" | "build" | "peak" | "taper" | "recovery";
        },
        any
      >;
      createEvent: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          date: string;
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name: string;
          notes?: string;
          sport: "run";
          type?: "race" | "life_event";
        },
        any
      >;
      createGoal: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          description?: string;
          raceId?: string;
          rank?: "primary" | "stretch" | "minimum" | "process";
          status: "active" | "achieved" | "missed" | "abandoned" | "paused";
          targetDate?: string;
          targetValue: string;
          title: string;
          type:
            | "performance"
            | "process"
            | "volume"
            | "completion"
            | "body"
            | "other";
        },
        any
      >;
      createPlan: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          endDate: string;
          name: string;
          notes?: string;
          startDate: string;
          status: "draft" | "active" | "completed" | "archived";
          targetRaceId?: string;
        },
        any
      >;
      createRace: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          bibNumber?: string;
          courseType?:
            | "loop"
            | "point_to_point"
            | "out_and_back"
            | "laps"
            | "stages"
            | "other";
          discipline: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
          eventId: string;
          format?:
            | "5k"
            | "10k"
            | "15k"
            | "10_miles"
            | "half_marathon"
            | "marathon"
            | "50k"
            | "50_miles"
            | "100k"
            | "100_miles"
            | "backyard_ultra"
            | "multi_day_stage"
            | "relay"
            | "custom";
          itraCategory?: "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL";
          priority: "A" | "B" | "C";
          registrationUrl?: string;
          result?: {
            avgPaceSecPerKm?: number;
            finishTime?: string;
            finishTimeSec?: number;
            notes?: string;
            placement?: number;
            placementInAgeGroup?: number;
            placementInGender?: number;
            totalFinishers?: number;
          };
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        },
        any
      >;
      createWorkout: FunctionReference<
        "mutation",
        "internal",
        {
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          adherence?: {
            algorithmVersion: string;
            distanceMatch?: number;
            durationMatch?: number;
            intensityMatch?: number;
            score: number;
            structureMatch?: number;
          };
          athleteId: string;
          blockId?: string;
          description?: string;
          name: string;
          planId?: string;
          planned?: {
            avgHr?: number;
            avgPaceMps?: number;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          scheduledDate: string;
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
          subSport?:
            | "track"
            | "trail"
            | "treadmill"
            | "street"
            | "indoor"
            | "virtual";
          templateId?: string;
          type:
            | "easy"
            | "long"
            | "tempo"
            | "threshold"
            | "intervals"
            | "vo2max"
            | "fartlek"
            | "progression"
            | "race_pace"
            | "recovery"
            | "strides"
            | "hills"
            | "race"
            | "test"
            | "cross_training"
            | "strength"
            | "rest"
            | "other";
          typeNotes?: string;
        },
        any
      >;
      createWorkoutTemplate: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          content: {
            avgHr?: number;
            avgPaceMps?: number;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          description?: string;
          name: string;
          sport: "run";
          subSport?:
            | "track"
            | "trail"
            | "treadmill"
            | "street"
            | "indoor"
            | "virtual";
          type:
            | "easy"
            | "long"
            | "tempo"
            | "threshold"
            | "intervals"
            | "vo2max"
            | "fartlek"
            | "progression"
            | "race_pace"
            | "recovery"
            | "strides"
            | "hills"
            | "race"
            | "test"
            | "cross_training"
            | "strength"
            | "rest"
            | "other";
          typeNotes?: string;
        },
        any
      >;
      createZone: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          boundaries: Array<number>;
          effectiveFrom: string;
          kind: "hr" | "pace";
          maxHr?: number;
          restingHr?: number;
          source?: string;
          sport: "run";
          threshold: number;
        },
        any
      >;
      deleteAthlete: FunctionReference<
        "mutation",
        "internal",
        { athleteId: string },
        any
      >;
      deleteBlock: FunctionReference<
        "mutation",
        "internal",
        { blockId: string },
        any
      >;
      deleteEvent: FunctionReference<
        "mutation",
        "internal",
        { eventId: string },
        any
      >;
      deleteGoal: FunctionReference<
        "mutation",
        "internal",
        { goalId: string },
        any
      >;
      deletePlan: FunctionReference<
        "mutation",
        "internal",
        { planId: string },
        any
      >;
      deleteRace: FunctionReference<
        "mutation",
        "internal",
        { raceId: string },
        any
      >;
      deleteWorkout: FunctionReference<
        "mutation",
        "internal",
        { workoutId: string },
        any
      >;
      deleteWorkoutTemplate: FunctionReference<
        "mutation",
        "internal",
        { templateId: string },
        any
      >;
      deleteZone: FunctionReference<
        "mutation",
        "internal",
        { zoneId: string },
        any
      >;
      getAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string },
        any
      >;
      getAthleteByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      getBlock: FunctionReference<
        "query",
        "internal",
        { blockId: string },
        any
      >;
      getBlocksByPlan: FunctionReference<
        "query",
        "internal",
        { planId: string },
        any
      >;
      getEvent: FunctionReference<
        "query",
        "internal",
        { eventId: string },
        any
      >;
      getEventsByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string },
        any
      >;
      getGoal: FunctionReference<"query", "internal", { goalId: string }, any>;
      getGoalsByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "active" | "achieved" | "missed" | "abandoned" | "paused";
        },
        any
      >;
      getGoalsByRace: FunctionReference<
        "query",
        "internal",
        { raceId: string },
        any
      >;
      getPlan: FunctionReference<"query", "internal", { planId: string }, any>;
      getPlansByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "draft" | "active" | "completed" | "archived";
        },
        any
      >;
      getPlansByRace: FunctionReference<
        "query",
        "internal",
        { raceId: string },
        any
      >;
      getRace: FunctionReference<"query", "internal", { raceId: string }, any>;
      getRacesByAthleteAndPriority: FunctionReference<
        "query",
        "internal",
        { athleteId: string; priority: "A" | "B" | "C" },
        any
      >;
      getRacesByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
        },
        any
      >;
      getRacesByEvent: FunctionReference<
        "query",
        "internal",
        { eventId: string },
        any
      >;
      getWorkout: FunctionReference<
        "query",
        "internal",
        { workoutId: string },
        any
      >;
      getWorkoutsByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string; endDate: string; startDate: string },
        any
      >;
      getWorkoutsByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "planned" | "completed" | "missed" | "skipped";
        },
        any
      >;
      getWorkoutsByBlock: FunctionReference<
        "query",
        "internal",
        { blockId: string },
        any
      >;
      getWorkoutsByPlan: FunctionReference<
        "query",
        "internal",
        { planId: string },
        any
      >;
      getWorkoutTemplate: FunctionReference<
        "query",
        "internal",
        { templateId: string },
        any
      >;
      getWorkoutTemplatesByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId?: string },
        any
      >;
      getZone: FunctionReference<"query", "internal", { zoneId: string }, any>;
      getZoneByAthleteEffectiveFrom: FunctionReference<
        "query",
        "internal",
        { athleteId: string; effectiveFrom: string; kind: "hr" | "pace" },
        any
      >;
      getZoneByAthleteKind: FunctionReference<
        "query",
        "internal",
        { athleteId: string; kind: "hr" | "pace" },
        any
      >;
      updateAthlete: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          dateOfBirth?: string;
          experienceLevel?: string;
          heightCm?: number;
          injuryStatus?: string;
          name?: string;
          sex?: "male" | "female" | "other";
          userId?: string;
          weightKg?: number;
          yearsRunning?: number;
        },
        any
      >;
      updateBlock: FunctionReference<
        "mutation",
        "internal",
        {
          blockId: string;
          endDate?: string;
          focus?: string;
          name?: string;
          order?: number;
          planId?: string;
          startDate?: string;
          type?: "base" | "build" | "peak" | "taper" | "recovery";
        },
        any
      >;
      updateEvent: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          date?: string;
          eventId: string;
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name?: string;
          notes?: string;
          sport?: "run";
          type?: "race" | "life_event";
        },
        any
      >;
      updateGoal: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          description?: string;
          goalId: string;
          raceId?: string;
          rank?: "primary" | "stretch" | "minimum" | "process";
          status?: "active" | "achieved" | "missed" | "abandoned" | "paused";
          targetDate?: string;
          targetValue?: string;
          title?: string;
          type?:
            | "performance"
            | "process"
            | "volume"
            | "completion"
            | "body"
            | "other";
        },
        any
      >;
      updatePlan: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          endDate?: string;
          name?: string;
          notes?: string;
          planId: string;
          startDate?: string;
          status?: "draft" | "active" | "completed" | "archived";
          targetRaceId?: string;
        },
        any
      >;
      updateRace: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          bibNumber?: string;
          courseType?:
            | "loop"
            | "point_to_point"
            | "out_and_back"
            | "laps"
            | "stages"
            | "other";
          discipline?: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters?: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
          eventId?: string;
          format?:
            | "5k"
            | "10k"
            | "15k"
            | "10_miles"
            | "half_marathon"
            | "marathon"
            | "50k"
            | "50_miles"
            | "100k"
            | "100_miles"
            | "backyard_ultra"
            | "multi_day_stage"
            | "relay"
            | "custom";
          itraCategory?: "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL";
          priority?: "A" | "B" | "C";
          raceId: string;
          registrationUrl?: string;
          result?: {
            avgPaceSecPerKm?: number;
            finishTime?: string;
            finishTimeSec?: number;
            notes?: string;
            placement?: number;
            placementInAgeGroup?: number;
            placementInGender?: number;
            totalFinishers?: number;
          };
          status?: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        },
        any
      >;
      updateWorkout: FunctionReference<
        "mutation",
        "internal",
        {
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          adherence?: {
            algorithmVersion: string;
            distanceMatch?: number;
            durationMatch?: number;
            intensityMatch?: number;
            score: number;
            structureMatch?: number;
          };
          athleteId?: string;
          blockId?: string;
          description?: string;
          name?: string;
          planId?: string;
          planned?: {
            avgHr?: number;
            avgPaceMps?: number;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          scheduledDate?: string;
          sport?: "run";
          status?: "planned" | "completed" | "missed" | "skipped";
          subSport?:
            | "track"
            | "trail"
            | "treadmill"
            | "street"
            | "indoor"
            | "virtual";
          templateId?: string;
          type?:
            | "easy"
            | "long"
            | "tempo"
            | "threshold"
            | "intervals"
            | "vo2max"
            | "fartlek"
            | "progression"
            | "race_pace"
            | "recovery"
            | "strides"
            | "hills"
            | "race"
            | "test"
            | "cross_training"
            | "strength"
            | "rest"
            | "other";
          typeNotes?: string;
          workoutId: string;
        },
        any
      >;
      updateWorkoutTemplate: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          content?: {
            avgHr?: number;
            avgPaceMps?: number;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          description?: string;
          name?: string;
          sport?: "run";
          subSport?:
            | "track"
            | "trail"
            | "treadmill"
            | "street"
            | "indoor"
            | "virtual";
          templateId: string;
          type?:
            | "easy"
            | "long"
            | "tempo"
            | "threshold"
            | "intervals"
            | "vo2max"
            | "fartlek"
            | "progression"
            | "race_pace"
            | "recovery"
            | "strides"
            | "hills"
            | "race"
            | "test"
            | "cross_training"
            | "strength"
            | "rest"
            | "other";
          typeNotes?: string;
        },
        any
      >;
      updateZone: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId?: string;
          boundaries?: Array<number>;
          effectiveFrom?: string;
          kind?: "hr" | "pace";
          maxHr?: number;
          restingHr?: number;
          source?: string;
          sport?: "run";
          threshold?: number;
          zoneId: string;
        },
        any
      >;
    };
  };
  seshat: {
    memory: {
      core: {
        getCoreMemory: FunctionReference<
          "query",
          "internal",
          { userId: string },
          {
            _creationTime: number;
            _id: string;
            content: string;
            updatedAt: number;
            userId: string;
            version: number;
          } | null
        >;
        writeCoreMemory: FunctionReference<
          "mutation",
          "internal",
          { content: string; userId: string },
          string
        >;
      };
      daily: {
        getDailyLog: FunctionReference<
          "query",
          "internal",
          { date: string; userId: string },
          null | {
            _creationTime: number;
            _id: string;
            content: string;
            createdAt: number;
            date: string;
            metrics?: any;
            updatedAt: number;
            userId: string;
          }
        >;
        getDailyLogs: FunctionReference<
          "query",
          "internal",
          { dates: Array<string>; userId: string },
          Array<{
            _creationTime: number;
            _id: string;
            content: string;
            createdAt: number;
            date: string;
            metrics?: any;
            updatedAt: number;
            userId: string;
          }>
        >;
        writeDailyLog: FunctionReference<
          "mutation",
          "internal",
          { content: string; date: string; metrics?: any; userId: string },
          string
        >;
      };
      episodic: {
        addEpisode: FunctionReference<
          "mutation",
          "internal",
          {
            content: string;
            embedding?: Array<number>;
            importance: number;
            sourceConversationId?: string;
            tags: Array<string>;
            userId: string;
          },
          string
        >;
        searchEpisodes: FunctionReference<
          "action",
          "internal",
          {
            limit?: number;
            mmrLambda?: number;
            query?: string;
            queryEmbedding: Array<number>;
            temporalDecayHalfLife?: number;
            textWeight?: number;
            userId: string;
            vectorWeight?: number;
          },
          Array<{
            _id: string;
            content: string;
            createdAt: number;
            importance: number;
            score: number;
            sourceConversationId?: string;
            tags: Array<string>;
          }>
        >;
      };
      state: {
        getAgentState: FunctionReference<
          "query",
          "internal",
          { userId: string },
          null | {
            _creationTime: number;
            _id: string;
            compactionCount: number;
            lastCompactionAt?: number;
            lastInteractionAt: number;
            memoryVersion: number;
            totalTokensUsed: number;
            userId: string;
          }
        >;
        recordCompaction: FunctionReference<
          "mutation",
          "internal",
          { userId: string },
          null
        >;
        updateTokenCount: FunctionReference<
          "mutation",
          "internal",
          { tokens: number; userId: string },
          string
        >;
      };
    };
  };
  soma: {
    garmin: {
      public: {
        backfillAll: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        completeGarminOAuth: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            code: string;
            redirectUri?: string;
            state: string;
          },
          any
        >;
        deleteSchedule: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            plannedWorkoutId: string;
            userId: string;
          },
          any
        >;
        deleteWorkout: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            plannedWorkoutId: string;
            userId: string;
          },
          any
        >;
        disconnectGarmin: FunctionReference<
          "action",
          "internal",
          { userId: string },
          any
        >;
        getGarminAuthUrl: FunctionReference<
          "action",
          "internal",
          { clientId: string; redirectUri?: string; userId: string },
          any
        >;
        pullActivities: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullAll: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullBloodPressures: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullBody: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullDailies: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullHRV: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullMenstruation: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullPulseOx: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullRespiration: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullSkinTemperature: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullSleep: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullStressDetails: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pullUserMetrics: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            endTimeInSeconds?: number;
            startTimeInSeconds?: number;
            userId: string;
          },
          any
        >;
        pushSchedule: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            date?: string;
            plannedWorkoutId: string;
            userId: string;
          },
          any
        >;
        pushWorkout: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            plannedWorkoutId: string;
            userId: string;
            workoutProvider?: string;
          },
          any
        >;
      };
      webhooks: {
        handleGarminWebhookActivities: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookActivityDetails: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookBloodPressures: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookBodyCompositions: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookDailies: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookDeregistration: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookEpochs: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookHealthSnapshot: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookHRVSummary: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookManuallyUpdatedActivities: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookMenstrualCycleTracking: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookMoveIQ: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookPulseOx: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookRespiration: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookSkinTemp: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookSleeps: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookStress: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
        handleGarminWebhookUserMetrics: FunctionReference<
          "action",
          "internal",
          { autoIngest?: boolean; payload: any },
          any
        >;
      };
    };
    healthkit: {
      public: {
        connect: FunctionReference<
          "mutation",
          "internal",
          { userId: string },
          string
        >;
        disconnect: FunctionReference<
          "mutation",
          "internal",
          { userId: string },
          null
        >;
        syncActivities: FunctionReference<
          "mutation",
          "internal",
          {
            userId: string;
            workouts: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              duration: number;
              endDate: string;
              heartRateSamples?: Array<{
                device?: {
                  hardwareVersion?: string;
                  manufacturer?: string;
                  model?: string;
                  name?: string;
                  softwareVersion?: string;
                };
                endDate: string;
                sampleType: string;
                source?: { bundleIdentifier: string; name: string };
                startDate: string;
                unit: string;
                uuid: string;
                value: number;
              }>;
              routeData?: Array<{
                locations: Array<{
                  altitude?: number;
                  latitude: number;
                  longitude: number;
                  timestamp: string;
                }>;
              }>;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              totalDistance?: number;
              totalEnergyBurned?: number;
              totalFlightsClimbed?: number;
              totalSwimmingStrokeCount?: number;
              uuid: string;
              workoutActivityType: number;
            }>;
          },
          {
            data: { activities: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncAll: FunctionReference<
          "mutation",
          "internal",
          {
            bodySamples?: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              unit: string;
              uuid: string;
              value: number;
            }>;
            bodyTimeRange?: { end_time: string; start_time: string };
            characteristics?: {
              biologicalSex?: "female" | "male" | "other" | "notSet";
              bloodType?: string;
              dateOfBirth?: string;
              fitzpatrickSkinType?: number;
              wheelchairUse?: boolean;
            };
            dailySamples?: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              unit: string;
              uuid: string;
              value: number;
            }>;
            dailySummaries?: Array<{
              activeEnergyBurned: number;
              activeEnergyBurnedGoal: number;
              appleExerciseTime: number;
              appleExerciseTimeGoal: number;
              appleStandHours: number;
              appleStandHoursGoal: number;
              dateComponents: { day: number; month: number; year: number };
            }>;
            dailyTimeRange?: { end_time: string; start_time: string };
            menstruationSamples?: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              uuid: string;
              value: number;
            }>;
            menstruationTimeRange?: { end_time: string; start_time: string };
            nutritionSamples?: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              unit: string;
              uuid: string;
              value: number;
            }>;
            nutritionTimeRange?: { end_time: string; start_time: string };
            sleepSessions?: Array<
              Array<{
                device?: {
                  hardwareVersion?: string;
                  manufacturer?: string;
                  model?: string;
                  name?: string;
                  softwareVersion?: string;
                };
                endDate: string;
                sampleType: string;
                source?: { bundleIdentifier: string; name: string };
                startDate: string;
                uuid: string;
                value: number;
              }>
            >;
            userId: string;
            workouts?: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              duration: number;
              endDate: string;
              heartRateSamples?: Array<{
                device?: {
                  hardwareVersion?: string;
                  manufacturer?: string;
                  model?: string;
                  name?: string;
                  softwareVersion?: string;
                };
                endDate: string;
                sampleType: string;
                source?: { bundleIdentifier: string; name: string };
                startDate: string;
                unit: string;
                uuid: string;
                value: number;
              }>;
              routeData?: Array<{
                locations: Array<{
                  altitude?: number;
                  latitude: number;
                  longitude: number;
                  timestamp: string;
                }>;
              }>;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              totalDistance?: number;
              totalEnergyBurned?: number;
              totalFlightsClimbed?: number;
              totalSwimmingStrokeCount?: number;
              uuid: string;
              workoutActivityType: number;
            }>;
          },
          {
            data: Record<string, number>;
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncAthlete: FunctionReference<
          "mutation",
          "internal",
          {
            characteristics: {
              biologicalSex?: "female" | "male" | "other" | "notSet";
              bloodType?: string;
              dateOfBirth?: string;
              fitzpatrickSkinType?: number;
              wheelchairUse?: boolean;
            };
            userId: string;
          },
          {
            data: { athletes: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncBody: FunctionReference<
          "mutation",
          "internal",
          {
            samples: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              unit: string;
              uuid: string;
              value: number;
            }>;
            timeRange?: { end_time: string; start_time: string };
            userId: string;
          },
          {
            data: { body: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncDaily: FunctionReference<
          "mutation",
          "internal",
          {
            samples: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              unit: string;
              uuid: string;
              value: number;
            }>;
            timeRange?: { end_time: string; start_time: string };
            userId: string;
          },
          {
            data: { daily: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncDailyFromSummary: FunctionReference<
          "mutation",
          "internal",
          {
            summaries: Array<{
              activeEnergyBurned: number;
              activeEnergyBurnedGoal: number;
              appleExerciseTime: number;
              appleExerciseTimeGoal: number;
              appleStandHours: number;
              appleStandHoursGoal: number;
              dateComponents: { day: number; month: number; year: number };
            }>;
            userId: string;
          },
          {
            data: { daily: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncMenstruation: FunctionReference<
          "mutation",
          "internal",
          {
            samples: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              uuid: string;
              value: number;
            }>;
            timeRange?: { end_time: string; start_time: string };
            userId: string;
          },
          {
            data: { menstruation: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncNutrition: FunctionReference<
          "mutation",
          "internal",
          {
            samples: Array<{
              device?: {
                hardwareVersion?: string;
                manufacturer?: string;
                model?: string;
                name?: string;
                softwareVersion?: string;
              };
              endDate: string;
              sampleType: string;
              source?: { bundleIdentifier: string; name: string };
              startDate: string;
              unit: string;
              uuid: string;
              value: number;
            }>;
            timeRange?: { end_time: string; start_time: string };
            userId: string;
          },
          {
            data: { nutrition: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
        syncSleep: FunctionReference<
          "mutation",
          "internal",
          {
            sessions: Array<
              Array<{
                device?: {
                  hardwareVersion?: string;
                  manufacturer?: string;
                  model?: string;
                  name?: string;
                  softwareVersion?: string;
                };
                endDate: string;
                sampleType: string;
                source?: { bundleIdentifier: string; name: string };
                startDate: string;
                uuid: string;
                value: number;
              }>
            >;
            userId: string;
          },
          {
            data: { sleep: number };
            errors: Array<{ id: string; message: string; type: string }>;
          }
        >;
      };
    };
    public: {
      connect: FunctionReference<
        "mutation",
        "internal",
        { provider: string; providerUserId?: string; userId: string },
        string
      >;
      deleteConnection: FunctionReference<
        "mutation",
        "internal",
        { connectionId: string },
        null
      >;
      deletePlannedWorkout: FunctionReference<
        "mutation",
        "internal",
        { plannedWorkoutId: string },
        null
      >;
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { provider: string; userId: string },
        null
      >;
      getAthlete: FunctionReference<
        "query",
        "internal",
        { connectionId: string },
        any
      >;
      getConnection: FunctionReference<
        "query",
        "internal",
        { connectionId: string },
        null | {
          _creationTime: number;
          _id: string;
          active?: boolean;
          lastDataUpdate?: string;
          provider: string;
          providerUserId?: string;
          stats?: {
            activities: { count: number; oldest: string | null };
            body: { count: number; oldest: string | null };
            daily: { count: number; oldest: string | null };
            menstruation: { count: number; oldest: string | null };
            nutrition: { count: number; oldest: string | null };
            plannedWorkouts: { count: number; oldest: string | null };
            sleep: { count: number; oldest: string | null };
          };
          userId: string;
        }
      >;
      getConnectionByProvider: FunctionReference<
        "query",
        "internal",
        { provider: string; userId: string },
        null | {
          _creationTime: number;
          _id: string;
          active?: boolean;
          lastDataUpdate?: string;
          provider: string;
          providerUserId?: string;
          stats?: {
            activities: { count: number; oldest: string | null };
            body: { count: number; oldest: string | null };
            daily: { count: number; oldest: string | null };
            menstruation: { count: number; oldest: string | null };
            nutrition: { count: number; oldest: string | null };
            plannedWorkouts: { count: number; oldest: string | null };
            sleep: { count: number; oldest: string | null };
          };
          userId: string;
        }
      >;
      getPlannedWorkout: FunctionReference<
        "query",
        "internal",
        { plannedWorkoutId: string },
        any
      >;
      getProviderStats: FunctionReference<
        "query",
        "internal",
        { provider: string; userId: string },
        null | {
          activities: { count: number; oldest: string | null };
          body: { count: number; oldest: string | null };
          daily: { count: number; oldest: string | null };
          menstruation: { count: number; oldest: string | null };
          nutrition: { count: number; oldest: string | null };
          plannedWorkouts: { count: number; oldest: string | null };
          sleep: { count: number; oldest: string | null };
        }
      >;
      ingestActivity: FunctionReference<
        "mutation",
        "internal",
        {
          MET_data?: {
            MET_samples?: Array<{ level?: number; timestamp?: string }>;
            avg_level?: number;
            num_high_intensity_minutes?: number;
            num_inactive_minutes?: number;
            num_low_intensity_minutes?: number;
            num_moderate_intensity_minutes?: number;
          };
          TSS_data?: {
            TSS_samples?: Array<{
              actual?: number;
              intensity_factor_actual?: number;
              intensity_factor_planned?: number;
              method?: string;
              normalized_power_watts?: number;
              planned?: number;
            }>;
          };
          active_durations_data?: {
            activity_levels_samples?: Array<{
              level?: number;
              timestamp?: string;
            }>;
            activity_seconds?: number;
            inactivity_seconds?: number;
            low_intensity_seconds?: number;
            moderate_intensity_seconds?: number;
            num_continuous_inactive_periods?: number;
            rest_seconds?: number;
            standing_hours_count?: number;
            standing_seconds?: number;
            vigorous_intensity_seconds?: number;
          };
          calories_data?: {
            BMR_calories?: number;
            calorie_samples?: Array<{
              calories?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            net_activity_calories?: number;
            net_intake_calories?: number;
            total_burned_calories?: number;
          };
          cheat_detection?: number;
          connectionId: string;
          data_enrichment?: { stress_score?: number };
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          distance_data?: {
            detailed?: {
              distance_samples?: Array<{
                distance_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              elevation_samples?: Array<{
                elev_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              floors_climbed_samples?: Array<{
                floors_climbed?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              step_samples?: Array<{
                steps?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              distance_meters?: number;
              elevation?: {
                avg_meters?: number;
                gain_actual_meters?: number;
                gain_planned_meters?: number;
                loss_actual_meters?: number;
                max_meters?: number;
                min_meters?: number;
              };
              floors_climbed?: number;
              steps?: number;
              swimming?: {
                num_laps?: number;
                num_strokes?: number;
                pool_length_meters?: number;
              };
            };
          };
          energy_data?: {
            energy_kilojoules?: number;
            energy_planned_kilojoules?: number;
          };
          heart_rate_data?: {
            detailed?: {
              hr_samples?: Array<{
                bpm?: number;
                context?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              hrv_samples_rmssd?: Array<{
                hrv_rmssd?: number;
                timestamp?: string;
              }>;
              hrv_samples_sdnn?: Array<{
                hrv_sdnn?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              avg_hr_bpm?: number;
              avg_hrv_rmssd?: number;
              avg_hrv_sdnn?: number;
              hr_zone_data?: Array<{
                duration_seconds?: number;
                end_percentage?: number;
                name?: string;
                start_percentage?: number;
                zone?: number;
              }>;
              max_hr_bpm?: number;
              min_hr_bpm?: number;
              resting_hr_bpm?: number;
              user_max_hr_bpm?: number;
            };
          };
          lap_data?: {
            laps?: Array<{
              avg_hr_bpm?: number;
              avg_speed_meters_per_second?: number;
              calories?: number;
              distance_meters?: number;
              end_time?: string;
              start_time?: string;
              stroke_type?: string;
              total_strokes?: number;
            }>;
          };
          metadata: {
            city?: string;
            country?: string;
            end_time: string;
            name?: string;
            start_time: string;
            state?: string;
            summary_id: string;
            timestamp_localization?: number;
            type: number;
            upload_type: number;
          };
          movement_data?: {
            adjusted_max_speed_meters_per_second?: number;
            avg_cadence_rpm?: number;
            avg_pace_minutes_per_kilometer?: number;
            avg_speed_meters_per_second?: number;
            avg_torque_newton_meters?: number;
            avg_velocity_meters_per_second?: number;
            cadence_samples?: Array<{
              cadence_rpm?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            max_cadence_rpm?: number;
            max_pace_minutes_per_kilometer?: number;
            max_speed_meters_per_second?: number;
            max_torque_newton_meters?: number;
            max_velocity_meters_per_second?: number;
            normalized_speed_meters_per_second?: number;
            speed_samples?: Array<{
              speed_meters_per_second?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            torque_samples?: Array<{
              timer_duration_seconds?: number;
              timestamp?: string;
              torque_newton_meters?: number;
            }>;
          };
          oxygen_data?: {
            avg_saturation_percentage?: number;
            saturation_samples?: Array<{
              percentage?: number;
              timestamp?: string;
              type?: number;
            }>;
            vo2_samples?: Array<{
              timestamp?: string;
              vo2max_ml_per_min_per_kg?: number;
            }>;
            vo2max_ml_per_min_per_kg?: number;
          };
          polyline_map_data?: { summary_polyline?: string };
          position_data?: {
            center_pos_lat_lng_deg?: Array<number>;
            end_pos_lat_lng_deg?: Array<number>;
            position_samples?: Array<{
              coords_lat_lng_deg?: Array<number>;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            start_pos_lat_lng_deg?: Array<number>;
          };
          power_data?: {
            avg_watts?: number;
            max_watts?: number;
            power_samples?: Array<{
              timer_duration_seconds?: number;
              timestamp?: string;
              watts?: number;
            }>;
          };
          strain_data?: { strain_level?: number };
          userId: string;
          work_data?: { work_kilojoules?: number };
        },
        string
      >;
      ingestAthlete: FunctionReference<
        "mutation",
        "internal",
        {
          age?: number;
          bio?: string;
          city?: string;
          connectionId: string;
          country?: string;
          date_of_birth?: string;
          devices?: Array<any>;
          email?: string;
          first_name?: string;
          gender?: string;
          joined_provider?: string;
          last_name?: string;
          sex?: string;
          state?: string;
          userId: string;
        },
        string
      >;
      ingestBody: FunctionReference<
        "mutation",
        "internal",
        {
          blood_pressure_data?: {
            blood_pressure_samples?: Array<{
              diastolic_bp?: number;
              systolic_bp?: number;
              timestamp?: string;
            }>;
          };
          connectionId: string;
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          glucose_data?: {
            blood_glucose_samples?: Array<{
              blood_glucose_mg_per_dL?: number;
              glucose_level_flag?: number;
              timestamp?: string;
              trend_arrow?: number;
            }>;
            daily_patterns?: Array<{
              percentile_25?: number;
              percentile_5?: number;
              percentile_50?: number;
              percentile_75?: number;
              percentile_95?: number;
              time_from_midnight?: number;
            }>;
            day_avg_blood_glucose_mg_per_dL?: number;
            detailed_blood_glucose_samples?: Array<{
              blood_glucose_mg_per_dL?: number;
              glucose_level_flag?: number;
              timestamp?: string;
              trend_arrow?: number;
            }>;
            gmi?: number;
            sensor_usage?: number;
            time_in_range?: number;
          };
          heart_data?: {
            afib_classification_samples?: Array<{
              afib_classification?: number;
              timestamp?: string;
            }>;
            ecg_signal?: Array<{
              afib_classification?: number;
              avg_hr_bpm?: number;
              raw_signal?: Array<{ potential_uV?: number; timestamp?: string }>;
              start_timestamp?: string;
            }>;
            heart_rate_data?: {
              detailed?: {
                hr_samples?: Array<{
                  bpm?: number;
                  context?: number;
                  timer_duration_seconds?: number;
                  timestamp?: string;
                }>;
                hrv_samples_rmssd?: Array<{
                  hrv_rmssd?: number;
                  timestamp?: string;
                }>;
                hrv_samples_sdnn?: Array<{
                  hrv_sdnn?: number;
                  timestamp?: string;
                }>;
              };
              summary?: {
                avg_hr_bpm?: number;
                avg_hrv_rmssd?: number;
                avg_hrv_sdnn?: number;
                hr_zone_data?: Array<{
                  duration_seconds?: number;
                  end_percentage?: number;
                  name?: string;
                  start_percentage?: number;
                  zone?: number;
                }>;
                max_hr_bpm?: number;
                min_hr_bpm?: number;
                resting_hr_bpm?: number;
                user_max_hr_bpm?: number;
              };
            };
            pulse_wave_velocity_samples?: Array<{
              pulse_wave_velocity_meters_per_second?: number;
              timestamp?: string;
            }>;
            rr_interval_samples?: Array<{
              hr_bpm?: number;
              rr_interval_ms?: number;
              timestamp?: string;
            }>;
          };
          hydration_data?: {
            day_total_water_consumption_ml?: number;
            hydration_amount_samples?: Array<{
              hydration_kg?: number;
              timestamp?: string;
            }>;
          };
          ketone_data?: {
            ketone_samples?: Array<{
              ketone_mg_per_dL?: number;
              sample_type?: number;
              timestamp?: string;
            }>;
          };
          measurements_data?: {
            measurements?: Array<{
              BMI?: number;
              BMR?: number;
              RMR?: number;
              bodyfat_percentage?: number;
              bone_mass_g?: number;
              estimated_fitness_age?: string;
              height_cm?: number;
              insulin_type?: string;
              insulin_units?: number;
              lean_mass_g?: number;
              measurement_time?: string;
              muscle_mass_g?: number;
              skin_fold_mm?: number;
              urine_color?: string;
              user_notes?: string;
              water_percentage?: number;
              weight_kg?: number;
            }>;
          };
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
          };
          oxygen_data?: {
            avg_saturation_percentage?: number;
            saturation_samples?: Array<{
              percentage?: number;
              timestamp?: string;
              type?: number;
            }>;
            vo2_samples?: Array<{
              timestamp?: string;
              vo2max_ml_per_min_per_kg?: number;
            }>;
            vo2max_ml_per_min_per_kg?: number;
          };
          temperature_data?: {
            ambient_temperature_samples?: Array<{
              temperature_celsius?: number;
              timestamp?: string;
            }>;
            body_temperature_samples?: Array<{
              temperature_celsius?: number;
              timestamp?: string;
            }>;
            skin_temperature_samples?: Array<{
              temperature_celsius?: number;
              timestamp?: string;
            }>;
          };
          userId: string;
        },
        string
      >;
      ingestDaily: FunctionReference<
        "mutation",
        "internal",
        {
          MET_data?: {
            MET_samples?: Array<{ level?: number; timestamp?: string }>;
            avg_level?: number;
            num_high_intensity_minutes?: number;
            num_inactive_minutes?: number;
            num_low_intensity_minutes?: number;
            num_moderate_intensity_minutes?: number;
          };
          active_durations_data?: {
            activity_levels_samples?: Array<{
              level?: number;
              timestamp?: string;
            }>;
            activity_seconds?: number;
            inactivity_seconds?: number;
            low_intensity_seconds?: number;
            moderate_intensity_seconds?: number;
            num_continuous_inactive_periods?: number;
            rest_seconds?: number;
            standing_hours_count?: number;
            standing_seconds?: number;
            vigorous_intensity_seconds?: number;
          };
          calories_data?: {
            BMR_calories?: number;
            calorie_samples?: Array<{
              calories?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            net_activity_calories?: number;
            net_intake_calories?: number;
            total_burned_calories?: number;
          };
          connectionId: string;
          data_enrichment?: {
            cardiovascular_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            cardiovascular_score?: number;
            immune_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            immune_index?: number;
            readiness_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            readiness_score?: number;
            respiratory_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            respiratory_score?: number;
            start_time?: string;
            stress_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            total_stress_score?: number;
          };
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          distance_data?: {
            detailed?: {
              distance_samples?: Array<{
                distance_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              elevation_samples?: Array<{
                elev_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              floors_climbed_samples?: Array<{
                floors_climbed?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              step_samples?: Array<{
                steps?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
            };
            distance_meters?: number;
            elevation?: {
              avg_meters?: number;
              gain_actual_meters?: number;
              gain_planned_meters?: number;
              loss_actual_meters?: number;
              max_meters?: number;
              min_meters?: number;
            };
            floors_climbed?: number;
            steps?: number;
            swimming?: {
              num_laps?: number;
              num_strokes?: number;
              pool_length_meters?: number;
            };
          };
          heart_rate_data?: {
            detailed?: {
              hr_samples?: Array<{
                bpm?: number;
                context?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              hrv_samples_rmssd?: Array<{
                hrv_rmssd?: number;
                timestamp?: string;
              }>;
              hrv_samples_sdnn?: Array<{
                hrv_sdnn?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              avg_hr_bpm?: number;
              avg_hrv_rmssd?: number;
              avg_hrv_sdnn?: number;
              hr_zone_data?: Array<{
                duration_seconds?: number;
                end_percentage?: number;
                name?: string;
                start_percentage?: number;
                zone?: number;
              }>;
              max_hr_bpm?: number;
              min_hr_bpm?: number;
              resting_hr_bpm?: number;
              user_max_hr_bpm?: number;
            };
          };
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
            upload_type: number;
          };
          oxygen_data?: {
            avg_saturation_percentage?: number;
            saturation_samples?: Array<{
              percentage?: number;
              timestamp?: string;
              type?: number;
            }>;
            vo2_samples?: Array<{
              timestamp?: string;
              vo2max_ml_per_min_per_kg?: number;
            }>;
            vo2max_ml_per_min_per_kg?: number;
          };
          respiration_data?: {
            breaths_data?: {
              avg_breaths_per_min?: number;
              max_breaths_per_min?: number;
              min_breaths_per_min?: number;
              samples?: Array<{ breaths_per_min?: number; timestamp?: string }>;
            };
          };
          scores?: {
            activity?: number;
            biological_age?: number;
            recovery?: number;
            sleep?: number;
          };
          strain_data?: { strain_level?: number };
          stress_data?: {
            activity_stress_duration_seconds?: number;
            avg_stress_level?: number;
            body_battery_samples?: Array<{
              level?: number;
              timestamp?: string;
            }>;
            high_stress_duration_seconds?: number;
            low_stress_duration_seconds?: number;
            max_stress_level?: number;
            medium_stress_duration_seconds?: number;
            rest_stress_duration_seconds?: number;
            samples?: Array<{ level?: number; timestamp?: string }>;
            stress_duration_seconds?: number;
            stress_rating?: number;
          };
          tag_data?: {
            tags?: Array<{
              notes: string;
              tag_name: string;
              timestamp: string;
            }>;
          };
          userId: string;
        },
        string
      >;
      ingestMenstruation: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          menstruation_data?: {
            current_phase?: string;
            cycle_length_days?: string;
            day_in_cycle?: number;
            days_until_next_phase?: number;
            is_predicted_cycle?: string;
            last_updated_time?: string;
            length_of_current_phase_days?: number;
            menstruation_flow?: Array<{ flow?: number; timestamp?: string }>;
            period_length_days?: number;
            period_start_date?: string;
            predicted_cycle_length_days?: number;
          };
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
          };
          userId: string;
        },
        string
      >;
      ingestNutrition: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          drink_samples?: Array<{
            drink_name?: string;
            drink_unit?: string;
            drink_volume?: number;
            timestamp?: string;
          }>;
          meals?: Array<{
            id: string;
            macros: {
              alcohol_g?: number;
              calories?: number;
              carbohydrates_g?: number;
              cholesterol_mg?: number;
              fat_g?: number;
              fiber_g?: number;
              net_carbohydrates_g?: number;
              protein_g?: number;
              saturated_fat_g?: number;
              sodium_mg?: number;
              sugar_g?: number;
              trans_fat_g?: number;
            };
            micros: {
              biotin_mg?: number;
              caffeine_mg?: number;
              calcium_mg?: number;
              chloride_mg?: number;
              chromium_mg?: number;
              copper_mg?: number;
              cystine_g?: number;
              folate_mg?: number;
              folic_acid_mg?: number;
              histidine_g?: number;
              iodine_mg?: number;
              iron_mg?: number;
              isoleucine_g?: number;
              leucine_g?: number;
              lysine_g?: number;
              magnesium_mg?: number;
              manganese_mg?: number;
              methionine_g?: number;
              molybdenum_mg?: number;
              monounsaturated_fat_g?: number;
              niacin_mg?: number;
              omega3_g?: number;
              omega6_g?: number;
              pantothenic_acid_mg?: number;
              phenylalanine_g?: number;
              phosphorus_mg?: number;
              polyunsaturated_fat_g?: number;
              potassium_mg?: number;
              riboflavin_mg?: number;
              selenium_mg?: number;
              starch_g?: number;
              thiamin_mg?: number;
              threonine_g?: number;
              tryptophan_g?: number;
              tyrosine_g?: number;
              valine_g?: number;
              vitamin_A_mg?: number;
              vitamin_B12_mg?: number;
              vitamin_B6_mg?: number;
              vitamin_C_mg?: number;
              vitamin_D2_mg?: number;
              vitamin_D3_mg?: number;
              vitamin_D_mg?: number;
              vitamin_E_mg?: number;
              vitamin_K_mg?: number;
              zinc_mg?: number;
            };
            name: string;
            quantity: { amount: number; unit: number };
            timestamp: string;
            type: number;
          }>;
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
          };
          summary?: {
            drink_ml?: number;
            macros?: {
              alcohol_g?: number;
              calories?: number;
              carbohydrates_g?: number;
              cholesterol_mg?: number;
              fat_g?: number;
              fiber_g?: number;
              net_carbohydrates_g?: number;
              protein_g?: number;
              saturated_fat_g?: number;
              sodium_mg?: number;
              sugar_g?: number;
              trans_fat_g?: number;
            };
            micros?: {
              biotin_mg?: number;
              caffeine_mg?: number;
              calcium_mg?: number;
              chloride_mg?: number;
              chromium_mg?: number;
              copper_mg?: number;
              cystine_g?: number;
              folate_mg?: number;
              folic_acid_mg?: number;
              histidine_g?: number;
              iodine_mg?: number;
              iron_mg?: number;
              isoleucine_g?: number;
              leucine_g?: number;
              lysine_g?: number;
              magnesium_mg?: number;
              manganese_mg?: number;
              methionine_g?: number;
              molybdenum_mg?: number;
              monounsaturated_fat_g?: number;
              niacin_mg?: number;
              omega3_g?: number;
              omega6_g?: number;
              pantothenic_acid_mg?: number;
              phenylalanine_g?: number;
              phosphorus_mg?: number;
              polyunsaturated_fat_g?: number;
              potassium_mg?: number;
              riboflavin_mg?: number;
              selenium_mg?: number;
              starch_g?: number;
              thiamin_mg?: number;
              threonine_g?: number;
              tryptophan_g?: number;
              tyrosine_g?: number;
              valine_g?: number;
              vitamin_A_mg?: number;
              vitamin_B12_mg?: number;
              vitamin_B6_mg?: number;
              vitamin_C_mg?: number;
              vitamin_D2_mg?: number;
              vitamin_D3_mg?: number;
              vitamin_D_mg?: number;
              vitamin_E_mg?: number;
              vitamin_K_mg?: number;
              zinc_mg?: number;
            };
            water_ml?: number;
          };
          userId: string;
        },
        string
      >;
      ingestPlannedWorkout: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          metadata: {
            created_date?: string;
            description?: string;
            estimated_calories?: number;
            estimated_distance_meters?: number;
            estimated_duration_seconds?: number;
            estimated_elevation_gain_meters?: number;
            estimated_energy_kj?: number;
            estimated_if?: number;
            estimated_pace_minutes_per_kilometer?: number;
            estimated_speed_meters_per_second?: number;
            estimated_tscore?: number;
            estimated_tss?: number;
            id?: string;
            name?: string;
            planned_date?: string;
            pool_length_meters?: number;
            provider?: string;
            provider_schedule_id?: string;
            provider_workout_id?: string;
            type?: string;
          };
          steps?: Array<{
            description?: string;
            durations?: Array<{
              calories?: number;
              distance_meters?: number;
              duration_type?: string;
              hr_above_bpm?: number;
              hr_below_bpm?: number;
              power_above_watts?: number;
              power_below_watts?: number;
              reps?: number;
              rest_seconds?: number;
              seconds?: number;
              steps?: number;
            }>;
            equipment_type?: string;
            exercise_category?: string;
            exercise_name?: string;
            intensity?: string | number;
            name?: string;
            order?: number;
            steps?: Array<any>;
            stroke_type?: string;
            targets?: Array<{
              cadence?: number;
              cadence_high?: number;
              cadence_low?: number;
              hr_bpm_high?: number;
              hr_bpm_low?: number;
              hr_percentage?: number;
              hr_percentage_high?: number;
              hr_percentage_low?: number;
              if_high?: number;
              if_low?: number;
              pace_minutes_per_kilometer?: number;
              power_percentage?: number;
              power_percentage_high?: number;
              power_percentage_low?: number;
              power_watt?: number;
              power_watt_high?: number;
              power_watt_low?: number;
              repetitions?: number;
              speed_meters_per_second?: number;
              speed_percentage?: number;
              speed_percentage_high?: number;
              speed_percentage_low?: number;
              swim_strokes?: number;
              target_type?: string;
              tss?: number;
            }>;
            type?: string;
            weight_kg?: number;
          }>;
          userId: string;
        },
        string
      >;
      ingestSleep: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          data_enrichment?: {
            sleep_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            sleep_score?: number;
          };
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          heart_rate_data?: {
            detailed?: {
              hr_samples?: Array<{
                bpm?: number;
                context?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              hrv_samples_rmssd?: Array<{
                hrv_rmssd?: number;
                timestamp?: string;
              }>;
              hrv_samples_sdnn?: Array<{
                hrv_sdnn?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              avg_hr_bpm?: number;
              avg_hrv_rmssd?: number;
              avg_hrv_sdnn?: number;
              hr_zone_data?: Array<{
                duration_seconds?: number;
                end_percentage?: number;
                name?: string;
                start_percentage?: number;
                zone?: number;
              }>;
              max_hr_bpm?: number;
              min_hr_bpm?: number;
              resting_hr_bpm?: number;
              user_max_hr_bpm?: number;
            };
          };
          metadata: {
            end_time: string;
            is_nap?: boolean;
            start_time: string;
            summary_id?: string;
            timestamp_localization?: number;
            upload_type: number;
          };
          readiness_data?: { readiness?: number; recovery_level?: number };
          respiration_data?: {
            breaths_data?: {
              avg_breaths_per_min?: number;
              end_time?: string;
              max_breaths_per_min?: number;
              min_breaths_per_min?: number;
              on_demand_reading?: boolean;
              samples?: Array<{ breaths_per_min?: number; timestamp?: string }>;
              start_time?: string;
            };
            oxygen_saturation_data?: {
              avg_saturation_percentage?: number;
              end_time?: string;
              samples?: Array<{
                percentage?: number;
                timestamp?: string;
                type?: number;
              }>;
              start_time?: string;
            };
            snoring_data?: {
              end_time?: string;
              num_snoring_events?: number;
              samples?: Array<{
                duration_seconds?: number;
                timestamp?: string;
              }>;
              start_time?: string;
              total_snoring_duration_seconds?: number;
            };
          };
          scores?: { sleep?: number };
          sleep_durations_data?: {
            asleep?: {
              duration_REM_sleep_state_seconds?: number;
              duration_asleep_state_seconds?: number;
              duration_deep_sleep_state_seconds?: number;
              duration_light_sleep_state_seconds?: number;
              num_REM_events?: number;
            };
            awake?: {
              duration_awake_state_seconds?: number;
              duration_long_interruption_seconds?: number;
              duration_short_interruption_seconds?: number;
              num_out_of_bed_events?: number;
              num_wakeup_events?: number;
              sleep_latency_seconds?: number;
              wake_up_latency_seconds?: number;
            };
            hypnogram_samples?: Array<{ level?: number; timestamp?: string }>;
            other?: {
              duration_in_bed_seconds?: number;
              duration_unmeasurable_sleep_seconds?: number;
            };
            sleep_efficiency?: number;
          };
          temperature_data?: { delta?: number };
          userId: string;
        },
        string
      >;
      listActivities: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any
      >;
      listAthletes: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      listBody: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any
      >;
      listConnections: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          active?: boolean;
          lastDataUpdate?: string;
          provider: string;
          providerUserId?: string;
          stats?: {
            activities: { count: number; oldest: string | null };
            body: { count: number; oldest: string | null };
            daily: { count: number; oldest: string | null };
            menstruation: { count: number; oldest: string | null };
            nutrition: { count: number; oldest: string | null };
            plannedWorkouts: { count: number; oldest: string | null };
            sleep: { count: number; oldest: string | null };
          };
          userId: string;
        }>
      >;
      listDaily: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any
      >;
      listMenstruation: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any
      >;
      listNutrition: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any
      >;
      listPlannedWorkouts: FunctionReference<
        "query",
        "internal",
        {
          endDate?: string;
          limit?: number;
          order?: "asc" | "desc";
          startDate?: string;
          userId: string;
        },
        any
      >;
      listSleep: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any
      >;
      paginateActivities: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any
      >;
      paginateBody: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any
      >;
      paginateDaily: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any
      >;
      paginateMenstruation: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any
      >;
      paginateNutrition: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any
      >;
      paginatePlannedWorkouts: FunctionReference<
        "query",
        "internal",
        {
          endDate?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startDate?: string;
          userId: string;
        },
        any
      >;
      paginateSleep: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any
      >;
      updateConnection: FunctionReference<
        "mutation",
        "internal",
        {
          active?: boolean;
          connectionId: string;
          lastDataUpdate?: string;
          providerUserId?: string;
        },
        null
      >;
    };
    strava: {
      public: {
        completeStravaOAuth: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            clientSecret: string;
            code: string;
            state: string;
          },
          { connectionId: string; userId: string }
        >;
        disconnectStrava: FunctionReference<
          "action",
          "internal",
          { clientId: string; clientSecret: string; userId: string },
          null
        >;
        getStravaAuthUrl: FunctionReference<
          "action",
          "internal",
          {
            clientId: string;
            redirectUri: string;
            scope?: string;
            userId: string;
          },
          any
        >;
        pullActivities: FunctionReference<
          "action",
          "internal",
          {
            after?: number;
            before?: number;
            clientId: string;
            clientSecret: string;
            userId: string;
          },
          any
        >;
        pullAll: FunctionReference<
          "action",
          "internal",
          {
            after?: number;
            before?: number;
            clientId: string;
            clientSecret: string;
            userId: string;
          },
          any
        >;
        pullAthlete: FunctionReference<
          "action",
          "internal",
          { clientId: string; clientSecret: string; userId: string },
          any
        >;
      };
      webhooks: {
        handleStravaWebhook: FunctionReference<
          "action",
          "internal",
          {
            autoIngest?: boolean;
            clientId: string;
            clientSecret: string;
            payload: any;
          },
          any
        >;
      };
    };
  };
};
