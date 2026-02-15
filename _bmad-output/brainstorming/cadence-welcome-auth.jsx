import { useState, useEffect, useRef } from "react";

// ─── Tokens ──────────────────────────────────────────────────
const T = {
  black: "#000000", lime: "#C8FF00",
  limeDim: "rgba(200,255,0,0.12)", limeGlow: "rgba(200,255,0,0.06)",
  g1: "rgba(255,255,255,0.92)", g2: "rgba(255,255,255,0.7)",
  g3: "rgba(255,255,255,0.45)", g4: "rgba(255,255,255,0.25)",
  g5: "rgba(255,255,255,0.10)", g6: "rgba(255,255,255,0.06)",
  brd: "rgba(255,255,255,0.08)", card: "rgba(255,255,255,0.03)",
  f: "'Outfit',sans-serif", m: "'JetBrains Mono',monospace",
};

const lk = document.createElement("link");
lk.rel = "stylesheet";
lk.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(lk);
const st = document.createElement("style");
st.textContent = `
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes springUp{0%{opacity:0;transform:translateY(24px) scale(.98)}70%{transform:translateY(-3px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes slideTestimonial{0%{opacity:0;transform:translateY(10px)}8%{opacity:1;transform:translateY(0)}92%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-10px)}}
@keyframes countUp{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes pulseRing{0%{transform:scale(1);opacity:.3}100%{transform:scale(2.2);opacity:0}}
@keyframes shimmer{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
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

// ─── Video Testimonial Background (simulated) ────────────────
// In production: replace with <Video> component looping real clips
const testimonials = [
  {
    name: "Sarah M.",
    result: "1:38 half marathon",
    quote: "Cadence saw what I couldn't — I was overtraining every easy day.",
    location: "London, UK",
    weeks: 12,
  },
  {
    name: "Thomas K.",
    result: "Sub-3:15 marathon",
    quote: "The plan adapted after my knee flared up. No other app does that.",
    location: "Berlin, DE",
    weeks: 16,
  },
  {
    name: "Léa R.",
    result: "First 10K completed",
    quote: "I went from couch to 10K with a coach that actually listened.",
    location: "Lyon, FR",
    weeks: 8,
  },
  {
    name: "James O.",
    result: "PR by 4 minutes",
    quote: "The decision audit sold me. I finally understand WHY I'm doing each run.",
    location: "Austin, TX",
    weeks: 10,
  },
  {
    name: "Aiko N.",
    result: "Consistent 5x/week",
    quote: "Recovery days aren't optional anymore. My body thanks me.",
    location: "Tokyo, JP",
    weeks: 14,
  },
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = () => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % testimonials.length);
        setVisible(true);
      }, 500);
    };
    const iv = setInterval(cycle, 5000);
    return () => clearInterval(iv);
  }, []);

  const t = testimonials[idx];

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "0 36px",
    }}>
      {/* Simulated video frame — in production this is a real looping video */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: `
          radial-gradient(ellipse at 50% 40%, rgba(30,60,30,0.5) 0%, transparent 70%),
          linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 100%)
        `,
      }} />

      {/* Floating particles / ambient movement suggesting video */}
      <div style={{ position: "absolute", top: "20%", left: "15%", width: 120, height: 120, borderRadius: "50%", background: "rgba(200,255,0,0.03)", filter: "blur(40px)", animation: "shimmer 4s ease infinite" }} />
      <div style={{ position: "absolute", top: "35%", right: "10%", width: 80, height: 80, borderRadius: "50%", background: "rgba(200,255,0,0.02)", filter: "blur(30px)", animation: "shimmer 5s ease 1s infinite" }} />

      {/* Testimonial quote */}
      <div style={{
        position: "relative", zIndex: 5,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity .5s ease, transform .5s ease",
      }}>
        {/* Quote mark */}
        <div style={{ fontFamily: T.f, fontSize: 48, fontWeight: 300, color: T.lime, lineHeight: 1, marginBottom: -8, opacity: 0.4 }}>"</div>

        {/* Quote text */}
        <p style={{
          fontFamily: T.f, fontSize: 22, fontWeight: 300, color: T.g1,
          lineHeight: 1.45, letterSpacing: "-.02em", marginBottom: 20,
        }}>
          {t.quote}
        </p>

        {/* Person + result */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar placeholder */}
          <div style={{
            width: 40, height: 40, borderRadius: 20,
            background: T.limeDim, border: `1.5px solid ${T.lime}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.f, fontSize: 16, fontWeight: 600, color: T.lime,
          }}>
            {t.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: T.f, fontSize: 15, fontWeight: 500, color: T.g1 }}>{t.name}</span>
              <span style={{ fontFamily: T.m, fontSize: 10, color: T.g4 }}>{t.location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ fontFamily: T.m, fontSize: 12, fontWeight: 500, color: T.lime }}>{t.result}</span>
              <span style={{ fontFamily: T.m, fontSize: 10, color: T.g4 }}>· {t.weeks} weeks</span>
            </div>
          </div>
        </div>

        {/* Carousel dots */}
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          {testimonials.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
              background: i === idx ? T.lime : T.g5,
              transition: "all .4s cubic-bezier(.25,.46,.45,.94)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Community Counter ───────────────────────────────────────
function CommunityPulse() {
  const [count, setCount] = useState(12847);

  // Simulate live counter ticking up
  useEffect(() => {
    const iv = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 16px", borderRadius: 20,
      background: "rgba(200,255,0,0.06)",
      border: "1px solid rgba(200,255,0,0.1)",
      animation: "springUp .5s ease .3s both",
    }}>
      {/* Live pulse */}
      <div style={{ position: "relative", width: 8, height: 8 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: T.lime }} />
        <div style={{ position: "absolute", inset: -4, borderRadius: 8, border: `1px solid ${T.lime}`, animation: "pulseRing 2s ease infinite" }} />
      </div>
      <span style={{ fontFamily: T.m, fontSize: 11, fontWeight: 500, color: T.g2, letterSpacing: ".02em" }}>
        <span style={{ color: T.lime, fontWeight: 500 }}>{count.toLocaleString()}</span> runners training with Cadence
      </span>
    </div>
  );
}

