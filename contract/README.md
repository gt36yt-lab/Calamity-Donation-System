# CalamityDonation — Soroban Smart Contract

Records XLM donations on-chain for the TranspaRelief system.
The contract is a **ledger only** — it never holds or moves tokens.
Actual XLM is sent via a classic Horizon Payment to the LGU wallet;
the contract records the amount, donor, and memo for public auditability.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Rust + cargo | stable ≥ 1.78 |
| `wasm32v1-none` target | see below |
| Stellar CLI | ≥ 27.x |

```powershell
# Add the correct WASM target (required by Stellar CLI v21+)
rustup target add wasm32v1-none

# Verify Stellar CLI
stellar --version   # should print 27.x.x
```

---

## Contract entry-points

| Function | Auth | Description |
|----------|------|-------------|
| `__constructor(admin)` | admin | Runs once at deploy time — sets admin and zeroes counters |
| `record_donation(donor, amount_stroops, memo)` | donor | Logs a donation; does not move tokens |
| `get_total()` | — | Cumulative stroops recorded |
| `get_donor_total(donor)` | — | One donor's cumulative stroops |
| `get_donor_count()` | — | Number of unique donors |
| `get_admin()` | — | Admin address |

`amount_stroops` is a signed 64-bit integer — 1 XLM = 10 000 000 stroops.

---

## Build

Run from the **workspace root** (the folder that contains `Cargo.toml`):

```powershell
stellar contract build
```

Output:

```
target/wasm32v1-none/release/calamity_donation.wasm
```

Run tests (native, no WASM toolchain needed):

```powershell
cargo test --manifest-path contract/Cargo.toml
```

---

## Deploy to Stellar Testnet

### 1. Create and fund a test identity

```powershell
stellar keys generate alice --network testnet --fund
stellar keys address alice   # copy the G… address — this is your admin
```

### 2. Deploy

The `--` separator passes constructor arguments.
`--admin alice` resolves to alice's public key automatically.

```powershell
stellar contract deploy `
  --wasm target/wasm32v1-none/release/calamity_donation.wasm `
  --source-account alice `
  --network testnet `
  -- --admin alice
```

The command prints a contract address (`C…`). Copy it.

### 3. Verify deployment

```powershell
stellar contract invoke `
  --id <CONTRACT_ID> `
  --source-account alice `
  --network testnet `
  -- get_admin
# prints alice's public key

stellar contract invoke `
  --id <CONTRACT_ID> `
  --source-account alice `
  --network testnet `
  -- get_total
# prints "0"
```

---

## Wire into the frontend

Copy `.env.example` to `.env` and fill in your values:

```powershell
Copy-Item .env.example .env
```

```env
VITE_STELLAR_NETWORK=testnet
VITE_LGU_WALLET=<YOUR_LGU_G_ADDRESS>
VITE_CONTRACT_ID=<CONTRACT_ID>
```

Start the dev server:

```powershell
npm run dev
```

The Donate page will now send two transactions on each donation:
1. **Classic Horizon Payment** — XLM from the donor's wallet to `VITE_LGU_WALLET`
2. **Soroban InvokeHostFunction** — calls `record_donation()` to log it on-chain

Both are signed by Freighter in sequence.

---

## Make a test donation via CLI

```powershell
stellar contract invoke `
  --id <CONTRACT_ID> `
  --source-account alice `
  --network testnet `
  --send=yes `
  -- record_donation `
  --donor alice `
  --amount_stroops 10000000 `
  --memo "test-donation"
```

Then read it back:

```powershell
stellar contract invoke `
  --id <CONTRACT_ID> `
  --source-account alice `
  --network testnet `
  -- get_total
# "10000000"  (= 1 XLM)

stellar contract invoke `
  --id <CONTRACT_ID> `
  --source-account alice `
  --network testnet `
  -- get_donor_count
# "1"
```

---

## Storage layout

| Key | Type | TTL | Description |
|-----|------|-----|-------------|
| `Admin` | `Address` | instance | LGU treasury / admin |
| `Total` | `i128` | instance | Cumulative stroops recorded |
| `DonorCount` | `u32` | instance | Unique donor count |
| `DonorTotal(address)` | `i128` | persistent | Per-donor cumulative stroops |

Instance entries are extended to 60 days on every write.
Persistent donor entries are extended to 60 days on every donation.

---

## Useful links

- Deployed contract: https://stellar.expert/explorer/testnet/contract/CAASYYOOPJWHMF2KN5GNZAMKIEHEE77ODJ46GQIPJ3MTUHV45R5HLLLD
- Stellar CLI docs: https://developers.stellar.org/docs/tools/stellar-cli
- Soroban docs: https://developers.stellar.org/docs/smart-contracts
- Friendbot: https://friendbot.stellar.org
