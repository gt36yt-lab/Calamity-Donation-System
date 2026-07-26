import { useState, type FormEvent } from "react";
import { CheckSquare, Send, Square } from "lucide-react";

const SIGNERS = ["Municipal Mayor", "Municipal Treasurer", "MDRRMO Officer"];
const BARANGAYS = [
  "Barangay Look",
  "Barangay Tubod",
  "Barangay Riverside",
  "Barangay Sto. Niño",
  "Barangay Bagong Sikat",
];

export function PayoutForm() {
  const [vendor, setVendor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [served, setServed] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function toggleBarangay(b: string) {
    setServed((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vendor || !amount) return;
    setConfirmation(
      `Batch payout queued for ${vendor} — requires ${SIGNERS.length - 1} of ${SIGNERS.length} treasury signers before it broadcasts to Stellar.`,
    );
    setVendor("");
    setPurpose("");
    setAmount("");
    setServed([]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-ink-950">
          Vendor Payout Executer
        </h3>
        <p className="mt-1 text-xs text-khaki-700">
          Initiates a multi-signature disbursement from the LGU treasury
          wallet to a local supplier. Nothing broadcasts until the required
          signers approve.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-ink-950">
          Vendor / supplier
          <input
            type="text"
            placeholder="e.g. Malinaw Rice Traders Coop"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
            required
          />
        </label>
        <label className="text-xs font-medium text-ink-950">
          Payout amount (₱)
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 720000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm font-mono focus:border-signal-500"
            required
          />
        </label>
      </div>

      <label className="block text-xs font-medium text-ink-950">
        Purpose
        <input
          type="text"
          placeholder="e.g. 1,500 CGI roofing sheets for shelter repair"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
        />
      </label>

      <div>
        <span className="text-xs font-medium text-ink-950">Barangays served</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {BARANGAYS.map((b) => {
            const active = served.includes(b);
            return (
              <button
                type="button"
                key={b}
                onClick={() => toggleBarangay(b)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-ink-950 bg-ink-950 text-paper-50"
                    : "border-paper-300 text-khaki-700 hover:border-ink-800"
                }`}
              >
                {active ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                {b}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-paper-300 bg-paper-100 p-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-khaki-600">
          Required treasury signers
        </span>
        <ul className="mt-2 space-y-1 text-xs text-ink-950">
          {SIGNERS.map((s) => (
            <li key={s}>· {s}</li>
          ))}
        </ul>
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-signal-400"
      >
        <Send className="h-4 w-4" /> Queue payout for signing
      </button>

      {confirmation && (
        <div className="rounded-lg border border-signal-500/30 bg-signal-500/8 px-4 py-3 text-xs text-signal-700">
          {confirmation}
        </div>
      )}
    </form>
  );
}
