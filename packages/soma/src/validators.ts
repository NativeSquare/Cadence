// ─── Soma Validators ─────────────────────────────────────────────────────────
// Re-exports the Convex validators for each Soma table so host apps can use
// them for type-safe argument validation in their own mutations.
//
// Two flavors are exported for each table:
//
//   *Validator  — Full validator including connectionId (v.string()) and userId.
//                 Use when the mutation args map 1:1 to a soma.ingestX() call.
//
//   *Data       — Data-only validator (no connectionId/userId).
//                 Use when connection is resolved server-side and the client
//                 only sends the health data payload.
//
// ─── Examples ────────────────────────────────────────────────────────────────
//
// Direct ingest (client provides connectionId):
//
//   import { activityValidator } from "@nativesquare/soma/validators";
//
//   export const storeActivity = mutation({
//     args: activityValidator,
//     handler: async (ctx, args) => {
//       await soma.ingestActivity(ctx, args);
//     },
//   });
//
// Batch sync (connection resolved server-side):
//
//   import { activityData } from "@nativesquare/soma/validators";
//
//   export const syncHealthKit = mutation({
//     args: { activities: v.array(v.object(activityData)) },
//     handler: async (ctx, args) => {
//       const connectionId = await soma.connect(ctx, { userId, provider: "HEALTHKIT" });
//       for (const activity of args.activities) {
//         await soma.ingestActivity(ctx, { connectionId, userId, ...activity });
//       }
//     },
//   });

import { v } from "convex/values";
import { connectionValidator as _connectionValidator } from "./component/validators/connection.js";
import { athleteValidator as _athleteValidator } from "./component/validators/athlete.js";
import { activityValidator as _activityValidator } from "./component/validators/activity.js";
import { bodyValidator as _bodyValidator } from "./component/validators/body.js";
import { dailyValidator as _dailyValidator } from "./component/validators/daily.js";
import { sleepValidator as _sleepValidator } from "./component/validators/sleep.js";
import { menstruationValidator as _menstruationValidator } from "./component/validators/menstruation.js";
import { nutritionValidator as _nutritionValidator } from "./component/validators/nutrition.js";
import { plannedWorkoutValidator as _plannedWorkoutValidator } from "./component/validators/plannedWorkout.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const asString = { connectionId: v.string() };

type WithConnection = { connectionId: unknown; userId: unknown };

// Forces TypeScript to eagerly evaluate Omit into a flat object type
// so the emitted .d.ts has concrete property listings instead of
// Omit<{...huge type...}, K> which Convex's v.object() can't resolve.
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

function stripConnection<T extends WithConnection>(
  validator: T,
): Expand<Omit<T, "connectionId" | "userId">> {
  const { connectionId, userId, ...rest } = validator;
  return rest as unknown as Expand<Omit<T, "connectionId" | "userId">>;
}

// ─── Full validators (connectionId as v.string() + userId) ───────────────────

export const connectionValidator = _connectionValidator;
export const athleteValidator = { ..._athleteValidator, ...asString };
export const activityValidator = { ..._activityValidator, ...asString };
export const bodyValidator = { ..._bodyValidator, ...asString };
export const dailyValidator = { ..._dailyValidator, ...asString };
export const sleepValidator = { ..._sleepValidator, ...asString };
export const menstruationValidator = { ..._menstruationValidator, ...asString };
export const nutritionValidator = { ..._nutritionValidator, ...asString };
export const plannedWorkoutValidator = {
  ..._plannedWorkoutValidator,
  ...asString,
};

// ─── Data-only validators (no connectionId / userId) ─────────────────────────

export const athleteData = stripConnection(_athleteValidator);
export const activityData = stripConnection(_activityValidator);
export const bodyData = stripConnection(_bodyValidator);
export const dailyData = stripConnection(_dailyValidator);
export const sleepData = stripConnection(_sleepValidator);
export const menstruationData = stripConnection(_menstruationValidator);
export const nutritionData = stripConnection(_nutritionValidator);
export const plannedWorkoutData = stripConnection(_plannedWorkoutValidator);
