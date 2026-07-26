import { useState, type FormEvent } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { formatPhp } from "../../lib/format";

interface DraftNeed {
  id: string;
  label: string;
  quantity: number;
  unitCostPhp: number;
}

const BARANGAYS = [
  "Barangay Look",
  "Barangay Tubod",
  "Barangay Riverside",
  "Barangay Sto. Niño",
  "Barangay Bagong Sikat",
];

let draftIdCounter = 0;
function nextDraftId() {
  draftIdCounter += 1;
  return `draft-${draftIdCounter}`;
}

export function FamilyForm() {
  const [barangay, setBarangay] = useState(BARANGAYS[0]);
  const [householdSize, setHouseholdSize] = useState(4);
  const [urgency, setUrgency] = useState<"critical" | "high" | "moderate">("moderate");
  const [needs, setNeeds] = useState<DraftNeed[]>([
    { id: nextDraftId(), label: "Emergency Food Packs", quantity: 2, unitCostPhp: 750 },
  ]);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const total = needs.reduce((s, n) => s + n.quantity * n.unitCostPhp, 0);

  function updateNeed(id: string, patch: Partial<DraftNeed>) {
    setNeeds((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function addNeed() {
    setNeeds((prev) => [
      ...prev,
      { id: nextDraftId(), label: "", quantity: 1, unitCostPhp: 0 },
    ]);
  }

  function removeNeed(id: string) {
    setNeeds((prev) => prev.filter((n) => n.id !== id));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextId = `FAM-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmation(
      `${nextId} registered in ${barangay} — ${needs.length} need${
        needs.length !== 1 ? "s" : ""
      } totaling ${formatPhp(total)} added to the master inventory.`,
    );
    setNeeds([{ id: nextDraftId(), label: "", quantity: 1, unitCostPhp: 0 }]);
    setHouseholdSize(4);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-ink-950">
          Register a Family
        </h3>
        <p className="mt-1 text-xs text-khaki-700">
          Ground officials log new households and itemize what they need.
          Aliases are generated automatically — never store real names here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-ink-950">
          Barangay
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          >
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-ink-950">
          Household size
          <input
            type="number"
            min={1}
            value={householdSize}
            onChange={(e) => setHouseholdSize(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          />
        </label>
        <label className="text-xs font-medium text-ink-950">
          Urgency
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as typeof urgency)}
            className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
          </select>
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-950">Itemized needs</span>
          <button
            type="button"
            onClick={addNeed}
            className="inline-flex items-center gap-1 text-xs font-semibold text-verified-600 hover:text-verified-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {needs.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-paper-300 bg-paper-50 p-2.5">
              <input
                type="text"
                placeholder="Item, e.g. CGI Roofing Sheets"
                value={n.label}
                onChange={(e) => updateNeed(n.id, { label: e.target.value })}
                className="min-w-[160px] flex-1 rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-xs focus:border-signal-500"
                required
              />
              <input
                type="number"
                min={1}
                value={n.quantity}
                onChange={(e) => updateNeed(n.id, { quantity: Number(e.target.value) })}
                className="w-20 rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-xs focus:border-signal-500"
                aria-label="Quantity"
              />
              <input
                type="number"
                min={0}
                value={n.unitCostPhp}
                onChange={(e) => updateNeed(n.id, { unitCostPhp: Number(e.target.value) })}
                className="w-24 rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-xs focus:border-signal-500"
                aria-label="Unit cost in pesos"
              />
              <button
                type="button"
                onClick={() => removeNeed(n.id)}
                disabled={needs.length === 1}
                className="rounded-md p-1.5 text-khaki-500 hover:bg-alert-500/10 hover:text-alert-600 disabled:opacity-30"
                aria-label="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper-200 pt-4">
        <span className="text-sm text-khaki-700">
          Estimated total:{" "}
          <span className="font-mono-num font-semibold text-ink-950">
            {formatPhp(total)}
          </span>
        </span>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper-50 hover:bg-ink-800"
        >
          <UserPlus className="h-4 w-4" /> Register family
        </button>
      </div>

      {confirmation && (
        <div className="rounded-lg border border-verified-500/30 bg-verified-500/8 px-4 py-3 text-xs text-verified-700">
          {confirmation}
        </div>
      )}
    </form>
  );
}
