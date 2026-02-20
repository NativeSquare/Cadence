---
status: draft
createdDate: 2026-02-20
epic: 10
title: Frontend Screens Implementation
designReference:
  - _bmad-output/brainstorming/cadence-full-v9.jsx
  - _bmad-output/brainstorming/cadence-full-v10.jsx
---

# Epic 10: Frontend Screens Implementation

User can navigate through the complete app experience with polished, consistent UI screens that follow the established design language.

**Design Reference:** All screen designs are already coded as working React prototypes:
- [`_bmad-output/brainstorming/cadence-full-v9.jsx`](./../brainstorming/cadence-full-v9.jsx) - Main tabs (Today, Coach, Analytics, Profile)
- [`_bmad-output/brainstorming/cadence-full-v10.jsx`](./../brainstorming/cadence-full-v10.jsx) - Session flow (Session Detail, Active Session, Debrief, Celebration)

These prototypes contain the complete visual language, color palette, typography, spacing, animations, and component structure. **The native implementation MUST be an exact transcription of the web-based UI.**

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

## Story 10.6: Session Detail Screen (Pre-Workout)

As a runner,
I want to see complete details about a planned session before starting it,
So that I understand the workout structure, coach guidance, and can mentally prepare.

**Design Reference:**
- `SessionDetailScreen` component in prototype (`cadence-full-v10.jsx` lines 251-399)
- `IntensityProfile` component (`cadence-full-v10.jsx` lines 163-246)
- Theme constants `T` object (`cadence-full-v10.jsx` lines 3-14)
- Animations: `detailSlideUp`, `splitReveal`, `springUp` (`cadence-full-v10.jsx` lines 27, 33, 45)

**Typography Requirements (CRITICAL - must match exactly):**
- Session type title: fontSize 34, fontWeight 800, letterSpacing -0.04em, lineHeight 1.1, color `g1`
- Section headers: fontSize 11, fontWeight 600, color `wMute`, letterSpacing 0.05em, textTransform uppercase
- Segment names: fontSize 15, fontWeight 600, color `wText`
- Segment details: fontSize 12, color `wMute`
- Coach insight text: fontSize 15, fontWeight 500, color `black`, lineHeight 1.55
- Focus point text: fontSize 14, color `wText`, lineHeight 1.4
- Font family: Outfit (fontWeight 300-800)

**Acceptance Criteria:**

**Given** the user taps a session from the Plan screen or Calendar
**When** the Session Detail screen slides up (animation: `detailSlideUp .45s cubic-bezier(.32,.72,.37,1.0)`)
**Then** they see the dark hero header with:
- Back button (chevron left icon, color `g3`)
- Zone badge (pill with zone text, e.g., "Z4", colored background matching intensity)
- "Today" indicator with animated pulse dot (if applicable)
- "Completed" indicator with checkmark (if applicable)
- Session type as large title (34px, fontWeight 800, letterSpacing -0.04em)
- Date, duration, and distance subtitle (14px, color `g3`)

**Given** the hero header is displayed
**When** the user scrolls down past threshold (80% of scroll position 10-90)
**Then** a collapsed header bar appears with:
- Back button
- Session type (16px, fontWeight 700)
- Zone badge (smaller variant)
- Background: `rgba(0,0,0,.95)` with `backdropFilter: blur(24px)`

