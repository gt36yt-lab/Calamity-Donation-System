import { ArrowDownLeft, ArrowUpRight, ExternalLink, ImageIcon, Receipt } from "lucide-react";
import type { LedgerEntry } from "../../types";
import { formatAsset, formatDate, formatPhp, truncateTxHash } from "../../lib/format";
import { EXPLORER_BASE } from "../../lib/stellar";
import { StampBadge } from "../ui/StampBadge";

export function LedgerEntryRow({ entry }: { entry: LedgerEntry }) {
  const isInflow = entry.type === "inflow";

  return (
    <div className="rounded-lg border border-paper-300 bg-paper-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isInflow
                ? "bg-verified-500/12 text-verified-600"
                : "bg-signal-500/12 text-signal-600"
            }`}
          >
            {isInflow ? (
              <ArrowDownLeft className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </span>
          <div>
            {isInflow ? (
              <>
                <div className="text-sm font-semibold text-ink-950">
                  {entry.donorAlias}
                </div>
                <div className="mt-0.5 text-xs text-khaki-600">
                  {entry.destination === "general_fund"
                    ? "to the general calamity fund"
                    : `earmarked for ${entry.destination}`}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-ink-950">
                  {entry.vendor}
                </div>
                <div className="mt-0.5 max-w-md text-xs text-khaki-600">
                  {entry.purpose}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono-num text-sm font-semibold text-ink-950">
            {isInflow ? formatAsset(entry.assetAmount, entry.asset) : formatPhp(entry.phpAmount)}
          </div>
          {isInflow && (
            <div className="font-mono-num text-[11px] text-khaki-600">
              ≈ {formatPhp(entry.phpEquivalent)}
            </div>
          )}
        </div>
      </div>

      {!isInflow && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-paper-200 pt-3 text-[11px] text-khaki-600">
          <span className="inline-flex items-center gap-1">
            <Receipt className="h-3 w-3" /> {entry.receiptImageNote}
          </span>
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> {entry.deliveryPhotoNote}
          </span>
          <span>Served: {entry.barangaysServed.join(", ")}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-paper-200 pt-3">
        <div className="flex items-center gap-2">
          <StampBadge label="Verified on-chain" tone="verified" />
          <span className="text-[11px] text-khaki-500">{formatDate(entry.timestamp)}</span>
        </div>
        <a
          href={`${EXPLORER_BASE}/tx/${entry.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-khaki-600 hover:text-ink-950"
        >
          {truncateTxHash(entry.txHash)}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
