import { useState, useEffect, useRef, useCallback } from "react";

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
lk.rel = "stylesheet";
lk.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(lk);
const st = document.createElement("style");
st.textContent = `
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes pulseGlow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes shimmer{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
@keyframes springUp{0%{opacity:0;transform:translateY(24px) scale(.98)}70%{transform:translateY(-3px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes growBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes drawLine{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
@keyframes spin{to{transform:rotate(360deg)}}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:0}input:focus,textarea:focus{outline:none}`;
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

function usePhase(times) {
  const [p, setP] = useState(0);
  useEffect(() => { const ts = times.map((ms, i) => setTimeout(() => setP(i + 1), ms)); return () => ts.forEach(clearTimeout); }, []);
  return p;
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

// ─── Cursor ──────────────────────────────────────────────────
const Cursor = () => <span style={{ display: "inline-block", width: 2, height: "1em", background: T.lime, marginLeft: 2, verticalAlign: "text-bottom", animation: "blink .8s infinite" }} />;

// ─── Streaming Text Block ────────────────────────────────────
function StreamBlock({ text, delay = 0, active = true, size = 26, color = T.g1, onDone }) {
  const s = useStream(text, 28, delay, active);
  useEffect(() => { if (s.done && onDone) onDone(); }, [s.done]);
  return (
    <p style={{ fontSize: size, fontWeight: 300, color, lineHeight: 1.4, letterSpacing: "-.02em" }}>
      {s.displayed}{!s.done && s.started && <Cursor />}
    </p>
  );
}

// ─── Button ──────────────────────────────────────────────────
function Btn({ label, onClick, ghost = false, delay = 0 }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{
        width: "100%", padding: ghost ? "14px 20px" : "18px 24px", borderRadius: 14,
        border: ghost ? `1px solid ${T.brd}` : "none",
        background: ghost ? T.card : T.lime,
        color: ghost ? T.g3 : T.black, fontFamily: T.f, fontSize: ghost ? 14 : 17,
        fontWeight: ghost ? 400 : 600, cursor: "pointer",
        transform: p ? "scale(.975)" : "scale(1)", transition: "transform .12s ease",
        animation: `springUp .5s ease ${delay}s both`, letterSpacing: "-.01em",
      }}>{label}</button>
  );
}

// ─── Progress Bar ────────────────────────────────────────────
function PBar({ pct }) {
  return (
    <div style={{ position: "absolute", top: 54, left: 28, right: 28, zIndex: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g4, letterSpacing: ".08em", textTransform: "uppercase" }}>Runner Profile</span>
        <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.lime, letterSpacing: ".05em" }}>{pct}%</span>
      </div>
      <div style={{ height: 2, background: T.g6, borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: T.lime, borderRadius: 1, transition: "width 1.2s cubic-bezier(.25,.46,.45,.94)" }} />
      </div>
    </div>
  );
}

// ─── Choice ──────────────────────────────────────────────────
function Choice({ label, desc, selected, onSelect, delay = 0, multi = false, flagged = false }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onSelect} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{
        width: "100%", padding: "16px 18px", borderRadius: 14, cursor: "pointer",
        border: `1px solid ${selected ? T.sb : flagged ? "rgba(255,90,90,.2)" : T.brd}`,
        background: selected ? T.sg : flagged ? T.redDim : T.card,
        display: "flex", alignItems: "center", gap: 14,
        animation: `springUp .45s ease ${delay}s both`,
        transform: p ? "scale(.98)" : "scale(1)", transition: "transform .1s ease, border-color .2s ease, background .2s ease",
      }}>
      <div style={{ width: 22, height: 22, borderRadius: multi ? 6 : 11, border: `1.5px solid ${selected ? T.lime : T.g4}`, background: selected ? T.lime : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s ease", flexShrink: 0 }}>
        {selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: "checkPop .25s ease" }}><path d="M2.5 6L5 8.5L9.5 3.5" stroke={T.black} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <span style={{ fontFamily: T.f, fontSize: 15, fontWeight: 500, color: selected ? T.g1 : T.g2, display: "block" }}>{label}</span>
        {desc && <span style={{ fontFamily: T.f, fontSize: 12, color: flagged ? T.red : T.g3, marginTop: 3, display: "block" }}>{desc}</span>}
      </div>
    </button>
  );
}

// ─── Badge ───────────────────────────────────────────────────
function Badge({ level = "HIGH", hasData = true }) {
  const c = { HIGH: T.lime, MODERATE: T.ora, LOW: T.red }[level] || T.g3;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: `${c}15`, border: `1px solid ${c}30`, animation: "springUp .4s ease both" }}>
      <div style={{ width: 5, height: 5, borderRadius: 3, background: c }} />
      <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: c, letterSpacing: ".06em" }}>{hasData ? "DATA" : "SELF-REPORTED"} · {level}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MINI ANALYSIS — visible processing after freeform input
