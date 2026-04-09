"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";

export function CadenceFooter() {
  const { t } = useLocale();

  return (
    <footer className="bg-dark-base">
      <div className="mx-auto max-w-6xl border-t border-dark-border-subtle px-5 pb-10 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <Image
                src="/logo-cadence.svg"
                alt="Cadence"
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg"
              />
              <span className="font-[family-name:var(--font-satoshi)] text-xl font-bold tracking-[-0.04em] text-white">
                cadence
              </span>
            </Link>
            <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-white/25">
              {t.footer.description}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/20">
              {t.footer.productHeading}
            </h4>
            {t.footer.productLinks.map((label, i) => {
              const hrefs = ["#features", "#how-it-works"];
              return (
                <Link
                  key={label}
                  href={hrefs[i]}
                  className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime"
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/20">
              {t.footer.legalHeading}
            </h4>
            <Link href="/privacy" className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="/terms" className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime">
              {t.footer.termsOfService}
            </Link>
            <Link href="/mentions-legales" className="block py-1.5 text-[13px] text-white/35 no-underline transition-colors hover:text-lime">
              {t.footer.mentionsLegales}
            </Link>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/20">
              {t.footer.integrationsHeading}
            </h4>
            {["Apple Watch", "Garmin", "COROS", "Strava"].map((label) => (
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
          {t.footer.copyright}
        </span>
        <span className="font-mono text-[11px] text-white/15">
          {t.footer.tagline}
        </span>
      </div>
    </footer>
  );
}
