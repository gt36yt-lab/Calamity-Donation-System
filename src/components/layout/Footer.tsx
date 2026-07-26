import { Compass } from "lucide-react";
import { calamitySummary } from "../../data/mockData";
import { LGU_WALLET_ADDRESS, NETWORK } from "../../lib/stellar";
import { truncateAddress } from "../../lib/format";

export function Footer() {
  return (
    <footer className="border-t border-paper-300 bg-ink-950 text-paper-200">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-paper-50">
              <Compass className="h-4 w-4 text-signal-400" />
              <span className="font-display text-sm font-bold">TranspaRelief</span>
            </div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-paper-300/80">
              An open ledger for calamity relief in {calamitySummary.cityName},{" "}
              {calamitySummary.provinceName}. Every peso donated is tracked from
              Stellar wallet to warehouse to household.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-khaki-500">
              LGU Treasury Wallet
            </div>
            <p className="mt-2 break-all font-mono text-xs text-paper-300/80">
              {truncateAddress(LGU_WALLET_ADDRESS, 10, 10)}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-verified-400">
              Stellar {NETWORK}
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-khaki-500">
              Built for the StellarX PH roadshow
            </div>
            <p className="mt-2 text-xs leading-relaxed text-paper-300/80">
              Frontend demo only — figures shown are illustrative sample data,
              not a live disaster response.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-ink-800 pt-5 text-[11px] text-paper-300/60">
          © {new Date().getFullYear()} TranspaRelief. Not affiliated with any
          real local government unit.
        </div>
      </div>
    </footer>
  );
}
