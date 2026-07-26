/**
 * stellar.ts
 *
 * All Stellar / Soroban helpers used by the frontend.
 *
 * Donation flow (v3):
 *   TWO separate transactions, submitted sequentially:
 *     Tx 1 — Classic Horizon Payment: XLM from donor → LGU wallet
 *     Tx 2 — Soroban InvokeHostFunction: record_donation() on the contract
 *
 *   Why two transactions instead of one?
 *   A Soroban transaction may only contain exactly ONE InvokeHostFunction op.
 *   Mixing a classic Payment op into the same transaction produces txMalformed
 *   (-16) because the network rejects multi-op Soroban transactions outright.
 *
 *   The contract only records amounts — it never moves tokens — so the
 *   payment and the logging can safely live in separate transactions.
 *   If Tx 1 fails we abort before Tx 2, keeping the ledger consistent.
 */

import {
  Asset,
  BASE_FEE,
  Contract,
  Horizon,
  Memo,
  Networks,
  nativeToScVal,
  Operation,
  scValToNative,
  StrKey,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import * as SorobanRpc from "@stellar/stellar-sdk/rpc";
import freighterApi, { isBrowser } from "@stellar/freighter-api";
import { calamitySummary } from "../data/mockData";

// ---------------------------------------------------------------------------
// Network + URL config  (override via .env)
// ---------------------------------------------------------------------------

export type StellarNetwork = "testnet" | "public";

const envNetwork = import.meta.env.VITE_STELLAR_NETWORK as StellarNetwork | undefined;
export const NETWORK: StellarNetwork = envNetwork ?? calamitySummary.stellarNetwork;

/** LGU treasury wallet — set VITE_LGU_WALLET in .env for a real deployment. */
export const LGU_WALLET_ADDRESS: string =
  (import.meta.env.VITE_LGU_WALLET as string | undefined) ||
  calamitySummary.lguWalletPublicKey;

/**
 * Deployed Soroban contract ID.  Deploy the Rust contract and put the
 * resulting contract address here (or set VITE_CONTRACT_ID in .env).
 *
 * Format: C… (56-char Stellar contract address).
 */
export const CONTRACT_ID: string =
  (import.meta.env.VITE_CONTRACT_ID as string | undefined) ||
  // Fallback to the constant in App.tsx via the env var; if neither is set
  // the donate button will show a "contract not configured" error gracefully.
  "";

export const NETWORK_PASSPHRASE =
  NETWORK === "public" ? Networks.PUBLIC : Networks.TESTNET;

export const HORIZON_URL =
  NETWORK === "public"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

/** Soroban RPC endpoint (Stellar Foundation-hosted). */
export const SOROBAN_RPC_URL =
  NETWORK === "public"
    ? "https://mainnet.stellar.validationcloud.io/v1/XCSmR1sD7NKQB4yCgBqnQfpMpWJJCDa0ZcnhCz2NMHY"
    : "https://soroban-testnet.stellar.org";

export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export const EXPLORER_BASE =
  NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

// ---------------------------------------------------------------------------
// Server singletons
// ---------------------------------------------------------------------------

let horizonServer: Horizon.Server | null = null;
export function getServer(): Horizon.Server {
  if (!horizonServer) {
    horizonServer = new Horizon.Server(HORIZON_URL, { allowHttp: false });
  }
  return horizonServer;
}

let sorobanServer: SorobanRpc.Server | null = null;
export function getSorobanServer(): SorobanRpc.Server {
  if (!sorobanServer) {
    sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: false });
  }
  return sorobanServer;
}

// ---------------------------------------------------------------------------
// Account / balance helpers
// ---------------------------------------------------------------------------

export interface WalletBalance {
  asset: string;
  code: string;
  balance: string;
}

/** Reads on-chain balances for a public key from Horizon. Returns null on failure. */
export async function fetchAccountBalances(
  publicKey: string,
): Promise<WalletBalance[] | null> {
  try {
    const account = await getServer().loadAccount(publicKey);
    return account.balances.map((b) => {
      if (b.asset_type === "native") {
        return { asset: "native", code: "XLM", balance: b.balance };
      }
      const code =
        "asset_code" in b && b.asset_code ? b.asset_code : "UNKNOWN";
      return { asset: b.asset_type, code, balance: b.balance };
    });
  } catch {
    return null;
  }
}

export interface RecentPayment {
  id: string;
  txHash: string;
  from: string;
  to: string;
  assetCode: string;
  amount: string;
  createdAt: string;
}

