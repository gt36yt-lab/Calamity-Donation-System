import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Compass, Menu, X } from "lucide-react";
import { WalletButton } from "../ui/WalletButton";
import { calamitySummary } from "../../data/mockData";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/families", label: "Family Registry" },
  { to: "/ledger", label: "Ledger" },
  { to: "/admin", label: "LGU Portal" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-signal-500 text-signal-400">
            <Compass className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold tracking-tight text-paper-50">
              TranspaRelief
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-khaki-500">
              {calamitySummary.cityName}
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-paper-100 text-ink-950"
                    : "text-paper-200/80 hover:bg-ink-800 hover:text-paper-50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <WalletButton />
          <NavLink
            to="/donate"
            className="rounded-full bg-alert-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-alert-400"
          >
            Donate
          </NavLink>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-paper-100 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-800 bg-ink-950 px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-paper-100 text-ink-950"
                      : "text-paper-200/80 hover:bg-ink-800"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/donate"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-md bg-alert-500 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Donate
            </NavLink>
          </nav>
          <div className="mt-3">
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
