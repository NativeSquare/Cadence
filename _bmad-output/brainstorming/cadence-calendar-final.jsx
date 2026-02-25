import { useState, useEffect, useRef, useCallback } from "react";

const T = {
  black: "#000000", lime: "#C8FF00",
  g1: "rgba(255,255,255,0.92)", g2: "rgba(255,255,255,0.7)",
  g3: "rgba(255,255,255,0.45)", g4: "rgba(255,255,255,0.25)",
  g5: "rgba(255,255,255,0.10)",
  brd: "rgba(255,255,255,0.08)", card: "rgba(255,255,255,0.03)",
  w1: "#FFFFFF", w2: "#F8F8F6", w3: "#EEEEEC",
  wText: "#1A1A1A", wSub: "#5C5C5C", wMute: "#A3A3A0", wBrd: "rgba(0,0,0,.06)",
  barHigh: "#A8D900", barEasy: "#7CB342", barRest: "#5B9EFF",
  red: "#FF5A5A", ora: "#FF9500",
  // Calendar session type colors
  easy: "#7CB342",      // Green - Easy runs
  specific: "#FF9500",  // Amber - Tempo, Intervals, Specific work
  long: "#5B9EFF",      // Blue - Long runs
  race: "#FF5A5A",      // Red - Race day
  f: "'Outfit',sans-serif",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes pulseGlow{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
@keyframes dotPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.3);opacity:1}}
@keyframes msgIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes waveform{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes typingDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
@keyframes fabIn{from{opacity:0;transform:scale(.7) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes detailSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes detailSlideDown{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes sessionFadeIn{from{opacity:0}to{opacity:1}}
@keyframes sessionFadeOut{from{opacity:1}to{opacity:0}}
@keyframes timerPulse{0%,100%{opacity:.3}50%{opacity:.8}}
@keyframes segmentSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes splitReveal{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes hrPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes debriefIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes celebCheck{0%{transform:scale(0) rotate(-20deg);opacity:0}50%{transform:scale(1.2) rotate(5deg);opacity:1}70%{transform:scale(.95) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
@keyframes celebRing{0%{transform:scale(.3);opacity:0;stroke-dashoffset:220}40%{opacity:1}100%{transform:scale(1);opacity:0;stroke-dashoffset:0}}
@keyframes celebRing2{0%{transform:scale(.5);opacity:0}30%{opacity:.6}100%{transform:scale(1.8);opacity:0}}
@keyframes celebText{0%{opacity:0;transform:translateY(16px)}50%{opacity:0}100%{opacity:1;transform:translateY(0)}}
@keyframes celebFadeOut{0%{opacity:1}100%{opacity:0}}
@keyframes springUp{0%{opacity:0;transform:translateY(24px) scale(.98)}70%{transform:translateY(-3px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes calFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes calBlockIn{from{opacity:0;transform:scaleX(0.3)}to{opacity:1;transform:scaleX(1)}}
@keyframes todayGlow{0%,100%{box-shadow:0 0 6px rgba(200,255,0,.2)}50%{box-shadow:0 0 16px rgba(200,255,0,.55)}}
@keyframes todayBlink{0%,100%{opacity:.6;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}
*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:0}input:focus,textarea:focus{outline:none}
`;

function useStyles(){
  useEffect(()=>{
    if(document.getElementById("cad-css"))return;
    const s=document.createElement("style");
    s.id="cad-css";s.textContent=CSS;
    document.head.appendChild(s);
    return()=>{};
  },[]);
}

function useStream(text,speed=28,delay=0,active=true){
  const[d,setD]=useState("");const[done,setDone]=useState(false);const[on,setOn]=useState(false);
  useEffect(()=>{if(!active){setD("");setDone(false);setOn(false);return;}setD("");setDone(false);const t=setTimeout(()=>setOn(true),delay);return()=>clearTimeout(t);},[active,text,delay]);
  useEffect(()=>{if(!on||!active)return;let i=0;const iv=setInterval(()=>{if(i<text.length){setD(text.slice(0,i+1));i++;}else{clearInterval(iv);setDone(true);}},speed);return()=>clearInterval(iv);},[on,active,text,speed]);
  return{displayed:d,done,started:on};
}

function Grain(){
  const r=useRef(null);
  useEffect(()=>{const c=r.current;if(!c)return;const x=c.getContext("2d");c.width=200;c.height=200;const d=x.createImageData(200,200);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=8;}x.putImageData(d,0,0);},[]);
  return <canvas ref={r} style={{position:"absolute",top:0,left:0,right:0,height:80,pointerEvents:"none",zIndex:50,opacity:.3,mixBlendMode:"overlay"}}/>;
}

const Blink=({c=T.black})=><span style={{display:"inline-block",width:2,height:"1em",background:c,marginLeft:2,verticalAlign:"text-bottom",animation:"blink .8s infinite"}}/>;

function Phone({children}){
  return(
    <div style={{width:"100%",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#050505",padding:20,fontFamily:T.f}}>
      <div style={{width:390,height:844,background:T.black,borderRadius:48,overflow:"hidden",position:"relative",border:"1px solid rgba(255,255,255,.06)",boxShadow:"0 0 100px rgba(0,0,0,.9)"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",zIndex:100}}>
          <span style={{fontSize:15,fontWeight:600,color:T.g1}}>9:41</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0" y="6" width="3" height="6" rx="1" fill={T.g1}/><rect x="4.5" y="4" width="3" height="8" rx="1" fill={T.g1}/><rect x="9" y="1.5" width="3" height="10.5" rx="1" fill={T.g1}/><rect x="13" y="0" width="3" height="12" rx="1" fill={T.g3}/></svg>
            <div style={{width:24,height:11,borderRadius:3,border:"1px solid "+T.g3,padding:1.5}}><div style={{width:"70%",height:"100%",borderRadius:1.5,background:T.g1}}/></div>
          </div>
        </div>
        <Grain/>
        <div style={{position:"absolute",inset:0,overflow:"hidden",zIndex:10}}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PLAN DATA
// ═══════════════════════════════════════
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DATES=[17,18,19,20,21,22,23];
const TODAY=3;
const PLAN=[
  {type:"Tempo",km:"8.5",dur:"48min",done:true,intensity:"high",desc:"4x2km @ 4:55 with 90s recovery",zone:"Z4",
    segments:[{name:"Warm Up",km:"1.5",pace:"6:00",zone:"Z2"},{name:"Tempo Block 1",km:"2.0",pace:"4:55",zone:"Z4"},{name:"Recovery",km:"0.4",pace:"6:30",zone:"Z1"},{name:"Tempo Block 2",km:"2.0",pace:"4:55",zone:"Z4"},{name:"Recovery",km:"0.4",pace:"6:30",zone:"Z1"},{name:"Cool Down",km:"2.2",pace:"6:15",zone:"Z2"}],
    coachNote:"Solid tempo session. Focus on even splits across both blocks. Don't chase pace on the first rep - trust the rhythm and let the second block match naturally."
  },
  {type:"Easy Run",km:"6.0",dur:"36min",done:true,intensity:"low",desc:"Recovery pace, conversational",zone:"Z2",
    segments:[{name:"Easy Run",km:"6.0",pace:"6:00",zone:"Z2"}],
    coachNote:"Keep it truly easy. If you can't hold a conversation, you're going too fast. This run is about blood flow and recovery."
  },
  {type:"Intervals",km:"10.2",dur:"55min",done:true,intensity:"high",desc:"8x800m @ 4:30 with 400m jog",zone:"Z4-5",
    segments:[{name:"Warm Up",km:"1.6",pace:"6:00",zone:"Z2"},{name:"8x800m Intervals",km:"6.4",pace:"4:30",zone:"Z4-5"},{name:"400m Jog Recovery",km:"0.4",pace:"7:00",zone:"Z1"},{name:"Cool Down",km:"1.8",pace:"6:15",zone:"Z2"}],
    coachNote:"These 800s are about speed endurance. Hit 4:30 pace but don't go faster. The jog recoveries should feel easy - walk if you need to."
  },
  {type:"Easy Run",km:"7.0",dur:"42min",done:false,intensity:"low",desc:"Conversation pace, flat route",zone:"Z2",today:true,
    segments:[{name:"Easy Run",km:"7.0",pace:"6:00",zone:"Z2"}],
    coachNote:"Easy day. Yesterday's intervals were demanding — your legs need low-stress miles to absorb that work. Keep it honest."
  },
  {type:"Rest",km:"-",dur:"-",done:false,intensity:"rest",desc:"Active recovery. Walk or stretch.",zone:"-",
    segments:[{name:"Rest / Stretch",km:"-",pace:"-",zone:"-"}],
    coachNote:"Full rest. Light walking or stretching is fine, but no running. Your body builds fitness during recovery, not training."
  },
  {type:"Progressive",km:"9.0",dur:"50min",done:false,intensity:"high",desc:"Build to tempo over final 4km",zone:"Z3-4",
    segments:[{name:"Easy Start",km:"3.0",pace:"5:45",zone:"Z2"},{name:"Moderate Build",km:"2.0",pace:"5:15",zone:"Z3"},{name:"Tempo Finish",km:"4.0",pace:"4:50",zone:"Z4"}],
    coachNote:"The key is patience. Start genuinely easy and let the pace drop naturally. The last 4km should feel controlled, not desperate."
  },
  {type:"Long Run",km:"16.5",dur:"1h35",done:false,intensity:"key",desc:"Steady with last 3km at HM pace",zone:"Z2-3",
    segments:[{name:"Easy Miles",km:"10.0",pace:"5:45",zone:"Z2"},{name:"Moderate Push",km:"3.5",pace:"5:15",zone:"Z3"},{name:"HM Pace Finish",km:"3.0",pace:"4:55",zone:"Z3-4"}],
    coachNote:"This is the week's centrepiece. Bank the easy miles, then finish strong. The last 3km at HM pace teaches your body to push when tired."
  },
];
const COACH_MSG="Easy day. Yesterday's intervals were demanding - your legs need low-stress miles to absorb that work. Keep it honest.";
const bc=s=>{if(s.done)return T.lime;if(s.intensity==="key")return T.lime;if(s.intensity==="high")return T.barHigh;if(s.intensity==="low")return T.barEasy;if(s.intensity==="rest")return T.barRest;return T.g4;};

// ═══════════════════════════════════════
// CALENDAR DATA — Full month of training
// ═══════════════════════════════════════
// Session types: easy, specific, long, race, rest
const CAL_SESSIONS = {
  // Week 1 (Feb 2-8)
  "2026-02-02": [{type:"easy",label:"Easy",km:"6",dur:"36'",done:true}],
  "2026-02-03": [{type:"specific",label:"Tempo",km:"8.5",dur:"48'",done:true}],
  "2026-02-04": [{type:"easy",label:"Easy",km:"5",dur:"30'",done:true}],
  "2026-02-05": [],
  "2026-02-06": [{type:"specific",label:"Intervals",km:"10",dur:"55'",done:true}],
  "2026-02-07": [{type:"easy",label:"Easy",km:"6",dur:"36'",done:true}],
  "2026-02-08": [{type:"long",label:"Long Run",km:"18",dur:"1h42'",done:true}],
  // Week 2 (Feb 9-15)
  "2026-02-09": [],
  "2026-02-10": [{type:"easy",label:"Easy",km:"7",dur:"42'",done:true}],
  "2026-02-11": [{type:"specific",label:"Fartlek",km:"9",dur:"50'",done:true}],
  "2026-02-12": [{type:"easy",label:"Easy",km:"5.5",dur:"33'",done:true}],
  "2026-02-13": [],
  "2026-02-14": [{type:"specific",label:"Tempo",km:"8",dur:"44'",done:true}],
  "2026-02-15": [{type:"long",label:"Long Run",km:"20",dur:"1h55'",done:true}],
  // Week 3 (Feb 16-22 — current)
  "2026-02-16": [],
  "2026-02-17": [{type:"specific",label:"Tempo",km:"8.5",dur:"48'",done:true}],
  "2026-02-18": [{type:"easy",label:"Easy",km:"6",dur:"36'",done:true}],
  "2026-02-19": [{type:"specific",label:"Intervals",km:"10.2",dur:"55'",done:true}],
  "2026-02-20": [{type:"easy",label:"Easy",km:"7",dur:"42'",done:false,today:true}],
  "2026-02-21": [],
  "2026-02-22": [{type:"specific",label:"Progressive",km:"9",dur:"50'",done:false}],
  // Week 4 (Feb 23-28)
  "2026-02-23": [{type:"long",label:"Long Run",km:"16.5",dur:"1h35'",done:false}],
  "2026-02-24": [],
  "2026-02-25": [{type:"easy",label:"Easy",km:"6",dur:"36'",done:false}],
  "2026-02-26": [{type:"specific",label:"Race Pace",km:"10",dur:"52'",done:false}],
  "2026-02-27": [{type:"easy",label:"Easy",km:"5",dur:"30'",done:false}],
  "2026-02-28": [{type:"easy",label:"Shakeout",km:"4",dur:"24'",done:false}],
  // March (Race week partial)
  "2026-03-01": [{type:"race",label:"Semi-Marathon",km:"21.1",dur:"1h45'",done:false}],
  "2026-03-02": [],
  "2026-03-03": [{type:"easy",label:"Recovery",km:"4",dur:"28'",done:false}],
  "2026-03-04": [],
  "2026-03-05": [{type:"easy",label:"Easy",km:"5",dur:"30'",done:false}],
  "2026-03-06": [],
  "2026-03-07": [{type:"easy",label:"Easy",km:"6",dur:"36'",done:false}],
  "2026-03-08": [{type:"long",label:"Long Run",km:"14",dur:"1h20'",done:false}],
};

const SESSION_COLORS = {
  easy: T.easy,
  specific: T.specific,
  long: T.long,
  race: T.race,
};

const SESSION_LABELS = {
  easy: "Easy",
  specific: "Specific",
  long: "Long Run",
  race: "Race",
};

// ═══════════════════════════════════════
// CALENDAR HELPERS
// ═══════════════════════════════════════
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday-first
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_HEADERS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ═══════════════════════════════════════
// TRAINING PHASES — bands that cross the calendar
// ═══════════════════════════════════════
const PHASES = [
  { name: "Base", start: "2026-01-05", end: "2026-01-25", color: "#6B9E3A" },
  { name: "Build 1", start: "2026-01-26", end: "2026-02-08", color: "#E8A030" },
  { name: "Build 2", start: "2026-02-09", end: "2026-02-22", color: "#E87830" },
  { name: "Taper", start: "2026-02-23", end: "2026-02-28", color: "#5B9EFF" },
  { name: "Race", start: "2026-03-01", end: "2026-03-01", color: "#FF5A5A" },
  { name: "Recovery", start: "2026-03-02", end: "2026-03-15", color: "#8BC34A" },
];

function getPhaseForDate(dateKey) {
  for (const p of PHASES) {
    if (dateKey >= p.start && dateKey <= p.end) return p;
  }
  return null;
}

// Session type SVG icons — each type gets its own icon (small inline)
const SessionIcon = ({type, size=15, color="rgba(255,255,255,.9)"}) => {
  const s = {flexShrink:0};
  if (type === "easy") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 8v4"/>
    </svg>
  );
  if (type === "specific") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
    </svg>
  );
  if (type === "long") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M3 17l4-8 4 4 4-6 6 10"/>
    </svg>
  );
  if (type === "race") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z"/>
      <path d="M12 16v3"/>
      <path d="M8 22h8"/>
    </svg>
  );
  return null;
};

// Large watermark icon for session cards (improvement 6)
const WatermarkIcon = ({type, size=28, color="rgba(255,255,255,.18)"}) => {
  if (type === "easy") return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="11"/>
      <circle cx="16" cy="16" r="5"/>
    </svg>
  );
  if (type === "specific") return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3L6 18h7l-1.5 11L23 14h-7l1-11z"/>
    </svg>
  );
  if (type === "long") return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 24l6-12 5 6 5-9 8 15"/>
      <path d="M4 24h24"/>
    </svg>
  );
  if (type === "race") return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5h16v8c0 4.4-3.6 8-8 8s-8-3.6-8-8V5z"/>
      <path d="M16 21v4"/>
      <path d="M10 28h12"/>
      <path d="M5 5h3"/>
      <path d="M24 5h3"/>
    </svg>
  );
  return null;
};

// ═══════════════════════════════════════
// PHASE TIMELINE — mini overview bar (improvement 7)
// ═══════════════════════════════════════
// Blend hex color with white bg at given opacity to produce solid color
function blendWithBg(hex, opacity, bg=[248,248,246]) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const rr = Math.round(r*opacity + bg[0]*(1-opacity));
  const gg = Math.round(g*opacity + bg[1]*(1-opacity));
  const bb = Math.round(b*opacity + bg[2]*(1-opacity));
  return `rgb(${rr},${gg},${bb})`;
}

function PhaseTimeline({ currentYear, currentMonth }) {
  const todayKey = "2026-02-20";
  const allStart = new Date(PHASES[0].start);
  const allEnd = new Date(PHASES[PHASES.length - 1].end);
  const totalDays = Math.max(1, (allEnd - allStart) / (1000*60*60*24));
  const todayDate = new Date(todayKey);
  const todayOffset = Math.max(0, Math.min(1, (todayDate - allStart) / (1000*60*60*24) / totalDays));

  return (
    <div style={{padding:"8px 16px 4px",background:T.w2}}>
      <div style={{display:"flex",alignItems:"center",gap:0,height:22,borderRadius:11,overflow:"hidden",position:"relative",border:"1px solid rgba(0,0,0,.06)"}}>
        {PHASES.map((p, i) => {
          const start = new Date(p.start);
          const end = new Date(p.end);
          const days = Math.max(1, (end - start) / (1000*60*60*24) + 1);
          const widthPct = (days / totalDays) * 100;
          return (
            <div key={i} style={{
              width: widthPct + "%", height:"100%",
              background: p.color,
              borderRight: i < PHASES.length - 1 ? "1.5px solid "+T.w2 : "none",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden",
            }}>
              {widthPct > 10 && (
                <span style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,.95)",textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap",textShadow:"0 1px 3px rgba(0,0,0,.35)"}}>{p.name}</span>
              )}
            </div>
          );
        })}
        {/* Today marker — lime blinking */}
        <div style={{
          position:"absolute", top:-2, bottom:-2, left:`calc(${todayOffset*100}% - 5px)`,
          width:10, display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none", zIndex:2,
        }}>
          <div style={{
            width:10, height:10, borderRadius:5,
            background:T.lime, border:"2px solid "+T.wText,
            boxShadow:`0 0 8px ${T.lime}, 0 0 16px ${T.lime}80`,
            animation:"todayBlink 1.5s ease infinite",
          }}/>
          <div style={{
            position:"absolute", top:0, bottom:0, left:4, width:2,
            background:T.wText, borderRadius:1, opacity:0.5,
          }}/>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CALENDAR TAB — Dark Cadence Art Direction
// ═══════════════════════════════════════
function CalendarTab(){
  const [view, setView] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(1);
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState("2026-02-20");

  const todayKey = "2026-02-20";

  const getWeekDates = (dateKey) => {
    const d = new Date(dateKey);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      dates.push({
        year: dd.getFullYear(), month: dd.getMonth(), day: dd.getDate(),
        key: formatDateKey(dd.getFullYear(), dd.getMonth(), dd.getDate()),
        dayName: DAY_HEADERS[i],
      });
    }
    return dates;
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDays - firstDay + 1 + i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarDays.push({ day, key: formatDateKey(y, m, day), outside: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, key: formatDateKey(currentYear, currentMonth, i), outside: false });
  }
  const remaining = 7 - (calendarDays.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      calendarDays.push({ day: i, key: formatDateKey(y, m, i), outside: true });
    }
  }

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const weekDates = getWeekDates(selectedDate);

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:T.black}}>
      
      {/* ── Dark header ── */}
      <div style={{flexShrink:0,background:T.black,padding:"50px 16px 8px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={prevMonth} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={T.g3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{fontSize:17,fontWeight:700,color:T.g1}}>{MONTH_NAMES[currentMonth]}</span>
            <span style={{fontSize:17,fontWeight:300,color:T.g3,marginLeft:2}}>{currentYear}</span>
            <button onClick={nextMonth} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={T.g3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div style={{display:"flex",gap:0,padding:2,borderRadius:8,background:"rgba(255,255,255,.08)"}}>
            {["week","month"].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{
                padding:"5px 14px", borderRadius:6, border:"none", cursor:"pointer",
                background: view===v ? "rgba(255,255,255,.15)" : "transparent",
                fontFamily:T.f, fontSize:11, fontWeight:view===v?600:400,
                color: view===v ? T.g1 : T.g4, transition:"all .15s ease",
              }}>
                {v === "week" ? "Sem." : "Mois"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MONTH VIEW ═══ */}
      {view === "month" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",animation:"calFadeIn .2s ease both",background:T.w2}}>
          
          {/* Phase timeline overview (improvement 7) */}
          <PhaseTimeline currentYear={currentYear} currentMonth={currentMonth}/>

          {/* Day headers — improvement 5: larger, more spaced */}
          <div style={{flexShrink:0,display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:0,padding:"6px 3px 2px"}}>
            {DAY_HEADERS.map((d,i)=>{
              const isWeekend = i >= 5;
              return (
                <div key={d} style={{textAlign:"center",lineHeight:1}}>
                  <span style={{fontSize:10,fontWeight:600,color:isWeekend ? T.wMute+"90" : T.wMute,textTransform:"uppercase",letterSpacing:".08em"}}>{d.slice(0,2)}</span>
                </div>
              );
            })}
          </div>

          {/* Week rows */}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:0,padding:"0 3px",minHeight:0}}>
            {weeks.map((week, wi) => {
              const weekHasSessions = week.some(d => (CAL_SESSIONS[d.key]||[]).length > 0);
              // Find today's column index in this week (improvement 3)
              const todayColIdx = week.findIndex(d => d.key === todayKey);
              return (
                <div key={wi} style={{
                  flex: weekHasSessions ? 1 : 0, 
                  flexBasis: weekHasSessions ? 0 : "auto",
                  display:"flex", flexDirection:"column",
                  animation:`calFadeIn .25s ease ${wi*0.03}s both`,
                  position:"relative", overflow:"hidden", minHeight:0,
                  borderTop: wi > 0 ? "0.5px solid rgba(0,0,0,.04)" : "none",
                }}>

                    {/* Today column highlight (improvement 3) */}
                    {todayColIdx >= 0 && (
                      <div style={{
                        position:"absolute", top:0, bottom:0,
                        left: `${(todayColIdx / 7) * 100}%`,
                        width: `${(1/7)*100}%`,
                        background:`linear-gradient(180deg, ${T.lime}0C 0%, ${T.lime}06 100%)`,
                        pointerEvents:"none", zIndex:0,
                        borderLeft:`1px solid ${T.lime}15`,
                        borderRight:`1px solid ${T.lime}15`,
                      }}/>
                    )}
                  
                    {/* Phase band + day numbers — 30px row */}
                    {(() => {
                      // Compute contiguous phase segments for this week
                      const segments = [];
                      let seg = null;
                      week.forEach((d, di) => {
                        const phase = d.outside ? null : getPhaseForDate(d.key);
                        if (phase) {
                          if (seg && seg.phase.name === phase.name) {
                            seg.end = di;
                          } else {
                            if (seg) segments.push(seg);
                            // Check if this is the very first day of this phase
                            const isPhaseStart = d.key === phase.start;
                            seg = { phase, start: di, end: di, isPhaseStart };
                          }
                        } else {
                          if (seg) { segments.push(seg); seg = null; }
                        }
                      });
                      if (seg) segments.push(seg);

                      return (
                        <div style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:0,flexShrink:0,position:"relative",height:30}}>
                          {/* Continuous phase bands */}
                          {segments.map((s, si) => {
                            const leftPct = (s.start / 7) * 100;
                            const widthPct = ((s.end - s.start + 1) / 7) * 100;
                            const c = s.phase.color;
                            const isLeftEdge = s.isPhaseStart || s.start === 0;
                            const nextDayIdx = s.end + 1;
                            const nextPhase = nextDayIdx <= 6 && !week[nextDayIdx]?.outside ? getPhaseForDate(week[nextDayIdx]?.key) : null;
                            const isRightEdge = !nextPhase || nextPhase.name !== s.phase.name;
                            
                            return (
                              <div key={si} style={{
                                position:"absolute",
                                top:1, bottom:1,
                                left: `calc(${leftPct}% + ${s.start > 0 && s.isPhaseStart ? 2 : 0}px)`,
                                width: `calc(${widthPct}% - ${(s.start > 0 && s.isPhaseStart ? 2 : 0) + (isRightEdge && nextPhase ? 2 : 0)}px)`,
                                background: blendWithBg(c, 0.35),
                                borderRadius: `${isLeftEdge ? 7 : 2}px ${isRightEdge ? 7 : 2}px ${isRightEdge ? 7 : 2}px ${isLeftEdge ? 7 : 2}px`,
                                borderTop: `1px solid ${blendWithBg(c, 0.25)}`,
                                borderBottom: `1px solid ${blendWithBg(c, 0.25)}`,
                                borderLeft: s.isPhaseStart ? `3px solid ${c}` : isLeftEdge ? `2px solid ${c}` : `1px solid ${blendWithBg(c, 0.15)}`,
                                borderRight: isRightEdge ? `1px solid ${blendWithBg(c, 0.25)}` : `1px solid ${blendWithBg(c, 0.15)}`,
                                pointerEvents:"none",
                                zIndex:1,
                              }}>
                                {s.isPhaseStart && (s.end - s.start >= 1) && (
                                  <span style={{
                                    position:"absolute", top:2, left:6,
                                    fontSize:7, fontWeight:700, letterSpacing:".06em",
                                    color: c, textTransform:"uppercase", lineHeight:1,
                                    opacity:0.85, whiteSpace:"nowrap",
                                  }}>{s.phase.name}</span>
                                )}
                              </div>
                            );
                          })}
                          {/* Day numbers */}
                          {week.map((d, di) => {
                            const isToday = d.key === todayKey;
                            return (
                              <div key={di} style={{display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:2}}>
                                {isToday && (
                                  <div style={{
                                    position:"absolute",
                                    width:30,height:30,borderRadius:15,
                                    background:T.lime+"25",
                                    border:`1.5px solid ${T.lime}50`,
                                    animation:"todayBlink 1.5s ease infinite",
                                  }}/>
                                )}
                                <div style={{
                                  width:22, height:22, borderRadius:11,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  background: isToday ? T.wText : "transparent",
                                  position:"relative",
                                  boxShadow: isToday ? `0 0 10px ${T.lime}50, 0 0 20px ${T.lime}20` : "none",
                                }}>
                                  <span style={{
                                    fontSize:10, 
                                    fontWeight: isToday ? 800 : d.outside ? 400 : 500,
                                    fontVariantNumeric:"tabular-nums",
                                    color: isToday ? T.lime : d.outside ? T.wMute+"44" : T.wText,
                                  }}>{d.day}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Session cards — improvements 1 (depth) + 6 (watermark icons) */}
                    <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:2,padding:"1px 0 1px",minHeight:0}}>
                      {week.map((d, di) => {
                        const sessions = CAL_SESSIONS[d.key] || [];
                        const hasSession = sessions.length > 0;
                        const s = sessions[0];
                        const isToday = d.key === todayKey;
                        const col = hasSession ? SESSION_COLORS[s.type] : null;
                        return (
                          <div key={di} style={{display:"flex",flexDirection:"column",minHeight:0}}>
                            {hasSession ? (
                              <div style={{
                                flex:1, borderRadius:8,
                                background: col,
                                opacity: d.outside ? 0.15 : (isToday ? 1 : (s.done ? 1 : 0.75)),
                                display:"flex", flexDirection:"column",
                                alignItems:"center", justifyContent:"center",
                                gap:1, position:"relative", overflow:"hidden",
                                animation:`calBlockIn .25s ease ${(wi*7+di)*0.012}s both`,
                                transformOrigin:"left center", minHeight:0,
                                boxShadow: isToday 
                                  ? `0 0 0 2px ${T.lime}, 0 2px 10px ${T.lime}50`
                                  : s.done ? `inset 0 1px 0 rgba(255,255,255,.2), inset 0 -3px 6px rgba(0,0,0,.15)` 
                                  : `inset 0 1px 0 rgba(255,255,255,.15)`,
                              }}>
                                {/* Gradient overlay for depth */}
                                <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(0,0,0,.08) 100%)",pointerEvents:"none",borderRadius:8}}/>
                                {/* Diagonal stripes texture — on ALL cards */}
                                <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,.07) 3px, rgba(255,255,255,.07) 4px)",pointerEvents:"none"}}/>
                                {/* Watermark icon with shadow */}
                                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",filter:"drop-shadow(0 1px 2px rgba(0,0,0,.2))"}}>
                                  <WatermarkIcon type={s.type} size={30}/>
                                </div>
                                {/* Content */}
                                <span style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1,position:"relative",zIndex:2,fontVariantNumeric:"tabular-nums",textShadow:"0 1px 2px rgba(0,0,0,.25)"}}>{s.km}</span>
                                <span style={{fontSize:8,fontWeight:300,color:"rgba(255,255,255,.65)",lineHeight:1,position:"relative",zIndex:2,fontVariantNumeric:"tabular-nums",textShadow:"0 1px 1px rgba(0,0,0,.15)"}}>{s.dur}</span>
                                {/* Checkmark badge — done only */}
                                {s.done && (
                                  <div style={{position:"absolute",top:2,right:2,width:11,height:11,borderRadius:6,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3}}>
                                    <svg width="6" height="6" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </div>
                                )}
                                {/* Today glow ring — improvement 3 */}
                                {isToday && (
                                  <div style={{position:"absolute",inset:-1,borderRadius:9,border:`1.5px solid ${T.lime}`,animation:"todayGlow 2.5s ease infinite",pointerEvents:"none",zIndex:4}}/>
                                )}
                              </div>
                            ) : (
                              <div style={{flex:1}}/>
                            )}
                          </div>
                        );
                      })}
                    </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{flexShrink:0,padding:"8px 16px 4px",background:T.w2}}>
            <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8}}>
              {Object.entries(SESSION_LABELS).map(([k,v])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:11,height:11,borderRadius:3,background:SESSION_COLORS[k]}}/>
                  <span style={{fontSize:12,fontWeight:500,color:T.wSub}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:12,paddingBottom:56}}>
              {PHASES.filter(p => {
                const monthStart = formatDateKey(currentYear, currentMonth, 1);
                const monthEnd = formatDateKey(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
                return p.end >= monthStart && p.start <= monthEnd;
              }).map(p=>(
                <div key={p.name} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:20,height:10,borderRadius:5,background:blendWithBg(p.color, 0.35),borderLeft:`3px solid ${p.color}`}}/>
                  <span style={{fontSize:11,fontWeight:600,color:T.wSub}}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WEEK VIEW ═══ */}
      {view === "week" && (
        <div style={{flex:1,overflow:"auto",animation:"calFadeIn .25s ease both",background:T.w2}}>
          
          {/* Phase indicator */}
          {(() => {
            const firstDate = weekDates[0];
            const lastDate = weekDates[6];
            const phase = getPhaseForDate(firstDate.key) || getPhaseForDate(lastDate.key);
            if (!phase) return null;
            return (
              <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:3,height:14,borderRadius:2,background:phase.color}}/>
                <span style={{fontSize:11,fontWeight:600,color:T.wSub}}>{phase.name} Phase</span>
                <span style={{fontSize:11,color:T.wMute}}>· {MONTH_NAMES[firstDate.month].slice(0,3)} {firstDate.day}–{lastDate.day}</span>
              </div>
            );
          })()}

          <div style={{padding:"8px 14px 80px"}}>
            {weekDates.map((d, i) => {
              const sessions = CAL_SESSIONS[d.key] || [];
              const isToday = d.key === todayKey;
              const isRest = sessions.length === 0;

              return (
                <div key={i} style={{
                  marginBottom:6, borderRadius:14, 
                  background: isRest ? "transparent" : T.w1,
                  border: isRest ? "1px dashed "+T.wBrd : "1px solid "+T.wBrd,
                  overflow:"hidden",
                  animation:`calFadeIn .3s ease ${i*0.04}s both`,
                }}>
                  {isRest ? (
                    <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,fontWeight:500,color:T.wMute}}>{d.dayName}</span>
                        <span style={{fontSize:13,fontWeight:600,color:T.wMute}}>{d.day}</span>
                        {isToday && <div style={{padding:"1px 6px",borderRadius:5,background:"rgba(200,255,0,.12)"}}><span style={{fontSize:8,fontWeight:700,color:T.barHigh}}>TODAY</span></div>}
                      </div>
                      <span style={{fontSize:11,color:T.wMute}}>Rest</span>
                    </div>
                  ) : (
                    sessions.map((s, si) => (
                      <div key={si} style={{display:"flex",overflow:"hidden"}}>
                        <div style={{width:4,flexShrink:0,background:SESSION_COLORS[s.type],opacity:s.done?1:0.5}}/>
                        <div style={{flex:1,padding:"11px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:11,fontWeight:500,color:T.wMute}}>{d.dayName} {d.day}</span>
                              {isToday && <div style={{padding:"1px 6px",borderRadius:5,background:"rgba(200,255,0,.12)"}}><span style={{fontSize:8,fontWeight:700,color:T.barHigh}}>TODAY</span></div>}
                            </div>
                            {s.done && (
                              <div style={{width:18,height:18,borderRadius:9,background:T.wText,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            )}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:20,height:20,borderRadius:6,background:SESSION_COLORS[s.type]+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <SessionIcon type={s.type} size={13} color={SESSION_COLORS[s.type]}/>
                            </div>
                            <span style={{fontSize:15,fontWeight:600,color:T.wText}}>{s.label}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                            <span style={{fontSize:12,fontWeight:600,color:T.wText,fontVariantNumeric:"tabular-nums"}}>{s.km} km</span>
                            <span style={{fontSize:12,fontWeight:300,color:T.wSub,fontVariantNumeric:"tabular-nums"}}>{s.dur}</span>
                            <div style={{padding:"2px 6px",borderRadius:4,background:SESSION_COLORS[s.type]+"18",marginLeft:"auto"}}>
                              <span style={{fontSize:9,fontWeight:600,color:SESSION_COLORS[s.type],textTransform:"uppercase"}}>{SESSION_LABELS[s.type]}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}

            {/* Week summary */}
            {(() => {
              const totalKm = weekDates.reduce((acc, d) => acc + (CAL_SESSIONS[d.key] || []).reduce((a, s) => a + (parseFloat(s.km) || 0), 0), 0);
              const sessCount = weekDates.reduce((acc, d) => acc + (CAL_SESSIONS[d.key] || []).length, 0);
              const doneCount = weekDates.reduce((acc, d) => acc + (CAL_SESSIONS[d.key] || []).filter(s=>s.done).length, 0);
              return (
                <div style={{padding:"14px 16px",borderRadius:14,background:T.wText,marginTop:8}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".04em"}}>Week</span>
                    <span style={{fontSize:10,fontWeight:600,color:T.lime}}>{doneCount}/{sessCount}</span>
                  </div>
                  <div style={{display:"flex",gap:14,alignItems:"center"}}>
                    <div>
                      <span style={{fontSize:24,fontWeight:800,color:T.g1,letterSpacing:"-.03em",fontVariantNumeric:"tabular-nums"}}>{Math.round(totalKm)}</span>
                      <span style={{fontSize:11,fontWeight:400,color:T.g3,marginLeft:2}}>km</span>
                    </div>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:2}}>
                      {weekDates.map((d,i) => {
                        const sessions = CAL_SESSIONS[d.key] || [];
                        const hasSess = sessions.length > 0;
                        const done = sessions.some(s => s.done);
                        const color = hasSess ? SESSION_COLORS[sessions[0].type] : "rgba(255,255,255,.06)";
                        return <div key={i} style={{flex:1,height:5,borderRadius:3,background:color,opacity:hasSess?(done?1:0.35):1}}/>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}


// ═══════════════════════════════════════
// SMALL CARD
// ═══════════════════════════════════════
function EditPlanFAB(){
  return(
    <div style={{position:"absolute",bottom:78,right:16,zIndex:180,animation:"fabIn .4s cubic-bezier(.34,1.56,.64,1) .6s both"}}>
      <button style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:16,background:T.wText,border:"none",cursor:"pointer",boxShadow:"0 6px 24px rgba(0,0,0,.25)"}}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.3 1.5a1.6 1.6 0 012.3 2.3L5.3 12l-3.3.8.8-3.3z" stroke={T.lime} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{fontSize:14,fontWeight:600,color:T.w1}}>Edit Plan</span>
      </button>
    </div>
  );
}

function SmallCard({session:s,dayIdx,delay=0,onTap}){
  const isR=s.intensity==="rest",isD=s.done;
  return(
    <div onClick={()=>onTap&&onTap()} style={{display:"flex",borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd,overflow:"hidden",marginBottom:6,animation:delay?"slideIn .35s ease "+delay+"s both":"none",cursor:onTap?"pointer":"default",transition:"transform .15s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      <div style={{width:5,flexShrink:0,background:isD?T.lime:bc(s)}}/>
      <div style={{flex:1,padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
          <span style={{fontSize:12,fontWeight:500,color:T.wMute}}>{DAYS[dayIdx]}, Feb {DATES[dayIdx]}{!isR?" · "+s.dur:""}</span>
          {isD&&<div style={{width:22,height:22,borderRadius:11,background:T.wText,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
          {!isD&&!isR&&<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={T.wMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <span style={{fontSize:17,fontWeight:600,color:T.wText,display:"block"}}>{s.type}</span>
        <span style={{fontSize:13,color:T.wSub,display:"block",marginTop:3}}>{isR?s.desc:s.zone+" · "+s.km+" km"}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// INTENSITY PROFILE CHART
// ═══════════════════════════════════════
const ZONE_HEIGHT={Z1:.15,Z2:.35,"Z2-3":.5,Z3:.6,"Z3-4":.75,Z4:.85,"Z4-5":.95,Z5:1};
const ZONE_COLOR=(z)=>{if(z.includes("4")||z.includes("5"))return T.barHigh;if(z.includes("3"))return"#9ACD32";return T.barEasy;};

function IntensityProfile({segments,session}){
  const[an,setAn]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAn(true),400);return()=>clearTimeout(t);},[]);
  const totalKm=segments.reduce((a,s)=>a+(parseFloat(s.km)||0),0);
  if(totalKm<=0)return null;
  const W=326,H=110,padT=10,padB=28,barH=H-padT-padB;
  let cx=0;
  const rects=segments.map((seg)=>{
    const km=parseFloat(seg.km)||0;
    const w=(km/totalKm)*W;
    const h=(ZONE_HEIGHT[seg.zone]||.4)*barH;
    const y=padT+barH-h;
    const col=seg.zone==="Z1"?T.barRest:ZONE_COLOR(seg.zone);
    const r={x:cx,y,w,h,col,name:seg.name,km,zone:seg.zone,pace:seg.pace};
    cx+=w;
    return r;
  });
  const pts=[];
  rects.forEach((r,i)=>{
    pts.push({x:r.x,y:r.y});
    pts.push({x:r.x+r.w,y:r.y});
  });
  const smooth=(points)=>{
    if(points.length<2)return"";
    let d="M"+points[0].x+","+points[0].y;
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)];
      const p1=points[i];
      const p2=points[i+1];
      const p3=points[Math.min(points.length-1,i+2)];
      const cp1x=p1.x+(p2.x-p0.x)/6;
      const cp1y=p1.y+(p2.y-p0.y)/6;
      const cp2x=p2.x-(p3.x-p1.x)/6;
      const cp2y=p2.y-(p3.y-p1.y)/6;
      d+=" C"+cp1x+","+cp1y+" "+cp2x+","+cp2y+" "+p2.x+","+p2.y;
    }
    return d;
  };
  const curvePath=smooth(pts);

  return(
    <div style={{padding:18,borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <span style={{fontSize:11,fontWeight:600,color:T.wMute,letterSpacing:".05em",textTransform:"uppercase"}}>Intensity Profile</span>
        <div style={{display:"flex",gap:8}}>
          {[{l:"Z4-5",c:T.barHigh},{l:"Z3",c:"#9ACD32"},{l:"Z2",c:T.barEasy},{l:"Rest",c:T.barRest}].map(r=>(
            <div key={r.l} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:6,height:6,borderRadius:2,background:r.c}}/><span style={{fontSize:9,color:T.wMute}}>{r.l}</span></div>
          ))}
        </div>
      </div>
      <svg width={W} height={H} viewBox={"0 0 "+W+" "+H} style={{overflow:"visible"}}>
        <defs>
          {rects.map((r,i)=>(
            <linearGradient key={"ig"+i} id={"ig"+i} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={r.col} stopOpacity=".5"/>
              <stop offset="100%" stopColor={r.col} stopOpacity=".08"/>
            </linearGradient>
          ))}
        </defs>
        {[.25,.5,.75,1].map(r=><line key={r} x1={0} x2={W} y1={padT+barH*(1-r)} y2={padT+barH*(1-r)} stroke={T.wBrd} strokeWidth="1" strokeDasharray="3,3"/>)}
        {rects.map((r,i)=>(
          <rect key={i} x={r.x+.5} y={an?r.y:(padT+barH)} width={Math.max(0,r.w-1)} height={an?r.h:0} rx={4} fill={"url(#ig"+i+")"} style={{transition:"y .6s cubic-bezier(.4,0,.2,1) "+i*.08+"s, height .6s cubic-bezier(.4,0,.2,1) "+i*.08+"s"}}/>
        ))}
        <path d={curvePath} fill="none" stroke={T.wText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:600,strokeDashoffset:an?0:600,transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1) .3s",opacity:.2}}/>
        {rects.map((r,i)=>{
          if(r.w<25)return null;
          return <text key={"t"+i} x={r.x+r.w/2} y={H-6} textAnchor="middle" style={{fontFamily:T.f,fontSize:r.w>50?10:8,fill:T.wMute,fontWeight:400}}>{r.km} km</text>;
        })}
        {rects.map((r,i)=>(
          <rect key={"top"+i} x={r.x+1} y={an?r.y:padT+barH} width={Math.max(0,r.w-2)} height={3} rx={1.5} fill={r.col} style={{transition:"y .6s cubic-bezier(.4,0,.2,1) "+i*.08+"s",opacity:an?.9:0}}/>
        ))}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════
// SESSION DETAIL SCREEN
// ═══════════════════════════════════════
function SessionDetailScreen({session,dayIdx,onBack,onStart}){
  const[sc,setSc]=useState(0);
  const isR=session.intensity==="rest";
  const col=bc(session);
  const segments=session.segments||[];
  const p=Math.min(1,Math.max(0,(sc-10)/80));

  return(
    <div style={{position:"absolute",inset:0,zIndex:300,background:T.black,animation:"detailSlideUp .45s cubic-bezier(.32,.72,.37,1.0) both"}}>
      <Grain/>
      {p>.8&&<div style={{position:"absolute",top:0,left:0,right:0,zIndex:90,padding:"54px 24px 14px",background:"rgba(0,0,0,.95)",backdropFilter:"blur(24px)",borderBottom:"1px solid "+T.brd,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={T.g2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{flex:1}}>
          <span style={{fontSize:16,fontWeight:700,color:T.g1}}>{session.type}</span>
        </div>
        <div style={{padding:"4px 10px",borderRadius:8,background:col+"22"}}><span style={{fontSize:11,fontWeight:700,color:col}}>{session.zone}</span></div>
      </div>}

      <div onScroll={e=>setSc(e.target.scrollTop)} style={{position:"absolute",inset:0,zIndex:10,overflow:"auto"}}>
        <div style={{padding:"62px 24px 28px",background:T.black}}>
          <div style={{opacity:1-p*1.5}}>
            <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:20}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={T.g3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{fontSize:14,fontWeight:500,color:T.g3}}>Back</span>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{padding:"5px 12px",borderRadius:10,background:col+"22",border:"1px solid "+col+"33"}}><span style={{fontSize:12,fontWeight:700,color:col}}>{session.zone}</span></div>
              {session.today&&<div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:3,background:T.lime,animation:"dotPulse 2s ease infinite"}}/><span style={{fontSize:12,fontWeight:500,color:T.g3}}>Today</span></div>}
              {session.done&&<div style={{display:"flex",alignItems:"center",gap:5}}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{fontSize:12,fontWeight:500,color:T.lime}}>Completed</span></div>}
            </div>
            <span style={{fontSize:34,fontWeight:800,color:T.g1,display:"block",letterSpacing:"-.04em",lineHeight:1.1}}>{session.type}</span>
            <span style={{fontSize:14,color:T.g3,display:"block",marginTop:8}}>{DAYS[dayIdx]}, Feb {DATES[dayIdx]}{!isR?" · "+session.dur+" · "+session.km+" km":""}</span>
          </div>
        </div>

        <div style={{background:T.w2,borderRadius:"28px 28px 0 0",minHeight:600,marginTop:-4}}>
          <div style={{padding:"24px 16px 140px"}}>
            {session.coachNote&&<div style={{padding:"18px 20px",borderRadius:18,background:T.lime,marginBottom:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"relative",zIndex:2}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <div style={{width:7,height:7,borderRadius:4,background:T.black,opacity:.2}}/>
                  <span style={{fontSize:11,fontWeight:600,color:"rgba(0,0,0,.4)"}}>Coach Insight</span>
                </div>
                <p style={{fontSize:15,fontWeight:500,color:T.black,lineHeight:1.55}}>{session.coachNote}</p>
              </div>
            </div>}

            {!isR&&segments.length>0&&<IntensityProfile segments={segments} session={session}/>}

            {!isR&&segments.length>0&&<>
              <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:10,letterSpacing:".05em",textTransform:"uppercase"}}>Workout Structure</span>
              <div style={{borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,overflow:"hidden",marginBottom:16}}>
                {segments.map((seg,i)=>{
                  const segCol=seg.zone.includes("4")||seg.zone.includes("5")?T.barHigh:seg.zone.includes("3")?"#9ACD32":T.barEasy;
                  const isRest=seg.zone==="Z1";
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",padding:"16px 18px",borderBottom:i<segments.length-1?"1px solid "+T.wBrd:"none",animation:"splitReveal .35s ease "+(i*.06)+"s both"}}>
                      <div style={{width:4,height:36,borderRadius:2,background:isRest?T.barRest:segCol,marginRight:14,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:15,fontWeight:600,color:T.wText}}>{seg.name}</span>
                        <span style={{fontSize:12,color:T.wMute,display:"block",marginTop:2}}>{seg.zone} · {seg.pace} /km</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span style={{fontSize:17,fontWeight:700,color:T.wText}}>{seg.km}</span>
                        <span style={{fontSize:12,color:T.wMute,display:"block"}}>km</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>}

            {!isR&&<>
              <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:10,letterSpacing:".05em",textTransform:"uppercase"}}>Overview</span>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                {[
                  {label:"Distance",value:session.km,unit:"km",hero:true},
                  {label:"Duration",value:session.dur,unit:""},
                  {label:"Intensity",value:session.intensity==="high"?"High":session.intensity==="low"?"Low":"Key",unit:""},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"14px 12px",borderRadius:16,background:s.hero?T.lime:T.w1,border:"1px solid "+(s.hero?"transparent":T.wBrd),textAlign:"center"}}>
                    <span style={{fontSize:10,fontWeight:500,color:s.hero?"rgba(0,0,0,.45)":T.wMute,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"}}>{s.label}</span>
                    <span style={{fontSize:20,fontWeight:800,color:s.hero?T.black:T.wText}}>{s.value}</span>
                    {s.unit&&<span style={{fontSize:12,color:s.hero?"rgba(0,0,0,.4)":T.wMute,marginLeft:2}}>{s.unit}</span>}
                  </div>
                ))}
              </div>
            </>}

            <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:10,letterSpacing:".05em",textTransform:"uppercase"}}>Focus Points</span>
            <div style={{borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd,padding:"16px 18px",marginBottom:16}}>
              {(isR?[
                {icon:"🧘",text:"Light stretching or yoga (15–20 min)"},
                {icon:"🚶",text:"Optional: easy walk for blood flow"},
                {icon:"💤",text:"Prioritize sleep and hydration"},
              ]:[
                {icon:"🎯",text:session.intensity==="high"?"Hit target pace but don't exceed it":"Keep the effort conversational"},
                {icon:"💧",text:"Stay hydrated — sip throughout if warm"},
                {icon:"👟",text:session.km>=10?"Consider fueling during the run":"Flat route preferred for even effort"},
              ]).map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<2?"1px solid "+T.wBrd:"none"}}>
                  <span style={{fontSize:18}}>{f.icon}</span>
                  <span style={{fontSize:14,color:T.wText,lineHeight:1.4}}>{f.text}</span>
                </div>
              ))}
            </div>

            <div style={{padding:"14px 18px",borderRadius:16,background:T.wText,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <span style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:".04em"}}>Week 4 · Build Phase</span>
                <span style={{fontSize:14,fontWeight:600,color:T.g1,display:"block",marginTop:3}}>57.2 km planned</span>
              </div>
              <div style={{display:"flex",gap:3}}>
                {PLAN.map((s,i)=>(
                  <div key={i} style={{width:8,height:8,borderRadius:4,background:i===dayIdx?T.lime:s.done?T.lime+"88":"rgba(255,255,255,.15)"}}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!session.done&&!isR&&<div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:400,padding:"12px 16px 40px",background:"linear-gradient(transparent,"+T.w2+" 20%)"}}>
        <button onClick={onStart} style={{width:"100%",padding:"18px 24px",borderRadius:18,background:T.wText,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,.2)",transition:"transform .15s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{width:32,height:32,borderRadius:16,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="6,3 20,12 6,21" fill={T.black}/></svg>
          </div>
          <span style={{fontSize:17,fontWeight:700,color:T.w1}}>Start Session</span>
        </button>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════
// ACTIVE SESSION SCREEN (simplified for this file)
// ═══════════════════════════════════════
function ActiveSessionScreen({session,onStop}){
  const[elapsed,setElapsed]=useState(0);
  const[paused,setPaused]=useState(false);
  const[distance,setDistance]=useState(0);
  const[hr,setHr]=useState(142);
  const[showStop,setShowStop]=useState(false);
  const[segIdx,setSegIdx]=useState(0);
  const timerRef=useRef(null);
  const segments=session.segments||[];
  const curSeg=segments[segIdx]||segments[0];

  useEffect(()=>{
    if(paused)return;
    timerRef.current=setInterval(()=>{
      setElapsed(p=>p+1);
      setDistance(p=>p+0.0028+(Math.random()*0.0008));
      setHr(Math.floor(138+Math.random()*16));
    },1000);
    return()=>clearInterval(timerRef.current);
  },[paused]);

  useEffect(()=>{
    if(segments.length<=1)return;
    let cumDist=0;
    for(let i=0;i<segments.length;i++){
      const segKm=parseFloat(segments[i].km)||0;
      cumDist+=segKm;
      if(distance<cumDist){
        if(i!==segIdx)setSegIdx(i);
        break;
      }
    }
  },[distance,segments,segIdx]);

  const totalKm=parseFloat(session.km)||0;
  const progress=totalKm>0?Math.min(1,distance/totalKm):0;
  const h=Math.floor(elapsed/3600);
  const m=Math.floor((elapsed%3600)/60);
  const s=elapsed%60;
  const pad=n=>n.toString().padStart(2,"0");
  const pace=distance>0.01?elapsed/60/distance:0;
  const paceMin=Math.floor(pace);
  const paceSec=Math.floor((pace-paceMin)*60);
  const curSegKm=parseFloat(curSeg?.km)||0;
  let segStartDist=0;
  for(let i=0;i<segIdx;i++) segStartDist+=parseFloat(segments[i]?.km)||0;
  const segProgress=curSegKm>0?Math.min(1,(distance-segStartDist)/curSegKm):0;

  return(
    <div style={{position:"absolute",inset:0,zIndex:500,background:T.black,animation:"sessionFadeIn .5s ease both"}}>
      <Grain/>
      <div style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"58px 24px 0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:4,background:paused?T.ora:T.lime,animation:paused?"none":"timerPulse 2s ease infinite"}}/>
              <span style={{fontSize:13,fontWeight:600,color:paused?T.ora:T.g3}}>{paused?"Paused":"Recording"}</span>
            </div>
            <span style={{fontSize:13,fontWeight:500,color:T.g4}}>{session.type}</span>
          </div>
        </div>

        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
          <div style={{textAlign:"center"}}>
            <span style={{fontFamily:T.f,fontSize:64,fontWeight:200,color:T.g1,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{pad(m)}:{pad(s)}</span>
            <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:24}}>
              <div style={{textAlign:"center"}}>
                <span style={{fontSize:24,fontWeight:700,color:T.g1}}>{distance.toFixed(2)}</span>
                <span style={{fontSize:11,color:T.g4,display:"block"}}>km</span>
              </div>
              <div style={{textAlign:"center"}}>
                <span style={{fontSize:24,fontWeight:700,color:T.g1}}>{paceMin}:{String(paceSec).padStart(2,'0')}</span>
                <span style={{fontSize:11,color:T.g4,display:"block"}}>/km</span>
              </div>
              <div style={{textAlign:"center"}}>
                <span style={{fontSize:24,fontWeight:700,color:T.red}}>{hr}</span>
                <span style={{fontSize:11,color:T.g4,display:"block"}}>bpm</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:"0 24px 50px",display:"flex",gap:12,justifyContent:"center"}}>
          <button onClick={()=>setPaused(!paused)} style={{width:64,height:64,borderRadius:32,background:"rgba(255,255,255,.08)",border:"1px solid "+T.brd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {paused?<svg width="20" height="20" viewBox="0 0 24 24" fill={T.g1}><polygon points="6,3 20,12 6,21"/></svg>:<svg width="20" height="20" viewBox="0 0 24 24" fill={T.g1}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>}
          </button>
          {showStop?(
            <button onClick={()=>onStop({elapsed,distance})} style={{height:64,padding:"0 32px",borderRadius:32,background:T.red,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff"><rect x="3" y="3" width="10" height="10" rx="2"/></svg>
              <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>End Run</span>
            </button>
          ):(
            <button onClick={()=>setShowStop(true)} style={{width:64,height:64,borderRadius:32,background:T.red+"22",border:"1px solid "+T.red+"44",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill={T.red}><rect x="3" y="3" width="10" height="10" rx="2"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DEBRIEF SCREEN (simplified)
// ═══════════════════════════════════════
function DebriefScreen({session,elapsedTime,distanceCovered,onDone}){
  const dist=distanceCovered||0;
  const eM=Math.floor(elapsedTime/60);
  const eS=elapsedTime%60;
  
  return(
    <div style={{position:"absolute",inset:0,zIndex:600,background:T.black,animation:"debriefIn .5s ease both"}}>
      <Grain/>
      <div style={{position:"absolute",inset:0,zIndex:10,overflow:"auto"}}>
        <div style={{padding:"72px 24px 28px",background:T.black,textAlign:"center"}}>
          <span style={{fontSize:15,fontWeight:600,color:T.lime}}>Session Complete</span>
          <span style={{fontSize:30,fontWeight:800,color:T.g1,display:"block",letterSpacing:"-.04em",marginTop:8}}>{session.type}</span>
          <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:16}}>
            <div><span style={{fontSize:20,fontWeight:700,color:T.g1}}>{eM}:{String(eS).padStart(2,'0')}</span><span style={{fontSize:11,color:T.g4,display:"block"}}>time</span></div>
            <div><span style={{fontSize:20,fontWeight:700,color:T.g1}}>{dist.toFixed(2)}</span><span style={{fontSize:11,color:T.g4,display:"block"}}>km</span></div>
          </div>
        </div>
        <div style={{background:T.w2,borderRadius:"28px 28px 0 0",minHeight:400,marginTop:-4}}>
          <div style={{padding:"30px 16px 60px",textAlign:"center"}}>
            <button onClick={onDone} style={{width:"100%",padding:"18px 24px",borderRadius:16,border:"none",background:T.wText,color:T.w1,fontFamily:T.f,fontSize:16,fontWeight:700,cursor:"pointer"}}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 1 - TODAY
// ═══════════════════════════════════════
function TodayTab({onOpenSession}){
  const[sel,setSel]=useState(TODAY);
  const[sc,setSc]=useState(0);
  const cs=useStream(COACH_MSG,20,800);
  const p=Math.min(1,Math.max(0,(sc-20)/60));
  const today=PLAN[TODAY];
  const up=PLAN.map((s,i)=>({...s,idx:i})).filter((_,i)=>i>TODAY);

  return(
    <div style={{width:"100%",height:"100%",position:"relative"}}>
      {p>.85&&<div style={{position:"absolute",top:0,left:0,right:0,zIndex:90,padding:"54px 24px 12px",background:"rgba(0,0,0,.92)",backdropFilter:"blur(24px)",borderBottom:"1px solid "+T.brd}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:17,fontWeight:700,color:T.g1}}>Today</span>
            <span style={{fontSize:13,color:T.g4}}>Thu, Feb 20</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.lime}}/>
            <span style={{fontSize:12,fontWeight:600,color:T.g3}}>Week 4</span>
          </div>
        </div>
      </div>}

      <div onScroll={e=>setSc(e.target.scrollTop)} style={{width:"100%",height:"100%",overflow:"auto"}}>
        <div style={{background:T.black,padding:"62px 24px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",opacity:1-p,transform:"translateY("+-p*30+"px)"}}>
            <div>
              <span style={{fontSize:14,color:T.g4}}>Thursday, Feb 20</span>
              <span style={{fontSize:28,fontWeight:700,color:T.g1,display:"block",letterSpacing:"-.03em",lineHeight:1.1,marginTop:2}}>Morning, <span style={{color:T.lime}}>Alex</span></span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{padding:"7px 12px",borderRadius:20,background:T.card,border:"1px solid "+T.brd,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:3,background:T.lime,animation:"dotPulse 2s ease infinite"}}/>
                <span style={{fontSize:12,fontWeight:600,color:T.g2}}>W4</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{background:T.w2,borderRadius:"28px 28px 0 0",minHeight:700,marginTop:-4}}>
          {/* Calendar strip */}
          <div style={{padding:"22px 16px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 4px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span style={{fontSize:20,fontWeight:700,color:T.wText}}>February</span>
                <span style={{fontSize:20,fontWeight:300,color:T.wMute}}>2026</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
              {DAYS.map((d,i)=>{
                const a=i===sel;
                const iT=i===TODAY;
                const s=PLAN[i];
                return(
                  <button key={i} onClick={()=>setSel(i)} style={{width:44,padding:"8px 0",borderRadius:14,background:a?T.wText:"transparent",border:a?"none":"1px solid transparent",cursor:"pointer",textAlign:"center",transition:"all .2s ease"}}>
                    <span style={{fontSize:10,fontWeight:600,color:a?"rgba(255,255,255,.5)":T.wMute,display:"block"}}>{d}</span>
                    <span style={{fontSize:18,fontWeight:700,color:a?T.w1:T.wText,display:"block",margin:"4px 0"}}>{DATES[i]}</span>
                    <div style={{width:6,height:6,borderRadius:3,margin:"0 auto",background:a?T.lime:s.done?T.wText:iT?T.barHigh:"transparent"}}/>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{padding:"0 16px 120px"}}>
            {/* Coach card */}
            <div style={{padding:"18px 20px",borderRadius:18,background:T.wText,marginBottom:14,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:100,height:100,background:"radial-gradient(circle at top right, "+T.lime+"15, transparent 70%)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:2}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:11,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontWeight:800,color:T.black}}>C</span></div>
                  <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.4)"}}>Coach</span>
                </div>
                <p style={{fontSize:15,fontWeight:400,color:T.g1,lineHeight:1.55}}>{cs.displayed}{!cs.done&&cs.started&&<Blink c={T.lime}/>}</p>
              </div>
            </div>

            {/* Today card */}
            <SmallCard session={today} dayIdx={TODAY} delay={0.1} onTap={()=>onOpenSession(TODAY)}/>

            {/* Upcoming */}
            <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"12px 4px 8px",display:"block",letterSpacing:".05em",textTransform:"uppercase"}}>This Week</span>
            {up.map((s,i)=><SmallCard key={i} session={s} dayIdx={s.idx} delay={0.15+i*0.06} onTap={()=>onOpenSession(s.idx)}/>)}
          </div>
        </div>
      </div>
      <EditPlanFAB/>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 2 - COACH (placeholder)
// ═══════════════════════════════════════
function CoachTab(){
  return(
    <div style={{width:"100%",height:"100%",background:T.w2}}>
      <div style={{background:T.black,padding:"62px 24px 24px"}}>
        <span style={{fontSize:28,fontWeight:700,color:T.g1,letterSpacing:"-.03em"}}>Coach</span>
      </div>
      <div style={{background:T.w2,borderRadius:"28px 28px 0 0",marginTop:-4,padding:"30px 16px"}}>
        <div style={{padding:20,borderRadius:18,background:T.wText}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:14,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,fontWeight:800,color:T.black}}>C</span></div>
            <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.5)"}}>Coach</span>
          </div>
          <p style={{fontSize:15,color:T.g1,lineHeight:1.55}}>Hey Alex! Your training is on track. Let me know if you want to adjust anything for this week.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 3 - ANALYTICS (placeholder)
// ═══════════════════════════════════════
function AnalyticsTab(){
  return(
    <div style={{width:"100%",height:"100%",background:T.w2}}>
      <div style={{background:T.black,padding:"62px 24px 24px"}}>
        <span style={{fontSize:28,fontWeight:700,color:T.g1,letterSpacing:"-.03em"}}>Analytics</span>
      </div>
      <div style={{background:T.w2,borderRadius:"28px 28px 0 0",marginTop:-4,padding:"30px 16px"}}>
        <span style={{fontSize:14,color:T.wMute}}>Coming soon...</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 5 - PROFILE (placeholder)
// ═══════════════════════════════════════
function ProfileTab(){
  return(
    <div style={{width:"100%",height:"100%",background:T.w2}}>
      <div style={{background:T.black,padding:"62px 24px 24px"}}>
        <span style={{fontSize:28,fontWeight:700,color:T.g1,letterSpacing:"-.03em"}}>Profile</span>
      </div>
      <div style={{background:T.w2,borderRadius:"28px 28px 0 0",marginTop:-4,padding:"30px 16px"}}>
        <span style={{fontSize:14,color:T.wMute}}>Profile settings...</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// NAV + ROOT
// ═══════════════════════════════════════
function BottomNav({active,onChange}){
  const tabs=[
    {id:"today",label:"Today",icon:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={c}/></svg>},
    {id:"calendar",label:"Calendar",icon:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" stroke={c}/><line x1="16" y1="2" x2="16" y2="6" stroke={c}/><line x1="8" y1="2" x2="8" y2="6" stroke={c}/><line x1="3" y1="10" x2="21" y2="10" stroke={c}/><rect x="7" y="14" width="3" height="3" rx=".5" fill={c} opacity=".4"/><rect x="14" y="14" width="3" height="3" rx=".5" fill={c} opacity=".4"/></svg>},
    {id:"coach",label:"Coach",icon:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={c}/></svg>},
    {id:"analytics",label:"Analytics",icon:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke={c}/></svg>},
    {id:"profile",label:"Profile",icon:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" stroke={c}/><path d="M4 21v-1a6 6 0 0112 0v1" stroke={c}/></svg>},
  ];
  return(
    <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:200}}>
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 4px 28px",background:T.w2,borderTop:"1px solid "+T.wBrd}}>
        {tabs.map(t=>{
          const a=t.id===active;
          return(
            <button key={t.id} onClick={()=>onChange(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 8px"}}>
              {t.icon(a?T.wText:T.wMute)}
              <span style={{fontSize:9,fontWeight:a?600:400,color:a?T.wText:T.wMute}}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CadenceApp(){
  useStyles();
  const[tab,setTab]=useState("calendar"); // Start on calendar to show it
  const[detailIdx,setDetailIdx]=useState(null);
  const[activeSession,setActiveSession]=useState(null);
  const[debrief,setDebrief]=useState(null);

  const openSession=(idx)=>setDetailIdx(idx);
  const closeDetail=()=>setDetailIdx(null);
  const startSession=()=>{setActiveSession(PLAN[detailIdx]);setDetailIdx(null);};
  const endSession=(data)=>{
    setDebrief({session:activeSession,elapsed:data?.elapsed||0,distance:data?.distance||0});
    setActiveSession(null);
  };
  const finishDebrief=()=>setDebrief(null);

  return(
    <Phone>
      <div style={{width:"100%",height:"100%",position:"relative"}}>
        <div style={{width:"100%",height:"100%",paddingBottom:70}}>
          {tab==="today"&&<TodayTab onOpenSession={openSession}/>}
          {tab==="calendar"&&<CalendarTab/>}
          {tab==="coach"&&<CoachTab/>}
          {tab==="analytics"&&<AnalyticsTab/>}
          {tab==="profile"&&<ProfileTab/>}
        </div>
        <BottomNav active={tab} onChange={setTab}/>

        {detailIdx!==null&&<SessionDetailScreen session={PLAN[detailIdx]} dayIdx={detailIdx} onBack={closeDetail} onStart={startSession}/>}
        {activeSession&&<ActiveSessionScreen session={activeSession} onStop={endSession}/>}
        {debrief&&<DebriefScreen session={debrief.session} elapsedTime={debrief.elapsed} distanceCovered={debrief.distance} onDone={finishDebrief}/>}
      </div>
    </Phone>
  );
}
