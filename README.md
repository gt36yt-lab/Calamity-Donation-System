# TranspaRelief

A transparent, Stellar-backed disaster relief dashboard for Local Government
Units. It connects macro-level calamity fund accounting to micro-level family
needs, and lets donors watch a peso turn into a Stellar transaction, then a
vendor receipt, then a delivered sack of rice.

This is a **frontend-only** build: Vite + React + TypeScript + Tailwind CSS,
with real `@stellar/stellar-sdk` + `@stellar/freighter-api` wiring for wallet
connect, balance reads, and signing/submitting a payment. All family, ledger,
and fund figures are sample data (`src/data/mockData.ts`) — there is no
backend or database.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. To try the live Stellar flow on the Donate page
you'll need the [Freighter](https://www.freighter.app/) browser extension
set to **Testnet**.

```bash
npm run build     # production build (runs tsc -b, then vite build)
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

## Configuration

Copy `.env.example` to `.env.local` to point the app at a real LGU wallet
instead of the bundled demo keypair:

```bash
VITE_STELLAR_NETWORK=testnet   # or "public"
VITE_LGU_WALLET=G...           # the LGU's real Stellar public key
```

Without a `.env.local`, the app reads `src/data/mockData.ts`, which contains
a validly-formatted but **unfunded** testnet keypair — live balance/payment
reads will gracefully fall back to the cached sample figures.

## Pages

| Route       | Purpose |
| ----------- | ------- |
| `/`         | Hero calamity summary, LGU fund vs. shortfall (hover for detail), master needs inventory table with PHP/XLM/USDC/PHPC toggle |
| `/families` | Family Registry — searchable, filterable cards with itemized needs and a "Fund this family" deep link into Donate |
| `/ledger`   | Public Stellar ledger feed — donor inflows and vendor outflows, each with a Stellar Expert link |
| `/admin`    | LGU Management Portal — family registration, budget input, and multi-signer vendor payout forms (local state only, no auth) |
| `/donate`   | Connect Freighter → choose amount/asset → sign and submit a real testnet payment |

## Stellar integration notes

- `src/lib/stellar.ts` wraps `Horizon.Server` for balance/payment reads and
  Freighter for `requestAccess` / `signTransaction`. It builds a native XLM
  payment with `TransactionBuilder`, signs it via Freighter, and submits it
  to Horizon.
- Non-native assets (USDC/PHPC) are shown for PHP-conversion context on the
  Donate page, but require a trustline to their issuer before a real
  transfer can be signed — the live "sign & send" button is scoped to XLM
  for this demo.
- A Friendbot button appears on Testnet so you can fund a fresh Freighter
  wallet with test XLM before trying the payment flow end-to-end.
- The ledger feed and hero wallet tracker are written to read live Horizon
  data (`fetchAccountBalances`, `fetchRecentPayments`) and fall back to the
  cached mock data on any error (e.g. an unfunded/nonexistent account) —
  swap in a real, funded LGU wallet to see it go fully live.

## Design system

The visual language borrows from two things this project bridges: municipal
paperwork (manifest tables, ink-stamp approvals, dashed tear-lines) and
storm/orbit charts (the contour rings behind the hero, a nod to both a
typhoon's eye and the Stellar network itself). Type is Space Grotesk for
display, Inter for body copy, and JetBrains Mono for all figures, addresses,
and transaction hashes.

## Known trade-offs (frontend-only demo)

- No authentication on `/admin` — forms update local component state only.
- Ledger transaction hashes are illustrative sample data, so their Stellar
  Expert links won't resolve to a real transaction.
- The production bundle includes the full `@stellar/stellar-sdk`; splitting
  it behind a lazy-loaded `/donate` route would meaningfully shrink the
  initial JS payload for a real deployment.
