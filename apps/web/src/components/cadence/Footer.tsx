import Link from "next/link";

export function CadenceFooter() {
  return (
    <footer className="bg-dark-base">
      <div className="mx-auto max-w-6xl border-t border-dark-border-subtle px-5 pb-10 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">cadence</span>
            </Link>
            <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-white/25">
              AI coaching that adapts to every run. Built for runners who want to understand their training.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/20">
              Product
            </h4>
            {["Features", "How it works", "Pricing"].map((label) => (
              <Link
                key={label}
                href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/20">
              Legal
            </h4>
            <Link href="/privacy" className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime">
              Privacy Policy
            </Link>
            <Link href="/terms" className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime">
              Terms of Service
            </Link>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/20">
              Integrations
            </h4>
            {["Apple Watch", "Garmin", "COROS", "Suunto"].map((label) => (
              <div key={label} className="flex items-center gap-2 py-1.5">
                <div className="h-1 w-1 rounded-full bg-lime/30" />
                <span className="text-[13px] text-white/35">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-dark-border-subtle px-5 py-5 sm:flex-row sm:px-8 lg:px-12">
        <span className="font-mono text-[11px] text-white/15">
          &copy; 2026 Cadence. All rights reserved.
        </span>
        <span className="font-mono text-[11px] text-white/15">
          Made for runners, by runners.
        </span>
      </div>
    </footer>
  );
}
