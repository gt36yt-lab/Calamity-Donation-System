import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, MapPin, Radio, Users, Zap } from "lucide-react";
import {
  calamitySummary,
  getShortfallPhp,
  getTotalNeededPhp,
  ledgerEntries,
  supplyCategories,
} from "../../data/mockData";
import { formatDate, formatNumber, formatPhp } from "../../lib/format";
import {
  CONTRACT_ID,
  EXPLORER_BASE,
  LGU_WALLET_ADDRESS,
  NETWORK,
  fetchAccountBalances,
  readContractDonorCount,
  readContractTotal,
  stroopsToXlm,
  type WalletBalance,
} from "../../lib/stellar";
import { MouseTooltip } from "../ui/MouseTooltip";
import { ProgressBar } from "../ui/ProgressBar";

const outflows = ledgerEntries.filter((e) => e.type === "outflow");

function remainingItems() {
  return supplyCategories
    .map((c) => ({
      name: c.name,
      remainingQty: Math.max(0, c.quantityNeeded - c.quantityFunded),
      remainingCost: Math.max(0, c.quantityNeeded - c.quantityFunded) * c.unitCostPhp,
      unit: c.unit,
    }))
    .filter((c) => c.remainingQty > 0)
    .sort((a, b) => b.remainingCost - a.remainingCost);
}

