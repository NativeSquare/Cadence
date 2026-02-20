---
status: draft
createdDate: 2026-02-20
epic: 10
title: Frontend Screens Implementation
designReference: _bmad-output/brainstorming/cadence-full-v9.jsx
---

# Epic 10: Frontend Screens Implementation

User can navigate through the complete app experience with polished, consistent UI screens that follow the established design language.

**Design Reference:** All screen designs are already coded as a working React prototype in [`_bmad-output/brainstorming/cadence-full-v9.jsx`](./../brainstorming/cadence-full-v9.jsx). This prototype contains the complete visual language, color palette, typography, spacing, animations, and component structure.

---

## Story 10.1: System Design Cleanup - NativeWind Design System

As a developer,
I want all screen styles to use NativeWind classes with a centralized design token file,
So that the UI is consistent, maintainable, and follows Tailwind best practices.

**Context:**
The current app may have inline styles or scattered styling approaches. This story establishes a proper design system foundation before building new screens.

**Design Reference:**
- Color palette, typography, and spacing are defined in the prototype's `T` object (`cadence-full-v9.jsx` lines 3-14)
- Animation keyframes are defined in the `CSS` constant (lines 16-28)

**Acceptance Criteria:**

**Given** the current codebase
**When** this story is complete
**Then** a centralized design tokens file exists at `src/lib/design-tokens.ts` (or similar path per project conventions)

**Given** the design tokens file exists
**When** I inspect it
**Then** it exports all color tokens matching the prototype:
- `black`, `lime` (accent), grayscale (`g1`-`g5`), borders, cards
- Light theme colors (`w1`, `w2`, `w3`, `wText`, `wSub`, `wMute`, `wBrd`)
- Activity colors (`barHigh`, `barEasy`, `barRest`)
- Semantic colors (`red`, `ora` for warnings/errors)

**Given** the design tokens file exists
**When** I inspect it
**Then** typography tokens are defined (font family: Outfit, weights: 300-800)

**Given** the design tokens file exists
**When** I inspect `tailwind.config.js`
**Then** the theme extends with all custom colors, fonts, and spacing from the tokens file

**Given** the NativeWind configuration is complete
**When** I use classes like `bg-lime`, `text-g1`, `font-outfit`
**Then** they render correctly matching the prototype's visual style

**Given** existing screens have inline styles
**When** this story is complete
**Then** existing screens are refactored to use NativeWind classes where applicable

**Implementation Notes:**
- Follow NativeWind v4 patterns if applicable
- Consider creating reusable component variants (e.g., `Card`, `Button` base styles)
- Document any CSS-in-JS animations that cannot be converted to Tailwind

---

## Story 10.2: Plan Screen (Home/Today Tab)

As a runner,
I want to see my daily training plan on the home screen,
So that I know exactly what workout to do today and can track my weekly progress.

**Design Reference:**
- `TodayTab` component in prototype (`cadence-full-v9.jsx` lines 119-244)
- Includes: date header, week indicator, calendar strip, today's session card with coach quote, upcoming sessions list, volume/streak widgets

**Acceptance Criteria:**

**Given** the user is authenticated and on the main app
**When** they land on the Plan screen (default tab)
**Then** they see the date header with greeting ("Morning, [Name]") and week indicator
**And** they see the 7-day calendar strip with activity dots for each day
**And** they see today's session card with coach message, session details, and "Start Session" CTA
**And** they see the "Coming Up" section with upcoming sessions
**And** they see weekly volume progress and streak count widgets

**Given** the user scrolls down
**When** they pass the header threshold
**Then** a collapsed header bar appears with condensed date/week info (scroll behavior from prototype)

**Given** the user taps a day in the calendar strip
**When** that day is selected
**Then** the view updates to show that day's session details

**Given** the "Edit Plan" FAB is visible
**When** the user taps it
**Then** they are navigated to the plan editing flow (can be stubbed for now)

**Component Breakdown:**
- `PlanScreen.tsx` - Main screen container with scroll handling
- `CalendarStrip.tsx` - 7-day horizontal calendar
- `TodayCard.tsx` - Coach message + session details + CTA
- `SessionPreview.tsx` - Small card for upcoming sessions
- `WeekStatsRow.tsx` - Volume progress + streak widgets
- `EditPlanFAB.tsx` - Floating action button

**Data Requirements:**
- Current week's training plan (7 days)
- User's name for greeting
- Current week number and phase (e.g., "Week 4 Build")
- Weekly volume (completed vs planned)
- Streak count

---

## Story 10.3: Coach Screen (Chat Tab)

As a runner,
I want to chat with my AI coach,
So that I can ask questions, get advice, and discuss my training.

**Design Reference:**
- `CoachTab` component in prototype (`cadence-full-v9.jsx` lines 248-397)
- Includes: chat header with online status, message bubbles, tool cards (e.g., Training Load), typing indicator, text input, voice recording mode

**Acceptance Criteria:**

