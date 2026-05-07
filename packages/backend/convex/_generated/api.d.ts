/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agoge_athletes from "../agoge/athletes.js";
import type * as agoge_blocks from "../agoge/blocks.js";
import type * as agoge_goals from "../agoge/goals.js";
import type * as agoge_helpers from "../agoge/helpers.js";
import type * as agoge_plans from "../agoge/plans.js";
import type * as agoge_races from "../agoge/races.js";
import type * as agoge_sync from "../agoge/sync.js";
import type * as agoge_workoutTemplates from "../agoge/workoutTemplates.js";
import type * as agoge_workouts from "../agoge/workouts.js";
import type * as agoge_zones from "../agoge/zones.js";
import type * as audiences from "../audiences.js";
import type * as auth from "../auth.js";
import type * as auth_ResendOTP from "../auth/ResendOTP.js";
import type * as auth_ResendOTPPasswordReset from "../auth/ResendOTPPasswordReset.js";
import type * as broadcastSend from "../broadcastSend.js";
import type * as broadcasts from "../broadcasts.js";
import type * as coach_agent from "../coach/agent.js";
import type * as coach_messages from "../coach/messages.js";
import type * as coach_philosophy_aggregates from "../coach/philosophy/aggregates.js";
import type * as coach_philosophy_context from "../coach/philosophy/context.js";
import type * as coach_philosophy_prompt from "../coach/philosophy/prompt.js";
import type * as coach_philosophy_registry from "../coach/philosophy/registry.js";
import type * as coach_philosophy_rules_deloadCadence from "../coach/philosophy/rules/deloadCadence.js";
import type * as coach_philosophy_rules_maxQualitySessionsPerWeek from "../coach/philosophy/rules/maxQualitySessionsPerWeek.js";
import type * as coach_philosophy_rules_taperBeforeRace from "../coach/philosophy/rules/taperBeforeRace.js";
import type * as coach_philosophy_rules_weeklyVolumeIncreaseCap from "../coach/philosophy/rules/weeklyVolumeIncreaseCap.js";
import type * as coach_philosophy_rules_workoutDistanceCap from "../coach/philosophy/rules/workoutDistanceCap.js";
import type * as coach_philosophy_runner from "../coach/philosophy/runner.js";
import type * as coach_philosophy_types from "../coach/philosophy/types.js";
import type * as coach_philosophy_validate from "../coach/philosophy/validate.js";
import type * as coach_threads from "../coach/threads.js";
import type * as coach_tools_reading from "../coach/tools/reading.js";
import type * as coach_tools_writing from "../coach/tools/writing.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as soma_garmin from "../soma/garmin.js";
import type * as soma_healthkit from "../soma/healthkit.js";
import type * as soma_index from "../soma/index.js";
import type * as soma_strava from "../soma/strava.js";
import type * as soma_webhook from "../soma/webhook.js";
import type * as storage from "../storage.js";
import type * as table_admin from "../table/admin.js";
import type * as table_adminInvites from "../table/adminInvites.js";
import type * as table_audienceMembers from "../table/audienceMembers.js";
import type * as table_audiences from "../table/audiences.js";
import type * as table_broadcastRecipients from "../table/broadcastRecipients.js";
import type * as table_broadcasts from "../table/broadcasts.js";
import type * as table_contacts from "../table/contacts.js";
import type * as table_feedback from "../table/feedback.js";
import type * as table_users from "../table/users.js";
import type * as unsubscribe from "../unsubscribe.js";
import type * as utils_generateFunctions from "../utils/generateFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agoge/athletes": typeof agoge_athletes;
  "agoge/blocks": typeof agoge_blocks;
  "agoge/goals": typeof agoge_goals;
  "agoge/helpers": typeof agoge_helpers;
  "agoge/plans": typeof agoge_plans;
  "agoge/races": typeof agoge_races;
  "agoge/sync": typeof agoge_sync;
  "agoge/workoutTemplates": typeof agoge_workoutTemplates;
  "agoge/workouts": typeof agoge_workouts;
  "agoge/zones": typeof agoge_zones;
  audiences: typeof audiences;
  auth: typeof auth;
  "auth/ResendOTP": typeof auth_ResendOTP;
  "auth/ResendOTPPasswordReset": typeof auth_ResendOTPPasswordReset;
  broadcastSend: typeof broadcastSend;
  broadcasts: typeof broadcasts;
  "coach/agent": typeof coach_agent;
  "coach/messages": typeof coach_messages;
  "coach/philosophy/aggregates": typeof coach_philosophy_aggregates;
  "coach/philosophy/context": typeof coach_philosophy_context;
  "coach/philosophy/prompt": typeof coach_philosophy_prompt;
  "coach/philosophy/registry": typeof coach_philosophy_registry;
  "coach/philosophy/rules/deloadCadence": typeof coach_philosophy_rules_deloadCadence;
  "coach/philosophy/rules/maxQualitySessionsPerWeek": typeof coach_philosophy_rules_maxQualitySessionsPerWeek;
  "coach/philosophy/rules/taperBeforeRace": typeof coach_philosophy_rules_taperBeforeRace;
  "coach/philosophy/rules/weeklyVolumeIncreaseCap": typeof coach_philosophy_rules_weeklyVolumeIncreaseCap;
  "coach/philosophy/rules/workoutDistanceCap": typeof coach_philosophy_rules_workoutDistanceCap;
  "coach/philosophy/runner": typeof coach_philosophy_runner;
  "coach/philosophy/types": typeof coach_philosophy_types;
  "coach/philosophy/validate": typeof coach_philosophy_validate;
  "coach/threads": typeof coach_threads;
  "coach/tools/reading": typeof coach_tools_reading;
  "coach/tools/writing": typeof coach_tools_writing;
  contacts: typeof contacts;
  crons: typeof crons;
  emails: typeof emails;
  http: typeof http;
  migrations: typeof migrations;
  notifications: typeof notifications;
  "soma/garmin": typeof soma_garmin;
  "soma/healthkit": typeof soma_healthkit;
  "soma/index": typeof soma_index;
  "soma/strava": typeof soma_strava;
  "soma/webhook": typeof soma_webhook;
  storage: typeof storage;
  "table/admin": typeof table_admin;
  "table/adminInvites": typeof table_adminInvites;
  "table/audienceMembers": typeof table_audienceMembers;
  "table/audiences": typeof table_audiences;
  "table/broadcastRecipients": typeof table_broadcastRecipients;
  "table/broadcasts": typeof table_broadcasts;
  "table/contacts": typeof table_contacts;
  "table/feedback": typeof table_feedback;
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
  agent: {
    apiKeys: {
      destroy: FunctionReference<
        "mutation",
        "internal",
        { apiKey?: string; name?: string },
        | "missing"
        | "deleted"
        | "name mismatch"
        | "must provide either apiKey or name"
      >;
      issue: FunctionReference<
        "mutation",
        "internal",
        { name?: string },
        string
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { apiKey: string },
        boolean
      >;
    };
    files: {
      addFile: FunctionReference<
        "mutation",
        "internal",
        {
          filename?: string;
          hash: string;
          mediaType?: string;
          mimeType?: string;
          storageId: string;
        },
        { fileId: string; storageId: string }
      >;
      copyFile: FunctionReference<
        "mutation",
        "internal",
        { fileId: string },
        null
      >;
      deleteFiles: FunctionReference<
        "mutation",
        "internal",
        { fileIds: Array<string>; force?: boolean },
        Array<string>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { fileId: string },
        null | {
          _creationTime: number;
          _id: string;
          filename?: string;
          hash: string;
          lastTouchedAt: number;
          mediaType?: string;
          mimeType?: string;
          refcount: number;
          storageId: string;
        }
      >;
      getFilesToDelete: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            filename?: string;
            hash: string;
            lastTouchedAt: number;
            mediaType?: string;
            mimeType?: string;
            refcount: number;
            storageId: string;
          }>;
        }
      >;
      useExistingFile: FunctionReference<
        "mutation",
        "internal",
        { filename?: string; hash: string },
        null | { fileId: string; storageId: string }
      >;
    };
    messages: {
      addMessages: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          embeddings?: {
            dimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            model: string;
            vectors: Array<Array<number> | null>;
          };
          failPendingSteps?: boolean;
          finishStreamId?: string;
          hideFromUserIdSearch?: boolean;
          messages: Array<{
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status?: "pending" | "success" | "failed";
            text?: string;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pendingMessageId?: string;
          promptMessageId?: string;
          threadId: string;
          userId?: string;
        },
        {
          messages: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
        }
      >;
      cloneThread: FunctionReference<
        "action",
        "internal",
        {
          batchSize?: number;
          copyUserIdForVectorSearch?: boolean;
          excludeToolMessages?: boolean;
          insertAtOrder?: number;
          limit?: number;
          sourceThreadId: string;
          statuses?: Array<"pending" | "success" | "failed">;
          targetThreadId: string;
          upToAndIncludingMessageId?: string;
        },
        number
      >;
      deleteByIds: FunctionReference<
        "mutation",
        "internal",
        { messageIds: Array<string> },
        Array<string>
      >;
      deleteByOrder: FunctionReference<
        "mutation",
        "internal",
        {
          endOrder: number;
          endStepOrder?: number;
          startOrder: number;
          startStepOrder?: number;
          threadId: string;
        },
        { isDone: boolean; lastOrder?: number; lastStepOrder?: number }
      >;
      finalizeMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          result: { status: "success" } | { error: string; status: "failed" };
        },
        null
      >;
      getMessagesByIds: FunctionReference<
        "query",
        "internal",
        { messageIds: Array<string> },
        Array<null | {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      getMessageSearchFields: FunctionReference<
        "query",
        "internal",
        { messageId: string },
        { embedding?: Array<number>; embeddingModel?: string; text?: string }
      >;
      listMessagesByThreadId: FunctionReference<
        "query",
        "internal",
        {
          excludeToolMessages?: boolean;
          order: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          statuses?: Array<"pending" | "success" | "failed">;
          threadId: string;
          upToAndIncludingMessageId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchMessages: FunctionReference<
        "action",
        "internal",
        {
          embedding?: Array<number>;
          embeddingModel?: string;
          limit: number;
          messageRange?: { after: number; before: number };
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          textSearch?: boolean;
          threadId?: string;
          vectorScoreThreshold?: number;
          vectorSearch?: boolean;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      textSearch: FunctionReference<
        "query",
        "internal",
        {
          limit: number;
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          threadId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      updateMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          patch: {
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerOptions?: Record<string, Record<string, any>>;
            status?: "pending" | "success" | "failed";
          };
        },
        {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }
      >;
    };
    streams: {
      abort: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          reason: string;
          streamId: string;
        },
        boolean
      >;
      abortByOrder: FunctionReference<
        "mutation",
        "internal",
        { order: number; reason: string; threadId: string },
        boolean
      >;
      addDelta: FunctionReference<
        "mutation",
        "internal",
        { end: number; parts: Array<any>; start: number; streamId: string },
        boolean
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          stepOrder: number;
          threadId: string;
          userId?: string;
        },
        string
      >;
      deleteAllStreamsForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        { deltaCursor?: string; streamOrder?: number; threadId: string },
        { deltaCursor?: string; isDone: boolean; streamOrder?: number }
      >;
      deleteAllStreamsForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { threadId: string },
        null
      >;
      deleteStreamAsync: FunctionReference<
        "mutation",
        "internal",
        { cursor?: string; streamId: string },
        null
      >;
      deleteStreamSync: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      finish: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          streamId: string;
        },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          startOrder?: number;
          statuses?: Array<"streaming" | "finished" | "aborted">;
          threadId: string;
        },
        Array<{
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          status: "streaming" | "finished" | "aborted";
          stepOrder: number;
          streamId: string;
          userId?: string;
        }>
      >;
      listDeltas: FunctionReference<
        "query",
        "internal",
        {
          cursors: Array<{ cursor: number; streamId: string }>;
          threadId: string;
        },
        Array<{
          end: number;
          parts: Array<any>;
          start: number;
          streamId: string;
        }>
      >;
    };
    threads: {
      createThread: FunctionReference<
        "mutation",
        "internal",
        {
          defaultSystemPrompt?: string;
          parentThreadIds?: Array<string>;
          summary?: string;
          title?: string;
          userId?: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
      deleteAllForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        {
          cursor?: string;
          deltaCursor?: string;
          limit?: number;
          messagesDone?: boolean;
          streamOrder?: number;
          streamsDone?: boolean;
          threadId: string;
        },
        { isDone: boolean }
      >;
      deleteAllForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { limit?: number; threadId: string },
        null
      >;
      getThread: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        } | null
      >;
      listThreadsByUserId: FunctionReference<
        "query",
        "internal",
        {
          order?: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            status: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchThreadTitles: FunctionReference<
        "query",
        "internal",
        { limit: number; query: string; userId?: string | null },
        Array<{
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }>
      >;
      updateThread: FunctionReference<
        "mutation",
        "internal",
        {
          patch: {
            status?: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          };
          threadId: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
    };
    users: {
      deleteAllForUserId: FunctionReference<
        "action",
        "internal",
        { userId: string },
        null
      >;
      deleteAllForUserIdAsync: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        boolean
      >;
      listUsersWithThreads: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<string>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
    vector: {
      index: {
        deleteBatch: FunctionReference<
          "mutation",
          "internal",
          {
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
          },
          null
        >;
        deleteBatchForThread: FunctionReference<
          "mutation",
          "internal",
          {
            cursor?: string;
            limit: number;
            model: string;
            threadId: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          { continueCursor: string; isDone: boolean }
        >;
        insertBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            vectors: Array<{
              messageId?: string;
              model: string;
              table: string;
              threadId?: string;
              userId?: string;
              vector: Array<number>;
            }>;
          },
          Array<
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
          >
        >;
        paginate: FunctionReference<
          "query",
          "internal",
          {
            cursor?: string;
            limit: number;
            table?: string;
            targetModel: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          {
            continueCursor: string;
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
            isDone: boolean;
          }
        >;
        updateBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectors: Array<{
              id:
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string;
              model: string;
              vector: Array<number>;
            }>;
          },
          null
        >;
      };
    };
  };
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
  pushNotifications: {
    public: {
      deleteNotificationsForUser: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
      >;
      getNotification: FunctionReference<
        "query",
        "internal",
        { id: string; logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" },
        null | {
          _contentAvailable?: boolean;
          _creationTime: number;
          badge?: number;
          body?: string;
          categoryId?: string;
          channelId?: string;
          data?: any;
          expiration?: number;
          interruptionLevel?:
            | "active"
            | "critical"
            | "passive"
            | "time-sensitive";
          mutableContent?: boolean;
          numPreviousFailures: number;
          priority?: "default" | "normal" | "high";
          sound?: string | null;
          state:
            | "awaiting_delivery"
            | "in_progress"
            | "delivered"
            | "needs_retry"
            | "failed"
            | "maybe_delivered"
            | "unable_to_deliver";
          subtitle?: string;
          title?: string;
          ttl?: number;
        }
      >;
      getNotificationsForUser: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          userId: string;
        },
        Array<{
          _contentAvailable?: boolean;
          _creationTime: number;
          badge?: number;
          body?: string;
          categoryId?: string;
          channelId?: string;
          data?: any;
          expiration?: number;
          id: string;
          interruptionLevel?:
            | "active"
            | "critical"
            | "passive"
            | "time-sensitive";
          mutableContent?: boolean;
          numPreviousFailures: number;
          priority?: "default" | "normal" | "high";
          sound?: string | null;
          state:
            | "awaiting_delivery"
            | "in_progress"
            | "delivered"
            | "needs_retry"
            | "failed"
            | "maybe_delivered"
            | "unable_to_deliver";
          subtitle?: string;
          title?: string;
          ttl?: number;
        }>
      >;
      getStatusForUser: FunctionReference<
        "query",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        { hasToken: boolean; paused: boolean }
      >;
      pauseNotificationsForUser: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
      >;
      recordPushNotificationToken: FunctionReference<
        "mutation",
        "internal",
        {
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          pushToken: string;
          userId: string;
        },
        null
      >;
      removePushNotificationToken: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
      >;
      restart: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" },
        boolean
      >;
      sendPushNotification: FunctionReference<
        "mutation",
        "internal",
        {
          allowUnregisteredTokens?: boolean;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          notification: {
            _contentAvailable?: boolean;
            badge?: number;
            body?: string;
            categoryId?: string;
            channelId?: string;
            data?: any;
            expiration?: number;
            interruptionLevel?:
              | "active"
              | "critical"
              | "passive"
              | "time-sensitive";
            mutableContent?: boolean;
            priority?: "default" | "normal" | "high";
            sound?: string | null;
            subtitle?: string;
            title?: string;
            ttl?: number;
          };
          userId: string;
        },
        string | null
      >;
      sendPushNotificationBatch: FunctionReference<
        "mutation",
        "internal",
        {
          allowUnregisteredTokens?: boolean;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          notifications: Array<{
            notification: {
              _contentAvailable?: boolean;
              badge?: number;
              body?: string;
              categoryId?: string;
              channelId?: string;
              data?: any;
              expiration?: number;
              interruptionLevel?:
                | "active"
                | "critical"
                | "passive"
                | "time-sensitive";
              mutableContent?: boolean;
              priority?: "default" | "normal" | "high";
              sound?: string | null;
              subtitle?: string;
              title?: string;
              ttl?: number;
            };
            userId: string;
          }>;
        },
        Array<string | null>
      >;
      shutdown: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR" },
        { data?: any; message: string }
      >;
      unpauseNotificationsForUser: FunctionReference<
        "mutation",
        "internal",
        { logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR"; userId: string },
        null
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
    garmin: {
      public: {
        createSchedule: FunctionReference<
          "action",
          "internal",
          {
            accessToken: string;
            schedule: { date: string; workoutId: number };
          },
          { scheduleId: number }
        >;
        createWorkout: FunctionReference<
          "action",
          "internal",
          { accessToken: string; workout: any },
          { workoutId: number }
        >;
        deleteSchedule: FunctionReference<
          "action",
          "internal",
          { accessToken: string; scheduleId: number },
          null
        >;
        deleteWorkout: FunctionReference<
          "action",
          "internal",
          { accessToken: string; workoutId: number },
          null
        >;
        updateSchedule: FunctionReference<
          "action",
          "internal",
          {
            accessToken: string;
            schedule: { date: string; workoutId: number };
            scheduleId: number;
          },
          null
        >;
        updateWorkout: FunctionReference<
          "action",
          "internal",
          { accessToken: string; workout: any; workoutId: number },
          null
        >;
      };
    };
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
        string
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
          type:
            | "base"
            | "build"
            | "peak"
            | "taper"
            | "recovery"
            | "maintenance"
            | "transition";
        },
        string
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
        string
      >;
      createPlan: FunctionReference<
        "mutation",
        "internal",
        {
          athleteId: string;
          endDate?: string;
          name: string;
          notes?: string;
          startDate: string;
          status: "draft" | "active" | "completed" | "archived";
          targetRaceId?: string;
        },
        string
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
          date: string;
          discipline: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
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
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name: string;
          notes?: string;
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
          sport: "run";
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        },
        string
      >;
      createWorkout: FunctionReference<
        "mutation",
        "internal",
        {
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        },
        string
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
            structure: any;
          };
          description?: string;
          name: string;
          sport: "run";
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
        },
        string
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
          threshold?: number;
        },
        string
      >;
      deleteAthlete: FunctionReference<
        "mutation",
        "internal",
        { athleteId: string },
        null
      >;
      deleteBlock: FunctionReference<
        "mutation",
        "internal",
        { blockId: string },
        null
      >;
      deleteGoal: FunctionReference<
        "mutation",
        "internal",
        { goalId: string },
        null
      >;
      deletePlan: FunctionReference<
        "mutation",
        "internal",
        { planId: string },
        null
      >;
      deleteRace: FunctionReference<
        "mutation",
        "internal",
        { raceId: string },
        null
      >;
      deleteWorkout: FunctionReference<
        "mutation",
        "internal",
        { workoutId: string },
        null
      >;
      deleteWorkoutProviderRef: FunctionReference<
        "mutation",
        "internal",
        { provider: "garmin"; workoutId: string },
        null
      >;
      deleteWorkoutTemplate: FunctionReference<
        "mutation",
        "internal",
        { templateId: string },
        null
      >;
      deleteZone: FunctionReference<
        "mutation",
        "internal",
        { zoneId: string },
        null
      >;
      getAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string },
        {
          _creationTime: number;
          _id: string;
          dateOfBirth?: string;
          experienceLevel?: string;
          heightCm?: number;
          injuryStatus?: string;
          name?: string;
          sex?: "male" | "female" | "other";
          userId: string;
          weightKg?: number;
          yearsRunning?: number;
        } | null
      >;
      getAthleteByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        {
          _creationTime: number;
          _id: string;
          dateOfBirth?: string;
          experienceLevel?: string;
          heightCm?: number;
          injuryStatus?: string;
          name?: string;
          sex?: "male" | "female" | "other";
          userId: string;
          weightKg?: number;
          yearsRunning?: number;
        } | null
      >;
      getBlock: FunctionReference<
        "query",
        "internal",
        { blockId: string },
        {
          _creationTime: number;
          _id: string;
          endDate: string;
          focus?: string;
          name: string;
          order: number;
          planId: string;
          startDate: string;
          type:
            | "base"
            | "build"
            | "peak"
            | "taper"
            | "recovery"
            | "maintenance"
            | "transition";
        } | null
      >;
      getBlocksByPlan: FunctionReference<
        "query",
        "internal",
        { planId: string },
        Array<{
          _creationTime: number;
          _id: string;
          endDate: string;
          focus?: string;
          name: string;
          order: number;
          planId: string;
          startDate: string;
          type:
            | "base"
            | "build"
            | "peak"
            | "taper"
            | "recovery"
            | "maintenance"
            | "transition";
        }>
      >;
      getCompletedWorkoutsByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string; endDate?: string; startDate?: string },
        Array<{
          _creationTime: number;
          _id: string;
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        }>
      >;
      getGoal: FunctionReference<
        "query",
        "internal",
        { goalId: string },
        {
          _creationTime: number;
          _id: string;
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
        } | null
      >;
      getGoalsByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "active" | "achieved" | "missed" | "abandoned" | "paused";
        },
        Array<{
          _creationTime: number;
          _id: string;
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
        }>
      >;
      getGoalsByRace: FunctionReference<
        "query",
        "internal",
        { raceId: string },
        Array<{
          _creationTime: number;
          _id: string;
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
        }>
      >;
      getPlan: FunctionReference<
        "query",
        "internal",
        { planId: string },
        {
          _creationTime: number;
          _id: string;
          athleteId: string;
          endDate?: string;
          name: string;
          notes?: string;
          startDate: string;
          status: "draft" | "active" | "completed" | "archived";
          targetRaceId?: string;
        } | null
      >;
      getPlannedWorkoutsByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string; endDate?: string; startDate?: string },
        Array<{
          _creationTime: number;
          _id: string;
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        }>
      >;
      getPlansByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "draft" | "active" | "completed" | "archived";
        },
        Array<{
          _creationTime: number;
          _id: string;
          athleteId: string;
          endDate?: string;
          name: string;
          notes?: string;
          startDate: string;
          status: "draft" | "active" | "completed" | "archived";
          targetRaceId?: string;
        }>
      >;
      getPlansByRace: FunctionReference<
        "query",
        "internal",
        { raceId: string },
        Array<{
          _creationTime: number;
          _id: string;
          athleteId: string;
          endDate?: string;
          name: string;
          notes?: string;
          startDate: string;
          status: "draft" | "active" | "completed" | "archived";
          targetRaceId?: string;
        }>
      >;
      getRace: FunctionReference<
        "query",
        "internal",
        { raceId: string },
        {
          _creationTime: number;
          _id: string;
          athleteId: string;
          bibNumber?: string;
          courseType?:
            | "loop"
            | "point_to_point"
            | "out_and_back"
            | "laps"
            | "stages"
            | "other";
          date: string;
          discipline: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
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
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name: string;
          notes?: string;
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
          sport: "run";
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        } | null
      >;
      getRacesByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId: string },
        Array<{
          _creationTime: number;
          _id: string;
          athleteId: string;
          bibNumber?: string;
          courseType?:
            | "loop"
            | "point_to_point"
            | "out_and_back"
            | "laps"
            | "stages"
            | "other";
          date: string;
          discipline: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
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
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name: string;
          notes?: string;
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
          sport: "run";
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        }>
      >;
      getRacesByAthleteAndPriority: FunctionReference<
        "query",
        "internal",
        { athleteId: string; priority: "A" | "B" | "C" },
        Array<{
          _creationTime: number;
          _id: string;
          athleteId: string;
          bibNumber?: string;
          courseType?:
            | "loop"
            | "point_to_point"
            | "out_and_back"
            | "laps"
            | "stages"
            | "other";
          date: string;
          discipline: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
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
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name: string;
          notes?: string;
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
          sport: "run";
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        }>
      >;
      getRacesByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
        },
        Array<{
          _creationTime: number;
          _id: string;
          athleteId: string;
          bibNumber?: string;
          courseType?:
            | "loop"
            | "point_to_point"
            | "out_and_back"
            | "laps"
            | "stages"
            | "other";
          date: string;
          discipline: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
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
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name: string;
          notes?: string;
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
          sport: "run";
          status: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        }>
      >;
      getWorkout: FunctionReference<
        "query",
        "internal",
        { workoutId: string },
        {
          _creationTime: number;
          _id: string;
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        } | null
      >;
      getWorkoutProviderRef: FunctionReference<
        "query",
        "internal",
        { provider: "garmin"; workoutId: string },
        {
          _creationTime: number;
          _id: string;
          externalScheduleId?: string;
          externalWorkoutId: string;
          provider: "garmin";
          syncedAt: number;
          workoutId: string;
        } | null
      >;
      getWorkoutProviderRefByExternalId: FunctionReference<
        "query",
        "internal",
        { externalWorkoutId: string; provider: "garmin" },
        {
          _creationTime: number;
          _id: string;
          externalScheduleId?: string;
          externalWorkoutId: string;
          provider: "garmin";
          syncedAt: number;
          workoutId: string;
        } | null
      >;
      getWorkoutProviderRefsByWorkout: FunctionReference<
        "query",
        "internal",
        { workoutId: string },
        Array<{
          _creationTime: number;
          _id: string;
          externalScheduleId?: string;
          externalWorkoutId: string;
          provider: "garmin";
          syncedAt: number;
          workoutId: string;
        }>
      >;
      getWorkoutsByAthleteAndStatus: FunctionReference<
        "query",
        "internal",
        {
          athleteId: string;
          status: "planned" | "completed" | "missed" | "skipped";
        },
        Array<{
          _creationTime: number;
          _id: string;
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        }>
      >;
      getWorkoutsByBlock: FunctionReference<
        "query",
        "internal",
        { blockId: string },
        Array<{
          _creationTime: number;
          _id: string;
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        }>
      >;
      getWorkoutsByPlan: FunctionReference<
        "query",
        "internal",
        { planId: string },
        Array<{
          _creationTime: number;
          _id: string;
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport: "run";
          status: "planned" | "completed" | "missed" | "skipped";
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
        }>
      >;
      getWorkoutTemplate: FunctionReference<
        "query",
        "internal",
        { templateId: string },
        {
          _creationTime: number;
          _id: string;
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
            structure: any;
          };
          description?: string;
          name: string;
          sport: "run";
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
        } | null
      >;
      getWorkoutTemplatesByAthlete: FunctionReference<
        "query",
        "internal",
        { athleteId?: string },
        Array<{
          _creationTime: number;
          _id: string;
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
            structure: any;
          };
          description?: string;
          name: string;
          sport: "run";
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
        }>
      >;
      getZone: FunctionReference<
        "query",
        "internal",
        { zoneId: string },
        {
          _creationTime: number;
          _id: string;
          athleteId: string;
          boundaries: Array<number>;
          effectiveFrom: string;
          kind: "hr" | "pace";
          maxHr?: number;
          restingHr?: number;
          source?: string;
          sport: "run";
          threshold?: number;
        } | null
      >;
      getZoneByAthleteEffectiveFrom: FunctionReference<
        "query",
        "internal",
        { athleteId: string; effectiveFrom: string; kind: "hr" | "pace" },
        {
          _creationTime: number;
          _id: string;
          athleteId: string;
          boundaries: Array<number>;
          effectiveFrom: string;
          kind: "hr" | "pace";
          maxHr?: number;
          restingHr?: number;
          source?: string;
          sport: "run";
          threshold?: number;
        } | null
      >;
      getZoneByAthleteKind: FunctionReference<
        "query",
        "internal",
        { athleteId: string; kind: "hr" | "pace" },
        {
          _creationTime: number;
          _id: string;
          athleteId: string;
          boundaries: Array<number>;
          effectiveFrom: string;
          kind: "hr" | "pace";
          maxHr?: number;
          restingHr?: number;
          source?: string;
          sport: "run";
          threshold?: number;
        } | null
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
        null
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
          type?:
            | "base"
            | "build"
            | "peak"
            | "taper"
            | "recovery"
            | "maintenance"
            | "transition";
        },
        null
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
        null
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
        null
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
          date?: string;
          discipline?: "road" | "trail" | "track" | "cross_country" | "ultra";
          distanceMeters?: number;
          elevationGainMeters?: number;
          elevationLossMeters?: number;
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
          location?: {
            city?: string;
            country?: string;
            lat?: number;
            lng?: number;
            venue?: string;
          };
          name?: string;
          notes?: string;
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
          sport?: "run";
          status?: "upcoming" | "completed" | "cancelled" | "dnf" | "dns";
          surface?:
            | "road"
            | "mixed"
            | "trail"
            | "technical_trail"
            | "track"
            | "other";
        },
        null
      >;
      updateWorkout: FunctionReference<
        "mutation",
        "internal",
        {
          actual?: {
            avgHr?: number;
            avgPaceMps?: number;
            date: string;
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
            date: string;
            distanceMeters?: number;
            durationSeconds?: number;
            elevationGainMeters?: number;
            load?: number;
            maxHr?: number;
            notes?: string;
            rpe?: number;
            structure?: any;
          };
          sport?: "run";
          status?: "planned" | "completed" | "missed" | "skipped";
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
          workoutId: string;
        },
        null
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
            structure: any;
          };
          description?: string;
          name?: string;
          sport?: "run";
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
        },
        null
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
        null
      >;
      upsertWorkoutProviderRef: FunctionReference<
        "mutation",
        "internal",
        {
          externalScheduleId?: string;
          externalWorkoutId: string;
          provider: "garmin";
          syncedAt: number;
          workoutId: string;
        },
        string
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
        getAccessToken: FunctionReference<
          "action",
          "internal",
          { clientId: string; clientSecret: string; userId: string },
          { accessToken: string; expiresAt?: number; providerUserId?: string }
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
        getAccessToken: FunctionReference<
          "action",
          "internal",
          { clientId: string; clientSecret: string; userId: string },
          { accessToken: string; expiresAt?: number; providerUserId?: string }
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
            autoIngestByEvent?: Record<string, boolean>;
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
