"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-[1000] flex justify-center px-5 pt-4 sm:px-8 lg:px-12">
      <div
        className={`flex w-full max-w-6xl items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500 ${
          scrolled
            ? "border border-white/[0.08] bg-dark-base/80 shadow-[0_30px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-[-0.03em] text-white">
            cadence
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how" },
            { label: "Results", href: "#proof" },
            { label: "Pricing", href: "#pricing" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-white/50 transition-colors hover:text-white no-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="#download"
          className="rounded-full bg-lime px-6 py-2.5 text-[13px] font-semibold text-dark-base transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
        >
          Download
        </Link>
      </div>
    </nav>
  );
}
