import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "alert" | "signal" | "verified" | "khaki";
  className?: string;
}

const TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  alert: "bg-alert-500/12 text-alert-600 border-alert-500/30",
  signal: "bg-signal-500/12 text-signal-600 border-signal-500/30",
  verified: "bg-verified-500/12 text-verified-600 border-verified-500/30",
  khaki: "bg-khaki-500/12 text-khaki-700 border-khaki-500/30",
};

export function Badge({ children, tone = "khaki", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
