import Link from "next/link";
import { type ReactNode } from "react";

interface LimeButtonProps {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  size?: "default" | "lg";
  className?: string;
}

export function LimeButton({ href, children, variant = "solid", size = "default", className = "" }: LimeButtonProps) {
  const base = "inline-flex items-center justify-center gap-2.5 font-semibold tracking-[-0.01em] transition-all";
  const sizes = {
    default: "rounded-xl px-7 py-3.5 text-[15px]",
    lg: "rounded-2xl px-9 py-[18px] text-[17px]",
  };
  const variants = {
    solid: "bg-lime text-black hover:scale-[1.03] active:scale-[0.97] hover:bg-[#B8E600]",
    outline: "border border-white/[0.1] bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white",
  };

  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