// ═══════════════════════════════════════════════════════════════
function MiniAnalysis({ text, onDone }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  // Simulate analysis extraction based on the input text
  const getAnalysis = (input) => {
    const lower = input.toLowerCase();
    const results = [];
    results.push({ text: "Processing response...", type: "sys" });
    results.push({ text: "", type: "sp" });

    if (lower.includes("half") || lower.includes("marathon") || lower.includes("1:45")) {
      results.push({ text: "Race goal detected: Half Marathon", type: "extract" });
      results.push({ text: "Target time: sub-1:45", type: "extract" });
    }
    if (lower.includes("october") || lower.includes("months") || lower.includes("weeks")) {
      results.push({ text: "Timeline extracted → planning window set", type: "extract" });
    }
    if (lower.includes("baby") || lower.includes("pregnant") || lower.includes("break") || lower.includes("postpartum")) {
      results.push({ text: "⚠ Return from extended break detected", type: "flag" });
      results.push({ text: "→ Conservative ramp-up applied", type: "flag" });
    }
    if (lower.includes("knee") || lower.includes("injury") || lower.includes("hurt") || lower.includes("pain")) {
      results.push({ text: "⚠ Injury history flagged", type: "flag" });
      results.push({ text: "→ Load management constraints added", type: "flag" });
    }
    if (lower.includes("morning") || lower.includes("evening") || lower.includes("work") || lower.includes("schedule")) {
      results.push({ text: "Schedule preference noted", type: "extract" });
    }
    if (lower.includes("never") || lower.includes("first") || lower.includes("new")) {
      results.push({ text: "Experience level: beginner context", type: "extract" });
    }

    // If nothing specific was detected, generic extraction
    if (results.length <= 2) {
      results.push({ text: "Context captured: personal training background", type: "extract" });
    }

    results.push({ text: "", type: "sp" });
    results.push({ text: "Added to profile ✓", type: "done" });
    return results;
  };

  useEffect(() => {
    const analysis = getAnalysis(text);
    let i = 0;
    const add = () => {
      if (i < analysis.length) {
        const ln = analysis[i];
        setLines(p => [...p, ln]);
        i++;
        setTimeout(add, ln.type === "sp" ? 120 : ln.type === "sys" ? 400 : 280);
      } else {
        setTimeout(() => { setDone(true); if (onDone) onDone(); }, 600);
      }
    };
    setTimeout(add, 500);
  }, [text]);

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);

  const col = { sys: T.g4, extract: T.g2, flag: T.ora, done: T.lime };

  return (
    <div style={{ animation: "springUp .4s ease both" }}>
      {/* User's message */}
      <div style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${T.brd}`, background: T.card, marginBottom: 12 }}>
        <p style={{ fontFamily: T.f, fontSize: 14, color: T.g2, lineHeight: 1.5 }}>{text}</p>
      </div>
      {/* Analysis stream */}
      <div ref={ref} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${done ? T.sb : T.brd}`, background: done ? T.sg : T.card, transition: "all .4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: done ? T.lime : T.ora, animation: done ? "none" : "pulseGlow 1.5s ease infinite" }} />
          <span style={{ fontFamily: T.m, fontSize: 9, fontWeight: 500, color: T.g4, letterSpacing: ".06em", textTransform: "uppercase" }}>
            {done ? "Processed" : "Analyzing..."}
          </span>
        </div>
        <div style={{ fontFamily: T.m, fontSize: 11, lineHeight: 1.9 }}>
          {lines.map((l, i) => l.type === "sp" ? <div key={i} style={{ height: 4 }} /> : (
            <div key={i} style={{ color: col[l.type], animation: "fadeUp .2s ease both", fontWeight: l.type === "done" ? 600 : 400, fontSize: l.type === "done" ? 12 : 11 }}>
              {l.type === "flag" && <span style={{ marginRight: 4 }}>⚠</span>}
              {l.type === "done" && <span style={{ marginRight: 4 }}>✓</span>}
              {l.text}
            </div>
          ))}
          {!done && lines.length > 0 && <span style={{ display: "inline-block", width: 2, height: 12, background: T.ora, animation: "blink .8s infinite", verticalAlign: "middle" }} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FREEFORM INPUT WIDGET
// ═══════════════════════════════════════════════════════════════
function FreeformInput({ placeholder = "Type here...", pills = [], onSubmit, onPill }) {
  const [val, setVal] = useState("");
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!recording) return;
    setRecTime(0);
    const iv = setInterval(() => setRecTime(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  const handleSubmit = () => { if (val.trim()) { onSubmit?.(val.trim()); setVal(""); } };
  const handleDone = () => { setRecording(false); setVal("I've been coming back from a six-month break after having a baby."); };

  if (recording) {
    return (
      <div style={{ animation: "springUp .4s ease both" }}>
        <div style={{ padding: "20px", borderRadius: 16, border: `1px solid ${T.sb}`, background: T.sg }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: T.m, fontSize: 12, color: T.lime, letterSpacing: ".04em" }}>Listening...</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 40, marginBottom: 16 }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{
                width: 3, borderRadius: 2, background: T.lime,
                height: `${12 + Math.sin(Date.now() / 200 + i * 0.5) * 14 + Math.random() * 8}px`,
                animation: `shimmer ${0.8 + Math.random() * 0.6}s ease-in-out ${i * 0.04}s infinite`,
                transition: "height .15s ease",
              }} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: T.m, fontSize: 20, fontWeight: 500, color: T.g1 }}>{Math.floor(recTime / 60)}:{String(recTime % 60).padStart(2, "0")}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setRecording(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.g3, fontFamily: T.f, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleDone} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: T.lime, color: T.black, fontFamily: T.f, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "springUp .4s ease both" }}>
      {pills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {pills.map((p, i) => (
            <button key={i} onClick={() => onPill?.(p)} style={{
              padding: "8px 14px", borderRadius: 20, border: `1px dashed ${T.g4}`, background: "transparent",
              color: T.g3, fontFamily: T.f, fontSize: 13, cursor: "pointer", animation: `fadeIn .3s ease ${i * .06}s both`,
            }}>{p}</button>
          ))}
        </div>
      )}
      <div style={{ borderRadius: 16, border: `1px solid ${T.brd}`, background: T.card, overflow: "hidden" }}>
        <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} rows={3}
          style={{
            width: "100%", padding: "16px 18px 8px", background: "none", border: "none",
            color: T.g1, fontFamily: T.f, fontSize: 15, lineHeight: 1.55, resize: "none",
          }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px 12px" }}>
          <button onClick={() => setRecording(true)} style={{
            width: 36, height: 36, borderRadius: 10, background: T.g6, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5.5" y="1" width="5" height="9" rx="2.5" stroke={T.g3} strokeWidth="1.2" />
              <path d="M3 7.5C3 10 5.2 12 8 12C10.8 12 13 10 13 7.5" stroke={T.g3} strokeWidth="1.2" strokeLinecap="round" />
              <path d="M8 12V14.5" stroke={T.g3} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: T.m, fontSize: 10, color: T.g4 }}>{val.length}</span>
            {val.trim() && (
              <button onClick={handleSubmit} style={{
                width: 36, height: 36, borderRadius: 10, background: T.lime, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", animation: "scaleIn .2s ease both",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L13 8M13 8L9 4M13 8L9 12" stroke={T.black} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phone ───────────────────────────────────────────────────
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", zIndex: 10 }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 0: WELCOME
// ═══════════════════════════════════════════════════════════════
function Welcome({ onNext }) {
  const [rdy, setRdy] = useState(false);
  const s1 = useStream("Alex, every runner's different.", 32, 500);
  const s2 = useStream("Before I coach you, I need to know who I'm working with.", 32, 400, s1.done);
  const s3 = useStream("Mind a few questions?", 32, 600, s2.done);
  useEffect(() => { if (s3.done) setTimeout(() => setRdy(true), 400); }, [s3.done]);
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "120px 32px 48px" }}>
      <div>
        <p style={{ fontSize: 42, fontWeight: 300, color: T.g1, lineHeight: 1.18, letterSpacing: "-.03em" }}>
          <span style={{ fontWeight: 500 }}>{s1.displayed}</span>{!s1.done && s1.started && <Cursor />}
        </p>
        {s2.started && <p style={{ fontSize: 42, fontWeight: 300, color: T.g1, lineHeight: 1.18, letterSpacing: "-.03em", marginTop: 8 }}>{s2.displayed}{!s2.done && <Cursor />}</p>}
        {s3.started && <p style={{ fontSize: 42, fontWeight: 300, color: T.g2, lineHeight: 1.18, letterSpacing: "-.03em", marginTop: 24 }}>{s3.displayed}{!s3.done && <Cursor />}</p>}
      </div>
      {rdy && <Btn label="Get Started" onClick={onNext} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1: WEARABLE
// ═══════════════════════════════════════════════════════════════
function WearableScr({ onConnect, onSkip }) {
  const [ph, setPh] = useState(0);
  const s1 = useStream("I'm your running coach. I learn, I adapt, and I get better the more I know.", 28, 300);
  const s2 = useStream("Fastest way to get started — connect your watch or running app.", 28, 400, s1.done);
  useEffect(() => { if (s2.done) setTimeout(() => setPh(1), 500); }, [s2.done]);
  const provs = [{ n: "Strava", c: "#FC4C02", i: "S" }, { n: "Apple Health", c: "#FF375F", i: "♥" }, { n: "Garmin", c: "#007CC3", i: "G" }];
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 48px" }}>
      <PBar pct={5} />
      <div style={{ flex: 1, paddingTop: 24 }}>
        <p style={{ fontSize: 26, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em", marginBottom: 12 }}>{s1.displayed}{!s1.done && s1.started && <Cursor />}</p>
        {s2.started && <p style={{ fontSize: 26, fontWeight: 300, color: T.g2, lineHeight: 1.4, letterSpacing: "-.02em" }}>{s2.displayed}{!s2.done && <Cursor />}</p>}
        {ph >= 1 && <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
          {provs.map((p, i) => (
            <button key={p.n} onClick={onConnect} style={{ width: "100%", padding: "18px 20px", borderRadius: 16, border: `1px solid ${T.brd}`, background: T.card, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", animation: `springUp .45s ease ${i * .06}s both` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.c}20`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.f, fontSize: 18, fontWeight: 700, color: p.c }}>{p.i}</div>
              <span style={{ fontFamily: T.f, fontSize: 16, fontWeight: 500, color: T.g1, flex: 1, textAlign: "left" }}>{p.n}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={T.g4} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>}
      </div>
      {ph >= 1 && <button onClick={onSkip} style={{ width: "100%", padding: "16px", background: "none", border: "none", color: T.g4, fontFamily: T.f, fontSize: 14, cursor: "pointer", animation: "fadeIn .4s ease .5s both" }}>I'll do this later — ask me instead</button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2a: DATA — Thinking Stream
// ═══════════════════════════════════════════════════════════════
function ThinkingData({ onNext }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const [coach, setCoach] = useState(false);
  const ref = useRef(null);
  const all = [
    { text: "Connecting to Strava...", type: "sys" }, { text: "Found 847 activities.", type: "sys" }, { text: "Analyzing last 12 months...", type: "sys" }, { text: "", type: "sp" },
    { text: "Weekly volume: 42–48km. Consistent.", type: "dat" }, { text: "Long run average: 16.2km.", type: "dat" }, { text: "Easy pace: 5:38–5:45/km.", type: "dat" }, { text: "Tempo range: 4:50–5:05/km.", type: "dat" }, { text: "", type: "sp" },
    { text: "Rest days last month: 3. That's... not many.", type: "warn" }, { text: "Easy runs look fast — possible pacing issue.", type: "warn" }, { text: "", type: "sp" },
    { text: "No major injury gaps in last year.", type: "pos" }, { text: "Weekly consistency: top 15%.", type: "pos" }, { text: "", type: "sp" },
    { text: "Profile confidence: HIGH", type: "res" },
  ];
  useEffect(() => {
    let i = 0;
    const add = () => { if (i < all.length) { const ln = all[i]; setLines(p => [...p, ln]); i++; setTimeout(add, ln.type === "sp" ? 150 : 320); } else { setTimeout(() => setDone(true), 600); setTimeout(() => setCoach(true), 1200); } };
    setTimeout(add, 800);
  }, []);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  const col = { sys: T.g4, dat: T.g2, warn: T.red, pos: T.lime, res: T.lime };
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 48px" }}>
      <PBar pct={done ? 35 : 12} />
      <div ref={ref} style={{ flex: 1, paddingTop: 20, overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: done ? T.lime : T.ora, animation: done ? "none" : "pulseGlow 1.5s ease infinite" }} />
          <span style={{ fontFamily: T.m, fontSize: 11, fontWeight: 500, color: T.g3, letterSpacing: ".06em", textTransform: "uppercase" }}>{done ? "Analysis Complete" : "Analyzing Strava data..."}</span>
        </div>
        <div style={{ fontFamily: T.m, fontSize: 13, lineHeight: 1.8 }}>
          {lines.map((l, i) => l.type === "sp" ? <div key={i} style={{ height: 8 }} /> : <div key={i} style={{ color: col[l.type], animation: "fadeUp .25s ease both", fontWeight: l.type === "res" ? 600 : 400 }}>{l.type === "res" && "✓ "}{l.text}</div>)}
          {!done && <span style={{ display: "inline-block", width: 2, height: 16, background: T.lime, animation: "blink .8s infinite", verticalAlign: "middle" }} />}
        </div>
        {coach && <div style={{ marginTop: 28, animation: "springUp .5s ease both" }}>
          <StreamBlock text="Okay, I've got a picture forming. Let me fill in the gaps." size={22} />
          <div style={{ marginTop: 10 }}><Badge level="HIGH" hasData={true} /></div>
        </div>}
      </div>
      {coach && <Btn label="Let's go" onClick={onNext} delay={.2} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2b: NO DATA — Self-Report
// ═══════════════════════════════════════════════════════════════
function SelfReport({ onNext }) {
  const [ph, setPh] = useState(0); const [vol, setVol] = useState(null); const [freq, setFreq] = useState(null); const [lr, setLr] = useState(null);
  const s1 = useStream("No worries — I can work with what you tell me. It'll take a couple extra questions, but we'll get there.", 28, 300);
  useEffect(() => { if (s1.done) setTimeout(() => setPh(1), 500); }, [s1.done]);
  useEffect(() => { if (vol) setTimeout(() => setPh(2), 500); }, [vol]);
  useEffect(() => { if (freq) setTimeout(() => setPh(3), 500); }, [freq]);
  useEffect(() => { if (lr) setTimeout(() => setPh(4), 500); }, [lr]);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [ph]);
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 0" }}>
      <PBar pct={ph >= 4 ? 28 : 8 + ph * 5} />
      <div ref={ref} style={{ flex: 1, paddingTop: 20, overflow: "auto", paddingBottom: 24 }}>
        <p style={{ fontSize: 24, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em", marginBottom: 20 }}>{s1.displayed}{!s1.done && s1.started && <Cursor />}</p>
        {ph >= 1 && <div style={{ marginBottom: 24, animation: "springUp .5s ease both" }}><p style={{ fontSize: 18, fontWeight: 300, color: T.g2, lineHeight: 1.4, marginBottom: 12 }}>Roughly, how many kilometers in a typical week?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{[{ l: "Less than 20km", v: "lt20" }, { l: "20–40km", v: "20-40" }, { l: "40–60km", v: "40-60" }, { l: "60km+", v: "60+" }, { l: "I'm not sure", v: "?" }].map((o, i) => <Choice key={o.v} label={o.l} selected={vol === o.v} onSelect={() => setVol(o.v)} delay={i * .03} />)}</div>
        </div>}
        {ph >= 2 && <div style={{ marginBottom: 24, animation: "springUp .5s ease both" }}><p style={{ fontSize: 18, fontWeight: 300, color: T.g2, lineHeight: 1.4, marginBottom: 12 }}>How many days a week?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{["2", "3", "4", "5", "6", "7"].map((d, i) => <button key={d} onClick={() => setFreq(d)} style={{ width: 52, height: 52, borderRadius: 14, border: `1px solid ${freq === d ? T.sb : T.brd}`, background: freq === d ? T.sg : T.card, color: freq === d ? T.lime : T.g2, fontFamily: T.m, fontSize: 18, fontWeight: 500, cursor: "pointer", animation: `springUp .35s ease ${i * .04}s both` }}>{d}</button>)}</div>
        </div>}
        {ph >= 3 && <div style={{ marginBottom: 20, animation: "springUp .5s ease both" }}><p style={{ fontSize: 18, fontWeight: 300, color: T.g2, lineHeight: 1.4, marginBottom: 12 }}>Longest run in the last month?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{[{ l: "Under 10km", v: "lt10" }, { l: "10–15km", v: "10-15" }, { l: "15–20km", v: "15-20" }, { l: "20km+", v: "20+" }].map((o, i) => <Choice key={o.v} label={o.l} selected={lr === o.v} onSelect={() => setLr(o.v)} delay={i * .03} />)}</div>
        </div>}
        {ph >= 4 && <div style={{ animation: "springUp .5s ease both" }}><p style={{ fontSize: 16, fontWeight: 300, color: T.g3, lineHeight: 1.5, marginBottom: 8 }}>Good — that gives me a starting point. I'll be conservative until I learn from your first few runs.</p><Badge level="MODERATE" hasData={false} /></div>}
      </div>
      {ph >= 4 && <div style={{ padding: "16px 0 48px" }}><Btn label="Continue" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3: GOALS
// ═══════════════════════════════════════════════════════════════
function Goals({ hasData, onNext }) {
  const [ph, setPh] = useState(0); const [sel, setSel] = useState(null);
  const [freeform, setFreeform] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [freeAnalyzed, setFreeAnalyzed] = useState(false);
  const txt = hasData ? "Your training data tells me a lot — but not what you're actually working toward. What's the goal?" : "Now the big one — what are you working toward?";
  const s = useStream(txt, 28, 300);
  useEffect(() => { if (s.done) setTimeout(() => setPh(1), 400); }, [s.done]);
  useEffect(() => { if (sel && sel !== "custom") setTimeout(() => setPh(2), 600); }, [sel]);
  const opts = [{ l: "Training for a race", v: "race" }, { l: "Getting faster", v: "speed" }, { l: "Building mileage", v: "base" }, { l: "Getting back in shape", v: "return" }, { l: "General health", v: "health" }];
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [ph, freeAnalyzed]);
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 48px" }}>
      <PBar pct={hasData ? 45 : 42} />
      <div ref={ref} style={{ flex: 1, paddingTop: 24, overflow: "auto" }}>
        <div style={{ marginBottom: 20 }}><p style={{ fontSize: 26, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em" }}>{s.displayed}{!s.done && s.started && <Cursor />}</p></div>
        {ph >= 1 && !freeform && !freeText && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((o, i) => <Choice key={o.v} label={o.l} selected={sel === o.v} onSelect={() => setSel(o.v)} delay={i * .04} />)}
          <button onClick={() => setFreeform(true)} style={{ width: "100%", padding: "16px 18px", borderRadius: 14, border: `1px dashed ${T.g4}`, background: "transparent", color: T.g3, fontFamily: T.f, fontSize: 15, cursor: "pointer", animation: "springUp .45s ease .25s both", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: T.m, fontSize: 14, color: T.g4 }}>+</span> Something else — let me explain
          </button>
        </div>}
        {/* Freeform mode: input */}
        {ph >= 1 && freeform && !freeText && <div>
          <StreamBlock text="Tell me in your own words — what does success look like?" size={20} color={T.g2} />
          <div style={{ marginTop: 12 }}>
            <FreeformInput
              placeholder="e.g. I want to run a half marathon under 1:45 in October..."
              onSubmit={(val) => { setFreeText(val); setFreeform(false); }}
            />
          </div>
          <button onClick={() => setFreeform(false)} style={{ marginTop: 8, padding: "8px 0", background: "none", border: "none", color: T.g4, fontFamily: T.f, fontSize: 13, cursor: "pointer" }}>← Back to options</button>
        </div>}
        {/* Freeform submitted: MiniAnalysis */}
        {freeText && <div style={{ marginTop: 8 }}>
          <MiniAnalysis text={freeText} onDone={() => { setFreeAnalyzed(true); setSel("custom"); }} />
          {freeAnalyzed && <div style={{ marginTop: 14, animation: "springUp .4s ease both" }}>
            <StreamBlock text="Understood. That's a clear goal — I can build around that." size={17} color={T.g3} />
          </div>}
        </div>}
        {ph >= 2 && sel === "race" && <div style={{ marginTop: 20, animation: "fadeUp .5s ease both" }}>
          <StreamBlock text="Nice. Which distance?" size={20} color={T.g2} />
        </div>}
      </div>
      {sel && <Btn label="Continue" onClick={onNext} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4: HEALTH
// ═══════════════════════════════════════════════════════════════
function Health({ hasData, onNext }) {
  const [ph, setPh] = useState(0); const [inj, setInj] = useState([]); const [rec, setRec] = useState(null);
  const txt = hasData ? "Your data looks clean — no big injury gaps. But I want to hear it from you. Any past injuries?" : "Now the less fun stuff. Any past injuries that have affected your running?";
  const s = useStream(txt, 28, 300);
  useEffect(() => { if (s.done) setTimeout(() => setPh(1), 400); }, [s.done]);
  const toggle = v => { if (v === "none") { setInj(["none"]); return; } setInj(p => { const f = p.filter(x => x !== "none"); return f.includes(v) ? f.filter(x => x !== v) : [...f, v]; }); };
  useEffect(() => { if (inj.length > 0 && !inj.includes("none")) setTimeout(() => setPh(2), 500); }, [inj.length]);
  const injuries = [{ l: "Shin splints", v: "shin" }, { l: "IT band syndrome", v: "itb" }, { l: "Plantar fasciitis", v: "plantar" }, { l: "Knee pain", v: "knee" }, { l: "Achilles issues", v: "achilles" }, { l: "None — I've been lucky", v: "none" }];
  const recOpts = [{ l: "I bounce back quick", v: "quick" }, { l: "Takes a while but I get there", v: "slow" }, { l: "I tend to push through it", v: "push", flag: true, d: "🚩 coaching flag" }];
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 0" }}>
      <PBar pct={hasData ? 62 : 58} />
      <div style={{ flex: 1, paddingTop: 24, overflow: "auto", paddingBottom: 20 }}>
        <div style={{ marginBottom: 20 }}><p style={{ fontSize: 24, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em" }}>{s.displayed}{!s.done && s.started && <Cursor />}</p></div>
        {ph >= 1 && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{injuries.map((o, i) => <Choice key={o.v} label={o.l} selected={inj.includes(o.v)} onSelect={() => toggle(o.v)} delay={i * .03} multi />)}</div>}
        {ph >= 2 && <div style={{ marginTop: 24, animation: "fadeUp .5s ease both" }}>
          <StreamBlock text="When you've been hurt before, how do you typically recover?" size={20} color={T.g2} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>{recOpts.map((o, i) => <Choice key={o.v} label={o.l} desc={o.d} flagged={o.flag && rec === o.v} selected={rec === o.v} onSelect={() => setRec(o.v)} delay={i * .04} />)}</div>
          {rec === "push" && <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,90,90,.15)", background: T.redDim, animation: "fadeUp .4s ease both" }}>
            <p style={{ fontFamily: T.f, fontSize: 14, color: T.g2, lineHeight: 1.5 }}><span style={{ color: T.red, fontWeight: 500 }}>Noted.</span> That tendency is something I'll watch for. Sometimes the smartest training is knowing when not to train.</p>
          </div>}
        </div>}
      </div>
      {inj.length > 0 && <div style={{ padding: "16px 0 48px" }}><Btn label="Continue" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5: STYLE
// ═══════════════════════════════════════════════════════════════
function StyleScr({ onNext }) {
  const [ph, setPh] = useState(0); const [sty, setSty] = useState(null); const [ch, setCh] = useState(null);
  const s = useStream("Almost there. This one's about how you want me to show up.", 28, 300);
  useEffect(() => { if (s.done) setTimeout(() => setPh(1), 500); }, [s.done]);
  useEffect(() => { if (sty) setTimeout(() => setPh(2), 500); }, [sty]);
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 0" }}>
      <PBar pct={78} />
      <div style={{ flex: 1, paddingTop: 24, overflow: "auto", paddingBottom: 20 }}>
        <div style={{ marginBottom: 20 }}><p style={{ fontSize: 26, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em" }}>{s.displayed}{!s.done && s.started && <Cursor />}</p></div>
        {ph >= 1 && <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[{ l: "Tough love — push me", v: "tough" }, { l: "Encouraging — keep it positive", v: "enc" }, { l: "Analytical — give me the data", v: "ana" }, { l: "Minimalist — just tell me what to do", v: "min" }].map((o, i) => <Choice key={o.v} label={o.l} selected={sty === o.v} onSelect={() => setSty(o.v)} delay={i * .04} />)}
          </div>
        </>}
        {ph >= 2 && <div style={{ marginTop: 24, animation: "fadeUp .5s ease both" }}>
          <StreamBlock text="And what's the biggest thing holding you back right now?" size={20} color={T.g2} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {[{ l: "Consistency — I struggle to stick with it", v: "cons" }, { l: "Pacing — I always go too fast", v: "pace" }, { l: "Time — never enough", v: "time" }, { l: "I just feel stuck", v: "stuck" }].map((o, i) => <Choice key={o.v} label={o.l} selected={ch === o.v} onSelect={() => setCh(o.v)} delay={i * .04} />)}
          </div>
        </div>}
      </div>
      {ch && <div style={{ padding: "0 0 48px" }}><Btn label="Continue" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6: OPEN QUESTION — "Anything else?"
// ═══════════════════════════════════════════════════════════════
function OpenQuestion({ onNext }) {
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [coachDone, setCoachDone] = useState(false);
  const s = useStream("Last thing. Anything else you want me to know?", 28, 300);
  const [rdy, setRdy] = useState(false);
  useEffect(() => { if (s.done) setTimeout(() => setRdy(true), 400); }, [s.done]);

  const handleSubmit = (val) => { setAnswer(val); setSubmitted(true); };
  const handlePill = (p) => { setAnswer(p); setSubmitted(true); if (p === "No, I think that covers it") setAnalyzed(true); };

  const isSkip = answer === "No, I think that covers it";
  const isMore = answer === "Actually, one more thing...";
  const isCustom = submitted && !isSkip && !isMore;

  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "82px 32px 48px" }}>
      <PBar pct={88} />
      <div style={{ flex: 1, paddingTop: 24, overflow: "auto" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 26, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em" }}>{s.displayed}{!s.done && s.started && <Cursor />}</p>
        </div>
        {rdy && !submitted && (
          <FreeformInput
            placeholder="Training context, life constraints, past coaching experiences..."
            pills={["No, I think that covers it", "Actually, one more thing..."]}
            onSubmit={handleSubmit}
            onPill={handlePill}
          />
        )}
        {/* Custom text → run MiniAnalysis */}
        {isCustom && (
          <div>
            <MiniAnalysis text={answer} onDone={() => setAnalyzed(true)} />
            {analyzed && <div style={{ marginTop: 16, animation: "springUp .4s ease both" }}>
              <StreamBlock text="Good — that changes a few things. I'll factor it into the plan." size={17} color={T.g3} onDone={() => setCoachDone(true)} />
            </div>}
          </div>
        )}
        {/* Quick skip */}
        {isSkip && (
          <div style={{ animation: "springUp .4s ease both" }}>
            <StreamBlock text="Perfect. I've got everything I need." size={20} color={T.g2} onDone={() => setCoachDone(true)} />
          </div>
        )}
        {/* "One more thing" → show freeform again */}
        {isMore && !submitted && (
          <FreeformInput
            placeholder="Go ahead..."
            pills={[]}
            onSubmit={(val) => { setAnswer(val); }}
          />
        )}
      </div>
      {(isSkip || (isCustom && analyzed && coachDone)) && <Btn label="Generate my plan" onClick={onNext} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7: TRANSITION
// ═══════════════════════════════════════════════════════════════
function TransitionScr({ onDone }) {
  const [spin, setSpin] = useState(false);
  const s1 = useStream("Okay. I believe I have what I need to draft your game plan.", 30, 500);
  const s2 = useStream("Give me a second to put this together...", 30, 400, s1.done);
  useEffect(() => { if (s2.done) setTimeout(() => setSpin(true), 600); }, [s2.done]);
  useEffect(() => { if (spin) setTimeout(onDone, 2500); }, [spin]);
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "82px 32px 48px", textAlign: "center" }}>
      <PBar pct={100} />
      <div style={{ maxWidth: 300 }}>
        <p style={{ fontSize: 28, fontWeight: 300, color: T.g1, lineHeight: 1.35, letterSpacing: "-.02em", marginBottom: 16 }}>{s1.displayed}{!s1.done && s1.started && <Cursor />}</p>
        {s2.started && <p style={{ fontSize: 22, fontWeight: 300, color: T.g3, lineHeight: 1.35 }}>{s2.displayed}{!s2.done && <Cursor />}</p>}
        {spin && <div style={{ marginTop: 40, display: "flex", justifyContent: "center", animation: "fadeIn .5s ease both" }}><div style={{ width: 48, height: 48, borderRadius: 24, border: `2px solid ${T.g6}`, borderTopColor: T.lime, animation: "spin 1s linear infinite" }} /></div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8: RADAR CHART
// ═══════════════════════════════════════════════════════════════
function RadarSVG({ data, size = 250 }) {
  const [pr, setPr] = useState(0);
  const cx = size / 2, r = size / 2 - 32, n = data.length;
  useEffect(() => { let s = null; const tick = ts => { if (!s) s = ts; const p = Math.min((ts - s) / 1400, 1); setPr(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(tick); }; setTimeout(() => requestAnimationFrame(tick), 400); }, []);
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const rr = (v / 100) * r * pr; return { x: cx + rr * Math.cos(a), y: cx + rr * Math.sin(a) }; };
  const pts = data.map((d, i) => pt(i, d.value));
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[25, 50, 75, 100].map(rv => { const pp = Array.from({ length: n }).map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const rr = (rv / 100) * r; return `${cx + rr * Math.cos(a)},${cx + rr * Math.sin(a)}`; }); return <polygon key={rv} points={pp.join(" ")} fill="none" stroke={T.g6} strokeWidth=".5" />; })}
        {data.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return <line key={i} x1={cx} y1={cx} x2={cx + r * Math.cos(a)} y2={cx + r * Math.sin(a)} stroke={T.g6} strokeWidth=".5" />; })}
        <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(200,255,0,.07)" stroke={T.lime} strokeWidth="1.5" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={data[i].value < 50 ? T.red : data[i].uncertain ? T.ora : T.lime} stroke={T.black} strokeWidth="1.5" />)}
      </svg>
      {data.map((d, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const x = cx + (r + 24) * Math.cos(a), y = cx + (r + 24) * Math.sin(a); return (
        <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", textAlign: "center", animation: `fadeIn .4s ease ${.8 + i * .08}s both` }}>
          <span style={{ fontFamily: T.m, fontSize: 9, fontWeight: 500, color: d.value < 50 ? T.red : d.uncertain ? T.ora : T.g3, letterSpacing: ".04em", textTransform: "uppercase", display: "block", whiteSpace: "nowrap" }}>{d.label}</span>
          <span style={{ fontFamily: T.m, fontSize: 13, fontWeight: 500, color: d.value < 50 ? T.red : d.uncertain ? T.ora : T.g1 }}>{Math.round(d.value * pr)}{d.uncertain ? "?" : ""}</span>
        </div>
      ); })}
    </div>
  );
}

function RadarScreen({ hasData, onNext }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 2200); }, []);
  const dD = [{ label: "Endurance", value: 75 }, { label: "Speed", value: 65 }, { label: "Recovery", value: 40 }, { label: "Consistency", value: 85 }, { label: "Injury Risk", value: 55 }, { label: "Race Ready", value: 50 }];
  const nD = [{ label: "Endurance", value: 70, uncertain: true }, { label: "Speed", value: 55, uncertain: true }, { label: "Recovery", value: 50, uncertain: true }, { label: "Consistency", value: 75 }, { label: "Injury Risk", value: 50, uncertain: true }, { label: "Race Ready", value: 45 }];
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "70px 0 0" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, animation: "fadeIn .4s ease both" }}>
          <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g3, letterSpacing: ".08em", textTransform: "uppercase" }}>Your Runner Profile</span>
          <Badge level={hasData ? "HIGH" : "MODERATE"} hasData={hasData} />
        </div>
        <RadarSVG data={hasData ? dD : nD} />
        {show && <div style={{ marginTop: 24, animation: "springUp .5s ease both" }}>
          {hasData ? <StreamBlock text="Strong consistency and endurance base. Recovery discipline is where we'll focus. By race day, this chart should look different." size={17} color={T.g2} />
            : <><StreamBlock text="The orange markers are estimates — they'll sharpen after your first week of logged runs." size={17} color={T.g2} />
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: T.oraDim, border: "1px solid rgba(255,138,0,.15)", animation: "fadeIn .4s ease .8s both" }}><p style={{ fontFamily: T.m, fontSize: 11, color: T.ora, letterSpacing: ".03em", lineHeight: 1.5 }}>ℹ Connect a wearable anytime in Settings for GPS-accurate data.</p></div></>}
        </div>}
      </div>
      {show && <div style={{ padding: "16px 32px 48px" }}><Btn label="See the volume plan" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 9: PROGRESSION CHART
// ═══════════════════════════════════════════════════════════════
function ProgressionScreen({ hasData, onNext }) {
  const [anim, setAnim] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 400); setTimeout(() => setShow(true), 2200); }, []);
  const data = [
    { w: 1, vol: 45, int: 65 }, { w: 2, vol: 48, int: 68 }, { w: 3, vol: 52, int: 70 }, { w: 4, vol: 48, int: 65 },
    { w: 5, vol: 55, int: 75 }, { w: 6, vol: 58, int: 78 }, { w: 7, vol: 55, int: 72 }, { w: 8, vol: 52, int: 85 },
    { w: 9, vol: 45, int: 80 }, { w: 10, vol: 30, int: 60 },
  ];
  const rWeeks = [4, 7, 10];
  const maxV = 68, cW = 310, cH = 160, bW = 22;
  const xS = cW / data.length;
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "70px 0 0" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", marginBottom: 16, animation: "fadeIn .4s ease both" }}>
          <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g3, letterSpacing: ".08em", textTransform: "uppercase" }}>10-Week Volume Plan</span>
          <span style={{ fontFamily: T.m, fontSize: 10, color: T.g4 }}>km/week</span>
        </div>
        <div style={{ padding: "0 6px" }}>
          <svg width="100%" height={cH + 40} viewBox={`0 0 ${cW} ${cH + 40}`} preserveAspectRatio="none">
            {[0, .25, .5, .75, 1].map(p => <line key={p} x1={0} y1={cH * (1 - p)} x2={cW} y2={cH * (1 - p)} stroke={T.g6} strokeWidth=".5" />)}
            {data.map((d, i) => {
              const bH = (d.vol / maxV) * cH, x = i * xS + (xS - bW) / 2, y = cH - bH, isR = rWeeks.includes(d.w);
              return (
                <g key={i}>
                  <rect x={x} y={y} width={bW} height={bH} rx={4} fill={isR ? T.bluDim : T.limeDim} stroke={isR ? T.blu : "rgba(200,255,0,.25)"} strokeWidth=".5"
                    style={{ transformOrigin: `${x + bW / 2}px ${cH}px`, animation: anim ? `growBar .6s ease ${i * .08}s both` : "none" }} />
                  {Array.from({ length: Math.floor(bH / 6) }).map((_, li) => <line key={li} x1={x + 2} y1={y + li * 6 + 3} x2={x + bW - 2} y2={y + li * 6 + 3} stroke={isR ? "rgba(91,158,255,.15)" : "rgba(200,255,0,.1)"} strokeWidth="1" style={{ animation: anim ? `fadeIn .3s ease ${i * .08 + .3}s both` : "none" }} />)}
                </g>
              );
            })}
            {anim && <polyline points={data.map((d, i) => `${i * xS + xS / 2},${cH - (d.int / 100) * cH}`).join(" ")} fill="none" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset="0" style={{ animation: "drawLine 1.2s ease .5s both" }} />}
            {anim && data.map((d, i) => <circle key={i} cx={i * xS + xS / 2} cy={cH - (d.int / 100) * cH} r={3} fill={T.lime} stroke={T.black} strokeWidth="1.5" style={{ animation: `fadeIn .3s ease ${.8 + i * .06}s both` }} />)}
            {data.map((d, i) => {
              const isR = rWeeks.includes(d.w);
              return (
                <g key={`l-${i}`}>
                  <text x={i * xS + xS / 2} y={cH + 16} textAnchor="middle" fill={isR ? T.blu : T.g4} fontFamily={T.m} fontSize="9" fontWeight="500">W{d.w}</text>
                  {isR && <text x={i * xS + xS / 2} y={cH + 28} textAnchor="middle" fill={T.blu} fontFamily={T.m} fontSize="7" fontWeight="500">{d.w === 10 ? "Race" : "Recovery"}</text>}
                </g>
              );
            })}
          </svg>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, animation: "fadeIn .4s ease 1s both" }}>
            {[{ c: T.limeDim, b: "rgba(200,255,0,.25)", l: "VOLUME" }, { c: T.lime, l: "INTENSITY", line: true }, { c: T.bluDim, b: "rgba(91,158,255,.25)", l: "RECOVERY" }].map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {g.line ? <div style={{ width: 10, height: 2, borderRadius: 1, background: g.c }} /> : <div style={{ width: 10, height: 10, borderRadius: 2, background: g.c, border: `1px solid ${g.b}` }} />}
                <span style={{ fontFamily: T.m, fontSize: 9, color: T.g3, letterSpacing: ".04em" }}>{g.l}</span>
              </div>
            ))}
          </div>
        </div>
        {show && <div style={{ padding: "0 12px", marginTop: 20, animation: "springUp .5s ease both" }}>
          <StreamBlock text={hasData
            ? "See those dips at weeks 4 and 7? Those are deliberate. Your body adapts during recovery, not during training. We build, we rest, we build higher."
            : "This plan starts conservative since I'm working from estimates. If you're adapting well, I'll ramp volume faster after week 3."
          } size={17} color={T.g2} />
        </div>}
      </div>
      {show && <div style={{ padding: "16px 32px 48px" }}><Btn label="See your weekly structure" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 10: CALENDAR WIDGET
// ═══════════════════════════════════════════════════════════════
function CalendarScreen({ onNext }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 1200); }, []);
  const sessions = [
    { day: "Mon", type: "Tempo", dur: "50m" }, { day: "Tue", type: "Easy", dur: "40m" }, { day: "Wed", type: "Intervals", dur: "55m" },
    { day: "Thu", type: "Rest", dur: "—" }, { day: "Fri", type: "Easy", dur: "35m" }, { day: "Sat", type: "Rest", dur: "—" }, { day: "Sun", type: "Long Run", dur: "90m" },
  ];
  const key = ["Mon", "Wed", "Sun"];
  const col = { Tempo: T.lime, Intervals: T.lime, "Long Run": T.lime, Easy: T.g3, Rest: T.g4 };
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "70px 0 0" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px" }}>
        <div style={{ padding: "0 8px", marginBottom: 16, animation: "fadeIn .4s ease both" }}>
          <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g3, letterSpacing: ".08em", textTransform: "uppercase" }}>Typical Week — Build Phase</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} style={{ textAlign: "center", padding: "6px 0", fontFamily: T.m, fontSize: 9, fontWeight: 500, color: T.g4, letterSpacing: ".06em" }}>{d}</div>)}
          {sessions.map((s, i) => {
            const isKey = key.includes(s.day);
            const isRest = s.type === "Rest";
            return (
              <div key={i} style={{ padding: "8px 4px", borderRadius: 10, border: `1px solid ${isKey ? "rgba(200,255,0,.3)" : T.brd}`, background: isRest ? "transparent" : isKey ? T.limeDim : T.card, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minHeight: 72, animation: `scaleIn .3s ease ${i * .04}s both` }}>
                {isKey && <div style={{ width: 4, height: 4, borderRadius: 2, background: T.lime, marginBottom: 1 }} />}
                <span style={{ fontFamily: T.f, fontSize: 10, fontWeight: isRest ? 400 : 600, color: isRest ? T.g4 : col[s.type] || T.g3, marginTop: isRest ? 14 : 0 }}>{s.type}</span>
                {!isRest && <span style={{ fontFamily: T.m, fontSize: 8, color: T.g4 }}>{s.dur}</span>}
              </div>
            );
          })}
        </div>
        {show && <div style={{ padding: "0 8px", marginTop: 24, animation: "springUp .5s ease both" }}>
          <StreamBlock text="Three key sessions: Monday tempo, Wednesday intervals, Sunday long run. The rest is recovery. And yes — two actual rest days. Non-negotiable." size={17} color={T.g2} />
        </div>}
      </div>
      {show && <div style={{ padding: "16px 32px 48px" }}><Btn label="See projections" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 11: VERDICT
// ═══════════════════════════════════════════════════════════════
function Verdict({ hasData, onNext }) {
  const ph = usePhase([400, 2200, 3800, 5000]);
  const decisions = [
    { q: "Why 8% volume cap instead of 10%?", a: "Shin splint history + \"push through\" recovery = higher risk. Conservative loading." },
    { q: "Why two rest days?", a: "Only 3 rest days last month = recovery debt. One isn't enough." },
    { q: "Why slow down easy pace?", a: "Current 5:40 is above aerobic threshold. True recovery requires actually recovering." },
  ];
  const [exp, setExp] = useState(null);
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "70px 0 0" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "0 32px" }}>
        {ph >= 1 && <div style={{ marginBottom: 24, animation: "springUp .5s ease both" }}>
          <StreamBlock text={hasData ? "So here's where I think you land." : "Based on what you've told me, here's my best estimate."} size={22} />
        </div>}
        {ph >= 2 && <div style={{ padding: "24px", borderRadius: 18, border: `1px solid ${hasData ? T.sb : "rgba(255,138,0,.3)"}`, background: hasData ? T.sg : T.oraDim, marginBottom: 24, textAlign: "center", animation: "scaleIn .5s ease both" }}>
          <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g3, letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>{hasData ? "Projected Finish" : "Estimated Range"}</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
            <span style={{ fontFamily: T.m, fontSize: 42, fontWeight: 500, color: hasData ? T.lime : T.ora, letterSpacing: "-.03em" }}>{hasData ? "1:43" : "1:40"}</span>
            <span style={{ fontFamily: T.m, fontSize: 20, fontWeight: 300, color: T.g3 }}>–</span>
            <span style={{ fontFamily: T.m, fontSize: 42, fontWeight: 500, color: hasData ? T.lime : T.ora, letterSpacing: "-.03em" }}>{hasData ? "1:46" : "1:52"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
            <div><span style={{ fontFamily: T.m, fontSize: 9, color: T.g4, letterSpacing: ".06em", display: "block" }}>CONFIDENCE</span><span style={{ fontFamily: T.m, fontSize: 14, color: hasData ? T.lime : T.ora, fontWeight: 500 }}>{hasData ? "75%" : "50%"}</span></div>
            <div style={{ width: 1, background: T.brd }} />
            <div><span style={{ fontFamily: T.m, fontSize: 9, color: T.g4, letterSpacing: ".06em", display: "block" }}>RANGE</span><span style={{ fontFamily: T.m, fontSize: 14, color: T.g1, fontWeight: 500 }}>{hasData ? "±90s" : "±6 min"}</span></div>
          </div>
          {!hasData && <p style={{ fontFamily: T.f, fontSize: 12, color: T.g4, marginTop: 14, lineHeight: 1.4 }}>This range is wide on purpose — it'll narrow after your first training week.</p>}
        </div>}
        {ph >= 3 && <div style={{ animation: "springUp .5s ease both" }}>
          <StreamBlock text={hasData ? "The sub-1:45 isn't the ceiling — it's the floor." : "The first two weeks are calibration. After that, I'll know you."} size={16} color={T.g3} />
        </div>}
        {ph >= 4 && hasData && <div style={{ marginTop: 20, animation: "springUp .5s ease both" }}>
          <span style={{ fontFamily: T.m, fontSize: 10, fontWeight: 500, color: T.g3, letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Decision Audit</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {decisions.map((d, i) => (
              <div key={i} style={{ borderRadius: 12, border: `1px solid ${exp === i ? T.sb : T.brd}`, background: exp === i ? T.limeGlow : T.card, overflow: "hidden", animation: `scaleIn .3s ease ${i * .06}s both` }}>
                <button onClick={() => setExp(exp === i ? null : i)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                  <span style={{ fontFamily: T.m, fontSize: 11, fontWeight: 500, color: exp === i ? T.lime : T.g4, transition: "transform .2s ease", transform: exp === i ? "rotate(90deg)" : "rotate(0)", display: "inline-block" }}>▸</span>
                  <span style={{ fontFamily: T.f, fontSize: 14, fontWeight: 500, color: T.g1, flex: 1 }}>{d.q}</span>
                </button>
                {exp === i && <div style={{ padding: "0 16px 14px 40px", animation: "fadeIn .25s ease both" }}><p style={{ fontFamily: T.f, fontSize: 13, color: T.g3, lineHeight: 1.55 }}>{d.a}</p></div>}
              </div>
            ))}
          </div>
        </div>}
      </div>
      {ph >= 3 && <div style={{ padding: "16px 32px 48px" }}><Btn label="Continue" onClick={onNext} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 12: PAYWALL
// ═══════════════════════════════════════════════════════════════
function PaywallScr({ hasData, onNext }) {
  const [ph, setPh] = useState(0);
  const s1 = useStream("The plan's ready. The coaching is ready.", 30, 300);
  const s2 = useStream("To unlock everything, start your free trial.", 30, 400, s1.done);
  useEffect(() => { if (s2.done) setTimeout(() => setPh(1), 500); }, [s2.done]);
  const feats = hasData
    ? [{ i: "📋", t: "Full plan through race day" }, { i: "🔄", t: "Daily adaptive sessions" }, { i: "🧠", t: "Visible reasoning for every decision" }, { i: "⚙️", t: "Unlimited plan adjustments" }]
    : [{ i: "📋", t: "Full plan through race day" }, { i: "🔄", t: "Sessions that adapt as you log runs" }, { i: "📡", t: "Connect wearable for deeper insights" }, { i: "🧠", t: "See why every decision was made" }];
  return (
    <div style={{ width: "100%", height: "100%", background: T.black, display: "flex", flexDirection: "column", padding: "70px 32px 40px" }}>
      <div style={{ flex: 1, paddingTop: 16 }}>
        <p style={{ fontSize: 26, fontWeight: 300, color: T.g1, lineHeight: 1.4, letterSpacing: "-.02em", marginBottom: 8 }}>{s1.displayed}{!s1.done && s1.started && <Cursor />}</p>
        {s2.started && <p style={{ fontSize: 26, fontWeight: 300, color: T.g2, lineHeight: 1.4, letterSpacing: "-.02em" }}>{s2.displayed}{!s2.done && <Cursor />}</p>}
        {ph >= 1 && <div style={{ marginTop: 32, padding: "28px 24px", borderRadius: 20, border: `1px solid ${T.sb}`, background: `linear-gradient(180deg,${T.sg} 0%,${T.black} 100%)`, animation: "scaleIn .5s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: T.limeDim, marginBottom: 20 }}><span style={{ fontFamily: T.m, fontSize: 11, fontWeight: 500, color: T.lime, letterSpacing: ".04em" }}>7-DAY FREE TRIAL</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>{feats.map((f, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, animation: `slideInRight .35s ease ${.1 + i * .06}s both` }}><div style={{ width: 36, height: 36, borderRadius: 10, background: T.g6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.i}</div><span style={{ fontFamily: T.f, fontSize: 15, fontWeight: 400, color: T.g1 }}>{f.t}</span></div>)}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}><span style={{ fontFamily: T.m, fontSize: 32, fontWeight: 500, color: T.g1, letterSpacing: "-.02em" }}>€9.99</span><span style={{ fontFamily: T.f, fontSize: 14, color: T.g4 }}>/month after trial</span></div>
          <p style={{ fontFamily: T.f, fontSize: 12, color: T.g4 }}>Cancel anytime.</p>
        </div>}
      </div>
      {ph >= 1 && <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "springUp .4s ease .3s both" }}>
        <Btn label="Start Free Trial" onClick={onNext} />
        <button onClick={onNext} style={{ width: "100%", padding: "14px", background: "none", border: "none", color: T.g4, fontFamily: T.f, fontSize: 14, cursor: "pointer" }}>Maybe later</button>
      </div>}
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────
function PathTag({ hasData }) {
  return (
    <div style={{ position: "absolute", top: 58, right: 28, zIndex: 200, padding: "4px 10px", borderRadius: 8, background: hasData ? T.limeDim : T.oraDim, border: `1px solid ${hasData ? "rgba(200,255,0,.2)" : "rgba(255,138,0,.2)"}` }}>
      <span style={{ fontFamily: T.m, fontSize: 9, fontWeight: 500, color: hasData ? T.lime : T.ora, letterSpacing: ".04em" }}>{hasData ? "▲ DATA" : "◇ NO DATA"}</span>
    </div>
  );
}
function Dots({ current, total }) {
  return (
    <div style={{ position: "absolute", bottom: 10, left: 16, right: 16, display: "flex", justifyContent: "center", gap: 5, zIndex: 200, padding: "6px 12px", borderRadius: 20, background: "rgba(255,255,255,.03)", backdropFilter: "blur(12px)" }}>
      {Array.from({ length: total }).map((_, i) => <div key={i} style={{ width: i === current ? 20 : 5, height: 5, borderRadius: 3, background: i === current ? T.lime : i < current ? T.g4 : T.g6, transition: "all .5s cubic-bezier(.25,.46,.45,.94)" }} />)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// Flow: Welcome → Wearable → Analysis/SelfReport → Goals → Health → Style → OpenQuestion → Transition → Radar → Progression → Calendar → Verdict → Paywall
// ═══════════════════════════════════════════════════════════════
export default function CadenceOnboarding() {
  const [scr, setScr] = useState(0);
  const [hasData, setHasData] = useState(null);
  const [fade, setFade] = useState(false);
  const go = useCallback((n) => { setFade(true); setTimeout(() => { setScr(n); setFade(false); }, 280); }, []);

  const render = () => {
    switch (scr) {
      case 0: return <Welcome onNext={() => go(1)} />;
      case 1: return <WearableScr onConnect={() => { setHasData(true); go(2); }} onSkip={() => { setHasData(false); go(2); }} />;
      case 2: return hasData ? <ThinkingData onNext={() => go(3)} /> : <SelfReport onNext={() => go(3)} />;
      case 3: return <Goals hasData={hasData} onNext={() => go(4)} />;
      case 4: return <Health hasData={hasData} onNext={() => go(5)} />;
      case 5: return <StyleScr onNext={() => go(6)} />;
      case 6: return <OpenQuestion onNext={() => go(7)} />;
      case 7: return <TransitionScr onDone={() => go(8)} />;
      case 8: return <RadarScreen hasData={hasData} onNext={() => go(9)} />;
      case 9: return <ProgressionScreen hasData={hasData} onNext={() => go(10)} />;
      case 10: return <CalendarScreen onNext={() => go(11)} />;
      case 11: return <Verdict hasData={hasData} onNext={() => go(12)} />;
      case 12: return <PaywallScr hasData={hasData} onNext={() => { setHasData(null); go(0); }} />;
      default: return null;
    }
  };

  return (
    <Phone>
      <div style={{ width: "100%", height: "100%", opacity: fade ? 0 : 1, transition: "opacity .28s ease" }}>{render()}</div>
      {scr > 1 && hasData !== null && <PathTag hasData={hasData} />}
      <Dots current={scr} total={13} />
    </Phone>
  );
}
