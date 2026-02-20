# Story 10.5: Settings Screen (Profile Tab)

Status: review

## Story

As a runner,
I want to manage my profile, connections, and app settings,
so that I can customize my experience and manage my account.

## Acceptance Criteria

1. **Given** the user navigates to the Profile tab, **When** the screen loads, **Then** they see their profile header with avatar (initial or photo), name, and plan badge, **And** they see a progress ring around the avatar (plan completion), **And** they see stats row (km, runs, streak), **And** they see "Share on Strava" CTA.

2. **Given** the user scrolls down, **When** they pass the header threshold, **Then** a collapsed header appears with mini avatar and name.

3. **Given** the profile loads, **When** I view Connected Services section, **Then** I see cards for Strava, Apple Health, Garmin (or other integrations), **And** each shows connection status (Connected/Connect button).

4. **Given** the profile loads, **When** I view Settings section, **Then** I see a list with: Edit Profile, Goal, Coaching Style, Units, Notifications, Subscription, **And** each row shows the current value and a chevron.

5. **Given** the user taps a settings row, **When** they tap on it, **Then** they navigate to the corresponding settings detail screen (can be stubbed).

## Tasks / Subtasks

- [x] Task 1: Create ProfileScreen component structure (AC: #1, #2)
  - [x] 1.1: Create `ProfileScreen.tsx` in `src/app/(app)/(tabs)/profile.tsx`
  - [x] 1.2: Implement scroll tracking with `onScroll` handler for header collapse
  - [x] 1.3: Implement collapsed header with mini avatar (triggers at scroll > ~120px)

- [x] Task 2: Create ProfileHeader component (AC: #1)
  - [x] 2.1: Create `ProfileHeader.tsx` in `src/components/app/profile/`
  - [x] 2.2: Implement avatar with progress ring using SVG circle (`strokeDasharray`/`strokeDashoffset`)
  - [x] 2.3: Add name + PRO badge (use `bg-lime text-black` for badge)
  - [x] 2.4: Add subtitle showing plan phase (e.g., "Half Marathon · Week 4 Build")
  - [x] 2.5: Add stats row: km, runs, streak (use existing card patterns)
  - [x] 2.6: Add "Share on Strava" button with lime background

- [x] Task 3: Create ConnectedServiceCard component (AC: #3)
  - [x] 3.1: Create `ConnectedServiceCard.tsx` in `src/components/app/profile/`
  - [x] 3.2: Props: `name`, `description`, `icon`, `color`, `connected`, `onPress`
  - [x] 3.3: Implement connection status badge (Connected = green, Connect = gray)
  - [x] 3.4: Render cards for: Strava (#FC4C02), Apple Health (#FF2D55), Garmin (#007CC3)

- [x] Task 4: Enhance SettingsRow for value display (AC: #4)
  - [x] 4.1: Add optional `value` prop to existing `SettingsRow` component
  - [x] 4.2: Display value next to chevron when provided
  - [x] 4.3: Style value with `text-muted-foreground`

- [x] Task 5: Update tab navigation (AC: #1)
  - [x] 5.1: Update `_layout.tsx` to include 4 tabs: Today, Coach, Analytics, Profile
  - [x] 5.2: Use SF symbols: `house.fill`, `bubble.left.fill`, `chart.xyaxis.line`, `person.fill`
  - [x] 5.3: DECISION: Created new `profile.tsx`, kept `account.tsx` for potential detail screen

- [x] Task 6: Wire data sources (AC: #1, #3, #4)
  - [x] 6.1: Create mock data for profile stats (km, runs, streak, plan completion %)
  - [x] 6.2: Create mock data for connected services status
  - [x] 6.3: Create mock data for current settings values

- [x] Task 7: Add animation polish (AC: #2)
  - [x] 7.1: Animate progress ring on mount (600ms delay, then state transition)
  - [x] 7.2: Implement header opacity fade during scroll (1 - scrollProgress)
  - [x] 7.3: Add slide-in animation for collapsed header using react-native-reanimated

# CRITICAL NOTE : THE DESIGN AND A WEB VERSION PROTOTYPE OF ALL CODE THE UI IS AVAILABLE HERE : - [cadence-full-v9.jsx](../_brainstorming/cadence-full-v9.jsx) . USE THIS AS YOUR ONLY REFERENCE IN TERMS OF DESIGN. THE FINAL NATIVE DESIGN MUST PERFECTLY MATCH THE ONE OF THE PROTOTYPE. PAY SPECIAL ATTENTION TO THE ANIMATION AND FONTs AND FONT PROPERTIES USED IN THAT PROTOTYPE. THE IMPLEMENTED VERSION MUST EXACTLY MATCH

## Dev Notes

### Design Token Reference (from prototype `T` object)

```typescript
// Color tokens (already in tailwind.config.ts)
lime: "#C8FF00"           // Primary accent, buttons, badges, progress ring
g1: "rgba(255,255,255,0.92)"  // Primary text on dark
g2-g4: // Secondary/muted text gradients
wText: "#1A1A1A"          // Text on light surface
wSub: "#5C5C5C"           // Subtitle text on light
wMute: "#A3A3A0"          // Muted text on light

// Service brand colors
strava: "#FC4C02"
appleHealth: "#FF2D55"
garmin: "#007CC3"
```

### Component Architecture

```
ProfileScreen.tsx (main container)
├── CollapsedHeader (position: absolute, z-index: 90)
├── ScrollView
│   ├── ProfileHeader (dark background section)
│   │   ├── AvatarWithRing
│   │   ├── NameBadge
│   │   ├── StatsRow
│   │   └── ShareButton
│   └── LightSection (bg-w2, rounded-t-[28px])
│       ├── ConnectedServices
│       │   └── ConnectedServiceCard × 3
│       ├── SettingsList (reuse SettingsGroup)
│       └── VersionFooter
```

### Progress Ring Implementation

```tsx
// SVG circle with animated stroke-dashoffset
const radius = 46;
const circumference = 2 * Math.PI * radius;
const progress = 0.74; // 74% completion

<svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
  <circle
    cx="50"
    cy="50"
    r={radius}
    fill="none"
    stroke="rgba(255,255,255,0.06)"
    strokeWidth="3"
  />
  <circle
    cx="50"
    cy="50"
    r={radius}
    fill="none"
    stroke="#C8FF00"
    strokeWidth="3"
    strokeDasharray={circumference}
    strokeDashoffset={circumference * (1 - progress)}
    strokeLinecap="round"
    style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)" }}
  />
</svg>;
```

### Scroll-based Header Collapse

```tsx
const [scrollY, setScrollY] = useState(0);
const progress = Math.min(1, Math.max(0, (scrollY - 10) / 110));
const showCollapsed = progress > 0.85;

<ScrollView onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}>
```

### Existing Components to Reuse

| Component       | Location                                  | Usage                   |
| --------------- | ----------------------------------------- | ----------------------- |
| `Avatar`        | `@/components/ui/avatar`                  | Profile avatar          |
| `SettingsGroup` | `@/components/app/account/settings-group` | Settings section        |
| `SettingsRow`   | `@/components/app/account/settings-row`   | Individual setting rows |
| `Text`          | `@/components/ui/text`                    | Typography              |

### Settings Rows Data Structure

```typescript
const settingsItems = [
  { label: "Edit Profile", value: "", icon: "person-outline" },
  { label: "Goal", value: "Sub 1:45", icon: "flag-outline" },
  { label: "Coaching Style", value: "Balanced", icon: "fitness-outline" },
  { label: "Units", value: "Metric", icon: "speedometer-outline" },
  { label: "Notifications", value: "On", icon: "notifications-outline" },
  { label: "Subscription", value: "Pro", icon: "card-outline" },
];
```

### Connected Services Data Structure

```typescript
const services = [
  {
    name: "Strava",
    desc: "Sync activities",
    connected: true,
    color: "#FC4C02",
    icon: "S",
  },
  {
    name: "Apple Health",
    desc: "HR, sleep & recovery",
    connected: true,
    color: "#FF2D55",
    icon: "♥",
  },
  {
    name: "Garmin",
    desc: "GPS watch sync",
    connected: false,
    color: "#007CC3",
    icon: "G",
  },
];
```

### Project Structure Notes

- **File location**: `apps/native/src/app/(app)/(tabs)/profile.tsx` (new file)
- **Components folder**: `apps/native/src/components/app/profile/` (new folder)
- **Naming convention**: PascalCase for components, kebab-case for files
- **Import alias**: Use `@/` for clean imports

### Light Surface Implementation

The profile screen uses a two-tone design:

1. **Dark header** (`bg-background` / `bg-black`) - profile info
2. **Light content area** (`bg-w2` / `#F8F8F6`) - rounded corners at top, contains cards

```tsx
// Light section with rounded top
<View className="bg-[#F8F8F6] rounded-t-[28px] -mt-1 min-h-[500px]">
  {/* Content goes here */}
</View>
```

### Animation Keyframes (if needed in globals.css)

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### References

- [Design Prototype: cadence-full-v9.jsx ProfileTab](../brainstorming/cadence-full-v9.jsx#L604-L695)
- [Architecture: NativeWind patterns](../planning-artifacts/architecture.md#design-system-patterns)
- [Existing Settings Components](../../apps/native/src/components/app/account/)
- [Tailwind Config](../../apps/native/tailwind.config.ts)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No blocking issues encountered

### Completion Notes List

- **Task 1**: Created ProfileScreen with scroll tracking, collapsed header animation using react-native-reanimated. Threshold at scroll > 85% of 120px.
- **Task 2**: Created ProfileHeader with SVG progress ring (46px radius), avatar with lime background, name + PRO badge, plan phase subtitle, stats row (km/runs/streak), and Share on Strava button.
- **Task 3**: Created ConnectedServiceCard with brand colors (Strava #FC4C02, Apple Health #FF2D55, Garmin #007CC3), connection status badge (green for connected, gray for connect).
- **Task 4**: Enhanced SettingsRow with optional `value` prop displayed next to chevron with `text-muted-foreground` styling.
- **Task 5**: Updated tab navigation from `account` to `profile`. Kept account.tsx for potential detail screen use.
- **Task 6**: Mock data included inline in profile.tsx for stats (387 km, 31 runs, 12 streak, 74% plan completion), connected services, and settings values.
- **Task 7**: Added animations: progress ring animation on mount (600ms delay), scroll-based opacity/scale transitions, collapsed header slide-in using react-native-reanimated (200ms ease-out).

### File List

**New Files:**
- `apps/native/src/app/(app)/(tabs)/profile.tsx` - Main Profile screen component
- `apps/native/src/components/app/profile/profile-header.tsx` - ProfileHeader component with progress ring
- `apps/native/src/components/app/profile/connected-service-card.tsx` - ConnectedServiceCard component
- `apps/native/src/components/app/profile/index.ts` - Profile components barrel export

**Modified Files:**
- `apps/native/src/app/(app)/(tabs)/_layout.tsx` - Changed tab trigger from "account" to "profile"
- `apps/native/src/components/app/account/settings-row.tsx` - Added optional `value` prop

## Change Log

- 2026-02-20: Story 10.5 implementation complete - Profile screen with all components, animations, and mock data
