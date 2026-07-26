import { MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { Family } from "../../types";
import { getFamilyTotalCostPhp } from "../../data/mockData";
import { formatPhp } from "../../lib/format";
import { Badge } from "../ui/Badge";
import { StampBadge } from "../ui/StampBadge";
import { ProgressBar } from "../ui/ProgressBar";

const URGENCY_TONE = {
  critical: "alert",
  high: "signal",
  moderate: "khaki",
} as const;

const DELIVERY_STAMP = {
  delivered: { label: "Delivered", tone: "verified" },
  in_transit: { label: "In transit", tone: "transit" },
  pending: { label: "Pending", tone: "pending" },
} as const;

export function FamilyCard({ family }: { family: Family }) {
  const totalCost = getFamilyTotalCostPhp(family);
  const pct = totalCost > 0 ? (family.amountFundedPhp / totalCost) * 100 : 0;
  const stamp = DELIVERY_STAMP[family.deliveryStatus];

  return (
    <div className="flex flex-col rounded-xl border border-paper-300 bg-paper-50 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-sm font-semibold text-ink-950">
            {family.alias}
          </span>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-khaki-600">
            <MapPin className="h-3 w-3" />
            {family.barangay}
            <span className="mx-1">·</span>
            <Users className="h-3 w-3" />
            {family.householdSize} members
          </div>
        </div>
        <Badge tone={URGENCY_TONE[family.urgency]}>{family.urgency}</Badge>
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-paper-200 pt-3">
        {family.needs.map((n) => (
          <li key={n.id} className="flex justify-between text-xs text-ink-950/80">
            <span>
              {n.quantity} {n.label}
            </span>
            <span className="font-mono-num text-khaki-600">
              @ {formatPhp(n.unitCostPhp)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-khaki-600">
          <span>{formatPhp(family.amountFundedPhp, { compact: true })} funded</span>
          <span>{formatPhp(totalCost, { compact: true })} total</span>
        </div>
        <ProgressBar percent={pct} tone="signal" size="sm" className="mt-1.5" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <StampBadge label={stamp.label} tone={stamp.tone} />
        <Link
          to={`/donate?family=${family.id}`}
          className="rounded-full bg-ink-950 px-3.5 py-1.5 text-[11px] font-semibold text-paper-50 transition-colors hover:bg-alert-600"
        >
          Fund this family
        </Link>
      </div>
    </div>
  );
}
