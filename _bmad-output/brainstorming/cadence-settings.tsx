import { useState } from "react";

// ═══════════════════════════════════════
// CADENCE — Settings / Profile Screen
// Standalone reference prototype
// ═══════════════════════════════════════

// Design tokens
const T = {
  f: "'Outfit', system-ui, sans-serif",
  // Light surface palette
  w1: "#FFFFFF", w2: "#F8F8F6", w3: "#EEEEEC",
  wText: "#1A1A1A", wSub: "#5C5C5C", wMute: "#A3A3A0", wBrd: "rgba(0,0,0,.06)",
  // Accent
  lime: "#C8FF00", barHigh: "#A8D900",
  // Dark (used for inverted elements)
  black: "#0A0A0A",
};

// Phone frame
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505", padding: 20, fontFamily: T.f }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: 390, height: 844, background: T.w2, borderRadius: 48, overflow: "hidden", position: "relative", border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 0 100px rgba(0,0,0,.3)" }}>
        {/* Status bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", zIndex: 100 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: T.wText }}>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="3" width="3" height="9" rx="1" fill={T.wText} /><rect x="4.5" y="2" width="3" height="10" rx="1" fill={T.wText} /><rect x="9" y="0" width="3" height="12" rx="1" fill={T.wText} /><rect x="13" y="4" width="3" height="8" rx="1" fill={T.wMute} /></svg>
            <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0" y="0" width="21" height="12" rx="2.5" stroke={T.wText} strokeWidth="1" fill="none" /><rect x="22" y="3.5" width="1.5" height="5" rx=".5" fill={T.wText} /><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill={T.wText} /></svg>
          </div>
        </div>
        {/* Dynamic island */}
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 126, height: 36, borderRadius: 20, background: T.black, zIndex: 110 }} />
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SETTINGS SCREEN
// ═══════════════════════════════════════

