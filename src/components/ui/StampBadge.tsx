import { CheckCircle2, Clock, Truck } from "lucide-react";

interface StampBadgeProps {
  label: string;
  tone?: "verified" | "pending" | "transit";
  className?: string;
}

const TONES = {
  verified: {
    border: "border-verified-600",
    text: "text-verified-600",
    Icon: CheckCircle2,
  },
  pending: {
    border: "border-khaki-600",
    text: "text-khaki-700",
    Icon: Clock,
  },
  transit: {
    border: "border-signal-600",
    text: "text-signal-600",
    Icon: Truck,
  },
} as const;

/**
 * A rotated, double-ringed "ink stamp" — the recurring visual signature that
 * ties government paperwork (approval stamps) to blockchain verification.
 */
export function StampBadge({ label, tone = "verified", className = "" }: StampBadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-dashed ${t.border} px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${t.text} ${className}`}
    >
      <t.Icon className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