export function HeroStats() {
  const totalNeeded = getTotalNeededPhp();
  const shortfall = getShortfallPhp();
  const metSoFar = totalNeeded - shortfall;
  const lguAllocated = calamitySummary.lguFundAllocatedPhp;
  const lguDisbursed = calamitySummary.lguFundDisbursedPhp;
  const fundedRatio = Math.min(1, metSoFar / totalNeeded);
  const items = remainingItems();

  const [balances, setBalances] = useState<WalletBalance[] | null | "loading">("loading");

  /** Live on-chain total from Soroban contract (stroops as bigint, null = not available). */
  const [contractTotal, setContractTotal] = useState<bigint | null | "loading">("loading");
  const [contractDonors, setContractDonors] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Fetch Horizon balances + Soroban contract stats in parallel.
    Promise.all([
      fetchAccountBalances(LGU_WALLET_ADDRESS),
      readContractTotal(),
      readContractDonorCount(),
    ]).then(([bal, total, donors]) => {
      if (cancelled) return;
      setBalances(bal);
      setContractTotal(total);
      setContractDonors(donors);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="hero-glow contour-rings relative overflow-hidden border-b-2 border-alert-600/40 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Status strip */}
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="inline-flex -rotate-1 items-center gap-2 rounded-full bg-alert-500 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-alert-600/30">
            <Radio className="h-3.5 w-3.5 animate-pulse-dot" />
            Signal No. {calamitySummary.signalLevel} · Active Response
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-paper-100">
            <MapPin className="h-3.5 w-3.5 text-signal-400" />
            {calamitySummary.cityName}, {calamitySummary.provinceName}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-paper-100">
            <Users className="h-3.5 w-3.5 text-signal-400" />
            {formatNumber(calamitySummary.affectedFamilies)} families ·{" "}
            {calamitySummary.affectedBarangays} barangays affected
          </span>
          <span className="text-xs text-paper-300/80">
            Declared {formatDate(calamitySummary.declaredOn)}
          </span>
        </div>

        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-paper-50 sm:text-5xl">
          {calamitySummary.calamityName}: every peso, tracked from wallet to
          warehouse to household.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-paper-200">
          Funded jointly by the LGU calamity fund and Stellar-network donors —
          hover any figure below to see exactly what it means on the ground.
        </p>

        {/* Fund + Contribute bars */}
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          <MouseTooltip
            className="h-full"
            panelTitle="What the LGU fund has covered"
            trigger={
              <div className="h-full rounded-xl border-2 border-ink-700 bg-ink-900 p-5 transition-colors hover:border-verified-500/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-paper-300">
                    LGU Calamity Fund
                  </span>
                  <span className="font-mono text-[10px] text-paper-400/70">hover ↓</span>
                </div>
                <div className="mt-2 font-mono-num text-3xl font-bold text-paper-50 sm:text-4xl">
                  {formatPhp(lguAllocated)}
                </div>
                <ProgressBar
                  percent={(lguDisbursed / lguAllocated) * 100}
                  tone="verified"
                  size="sm"
                  className="mt-4"
                />
                <div className="mt-2 text-[11px] font-medium text-verified-400">
                  {formatPhp(lguDisbursed, { compact: true })} disbursed to date
                </div>
              </div>
            }
          >
            <p className="mb-3.5 text-sm leading-relaxed text-paper-200">
              {formatPhp(lguDisbursed)} of the fund has already reached
              vendors. Verified disbursements so far:
            </p>
            <ul className="space-y-3 border-t border-ink-800 pt-3">
              {outflows.slice(0, 3).map((o) => (
                <li key={o.id} className="text-sm leading-snug text-paper-200">
                  <span className="font-mono-num font-semibold text-verified-400">
                    {formatPhp(o.phpAmount, { compact: true })}
                  </span>{" "}
                  — {o.purpose}
                </li>
              ))}
            </ul>
          </MouseTooltip>

          <MouseTooltip
            className="h-full"
            panelTitle="Tangible items still needed"
            trigger={
              <div
                className="relative h-full overflow-hidden rounded-xl border-2 border-alert-400/40 p-5 shadow-lg shadow-alert-600/20 transition-shadow hover:shadow-alert-600/30"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-alert-600), var(--color-signal-600))",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/90">
                    To Contribute
                  </span>
                  <span className="font-mono text-[10px] text-white/70">hover ↓</span>
                </div>
                <div className="mt-2 font-mono-num text-3xl font-bold text-white sm:text-4xl">
                  {formatPhp(shortfall)}
                </div>
                <div className="mt-4 flex items-center gap-1.5 rounded-md bg-black/15 px-2.5 py-1.5 text-[11px] font-semibold text-white">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  shortfall beyond the LGU fund
                </div>
              </div>
            }
          >
            <p className="mb-3.5 text-sm leading-relaxed text-paper-200">
              This total is still tangible goods, itemized below. Fund a whole
              category or a single family on the Family Registry.
            </p>
            <ul className="space-y-2.5 border-t border-ink-800 pt-3">
              {items.map((it) => (
                <li key={it.name} className="flex justify-between gap-3 text-sm leading-snug text-paper-200">
                  <span>
                    {formatNumber(it.remainingQty)} {it.unit}
                    {it.remainingQty !== 1 ? "s" : ""} of{" "}
                    <span className="font-medium text-paper-50">{it.name}</span>
                  </span>
                  <span className="shrink-0 font-mono-num font-semibold text-signal-400">
                    {formatPhp(it.remainingCost, { compact: true })}
                  </span>
                </li>
              ))}
            </ul>
          </MouseTooltip>
        </div>

        {/* Needs bar */}
        <MouseTooltip
          className="mt-4 block"
          panelTitle="Overall needs breakdown"
          trigger={
            <div className="rounded-xl border-2 border-ink-700 bg-ink-900/80 p-5 transition-colors hover:border-signal-500/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper-300">
                  Overall Needs — met &amp; to meet
                </span>
                <span className="font-mono-num text-sm font-semibold text-paper-50">
                  {formatPhp(metSoFar, { compact: true })} met of{" "}
                  {formatPhp(totalNeeded, { compact: true })}
                </span>
              </div>
              <ProgressBar percent={fundedRatio * 100} tone="signal" className="mt-3" />
            </div>
          }
        >
          <ul className="space-y-3 text-sm text-paper-200">
            <li className="flex justify-between">
              <span>Total tangible need</span>
              <span className="font-mono-num font-semibold text-paper-50">{formatPhp(totalNeeded)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-verified-400">Met so far</span>
              <span className="font-mono-num font-semibold text-verified-400">
                {formatPhp(metSoFar)} ({Math.round(fundedRatio * 100)}%)
              </span>
            </li>
            <li className="flex justify-between border-t border-ink-800 pt-3">
              <span className="text-signal-400">Still to meet</span>
              <span className="font-mono-num font-semibold text-signal-400">{formatPhp(shortfall)}</span>
            </li>
          </ul>
        </MouseTooltip>

        {/* Soroban contract live stats */}
        {CONTRACT_ID && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-signal-700/40 bg-signal-900/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal-400 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Soroban Contract · live
              </span>
              <div className="mt-1 font-mono text-xs text-paper-300">
                {CONTRACT_ID.slice(0, 10)}…{CONTRACT_ID.slice(-6)} · {NETWORK}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-mono-num text-xl font-bold text-paper-50">
                  {contractTotal === "loading"
                    ? "…"
                    : contractTotal === null
                      ? "—"
                      : `${Number(stroopsToXlm(contractTotal)).toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`}
                </div>
                <div className="text-[10px] text-paper-400 uppercase tracking-wide">total donated</div>
              </div>
              <div className="text-center">
                <div className="font-mono-num text-xl font-bold text-paper-50">
                  {contractDonors === null ? "—" : contractDonors.toLocaleString()}
                </div>
                <div className="text-[10px] text-paper-400 uppercase tracking-wide">unique donors</div>
              </div>
              <a
                href={`${EXPLORER_BASE}/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-signal-400 hover:text-signal-300"
              >
                Contract <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Stellar wallet tracker */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-verified-700/40 bg-verified-900/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-verified-400">
              LGU Stellar Wallet · live
            </span>
            <div className="mt-1 font-mono text-xs text-paper-300">
              {LGU_WALLET_ADDRESS.slice(0, 10)}…{LGU_WALLET_ADDRESS.slice(-6)} ·{" "}
              {NETWORK}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {balances === "loading" && (
              <span className="text-xs text-paper-400">reading Horizon…</span>
            )}
            {balances === null && (
              <span className="text-xs text-paper-400">
                No live balance yet on this demo account — showing cached
                figures above.
              </span>
            )}
            {Array.isArray(balances) &&
              balances.slice(0, 3).map((b) => (
                <span key={b.code} className="font-mono-num text-sm text-paper-100">
                  {Number(b.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-verified-400">{b.code}</span>
                </span>
              ))}
            <a
              href={`${EXPLORER_BASE}/account/${LGU_WALLET_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-verified-400 hover:text-verified-300"
            >
              View on Stellar Expert <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
