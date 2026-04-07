"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useLocale } from "@/lib/i18n";

const ease = [0.16, 1, 0.3, 1] as const;

export function DownloadCta() {
  const { t, locale } = useLocale();
  const joinWaitlist = useMutation(api.waitlist.join);
  const waitlistCount = useQuery(api.waitlist.count);
  const displayCount = waitlistCount ?? 31;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const result = await joinWaitlist({ email, source: "cta-bottom", locale });
      setState(result.alreadyJoined ? "already" : "success");
    } catch {
      setState("error");
    }
  };

  const submitted = state === "success" || state === "already";

  return (
    <section className="relative overflow-hidden bg-dark-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="download">
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 h-[600px] w-[800px] bg-[radial-gradient(ellipse,rgba(152,254,0,0.06)_0%,transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
        >
          <h2 className="mx-auto mb-4 max-w-[600px] font-[family-name:var(--font-satoshi)] tracking-[-0.04em] text-[clamp(36px,5vw,56px)] font-bold leading-[0.95] text-white">
            {t.downloadCta.headlinePre}
            <span className="text-[#98fe00]">{t.downloadCta.headlineHighlight}</span>
          </h2>
          <p className="mx-auto mb-8 max-w-[400px] text-[15px] leading-[1.7] text-white/40">
            {t.downloadCta.subtitlePre}{displayCount.toLocaleString()}{t.downloadCta.subtitlePost}
          </p>
        </motion.div>

        {/* Waitlist form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="mx-auto max-w-[480px]"
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.downloadCta.inputPlaceholder}
                  className="h-[52px] flex-1 rounded-full border border-white/10 bg-white/5 px-6 text-[14px] text-white placeholder:text-white/30 outline-none transition-all focus:border-[#98fe00]/50 focus:ring-1 focus:ring-[#98fe00]/20"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[#98fe00] px-7 text-[14px] font-semibold text-[#233802] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-70"
                >
                  <span>{state === "loading" ? t.downloadCta.buttonLoading : t.downloadCta.button}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="flex items-center gap-3 rounded-2xl border border-[#98fe00]/20 bg-[#98fe00]/[0.06] px-6 py-4"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#98fe00]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#233802" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-white">
                    {state === "already" ? t.downloadCta.already : t.downloadCta.success}
                  </p>
                  <p className="text-[13px] text-white/50">
                    {state === "already"
                      ? t.downloadCta.alreadySub
                      : t.downloadCta.successSub}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {state === "error" && (
            <p className="mt-2 text-[13px] text-red-400">{t.downloadCta.error}</p>
          )}
        </motion.div>
      </div>

      {/* Arch transition */}
      <div className="absolute -bottom-px left-0 z-10 w-full">
        <svg className="block w-full" viewBox="0 0 1440 72" fill="none" preserveAspectRatio="none" style={{ height: "72px" }}>
          <path d="M0 0C0 0 360 72 720 72C1080 72 1440 0 1440 0V72H0V0Z" fill="#f3f3f3" />
        </svg>
      </div>
    </section>
  );
}
