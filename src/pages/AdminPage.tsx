import { useState } from "react";
import { Landmark, Send, ShieldCheck, UserPlus } from "lucide-react";
import { FamilyForm } from "../components/admin/FamilyForm";
import { BudgetForm } from "../components/admin/BudgetForm";
import { PayoutForm } from "../components/admin/PayoutForm";

type Tab = "family" | "budget" | "payout";

const TABS: { id: Tab; label: string; icon: typeof UserPlus }[] = [
  { id: "family", label: "Family Profile", icon: UserPlus },
  { id: "budget", label: "Calamity Budget", icon: Landmark },
  { id: "payout", label: "Vendor Payout", icon: Send },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("family");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-800 bg-ink-950 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-paper-200">
          <ShieldCheck className="h-3 w-3 text-signal-400" /> Restricted access
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-khaki-600">
          LGU Management Portal
        </span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-950">
        Admin interface
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-khaki-700">
        For ground officials and the municipal treasury only. In production
        this sits behind LGU staff authentication — this demo leaves it open
        so you can see how it works.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-ink-950 text-paper-50"
                  : "text-khaki-700 hover:bg-paper-100"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="rounded-xl border border-paper-300 bg-paper-50 p-6">
          {tab === "family" && <FamilyForm />}
          {tab === "budget" && <BudgetForm />}
          {tab === "payout" && <PayoutForm />}
        </div>
      </div>
    </div>
  );
}