function SettingsScreen() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({ Strava: true, "Apple Health": true, Garmin: false });

  const toggle = (name: string) => setToggles(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", background: T.w2 }}>

      {/* Header — left-aligned avatar + name */}
      <div style={{ padding: "68px 24px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${T.lime}, ${T.barHigh})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: T.black }}>A</span>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.wText, letterSpacing: "-.02em" }}>Alex</span>
            <div style={{ padding: "2px 8px", borderRadius: 6, background: T.wText }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: T.lime, letterSpacing: ".04em" }}>PRO</span>
            </div>
          </div>
          <span style={{ fontSize: 13, color: T.wMute, display: "block", marginTop: 3 }}>Half Marathon · Week 4 Build</span>
        </div>
      </div>

      <div style={{ padding: "0 16px 40px" }}>

        {/* Training group */}
        <span style={{ fontSize: 11, fontWeight: 600, color: T.wMute, padding: "0 4px", display: "block", marginBottom: 8, letterSpacing: ".05em", textTransform: "uppercase" as const }}>Training</span>
        <div style={{ borderRadius: 18, background: T.w1, border: `1px solid ${T.wBrd}`, overflow: "hidden", marginBottom: 20 }}>
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#A8D900" strokeWidth="1.8" /><path d="M2 17l10 5 10-5" stroke="#A8D900" strokeWidth="1.8" /><path d="M2 12l10 5 10-5" stroke="#A8D900" strokeWidth="1.8" /></svg>, bg: "rgba(168,217,0,.1)", l: "Goal", v: "Sub 1:45 HM" },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 20V10M18 20V4M6 20v-4" stroke="#5B9EFF" strokeWidth="2" strokeLinecap="round" /></svg>, bg: "rgba(91,158,255,.1)", l: "Coaching Style", v: "Balanced" },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FF8A00" strokeWidth="1.8" /><path d="M12 6v6l4 2" stroke="#FF8A00" strokeWidth="1.8" strokeLinecap="round" /></svg>, bg: "rgba(255,138,0,.1)", l: "Weekly Volume", v: "42–48 km" },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="#A8D900" strokeWidth="1.8" /><line x1="4" y1="22" x2="4" y2="15" stroke="#A8D900" strokeWidth="1.8" /></svg>, bg: "rgba(168,217,0,.1)", l: "Units", v: "Metric (km)" },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.wBrd}` : "none", cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: T.wText }}>{item.l}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: T.wMute }}>{item.v}</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={T.wMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Connections group */}
        <span style={{ fontSize: 11, fontWeight: 600, color: T.wMute, padding: "0 4px", display: "block", marginBottom: 8, letterSpacing: ".05em", textTransform: "uppercase" as const }}>Connections</span>
        <div style={{ borderRadius: 18, background: T.w1, border: `1px solid ${T.wBrd}`, overflow: "hidden", marginBottom: 20 }}>
          {[
            { name: "Strava", icon: "S", color: "#FC4C02", desc: "Activities synced" },
            { name: "Apple Health", icon: "♥", color: "#FF2D55", desc: "HR, sleep & recovery" },
            { name: "Garmin", icon: "G", color: "#007CC3", desc: "GPS watch" },
          ].map((svc, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.wBrd}` : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: svc.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: svc.icon === "♥" ? 15 : 13, fontWeight: 800, color: svc.color }}>{svc.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: T.wText }}>{svc.name}</span>
                <span style={{ fontSize: 12, color: T.wMute, display: "block", marginTop: 1 }}>{svc.desc}</span>
              </div>
              <div onClick={() => toggle(svc.name)} style={{ width: 44, height: 26, borderRadius: 13, background: toggles[svc.name] ? T.lime : "rgba(0,0,0,.08)", padding: 2, cursor: "pointer", transition: "background .2s ease", position: "relative" as const }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: T.w1, boxShadow: "0 1px 3px rgba(0,0,0,.15)", transform: toggles[svc.name] ? "translateX(18px)" : "translateX(0)", transition: "transform .2s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Account group */}
        <span style={{ fontSize: 11, fontWeight: 600, color: T.wMute, padding: "0 4px", display: "block", marginBottom: 8, letterSpacing: ".05em", textTransform: "uppercase" as const }}>Account</span>
        <div style={{ borderRadius: 18, background: T.w1, border: `1px solid ${T.wBrd}`, overflow: "hidden", marginBottom: 20 }}>
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={T.wSub} strokeWidth="1.8" /><path d="M4 21v-1a6 6 0 0112 0v1" stroke={T.wSub} strokeWidth="1.8" /></svg>, bg: T.w3, l: "Edit Profile", v: undefined as string | undefined, vColor: undefined as string | undefined },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={T.wSub} strokeWidth="1.8" strokeLinecap="round" /><path d="M13.7 21a2 2 0 01-3.4 0" stroke={T.wSub} strokeWidth="1.8" strokeLinecap="round" /></svg>, bg: T.w3, l: "Notifications", v: "On", vColor: undefined },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke={T.wSub} strokeWidth="1.8" /><path d="M7 11V7a5 5 0 0110 0v4" stroke={T.wSub} strokeWidth="1.8" /></svg>, bg: T.w3, l: "Subscription", v: "Pro", vColor: T.barHigh },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.wBrd}` : "none", cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: T.wText }}>{item.l}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {item.v && <span style={{ fontSize: 13, fontWeight: item.vColor ? 600 : 400, color: item.vColor || T.wMute }}>{item.v}</span>}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={T.wMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Share + sign out */}
        <button style={{ width: "100%", padding: 14, borderRadius: 16, background: T.wText, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={T.lime} strokeWidth="2" strokeLinecap="round" /><polyline points="16,6 12,2 8,6" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="2" x2="12" y2="15" stroke={T.lime} strokeWidth="2" strokeLinecap="round" /></svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.w1 }}>Share on Strava</span>
        </button>
        <button style={{ width: "100%", padding: 14, borderRadius: 16, background: "transparent", border: `1px solid ${T.wBrd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: T.wMute }}>Sign Out</span>
        </button>

        <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.wMute }}>Cadence v0.1 · Made with 🖤</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════

export default function CadenceSettings() {
  return (
    <Phone>
      <SettingsScreen />
    </Phone>
  );
}