**Given** the session has a coach note
**When** the content area loads
**Then** they see the "Coach Insight" card:
- Background: `lime` (#C8FF00)
- Dot indicator + "Coach Insight" label (11px, fontWeight 600, color `rgba(0,0,0,.4)`)
- Coach message text (15px, fontWeight 500, color `black`, lineHeight 1.55)
- Border radius: 18px, padding: 18px 20px

**Given** the session has multiple segments (not rest day)
**When** the IntensityProfile chart renders
**Then** they see an SVG-based visualization with:
- Title: "Intensity Profile" (11px uppercase)
- Legend showing Z4-5, Z3, Z2, Rest with color indicators
- Horizontal zone grid lines at 25%, 50%, 75%, 100%
- Animated bars for each segment (transition: 0.6s ease, staggered by segment index * 0.08s)
- Colored zone indicators on top edge of bars
- Segment km labels below bars
- Zone colors: Z4-5 = `barHigh` (#A8D900), Z3 = #9ACD32, Z2 = `barEasy` (#7CB342), Z1/Rest = `barRest` (#5B9EFF)
- **MUST use Victory Native** for implementation (following pattern in `AnalyticsScreen.tsx`)

**Given** the session has segments
**When** the Workout Structure section renders
**Then** they see:
- Section header: "Workout Structure" (11px uppercase)
- List of segment rows with:
  - Colored bar indicator (4px width, 36px height, rounded)
  - Segment name (15px, fontWeight 600)
  - Zone and pace (12px, color `wMute`)
  - Distance in km (17px, fontWeight 700)
  - Staggered reveal animation (`splitReveal .35s ease` with delay per index * 0.06s)
- Container: rounded 20px, background `w1`, border `1px solid wBrd`

**Given** the session is not a rest day
**When** the Overview section renders
**Then** they see a 3-column grid with:
- Distance card: value + "km" unit, background `lime`, text `black`
- Duration card: value only, background `w1`, border `wBrd`
- Intensity card: "High"/"Low"/"Key", background `w1`, border `wBrd`
- Card padding: 14px 12px, borderRadius 16px
- Value: 20px, fontWeight 800; Label: 10px uppercase

**Given** the session renders
**When** the Focus Points section loads
**Then** they see:
- Section header: "Focus Points"
- 3 focus items with emoji + text
- Rest days: yoga, easy walk, sleep/hydration tips
- Workout days: pace guidance, hydration, route/fueling tips
- Container: rounded 16px, background `w1`, border `wBrd`

**Given** the session is not completed and not a rest day
**When** the screen renders
**Then** a sticky CTA button appears at the bottom:
- Background gradient: `linear-gradient(transparent, w2 20%)`
- Button: full width, 18px padding, rounded 18px, background `wText`
- Play icon in lime circle (32px diameter)
- Text: "Start Session" (17px, fontWeight 700, color `w1`)
- Box shadow: `0 8px 32px rgba(0,0,0,.2)`
- Press feedback: `transform: scale(.97)` on press

**Component Breakdown:**
- `SessionDetailScreen.tsx` - Main container with scroll handling and collapsed header
- `SessionDetailHeader.tsx` - Hero header with zone badge, title, subtitle
- `CollapsedHeader.tsx` - Collapsed header bar (shared with other screens)
- `CoachInsightCard.tsx` - Lime background coach note card
- `IntensityProfileChart.tsx` - SVG/Victory Native intensity visualization
- `WorkoutStructure.tsx` - Segment list with colored indicators
- `OverviewGrid.tsx` - 3-column stats grid
- `FocusPoints.tsx` - Focus tips list with emojis
- `WeekContextBar.tsx` - Week/phase progress indicator
- `StartSessionCTA.tsx` - Sticky bottom CTA button

**Data Requirements:**
- Session object: `{ type, km, dur, done, intensity, desc, zone, today, coachNote, segments[] }`
- Segments: `{ name, km, pace, zone }`
- Week context: week number, phase name, planned km, completion dots

---

## Story 10.7: Active Session Screen (Live Workout)

As a runner,
I want to track my workout in real-time with a clear timer, metrics, and segment guidance,
So that I can follow the workout plan and record my activity.

**Design Reference:**
- `ActiveSessionScreen` component in prototype (`cadence-full-v10.jsx` lines 404-593)
- Theme constants `T` object (`cadence-full-v10.jsx` lines 3-14)
- Animations: `sessionFadeIn`, `timerPulse`, `segmentSlide`, `hrPulse` (`cadence-full-v10.jsx` lines 29-34)

**Typography Requirements (CRITICAL - must match exactly):**
- Hours: fontSize 56, fontWeight 300, color `g4`, letterSpacing -0.04em, fontVariantNumeric: tabular-nums
- Minutes (hero): fontSize 88, fontWeight 800, color `lime`, letterSpacing -0.05em, fontVariantNumeric: tabular-nums
- Seconds: fontSize 52, fontWeight 700, color `g2`, letterSpacing -0.04em, fontVariantNumeric: tabular-nums
- Time unit labels: fontSize 14-16, fontWeight 500, color matching time digit
- Metric values: fontSize 28, fontWeight 800, color `g1`, fontVariantNumeric: tabular-nums
- Metric labels: fontSize 11, fontWeight 500, color `g4`, textTransform uppercase, letterSpacing 0.04em
- Button text: fontSize 15-16, fontWeight 600-800
- Font family: Outfit

**Acceptance Criteria:**

**Given** the user taps "Start Session" from Session Detail screen
**When** the Active Session screen appears (animation: `sessionFadeIn .5s ease`)
**Then** they see the full-screen dark interface with:
- Top status bar with recording/paused indicator
- Session type label
- Big timer display in center
- Metrics bar at bottom
- Control buttons

**Given** the session is recording
**When** the top bar displays
**Then** they see:
- Animated pulse dot (8px, color `lime`, animation: `timerPulse 2s ease infinite`)
- "Recording" text (13px, fontWeight 600, color `g3`)
- Session type on right (13px, fontWeight 500, color `g4`)

**Given** the session is paused
**When** the top bar displays
**Then** they see:
- Static dot (color `ora` / #FF9500)
- "Paused" text (13px, fontWeight 600, color `ora`)

**Given** the session has multiple segments
**When** the current segment indicator displays (animation: `segmentSlide .3s ease`)
**Then** they see:
- Card: rounded 14px, background `rgba(255,255,255,.04)`, border `1px solid brd`
- "Current" label + segment name in `lime` (14px, fontWeight 700)
- Target pace (12px, fontWeight 600, color `g3`)
- Segment progress bar (3px height, `lime` fill, animated width)
- "Up next" preview with next segment name and distance

**Given** the session timer is running
**When** the big timer displays in center
**Then** they see vertically stacked time:
- Hours: large light text (56px, fontWeight 300, color `g4`) with "h" unit
- Minutes: hero size accent (88px, fontWeight 800, color `lime`) with "m" unit
- Seconds: medium size (52px, fontWeight 700, color `g2`) with "s" unit
- All numbers use tabular-nums for stable width
- Time updates every second

**Given** the metrics bar is visible
**When** it renders
**Then** they see:
- Overall progress bar at top (3px, background `rgba(255,255,255,.06)`, fill `lime`)
- 3-column layout:
  - Left: Distance (value + "km")
  - Center: Pace (value + "/km", shows "--" until 0.05km covered)
  - Right: Heart Rate (animated heart icon + value + "bpm")
- Values: 28px fontWeight 800, labels: 11px uppercase

**Given** the controls are visible
**When** the session is running (not paused)
**Then** they see two buttons:
- Left: "Lap" button (flex 1, 64px height, outline style with `lime` border)
  - Plus icon + "Lap" text (15px, fontWeight 600, color `lime`)
- Right: "Pause" button (flex 1, 64px height, solid `lime` background)
  - Pause icon (two rectangles) + "Pause" text (16px, fontWeight 800, color `black`)

**Given** the controls are visible
**When** the session is paused
**Then** the buttons change to:
- Left: "End" button (outline with `red` border)
  - Stop icon (filled square) + "End" text (15px, fontWeight 700, color `red`)
- Right: "Resume" button (solid `lime` background)
  - Play icon + "Resume" text (16px, fontWeight 800, color `black`)

**Given** the user taps "End" while paused
**When** the stop confirmation overlay appears (animation: `sessionFadeIn .2s ease`)
**Then** they see:
- Full-screen overlay: background `rgba(0,0,0,.85)`, backdropFilter `blur(12px)`
- Title: "End Session?" (22px, fontWeight 700, color `g1`)
- Summary: distance and time covered (14px, color `g3`, lineHeight 1.5)
- "End & Save" button (full width, background `red`, text `w1`)
- "Resume" button (full width, outline style)

**Given** the user confirms "End & Save"
**When** they tap the button
**Then** the session ends and transitions to Debrief screen with elapsed time and distance data

**Component Breakdown:**
- `ActiveSessionScreen.tsx` - Main container with timer logic and state management
- `SessionStatusBar.tsx` - Recording/Paused indicator with session type
- `CurrentSegmentCard.tsx` - Active segment with progress and next preview
- `BigTimer.tsx` - Hero timer display with h/m/s
- `SessionMetricsBar.tsx` - Progress bar + Distance/Pace/HR
- `SessionControls.tsx` - Lap/Pause/Resume/End buttons
- `StopConfirmationOverlay.tsx` - End session modal

**Data Requirements:**
- Session object from previous screen
- Timer state (elapsed seconds)
- Simulated/real metrics (distance, pace, heart rate)
- Current segment index (for multi-segment workouts)
- Paused state

**Technical Notes:**
- Timer should use `useEffect` with `setInterval` (1000ms)
- Distance can be simulated (increment ~0.0028-0.0036 km/s for running pace)
- Heart rate can be randomized within realistic range (138-154 bpm)
- Pace calculation: `elapsed / 60 / distance` when distance > 0.05km

---

## Story 10.8: Session Debrief Screen (Post-Workout)

As a runner,
I want to log how my workout felt and receive coach feedback,
So that the AI coach understands my training response and can adjust future sessions.

**Design Reference:**
- `DebriefScreen` component in prototype (`cadence-full-v10.jsx` lines 647-848)
- `FEELING_OPTIONS` and `DEBRIEF_PILLS` constants (`cadence-full-v10.jsx` lines 638-645)
- `useStream` hook for coach text streaming (`cadence-full-v10.jsx` lines 59-64)
- Animations: `debriefIn`, `springUp`, `checkPop`, `scaleIn`, `waveform` (`cadence-full-v10.jsx` lines 24, 36-38, 45)

**Typography Requirements (CRITICAL - must match exactly):**
- Session type title: fontSize 30, fontWeight 800, letterSpacing -0.04em, lineHeight 1.1, color `g1`
- "How did that feel?" question: fontSize 20, fontWeight 700, color `wText`
- Feeling option label: fontSize 15, fontWeight 600, color `wText` (selected) or `wSub` (unselected)
- Feeling option description: fontSize 12, color `wMute`
- "Anything else to note?" label: fontSize 16, fontWeight 600, color `wText`
- Pill buttons: fontSize 13, color `wText` (selected) or `wSub` (unselected)
- Coach response: fontSize 17, fontWeight 400, color `g1`, lineHeight 1.6, letterSpacing -0.01em
- Stat values: fontSize 18, fontWeight 700
- Stat labels: fontSize 10, fontWeight 500, textTransform uppercase, letterSpacing 0.04em
- Font family: Outfit

**Feeling Options (exact values):**
```
{ emoji: "🔥", label: "Amazing", value: "amazing", desc: "Felt strong the whole way" }
{ emoji: "👍", label: "Good", value: "good", desc: "Solid effort, nothing special" }
{ emoji: "😐", label: "Okay", value: "okay", desc: "Got it done, that's what counts" }
{ emoji: "😮‍💨", label: "Tough", value: "tough", desc: "Harder than expected" }
{ emoji: "🥵", label: "Brutal", value: "brutal", desc: "Really struggled today" }
```

**Quick Tag Pills (exact values):**
```
"Legs felt heavy", "Breathing was easy", "Side stitch", "Felt fast",
"Needed more rest", "Perfect weather", "Too hot", "Had to walk"
```

**Acceptance Criteria:**

**Given** the user ends a session from Active Session screen
**When** the Debrief screen appears (animation: `debriefIn .5s ease`)
**Then** they see the dark hero header with:
- Completion badge (28px lime circle with checkmark)
- "Session Complete" text (15px, fontWeight 600, color `lime`)
- Session type title (30px, fontWeight 800)
- Subtitle with date, zone, and target km

**Given** the hero header is displayed
**When** the stats row animates in (`springUp .4s ease` with staggered delay)
**Then** they see 3 stat cards:
- Time: formatted as M:SS
- Distance: actual km covered with 2 decimals
- Avg Pace: calculated M:SS/km (or "--" if insufficient distance)
- Card style: padding 12px 10px, rounded 14px, background `rgba(255,255,255,.04)`, border `1px solid brd`

**Given** the debrief flow begins (phase 1, delay 500ms)
**When** the feeling question appears (`springUp .5s ease`)
**Then** they see:
- Question: "How did that feel?" (20px, fontWeight 700)
- 5 vertically stacked option buttons with:
  - Emoji (22px)
  - Label + description
  - Selection state: border `lime`, background `rgba(200,255,0,.06)`, checkmark circle
  - Staggered animation: 0.04s delay per item

**Given** the user selects a feeling
**When** the selection is made (phase 2, delay 400ms)
**Then** the "Anything else to note?" section appears with:
- Quick tag pills in a flex-wrap layout
- Dashed border (unselected) vs solid border (selected)
- Selected: border `lime`, background `rgba(200,255,0,.06)`

**Given** the note section is visible
**When** the voice recorder button is tapped
**Then** the recording mode UI appears:
- "Listening..." text
- Animated waveform bars (24 bars, random heights, animation: `waveform 0.4-0.8s ease infinite alternate`)
- Timer display (M:SS format)
- Cancel and Done buttons

**Given** the note section is visible
**When** the text input is focused
**Then** they see:
- Textarea with placeholder "Or type something..."
- Mic button (bottom left)
- Character count (bottom right)
- Send arrow button (appears when text entered, animation: `scaleIn .2s ease`)

**Given** the user taps "Save & Wrap Up" or "Skip — just save"
**When** the coach response phase begins
**Then** they see:
- Large coach response card (background `wText`, rounded 22px)
- Coach avatar (28px lime circle with "C")
- Streaming text with blinking cursor (speed: 22ms per character, delay: 300ms)
- Response varies by feeling:
  - Amazing/Good: positive reinforcement
  - Tough/Brutal: empathetic, promises adjustment
  - Okay: acknowledgment of consistency

**Given** the coach response finishes streaming
**When** the coachReply state becomes true (delay 300ms after stream done)
**Then** they see:
- "Logged" summary card showing feeling + selected pills + note indicator
- "Done" button (full width, background `wText`, 18px fontWeight 700)

**Given** the user taps "Done"
**When** the celebration triggers
**Then** the Celebration Overlay appears (Story 10.9)
**And** after celebration completes, user returns to Plan screen

**Component Breakdown:**
- `DebriefScreen.tsx` - Main container with phase state management
- `DebriefHeader.tsx` - Completion badge, title, stats row
- `FeelingSelector.tsx` - 5-option feeling picker with animations
- `QuickTagPills.tsx` - Flex-wrap pill buttons
- `VoiceRecorderMode.tsx` - Recording UI with waveform
- `DebriefNoteInput.tsx` - Textarea with mic and send buttons
- `CoachResponseCard.tsx` - Streaming coach message with avatar
- `DebriefSummary.tsx` - Logged items summary
- `useStreamingText.ts` - Hook for character-by-character text streaming

**Data Requirements:**
- Session data from Active Session screen
- Elapsed time and distance covered
- Selected feeling value
- Selected quick tag pills array
- Note text (optional)
- Coach response (generated based on feeling)

---

## Story 10.9: Celebration Overlay

As a runner,
I want to see a satisfying celebration animation when I complete a workout,
So that I feel accomplished and motivated to continue training.

**Design Reference:**
- `CelebrationOverlay` component in prototype (`cadence-full-v10.jsx` lines 599-633)
- Animations: `celebCheck`, `celebRing`, `celebRing2`, `celebText`, `celebFadeOut` (`cadence-full-v10.jsx` lines 40-44)

**Typography Requirements:**
- Session type: fontSize 22, fontWeight 800, color `g1`, letterSpacing -0.03em
- "Logged ✓": fontSize 14, fontWeight 500, color `lime`, letterSpacing 0.04em
- Font family: Outfit

**Acceptance Criteria:**

**Given** the user taps "Done" on the Debrief screen
**When** the Celebration Overlay appears
**Then** they see a full-screen dark overlay with centered animation:
- Phase 0 (0-600ms): Check circle animates in
- Phase 1 (600-2200ms): Text appears
- Phase 2 (2200-2800ms): Fade out
- Auto-dismiss after 2800ms total

**Given** the celebration animation plays
**When** the check circle appears (animation: `celebCheck .7s cubic-bezier(.34,1.56,.64,1)`)
**Then** they see:
- Large lime circle (88px diameter)
- White checkmark icon inside
- Box shadow glow: `0 0 60px lime44, 0 0 120px lime22`

**Given** the celebration animation plays
**When** the outer ring bursts (animation: `celebRing 1s cubic-bezier(.34,1.56,.64,1)`)
**Then** they see:
- SVG circle (140px, stroke `lime`, strokeWidth 2)
- Expands from scale 0.3 to 1, stroke-dashoffset animates
- Secondary ring (animation: `celebRing2 1.2s ease .2s`) expands and fades

**Given** the celebration text appears
**When** it animates in (animation: `celebText 1s ease`)
**Then** they see:
- Session type name (22px, fontWeight 800)
- "Logged ✓" (14px, fontWeight 500, color `lime`)

**Given** the celebration completes
**When** it fades out (animation: `celebFadeOut .6s ease`)
**Then** the overlay dismisses
**And** the user is returned to the Plan screen
**And** the completed session is marked as done

**Component Breakdown:**
- `CelebrationOverlay.tsx` - Full-screen overlay with phase-based animation
- Uses React Native Reanimated for smooth animations
- SVG components for ring burst effect

**Technical Notes:**
- Implement using `useEffect` with `setTimeout` for phase transitions
- Consider using `react-native-reanimated` for performant animations
- SVG ring animation may require `react-native-svg` with animated props

---

## Implementation Sequence

| Order | Story | Rationale |
|-------|-------|-----------|
| 1 | 10.1 System Design Cleanup | Foundation - must be done first to establish consistent styling |
| 2 | 10.2 Plan Screen | Primary entry point, validates design system |
| 3 | 10.5 Settings Screen | Simpler UI, validates design system |
| 4 | 10.4 Analytics Screen | Chart components (Victory Native), validates animation patterns |
| 5 | 10.3 Coach Screen | Chat UI, streaming text patterns |
| 6 | 10.6 Session Detail Screen | Entry point to session flow, depends on Plan screen |
| 7 | 10.7 Active Session Screen | Live workout tracking, depends on Session Detail |
| 8 | 10.8 Session Debrief Screen | Post-workout flow, depends on Active Session |
| 9 | 10.9 Celebration Overlay | Final animation, depends on Debrief |

---

## Session Flow Navigation

```
Plan Screen (tap session)
    → Session Detail Screen (tap "Start Session")
        → Active Session Screen (tap "End & Save")
            → Debrief Screen (tap "Done")
                → Celebration Overlay (auto-dismiss)
                    → Plan Screen (session marked complete)
```

---

## Dependencies

- **Prerequisite:** Navigation infrastructure (tab bar, screen routing, modal stack)
- **Prerequisite:** Authentication flow (user must be logged in)
- **Data Layer:** Stories assume mock data initially; backend wiring is separate epic
- **Design System:** Story 10.1 must be complete before other stories begin
- **Charts:** Victory Native must be configured (reference `AnalyticsScreen.tsx` implementation)
- **Animations:** React Native Reanimated for smooth transitions

---

## Out of Scope

- GPS tracking implementation (Active Session screen will use simulated distance)
- Real AI streaming (Coach screen and Debrief will use mock responses)
- Backend data fetching (all screens use mock data)
- Push notifications
- Deep linking
- Apple Health / Garmin integration (read-only display of connection status)

---

## Technical Notes

### Victory Native Charts
All charts (IntensityProfile, Histogram, LineChart) MUST use Victory Native following the pattern established in `apps/native/src/components/app/analytics/AnalyticsScreen.tsx`. This ensures:
- Consistent animation behavior
- Optimal performance on native
- Reusable chart components

### Typography Consistency
The prototype uses the Outfit font family with specific weights and letter-spacing. Ensure:
- Font weights 300-800 are loaded
- Letter-spacing values are converted to React Native format
- `fontVariantNumeric: 'tabular-nums'` for timer displays

### Animation Patterns
Key animations from prototype that need Reanimated implementation:
- `springUp`: translateY + scale with spring physics
- `detailSlideUp`: screen slide from bottom
- `sessionFadeIn`: opacity fade
- `celebCheck`: scale + rotate with overshoot
- `waveform`: scaleY oscillation for voice recorder
