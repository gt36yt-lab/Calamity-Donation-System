import { useState, type FormEvent } from "react";
import { Landmark, Save } from "lucide-react";
import { calamitySummary } from "../../data/mockData";
import { formatPhp } from "../../lib/format";

export function BudgetForm() {
  const [allocated, setAllocated] = useState(calamitySummary.lguFundAllocatedPhp);
  const [draft, setDraft] = useState(String(calamitySummary.lguFundAllocatedPhp));
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(draft.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(value) || value < 0) return;
    setAllocated(value);
    setConfirmation(
      `Calamity fund allocation updated to ${formatPhp(value)}. This recalculates the shortfall shown on the public dashboard.`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-ink-950">
          Calamity Budget Input
        </h3>
        <p className="mt-1 text-xs text-khaki-700">
          Update the official government fund allocated to this response. The
          public shortfall figure recalculates immediately.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-verified-500/30 bg-verified-500/5 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verified-500/15 text-verified-600">
          <Landmark className="h-5 w-5" />
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-verified-600">
            Current allocation
          </div>
          <div className="font-mono-num text-xl font-semibold text-ink-950">
            {formatPhp(allocated)}
          </div>
        </div>
      </div>

      <label className="block text-xs font-medium text-ink-950">
        New allocation (₱)
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="mt-1.5 w-full max-w-xs rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm font-mono focus:border-signal-500"
        />
      </label>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper-50 hover:bg-ink-800"
      >
        <Save className="h-4 w-4" /> Save allocation
      </button>

      {confirmation && (
        <div className="rounded-lg border border-verified-500/30 bg-verified-500/8 px-4 py-3 text-xs text-verified-700">
          {confirmation}
        </div>
      )}
    </form>
  );
}
