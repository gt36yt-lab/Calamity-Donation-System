import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  connectFreighter,
  fetchAccountBalances,
  getFreighterConnection,
  getFreighterNetwork,
  isFreighterAvailable,
  type WalletBalance,
} from "../lib/stellar";

interface WalletState {
  address: string | null;
  network: string | null;
  balances: WalletBalance[] | null;
  status: "idle" | "connecting" | "connected" | "unavailable" | "error";
  errorMessage: string | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const INITIAL_STATE: WalletState = {
  address: null,
  network: null,
  balances: null,
  status: "idle",
  errorMessage: null,
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(INITIAL_STATE);

  // Check for an already-authorized Freighter session on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isFreighterAvailable()) return;
      const conn = await getFreighterConnection();
      if (cancelled || !conn.connected || !conn.address) return;
      const balances = await fetchAccountBalances(conn.address);
      if (cancelled) return;
      setState((s) => ({
        ...s,
        address: conn.address ?? null,
        network: conn.network ?? null,
        balances,
        status: "connected",
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshBalances = useCallback(async () => {
    setState((s) => ({ ...s }));
    const address = state.address;
    if (!address) return;
    const balances = await fetchAccountBalances(address);
    setState((s) => (s.address === address ? { ...s, balances } : s));
  }, [state.address]);

  const connect = useCallback(async () => {
    if (!isFreighterAvailable()) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return;
    }
    setState((s) => ({ ...s, status: "connecting", errorMessage: null }));
    const result = await connectFreighter();
    if ("error" in result) {
      setState((s) => ({ ...s, status: "error", errorMessage: result.error }));
      return;
    }
    const [balances, network] = await Promise.all([
      fetchAccountBalances(result.address),
      getFreighterNetwork(),
    ]);
    setState((s) => ({
      ...s,
      address: result.address,
      network,
      status: "connected",
      balances,
    }));
  }, []);

  // Freighter itself has no site-initiated "revoke" call — this just clears
  // the app's local session. The extension keeps its own permission until
  // the person removes it from Freighter's settings.
  const disconnect = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, refreshBalances }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
