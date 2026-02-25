import { createContext, useContext } from "react";

/**
 * Tracks whether the Calendar tab is focused.
 * Animated components consume this to pause/resume when the tab is in background,
 * preventing infinite animations from running offscreen.
 */
export const CalendarFocusContext = createContext(true);
export const useCalendarFocused = () => useContext(CalendarFocusContext);
