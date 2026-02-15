const ITEMS = [
  "Strava Integration",
  "Apple Health Sync",
  "Garmin Connect",
  "Adaptive Plans",
  "Decision Audit",
  "Recovery Intelligence",
  "Race Predictions",
  "Injury Prevention",
  "Conversational Coaching",
  "Real-Time Adaptation",
];

function MarqueeItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <span className="h-1 w-1 rounded-full bg-[#C8FF00] opacity-50" />
      <span className="font-mono text-[13px] tracking-[0.02em] text-white/25">
        {text}
      </span>
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden border-y border-white/[0.08] py-[60px]">
      <div className="animate-marquee flex w-max gap-12">
        {/* First set */}
        {ITEMS.map((item) => (
          <MarqueeItem key={item} text={item} />
        ))}
        {/* Duplicate for seamless loop */}
        {ITEMS.map((item) => (
          <MarqueeItem key={`dup-${item}`} text={item} />
        ))}
      </div>
    </div>
  );
}
