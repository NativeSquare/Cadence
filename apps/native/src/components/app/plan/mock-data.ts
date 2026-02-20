/**
 * Mock data for Plan Screen
 * Reference: cadence-full-v9.jsx PLAN array (lines 76-84) and COACH_MSG (line 85)
 *
 * This mock data will be replaced by Convex queries in production.
 */

import type { PlanData, SessionData } from "./types";

/**
 * Mock 7-day training plan matching prototype PLAN array
 * Reference: cadence-full-v9.jsx lines 76-84
 */
export const MOCK_SESSIONS: SessionData[] = [
  {
    type: "Tempo",
    km: "8.5",
    dur: "48min",
    done: true,
    intensity: "high",
    desc: "4x2km @ 4:55 with 90s recovery",
    zone: "Z4",
  },
  {
    type: "Easy Run",
    km: "6.0",
    dur: "36min",
    done: true,
    intensity: "low",
    desc: "Recovery pace, conversational",
    zone: "Z2",
  },
  {
    type: "Intervals",
    km: "10.2",
    dur: "55min",
    done: true,
    intensity: "high",
    desc: "8x800m @ 4:30 with 400m jog",
    zone: "Z4-5",
  },
  {
    type: "Easy Run",
    km: "7.0",
    dur: "42min",
    done: false,
    intensity: "low",
    desc: "Conversation pace, flat route",
    zone: "Z2",
    today: true,
  },
  {
    type: "Rest",
    km: "-",
    dur: "-",
    done: false,
    intensity: "rest",
    desc: "Active recovery. Walk or stretch.",
    zone: "-",
  },
  {
    type: "Progressive",
    km: "9.0",
    dur: "50min",
    done: false,
    intensity: "high",
    desc: "Build to tempo over final 4km",
    zone: "Z3-4",
  },
  {
    type: "Long Run",
    km: "16.5",
    dur: "1h35",
    done: false,
    intensity: "key",
    desc: "Steady with last 3km at HM pace",
    zone: "Z2-3",
  },
];

/**
 * Mock coach message for today
 * Reference: cadence-full-v9.jsx line 85
 */
export const MOCK_COACH_MESSAGE =
  "Easy day. Yesterday's intervals were demanding - your legs need low-stress miles to absorb that work. Keep it honest.";

/**
 * Complete mock plan data
 */
export const MOCK_PLAN_DATA: PlanData = {
  userName: "Alex",
  weekNumber: 4,
  phase: "Build",
  sessions: MOCK_SESSIONS,
  volumeCompleted: 24.7,
  volumePlanned: 57.2,
  streak: 12,
  coachMessage: MOCK_COACH_MESSAGE,
};
