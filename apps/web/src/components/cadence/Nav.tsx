"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";

export function Nav() {
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-[1000] px-5 pt-5 sm:px-8 lg:px-12">
      <div
        className={`mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl px-5 py-3.5 transition-all duration-500 ${
          scrolled
            ? "border border-[#e5e5e5] bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image
            src="/logo-cadence.svg"
            alt="Cadence"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-[family-name:var(--font-satoshi)] text-xl font-bold tracking-[-0.04em] text-[#131313]">
            cadence
          </span>
        </Link>

        {/* Contact link */}
        <a
          href="mailto:hello@cadence.run"
          className="text-[14px] font-medium text-[#797979] transition-colors hover:text-[#131313] no-underline"
        >
          {t.nav.contact}
        </a>
      </div>
    </nav>
  );
}
