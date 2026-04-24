import { v } from "convex/values";
import { components } from "../_generated/api";
import { internalQuery } from "../_generated/server";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WORKOUT_WINDOW_PAST_DAYS = 7;
const WORKOUT_WINDOW_FUTURE_DAYS = 14;

type RouterAthlete = {
  _id: string;
  name?: string;
  sex?: "male" | "female" | "other";
  dateOfBirth?: string;
  weightKg?: number;
  heightCm?: number;
  maxHr?: number;
  restingHr?: number;
  thresholdPaceMps?: number;
  thresholdHr?: number;
};

type RouterWorkout = {
  _id: string;
  scheduledDate: string;
  name: string;
  description?: string;
  status: "planned" | "completed" | "missed" | "skipped";
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
};

type RouterPlan = {
  plan: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: "draft" | "active" | "completed" | "archived";
    notes?: string;
  };
  currentWeekNumber: number;
  workouts: RouterWorkout[];
} | null;

export type RouterContext = {
  athlete: RouterAthlete | null;
  plan: RouterPlan;
};

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export const loadRouterContext = internalQuery({
  args: {
    userId: v.id("users"),
    occurredAt: v.number(),
  },
  handler: async (ctx, { userId, occurredAt }): Promise<RouterContext> => {
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return { athlete: null, plan: null };

    const [hrRow, paceRow] = await Promise.all([
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: athlete._id,
        kind: "hr" as const,
      }),
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: athlete._id,
        kind: "pace" as const,
      }),
    ]);

    const athleteSnapshot: RouterAthlete = {
      _id: athlete._id,
      name: athlete.name,
      sex: athlete.sex,
      dateOfBirth: athlete.dateOfBirth,
      weightKg: athlete.weightKg,
      heightCm: athlete.heightCm,
      maxHr: hrRow?.maxHr,
      restingHr: hrRow?.restingHr,
      thresholdPaceMps: paceRow?.threshold,
      thresholdHr: hrRow?.threshold,
    };

    const plans = await ctx.runQuery(
      components.agoge.public.getPlansByAthleteAndStatus,
      { athleteId: athlete._id, status: "active" as const },
    );
    const activePlan = plans[0];
    if (!activePlan) return { athlete: athleteSnapshot, plan: null };

    const windowStart = toIsoDate(
      occurredAt - WORKOUT_WINDOW_PAST_DAYS * MS_PER_DAY,
    );
    const windowEnd = toIsoDate(
      occurredAt + WORKOUT_WINDOW_FUTURE_DAYS * MS_PER_DAY,
    );

    type AgogeWorkout = {
      _id: string;
      scheduledDate: string;
      name: string;
      description?: string;
      status: "planned" | "completed" | "missed" | "skipped";
      planned?: { durationSeconds?: number; distanceMeters?: number };
    };
    const workouts = (await ctx.runQuery(
      components.agoge.public.getWorkoutsByAthlete,
      { athleteId: athlete._id, startDate: windowStart, endDate: windowEnd },
    )) as AgogeWorkout[];

    const planStartMs = Date.parse(activePlan.startDate);
    const rawWeek = Math.floor((occurredAt - planStartMs) / (7 * MS_PER_DAY)) + 1;
    const currentWeekNumber = Math.max(rawWeek, 1);

    return {
      athlete: athleteSnapshot,
      plan: {
        plan: {
          _id: activePlan._id,
          name: activePlan.name,
          startDate: activePlan.startDate,
          endDate: activePlan.endDate,
          status: activePlan.status,
          notes: activePlan.notes,
        },
        currentWeekNumber,
        workouts: workouts.map((w) => ({
          _id: w._id,
          scheduledDate: w.scheduledDate,
          name: w.name,
          description: w.description,
          status: w.status,
          plannedDurationSeconds: w.planned?.durationSeconds,
          plannedDistanceMeters: w.planned?.distanceMeters,
        })),
      },
    };
  },
});
