import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { families } from "../data/mockData";
import { FamilyCard } from "../components/families/FamilyCard";
import type { UrgencyLevel } from "../types";

const BARANGAYS = Array.from(new Set(families.map((f) => f.barangay))).sort();
const URGENCIES: UrgencyLevel[] = ["critical", "high", "moderate"];

export default function FamiliesPage() {
  const [query, setQuery] = useState("");
  const [barangay, setBarangay] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");

  const filtered = useMemo(() => {
    return families.filter((f) => {
      if (barangay !== "all" && f.barangay !== barangay) return false;
      if (urgency !== "all" && f.urgency !== urgency) return false;
      if (query && !f.alias.toLowerCase().includes(query.toLowerCase()) && !f.id.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [query, barangay, urgency]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-widest text-khaki-600">
          Family Registry
        </span>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink-950">
          Micro-level breakdown, by household
        </h1>
        <p className="mt-2 text-sm text-khaki-700">
          Every family is shown by a privacy-friendly alias, never a name.
          Fund a category above, or a single household here.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-paper-300 bg-paper-50 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-khaki-500" />
          <input
            type="text"
            placeholder="Search by family ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-paper-300 bg-paper-50 py-2 pl-9 pr-3 text-sm text-ink-950 placeholder:text-khaki-500 focus:border-signal-500"
          />
        </div>
        <select
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-950 focus:border-signal-500"
        >
          <option value="all">All barangays</option>
          {BARANGAYS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-950 focus:border-signal-500"
        >
          <option value="all">All urgency levels</option>
          {URGENCIES.map((u) => (
            <option key={u} value={u}>
              {u[0].toUpperCase() + u.slice(1)}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-xs text-khaki-600">
          {filtered.length} of {families.length} families
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-sm text-khaki-600">
          No families match those filters. Try widening your search.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <FamilyCard key={f.id} family={f} />
          ))}
        </div>
      )}
    </div>
  );
}
