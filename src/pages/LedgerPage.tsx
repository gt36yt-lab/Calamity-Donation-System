import { useMemo, useState } from "react";
import { Radio } from "lucide-react";
import { ledgerEntries } from "../data/mockData";
import { formatPhp } from "../lib/format";
import { LedgerEntryRow } from "../components/ledger/LedgerFeed";

type Filter = "all" | "inflow" | "outflow";

export default function LedgerPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () =>
      [...ledgerEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [],
  );

  const filtered = sorted.filter((e) => filter === "all" || e.type === filter);

  const totalInflow = ledgerEntries
    .filter((e) => e.type === "inflow")
    .reduce((s, e) => s + e.phpEquivalent, 0);
  const totalOutflow = ledgerEntries
    .filter((e) => e.type === "outflow")
    .reduce((s, e) => s + e.phpAmount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-alert-500/40 bg-alert-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-alert-500">
          <Radio className="h-3 w-3 animate-pulse-dot" /> Live
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-khaki-600">
          Public audit log
        </span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-950">
        The Stellar Ledger Feed
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-khaki-700">
        Every donation in, every disbursement out — pulled directly from
        Horizon and cross-checked against a delivery receipt before it's
        marked verified.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-verified-500/30 bg-verified-500/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-verified-600">
            Total inflow
          </div>
          <div className="mt-1 font-mono-num text-2xl font-semibold text-ink-950">
            {formatPhp(totalInflow)}
          </div>
        </div>
        <div className="rounded-xl border border-signal-500/30 bg-signal-500/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-signal-600">
            Total outflow
          </div>
          <div className="mt-1 font-mono-num text-2xl font-semibold text-ink-950">
            {formatPhp(totalOutflow)}
          </div>
        </div>
      </div>

      <div className="mt-8 inline-flex rounded-full border border-paper-300 bg-paper-100 p-1">
        {(["all", "inflow", "outflow"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-ink-950 text-paper-50" : "text-khaki-700 hover:text-ink-950"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((entry) => (
          <LedgerEntryRow key={entry.id} entry={entry} />
        ))}
      </div>

      <p className="mt-6 text-[11px] text-khaki-600">
        Transaction hashes shown are illustrative sample data for this
        frontend demo. In production, this feed streams live from{" "}
        <code className="font-mono">Horizon.Server.payments()</code> for the
        LGU treasury wallet.
      </p>
    </div>
  );
}
