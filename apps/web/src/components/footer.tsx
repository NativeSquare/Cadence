import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Cadence logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-sm font-semibold tracking-tight">Cadence</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-[#8E8E93]">
          <Link href="/terms" className="transition hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
          <Link href="/health-data" className="transition hover:text-white">
            Health Data
          </Link>
        </div>

        <p className="text-sm text-[#8E8E93]">
          &copy; {new Date().getFullYear()} Cadence. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
