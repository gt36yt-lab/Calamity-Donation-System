import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  connectFreighter,
  fetchAccountBalances,
  getFreighterConnection,
  getFreighterNetwork,
  isFreighterAvailable,
} from "../lib/stellar";
import { WalletContext, INITIAL_STATE, type WalletState } from "./wallet-context";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(INITIAL_STATE);

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

  const disconnect = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, refreshBalances }}>
      {children}
    </WalletContext.Provider>
  );
}