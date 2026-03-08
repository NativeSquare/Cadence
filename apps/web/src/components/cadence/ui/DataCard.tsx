"use client";

import { motion } from "framer-motion";

interface DataCardProps {
  value: string;
  label: string;
  accent?: boolean;
  icon?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function DataCard({ value, label, accent = false, icon, className = "", delay = 0 }: DataCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6 + delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border border-white/[0.08] bg-surface/80 backdrop-blur-md px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-lime opacity-60">{icon}</span>}
        <span className={`font-mono text-lg font-medium tracking-tight ${accent ? "text-lime" : "text-white"}`}>
          {value}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium tracking-wide text-white/40 uppercase">
        {label}
      </p>
    </motion.div>
  );
}
