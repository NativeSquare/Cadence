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
  return <canvas ref={r} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:50,opacity:.3,mixBlendMode:"overlay"}}/>;
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
  // Build segment rects
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
  // Build smooth curve points for the top path
  const pts=[];
  rects.forEach((r,i)=>{
    pts.push({x:r.x,y:r.y});
    pts.push({x:r.x+r.w,y:r.y});
  });
  // Catmull-Rom to smooth path
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
  const areaPath=curvePath+" L"+W+","+(padT+barH)+" L0,"+(padT+barH)+" Z";

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
        {/* Zone grid lines */}
        {[.25,.5,.75,1].map(r=><line key={r} x1={0} x2={W} y1={padT+barH*(1-r)} y2={padT+barH*(1-r)} stroke={T.wBrd} strokeWidth="1" strokeDasharray="3,3"/>)}
        {/* Filled bars with gradient */}
        {rects.map((r,i)=>(
          <rect key={i} x={r.x+.5} y={an?r.y:(padT+barH)} width={Math.max(0,r.w-1)} height={an?r.h:0} rx={4} fill={"url(#ig"+i+")"} style={{transition:"y .6s cubic-bezier(.4,0,.2,1) "+i*.08+"s, height .6s cubic-bezier(.4,0,.2,1) "+i*.08+"s"}}/>
        ))}
        {/* Top curve line */}
        <path d={curvePath} fill="none" stroke={T.wText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:600,strokeDashoffset:an?0:600,transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1) .3s",opacity:.2}}/>
        {/* Segment labels */}
        {rects.map((r,i)=>{
          if(r.w<25)return null;
          return <text key={"t"+i} x={r.x+r.w/2} y={H-6} textAnchor="middle" style={{fontFamily:T.f,fontSize:r.w>50?10:8,fill:T.wMute,fontWeight:400}}>{r.km} km</text>;
        })}
        {/* Colored zone indicators on top edge */}
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

      {/* Collapsed header */}
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
        {/* Hero header */}
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

        {/* Content */}
        <div style={{background:T.w2,borderRadius:"28px 28px 0 0",minHeight:600,marginTop:-4}}>
          <div style={{padding:"24px 16px 140px"}}>

            {/* Coach insight */}
            {session.coachNote&&<div style={{padding:"18px 20px",borderRadius:18,background:T.lime,marginBottom:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"relative",zIndex:2}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <div style={{width:7,height:7,borderRadius:4,background:T.black,opacity:.2}}/>
                  <span style={{fontSize:11,fontWeight:600,color:"rgba(0,0,0,.4)"}}>Coach Insight</span>
                </div>
                <p style={{fontSize:15,fontWeight:500,color:T.black,lineHeight:1.55}}>{session.coachNote}</p>
              </div>
            </div>}

            {/* Intensity Profile Chart */}
            {!isR&&segments.length>0&&<IntensityProfile segments={segments} session={session}/>}

            {/* Workout structure */}
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

            {/* Session overview stats */}
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

            {/* What to focus on */}
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

            {/* Week context */}
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

      {/* Sticky CTA */}
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
// ACTIVE SESSION SCREEN
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

  // Timer
  useEffect(()=>{
    if(paused)return;
    timerRef.current=setInterval(()=>{
      setElapsed(p=>p+1);
      setDistance(p=>p+0.0028+(Math.random()*0.0008));
      setHr(Math.floor(138+Math.random()*16));
    },1000);
    return()=>clearInterval(timerRef.current);
  },[paused]);

  // Auto advance segments based on distance
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

  // Current pace (min/km)
  const pace=distance>0.01?elapsed/60/distance:0;
  const paceMin=Math.floor(pace);
  const paceSec=Math.floor((pace-paceMin)*60);

  // Segment progress
  const curSegKm=parseFloat(curSeg?.km)||0;
  let segStartDist=0;
  for(let i=0;i<segIdx;i++) segStartDist+=parseFloat(segments[i]?.km)||0;
  const segProgress=curSegKm>0?Math.min(1,(distance-segStartDist)/curSegKm):0;

  return(
    <div style={{position:"absolute",inset:0,zIndex:500,background:T.black,animation:"sessionFadeIn .5s ease both"}}>
      <Grain/>
      <div style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column"}}>

        {/* Top bar */}
        <div style={{padding:"58px 24px 0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:4,background:paused?T.ora:T.lime,animation:paused?"none":"timerPulse 2s ease infinite"}}/>
              <span style={{fontSize:13,fontWeight:600,color:paused?T.ora:T.g3}}>{paused?"Paused":"Recording"}</span>
            </div>
            <span style={{fontSize:13,fontWeight:500,color:T.g4}}>{session.type}</span>
          </div>
        </div>

        {/* Current segment indicator */}
        {segments.length>1&&<div style={{padding:"12px 24px 0",flexShrink:0}}>
          <div style={{padding:"12px 16px",borderRadius:14,background:"rgba(255,255,255,.04)",border:"1px solid "+T.brd,animation:"segmentSlide .3s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,fontWeight:600,color:T.g4,textTransform:"uppercase",letterSpacing:".05em"}}>Current</span>
                <span style={{fontSize:14,fontWeight:700,color:T.lime}}>{curSeg.name}</span>
              </div>
              <span style={{fontSize:12,fontWeight:600,color:T.g3}}>{curSeg.pace} /km</span>
            </div>
            <div style={{height:3,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:(segProgress*100)+"%",background:T.lime,borderRadius:2,transition:"width .5s ease"}}/>
            </div>
            {segIdx<segments.length-1&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
              <span style={{fontSize:10,fontWeight:500,color:T.g4}}>Up next</span>
              <span style={{fontSize:12,fontWeight:600,color:T.g3}}>{segments[segIdx+1]?.name} · {segments[segIdx+1]?.km} km</span>
            </div>}
          </div>
        </div>}

        {/* Big timer - center */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
          <div style={{textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:4}}>
              <span style={{fontFamily:T.f,fontSize:56,fontWeight:300,color:T.g4,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{pad(h)}</span>
              <span style={{fontSize:14,fontWeight:500,color:T.g4,marginBottom:8,alignSelf:"flex-end"}}>h</span>
            </div>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:4,marginTop:-8}}>
              <span style={{fontFamily:T.f,fontSize:88,fontWeight:800,color:T.lime,letterSpacing:"-0.05em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{pad(m)}</span>
              <span style={{fontSize:16,fontWeight:500,color:T.lime,marginBottom:14,alignSelf:"flex-end"}}>m</span>
            </div>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:4,marginTop:-6}}>
              <span style={{fontFamily:T.f,fontSize:52,fontWeight:700,color:T.g2,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{pad(s)}</span>
              <span style={{fontSize:14,fontWeight:500,color:T.g3,marginBottom:6,alignSelf:"flex-end"}}>s</span>
            </div>
          </div>
        </div>

        {/* Metrics bar */}
        <div style={{padding:"0 24px",flexShrink:0}}>
          {/* Progress bar */}
          <div style={{height:3,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden",marginBottom:16}}>
            <div style={{height:"100%",width:(progress*100)+"%",background:T.lime,borderRadius:2,transition:"width 1s ease"}}/>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
            <div>
              <span style={{fontSize:11,fontWeight:500,color:T.g4,textTransform:"uppercase",letterSpacing:".04em"}}>Distance</span>
              <div style={{display:"flex",alignItems:"baseline",gap:3,marginTop:2}}>
                <span style={{fontFamily:T.f,fontSize:28,fontWeight:800,color:T.g1,fontVariantNumeric:"tabular-nums"}}>{distance.toFixed(2)}</span>
                <span style={{fontSize:13,fontWeight:500,color:T.g4}}>km</span>
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <span style={{fontSize:11,fontWeight:500,color:T.g4,textTransform:"uppercase",letterSpacing:".04em"}}>Pace</span>
              <div style={{display:"flex",alignItems:"baseline",gap:2,marginTop:2}}>
                <span style={{fontFamily:T.f,fontSize:28,fontWeight:800,color:T.g1,fontVariantNumeric:"tabular-nums"}}>{distance>0.05?paceMin+":"+pad(paceSec):"--"}</span>
                <span style={{fontSize:13,fontWeight:500,color:T.g4}}>/km</span>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:11,fontWeight:500,color:T.g4,textTransform:"uppercase",letterSpacing:".04em"}}>Heart Rate</span>
              <div style={{display:"flex",alignItems:"baseline",gap:3,marginTop:2,justifyContent:"flex-end"}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{animation:"hrPulse 1s ease infinite",marginBottom:2}}><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill={T.red}/></svg>
                <span style={{fontFamily:T.f,fontSize:28,fontWeight:800,color:T.g1,fontVariantNumeric:"tabular-nums"}}>{hr}</span>
                <span style={{fontSize:13,fontWeight:500,color:T.g4}}>bpm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{padding:"0 16px 44px",flexShrink:0}}>
          <div style={{display:"flex",gap:10}}>
            {/* Lap / Stop button */}
            <button onClick={()=>{if(paused)setShowStop(true);else{/* lap marker */}}} style={{flex:1,height:64,borderRadius:18,background:"rgba(255,255,255,.04)",border:"1.5px solid "+(paused?T.red+"66":T.lime+"44"),display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer"}}>
              {paused?(
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="2" fill={T.red}/></svg>
                  <span style={{fontSize:15,fontWeight:700,color:T.red}}>End</span>
                </>
              ):(
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke={T.lime} strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={T.lime} strokeWidth="2" strokeLinecap="round"/></svg>
                  <span style={{fontSize:15,fontWeight:600,color:T.lime}}>Lap</span>
                </>
              )}
            </button>

            {/* Pause / Resume */}
            <button onClick={()=>{setPaused(!paused);setShowStop(false);}} style={{flex:1,height:64,borderRadius:18,background:paused?T.lime:T.lime,border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"transform .12s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.95)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
              {paused?(
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="6,3 20,12 6,21" fill={T.black}/></svg>
                  <span style={{fontSize:16,fontWeight:800,color:T.black}}>Resume</span>
                </>
              ):(
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="1" fill={T.black}/><rect x="14" y="4" width="4" height="16" rx="1" fill={T.black}/></svg>
                  <span style={{fontSize:16,fontWeight:800,color:T.black}}>Pause</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stop confirmation overlay */}
      {showStop&&<div style={{position:"absolute",inset:0,zIndex:600,background:"rgba(0,0,0,.85)",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,animation:"sessionFadeIn .2s ease"}}>
        <span style={{fontSize:22,fontWeight:700,color:T.g1,marginBottom:8}}>End Session?</span>
        <span style={{fontSize:14,color:T.g3,textAlign:"center",marginBottom:32,lineHeight:1.5}}>You've covered {distance.toFixed(2)} km in {pad(m)}:{pad(s)}. Your session data will be saved.</span>
        <button onClick={()=>onStop({elapsed,distance})} style={{width:"100%",padding:18,borderRadius:16,background:T.red,border:"none",cursor:"pointer",marginBottom:10}}>
          <span style={{fontSize:16,fontWeight:700,color:T.w1}}>End & Save</span>
        </button>
        <button onClick={()=>{setShowStop(false);setPaused(false);}} style={{width:"100%",padding:18,borderRadius:16,background:"rgba(255,255,255,.06)",border:"1px solid "+T.brd,cursor:"pointer"}}>
          <span style={{fontSize:16,fontWeight:600,color:T.g2}}>Resume</span>
        </button>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════
// CELEBRATION OVERLAY
// ═══════════════════════════════════════
function CelebrationOverlay({session,onComplete}){
  const[phase,setPhase]=useState(0); // 0=check, 1=text, 2=fadeout
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),600);
    const t2=setTimeout(()=>setPhase(2),2200);
    const t3=setTimeout(()=>onComplete(),2800);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);

  return(
    <div style={{position:"absolute",inset:0,zIndex:900,background:T.black,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:phase>=2?"celebFadeOut .6s ease forwards":"fadeIn .2s ease both"}}>
      <Grain/>
      <div style={{position:"relative",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center"}}>
        {/* Outer ring burst */}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:140,height:140,pointerEvents:"none"}}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{position:"absolute",top:0,left:0}}>
            <circle cx="70" cy="70" r="60" fill="none" stroke={T.lime} strokeWidth="2" strokeDasharray="220" style={{animation:"celebRing 1s cubic-bezier(.34,1.56,.64,1) both",transformOrigin:"center"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid "+T.lime+"33",animation:"celebRing2 1.2s ease .2s both"}}/>
        </div>

        {/* Check circle */}
        <div style={{width:88,height:88,borderRadius:44,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center",animation:"celebCheck .7s cubic-bezier(.34,1.56,.64,1) both",boxShadow:"0 0 60px "+T.lime+"44, 0 0 120px "+T.lime+"22"}}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5.5 5.5L20 6" stroke={T.black} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {/* Text */}
        <div style={{marginTop:28,textAlign:"center",animation:"celebText 1s ease both"}}>
          <span style={{fontSize:22,fontWeight:800,color:T.g1,display:"block",letterSpacing:"-.03em"}}>{session.type}</span>
          <span style={{fontSize:14,fontWeight:500,color:T.lime,display:"block",marginTop:6,letterSpacing:".04em"}}>Logged ✓</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DEBRIEF SESSION SCREEN
// ═══════════════════════════════════════
const FEELING_OPTIONS=[
  {emoji:"🔥",label:"Amazing",value:"amazing",desc:"Felt strong the whole way"},
  {emoji:"👍",label:"Good",value:"good",desc:"Solid effort, nothing special"},
  {emoji:"😐",label:"Okay",value:"okay",desc:"Got it done, that's what counts"},
  {emoji:"😮‍💨",label:"Tough",value:"tough",desc:"Harder than expected"},
  {emoji:"🥵",label:"Brutal",value:"brutal",desc:"Really struggled today"},
];
const DEBRIEF_PILLS=["Legs felt heavy","Breathing was easy","Side stitch","Felt fast","Needed more rest","Perfect weather","Too hot","Had to walk"];

function DebriefScreen({session,elapsedTime,distanceCovered,onDone}){
  const[ph,setPh]=useState(0);
  const[feeling,setFeeling]=useState(null);
  const[noteText,setNoteText]=useState("");
  const[selectedPills,setSelectedPills]=useState([]);
  const[submitted,setSubmitted]=useState(false);
  const[coachReply,setCoachReply]=useState(false);
  const[recording,setRecording]=useState(false);
  const[recTime,setRecTime]=useState(0);
  const[celebrating,setCelebrating]=useState(false);
  const scrollRef=useRef(null);

  const coachMsg=feeling==="amazing"||feeling==="good"
    ?"That's what I like to see. You showed up, you executed, and you earned every meter. Keep stacking days like this and the race will take care of itself."
    :feeling==="tough"||feeling==="brutal"
    ?"Hey — the hard days are where the real work happens. The fact that you got out there and finished says more than any split time. I'm going to dial things back a touch for the next couple of sessions. Trust the process."
    :"You showed up. That's the hardest part and you did it. Not every run needs to feel great — some just need to get done. I'll take it from here.";
  const coachStream=useStream(coachMsg,22,300,submitted);

  useEffect(()=>{setTimeout(()=>setPh(1),500);},[]);
  useEffect(()=>{if(feeling)setTimeout(()=>setPh(2),400);},[feeling]);
  useEffect(()=>{if(coachStream.done)setTimeout(()=>setCoachReply(true),300);},[coachStream.done]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[ph,submitted,coachReply]);

  // Voice recording timer
  useEffect(()=>{
    if(!recording)return;
    setRecTime(0);
    const iv=setInterval(()=>setRecTime(t=>t+1),1000);
    return()=>clearInterval(iv);
  },[recording]);

  const handleSubmit=()=>{setSubmitted(true);};
  const togglePill=(p)=>{setSelectedPills(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p]);};
  const handleVoiceDone=()=>{setRecording(false);setNoteText("Legs felt heavier than usual on the last km. Might need more sleep.");};

  const et=elapsedTime||0;
  const eM=Math.floor(et/60);const eS=et%60;
  const dist=distanceCovered||0;
  const avgPace=dist>0.05?et/60/dist:0;
  const pM=Math.floor(avgPace);const pS=Math.floor((avgPace-pM)*60);

  return(
    <div style={{position:"absolute",inset:0,zIndex:500,background:T.black,animation:"debriefIn .5s ease both"}}>
      <Grain/>
      <div ref={scrollRef} style={{position:"absolute",inset:0,zIndex:10,overflow:"auto"}}>

        {/* Dark hero header */}
        <div style={{padding:"62px 24px 28px",background:T.black}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:28,height:28,borderRadius:14,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={T.black} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontSize:15,fontWeight:600,color:T.lime}}>Session Complete</span>
          </div>
          <span style={{fontSize:30,fontWeight:800,color:T.g1,display:"block",letterSpacing:"-.04em",lineHeight:1.1}}>{session.type}</span>
          <span style={{fontSize:14,color:T.g3,display:"block",marginTop:6}}>Today · {session.zone} · {session.km} km</span>

          {/* Stats row */}
          <div style={{display:"flex",gap:8,marginTop:18}}>
            {[
              {label:"Time",value:eM+":"+eS.toString().padStart(2,"0")},
              {label:"Distance",value:dist.toFixed(2),unit:"km"},
              {label:"Avg Pace",value:dist>0.05?pM+":"+pS.toString().padStart(2,"0"):"--",unit:"/km"},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,padding:"12px 10px",borderRadius:14,background:"rgba(255,255,255,.04)",border:"1px solid "+T.brd,textAlign:"center",animation:"springUp .4s ease "+(i*.06)+"s both"}}>
                <span style={{fontSize:10,fontWeight:500,color:T.g4,textTransform:"uppercase",letterSpacing:".04em",display:"block",marginBottom:4}}>{s.label}</span>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:2}}>
                  <span style={{fontFamily:T.f,fontSize:18,fontWeight:700,color:T.g1}}>{s.value}</span>
                  {s.unit&&<span style={{fontSize:11,fontWeight:500,color:T.g4}}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Light content area */}
        <div style={{background:T.w2,borderRadius:"28px 28px 0 0",minHeight:500,marginTop:-4}}>
          <div style={{padding:"24px 16px 48px"}}>

            {/* Feeling question */}
            {ph>=1&&!submitted&&<div style={{marginBottom:20,animation:"springUp .5s ease both"}}>
              <span style={{fontSize:20,fontWeight:700,color:T.wText,display:"block",marginBottom:14}}>How did that feel?</span>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {FEELING_OPTIONS.map((f,i)=>{
                  const sel=feeling===f.value;
                  return(
                    <button key={f.value} onClick={()=>setFeeling(f.value)} style={{width:"100%",padding:"14px 16px",borderRadius:14,cursor:"pointer",border:"1px solid "+(sel?T.lime+"66":T.wBrd),background:sel?"rgba(200,255,0,.06)":T.w1,display:"flex",alignItems:"center",gap:14,animation:"springUp .45s ease "+(i*.04)+"s both",transition:"border-color .2s ease, background .2s ease"}}>
                      <span style={{fontSize:22}}>{f.emoji}</span>
                      <div style={{flex:1,textAlign:"left"}}>
                        <span style={{fontSize:15,fontWeight:600,color:sel?T.wText:T.wSub,display:"block"}}>{f.label}</span>
                        <span style={{fontSize:12,color:T.wMute,marginTop:1,display:"block"}}>{f.desc}</span>
                      </div>
                      {sel&&<div style={{width:22,height:22,borderRadius:11,background:T.wText,display:"flex",alignItems:"center",justifyContent:"center",animation:"checkPop .25s ease"}}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>}
                    </button>
                  );
                })}
              </div>
            </div>}

            {/* Quick tags + open note */}
            {ph>=2&&!submitted&&<div style={{marginBottom:24,animation:"springUp .5s ease both"}}>
              <span style={{fontSize:16,fontWeight:600,color:T.wText,display:"block",marginBottom:10}}>Anything else to note?</span>

              {/* Pills */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {DEBRIEF_PILLS.map((p,i)=>{
                  const active=selectedPills.includes(p);
                  return(
                    <button key={i} onClick={()=>togglePill(p)} style={{padding:"8px 14px",borderRadius:20,border:"1px "+(active?"solid":"dashed")+" "+(active?T.lime+"66":T.wBrd),background:active?"rgba(200,255,0,.06)":T.w1,color:active?T.wText:T.wSub,fontFamily:T.f,fontSize:13,cursor:"pointer",animation:"fadeIn .3s ease "+(i*.03)+"s both",transition:"all .15s ease"}}>
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Voice recorder mode */}
              {recording?<div style={{padding:20,borderRadius:18,border:"1px solid "+T.lime+"44",background:"rgba(200,255,0,.04)",animation:"springUp .4s ease both"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                  <span style={{fontSize:12,fontWeight:600,color:T.wText,letterSpacing:".04em"}}>Listening...</span>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,height:40,marginBottom:14}}>
                  {Array.from({length:24},(_,i)=>(
                    <div key={i} style={{width:3,borderRadius:2,background:T.lime,animation:"waveform "+(0.4+Math.random()*0.4)+"s ease "+(i*0.04)+"s infinite alternate",opacity:.7,minHeight:4,height:"30%"}}/>
                  ))}
                </div>
                <div style={{textAlign:"center",marginBottom:14}}>
                  <span style={{fontFamily:T.f,fontSize:20,fontWeight:600,color:T.wText}}>{Math.floor(recTime/60)}:{String(recTime%60).padStart(2,"0")}</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setRecording(false)} style={{flex:1,padding:12,borderRadius:12,border:"1px solid "+T.wBrd,background:T.w1,color:T.wSub,fontFamily:T.f,fontSize:14,cursor:"pointer"}}>Cancel</button>
                  <button onClick={handleVoiceDone} style={{flex:1,padding:12,borderRadius:12,border:"none",background:T.wText,color:T.w1,fontFamily:T.f,fontSize:14,fontWeight:600,cursor:"pointer"}}>Done</button>
                </div>
              </div>:(
              /* Freeform text input */
              <div style={{borderRadius:18,border:"1px solid "+T.wBrd,background:T.w1,overflow:"hidden"}}>
                <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Or type something..." rows={3} style={{width:"100%",padding:"16px 18px 8px",background:"none",border:"none",color:T.wText,fontFamily:T.f,fontSize:15,lineHeight:1.55,resize:"none"}}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 14px 12px"}}>
                  <button onClick={()=>setRecording(true)} style={{width:36,height:36,borderRadius:12,background:T.w3,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill={T.wMute}/><path d="M19 10v2a7 7 0 01-14 0v-2" stroke={T.wMute} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke={T.wMute} strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:10,color:T.wMute}}>{noteText.length}</span>
                    {noteText.trim()&&<div style={{width:32,height:32,borderRadius:10,background:T.wText,display:"flex",alignItems:"center",justifyContent:"center",animation:"scaleIn .2s ease both",cursor:"pointer"}}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L13 8M13 8L9 4M13 8L9 12" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>}
                  </div>
                </div>
              </div>)}

              {/* Submit button */}
              <button onClick={handleSubmit} style={{width:"100%",padding:"18px 24px",borderRadius:16,border:"none",background:T.wText,color:T.w1,fontFamily:T.f,fontSize:16,fontWeight:700,cursor:"pointer",marginTop:14,animation:"springUp .5s ease .1s both",transition:"transform .12s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onMouseDown={e=>e.currentTarget.style.transform="scale(.975)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                Save & Wrap Up
              </button>
              <button onClick={()=>{setSubmitted(true);}} style={{width:"100%",padding:"14px",background:"none",border:"none",color:T.wMute,fontFamily:T.f,fontSize:14,cursor:"pointer",marginTop:2}}>Skip — just save</button>
            </div>}

            {/* Coach response after submit */}
            {submitted&&<div style={{animation:"springUp .5s ease both"}}>

              {/* Big coach card */}
              <div style={{padding:"24px 22px",borderRadius:22,background:T.wText,marginBottom:16,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:120,height:120,background:"radial-gradient(circle at top right, "+T.lime+"18, transparent 70%)",pointerEvents:"none"}}/>
                <div style={{position:"relative",zIndex:2}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <div style={{width:28,height:28,borderRadius:14,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:13,fontWeight:800,color:T.black}}>C</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.5)"}}>Coach</span>
                  </div>
                  <p style={{fontSize:17,fontWeight:400,color:T.g1,lineHeight:1.6,letterSpacing:"-.01em"}}>{coachStream.displayed}{!coachStream.done&&coachStream.started&&<Blink c={T.lime}/>}</p>
                </div>
              </div>

              {/* Session recorded summary */}
              {coachReply&&<div style={{padding:"16px 18px",borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:16,animation:"springUp .4s ease both"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={T.barHigh} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{fontSize:12,fontWeight:600,color:T.barHigh}}>Logged</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {feeling&&<div style={{padding:"6px 12px",borderRadius:10,background:"rgba(168,217,0,.08)",border:"1px solid rgba(168,217,0,.15)"}}><span style={{fontSize:12,fontWeight:500,color:T.wText}}>{FEELING_OPTIONS.find(f=>f.value===feeling)?.emoji} {FEELING_OPTIONS.find(f=>f.value===feeling)?.label}</span></div>}
                  {selectedPills.map((p,i)=><div key={i} style={{padding:"6px 12px",borderRadius:10,background:T.w3}}><span style={{fontSize:12,fontWeight:500,color:T.wSub}}>{p}</span></div>)}
                  {noteText.trim()&&<div style={{padding:"6px 12px",borderRadius:10,background:T.w3}}><span style={{fontSize:12,fontWeight:500,color:T.wSub}}>💬 Note added</span></div>}
                </div>
              </div>}

              {coachReply&&<button onClick={()=>setCelebrating(true)} style={{width:"100%",padding:"18px 24px",borderRadius:16,border:"none",background:T.wText,color:T.w1,fontFamily:T.f,fontSize:16,fontWeight:700,cursor:"pointer",animation:"springUp .5s ease .2s both",transition:"transform .12s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onMouseDown={e=>e.currentTarget.style.transform="scale(.975)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                Done
              </button>}
            </div>}
          </div>
        </div>

        {/* Celebration overlay */}
        {celebrating&&<CelebrationOverlay session={session} onComplete={onDone}/>}
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
      {/* collapsed bar */}
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
          {/* Calendar */}
          <div style={{padding:"22px 16px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 4px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span style={{fontSize:20,fontWeight:700,color:T.wText}}>February</span>
                <span style={{fontSize:20,fontWeight:300,color:T.wMute}}>2026</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:500,color:T.wMute}}>Week 4 of 10</span>
                <span style={{fontSize:12,fontWeight:600,color:T.barHigh}}>Build</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {DAYS.map((day,i)=>{
                const isT=i===TODAY,isSel=i===sel,s=PLAN[i];
                return(
                  <button key={day} onClick={()=>setSel(i)} style={{padding:"8px 2px 10px",borderRadius:14,cursor:"pointer",border:isSel?"2px solid "+T.wText:isT?"2px solid "+T.lime:"2px solid transparent",background:isSel?T.w1:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <span style={{fontSize:11,fontWeight:500,color:isSel?T.wText:T.wMute}}>{day}</span>
                    <span style={{fontSize:20,fontWeight:isT?700:500,color:isT||isSel?T.wText:T.wSub,lineHeight:1.2}}>{DATES[i]}</span>
                    <div style={{width:6,height:6,borderRadius:3,background:s.done?T.lime:bc(s),opacity:s.done?1:.4,marginTop:2}}/>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{height:1,background:T.wBrd,margin:"0 20px"}}/>

          <div style={{padding:"16px 16px 0"}}>
            <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:8,letterSpacing:".05em",textTransform:"uppercase"}}>Today</span>
            <div onClick={()=>onOpenSession(TODAY)} style={{borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,.04)",cursor:"pointer",transition:"transform .15s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              {/* Coach quote */}
              <div style={{margin:"14px 14px 0",padding:"18px 20px",borderRadius:16,background:T.lime,position:"relative",overflow:"hidden"}}>
                <div style={{position:"relative",zIndex:2}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                    <div style={{width:7,height:7,borderRadius:4,background:T.black,opacity:.25,animation:cs.done?"none":"pulseGlow 1.5s ease infinite"}}/>
                    <span style={{fontSize:11,fontWeight:600,color:"rgba(0,0,0,.4)"}}>Coach</span>
                  </div>
                  <p style={{fontSize:15,fontWeight:500,color:T.black,lineHeight:1.55}}>{cs.displayed}{!cs.done&&cs.started&&<Blink/>}</p>
                </div>
              </div>
              {/* Session */}
              <div style={{padding:"16px 18px 18px"}}>
                <div style={{display:"flex",gap:14}}>
                  <div style={{width:4,borderRadius:2,flexShrink:0,background:bc(today)}}/>
                  <div style={{flex:1}}>
                    <span style={{fontSize:12,fontWeight:500,color:T.wMute}}>Thu, Feb 20 · {today.dur}</span>
                    <span style={{fontSize:22,fontWeight:700,color:T.wText,display:"block",letterSpacing:"-.02em",lineHeight:1.2,marginTop:3}}>{today.type}</span>
                    <span style={{fontSize:13,color:T.wSub,display:"block",marginTop:4}}>{today.zone} · {today.km} km</span>
                    <p style={{fontSize:14,color:T.wMute,lineHeight:1.5,marginTop:8}}>{today.desc}</p>
                  </div>
                </div>
                <div style={{marginTop:16,padding:"14px 20px",borderRadius:14,background:T.wText,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill={T.lime}/></svg>
                  <span style={{fontSize:15,fontWeight:600,color:T.w1}}>Start Session</span>
                </div>
              </div>
            </div>

            <div style={{marginTop:20}}>
              <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:8,letterSpacing:".05em",textTransform:"uppercase"}}>Coming Up</span>
              {up.map((s,i)=><SmallCard key={i} session={s} dayIdx={s.idx} delay={i*.04} onTap={()=>onOpenSession(s.idx)}/>)}
            </div>

            <div style={{display:"flex",gap:8,marginTop:16}}>
              <div style={{flex:2,padding:"14px 16px",borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd}}>
                <span style={{fontSize:11,fontWeight:500,color:T.wMute,display:"block",marginBottom:6}}>Volume</span>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:24,fontWeight:700,color:T.wText}}>24.7</span>
                  <span style={{fontSize:13,color:T.wMute}}>/ 57.2 km</span>
                </div>
                <div style={{height:3,background:T.w3,borderRadius:2,marginTop:8,overflow:"hidden"}}><div style={{height:"100%",width:"43%",background:T.lime,borderRadius:2}}/></div>
              </div>
              <div style={{width:90,padding:14,borderRadius:16,background:T.wText,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:28,fontWeight:800,color:T.lime,lineHeight:1}}>12</span>
                <span style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,.45)",marginTop:3}}>day streak</span>
              </div>
            </div>
            <div style={{height:120}}/>
          </div>
        </div>
      </div>
      <EditPlanFAB/>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 2 - COACH
// ═══════════════════════════════════════
const INIT_MSGS=[
  {role:"coach",text:"Good morning! I see you nailed those 800m repeats yesterday - your splits were very consistent. How are your legs feeling today?"},
  {role:"user",text:"Legs feel okay, a bit tight in the calves. Was thinking of pushing harder today - maybe a tempo instead of easy?"},
  {role:"coach",text:"I appreciate the motivation, but I'd advise against it. Your cumulative load is already high:"},
  {role:"tool",title:"Training Load",data:{acute:312,chronic:265,ratio:1.18,note:"AC ratio 1.18 - caution zone."}},
  {role:"coach",text:"Your acute:chronic ratio is in the caution zone. Today's easy run lets you absorb the work. Trust the process."},
];
const REPLIES=[
  "Based on your current load, I'd recommend keeping intensity moderate this week. We can push harder in Week 5.",
  "Let me adjust - I'll swap Friday's rest with an easy 5km so you stay active without adding stress.",
  "Your recovery has been solid. We could add 1km to Sunday's long run if you're feeling strong by Saturday.",
  "I'll add a fartlek section - it keeps things fun while building speed endurance.",
];

function ToolCard({msg}){
  const d=msg.data;
  return(
    <div style={{margin:"6px 0 12px"}}>
      <div style={{borderRadius:18,overflow:"hidden",border:"1.5px solid "+T.lime,background:T.w1}}>
        <div style={{background:T.lime,padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:22,height:22,borderRadius:7,background:"rgba(0,0,0,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={T.black} strokeWidth="1.5"/><path d="M8 5v3l2 1.5" stroke={T.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:T.black}}>{msg.title}</span>
        </div>
        <div style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            {[{l:"Acute",v:d.acute,c:T.wText},{l:"Chronic",v:d.chronic,c:T.wText},{l:"Ratio",v:d.ratio,c:T.ora}].map((x,j)=>(
              <div key={j}><span style={{fontSize:11,color:T.wMute,display:"block"}}>{x.l}</span><span style={{fontSize:20,fontWeight:700,color:x.c}}>{x.v}</span></div>
            ))}
          </div>
          <div style={{padding:"8px 12px",borderRadius:10,background:"rgba(255,149,0,.08)",border:"1px solid rgba(255,149,0,.15)"}}>
            <span style={{fontSize:12,fontWeight:500,color:T.ora}}>{d.note}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachTab(){
  const[msgs,setMsgs]=useState(INIT_MSGS);
  const[inputVal,setInputVal]=useState("");
  const[typing,setTyping]=useState(false);
  const[rec,setRec]=useState(false);
  const[transcript,setTranscript]=useState("");
  const scrollRef=useRef(null);
  const ri=useRef(0);

  useEffect(()=>{
    if(scrollRef.current)setTimeout(()=>{scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},50);
  },[msgs,typing]);

  useEffect(()=>{
    if(!rec)return;
    setTranscript("");let idx=0;
    const txt="Can we swap tomorrow's rest for an easy run";
    const iv=setInterval(()=>{
      if(idx<txt.length){idx=Math.min(idx+Math.floor(Math.random()*3)+1,txt.length);setTranscript(txt.slice(0,idx));}
      else clearInterval(iv);
    },80);
    return()=>clearInterval(iv);
  },[rec]);

  const send=useCallback((text)=>{
    if(!text||!text.trim())return;
    setMsgs(prev=>[...prev,{role:"user",text:text.trim()}]);
    setInputVal("");setTyping(true);
    const reply=REPLIES[ri.current%REPLIES.length];
    ri.current++;
    setTimeout(()=>{setTyping(false);setMsgs(prev=>[...prev,{role:"coach",text:reply}]);},1200+Math.random()*800);
  },[]);

  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:T.black,padding:"62px 24px 18px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <span style={{fontSize:24,fontWeight:700,color:T.g1,letterSpacing:"-.03em"}}>Coach</span>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
              <div style={{width:6,height:6,borderRadius:3,background:typing?T.ora:T.lime}}/>
              <span style={{fontSize:12,color:T.g3}}>{typing?"Typing...":"Online · Week 4 Build"}</span>
            </div>
          </div>
          <div style={{padding:"7px 14px",borderRadius:14,background:T.card,border:"1px solid "+T.brd}}>
            <span style={{fontSize:12,fontWeight:500,color:T.g3}}>Context</span>
          </div>
        </div>
      </div>

      <div style={{flex:1,background:T.w2,borderRadius:"28px 28px 0 0",marginTop:-4,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div ref={scrollRef} style={{flex:1,overflow:"auto",padding:"20px 16px 10px"}}>
          {msgs.map((m,i)=>{
            if(m.role==="tool")return <ToolCard key={i} msg={m}/>;
            const isC=m.role==="coach";
            return(
              <div key={i} style={{display:"flex",justifyContent:isC?"flex-start":"flex-end",marginBottom:10,animation:"msgIn .3s ease both"}}>
                <div style={{maxWidth:"82%",padding:"14px 16px",borderRadius:isC?"18px 18px 18px 6px":"18px 18px 6px 18px",background:isC?T.w1:T.wText,border:isC?"1px solid "+T.wBrd:"none"}}>
                  {isC&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><div style={{width:5,height:5,borderRadius:3,background:T.lime}}/><span style={{fontSize:10,fontWeight:600,color:T.wMute}}>Coach</span></div>}
                  <p style={{fontSize:14,color:isC?T.wText:T.w1,lineHeight:1.55}}>{m.text}</p>
                </div>
              </div>
            );
          })}
          {typing&&<div style={{display:"flex",justifyContent:"flex-start",marginBottom:10}}><div style={{padding:"14px 18px",borderRadius:"18px 18px 18px 6px",background:T.w1,border:"1px solid "+T.wBrd,display:"flex",alignItems:"center",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:3,background:T.wMute,animation:"typingDot 1.2s ease "+i*.2+"s infinite"}}/>)}</div></div>}
        </div>

        <div style={{padding:"0 16px 32px",background:T.w2,borderTop:"1px solid "+T.wBrd}}>
          {rec&&transcript&&(
            <div style={{padding:"12px 16px",marginBottom:6,marginTop:10,borderRadius:14,background:T.w1,border:"1px solid "+T.wBrd}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <div style={{width:5,height:5,borderRadius:3,background:T.red,animation:"pulseGlow 1s ease infinite"}}/>
                <span style={{fontSize:10,fontWeight:600,color:T.wMute}}>Live transcription</span>
              </div>
              <p style={{fontSize:14,color:T.wText,lineHeight:1.5}}>{transcript}<Blink c={T.wText}/></p>
            </div>
          )}
          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:rec?0:10}}>
            {!rec?(
              <>
                <div style={{flex:1,display:"flex",alignItems:"center",borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd,overflow:"hidden"}}>
                  <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send(inputVal);}} placeholder="Ask your coach..." style={{flex:1,padding:"12px 16px",fontFamily:T.f,fontSize:14,color:T.wText,border:"none",outline:"none",background:"transparent"}}/>
                </div>
                <button onClick={()=>setRec(true)} style={{width:42,height:42,borderRadius:14,background:T.w1,border:"1px solid "+T.wBrd,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill={T.wMute}/><path d="M19 10v2a7 7 0 01-14 0v-2" stroke={T.wMute} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke={T.wMute} strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <button onClick={()=>send(inputVal)} style={{width:42,height:42,borderRadius:14,background:inputVal.trim()?T.wText:T.w3,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"background .15s"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke={inputVal.trim()?T.lime:T.wMute} strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={inputVal.trim()?T.lime:T.wMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </>
            ):(
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>{setRec(false);setTranscript("");}} style={{width:42,height:42,borderRadius:14,background:T.w1,border:"1px solid "+T.wBrd,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke={T.wMute} strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:2,height:42,padding:"0 8px",borderRadius:14,background:"rgba(255,90,90,.06)",border:"1px solid rgba(255,90,90,.12)"}}>
                  {Array.from({length:20},(_,i)=><div key={i} style={{width:3,borderRadius:2,background:T.red,animation:"waveform "+(0.4+Math.random()*0.4)+"s ease "+(i*0.04)+"s infinite alternate",opacity:.7,minHeight:4,height:"30%"}}/>)}
                </div>
                <button onClick={()=>{send(transcript);setRec(false);setTranscript("");}} style={{width:42,height:42,borderRadius:14,background:T.wText,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke={T.lime} strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 3 - ANALYTICS
// ═══════════════════════════════════════
const VOL=[32,38,41,36,45,48,52,44,57,24.7];
const PACE=[5.45,5.38,5.30,5.32,5.22,5.18,5.15,5.20,5.10,5.12];
const WK_KM=[8.5,6.0,10.2,7.0,0,9.0,16.5];
const WK_Z=[{z2:30,z3:0,z4:70},{z2:100,z3:0,z4:0},{z2:20,z3:10,z4:70},{z2:100,z3:0,z4:0},{z2:0,z3:0,z4:0},{z2:30,z3:40,z4:30},{z2:70,z3:20,z4:10}];

function Histogram({data,labels,maxVal,accentIdx}){
  const[a,setA]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setA(true),500);return()=>clearTimeout(t);},[]);
  const mx=maxVal||Math.max(...data)*1.2;
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:124,padding:"0 2px"}}>
      {data.map((v,i)=>{
        const h=v>0?Math.max(6,(v/mx)*100):4;
        const isA=i===accentIdx;
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <div style={{width:"100%",height:100,display:"flex",alignItems:"flex-end",position:"relative"}}>
              <div style={{width:"100%",height:a?h:0,borderRadius:6,background:v===0?T.w3:isA?T.lime:T.w3,transition:"height .6s cubic-bezier(.4,0,.2,1) "+i*.06+"s"}}/>
              {v>0&&a&&<div style={{position:"absolute",bottom:h+6,left:0,right:0,textAlign:"center",fontSize:10,fontWeight:isA?700:400,color:isA?T.wText:T.wMute}}>{v}</div>}
            </div>
            <span style={{fontSize:10,fontWeight:isA?700:400,color:isA?T.wText:T.wMute}}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function StackedHist({data,labels,accentIdx}){
  const[a,setA]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setA(true),600);return()=>clearTimeout(t);},[]);
  const H=90;
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:H+24,padding:"0 2px"}}>
      {data.map((d,i)=>{
        const tot=d.z2+d.z3+d.z4;const isA=i===accentIdx;
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <div style={{width:"100%",height:H,display:"flex",flexDirection:"column",justifyContent:"flex-end",gap:1.5}}>
              {tot===0?<div style={{width:"100%",height:4,borderRadius:6,background:T.w3}}/>:<>
                <div style={{width:"100%",height:a?(d.z4/100)*H:0,borderRadius:"6px 6px 0 0",background:isA?T.lime:T.barHigh,opacity:isA?1:.6,transition:"height .6s cubic-bezier(.4,0,.2,1) "+i*.06+"s"}}/>
                <div style={{width:"100%",height:a?(d.z3/100)*H:0,background:isA?"rgba(200,255,0,.5)":T.barEasy,opacity:isA?1:.5,transition:"height .6s cubic-bezier(.4,0,.2,1) "+(i*.06+.05)+"s"}}/>
                <div style={{width:"100%",height:a?(d.z2/100)*H:0,borderRadius:"0 0 6px 6px",background:isA?"rgba(200,255,0,.25)":T.barRest,opacity:isA?1:.4,transition:"height .6s cubic-bezier(.4,0,.2,1) "+(i*.06+.1)+"s"}}/>
              </>}
            </div>
            <span style={{fontSize:10,fontWeight:isA?700:400,color:isA?T.wText:T.wMute}}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function VolChart({data,an}){
  const W=326,H=120,pt=8,pb=20,cH=H-pt-pb,mx=Math.max(...data)*1.15;
  const pts=data.map((v,i)=>({x:(i/(data.length-1))*W,y:pt+cH-(v/mx)*cH}));
  const ln=pts.map((p,i)=>(i===0?"M":"L")+p.x+","+p.y).join(" ");
  const ar=ln+" L"+pts[pts.length-1].x+","+(H-pb)+" L"+pts[0].x+","+(H-pb)+" Z";
  return(
    <svg width={W} height={H} viewBox={"0 0 "+W+" "+H}>
      <defs><linearGradient id="vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.lime} stopOpacity=".25"/><stop offset="100%" stopColor={T.lime} stopOpacity=".02"/></linearGradient></defs>
      {[0,.25,.5,.75,1].map(r=><line key={r} x1={0} x2={W} y1={pt+cH*(1-r)} y2={pt+cH*(1-r)} stroke={T.wBrd} strokeWidth="1"/>)}
      <path d={ar} fill="url(#vf)" style={{opacity:an?1:0,transition:"opacity .8s ease"}}/>
      <path d={ln} fill="none" stroke={T.lime} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:600,strokeDashoffset:an?0:600,transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)"}}/>
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={T.lime} style={{opacity:an?1:0,transition:"opacity .5s ease 1.2s"}}/>
      {data.map((_,i)=><text key={i} x={pts[i].x} y={H-4} textAnchor="middle" style={{fontFamily:T.f,fontSize:9,fill:i===data.length-1?T.wText:T.wMute,fontWeight:i===data.length-1?700:400}}>{"W"+(i+1)}</text>)}
    </svg>
  );
}

function PaceChart({data,an}){
  const W=326,H=100,pt=8,pb=20,cH=H-pt-pb,mn=Math.min(...data)-.1,mx=Math.max(...data)+.1;
  const pts=data.map((v,i)=>({x:(i/(data.length-1))*W,y:pt+((v-mn)/(mx-mn))*cH}));
  const ln=pts.map((p,i)=>(i===0?"M":"L")+p.x+","+p.y).join(" ");
  return(
    <svg width={W} height={H} viewBox={"0 0 "+W+" "+H}>
      {[0,.5,1].map(r=><line key={r} x1={0} x2={W} y1={pt+cH*r} y2={pt+cH*r} stroke={T.wBrd} strokeWidth="1"/>)}
      <path d={ln} fill="none" stroke={T.barRest} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:600,strokeDashoffset:an?0:600,transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1) .2s"}}/>
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={T.barRest} style={{opacity:an?1:0,transition:"opacity .5s ease 1.4s"}}/>
      {data.map((_,i)=><text key={i} x={pts[i].x} y={H-4} textAnchor="middle" style={{fontFamily:T.f,fontSize:9,fill:i===data.length-1?T.wText:T.wMute,fontWeight:i===data.length-1?700:400}}>{"W"+(i+1)}</text>)}
    </svg>
  );
}

function AnalyticsTab(){
  const[an,setAn]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAn(true),400);return()=>clearTimeout(t);},[]);
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{background:T.black,padding:"62px 24px 18px",flexShrink:0}}>
        <span style={{fontSize:24,fontWeight:700,color:T.g1,letterSpacing:"-.03em"}}>Analytics</span>
        <span style={{fontSize:13,color:T.g4,display:"block",marginTop:4}}>10-week half marathon plan</span>
      </div>
      <div style={{flex:1,background:T.w2,borderRadius:"28px 28px 0 0",marginTop:-4,overflow:"auto"}}>
        <div style={{padding:"22px 16px 120px"}}>
          {/* Plan progress */}
          <div style={{padding:18,borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:12}}>
            <span style={{fontSize:11,fontWeight:600,color:T.wMute,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:12}}>Plan Progress</span>
            <div style={{display:"flex",gap:3,marginBottom:12}}>
              {Array.from({length:10},(_,i)=>{
                const done=i<4,cur=i===3,pc=i<5?T.barHigh:i<8?T.lime:i<9?T.barRest:T.red;
                return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{width:"100%",height:6,borderRadius:3,background:done?pc:T.w3,opacity:done?1:.4,position:"relative"}}>
                      {cur&&<div style={{position:"absolute",top:-3,right:-1,width:12,height:12,borderRadius:6,background:T.lime,border:"3px solid "+T.w1}}/>}
                    </div>
                    <span style={{fontSize:9,fontWeight:cur?700:400,color:cur?T.wText:T.wMute}}>{i+1}</span>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:12}}>
              {[{l:"Build",c:T.barHigh},{l:"Peak",c:T.lime},{l:"Taper",c:T.barRest},{l:"Race",c:T.red}].map(pp=>(
                <div key={pp.l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:4,borderRadius:2,background:pp.c}}/><span style={{fontSize:10,color:T.wMute}}>{pp.l}</span></div>
              ))}
            </div>
          </div>

          {/* Volume + Streak */}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:2,padding:"16px 18px",borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd}}>
              <span style={{fontSize:11,fontWeight:500,color:T.wMute,display:"block",marginBottom:8}}>Weekly Volume</span>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:28,fontWeight:800,color:T.wText}}>24.7</span>
                <span style={{fontSize:13,color:T.wMute}}>/ 57.2 km</span>
              </div>
              <div style={{height:4,background:T.w3,borderRadius:2,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:"43%",background:T.lime,borderRadius:2}}/></div>
              <span style={{fontSize:11,color:T.barHigh,marginTop:6,display:"block"}}>+8% vs last week</span>
            </div>
            <div style={{width:100,padding:16,borderRadius:20,background:T.wText,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:36,fontWeight:800,color:T.lime,lineHeight:1}}>12</span>
              <span style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,.4)",marginTop:4}}>day streak</span>
              <div style={{display:"flex",gap:2,marginTop:8}}>{[1,1,1,1,1,0,0].map((v,i)=><div key={i} style={{width:6,height:6,borderRadius:3,background:v?T.lime:"rgba(255,255,255,.15)"}}/>)}</div>
            </div>
          </div>

          {/* Daily KM histogram */}
          <div style={{padding:18,borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <span style={{fontSize:11,fontWeight:600,color:T.wMute,letterSpacing:".05em",textTransform:"uppercase"}}>This Week · Daily KM</span>
                <div style={{display:"flex",alignItems:"baseline",gap:4,marginTop:4}}>
                  <span style={{fontSize:24,fontWeight:800,color:T.wText}}>57.2</span>
                  <span style={{fontSize:13,color:T.wMute}}>km planned</span>
                </div>
              </div>
              <div style={{padding:"5px 10px",borderRadius:8,background:T.w3}}><span style={{fontSize:12,fontWeight:500,color:T.wSub}}>W4</span></div>
            </div>
            <Histogram data={WK_KM} labels={DAYS} maxVal={18} accentIdx={TODAY}/>
          </div>

          {/* Zone stacked histogram */}
          <div style={{padding:18,borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:11,fontWeight:600,color:T.wMute,letterSpacing:".05em",textTransform:"uppercase"}}>Zone Split · Daily</span>
              <div style={{display:"flex",gap:8}}>
                {[{l:"Z4-5",c:T.barHigh},{l:"Z3",c:T.barEasy},{l:"Z2",c:T.barRest}].map(r=>(
                  <div key={r.l} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:6,height:6,borderRadius:2,background:r.c}}/><span style={{fontSize:9,color:T.wMute}}>{r.l}</span></div>
                ))}
              </div>
            </div>
            <StackedHist data={WK_Z} labels={DAYS} accentIdx={TODAY}/>
          </div>

          {/* Volume line chart */}
          <div style={{padding:18,borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <span style={{fontSize:11,fontWeight:600,color:T.wMute,letterSpacing:".05em",textTransform:"uppercase"}}>Volume Over Time</span>
              <div style={{padding:"5px 10px",borderRadius:8,background:"rgba(168,217,0,.1)"}}><span style={{fontSize:12,fontWeight:600,color:T.barHigh}}>+8%</span></div>
            </div>
            <VolChart data={VOL} an={an}/>
          </div>

          {/* Pace line */}
          <div style={{padding:18,borderRadius:20,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <span style={{fontSize:11,fontWeight:600,color:T.wMute,letterSpacing:".05em",textTransform:"uppercase"}}>Avg Pace Trend</span>
              <div style={{padding:"5px 10px",borderRadius:8,background:"rgba(168,217,0,.1)"}}><span style={{fontSize:12,fontWeight:600,color:T.barHigh}}>-33s</span></div>
            </div>
            <PaceChart data={PACE} an={an}/>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{label:"Total Distance",value:"387",unit:"km",sub:"of ~520 km"},{label:"Sessions",value:"31",unit:"",sub:"of 48 planned"},{label:"Longest Run",value:"18.2",unit:"km",sub:"Week 3"},{label:"Avg HR",value:"148",unit:"bpm",sub:"-4 bpm",dark:true}].map((s,i)=>(
              <div key={i} style={{padding:16,borderRadius:16,background:s.dark?T.wText:T.w1,border:s.dark?"none":"1px solid "+T.wBrd,animation:"countUp .4s ease "+(.3+i*.08)+"s both"}}>
                <span style={{fontSize:11,fontWeight:500,color:s.dark?"rgba(255,255,255,.4)":T.wMute,display:"block",marginBottom:6}}>{s.label}</span>
                <div style={{display:"flex",alignItems:"baseline",gap:2}}>
                  <span style={{fontSize:26,fontWeight:800,color:s.dark?T.lime:T.wText}}>{s.value}</span>
                  {s.unit&&<span style={{fontSize:13,color:s.dark?"rgba(255,255,255,.35)":T.wMute}}>{s.unit}</span>}
                </div>
                <span style={{fontSize:11,color:s.dark?T.barHigh:T.wMute,display:"block",marginTop:4}}>{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <EditPlanFAB/>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 4 - PROFILE
// ═══════════════════════════════════════
function ProfileTab(){
  const[sc,setSc]=useState(0);
  const p=Math.min(1,Math.max(0,(sc-10)/110));
  const showCol=p>.85;
  const[ring,setRing]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setRing(true),600);return()=>clearTimeout(t);},[]);
  const rR=46,rC=2*Math.PI*rR;

  return(
    <div style={{width:"100%",height:"100%",position:"relative"}}>
      {showCol&&<div style={{position:"absolute",top:0,left:0,right:0,zIndex:90,padding:"54px 24px 12px",background:"rgba(0,0,0,.92)",backdropFilter:"blur(24px)",borderBottom:"1px solid "+T.brd}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:16,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,fontWeight:800,color:T.black}}>A</span></div>
          <span style={{fontSize:16,fontWeight:700,color:T.g1}}>Alex</span>
          <div style={{padding:"2px 8px",borderRadius:6,background:T.lime}}><span style={{fontSize:9,fontWeight:800,color:T.black}}>PRO</span></div>
        </div>
      </div>}

      <div onScroll={e=>setSc(e.target.scrollTop)} style={{width:"100%",height:"100%",overflow:"auto"}}>
        <div style={{background:T.black,padding:"70px 24px 24px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{position:"relative",width:100,height:100,marginBottom:12,opacity:1-p*.8,transform:"scale("+(1-p*.3)+")"}}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
              <circle cx="50" cy="50" r={rR} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="3"/>
              <circle cx="50" cy="50" r={rR} fill="none" stroke={T.lime} strokeWidth="3" strokeDasharray={rC} strokeDashoffset={ring?rC*(1-.74):rC} strokeLinecap="round" style={{transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)"}}/>
            </svg>
            <div style={{position:"absolute",top:7,left:7,width:86,height:86,borderRadius:43,background:"linear-gradient(135deg,"+T.lime+","+T.barHigh+")",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:38,fontWeight:800,color:T.black}}>A</span>
            </div>
          </div>

          <div style={{textAlign:"center",opacity:1-p,transform:"translateY("+-p*15+"px)"}}>
            <span style={{fontSize:22,fontWeight:700,color:T.g1}}>Alex</span>
            <span style={{display:"inline-flex",marginLeft:8,padding:"3px 10px",borderRadius:8,background:T.lime,verticalAlign:"middle",fontSize:10,fontWeight:800,color:T.black}}>PRO</span>
            <span style={{fontSize:13,color:T.g4,display:"block",marginTop:6}}>Half Marathon · Week 4 Build</span>
          </div>

          <div style={{width:"100%",marginTop:16,opacity:1-p*1.3,transform:"translateY("+-p*10+"px)"}}>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[{v:"387",l:"km"},{v:"31",l:"runs"},{v:"12",l:"streak"}].map((s,i)=>(
                <div key={i} style={{flex:1,padding:"10px 6px",borderRadius:12,background:T.card,border:"1px solid "+T.brd,textAlign:"center"}}>
                  <span style={{fontSize:18,fontWeight:800,color:T.lime,display:"block"}}>{s.v}</span>
                  <span style={{fontSize:10,color:T.g4}}>{s.l}</span>
                </div>
              ))}
            </div>
            <button style={{width:"100%",padding:13,borderRadius:14,background:T.lime,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={T.black} strokeWidth="2.2" strokeLinecap="round"/><polyline points="16,6 12,2 8,6" stroke={T.black} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="2" x2="12" y2="15" stroke={T.black} strokeWidth="2.2" strokeLinecap="round"/></svg>
              <span style={{fontSize:14,fontWeight:700,color:T.black}}>Share on Strava</span>
            </button>
          </div>
        </div>

        <div style={{background:T.w2,borderRadius:"28px 28px 0 0",minHeight:500,marginTop:-4}}>
          <div style={{padding:"22px 16px 100px"}}>
            <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:10,letterSpacing:".05em",textTransform:"uppercase"}}>Connected Services</span>
            {[{name:"Strava",desc:"Sync activities",on:true,color:"#FC4C02",icon:"S"},{name:"Apple Health",desc:"HR, sleep & recovery",on:true,color:"#FF2D55",icon:"\u2665"},{name:"Garmin",desc:"GPS watch sync",on:false,color:"#007CC3",icon:"G"}].map((svc,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd,marginBottom:8}}>
                <div style={{width:38,height:38,borderRadius:12,background:svc.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:svc.icon==="\u2665"?16:14,fontWeight:800,color:T.w1}}>{svc.icon}</span>
                </div>
                <div style={{flex:1}}>
                  <span style={{fontSize:15,fontWeight:600,color:T.wText}}>{svc.name}</span>
                  <span style={{fontSize:12,color:T.wMute,display:"block",marginTop:1}}>{svc.desc}</span>
                </div>
                <div style={{padding:"6px 12px",borderRadius:10,background:svc.on?"rgba(168,217,0,.1)":T.w3}}>
                  <span style={{fontSize:12,fontWeight:600,color:svc.on?T.barHigh:T.wMute}}>{svc.on?"Connected":"Connect"}</span>
                </div>
              </div>
            ))}

            <span style={{fontSize:11,fontWeight:600,color:T.wMute,padding:"0 4px",display:"block",marginBottom:10,marginTop:20,letterSpacing:".05em",textTransform:"uppercase"}}>Settings</span>
            <div style={{borderRadius:16,background:T.w1,border:"1px solid "+T.wBrd,overflow:"hidden"}}>
              {[{l:"Edit Profile",v:""},{l:"Goal",v:"Sub 1:45"},{l:"Coaching Style",v:"Balanced"},{l:"Units",v:"Metric"},{l:"Notifications",v:"On"},{l:"Subscription",v:"Pro"}].map((item,i,arr)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 18px",borderBottom:i<arr.length-1?"1px solid "+T.wBrd:"none"}}>
                  <span style={{fontSize:15,color:T.wText}}>{item.l}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {item.v&&<span style={{fontSize:14,color:T.wMute}}>{item.v}</span>}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={T.wMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",marginTop:24}}><span style={{fontSize:12,color:T.wMute}}>Cadence v0.1</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// NAV + ROOT
// ═══════════════════════════════════════
function BottomNav({active,onChange}){
  const tabs=[
    {id:"today",label:"Today",icon:(c)=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={c}/></svg>},
    {id:"coach",label:"Coach",icon:(c)=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={c}/></svg>},
    {id:"analytics",label:"Analytics",icon:(c)=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke={c}/></svg>},
    {id:"profile",label:"Profile",icon:(c)=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" stroke={c}/><path d="M4 21v-1a6 6 0 0112 0v1" stroke={c}/></svg>},
  ];
  return(
    <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:200}}>
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"10px 8px 30px",background:T.w2,borderTop:"1px solid "+T.wBrd}}>
        {tabs.map(t=>{
          const a=t.id===active;
          return(
            <button key={t.id} onClick={()=>onChange(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 14px"}}>
              {t.icon(a?T.wText:T.wMute)}
              <span style={{fontSize:10,fontWeight:a?600:400,color:a?T.wText:T.wMute}}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CadenceApp(){
  useStyles();
  const[tab,setTab]=useState("today");
  const[detailIdx,setDetailIdx]=useState(null);
  const[activeSession,setActiveSession]=useState(null);
  const[debrief,setDebrief]=useState(null); // {session,elapsed,distance}

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
          {tab==="coach"&&<CoachTab/>}
          {tab==="analytics"&&<AnalyticsTab/>}
          {tab==="profile"&&<ProfileTab/>}
        </div>
        <BottomNav active={tab} onChange={setTab}/>

        {/* Session Detail overlay */}
        {detailIdx!==null&&<SessionDetailScreen session={PLAN[detailIdx]} dayIdx={detailIdx} onBack={closeDetail} onStart={startSession}/>}

        {/* Active Session overlay */}
        {activeSession&&<ActiveSessionScreen session={activeSession} onStop={endSession}/>}

        {/* Debrief overlay */}
        {debrief&&<DebriefScreen session={debrief.session} elapsedTime={debrief.elapsed} distanceCovered={debrief.distance} onDone={finishDebrief}/>}
      </div>
    </Phone>
  );
}
