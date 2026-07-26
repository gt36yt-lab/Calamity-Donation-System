import { ArrowRight, Landmark, PackageCheck, Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  calamitySummary,
  getShortfallPhp,
  getTotalNeededPhp,
  supplyCategories,
} from "../../data/mockData";
import { formatPhp } from "../../lib/format";
import { ProgressBar } from "../ui/ProgressBar";

const topCovered = [...supplyCategories]
  .sort((a, b) => b.quantityFunded * b.unitCostPhp - a.quantityFunded * a.unitCostPhp)
  .slice(0, 3);

const topNeeded = [...supplyCategories]
  .map((c) => ({
    ...c,
    remaining: c.quantityNeeded - c.quantityFunded,
  }))
  .sort((a, b) => b.remaining * b.unitCostPhp - a.remaining * a.unitCostPhp)
  .slice(0, 3);

export function SummaryColumns() {
  const lguSharePct = Math.round(
    (calamitySummary.lguFundAllocatedPhp / getTotalNeededPhp()) * 100,
  );

  return (
    <section className="border-b border-paper-300 bg-paper-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 max-w-xl">
          <span className="font-mono text-[11px] uppercase tracking-widest text-khaki-600">
            Three ways to read this fund
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink-950">
            Government coverage, community gap, and how crypto closes it
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Column 1: LGU coverage summary */}
          <div className="flex flex-col rounded-xl border border-paper-300 bg-paper-50 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-verified-500/15 text-verified-600">
              <Landmark className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-ink-950">
              LGU Coverage Summary
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-khaki-700">
              The municipal calamity fund covers about{" "}
              <strong className="text-ink-950">{lguSharePct}%</strong> of the
              total tangible need on its own.
            </p>
            <ul className="mt-4 flex-1 space-y-3">
              {topCovered.map((c) => {
                const pct = (c.quantityFunded / c.quantityNeeded) * 100;
                return (
                  <li key={c.id}>
                    <div className="flex justify-between text-xs text-ink-950">
                      <span>{c.name}</span>
                      <span className="font-mono-num text-khaki-600">
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <ProgressBar percent={pct} tone="verified" size="sm" className="mt-1.5" />
                  </li>
                );
              })}
            </ul>
            <Link
              to="/admin"
              className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-verified-600 hover:text-verified-700"
            >
              See the LGU budget input <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Column 2: What you can contribute */}
          <div className="flex flex-col rounded-xl border border-paper-300 bg-paper-50 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-signal-500/15 text-signal-600">
              <PackageCheck className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-ink-950">
              What You Can Contribute
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-khaki-700">
              <strong className="text-ink-950">{formatPhp(getShortfallPhp())}</strong>{" "}
              in identified needs is still unfunded — donors close this gap,
              category by category or family by family.
            </p>
            <ul className="mt-4 flex-1 space-y-2.5">
              {topNeeded.map((c) => (
                <li key={c.id} className="flex justify-between text-xs">
                  <span className="text-ink-950">{c.name}</span>
                  <span className="font-mono-num text-signal-600">
                    {c.remaining.toLocaleString()} {c.unit}
                    {c.remaining !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/families"
              className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-signal-600 hover:text-signal-700"
            >
              Fund a specific family <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Column 3: How — DeFi / Freighter */}
          <div className="flex flex-col rounded-xl border border-ink-800 bg-ink-950 p-6 text-paper-100">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-paper-100/10 text-paper-50">
              <Wallet2 className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-paper-50">
              How It Works, On-Chain
            </h3>
            <ol className="mt-3 flex-1 space-y-3 text-xs leading-relaxed text-paper-300">
              <li>
                <span className="font-mono text-signal-400">01</span> Connect a
                Stellar wallet — the{" "}
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-paper-50"
                >
                  Freighter
                </a>{" "}
                browser extension is the fastest path.
              </li>
              <li>
                <span className="font-mono text-signal-400">02</span> Send
                XLM, USDC, or PHPC directly to the LGU treasury wallet, or
                earmark it for one family.
              </li>
              <li>
                <span className="font-mono text-signal-400">03</span> Your
                transaction settles on Stellar in ~5 seconds and appears on
                the public ledger feed instantly.
              </li>
              <li>
                <span className="font-mono text-signal-400">04</span> The LGU
                converts funds to pesos and pays local vendors — every
                disbursement is logged with a receipt and a transaction hash.
              </li>
            </ol>
            <Link
              to="/donate"
              className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-signal-500 px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-signal-400"
            >
              Connect Freighter &amp; donate <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
