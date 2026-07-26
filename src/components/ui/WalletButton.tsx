import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { truncateAddress } from "../../lib/format";
import { EXPLORER_BASE } from "../../lib/stellar";

export function WalletButton() {
  const { address, network, balances, status, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (status === "connected" && address) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-verified-500/60 bg-verified-700/20 px-3 py-1.5 font-mono text-xs text-verified-400 transition-colors hover:bg-verified-700/30"
        >
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-verified-400" />
          {truncateAddress(address)}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-ink-800 bg-ink-950 p-4 text-paper-100 shadow-2xl shadow-black/50">
            <div className="font-mono text-[10px] uppercase tracking-widest text-khaki-500">
              Connected wallet
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="break-all font-mono text-xs text-paper-50">{address}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md p-1 text-khaki-500 hover:bg-ink-800 hover:text-paper-50"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-verified-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-khaki-500">Network</span>
              <span className="font-mono uppercase text-paper-100">
                {network ?? "unknown"}
              </span>
            </div>

            <div className="mt-3 space-y-1.5 border-t border-ink-800 pt-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-khaki-500">
                Balances
              </span>
              {Array.isArray(balances) && balances.length > 0 ? (
                balances.map((b) => (
                  <div key={b.code} className="flex justify-between text-xs">
                    <span className="text-paper-200">{b.code}</span>
                    <span className="font-mono-num text-paper-50">
                      {Number(b.balance).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-paper-400">
                  No balances found on this network yet.
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-3">
              <a
                href={`${EXPLORER_BASE}/account/${address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-verified-400 hover:text-verified-300"
              >
                Stellar Expert <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-alert-400 hover:text-alert-300"
              >
                <LogOut className="h-3 w-3" /> Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-paper-300/40 px-3 py-1.5 text-xs font-medium text-paper-200 hover:border-signal-400 hover:text-signal-400"
      >
        Install Freighter
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={status === "connecting"}
      className="inline-flex items-center gap-1.5 rounded-full bg-signal-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition-colors hover:bg-signal-400 disabled:opacity-60"
    >
      <Wallet className="h-3.5 w-3.5" />
      {status === "connecting" ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
