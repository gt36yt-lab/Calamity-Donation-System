// Core domain types for TranspaRelief

export type SupplyUnit =
  | "sack"
  | "pack"
  | "sheet"
  | "gallon container"
  | "kit"
  | "unit"
  | "tarpaulin"
  | "bottle";

export interface SupplyCategory {
  id: string;
  name: string;
  unit: SupplyUnit;
  icon: string; // lucide icon name
  unitCostPhp: number;
  quantityNeeded: number;
  quantityFunded: number;
}

export type UrgencyLevel = "critical" | "high" | "moderate";

export interface FamilyNeedItem {
  id: string;
  label: string;
  quantity: number;
  unitCostPhp: number;
}

export interface Family {
  id: string; // e.g. FAM-0422
  alias: string; // privacy-friendly display alias
  barangay: string;
  householdSize: number;
  urgency: UrgencyLevel;
  needs: FamilyNeedItem[];
  amountFundedPhp: number;
  deliveryStatus: "pending" | "in_transit" | "delivered";
  registeredOn: string; // ISO date
}

export interface LedgerInflow {
  id: string;
  type: "inflow";
  txHash: string;
  donorAlias: string;
  asset: "XLM" | "USDC" | "PHPC";
  assetAmount: number;
  phpEquivalent: number;
  destination: "general_fund" | string; // 'general_fund' or a Family id
  timestamp: string; // ISO
}

export interface LedgerOutflow {
  id: string;
  type: "outflow";
  txHash: string;
  vendor: string;
  purpose: string;
  phpAmount: number;
  receiptImageNote: string;
  deliveryPhotoNote: string;
  barangaysServed: string[];
  timestamp: string; // ISO
}

export type LedgerEntry = LedgerInflow | LedgerOutflow;

export interface CalamitySummary {
  cityName: string;
  provinceName: string;
  calamityName: string;
  signalLevel: number;
  status: "active_response" | "recovery" | "monitoring";
  affectedFamilies: number;
  affectedBarangays: number;
  declaredOn: string;
  lguFundAllocatedPhp: number;
  lguFundDisbursedPhp: number;
  lguWalletPublicKey: string;
  stellarNetwork: "testnet" | "public";
}

export interface AssetRate {
  asset: "XLM" | "USDC" | "PHPC";
  phpRate: number; // 1 unit of asset = phpRate PHP
}
