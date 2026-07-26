interface ProgressBarProps {
  percent: number; // 0-100
  tone?: "signal" | "verified" | "ink";
  size?: "sm" | "md";
  className?: string;
}

const TRACK = "bg-paper-300";
const FILL: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  signal: "bg-signal-500",
  verified: "bg-verified-500",
  ink: "bg-ink-800",
};

export function ProgressBar({
  percent,
  tone = "signal",
  size = "md",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div
      className={`w-full overflow-hidden rounded-full ${TRACK} ${height} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${FILL[tone]} transition-[width] duration-700 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
