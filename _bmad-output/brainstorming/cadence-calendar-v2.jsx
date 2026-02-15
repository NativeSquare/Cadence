import { useState, useEffect, useRef } from "react";

// ─── Tokens ──────────────────────────────────────────────────
const T = {
  black: "#000000", lime: "#C8FF00",
  limeDim: "rgba(200,255,0,0.12)", limeGlow: "rgba(200,255,0,0.06)",
  g1: "rgba(255,255,255,0.92)", g2: "rgba(255,255,255,0.7)",
  g3: "rgba(255,255,255,0.45)", g4: "rgba(255,255,255,0.25)",
  g5: "rgba(255,255,255,0.10)", g6: "rgba(255,255,255,0.06)",
  brd: "rgba(255,255,255,0.08)", card: "rgba(255,255,255,0.03)",
  sb: "rgba(200,255,0,0.4)", sg: "rgba(200,255,0,0.06)",
  red: "#FF5A5A", redDim: "rgba(255,90,90,0.12)",
  ora: "#FF8A00", oraDim: "rgba(255,138,0,0.12)",
  blu: "#5B9EFF", bluDim: "rgba(91,158,255,0.12)",
  f: "'Outfit',sans-serif", m: "'JetBrains Mono',monospace",
};

const lk = document.createElement("link");
lk.rel = "stylesheet"; lk.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(lk);
const st = document.createElement("style");
st.textContent = `
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes springUp{0%{opacity:0;transform:translateY(24px) scale(.98)}70%{transform:translateY(-3px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:0}`;
document.head.appendChild(st);

// ─── Hooks ───────────────────────────────────────────────────
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

const Cursor = () => <span style={{ display: "inline-block", width: 2, height: "1em", background: T.lime, marginLeft: 2, verticalAlign: "text-bottom", animation: "blink .8s infinite" }} />;

// ─── Session Data ────────────────────────────────────────────
const sessions = [
  {
    day: "Monday", short: "MON", type: "Tempo", dur: "50 min", effort: "7/10",
    key: true, color: T.lime, colorDim: T.limeDim,
    pace: "4:55–5:05/km",
    desc: "Sustained effort at comfortably hard pace. This builds your lactate threshold — the pace you can hold without accumulating fatigue.",
    structure: "10 min warm-up → 30 min tempo → 10 min cool-down",
    why: "Monday tempo sets the tone for the week. You're fresh from the weekend, mentally sharp. The effort is high but controlled."
  },
  {
    day: "Tuesday", short: "TUE", type: "Easy", dur: "40 min", effort: "3/10",
    key: false, color: T.g3, colorDim: T.g6,
    pace: "5:55–6:10/km",
    desc: "Truly easy. Conversational pace. If you can't hold a full conversation, you're going too fast.",
    structure: "40 min continuous easy running",
    why: "Active recovery from yesterday's tempo. Blood flow without stress. This is where your body actually absorbs the training."
  },
  {
    day: "Wednesday", short: "WED", type: "Intervals", dur: "55 min", effort: "8/10",
    key: true, color: T.lime, colorDim: T.limeDim,
    pace: "4:30–4:45/km (work intervals)",
    desc: "Short, fast repeats with recovery jogs. This builds your VO2max — the ceiling of your aerobic engine.",
    structure: "15 min warm-up → 6 × 800m @ 4:35 (90s jog recovery) → 10 min cool-down",
    why: "Mid-week intensity spike. Far enough from Sunday's long run to recover properly, early enough to not interfere with it."
  },
  {
    day: "Thursday", short: "THU", type: "Rest", dur: "—", effort: "0/10",
    key: false, color: T.g4, colorDim: "transparent", rest: true,
    desc: "Complete rest. No cross-training, no 'just a short jog.' Your muscles rebuild when you stop asking them to work.",
    why: "After two quality days (tempo + intervals), your body needs silence. This isn't laziness — it's strategy."
  },
  {
    day: "Friday", short: "FRI", type: "Easy", dur: "35 min", effort: "2/10",
    key: false, color: T.g3, colorDim: T.g6,
    pace: "6:00–6:15/km",
    desc: "Shorter and slower than Tuesday's easy run. Just enough to stay loose before the weekend.",
    structure: "35 min continuous easy running",
    why: "Pre-long-run shakeout. Opens up the legs without draining them."
  },
  {
    day: "Saturday", short: "SAT", type: "Rest", dur: "—", effort: "0/10",
    key: false, color: T.g4, colorDim: "transparent", rest: true,
    desc: "Second rest day. Non-negotiable. You need two — not one — genuine rest days per week given your recovery profile.",
    why: "With only 3 rest days last month, you were accumulating fatigue. Two rest days isn't a luxury, it's a correction."
  },
  {
    day: "Sunday", short: "SUN", type: "Long Run", dur: "90 min", effort: "5/10",
    key: true, color: T.lime, colorDim: T.limeDim,
    pace: "5:40–5:55/km",
    desc: "The cornerstone session. Builds endurance, mental toughness, and teaches your body to burn fat efficiently at pace.",
    structure: "90 min with last 20 min at half-marathon effort",
    why: "Sunday long runs are sacred in marathon/half training. The progressive finish teaches your legs to push when tired — exactly what race day demands."
  },
];

