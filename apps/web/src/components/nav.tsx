import Image from "next/image";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Cadence logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold tracking-tight">Cadence</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-[#8E8E93] md:flex">
          <Link href="/#features" className="transition hover:text-white">
            Features
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-white">
            How It Works
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
        </div>

        {/* spacer to keep nav balanced */}
        <div className="w-16" />
      </div>
    </nav>
  );
}
