/**
 * Mock data for Session Detail Screen
 * Reference: cadence-full-v10.jsx PLAN array (lines 95-124)
 *
 * This mock data will be replaced by Convex queries in production.
 */

import type { SessionDetailData } from "./types";

/**
 * Mock 7-day training plan with full segment data
 * Reference: cadence-full-v10.jsx lines 95-124
 */
export const MOCK_SESSION_DETAILS: SessionDetailData[] = [
  {
    type: "Tempo",
    km: "8.5",
    dur: "48min",
    done: true,
    intensity: "high",
    desc: "4x2km @ 4:55 with 90s recovery",
    zone: "Z4",
    segments: [
      { name: "Warm Up", km: "1.5", pace: "6:00", zone: "Z2" },
      { name: "Tempo Block 1", km: "2.0", pace: "4:55", zone: "Z4" },
      { name: "Recovery", km: "0.4", pace: "6:30", zone: "Z1" },
      { name: "Tempo Block 2", km: "2.0", pace: "4:55", zone: "Z4" },
      { name: "Recovery", km: "0.4", pace: "6:30", zone: "Z1" },
      { name: "Cool Down", km: "2.2", pace: "6:15", zone: "Z2" },
    ],
    coachNote:
      "Solid tempo session. Focus on even splits across both blocks. Don't chase pace on the first rep - trust the rhythm and let the second block match naturally.",
  },
  {
    type: "Easy Run",
    km: "6.0",
    dur: "36min",
    done: true,
    intensity: "low",
    desc: "Recovery pace, conversational",
    zone: "Z2",
    segments: [{ name: "Easy Run", km: "6.0", pace: "6:00", zone: "Z2" }],
    coachNote:
      "Keep it truly easy. If you can't hold a conversation, you're going too fast. This run is about blood flow and recovery.",
  },
  {
    type: "Intervals",
    km: "10.2",
    dur: "55min",
    done: true,
    intensity: "high",
    desc: "8x800m @ 4:30 with 400m jog",
    zone: "Z4-5",
    segments: [
      { name: "Warm Up", km: "1.6", pace: "6:00", zone: "Z2" },
      { name: "8x800m Intervals", km: "6.4", pace: "4:30", zone: "Z4-5" },
      { name: "400m Jog Recovery", km: "0.4", pace: "7:00", zone: "Z1" },
      { name: "Cool Down", km: "1.8", pace: "6:15", zone: "Z2" },
    ],
    coachNote:
      "These 800s are about speed endurance. Hit 4:30 pace but don't go faster. The jog recoveries should feel easy - walk if you need to.",
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
    segments: [{ name: "Easy Run", km: "7.0", pace: "6:00", zone: "Z2" }],
    coachNote:
      "Easy day. Yesterday's intervals were demanding — your legs need low-stress miles to absorb that work. Keep it honest.",
  },
  {
    type: "Rest",
    km: "-",
    dur: "-",
    done: false,
    intensity: "rest",
    desc: "Active recovery. Walk or stretch.",
    zone: "-",
    segments: [{ name: "Rest / Stretch", km: "-", pace: "-", zone: "-" }],
    coachNote:
      "Full rest. Light walking or stretching is fine, but no running. Your body builds fitness during recovery, not training.",
  },
  {
    type: "Progressive",
    km: "9.0",
    dur: "50min",
    done: false,
    intensity: "high",
    desc: "Build to tempo over final 4km",
    zone: "Z3-4",
    segments: [
      { name: "Easy Start", km: "3.0", pace: "5:45", zone: "Z2" },
      { name: "Moderate Build", km: "2.0", pace: "5:15", zone: "Z3" },
      { name: "Tempo Finish", km: "4.0", pace: "4:50", zone: "Z4" },
    ],
    coachNote:
      "The key is patience. Start genuinely easy and let the pace drop naturally. The last 4km should feel controlled, not desperate.",
  },
  {
    type: "Long Run",
    km: "16.5",
    dur: "1h35",
    done: false,
    intensity: "key",
    desc: "Steady with last 3km at HM pace",
    zone: "Z2-3",
    segments: [
      { name: "Easy Miles", km: "10.0", pace: "5:45", zone: "Z2" },
      { name: "Moderate Push", km: "3.5", pace: "5:15", zone: "Z3" },
      { name: "HM Pace Finish", km: "3.0", pace: "4:55", zone: "Z3-4" },
    ],
    coachNote:
      "This is the week's centrepiece. Bank the easy miles, then finish strong. The last 3km at HM pace teaches your body to push when tired.",
  },
];

/**
 * Get session detail data by index
 */
export function getSessionDetail(dayIdx: number): SessionDetailData | undefined {
  return MOCK_SESSION_DETAILS[dayIdx];
}

/**
 * Get all session details for week context bar
 */
export function getAllSessionDetails(): SessionDetailData[] {
  return MOCK_SESSION_DETAILS;
}
