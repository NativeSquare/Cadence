import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-[1000] flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent px-5 py-3.5 backdrop-blur-xl sm:px-6 sm:py-4 lg:px-12 lg:py-5">
      <Link
        href="/"
        className="text-[22px] font-bold tracking-[-0.04em] text-white/[0.92] no-underline"
      >
        cadence
      </Link>

      <div className="flex items-center gap-5 lg:gap-9">
        <Link
          href="#how"
          className="hidden text-sm font-normal tracking-[-0.01em] text-white/45 transition-colors hover:text-white/[0.92] sm:inline"
        >
          How it works
        </Link>
        <Link
          href="#features"
          className="hidden text-sm font-normal tracking-[-0.01em] text-white/45 transition-colors hover:text-white/[0.92] sm:inline"
        >
          Features
        </Link>
        <Link
          href="#proof"
          className="hidden text-sm font-normal tracking-[-0.01em] text-white/45 transition-colors hover:text-white/[0.92] sm:inline"
        >
          Results
        </Link>
        <Link
          href="#pricing"
          className="hidden text-sm font-normal tracking-[-0.01em] text-white/45 transition-colors hover:text-white/[0.92] sm:inline"
        >
          Pricing
        </Link>
        <Link
          href="#faq"
          className="hidden text-sm font-normal tracking-[-0.01em] text-white/45 transition-colors hover:text-white/[0.92] sm:inline"
        >
          FAQ
        </Link>
        <Link
          href="#download"
          className="rounded-[10px] bg-[#C8FF00] px-6 py-2.5 text-sm font-semibold tracking-[-0.01em] text-black transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          Download
        </Link>
      </div>
    </nav>
  );
}