// ─── OAuth Buttons (brand-compliant) ─────────────────────────
function GoogleButton({ onClick }) {
  const [p, setP] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{
        width: "100%", padding: "16px 24px", borderRadius: 14,
        border: "none", background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        cursor: "pointer",
        transform: p ? "scale(.975)" : "scale(1)",
        transition: "transform .12s ease",
        animation: "springUp .5s ease .1s both",
      }}
    >
      {/* Google "G" logo */}
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span style={{ fontFamily: T.f, fontSize: 16, fontWeight: 500, color: "#1F1F1F", letterSpacing: "-.01em" }}>Continue with Google</span>
    </button>
  );
}

function AppleButton({ onClick }) {
  const [p, setP] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{
        width: "100%", padding: "16px 24px", borderRadius: 14,
        border: `1px solid ${T.brd}`,
        background: "rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        cursor: "pointer",
        transform: p ? "scale(.975)" : "scale(1)",
        transition: "transform .12s ease",
        animation: "springUp .5s ease .2s both",
      }}
    >
      {/* Apple logo */}
      <svg width="18" height="22" viewBox="0 0 18 22" fill="white">
        <path d="M14.94 11.58c-.02-2.27 1.86-3.37 1.94-3.42-1.06-1.54-2.7-1.75-3.28-1.78-1.39-.14-2.73.82-3.44.82-.72 0-1.82-.8-3-0.78-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.87 2.29 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.41-.93-2.44-3.68l-.05-.04zM12.63 4.54c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.04-.51 2.68-1.29z"/>
      </svg>
      <span style={{ fontFamily: T.f, fontSize: 16, fontWeight: 500, color: T.g1, letterSpacing: "-.01em" }}>Continue with Apple</span>
    </button>
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WELCOME / AUTH SCREEN
// ═══════════════════════════════════════════════════════════════
export default function WelcomeAuth() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

  return (
    <Phone>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>

        {/* ─── Top half: Video testimonials area ─── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "58%", overflow: "hidden" }}>
          {/* In production: <Video source={require('./testimonials.mp4')} shouldPlay isLooping isMuted /> */}
          {/* Simulated dark forest/running background */}
          <div style={{
            position: "absolute", inset: 0,
            background: `
              radial-gradient(ellipse at 30% 30%, rgba(15,40,15,0.6) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 50%, rgba(10,30,10,0.4) 0%, transparent 50%),
              linear-gradient(160deg, #0a1a0a 0%, #0d1f0d 30%, #081408 60%, #050505 100%)
            `,
          }} />

          {/* Testimonial overlay */}
          {loaded && <TestimonialCarousel />}
        </div>

        {/* ─── Bottom sheet: Auth controls ─── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingTop: 32, paddingBottom: 44, paddingLeft: 28, paddingRight: 28,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 15%, #000 30%)",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Logo / wordmark */}
          <div style={{ marginBottom: 6, animation: "fadeIn .6s ease both" }}>
            <span style={{
              fontFamily: T.f, fontSize: 32, fontWeight: 700, color: T.g1,
              letterSpacing: "-.04em",
            }}>
              cadence
            </span>
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily: T.f, fontSize: 15, fontWeight: 300, color: T.g3,
            textAlign: "center", marginBottom: 24, letterSpacing: "-.01em",
            animation: "fadeIn .6s ease .15s both",
          }}>
            AI coaching that sees what you can't.
          </p>

          {/* Community counter */}
          <div style={{ marginBottom: 28 }}>
            <CommunityPulse />
          </div>

          {/* OAuth buttons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <GoogleButton onClick={() => console.log("Google auth")} />
            <AppleButton onClick={() => console.log("Apple auth")} />
          </div>

          {/* Legal */}
          <p style={{
            fontFamily: T.f, fontSize: 12, fontWeight: 300, color: T.g4,
            textAlign: "center", lineHeight: 1.6, maxWidth: 280,
            animation: "fadeIn .5s ease .4s both",
          }}>
            By signing in, you agree to our{" "}
            <span style={{ color: T.lime, cursor: "pointer", textDecoration: "none" }}>Terms of Service</span>
            {" "}and{" "}
            <span style={{ color: T.lime, cursor: "pointer", textDecoration: "none" }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </Phone>
  );
}