**Given** the user navigates to the Coach tab
**When** the screen loads
**Then** they see the chat header with "Coach" title and online/typing status
**And** they see the conversation history (messages from both coach and user)
**And** they see a text input field at the bottom with mic and send buttons

**Given** there are tool-use messages in the conversation
**When** they are rendered
**Then** they appear as styled cards with title bar and data display (e.g., Training Load card with Acute/Chronic/Ratio)

**Given** the user types a message
**When** they tap the send button or press Enter
**Then** the message appears in the chat as a user bubble (right-aligned)
**And** the coach shows a typing indicator
**And** after a delay, the coach's response streams in

**Given** the user taps the microphone button
**When** voice recording starts
**Then** the UI switches to recording mode with waveform visualization
**And** live transcription appears above the input area
**And** cancel and send buttons are available

**Given** the user is in recording mode
**When** they tap send
**Then** the transcribed text is sent as a message
**And** the UI returns to normal input mode

**Component Breakdown:**
- `CoachScreen.tsx` - Main chat container with scroll behavior
- `ChatMessage.tsx` - Message bubble (coach vs user styling)
- `ToolCard.tsx` - Rendered tool-use results (e.g., TrainingLoadCard)
- `TypingIndicator.tsx` - Animated dots for coach typing
- `ChatInput.tsx` - Text input with mic and send buttons
- `VoiceRecorder.tsx` - Recording mode with waveform and transcription

**Data Requirements:**
- Conversation history (messages array)
- Coach online/typing status
- (Future) Real AI streaming integration

---

## Story 10.4: Analytics Screen (Analytics Tab)

As a runner,
I want to see my training analytics and progress,
So that I can understand my training load, trends, and overall progress.

**Design Reference:**
- `AnalyticsTab` component in prototype (`cadence-full-v9.jsx` lines 399-602)
- Includes: plan progress bar, volume/streak cards, daily KM histogram, zone split histogram, volume trend line chart, pace trend line chart, stats grid

**Acceptance Criteria:**

**Given** the user navigates to the Analytics tab
**When** the screen loads
**Then** they see the header with "Analytics" title and plan summary
**And** they see the plan progress bar (10 weeks with phase colors)
**And** all charts animate in on mount

**Given** the analytics data is loaded
**When** I view the screen
**Then** I see weekly volume card with progress bar and week-over-week comparison
**And** I see streak count card
**And** I see "This Week - Daily KM" histogram with 7 bars
**And** I see "Zone Split - Daily" stacked histogram (Z2/Z3/Z4-5)
**And** I see "Volume Over Time" line chart (10 weeks)
**And** I see "Avg Pace Trend" line chart (10 weeks)
**And** I see stats grid (Total Distance, Sessions, Longest Run, Avg HR)

**Given** charts are displayed
**When** they first appear
**Then** bars animate from 0 to their value
**And** line charts draw in with a stroke animation
**And** current week/day is highlighted with accent color

**Component Breakdown:**
- `AnalyticsScreen.tsx` - Main container with scroll
- `PlanProgress.tsx` - 10-week progress bar with phases
- `WeekVolumeCard.tsx` - Volume progress + comparison
- `StreakCard.tsx` - Streak count with dots
- `Histogram.tsx` - Reusable bar chart component
- `StackedHistogram.tsx` - Stacked bar chart for zones
- `LineChart.tsx` - Reusable line chart with animation
- `StatsGrid.tsx` - 2x2 grid of stat cards

**Data Requirements:**
- Plan structure (weeks, phases)
- Weekly volume data (historical + current)
- Daily distance and zone data for current week
- Pace trend data
- Aggregate stats (total distance, sessions, longest run, avg HR)

---

## Story 10.5: Settings Screen (Profile Tab)

As a runner,
I want to manage my profile, connections, and app settings,
So that I can customize my experience and manage my account.

**Design Reference:**
- `ProfileTab` component in prototype (`cadence-full-v9.jsx` lines 604-695)
- Includes: profile header with avatar ring, stats row, share button, connected services, settings list

**Acceptance Criteria:**

**Given** the user navigates to the Profile tab
**When** the screen loads
**Then** they see their profile header with avatar (initial or photo), name, and plan badge
**And** they see a progress ring around the avatar (plan completion)
**And** they see stats row (km, runs, streak)
**And** they see "Share on Strava" CTA

**Given** the user scrolls down
**When** they pass the header threshold
**Then** a collapsed header appears with mini avatar and name

**Given** the profile loads
**When** I view Connected Services section
**Then** I see cards for Strava, Apple Health, Garmin (or other integrations)
**And** each shows connection status (Connected/Connect button)

**Given** the profile loads
**When** I view Settings section
**Then** I see a list with: Edit Profile, Goal, Coaching Style, Units, Notifications, Subscription
**And** each row shows the current value and a chevron

**Given** the user taps a settings row
**When** they tap on it
**Then** they navigate to the corresponding settings detail screen (can be stubbed)

