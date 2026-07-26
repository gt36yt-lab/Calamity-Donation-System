import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
  Landmark,
  Radio,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ledgerEntries } from "../../data/mockData";
import {
  formatAsset,
  formatPhp,
  formatRelativeTime,
  truncateAddress,
  truncateTxHash,
} from "../../lib/format";
import {
  EXPLORER_BASE,
  LGU_WALLET_ADDRESS,
  NETWORK,
  fetchAccountBalances,
  type WalletBalance,
} from "../../lib/stellar";

const sorted = [...ledgerEntries].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);

export function LedgerPanel() {
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState<WalletBalance[] | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchAccountBalances(LGU_WALLET_ADDRESS).then((res) => {
      if (!cancelled) setBalances(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(LGU_WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside className="flex h-full flex-col rounded-xl border-2 border-ink-800 bg-ink-950 text-paper-100">
      {/* Wallet header */}
      <div className="border-b border-ink-800 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-treasury-500/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-treasury-300">
            <Landmark className="h-3 w-3" />
            LGU Treasury Wallet
          </span>
          <span className="rounded-full bg-treasury-500/15 px-2 py-0.5 font-mono text-[10px] uppercase text-treasury-400">
            {NETWORK}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-paper-200">
            {truncateAddress(LGU_WALLET_ADDRESS)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md p-1 text-khaki-500 hover:bg-ink-800 hover:text-paper-50"
            aria-label="Copy wallet address"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-treasury-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {balances === "loading" && <span className="text-xs text-paper-400">reading Horizon…</span>}
          {balances === null && (
            <span className="text-xs text-paper-400">No live balance on this demo account.</span>
          )}
          {Array.isArray(balances) &&
            balances.slice(0, 3).map((b) => (
              <span key={b.code} className="font-mono-num text-sm text-paper-50">
                {Number(b.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                <span className="text-treasury-400">{b.code}</span>
              </span>
            ))}
        </div>
        <a
          href={`${EXPLORER_BASE}/account/${LGU_WALLET_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-treasury-400 hover:text-treasury-300"
        >
          View on Stellar Expert <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Activity header */}
      <div className="flex items-center gap-2 px-5 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-alert-500/40 bg-alert-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-alert-400">
          <Radio className="h-3 w-3 animate-pulse-dot" /> Live
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-khaki-500">
          Recent activity
        </span>
      </div>

      {/* Activity feed */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {sorted.slice(0, 8).map((e) => {
          const isInflow = e.type === "inflow";
          return (
            <div key={e.id} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-ink-900">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  isInflow ? "bg-verified-500/15 text-verified-400" : "bg-signal-500/15 text-signal-400"
                }`}
              >
                {isInflow ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-paper-50">
                    {isInflow ? e.donorAlias : e.vendor}
                  </span>
                  <span className="shrink-0 font-mono-num text-xs text-paper-50">
                    {isInflow ? formatAsset(e.assetAmount, e.asset) : formatPhp(e.phpAmount, { compact: true })}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-khaki-500">
                  <span className="truncate">
                    {isInflow
                      ? e.destination === "general_fund"
                        ? "general fund"
                        : `→ ${e.destination}`
                      : e.purpose}
                  </span>
                  <span className="shrink-0">{formatRelativeTime(e.timestamp)}</span>
                </div>
                <a
                  href={`${EXPLORER_BASE}/tx/${e.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-mono text-[10px] text-khaki-600 hover:text-paper-100"
                >
                  {truncateTxHash(e.txHash)}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-ink-800 p-4">
        <Link
          to="/ledger"
          className="block rounded-full border border-ink-700 py-2 text-center text-xs font-semibold text-paper-100 hover:border-signal-500 hover:text-signal-400"
        >
          View the full public ledger
        </Link>
      </div>
    </aside>
  );
}
