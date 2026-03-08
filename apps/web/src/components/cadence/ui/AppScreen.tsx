export function DashboardScreen() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-white/40">Good morning</p>
          <p className="text-lg font-semibold text-white">Alex</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime/15">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
      </div>

      {/* Phase badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-phase-build/15 px-3 py-1">
        <div className="h-1.5 w-1.5 rounded-full bg-phase-build" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-phase-build">
          Week 3 &middot; Build Phase
        </span>
      </div>

      {/* Weekly volume */}
      <div className="rounded-2xl bg-surface-high p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Weekly volume</span>
          <span className="font-mono text-[11px] text-lime">68%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <div className="h-2 rounded-full bg-gradient-to-r from-lime/60 to-lime" style={{ width: "68%" }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-high p-4">
          <p className="font-mono text-2xl font-medium text-white">12.4</p>
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">km this week</p>
        </div>
        <div className="rounded-2xl bg-surface-high p-4">
          <p className="font-mono text-2xl font-medium text-lime">5:42</p>
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">avg pace /km</p>
        </div>
      </div>

      {/* Next run */}
      <div className="rounded-2xl border border-lime/10 bg-lime/[0.04] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-lime/60 uppercase tracking-wider">Next run</p>
            <p className="mt-1 text-sm font-semibold text-white">Tempo 8km</p>
            <p className="text-[11px] text-white/40">Tomorrow &middot; 07:00</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarScreen() {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const week1 = [
    { day: 4, done: true, type: "easy" },
    { day: 5, done: true, type: "tempo" },
    { day: 6, done: false, type: "rest" },
    { day: 7, done: true, type: "long" },
    { day: 8, done: false, type: null },
    { day: 9, done: false, type: "easy" },
    { day: 10, done: false, type: "rest" },
  ];
  const week2 = [
    { day: 11, done: true, type: "easy" },
    { day: 12, done: true, type: "intervals" },
    { day: 13, done: true, type: "rest" },
    { day: 14, done: false, type: "tempo" },
    { day: 15, done: false, type: null },
    { day: 16, done: false, type: null },
    { day: 17, done: false, type: "rest" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">November 2024</p>
        </div>
        <div className="flex gap-1.5">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-high text-white/40">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-high text-white/40">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Phase bands */}
      <div className="flex gap-1 rounded-xl overflow-hidden">
        <div className="flex-1 bg-phase-base/20 py-1.5 text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-phase-base">Base</span>
        </div>
        <div className="flex-[2] bg-phase-build/20 py-1.5 text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-phase-build">Build</span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-medium text-white/25">
            {d}
          </div>
        ))}
      </div>

      {/* Week 1 */}
      <div className="grid grid-cols-7 gap-1">
        {week1.map((d, i) => (
          <div key={i} className={`flex h-10 flex-col items-center justify-center rounded-xl ${d.done ? "bg-lime/10" : "bg-surface-high"}`}>
            <span className={`text-xs font-medium ${d.done ? "text-lime" : "text-white/50"}`}>{d.day}</span>
            {d.done && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            )}
          </div>
        ))}
      </div>

      {/* Week 2 */}
      <div className="grid grid-cols-7 gap-1">
        {week2.map((d, i) => (
          <div key={i} className={`flex h-10 flex-col items-center justify-center rounded-xl ${d.done ? "bg-lime/10" : "bg-surface-high"}`}>
            <span className={`text-xs font-medium ${d.done ? "text-lime" : "text-white/50"}`}>{d.day}</span>
            {d.done && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            )}
          </div>
        ))}
      </div>

      {/* Current phase */}
      <div className="rounded-2xl bg-surface-high p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-phase-build" />
          <span className="text-xs font-semibold text-phase-build">BUILD PHASE</span>
          <span className="ml-auto text-[11px] text-white/40">Week 3/6</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div className="h-1.5 rounded-full bg-phase-build" style={{ width: "50%" }} />
        </div>
      </div>
    </div>
  );
}

export function DebriefScreen() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Session complete</p>
          <p className="text-[11px] text-white/40">Tempo Run &middot; 9.2 km</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-high p-3 text-center">
          <p className="font-mono text-lg font-medium text-white">9.2</p>
          <p className="text-[9px] font-medium text-white/30 uppercase">km</p>
        </div>
        <div className="rounded-xl bg-surface-high p-3 text-center">
          <p className="font-mono text-lg font-medium text-lime">5:18</p>
          <p className="text-[9px] font-medium text-white/30 uppercase">pace</p>
        </div>
        <div className="rounded-xl bg-surface-high p-3 text-center">
          <p className="font-mono text-lg font-medium text-white">168</p>
          <p className="text-[9px] font-medium text-white/30 uppercase">bpm</p>
        </div>
      </div>

      {/* AI Coach feedback */}
      <div className="rounded-2xl border border-lime/10 bg-lime/[0.04] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-lime/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-lime uppercase tracking-wider">Coach IA</span>
        </div>
        <p className="text-[13px] leading-relaxed text-white/70">
          &ldquo;Belle session Alex. Ton pace &eacute;tait tr&egrave;s r&eacute;gulier sur les 9km, avec une variation de seulement <span className="font-mono text-lime">+0.3%</span>. Ta cadence moyenne de <span className="font-mono text-lime">178 spm</span> est en hausse. Continue comme &ccedil;a !&rdquo;
        </p>
      </div>

      {/* Recovery */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-high p-4">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Recovery</p>
          <p className="mt-1 font-mono text-xl font-medium text-white">14h</p>
        </div>
        <div className="rounded-2xl bg-surface-high p-4">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Forme</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
              <div className="h-2 rounded-full bg-lime" style={{ width: "78%" }} />
            </div>
            <span className="font-mono text-sm font-medium text-lime">78%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
