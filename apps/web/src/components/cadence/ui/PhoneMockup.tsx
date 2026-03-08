"use client";

import { motion, type MotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
  motionProps?: MotionProps;
}

export function PhoneMockup({ children, className = "", motionProps }: PhoneMockupProps) {
  return (
    <motion.div
      className={`relative mx-auto w-[280px] sm:w-[300px] ${className}`}
      {...motionProps}
    >
      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[44px] border border-white/[0.12] bg-[#0A0A0A] shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="relative z-10 flex justify-center pt-3 pb-2">
          <div className="h-[28px] w-[100px] rounded-full bg-[#0A0A0A] border border-white/[0.06]" />
        </div>

        {/* Screen content */}
        <div className="px-4 pb-6">
          {children}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-3">
          <div className="h-[5px] w-[120px] rounded-full bg-white/20" />
        </div>
      </div>
    </motion.div>
  );
}
