"use client";

import type {
  TracedSession,
  TracedWeek,
} from "@packages/backend/convex/agoge/plans/buildFiveKPlan";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  DAY_LABELS,
  DROP_REASON_LABELS,
  km,
  PHASE_STYLES,
} from "./format";

function SessionCell({
  session,
  phase,
}: {
  session: TracedSession | undefined;
  phase: string;
}) {
  if (!session) {
    return <div className="bg-muted/30 min-h-16 rounded-md border border-dashed" />;
  }

  if (session.dropped) {
    const reason = session.dropReason
      ? (DROP_REASON_LABELS[session.dropReason] ?? session.dropReason)
      : "Dropped";
    return (
      <div
        className="min-h-16 rounded-md border border-rose-400 bg-rose-50 p-1.5 ring-1 ring-rose-300"
        title={`DROPPED — ${reason}\n${session.spec.type} / ${session.spec.intensity} / ${session.spec.distanceKm.toFixed(1)}km`}
      >
        <p className="text-[11px] font-medium text-rose-700 line-through">
          {session.spec.type}
        </p>
        <p className="text-[10px] text-rose-600">{reason}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-16 rounded-md border p-1.5", PHASE_STYLES[phase])}
      title={session.workoutName}
    >
      <p className="text-[11px] font-medium leading-tight">
        {session.workoutName ?? session.spec.type}
      </p>
      <p className="text-[10px] opacity-70">{km(session.labelDistanceMeters)}</p>
    </div>
  );
}

export function WeekRow({ week }: { week: TracedWeek }) {
  const byDay = new Map<number, TracedSession>();
  for (const s of week.sessions) byDay.set(s.dayOfWeek, s);

  return (
    <div className="grid grid-cols-[10rem_repeat(7,1fr)] gap-1.5">
      <div className="flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">W{week.weekIndex + 1}</span>
          <Badge variant="outline" className={PHASE_STYLES[week.phase]}>
            {week.phase}
          </Badge>
        </div>
        <span className="text-muted-foreground text-xs">
          {Math.round(week.weekKm)} km · {week.weekStartYmd}
        </span>
      </div>
      {DAY_LABELS.map((_, d) => (
        <SessionCell key={d} session={byDay.get(d)} phase={week.phase} />
      ))}
    </div>
  );
}

export function DayHeader() {
  return (
    <div className="grid grid-cols-[10rem_repeat(7,1fr)] gap-1.5">
      <div />
      {DAY_LABELS.map((label) => (
        <div
          key={label}
          className="text-muted-foreground text-center text-xs font-medium"
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export function WeekCalendar({
  weeks,
  taper,
}: {
  weeks: TracedWeek[];
  taper: TracedSession[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <DayHeader />

      {weeks.map((week) => (
        <WeekRow key={week.weekIndex} week={week} />
      ))}

      {/* Taper: absolute dates that may straddle two calendar weeks → its own
          Mon→Sun row, keyed by each session's day-of-week. */}
      {taper.length > 0 && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className={PHASE_STYLES.taper}>
              taper
            </Badge>
            <span className="text-muted-foreground text-xs">
              variable-length tail, anchored to race day
            </span>
          </div>
          <TaperRows taper={taper} />
        </>
      )}
    </div>
  );
}

/** The taper can span two calendar weeks; group sessions by their Monday. */
function TaperRows({ taper }: { taper: TracedSession[] }) {
  const mondayOf = (ymd: string): string => {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
    const dow = (date.getUTCDay() + 6) % 7; // Monday=0
    date.setUTCDate(date.getUTCDate() - dow);
    return date.toISOString().slice(0, 10);
  };

  const weeks = new Map<string, Map<number, TracedSession>>();
  for (const s of taper) {
    const wk = mondayOf(s.dateYmd);
    if (!weeks.has(wk)) weeks.set(wk, new Map());
    weeks.get(wk)!.set(s.dayOfWeek, s);
  }
  const ordered = [...weeks.entries()].sort(([a], [b]) => (a < b ? -1 : 1));

  return (
    <div className="flex flex-col gap-1.5">
      {ordered.map(([monday, byDay]) => (
        <div
          key={monday}
          className="grid grid-cols-[10rem_repeat(7,1fr)] gap-1.5"
        >
          <div className="flex items-center text-muted-foreground text-xs">
            {monday}
          </div>
          {DAY_LABELS.map((_, d) => (
            <SessionCell key={d} session={byDay.get(d)} phase="taper" />
          ))}
        </div>
      ))}
    </div>
  );
}