/** Reads recent incoming payments for a public key from Horizon. Returns null on failure. */
export async function fetchRecentPayments(
  publicKey: string,
  limit = 10,
): Promise<RecentPayment[] | null> {
  try {
    const page = await getServer()
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return page.records.flatMap((r): RecentPayment[] => {
      if (r.type === "create_account") {
        return [
          {
            id: r.id,
            txHash: r.transaction_hash,
            from: r.funder,
            to: r.account,
            assetCode: "XLM",
            amount: r.starting_balance,
            createdAt: r.created_at,
          },
        ];
      }
      if (r.type === "payment") {
        return [
          {
            id: r.id,
            txHash: r.transaction_hash,
            from: r.from,
            to: r.to,
            assetCode: r.asset_type === "native" ? "XLM" : (r.asset_code ?? "?"),
            amount: r.amount,
            createdAt: r.created_at,
          },
        ];
      }
      return [];
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Freighter wallet helpers
// ---------------------------------------------------------------------------

export function isFreighterAvailable(): boolean {
  return typeof window !== "undefined" && isBrowser;
}

export async function connectFreighter(): Promise<
  { address: string } | { error: string }
> {
  try {
    const access = await freighterApi.requestAccess();
    if (access.error) return { error: access.error.message ?? "Access denied" };
    return { address: access.address };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Freighter not found" };
  }
}

export async function getFreighterNetwork(): Promise<string | null> {
  try {
    const res = await freighterApi.getNetwork();
    if (res.error) return null;
    return res.network;
  } catch {
    return null;
  }
}

export async function getFreighterConnection(): Promise<{
  connected: boolean;
  address?: string;
  network?: string;
}> {
  try {
    const connected = await freighterApi.isConnected();
    if (!connected.isConnected) return { connected: false };
    const addressRes = await freighterApi.getAddress();
    const networkRes = await freighterApi.getNetwork();
    return {
      connected: true,
      address: addressRes.address,
      network: networkRes.network,
    };
  } catch {
    return { connected: false };
  }
}

// ---------------------------------------------------------------------------
// Soroban contract helpers
// ---------------------------------------------------------------------------

/**
 * Converts a decimal XLM string ("12.5000000") to stroops (i128).
 * 1 XLM = 10_000_000 stroops.
 */
export function xlmToStroops(xlmDecimal: string): bigint {
  const [whole, frac = ""] = xlmDecimal.split(".");
  const fracPadded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(fracPadded);
}

/** Converts stroops (i128 as bigint) back to an XLM decimal string. */
export function stroopsToXlm(stroops: bigint): string {
  const whole = stroops / 10_000_000n;
  const frac = (stroops % 10_000_000n).toString().padStart(7, "0");
  return `${whole}.${frac}`;
}

/**
 * Read the current cumulative total (in stroops) from the Soroban contract
 * using a Soroban RPC `simulateTransaction` call — no wallet or auth needed.
 *
 * Returns null on any failure (contract not deployed, RPC down, etc.).
 */
export async function readContractTotal(): Promise<bigint | null> {
  if (!CONTRACT_ID) return null;
  try {
    const server = getSorobanServer();
    const contract = new Contract(CONTRACT_ID);

    // We need a dummy source account for the simulation.  We use the LGU
    // wallet because it should exist on testnet.  If it doesn't exist yet we
    // fall back gracefully.
    let sourceAccount;
    try {
      sourceAccount = await server.getAccount(LGU_WALLET_ADDRESS);
    } catch {
      return null;
    }

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_total"))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simResult)) {
      console.warn("readContractTotal simulation error:", simResult.error);
      return null;
    }

    // The return value is an i128 ScVal.
    const retVal = (simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse)
      .result?.retval;
    if (!retVal) return null;

    const native = scValToNative(retVal) as bigint;
    return native;
  } catch (e) {
    console.warn("readContractTotal failed:", e);
    return null;
  }
}

/**
 * Read the donor count from the contract via simulation (no wallet needed).
 */
export async function readContractDonorCount(): Promise<number | null> {
  if (!CONTRACT_ID) return null;
  try {
    const server = getSorobanServer();
    const contract = new Contract(CONTRACT_ID);

    let sourceAccount;
    try {
      sourceAccount = await server.getAccount(LGU_WALLET_ADDRESS);
    } catch {
      return null;
    }

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_donor_count"))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) return null;

    const retVal = (simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse)
      .result?.retval;
    if (!retVal) return null;

    return Number(scValToNative(retVal));
  } catch {
    return null;
  }
}

/**
 * Donate XLM to the LGU wallet and record it on the Soroban contract.
 *
 * Sends TWO separate transactions:
 *   Tx 1 (Horizon, classic) — Payment: donor XLM → LGU wallet
 *   Tx 2 (Soroban RPC)      — InvokeHostFunction: record_donation()
 *
 * A Soroban transaction must contain exactly one InvokeHostFunction op.
 * Mixing a classic Payment into the same transaction causes txMalformed (-16).
 * Splitting them avoids this entirely. Tx 2 is skipped if Tx 1 fails.
 *
 * Returns the hash of Tx 2 (the contract invocation) so the UI can link
 * directly to the on-chain record.
 */
export async function invokeDonateSoroban(params: {
  donorPublicKey: string;
  amountXlm: string;
  memoText?: string;
}): Promise<{ hash: string } | { error: string }> {
  const { donorPublicKey, amountXlm, memoText = "" } = params;

  if (!CONTRACT_ID) {
    return { error: "Contract ID not configured. Set VITE_CONTRACT_ID in .env." };
  }
  if (!StrKey.isValidEd25519PublicKey(donorPublicKey)) {
    return { error: "Invalid donor public key" };
  }

  try {
    // ── Tx 1: Classic Horizon payment (XLM → LGU wallet) ──────────────────
    const horizonServer = getServer();
    let horizonAccount;
    try {
      horizonAccount = await horizonServer.loadAccount(donorPublicKey);
    } catch {
      return {
        error:
          "Donor account not found on testnet. " +
          "Use Friendbot to fund it first.",
      };
    }

    // Build the payment tx with NO timebounds initially so the XDR handed to
    // Freighter never expires while the user is reading the confirmation modal.
    // We set a fresh maxTime AFTER signTransaction returns, right before submit.
    const paymentTxUnsigned = new TransactionBuilder(horizonAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: { minTime: 0, maxTime: 0 }, // 0 = no upper bound
    })
      .addOperation(
        Operation.payment({
          destination: LGU_WALLET_ADDRESS,
          asset: Asset.native(),
          amount: assetAmountStr(amountXlm),
        }),
      )
      .addMemo(Memo.text(memoText.slice(0, 28)))
      .build();

    const paySignResult = await freighterApi.signTransaction(paymentTxUnsigned.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: donorPublicKey,
    });
    if (paySignResult.error) {
      return { error: paySignResult.error.message ?? "Freighter signing failed (payment)" };
    }

    // Parse the signed tx and update maxTime to now + 5 min, right before
    // submitting. The signature remains valid because timebounds are in the
    // transaction body that was already signed — but maxTime: 0 means
    // "no expiry", so Freighter signed a tx that never expires, and Horizon
    // will accept it immediately.
    // Note: maxTime: 0 (Unix epoch zero) means "no upper bound" in Stellar XDR.
    const signedPaymentTx = TransactionBuilder.fromXDR(
      paySignResult.signedTxXdr,
      NETWORK_PASSPHRASE,
    );

    try {
      await horizonServer.submitTransaction(signedPaymentTx);
    } catch (horizonErr: unknown) {
      // Horizon throws an object with extras.result_codes — surface it cleanly.
      let detail = "Payment failed";
      if (
        horizonErr &&
        typeof horizonErr === "object" &&
        "response" in horizonErr
      ) {
        const resp = (horizonErr as { response?: { data?: { extras?: { result_codes?: unknown } } } }).response;
        const codes = resp?.data?.extras?.result_codes;
        if (codes) detail = `Payment failed: ${JSON.stringify(codes)}`;
      } else if (horizonErr instanceof Error) {
        detail = horizonErr.message;
      }
      return { error: detail };
    }

    // ── Tx 2: Soroban record_donation() ────────────────────────────────────
    const server = getSorobanServer();
    const contract = new Contract(CONTRACT_ID);
    const stroops = xlmToStroops(amountXlm);

    // Build ScVal arguments
    const donorScVal = xdr.ScVal.scvAddress(
      xdr.ScAddress.scAddressTypeAccount(
        xdr.PublicKey.publicKeyTypeEd25519(
          StrKey.decodeEd25519PublicKey(donorPublicKey),
        ),
      ),
    );
    const amountScVal = nativeToScVal(stroops, { type: "i128" });
    const memoScVal = xdr.ScVal.scvString(
      new TextEncoder().encode(memoText.slice(0, 28)),
    );

    // Load fresh account (sequence number advanced after Tx 1).
    let account;
    try {
      account = await server.getAccount(donorPublicKey);
    } catch {
      return { error: "Could not load account for contract invocation." };
    }

    // Simulate to get sorobanData + resource fee.
    // maxTime: 0 = no upper bound — simulation ignores timebounds anyway.
    const simTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: { minTime: 0, maxTime: 0 },
    })
      .addOperation(
        contract.call("record_donation", donorScVal, amountScVal, memoScVal),
      )
      .build();

    const simResult = await server.simulateTransaction(simTx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      return { error: `Contract simulation failed: ${simResult.error}` };
    }
    const sim = simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse;
    const simFee = parseInt(sim.minResourceFee ?? "0", 10);
    const totalFee = String(simFee + 200_000);

    // Re-fetch sequence after simulation (sequence advanced after Tx 1).
    let freshAccount;
    try {
      freshAccount = await server.getAccount(donorPublicKey);
    } catch {
      return { error: "Could not refresh account sequence number." };
    }

    // maxTime: 0 — no expiry. Signed before Freighter opens so the tx never
    // goes stale while the user is reading the modal.
    const contractTx = new TransactionBuilder(freshAccount, {
      fee: totalFee,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: { minTime: 0, maxTime: 0 },
    })
      .addOperation(
        contract.call("record_donation", donorScVal, amountScVal, memoScVal),
      )
      .build();

    // assembleTransaction injects sorobanData + auth from simulation.
    const assembled = SorobanRpc.assembleTransaction(contractTx, sim).build();

    const contractSignResult = await freighterApi.signTransaction(assembled.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: donorPublicKey,
    });
    if (contractSignResult.error) {
      return { error: contractSignResult.error.message ?? "Freighter signing failed (contract)" };
    }

    const signedContractTx = TransactionBuilder.fromXDR(
      contractSignResult.signedTxXdr,
      NETWORK_PASSPHRASE,
    );

    const submitResult = await server.sendTransaction(signedContractTx);
    if (submitResult.status === "ERROR") {
      let reason = "unknown";
      try { reason = JSON.stringify(submitResult.errorResult); } catch { /* ignore */ }
      return { error: `Contract submission failed: ${reason}` };
    }

    // Poll for on-chain confirmation.
    const txHash = submitResult.hash;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const s = await server.getTransaction(txHash);
      if (s.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return { hash: txHash };
      }
      if (s.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        return {
          error:
            `Contract call failed on-chain. ` +
            `View: ${EXPLORER_BASE}/tx/${txHash}`,
        };
      }
    }
    return { hash: txHash };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Donation failed" };
  }
}

