# CalamityDonation — Soroban Smart Contract

Accepts native XLM donations on the Stellar testnet, tracks per-donor totals
on-chain, and lets an authorised LGU admin withdraw accumulated funds to the
treasury wallet.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust + cargo | stable ≥ 1.76 | `rustup update stable` |
| wasm32 target | any | `rustup target add wasm32-unknown-unknown` |
| Stellar CLI | ≥ 0.9 | see below |
| Freighter extension | ≥ 4.x | https://www.freighter.app/ |

### Install the Stellar CLI

```powershell
# Windows (PowerShell) — installs via cargo
cargo install --locked stellar-cli --features opt
```

Or download a pre-built binary from
https://github.com/stellar/stellar-cli/releases and add it to your `PATH`.

Verify:

```powershell
stellar --version
```

---

## 1 — Configure Freighter for Testnet

1. Open the Freighter browser extension.
2. Click the network selector (top-right).
3. Choose **Test Net**.
4. Make a note of your public key — this becomes your **admin address**.

---

## 2 — Fund your admin account with Friendbot

```powershell
stellar keys generate --network testnet admin
stellar keys address admin          # copy the G... address

# Fund it (100 XLM)
curl "https://friendbot.stellar.org?addr=<YOUR_ADMIN_G_ADDRESS>"
```

Or use the **Fund with Friendbot** button on the Donate page after connecting
your Freighter wallet.

---

## 3 — Build the contract

Run from the **workspace root** (the folder that contains `Cargo.toml` and the
`contract/` directory):

```powershell
cd "c:\Users\Evan\Desktop\test\Calamity-Donation-System"

cargo build --manifest-path contract/Cargo.toml --target wasm32-unknown-unknown --release
```

The compiled WASM lands at:

```
target/wasm32-unknown-unknown/release/calamity_donation.wasm
```

> Tip: if you get `error[E0463]: can't find crate for 'std'`, run
> `rustup target add wasm32-unknown-unknown` first.

---

## 4 — Deploy to Stellar Testnet

```powershell
stellar contract deploy `
  --wasm target/wasm32-unknown-unknown/release/calamity_donation.optimized.wasm `
  --source admin `
  --network testnet
```

> Note: always optimize before deploying. Rust 1.87+ emits reference-types
> by default which Stellar's VM rejects. The optimize step strips it out.
> Run `stellar contract optimize` first if you haven't already:
> `stellar contract optimize --wasm target/wasm32-unknown-unknown/release/calamity_donation.wasm`

The command prints a **contract ID** that looks like:

```
CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Copy it — you'll need it in the next step.

---

## 5 — Initialise the contract

The `initialize` entry-point must be called once right after deployment.  Pass
your admin (LGU treasury) public key as the argument.

```powershell
stellar contract invoke `
  --id  <CONTRACT_ID> `
  --source admin `
  --network testnet `
  -- initialize `
  --admin <YOUR_ADMIN_G_ADDRESS>
```

Verify it worked:

```powershell
stellar contract invoke `
  --id  <CONTRACT_ID> `
  --source admin `
  --network testnet `
  -- get_admin
```

Should print your admin address.

---

## 6 — Wire the contract into the frontend

Copy `.env.example` to `.env` in the project root and fill in the values:

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```env
VITE_STELLAR_NETWORK=testnet
VITE_LGU_WALLET=<YOUR_ADMIN_G_ADDRESS>
VITE_CONTRACT_ID=<CONTRACT_ID>
```

Then start the dev server:

```powershell
npm run dev
```

The Donate page will now route XLM donations through the Soroban contract.
The Dashboard will show the live contract total and donor count.

---

## 7 — Make a test donation

1. Open `http://localhost:5173/donate` in Chrome/Brave with Freighter installed.
2. Make sure Freighter is on **Test Net**.
3. Connect your wallet and click **Fund with Friendbot** if your balance is 0.
4. Choose an amount in XLM and click **Sign & send**.
5. Freighter will show an approval dialog — click **Approve**.
6. Watch the "Confirming on-chain…" spinner; when it resolves you'll see a
   transaction hash linked to Stellar Expert.

To confirm the contract recorded the donation:

```powershell
stellar contract invoke `
  --id  <CONTRACT_ID> `
  --source admin `
  --network testnet `
  -- get_total

stellar contract invoke `
  --id  <CONTRACT_ID> `
  --source admin `
  --network testnet `
  -- get_donor_count
```

---

## 8 — Withdraw funds (admin only)

Move all accumulated XLM from the contract to the LGU treasury wallet:

```powershell
stellar contract invoke `
  --id  <CONTRACT_ID> `
  --source admin `
  --network testnet `
  -- withdraw `
  --amount 0 `
  --to <DESTINATION_G_ADDRESS>
```

Pass `--amount 0` to sweep the full balance, or a specific stroop amount
(1 XLM = 10 000 000 stroops) to withdraw a partial amount.

---

## Contract entry-points reference

| Function | Auth | Arguments | Returns |
|----------|------|-----------|---------|
| `initialize` | admin | `admin: Address` | — |
| `donate` | donor | `donor: Address`, `amount: i128` (stroops), `memo: String` | — |
| `withdraw` | admin | `amount: i128` (0 = all), `to: Address` | — |
| `get_total` | — | — | `i128` stroops |
| `get_donor_total` | — | `donor: Address` | `i128` stroops |
| `get_donor_count` | — | — | `u32` |
| `get_admin` | — | — | `Address` |

---

## Useful links

- Stellar testnet explorer: https://stellar.expert/explorer/testnet
- Freighter wallet: https://www.freighter.app/
- Stellar CLI docs: https://developers.stellar.org/docs/tools/stellar-cli
- Soroban docs: https://developers.stellar.org/docs/smart-contracts
- Friendbot: https://friendbot.stellar.org
