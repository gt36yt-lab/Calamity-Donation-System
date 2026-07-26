import { useState } from "react";
import {
  Droplets,
  FlaskConical,
  Heart,
  Home,
  Package,
  ShowerHead,
  Sun,
  Tent,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supplyCategories, assetRates } from "../../data/mockData";
import { formatAsset, formatNumber, formatPhp, phpToAsset } from "../../lib/format";
import { ProgressBar } from "../ui/ProgressBar";
import { LedgerPanel } from "./LedgerPanel";

const ICONS: Record<string, LucideIcon> = {
  Wheat,
  Package,
  Home,
  Droplets,
  ShowerHead,
  Tent,
  Sun,
  FlaskConical,
};

type DisplayAsset = "PHP" | "XLM" | "USDC" | "PHPC";

export function NeedsInventory() {
  const [displayAsset, setDisplayAsset] = useState<DisplayAsset>("PHP");

  function renderCost(php: number) {
    if (displayAsset === "PHP") return formatPhp(php);
    const rate = assetRates.find((r) => r.asset === displayAsset)?.phpRate ?? 1;
    return formatAsset(phpToAsset(php, rate), displayAsset);
  }

  return (
    <section className="bg-paper-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-lg">
            <span className="font-mono text-[11px] uppercase tracking-widest text-khaki-600">
              Master Needs Inventory
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink-950">
              City-wide supply manifest
            </h2>
            <p className="mt-1.5 text-sm text-khaki-700">
              Individual family requests, combined for volume procurement —
              donate straight into a category, and watch it land in the
              ledger on the right.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-paper-300 bg-paper-100 p-1">
            {(["PHP", "XLM", "USDC", "PHPC"] as DisplayAsset[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setDisplayAsset(a)}
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors ${
                  displayAsset === a
                    ? "bg-ink-950 text-paper-50"
                    : "text-khaki-700 hover:text-ink-950"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: supply manifest table */}
          <div className="overflow-hidden rounded-xl border border-paper-300">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-paper-300 bg-paper-100 text-left font-mono text-[10px] uppercase tracking-widest text-khaki-600">
                    <th className="px-4 py-3 font-medium">Supply</th>
                    <th className="px-4 py-3 font-medium">Funded / needed</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 text-right font-medium">Remaining cost</th>
                    <th className="px-4 py-3 text-right font-medium">Donate</th>
                  </tr>
                </thead>
                <tbody>
                  {supplyCategories.map((c, i) => {
                    const Icon = ICONS[c.icon] ?? Package;
                    const pct = (c.quantityFunded / c.quantityNeeded) * 100;
                    const remainingQty = c.quantityNeeded - c.quantityFunded;
                    const remainingCost = remainingQty * c.unitCostPhp;
                    const fullyFunded = remainingQty <= 0;
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-paper-200 last:border-0 ${
                          i % 2 === 1 ? "bg-paper-50" : "bg-paper-50/40"
                        } hover:bg-paper-100/70`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-950/5 text-ink-800">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="font-medium text-ink-950">{c.name}</div>
                              <div className="font-mono text-[10px] text-khaki-500">
                                {renderCost(c.unitCostPhp)} / {c.unit}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono-num text-xs text-khaki-700">
                          <span className="text-verified-600">{formatNumber(c.quantityFunded)}</span>
                          {" / "}
                          {formatNumber(c.quantityNeeded)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              percent={pct}
                              tone={pct >= 100 ? "verified" : "signal"}
                              size="sm"
                              className="w-20"
                            />
                            <span className="font-mono-num text-xs text-khaki-600">
                              {Math.round(pct)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-num font-semibold text-ink-950">
                          {fullyFunded ? "—" : renderCost(remainingCost)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {fullyFunded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-verified-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase text-verified-600">
                              Funded
                            </span>
                          ) : (
                            <Link
                              to={`/donate?item=${c.id}`}
                              className="inline-flex items-center gap-1 rounded-full bg-ink-950 px-3 py-1.5 text-[11px] font-semibold text-paper-50 transition-colors hover:bg-alert-600"
                            >
                              <Heart className="h-3 w-3" /> Donate
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: live ledger + wallet panel */}
          <LedgerPanel />
        </div>

        <p className="mt-3 text-[11px] text-khaki-600">
          Conversion rates are illustrative sample figures — production reads
          would poll a live price feed for XLM/USDC and the PHPC peso-pegged
          rate.
        </p>
      </div>
    </section>
  );
}