/** Clamp XLM decimal string to 7 decimal places for the Payment operation. */
function assetAmountStr(xlm: string): string {
  const [whole, frac = ""] = xlm.split(".");
  return `${whole}.${frac.padEnd(7, "0").slice(0, 7)}`;
}

// ---------------------------------------------------------------------------
// Classic XLM payment (kept as fallback / non-contract path)
// ---------------------------------------------------------------------------

/**
 * Builds a native XLM payment transaction (classic, not Soroban) and signs
 * it with Freighter.  Used as a fallback when the contract is not configured.
 */
export async function sendDonationPayment(params: {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  assetCode?: "XLM";
  memoText?: string;
}): Promise<{ hash: string } | { error: string }> {
  const { sourcePublicKey, destinationPublicKey, amount, memoText } = params;
  try {
    const account = await getServer().loadAccount(sourcePublicKey);
    // maxTime: 0 means no upper bound — the tx never expires in Freighter's
    // confirmation modal. Horizon accepts it immediately on submit.
    const txBuilder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: { minTime: 0, maxTime: 0 },
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: Asset.native(),
          amount,
        }),
      );

    if (memoText) {
      txBuilder.addMemo(Memo.text(memoText.slice(0, 28)));
    }

    const tx = txBuilder.build();

    const signResult = await freighterApi.signTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: sourcePublicKey,
    });
    if (signResult.error) {
      return { error: signResult.error.message ?? "Signing failed" };
    }

    const signedTx = TransactionBuilder.fromXDR(
      signResult.signedTxXdr,
      NETWORK_PASSPHRASE,
    );
    const submitResult = await getServer().submitTransaction(signedTx);
    return { hash: submitResult.hash };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Transaction failed" };
  }
}

// ---------------------------------------------------------------------------
// Friendbot
// ---------------------------------------------------------------------------

export async function fundWithFriendbot(
  publicKey: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    if (!res.ok) return { error: `Friendbot responded ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Friendbot unreachable" };
  }
}
