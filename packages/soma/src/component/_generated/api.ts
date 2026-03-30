/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as garmin from "../garmin.js";
import type * as private_ from "../private.js";
import type * as public_ from "../public.js";
import type * as strava from "../strava.js";
import type * as validators_activity from "../validators/activity.js";
import type * as validators_athlete from "../validators/athlete.js";
import type * as validators_body from "../validators/body.js";
import type * as validators_connection from "../validators/connection.js";
import type * as validators_daily from "../validators/daily.js";
import type * as validators_enums from "../validators/enums.js";
import type * as validators_index from "../validators/index.js";
import type * as validators_menstruation from "../validators/menstruation.js";
import type * as validators_nutrition from "../validators/nutrition.js";
import type * as validators_plannedWorkout from "../validators/plannedWorkout.js";
import type * as validators_samples from "../validators/samples.js";
import type * as validators_shared from "../validators/shared.js";
import type * as validators_sleep from "../validators/sleep.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  garmin: typeof garmin;
  private: typeof private_;
  public: typeof public_;
  strava: typeof strava;
  "validators/activity": typeof validators_activity;
  "validators/athlete": typeof validators_athlete;
  "validators/body": typeof validators_body;
  "validators/connection": typeof validators_connection;
  "validators/daily": typeof validators_daily;
  "validators/enums": typeof validators_enums;
  "validators/index": typeof validators_index;
  "validators/menstruation": typeof validators_menstruation;
  "validators/nutrition": typeof validators_nutrition;
  "validators/plannedWorkout": typeof validators_plannedWorkout;
  "validators/samples": typeof validators_samples;
  "validators/shared": typeof validators_shared;
  "validators/sleep": typeof validators_sleep;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};
