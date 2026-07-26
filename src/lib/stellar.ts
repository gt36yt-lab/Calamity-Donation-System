import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import freighterApi, { isBrowser } from "@stellar/freighter-api";
import { calamitySummary } from "../data/mockData";

export type StellarNetwork = "testnet" | "public";

const envNetwork = import.meta.env.VITE_STELLAR_NETWORK as
  | StellarNetwork
  | undefined;

export const NETWORK: StellarNetwork = envNetwork ?? calamitySummary.stellarNetwork;

/** LGU treasury wallet — override with VITE_LGU_WALLET in .env for a real deployment. */
export const LGU_WALLET_ADDRESS: string =
  (import.meta.env.VITE_LGU_WALLET as string | undefined) ||
  calamitySummary.lguWalletPublicKey;

export const NETWORK_PASSPHRASE =
  NETWORK === "public" ? Networks.PUBLIC : Networks.TESTNET;

export const HORIZON_URL =
  NETWORK === "public"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export const EXPLORER_BASE =
  NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

let server: Horizon.Server | null = null;
export function getServer(): Horizon.Server {
  if (!server) {
    server = new Horizon.Server(HORIZON_URL, { allowHttp: false });
  }
  return server;
}

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

// --- Freighter wallet ---

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

/**
 * Builds a native XLM (or other Stellar asset) payment transaction from
 * `sourcePublicKey` to the LGU wallet, has Freighter sign it, then submits
 * it to Horizon. Used by the Donate flow for on-chain contributions.
 */
export async function sendDonationPayment(params: {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string; // decimal string, e.g. "125.5000000"
  assetCode?: "XLM"; // testnet demo only supports native XLM out of the box
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
