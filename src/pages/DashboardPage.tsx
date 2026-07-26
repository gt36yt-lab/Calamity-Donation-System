import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroStats } from "../components/dashboard/HeroStats";
import { SummaryColumns } from "../components/dashboard/SummaryColumns";
import { NeedsInventory } from "../components/dashboard/NeedsInventory";

export default function DashboardPage() {
  return (
    <div>
      <HeroStats />
      <NeedsInventory />
      <SummaryColumns />

      <section className="border-t border-paper-300 bg-ink-950 contour-rings">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-paper-50 sm:text-3xl">
              Fund the shortfall directly.
            </h2>
            <p className="mt-2 max-w-md text-sm text-paper-300">
              Every donation is a Stellar transaction — traceable from your
              wallet to a receipt at a local supplier.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 rounded-full bg-alert-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-alert-400"
            >
              Donate via Stellar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/families"
              className="inline-flex items-center gap-2 rounded-full border border-paper-300/30 px-5 py-3 text-sm font-semibold text-paper-100 transition-colors hover:border-paper-100"
            >
              <Users className="h-4 w-4" /> Browse the Family Registry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
