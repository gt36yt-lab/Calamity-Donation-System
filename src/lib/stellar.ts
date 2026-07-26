/**
 * stellar.ts
 *
 * All Stellar / Soroban helpers used by the frontend.
 *
 * Classic payments (Horizon) are kept for XLM transfers that don't go through
 * the contract.  Soroban helpers (invokeDonateSoroban, readContractTotal, …)
 * build and sign a contract-invoke transaction via Freighter, then submit it
 * through the Soroban RPC endpoint.
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
 * Invoke the `donate` entry-point of the CalamityDonation Soroban contract.
 *
 * Flow:
 *  1. Build a Soroban contract-invoke transaction.
 *  2. Simulate it via Soroban RPC to get the authorisation footprint.
 *  3. Assemble the transaction (adds the resource fee returned by simulation).
 *  4. Ask Freighter to sign it.
 *  5. Submit via Soroban RPC and poll until final.
 *
 * Returns `{ hash }` on success or `{ error }` on any failure.
 */
export async function invokeDonateSoroban(params: {
  donorPublicKey: string;
  /** Decimal XLM string, e.g. "12.5000000" */
  amountXlm: string;
  /** Optional free-text memo stored in contract storage (≤ 28 chars). */
  memoText?: string;
}): Promise<{ hash: string } | { error: string }> {
  const { donorPublicKey, amountXlm, memoText = "" } = params;

  if (!CONTRACT_ID) {
    return {
      error:
        "Contract ID not configured. Set VITE_CONTRACT_ID in your .env file " +
        "after deploying the Soroban contract.",
    };
  }

  // Validate that the donor key is a valid Stellar address.
  if (!StrKey.isValidEd25519PublicKey(donorPublicKey)) {
    return { error: "Invalid donor public key" };
  }

  try {
    const server = getSorobanServer();
    const contract = new Contract(CONTRACT_ID);

    const stroops = xlmToStroops(amountXlm);

    // Build the ScVal arguments once — they don't depend on sequence number.
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

    // Step 1: Simulate with a throw-away account just to get the resource fee
    //         and auth footprint — sequence number doesn't matter for simulation.
    let simAccount;
    try {
      simAccount = await server.getAccount(donorPublicKey);
    } catch {
      return {
        error:
          "Donor account not found on the network. " +
          "Use Friendbot to fund it on testnet first.",
      };
    }

    const simTx = new TransactionBuilder(simAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call("donate", donorScVal, amountScVal, memoScVal),
      )
      .setTimeout(300)
      .build();

    const simResult = await server.simulateTransaction(simTx);

    if (SorobanRpc.Api.isSimulationError(simResult)) {
      return { error: `Simulation failed: ${simResult.error}` };
    }

    const sim = simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse;
    const simFee = parseInt(sim.minResourceFee ?? "0", 10);
    const totalFee = String(simFee + 100_000); // +0.01 XLM buffer

    // Step 2: Build + assemble the transaction that Freighter will sign.
    //         We fetch a fresh sequence number here so it's current.
    let preSignAccount;
    try {
      preSignAccount = await server.getAccount(donorPublicKey);
    } catch {
      return { error: "Could not refresh account sequence number." };
    }

    const txToSign = SorobanRpc.assembleTransaction(
      new TransactionBuilder(preSignAccount, {
        fee: totalFee,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("donate", donorScVal, amountScVal, memoScVal))
        .setTimeout(300)
        .build(),
      sim,
    ).build();

    // Step 3: Sign with Freighter — user sees the approval dialog here.
    const signResult = await freighterApi.signTransaction(txToSign.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: donorPublicKey,
    });

    if (signResult.error) {
      return { error: signResult.error.message ?? "Freighter signing failed" };
    }

    // Step 4: The signed XDR contains the correct auth entries from Freighter.
    //         Parse it back so we can extract those entries, then rebuild the
    //         transaction from scratch with a brand-new sequence number and
    //         fresh time bounds — this eliminates txTooLate entirely.
    const signedIntermediate = TransactionBuilder.fromXDR(
      signResult.signedTxXdr,
      NETWORK_PASSPHRASE,
    ) as import("@stellar/stellar-sdk").Transaction;

    // Extract the auth entries that Freighter produced.
    const signedOp = signedIntermediate.operations[0] as import("@stellar/stellar-sdk").Operation.InvokeHostFunction;
    const authEntries = signedOp.auth ?? [];

    // Fetch the absolute latest sequence number right before submission.
    let submitAccount;
    try {
      submitAccount = await server.getAccount(donorPublicKey);
    } catch {
      return { error: "Could not refresh account for final submission." };
    }

    // Rebuild with fresh sequence + fresh time bounds (starts NOW).
    const freshOp = contract.call("donate", donorScVal, amountScVal, memoScVal);

    // Attach the signed auth back onto the operation.
    if (authEntries.length > 0 && "auth" in freshOp) {
      (freshOp as { auth?: unknown[] }).auth = authEntries;
    }

    const finalTxBuilder = new TransactionBuilder(submitAccount, {
      fee: totalFee,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(freshOp)
      .setTimeout(300);

    // Copy SorobanData (resource limits + fees) from the simulation.
    const sorobanData = sim.transactionData?.build();
    if (sorobanData) {
      finalTxBuilder.setSorobanData(sorobanData);
    }

    const finalTx = finalTxBuilder.build();

    // Sign the final fresh transaction with Freighter (quick second sign —
    // same operation, just updated sequence + timebounds; Freighter auto-approves
    // if the user already approved an identical operation moments ago).
    const finalSignResult = await freighterApi.signTransaction(finalTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: donorPublicKey,
    });

    if (finalSignResult.error) {
      return { error: finalSignResult.error.message ?? "Final signing failed" };
    }

    const signedFinalTx = TransactionBuilder.fromXDR(
      finalSignResult.signedTxXdr,
      NETWORK_PASSPHRASE,
    );

    const submitResult = await server.sendTransaction(signedFinalTx);

    if (submitResult.status === "ERROR") {
      return {
        error: `Submission failed: ${JSON.stringify(submitResult.errorResult)}`,
      };
    }

    // Step 6: Poll for confirmation (up to 60 s).
    const txHash = submitResult.hash;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusResult = await server.getTransaction(txHash);
      if (statusResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return { hash: txHash };
      }
      if (statusResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        return { error: `Transaction failed on-chain. Hash: ${txHash}` };
      }
      // NOT_FOUND means still pending — keep polling.
    }
    // Optimistic return — likely confirmed by the time the user sees the UI.
    return { hash: txHash };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Soroban invocation failed" };
  }
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
    const txBuilder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: Asset.native(),
          amount,
        }),
      )
      .setTimeout(120);

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
