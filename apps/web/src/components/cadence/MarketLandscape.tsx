"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";

type DotStatus = "full" | "partial" | "none";

interface Product {
  name: string;
  tagline: string;
  features: { label: string; status: DotStatus }[];
}

const ease = [0.16, 1, 0.3, 1] as const;

function StatusDot({ status, isCadence }: { status: DotStatus; isCadence?: boolean }) {
  if (isCadence) {
    return <span className="mt-[3px] h-[9px] w-[9px] flex-shrink-0 rounded-full bg-lime" />;
  }
  const colors: Record<DotStatus, string> = {
    full: "bg-[#22c55e]",
    partial: "bg-[#f97316]",
    none: "bg-[#d4d4d4]",
  };
  return <span className={`mt-[3px] h-[9px] w-[9px] flex-shrink-0 rounded-full ${colors[status]}`} />;
}

function ProductBadge({ name, isCadence }: { name: string; isCadence?: boolean }) {
  return (
    <span
      className={`mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${
        isCadence
          ? "bg-lime/10 text-lime"
          : "border border-[#e5e5e5] bg-[#f5f5f5] text-[#9a9a9a]"
      }`}
    >
      {name}
    </span>
  );
}

function ProductCard({
  product,
  isCadence,
  delay,
}: {
  product: Product;
  isCadence?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: delay ?? 0, ease }}
      className={
        isCadence
          ? "rounded-2xl border border-lime/20 bg-gradient-to-br from-dark-card-from to-dark-card-to p-6 shadow-[inset_0_0_60px_rgba(152,254,0,0.08),inset_0_1px_0_rgba(152,254,0,0.15)]"
          : "rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
      }
    >
      <ProductBadge name={product.name} isCadence={isCadence} />
      <p
        className={`mb-4 font-[family-name:var(--font-satoshi)] text-[20px] font-bold tracking-[-0.02em] ${
          isCadence ? "text-white" : "text-[#131313]"
        }`}
      >
        {product.tagline}
      </p>
      <ul className="space-y-2.5">
        {product.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <StatusDot status={f.status} isCadence={isCadence} />
            <span
              className={`text-[13px] leading-snug ${
                isCadence
                  ? "text-white/60"
                  : f.status === "none"
                  ? "text-[#c4c4c4]"
                  : f.status === "partial"
                  ? "text-[#797979]"
                  : "text-[#3a3a3a]"
              }`}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function MarketLandscape() {
  const { t } = useLocale();
  const { tier1Label, tier2Label, tier3Label, tier1Products, tier2Products, tier3Products } =
    t.marketLandscape;

  return (
    <section
      className="bg-[#f3f3f3] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32"
      id="how"
    >
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Tier 1 */}
        <div>
          <TierLabel label={tier1Label} />
          <div className="grid grid-cols-1 gap-4">
            {tier1Products.map((p, i) => (
              <ProductCard key={i} product={p} delay={0} />
            ))}
          </div>
        </div>

        {/* Tier 2 */}
        <div>
          <TierLabel label={tier2Label} delay={0.05} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tier2Products.map((p, i) => (
              <ProductCard key={i} product={p} delay={i * 0.07} />
            ))}
          </div>
        </div>

        {/* Tier 3 — Cadence */}
        <div>
          <TierLabel label={tier3Label} delay={0.05} />
          <div className="grid grid-cols-1 gap-4">
            {tier3Products.map((p, i) => (
              <ProductCard key={i} product={p} isCadence delay={0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TierLabel({ label, delay }: { label: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: delay ?? 0, ease }}
      className="mb-4 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#131313]/30"
    >
      {label}
    </motion.div>
  );
}
