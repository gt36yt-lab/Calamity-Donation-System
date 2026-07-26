import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Droplet,
  ExternalLink,
  Loader2,
  Package,
  Wallet,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  families,
  assetRates,
  getFamilyTotalCostPhp,
  supplyCategories,
} from "../data/mockData";
import { formatAsset, formatNumber, formatPhp, phpToAsset, truncateAddress } from "../lib/format";
import {
  EXPLORER_BASE,
  LGU_WALLET_ADDRESS,
  NETWORK,
  fundWithFriendbot,
  sendDonationPayment,
} from "../lib/stellar";

type Asset = "XLM" | "USDC" | "PHPC";
const ASSETS: Asset[] = ["XLM", "USDC", "PHPC"];
const PRESETS_PHP = [500, 1500, 5000, 15000];

export default function DonatePage() {
  const [params] = useSearchParams();
  const familyId = params.get("family");
  const itemId = params.get("item");

  const family = useMemo(
    () => families.find((f) => f.id === familyId) ?? null,
    [familyId],
  );
  const item = useMemo(
    () => (family ? null : (supplyCategories.find((c) => c.id === itemId) ?? null)),
    [itemId, family],
  );

  const { address, status, balances, connect } = useWallet();

  const [asset, setAsset] = useState<Asset>("XLM");
  const [phpAmount, setPhpAmount] = useState(() => {
    if (family) return Math.max(500, getFamilyTotalCostPhp(family) - family.amountFundedPhp);
    if (item) {
      const remainingCost = (item.quantityNeeded - item.quantityFunded) * item.unitCostPhp;
      return Math.max(item.unitCostPhp, Math.min(remainingCost, 5000));
    }
    return 1500;
  });

  const [friendbotState, setFriendbotState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [sendState, setSendState] = useState<"idle" | "signing" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rate = assetRates.find((r) => r.asset === asset)?.phpRate ?? 1;
  const assetAmount = phpToAsset(phpAmount, rate);

  const memoText = family ? `${family.id} relief` : item ? `${item.id} supply` : "TranspaRelief donation";

  async function handleFriendbot() {
    if (!address) return;
    setFriendbotState("loading");
    const res = await fundWithFriendbot(address);
    setFriendbotState("error" in res ? "error" : "done");
  }

  async function handleSend() {
    if (!address) return;
    setSendState("signing");
    setErrorMsg(null);
    const result = await sendDonationPayment({
      sourcePublicKey: address,
      destinationPublicKey: LGU_WALLET_ADDRESS,
      amount: assetAmount.toFixed(7),
      memoText,
    });
    if ("error" in result) {
      setSendState("error");
      setErrorMsg(result.error);
      return;
    }
    setTxHash(result.hash);
    setSendState("done");
  }

  const heading = family
    ? `Fund ${family.alias}`
    : item
      ? `Fund ${item.name}`
      : "Fund the general calamity wallet";

  const subhead = family
    ? `Your donation is memo-tagged for ${family.id} and appears on the public ledger feed within seconds.`
    : item
      ? `Your donation is memo-tagged for ${item.name} and appears on the public ledger feed within seconds.`
      : "Your donation lands directly in the LGU treasury wallet and appears on the public ledger feed within seconds.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <span className="font-mono text-[11px] uppercase tracking-widest text-khaki-600">
        Donate via Stellar
      </span>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-950">{heading}</h1>
      <p className="mt-2 max-w-xl text-sm text-khaki-700">{subhead}</p>

      {family && (
        <div className="mt-4 rounded-xl border border-paper-300 bg-paper-50 p-4 text-sm">
          <div className="flex justify-between text-xs text-khaki-600">
            <span>{family.barangay}</span>
            <span>
              {formatPhp(family.amountFundedPhp, { compact: true })} of{" "}
              {formatPhp(getFamilyTotalCostPhp(family), { compact: true })} funded
            </span>
          </div>
          <Link to="/families" className="mt-1 inline-block text-xs text-signal-600 hover:underline">
            Choose a different family
          </Link>
        </div>
      )}

      {item && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-paper-300 bg-paper-50 p-4 text-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-950/5 text-ink-800">
            <Package className="h-4.5 w-4.5" />
          </span>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-khaki-600">
              <span>
                {formatNumber(item.quantityNeeded - item.quantityFunded)} {item.unit}
                {item.quantityNeeded - item.quantityFunded !== 1 ? "s" : ""} still needed
              </span>
              <span>{formatPhp(item.unitCostPhp)} / {item.unit}</span>
            </div>
            <Link to="/" className="mt-1 inline-block text-xs text-signal-600 hover:underline">
              Choose a different category
            </Link>
          </div>
        </div>
      )}

      {/* Step 1: Connect */}
      <section className="mt-8 rounded-xl border border-paper-300 bg-paper-50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink-950">
            1. Connect your wallet
          </h2>
          {status === "connected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-500/12 px-2.5 py-1 text-[11px] font-semibold text-verified-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </span>
          )}
        </div>

        {status !== "connected" ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={connect}
              disabled={status === "connecting"}
              className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-signal-400 disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              {status === "connecting" ? "Connecting…" : "Connect Freighter"}
            </button>
            {status === "unavailable" && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-alert-600">
                <AlertCircle className="h-3.5 w-3.5" />
                Freighter extension not detected.{" "}
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Install it
                </a>{" "}
                and refresh.
              </p>
            )}
            {status === "error" && errorMsg === null && (
              <p className="mt-3 text-xs text-alert-600">Connection was declined.</p>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-paper-300 bg-paper-100 p-3">
            <span className="font-mono text-xs text-ink-950">
              {address && truncateAddress(address)}
            </span>
            <div className="flex items-center gap-3">
              {Array.isArray(balances) && balances.length > 0 && (
                <span className="font-mono-num text-xs text-khaki-700">
                  {Number(balances[0].balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  {balances[0].code}
                </span>
              )}
              {NETWORK === "testnet" && (
                <button
                  type="button"
                  onClick={handleFriendbot}
                  disabled={friendbotState === "loading"}
                  className="inline-flex items-center gap-1 rounded-full border border-paper-300 px-3 py-1 text-[11px] font-semibold text-khaki-700 hover:border-signal-500 hover:text-signal-600 disabled:opacity-60"
                >
                  <Droplet className="h-3 w-3" />
                  {friendbotState === "loading"
                    ? "Funding…"
                    : friendbotState === "done"
                      ? "Funded ✓"
                      : "Fund with Friendbot"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Step 2: Amount */}
      <section className="mt-4 rounded-xl border border-paper-300 bg-paper-50 p-6">
        <h2 className="font-display text-base font-bold text-ink-950">
          2. Choose an amount
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS_PHP.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhpAmount(p)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                phpAmount === p
                  ? "border-ink-950 bg-ink-950 text-paper-50"
                  : "border-paper-300 text-khaki-700 hover:border-ink-800"
              }`}
            >
              {formatPhp(p, { compact: true })}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          <label className="text-xs font-medium text-ink-950">
            Amount (₱)
            <input
              type="number"
              min={1}
              value={phpAmount}
              onChange={(e) => setPhpAmount(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm font-mono focus:border-signal-500"
            />
          </label>
          <label className="text-xs font-medium text-ink-950">
            Asset
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value as Asset)}
              className="mt-1.5 w-full rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
            >
              {ASSETS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>

        {item && (
          <p className="mt-3 text-xs text-khaki-600">
            ≈ {formatNumber(Math.max(1, Math.round(phpAmount / item.unitCostPhp)))} {item.unit}
            {Math.round(phpAmount / item.unitCostPhp) !== 1 ? "s" : ""} of {item.name.toLowerCase()}
          </p>
        )}

        <div className="mt-4 rounded-lg border border-verified-500/30 bg-verified-500/5 p-3 text-sm">
          You're sending{" "}
          <span className="font-mono-num font-semibold text-ink-950">
            {formatAsset(assetAmount, asset)}
          </span>{" "}
          <span className="text-khaki-600">
            (≈ {formatPhp(phpAmount)} at today's rate)
          </span>
        </div>

        {asset !== "XLM" && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-khaki-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {asset} requires a trustline to its issuer before Freighter can
            sign a transfer. This demo submits native XLM payments only —
            switch to XLM to try the live signing flow.
          </p>
        )}
      </section>

      {/* Step 3: Confirm & send */}
      <section className="mt-4 rounded-xl border border-paper-300 bg-paper-50 p-6">
        <h2 className="font-display text-base font-bold text-ink-950">
          3. Confirm &amp; sign
        </h2>
        <div className="mt-3 space-y-1.5 text-xs text-khaki-700">
          <div className="flex justify-between">
            <span>Destination</span>
            <span className="font-mono">{truncateAddress(LGU_WALLET_ADDRESS)}</span>
          </div>
          <div className="flex justify-between">
            <span>Memo</span>
            <span className="font-mono">{memoText}</span>
          </div>
          <div className="flex justify-between">
            <span>Network</span>
            <span className="font-mono capitalize">{NETWORK}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={status !== "connected" || asset !== "XLM" || sendState === "signing"}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-verified-500 px-5 py-3 text-sm font-semibold text-ink-950 hover:bg-verified-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendState === "signing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting for Freighter…
            </>
          ) : (
            <>
              Sign &amp; send {formatAsset(assetAmount, asset)} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {sendState === "done" && txHash && (
          <div className="mt-4 rounded-lg border border-verified-500/30 bg-verified-500/8 p-4 text-sm text-verified-700">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Donation confirmed on Stellar
            </div>
            <a
              href={`${EXPLORER_BASE}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-mono text-xs underline"
            >
              {truncateAddress(txHash, 8, 6)} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {sendState === "error" && (
          <div className="mt-4 flex items-start gap-1.5 rounded-lg border border-alert-500/30 bg-alert-500/8 p-4 text-xs text-alert-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {errorMsg ?? "The transaction could not be submitted."}
          </div>
        )}
      </section>
    </div>
  );
}
