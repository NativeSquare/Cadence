import { useState, useEffect, useRef, useCallback } from "react";

// ─── Tokens ──────────────────────────────────────────────────
const T = {
  black: "#000000", lime: "#C8FF00",
  limeDim: "rgba(200,255,0,0.12)", limeGlow: "rgba(200,255,0,0.06)",
  g1: "rgba(255,255,255,0.92)", g2: "rgba(255,255,255,0.7)",
  g3: "rgba(255,255,255,0.45)", g4: "rgba(255,255,255,0.25)",
  g5: "rgba(255,255,255,0.10)", g6: "rgba(255,255,255,0.06)",
  brd: "rgba(255,255,255,0.08)", card: "rgba(255,255,255,0.03)",
  ora: "#FF8A00", oraDim: "rgba(255,138,0,0.12)",
  red: "#FF5A5A", blu: "#5B9EFF",
  f: "'Outfit',sans-serif", m: "'JetBrains Mono',monospace",
};

const lk = document.createElement("link");
lk.rel = "stylesheet"; lk.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(lk);
const st = document.createElement("style");
st.textContent = `
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes springUp{0%{opacity:0;transform:translateY(28px) scale(.98)}70%{transform:translateY(-3px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes growWidth{from{width:0}to{width:100%}}
@keyframes softPulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:0}`;
document.head.appendChild(st);

// ─── Grain ───────────────────────────────────────────────────
function Grain() {
  const r = useRef(null);
  useEffect(() => {
    const c = r.current; if (!c) return;
    const x = c.getContext("2d"); c.width = 200; c.height = 200;
    const d = x.createImageData(200, 200);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 8; }
    x.putImageData(d, 0, 0);
  }, []);
  return <canvas ref={r} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 50, opacity: 0.4, mixBlendMode: "overlay" }} />;
}

// ─── Streaming text hook ─────────────────────────────────────
function useStream(text, speed = 28, delay = 0, active = true) {
  const [d, setD] = useState("");
  const [done, setDone] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) { setD(""); setDone(false); setOn(false); return; }
    setD(""); setDone(false);
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [active, text, delay]);
  useEffect(() => {
    if (!on || !active) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setD(text.slice(0, i + 1)); i++; } else { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [on, active, text, speed]);
  return { displayed: d, done, started: on };
}

const Cursor = () => <span style={{ display: "inline-block", width: 2, height: "1.1em", background: T.lime, marginLeft: 2, verticalAlign: "text-bottom", animation: "blink .8s infinite" }} />;

// ═══════════════════════════════════════════════════════════════
// DATA ANALYSIS ENGINE — Pure JS, no AI
// ═══════════════════════════════════════════════════════════════

