/**
 * Utility functions for Plan Screen components
 * Reference: cadence-full-v9.jsx bc() function (line 86)
 */

import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import type { SessionData } from "./types";

/**
 * Get the accent color for a session based on its status and intensity
 * Reference: cadence-full-v9.jsx line 86:
 * const bc=s=>{if(s.done)return T.lime;if(s.intensity==="key")return T.lime;...}
 *
 * @param session - The session data
 * @returns Hex color string for the session accent
 */
export function getSessionColor(session: SessionData): string {
  if (session.done) return COLORS.lime;
  if (session.intensity === "key") return COLORS.lime;
  if (session.intensity === "high") return ACTIVITY_COLORS.barHigh;
  if (session.intensity === "low") return ACTIVITY_COLORS.barEasy;
  if (session.intensity === "rest") return ACTIVITY_COLORS.barRest;
  return "rgba(255,255,255,0.25)"; // g4 fallback
}

/**
 * Get the greeting based on the current time of day
 * @returns "Morning", "Afternoon", or "Evening"
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/**
 * Format a date to display format (e.g., "Thursday, Feb 20")
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date = new Date()): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();

  return `${dayName}, ${monthName} ${dayNum}`;
}

/**
 * Get short date format (e.g., "Thu, Feb 20")
 * @param date - Date to format
 * @returns Short formatted date string
 */
export function formatShortDate(date: Date = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();

  return `${dayName}, ${monthName} ${dayNum}`;
}