**Component Breakdown:**
- `ProfileScreen.tsx` - Main container with scroll behavior
- `ProfileHeader.tsx` - Avatar with ring, name, badge, stats
- `ShareButton.tsx` - Strava share CTA
- `ConnectedServiceCard.tsx` - Integration card with status
- `SettingsList.tsx` - Settings rows with values and chevrons

**Data Requirements:**
- User profile (name, avatar, subscription tier)
- Plan completion percentage for ring
- Aggregate stats (km, runs, streak)
- Connected services status
- Current settings values

---

## Story 10.6: Session Screen (Active Workout)

As a runner,
I want to see and track my active workout session,
So that I can follow the workout instructions and record my activity.

**Design Reference:**
- Not fully implemented in prototype - derive from `TodayCard` session structure and app patterns
- Should display: session type, target metrics (distance, pace, zone), intervals if applicable, timer/GPS tracking UI, pause/stop controls

**Acceptance Criteria:**

**Given** the user taps "Start Session" from the Plan screen
**When** the Session screen loads
**Then** they see the session type and description prominently displayed
**And** they see target metrics (distance, duration, zone, pace)
**And** they see a large timer display (or distance if GPS-based)
**And** they see pause and stop controls

**Given** the session is an interval workout
**When** the screen displays
**Then** they see the interval structure (e.g., "8x800m @ 4:30 with 400m jog")
**And** they see current interval progress (e.g., "Rep 3 of 8")
**And** they see visual cues for work vs recovery segments

**Given** the session is in progress
**When** the user pauses
**Then** the timer pauses and they see resume/stop options

**Given** the session is complete
**When** the user taps stop
**Then** they are navigated to the Debrief screen

**Component Breakdown:**
- `SessionScreen.tsx` - Main active session container
- `SessionHeader.tsx` - Session type and description
- `MetricsDisplay.tsx` - Timer, distance, pace, HR (if available)
- `IntervalTracker.tsx` - Interval progress for structured workouts
- `SessionControls.tsx` - Pause/Resume/Stop buttons

**Data Requirements:**
- Session details from plan
- Real-time metrics (timer, GPS if implemented)
- Interval structure if applicable

**Note:** GPS/real-time tracking may be stubbed initially. Focus on UI structure matching design language.

---

## Story 10.7: Debrief Screen (Post-Workout)

As a runner,
I want to review and rate my completed workout,
So that I can provide feedback and help the coach understand how it went.

**Design Reference:**
- Not fully implemented in prototype - derive from app patterns and coach interaction style
- Should display: session summary, RPE input, notes input, coach acknowledgment

**Acceptance Criteria:**

**Given** the user completes a session
**When** they land on the Debrief screen
**Then** they see a summary of the completed session (type, duration, distance)
**And** they see an RPE (Rate of Perceived Exertion) selector (1-10 scale or emoji-based)
**And** they see an optional notes field for feedback
**And** they see a "Done" or "Save" CTA

**Given** the user selects an RPE
**When** they select a value
**Then** the selection is visually highlighted
**And** the value is ready to be saved

**Given** the user taps Done
**When** they complete the debrief
**Then** the session is marked complete in the plan
**And** RPE and notes are saved
**And** they are returned to the Plan screen
**And** the coach may send a follow-up message acknowledging the workout

**Component Breakdown:**
- `DebriefScreen.tsx` - Main post-workout container
- `SessionSummary.tsx` - Completed session stats
- `RPESelector.tsx` - 1-10 scale or emoji picker
- `NotesInput.tsx` - Optional feedback text area
- `DebriefCTA.tsx` - Done/Save button

**Data Requirements:**
- Completed session data
- RPE value (to be saved)
- Notes (optional, to be saved)

---

## Implementation Sequence

| Order | Story | Rationale |
|-------|-------|-----------|
| 1 | 10.1 System Design Cleanup | Foundation - must be done first to establish consistent styling |
| 2 | 10.2 Plan Screen | Primary entry point, most complex UI |
| 3 | 10.5 Settings Screen | Simpler UI, validates design system |
| 4 | 10.4 Analytics Screen | Chart components, validates animation patterns |
| 5 | 10.3 Coach Screen | Chat UI, depends on message/input patterns |
| 6 | 10.6 Session Screen | Requires Plan screen complete for navigation |
| 7 | 10.7 Debrief Screen | Requires Session screen complete for flow |

---

## Dependencies

- **Prerequisite:** Navigation infrastructure (tab bar, screen routing)
- **Prerequisite:** Authentication flow (user must be logged in)
- **Data Layer:** Stories assume mock data initially; backend wiring is separate epic
- **Design System:** Story 10.1 must be complete before other stories begin

---

## Out of Scope

- GPS tracking implementation (Session screen will use stub/mock)
- Real AI streaming (Coach screen will use mock responses)
- Backend data fetching (all screens use mock data)
- Push notifications
- Deep linking