// Helper: format pace (5.5 min/km → "5:30")
function formatPace(decimalMinutes) {
  const mins = Math.floor(decimalMinutes);
  const secs = Math.round((decimalMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper: format distance
function formatDist(meters) {
  const km = meters / 1000;
  return km >= 100 ? `${Math.round(km).toLocaleString()} km` : `${km.toFixed(1)} km`;
}

// Helper: relative date in words
function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days < 2) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  const remainMonths = Math.floor((days % 365) / 30);
  if (remainMonths > 0) return `${years} year${years > 1 ? "s" : ""} and ${remainMonths} months ago`;
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

// Helper: format date nicely
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Distance comparison (total km → relatable journey)
function distanceComparison(km) {
  if (km >= 40000) return "around the Earth";
  if (km >= 12000) return "Paris to Tokyo and back";
  if (km >= 8500) return "Paris to Tokyo";
  if (km >= 6000) return "across the Atlantic";
  if (km >= 3500) return "New York to Los Angeles";
  if (km >= 1500) return "Paris to Athens";
  if (km >= 800) return "London to Rome";
  if (km >= 300) return "Paris to London and back";
  if (km >= 100) return "a hundred kilometers of ground covered";
  return "a good start";
}

// Run type identity (from average distance)
function runnerIdentity(avgDistKm) {
  if (avgDistKm >= 30) return "ultrarunner";
  if (avgDistKm >= 18) return "marathon-distance runner";
  if (avgDistKm >= 12) return "half-marathon runner";
  if (avgDistKm >= 8) return "10K runner";
  if (avgDistKm >= 4) return "5K runner";
  return "runner";
}

// Compute all insights from raw activities
function computeInsights(activities) {
  if (!activities.length) return null;

  const sorted = [...activities].sort((a, b) => new Date(a.metadata.start_time) - new Date(b.metadata.start_time));
  const totalRuns = sorted.length;
  const firstRun = sorted[0];
  const lastRun = sorted[sorted.length - 1];

  const totalDistM = sorted.reduce((s, a) => s + (a.distance_data?.summary?.distance_meters || 0), 0);
  const totalDistKm = totalDistM / 1000;

  const totalElev = sorted.reduce((s, a) => s + (a.distance_data?.summary?.elevation?.gain_actual_meters || 0), 0);

  // Fastest pace
  const withPace = sorted.filter(a => a.movement_data?.avg_pace_minutes_per_kilometer > 0);
  let fastestRun = null;
  if (withPace.length) {
    fastestRun = withPace.reduce((best, a) =>
      a.movement_data.avg_pace_minutes_per_kilometer < best.movement_data.avg_pace_minutes_per_kilometer ? a : best
    );
  }

  // Longest run
  const withDist = sorted.filter(a => (a.distance_data?.summary?.distance_meters || 0) > 0);
  let longestRun = null;
  if (withDist.length) {
    longestRun = withDist.reduce((best, a) =>
      (a.distance_data.summary.distance_meters) > (best.distance_data.summary.distance_meters) ? a : best
    );
  }

  // Weekly volume
  const firstDate = new Date(firstRun.metadata.start_time);
  const lastDate = new Date(lastRun.metadata.start_time);
  const weeksSpan = Math.max(1, (lastDate - firstDate) / (7 * 86400000));
  const avgWeeklyKm = totalDistKm / weeksSpan;

  // Average distance per run
  const avgDistKm = totalDistKm / totalRuns;

  // Recent activity check
  const daysSinceLastRun = Math.floor((new Date() - lastDate) / 86400000);

  // Consistency: count weeks with ≥1 run in last 12 weeks
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000);
  const recentRuns = sorted.filter(a => new Date(a.metadata.start_time) >= twelveWeeksAgo);
  const activeWeeks = new Set(recentRuns.map(a => {
    const d = new Date(a.metadata.start_time);
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
    return weekStart.toISOString().slice(0, 10);
  })).size;

  // City
  const cities = sorted.map(a => a.metadata.city).filter(Boolean);
  let topCity = null;
  if (cities.length) {
    const freq = {};
    cities.forEach(c => freq[c] = (freq[c] || 0) + 1);
    topCity = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }

  return {
    totalRuns, firstRun, lastRun, totalDistKm, totalElev,
    fastestRun, longestRun, avgWeeklyKm, avgDistKm,
    daysSinceLastRun, activeWeeks, topCity, weeksSpan,
  };
}

// ═══════════════════════════════════════════════════════════════
// DECISION TREE — Pick 4-5 emotional insights to display
// ═══════════════════════════════════════════════════════════════

function buildInsightCards(ins) {
  const cards = [];

  // ─── Always: Journey start ───
  const journeyYears = ins.weeksSpan / 52;
  const firstDate = formatDate(ins.firstRun.metadata.start_time);
  if (journeyYears >= 2) {
    cards.push({
      big: firstDate,
      sub: `Your first run. That was ${timeAgo(ins.firstRun.metadata.start_time)}.`,
      note: ins.totalRuns > 500 ? `${ins.totalRuns} runs since then. That's not a hobby — that's a part of who you are.`
        : ins.totalRuns > 100 ? `${ins.totalRuns} runs since. You kept showing up.`
        : `${ins.totalRuns} runs since. Every one counted.`,
      accent: T.lime,
    });
  } else {
    cards.push({
      big: `${ins.totalRuns} runs`,
      sub: `Started ${timeAgo(ins.firstRun.metadata.start_time)}.`,
      note: journeyYears < 0.5 ? "Still early — that's when the right coaching matters most."
        : "Building momentum. I can see the trajectory.",
      accent: T.lime,
    });
  }

  // ─── Always: Total distance with relatable comparison ───
  cards.push({
    big: formatDist(ins.totalDistKm * 1000),
    sub: `That's ${distanceComparison(ins.totalDistKm)}.`,
    note: null,
    accent: T.g1,
  });

  // ─── Conditional: Location callout ───
  if (ins.topCity) {
    cards.push({
      big: ins.topCity,
      sub: "Your home turf.",
      note: "I'll factor local terrain and climate into your plan.",
      accent: T.lime,
    });
  }

  // ─── Conditional: PR pace (if sub-5:30/km it's impressive) ───
  if (ins.fastestRun) {
    const pace = ins.fastestRun.movement_data.avg_pace_minutes_per_kilometer;
    const paceStr = formatPace(pace);
    const prDate = formatDate(ins.fastestRun.metadata.start_time);
    const dist = ins.fastestRun.distance_data?.summary?.distance_meters || 0;
    const distStr = formatDist(dist);

    if (pace < 6.0) {
      cards.push({
        big: `${paceStr}/km`,
        sub: `Your fastest — ${distStr} on ${prDate}.`,
        note: pace < 4.5 ? "That's serious speed. We'll build on it."
          : pace < 5.0 ? "Strong. There's more in the tank."
          : "I bet you remember that run.",
        accent: T.lime,
      });
    }
  }

  // ─── Conditional: Longest run (if half marathon+) ───
  if (ins.longestRun) {
    const dist = ins.longestRun.distance_data.summary.distance_meters;
    if (dist >= 15000) {
      cards.push({
        big: formatDist(dist),
        sub: `Your longest. ${formatDate(ins.longestRun.metadata.start_time)}.`,
        note: dist >= 35000 ? "Ultrarunner territory. You know what deep fatigue feels like."
          : dist >= 21000 ? "Half marathon distance and beyond. The endurance is there."
          : "That's a solid long run. We'll build from here.",
        accent: T.g1,
      });
    }
  }

  // ─── Conditional: Comeback angle ───
  if (ins.daysSinceLastRun > 30) {
    cards.push({
      big: `${ins.daysSinceLastRun} days`,
      sub: "Since your last run.",
      note: ins.daysSinceLastRun > 90 ? "A long break — but your body remembers more than you think. We'll be smart about the ramp."
        : "A few weeks off. The fitness is still there. Let's rebuild the rhythm.",
      accent: T.ora,
    });
  } else if (ins.activeWeeks >= 10) {
    // Consistency callout instead
    cards.push({
      big: `${ins.activeWeeks}/12 weeks`,
      sub: "Active in the last 3 months.",
      note: ins.activeWeeks === 12 ? "Perfect consistency. That's rare. We'll push the intensity."
        : "Solid rhythm. Consistency is the hardest part — you've got it.",
      accent: T.lime,
    });
  }

  // ─── Conditional: Elevation (if mountainous) ───
  if (ins.totalElev > 10000) {
    cards.push({
      big: `${Math.round(ins.totalElev).toLocaleString()} m`,
      sub: `Total elevation gained.`,
      note: ins.totalElev > 50000 ? "That's Everest five times over. You like climbing."
        : ins.totalElev > 20000 ? `More than twice Everest. The legs are there.`
        : "Not afraid of hills. Good — hills build strength.",
      accent: T.g1,
    });
  }

  // ─── Conditional: Weekly volume identity ───
  if (ins.avgWeeklyKm > 15) {
    const identity = runnerIdentity(ins.avgDistKm);
    if (!cards.some(c => c.big.includes("week"))) {
      cards.push({
        big: `~${Math.round(ins.avgWeeklyKm)} km/week`,
        sub: `Average volume. ${identity.charAt(0).toUpperCase() + identity.slice(1)} by habit.`,
        note: ins.avgWeeklyKm > 60 ? "High mileage. Recovery matters more than you think."
          : ins.avgWeeklyKm > 40 ? "Solid base. Room to build but also room to overdo it."
          : null,
        accent: T.g1,
      });
    }
  }

  // Cap at 5 cards max
  return cards.slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — 847 activities for demo
// ═══════════════════════════════════════════════════════════════
function generateMockActivities() {
  const activities = [];
  const names = ["Easy Run", "Easy Run", "Easy Run", "Long Run", "Tempo Run", "Intervals", "Recovery Run", "Long Run"];
  const baseDate = new Date("2022-03-14T07:00:00Z");

  for (let i = 0; i < 847; i++) {
    const dayOffset = Math.floor(i * 1.1) + Math.floor(Math.random() * 2);
    const startDate = new Date(baseDate.getTime() + dayOffset * 86400000);
    const hour = 6 + Math.floor(Math.random() * 4);
    startDate.setHours(hour, Math.floor(Math.random() * 60));

    const name = names[Math.floor(Math.random() * names.length)];
    const isLong = name === "Long Run";
    const isTempo = name === "Tempo Run";

    const dist = isLong ? 14000 + Math.random() * 12000
      : isTempo ? 8000 + Math.random() * 4000
      : 5000 + Math.random() * 6000;

    const pace = isLong ? 5.3 + Math.random() * 0.7
      : isTempo ? 4.4 + Math.random() * 0.5
      : 5.5 + Math.random() * 1.0;

    const duration = (dist / 1000) * pace * 60;
    const endDate = new Date(startDate.getTime() + duration * 1000);

    activities.push({
      connectionId: "mock-conn",
      userId: "mock-user",
      metadata: {
        summary_id: `mock-${i}`,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        type: 1,
        upload_type: 0,
        name,
        city: Math.random() > 0.15 ? "Paris" : Math.random() > 0.5 ? "Fontainebleau" : null,
      },
      distance_data: {
        summary: {
          distance_meters: Math.round(dist),
          steps: Math.round(dist * 1.4),
          elevation: { gain_actual_meters: Math.round(20 + Math.random() * 80) },
        },
      },
      heart_rate_data: {
        summary: {
          avg_hr_bpm: Math.round(135 + Math.random() * 25),
          max_hr_bpm: Math.round(165 + Math.random() * 20),
          min_hr_bpm: Math.round(95 + Math.random() * 15),
        },
      },
      calories_data: { total_burned_calories: Math.round(dist * 0.07) },
      movement_data: {
        avg_cadence_rpm: Math.round(165 + Math.random() * 15),
        avg_pace_minutes_per_kilometer: Math.round(pace * 100) / 100,
        avg_speed_meters_per_second: Math.round((1000 / (pace * 60)) * 100) / 100,
      },
      TSS_data: { TSS_samples: [{ actual: Math.round(40 + Math.random() * 60), method: "mock" }] },
    });
  }
  return activities;
}

// ═══════════════════════════════════════════════════════════════
// INSIGHT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

function InsightCard({ card, index, show }) {
  const bigStream = useStream(card.big, 38, 0, show);
  const subStream = useStream(card.sub, 22, card.big.length * 38 + 200, show);
  const noteStream = useStream(card.note || "", 20, card.big.length * 38 + card.sub.length * 22 + 500, show);

  if (!show) return null;

  return (
    <div style={{
      padding: "0 0 36px",
      borderBottom: `1px solid ${T.brd}`,
      marginBottom: 32,
      animation: "fadeUp .5s ease both",
    }}>
      {/* Big number / fact */}
      <div style={{
        fontFamily: T.m, fontSize: 32, fontWeight: 500,
        color: card.accent, letterSpacing: "-0.03em",
        lineHeight: 1.2, marginBottom: 8,
      }}>
        {bigStream.displayed}
        {!bigStream.done && bigStream.started && <Cursor />}
      </div>

      {/* Supporting line */}
      {bigStream.done && (
        <p style={{
          fontFamily: T.f, fontSize: 18, fontWeight: 300,
          color: T.g2, lineHeight: 1.5, letterSpacing: "-0.01em",
        }}>
          {subStream.displayed}
          {!subStream.done && subStream.started && <Cursor />}
        </p>
      )}

      {/* Coach note */}
      {card.note && subStream.done && (
        <p style={{
          fontFamily: T.f, fontSize: 15, fontWeight: 300,
          color: T.g3, lineHeight: 1.55, marginTop: 8,
          letterSpacing: "-0.01em",
        }}>
          {noteStream.displayed}
          {!noteStream.done && noteStream.started && <Cursor />}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONNECTING ANIMATION (brief, before insights)
// ═══════════════════════════════════════════════════════════════

function ConnectingPhase({ provider, onDone }) {
  const [step, setStep] = useState(0);

  const s0 = useStream(`Connected to ${provider}.`, 28, 400, step >= 0);
  const s1 = useStream("Reading your history...", 28, 200, step >= 1);
  const s2 = useStream("Got it. Here's what I see.", 28, 200, step >= 2);

  useEffect(() => {
    if (s0.done) setTimeout(() => setStep(1), 300);
  }, [s0.done]);
  useEffect(() => {
    if (s1.done) setTimeout(() => setStep(2), 400);
  }, [s1.done]);
  useEffect(() => {
    if (s2.done) setTimeout(onDone, 800);
  }, [s2.done]);

  return (
    <div style={{ padding: "0 36px" }}>
      <p style={{ fontFamily: T.f, fontSize: 22, fontWeight: 300, color: T.g1, lineHeight: 1.5, letterSpacing: "-.02em" }}>
        {s0.displayed}
        {!s0.done && s0.started && <Cursor />}
      </p>

      {step >= 1 && (
        <p style={{
          fontFamily: T.f, fontSize: 22, fontWeight: 300, color: T.g3,
          lineHeight: 1.5, marginTop: 4, letterSpacing: "-.02em",
          animation: "fadeIn .3s ease both",
        }}>
          {s1.displayed}
          {!s1.done && s1.started && <Cursor />}
        </p>
      )}

      {step >= 2 && (
        <p style={{
          fontFamily: T.f, fontSize: 22, fontWeight: 300, color: T.lime,
          lineHeight: 1.5, marginTop: 4, letterSpacing: "-.02em",
          animation: "fadeIn .3s ease both",
        }}>
          {s2.displayed}
          {!s2.done && s2.started && <Cursor />}
        </p>
      )}

      {/* Activity count ticker */}
      {step >= 1 && !s2.done && <ActivityCounter target={847} />}
    </div>
  );
}

// Small animated counter while "reading"
function ActivityCounter({ target }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let c = 0;
    const iv = setInterval(() => {
      c += Math.floor(Math.random() * 40) + 15;
      if (c >= target) { c = target; clearInterval(iv); }
      setCount(c);
    }, 50);
    return () => clearInterval(iv);
  }, [target]);

  return (
    <div style={{
      marginTop: 20, display: "flex", alignItems: "center", gap: 10,
      animation: "fadeIn .3s ease both",
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: 3, background: T.lime,
        animation: count < target ? "softPulse 0.6s ease infinite" : "none",
        opacity: count >= target ? 1 : undefined,
      }} />
      <span style={{ fontFamily: T.m, fontSize: 13, color: T.g3 }}>
        <span style={{ color: T.g1, fontWeight: 500 }}>{count}</span> activities
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHONE FRAME
// ═══════════════════════════════════════════════════════════════
function Phone({ children }) {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505", padding: 20, fontFamily: T.f }}>
      <div style={{ width: 390, height: 844, background: T.black, borderRadius: 48, overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,.06)", boxShadow: "0 0 100px rgba(0,0,0,.9)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", zIndex: 100 }}>
          <span style={{ fontFamily: T.f, fontSize: 15, fontWeight: 600, color: T.g1 }}>17:32</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0" y="6" width="3" height="6" rx="1" fill={T.g1} /><rect x="4.5" y="4" width="3" height="8" rx="1" fill={T.g1} /><rect x="9" y="1.5" width="3" height="10.5" rx="1" fill={T.g1} /><rect x="13" y="0" width="3" height="12" rx="1" fill={T.g3} /></svg>
            <div style={{ width: 24, height: 11, borderRadius: 3, border: `1px solid ${T.g3}`, padding: 1.5 }}><div style={{ width: "70%", height: "100%", borderRadius: 1.5, background: T.g1 }} /></div>
          </div>
        </div>
        <Grain />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN — Connect → Insights → Continue
// ═══════════════════════════════════════════════════════════════
export default function DataInsightsScreen() {
  const [phase, setPhase] = useState("connecting"); // connecting → insights → ready
  const [insightCards, setInsightCards] = useState([]);
  const [visibleCard, setVisibleCard] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const scrollRef = useRef(null);

  // On mount: compute insights from mock data
  useEffect(() => {
    const activities = generateMockActivities();
    const insights = computeInsights(activities);
    if (insights) {
      const cards = buildInsightCards(insights);
      setInsightCards(cards);
    }
  }, []);

  // Phase: connecting → insights
  const handleConnectDone = useCallback(() => {
    setPhase("insights");
    setVisibleCard(0);
  }, []);

  // Reveal insights sequentially — listen for each card's completion
  // Each card takes roughly (big.length * 38 + sub.length * 22 + note.length * 20 + delays) ms
  useEffect(() => {
    if (phase !== "insights" || !insightCards.length) return;
    if (visibleCard >= insightCards.length) {
      setTimeout(() => setAllRevealed(true), 600);
      return;
    }

    const card = insightCards[visibleCard];
    const bigTime = card.big.length * 38;
    const subTime = card.sub.length * 22 + 200;
    const noteTime = card.note ? card.note.length * 20 + 500 : 0;
    const totalTime = bigTime + subTime + noteTime + 800;

    const timer = setTimeout(() => setVisibleCard(v => v + 1), totalTime);
    return () => clearTimeout(timer);
  }, [phase, visibleCard, insightCards]);

  // Auto-scroll as cards appear
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 200);
    }
  }, [visibleCard]);

  return (
    <Phone>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", paddingTop: 70 }}>

        {/* Progress bar */}
        <div style={{ padding: "0 28px", marginBottom: 24 }}>
          <div style={{ height: 2, background: T.g6, borderRadius: 1 }}>
            <div style={{
              height: "100%", borderRadius: 1, background: T.lime,
              width: phase === "connecting" ? "8%" : allRevealed ? "20%" : `${8 + (visibleCard / insightCards.length) * 12}%`,
              transition: "width 1s ease",
            }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            WebkitOverflowScrolling: "touch", minHeight: 0,
            paddingBottom: 130,
          }}
        >
          {/* Phase 1: Connecting */}
          {phase === "connecting" && (
            <ConnectingPhase provider="Strava" onDone={handleConnectDone} />
          )}

          {/* Phase 2: Insight cards */}
          {phase === "insights" && (
            <div style={{ padding: "0 36px" }}>
              {insightCards.map((card, i) => (
                <InsightCard
                  key={i}
                  card={card}
                  index={i}
                  show={i <= visibleCard}
                />
              ))}

              {/* Closing coach line */}
              {allRevealed && <ClosingLine />}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {allRevealed && (
          <div style={{
            flexShrink: 0, padding: "0 28px 48px", position: "relative",
            animation: "springUp .5s ease both",
          }}>
            <div style={{ position: "absolute", top: -60, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, #000)", pointerEvents: "none" }} />
            <button style={{
              width: "100%", padding: "18px 24px", borderRadius: 14,
              border: "none", background: T.lime, color: T.black,
              fontFamily: T.f, fontSize: 17, fontWeight: 600, cursor: "pointer",
              letterSpacing: "-.01em", position: "relative", zIndex: 2,
            }}>
              Continue
            </button>
          </div>
        )}
      </div>
    </Phone>
  );
}

function ClosingLine() {
  const s = useStream("I already know a lot. Let me ask a few more things to get the full picture.", 22, 300, true);
  return (
    <div style={{ paddingTop: 8, animation: "fadeUp .5s ease both" }}>
      <p style={{
        fontFamily: T.f, fontSize: 18, fontWeight: 300,
        color: T.lime, lineHeight: 1.5, letterSpacing: "-.01em",
      }}>
        {s.displayed}
        {!s.done && s.started && <Cursor />}
      </p>
    </div>
  );
}
