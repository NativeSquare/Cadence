"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";

const avatarLetters = ["S", "T", "L"];

export function Testimonials() {
  const { t } = useLocale();

  return (
    <section className="bg-light-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="proof">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-16 max-w-6xl text-center"
      >
        <div className="mb-4 font-mono text-[11px] font-medium tracking-[0.12em] text-light-text/40">
          {t.testimonials.tag}
        </div>
        <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-satoshi)] tracking-[-0.04em] text-[clamp(40px,5.5vw,68px)] font-bold leading-[0.95] text-light-text">
          {t.testimonials.headlinePre}
          <span className="text-lime-text">{t.testimonials.headlineHighlight}</span>
        </h2>
      </motion.div>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
        {t.testimonials.quotes.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="group rounded-2xl border border-light-border bg-light-elevated p-7 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          >
            {/* Quote */}
            <div className="mb-3 text-3xl font-light leading-none text-light-text/10">
              &ldquo;
            </div>
            <p className="mb-6 text-[14px] leading-[1.7] text-light-muted">
              {item.quote}
            </p>

            {/* User */}
            <div className="flex items-center gap-3 border-t border-light-border pt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-light-text text-sm font-bold text-light-elevated">
                {avatarLetters[i]}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-light-text">{item.name}</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-light-text/70">{item.result}</span>
                  <span className="text-light-text/15">&middot;</span>
                  <span className="text-[11px] text-light-muted">{item.level}</span>
                </div>
                <div className="font-mono text-[10px] text-light-text/25">{item.meta}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