// ─── Day Card (Expandable) ───────────────────────────────────
function DayCard({ session, index, expanded, onToggle }) {
  const { day, short, type, dur, effort, key, color, colorDim, pace, desc, structure, why, rest } = session;
  const [pressed, setPressed] = useState(false);

  return (
    <div data-day-card style={{ animation: `springUp .45s ease ${index * .05}s both` }}>
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "16px 18px", borderRadius: expanded ? "16px 16px 0 0" : 16,
          border: `1px solid ${expanded ? (key ? T.sb : T.brd) : T.brd}`,
          borderBottom: expanded ? "none" : `1px solid ${T.brd}`,
          background: expanded ? (key ? T.sg : T.card) : T.card,
          cursor: "pointer",
          transform: pressed ? "scale(.985)" : "scale(1)",
          transition: "transform .1s ease, background .25s ease, border-color .25s ease, border-radius .15s ease",
        }}
      >
        {/* Day label */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: rest ? "transparent" : colorDim,
          border: rest ? `1px dashed ${T.g5}` : `1px solid ${color}20`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: rest ? T.g4 : color, letterSpacing: ".04em" }}>{short}</span>
        </div>

        {/* Session info */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: T.f, fontSize: 16, fontWeight: rest ? 400 : 600, color: rest ? T.g4 : T.g1 }}>{type}</span>
            {key && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.lime }} />}
          </div>
          <span style={{ fontFamily: T.m, fontSize: 11, color: T.g4, letterSpacing: ".02em" }}>{dur}{!rest && ` · Effort ${effort}`}</span>
        </div>

        {/* Expand arrow */}
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: expanded ? (key ? T.limeDim : T.g6) : T.g6,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .2s ease",
        }}>
          <span style={{
            fontFamily: T.m, fontSize: 13, color: expanded ? (key ? T.lime : T.g2) : T.g4,
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform .25s cubic-bezier(.25,.46,.45,.94), color .2s ease",
            display: "inline-block", lineHeight: 1,
          }}>▾</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: "0 18px 18px",
          borderRadius: "0 0 16px 16px",
          border: `1px solid ${key ? T.sb : T.brd}`,
          borderTop: "none",
          background: key ? T.sg : T.card,
          animation: "fadeIn .2s ease both",
        }}>
          {/* Divider */}
          <div style={{ height: 1, background: key ? "rgba(200,255,0,.1)" : T.brd, marginBottom: 16 }} />

          {/* Description */}
          <p style={{ fontFamily: T.f, fontSize: 14, fontWeight: 300, color: T.g2, lineHeight: 1.6, marginBottom: 16 }}>{desc}</p>

          {/* Data rows */}
          {pace && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, display: "flex", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke={T.g4} strokeWidth="1" />
                  <path d="M7 3.5V7L9.5 8.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.g4, letterSpacing: ".06em", textTransform: "uppercase", display: "block" }}>Target Pace</span>
                <span style={{ fontFamily: T.m, fontSize: 13, color: T.g1, fontWeight: 500 }}>{pace}</span>
              </div>
            </div>
          )}

          {structure && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, display: "flex", justifyContent: "center", paddingTop: 2 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8" rx="2" stroke={T.g4} strokeWidth="1" />
                  <path d="M4 3V1.5M10 3V1.5" stroke={T.g4} strokeWidth="1" strokeLinecap="round" />
                  <path d="M1 6H13" stroke={T.g4} strokeWidth="1" />
                </svg>
              </div>
              <div>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.g4, letterSpacing: ".06em", textTransform: "uppercase", display: "block" }}>Structure</span>
                <span style={{ fontFamily: T.f, fontSize: 13, color: T.g2, lineHeight: 1.5 }}>{structure}</span>
              </div>
            </div>
          )}

          {/* Why this session */}
          <div style={{
            marginTop: 12, padding: "12px 14px", borderRadius: 10,
            background: key ? "rgba(200,255,0,.04)" : "rgba(255,255,255,.02)",
            border: `1px solid ${key ? "rgba(200,255,0,.08)" : T.brd}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke={key ? T.lime : T.g4} strokeWidth="1" />
                <path d="M6 4V6.5M6 8.5V8" stroke={key ? T.lime : T.g4} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: T.m, fontSize: 9, fontWeight: 500, color: key ? T.lime : T.g4, letterSpacing: ".06em", textTransform: "uppercase" }}>Why this session</span>
            </div>
            <p style={{ fontFamily: T.f, fontSize: 13, fontWeight: 300, color: T.g3, lineHeight: 1.55 }}>{why}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Phone Frame ─────────────────────────────────────────────
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "visible", zIndex: 10 }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR SCREEN — Vertical Expandable Layout
// ═══════════════════════════════════════════════════════════════
export default function CalendarScreen() {
  const [expanded, setExpanded] = useState(null);
  const [showCoach, setShowCoach] = useState(false);
  const scrollRef = useRef(null);

  const s = useStream("Here's what a typical training week looks like.", 28, 300);
  const [rdy, setRdy] = useState(false);
  useEffect(() => { if (s.done) setTimeout(() => setRdy(true), 400); }, [s.done]);
  useEffect(() => { setTimeout(() => setShowCoach(true), 8000); }, []);

  // Auto-scroll to expanded card
  useEffect(() => {
    if (expanded !== null && scrollRef.current) {
      setTimeout(() => {
        // Find all day card wrappers by looking for the card container
        const container = scrollRef.current;
        const allCards = container.querySelectorAll("[data-day-card]");
        if (allCards[expanded]) {
          allCards[expanded].scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
  }, [expanded]);

  const keyCount = sessions.filter(s => s.key).length;
  const restCount = sessions.filter(s => s.rest).length;

  return (
    <Phone>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", paddingTop: 70 }}>
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            padding: "0 20px",
            paddingBottom: 20,
            minHeight: 0,
          }}
        >
          {/* Header */}
          <div style={{ padding: "0 8px", marginBottom: 6, animation: "fadeIn .4s ease both" }}>
            <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g3, letterSpacing: ".08em", textTransform: "uppercase" }}>Typical Week — Build Phase</span>
          </div>

          {/* Coach streaming text */}
          <div style={{ padding: "0 8px", marginBottom: 20 }}>
            <p style={{ fontSize: 22, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em" }}>
              {s.displayed}{!s.done && s.started && <Cursor />}
            </p>
          </div>

          {/* Summary strip */}
          {rdy && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, padding: "0 4px", animation: "fadeIn .4s ease both" }}>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: T.limeDim, border: "1px solid rgba(200,255,0,.12)", textAlign: "center" }}>
                <span style={{ fontFamily: T.m, fontSize: 18, fontWeight: 500, color: T.lime, display: "block" }}>{keyCount}</span>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.g3, letterSpacing: ".04em" }}>KEY SESSIONS</span>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: T.g6, border: `1px solid ${T.brd}`, textAlign: "center" }}>
                <span style={{ fontFamily: T.m, fontSize: 18, fontWeight: 500, color: T.g2, display: "block" }}>{7 - keyCount - restCount}</span>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.g3, letterSpacing: ".04em" }}>EASY RUNS</span>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: T.g6, border: `1px solid ${T.brd}`, textAlign: "center" }}>
                <span style={{ fontFamily: T.m, fontSize: 18, fontWeight: 500, color: T.g2, display: "block" }}>{restCount}</span>
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.g3, letterSpacing: ".04em" }}>REST DAYS</span>
              </div>
            </div>
          )}

          {/* Day cards */}
          {rdy && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sessions.map((s, i) => (
                <DayCard
                  key={s.day}
                  session={s}
                  index={i}
                  expanded={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                />
              ))}
            </div>
          )}

          {/* Coach comment after browsing */}
          {showCoach && (
            <div style={{ padding: "20px 8px 0", animation: "springUp .5s ease both" }}>
              <div style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid rgba(200,255,0,.1)`, background: T.limeGlow }}>
                <p style={{ fontFamily: T.f, fontSize: 14, fontWeight: 300, color: T.g2, lineHeight: 1.55 }}>
                  <span style={{ color: T.lime, fontWeight: 500 }}>3 key sessions, 2 easy runs, 2 rest days.</span> That's the structure. The key sessions do the building — everything else is recovery. Tap any day to see the reasoning.
                </p>
              </div>
            </div>
          )}

          {/* Spacer for bottom CTA */}
          <div style={{ height: 20 }} />
        </div>

        {/* Bottom CTA — fixed at bottom, gradient fade over scroll */}
        <div style={{ flexShrink: 0, padding: "0 28px 48px", position: "relative" }}>
          <div style={{ position: "absolute", top: -60, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, #000)", pointerEvents: "none" }} />
          <button style={{
            width: "100%", padding: "18px 24px", borderRadius: 14,
            border: "none", background: T.lime, color: T.black,
            fontFamily: T.f, fontSize: 17, fontWeight: 600, cursor: "pointer",
            letterSpacing: "-.01em", position: "relative", zIndex: 2,
          }}>
            See projections
          </button>
        </div>
      </div>
    </Phone>
  );
}
