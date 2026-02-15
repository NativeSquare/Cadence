import Link from "next/link";

export function Footer() {
  return (
    <>
      <footer className="flex flex-col gap-10 border-t border-white/[0.08] px-5 pb-10 pt-[60px] sm:px-8 sm:pt-20 md:flex-row md:items-start md:justify-between lg:px-12">
        {/* Brand */}
        <div>
          <Link
            href="/"
            className="text-[22px] font-bold tracking-[-0.04em] text-white/[0.92] no-underline"
          >
            cadence
          </Link>
          <p className="mt-3 max-w-[280px] text-[13px] font-light leading-[1.5] text-white/25">
            AI coaching that sees what you can&apos;t. Built for runners who want
            to understand their training, not just follow it.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
            Product
          </h4>
          <Link
            href="#how"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            How it works
          </Link>
          <Link
            href="#features"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            Changelog
          </Link>
        </div>

        {/* Legal */}
        <div>
          <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
            Legal
          </h4>
          <Link
            href="/privacy"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="block py-1 text-sm font-light text-white/45 no-underline transition-colors hover:text-[#C8FF00]"
          >
            Cookie Policy
          </Link>
        </div>
      </footer>

      {/* Footer bottom */}
      <div className="flex flex-col items-center justify-between gap-2 px-5 py-4 sm:flex-row sm:px-8 lg:px-12 lg:py-5">
        <span className="font-mono text-[11px] text-white/25">
          &copy; 2026 Cadence. All rights reserved.
        </span>
        <span className="font-mono text-[11px] text-white/25">
          Made for runners, by runners.
        </span>
      </div>
    </>
  );
}
