import { createContext } from "react";
import type { WalletBalance } from "../lib/stellar";

export interface WalletState {
  address: string | null;
  network: string | null;
  balances: WalletBalance[] | null;
  status: "idle" | "connecting" | "connected" | "unavailable" | "error";
  errorMessage: string | null;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export const INITIAL_STATE: WalletState = {
  address: null,
  network: null,
  balances: null,
  status: "idle",
  errorMessage: null,
};