import type {
  AssetRate,
  CalamitySummary,
  Family,
  LedgerEntry,
  SupplyCategory,
} from "../types";

export const calamitySummary: CalamitySummary = {
  cityName: "Municipality of Malinaw",
  provinceName: "Ibayo Province",
  calamityName: "Typhoon Salakot",
  signalLevel: 3,
  status: "active_response",
  affectedFamilies: 3842,
  affectedBarangays: 11,
  declaredOn: "2026-07-14",
  lguFundAllocatedPhp: 5_200_000,
  lguFundDisbursedPhp: 3_040_000,
  // Demo-only testnet keypair — swap in your LGU's real public key via
  // VITE_LGU_WALLET in .env. This sample account is unfunded, so the live
  // read gracefully falls back to the cached figures below.
  lguWalletPublicKey: "GDTVFSXEPGPVR6OLDJ6TA6Z34KVTJSPFGAPW4OL5EA2QD7RZA7L2XMGN",
  stellarNetwork: "testnet",
};

// 1 unit of asset = this many PHP (illustrative, refreshed from a live rate feed in production)
export const assetRates: AssetRate[] = [
  { asset: "XLM", phpRate: 22.4 },
  { asset: "USDC", phpRate: 58.15 },
  { asset: "PHPC", phpRate: 1 },
];

export const supplyCategories: SupplyCategory[] = [
  {
    id: "rice",
    name: "Rice (50kg sack)",
    unit: "sack",
    icon: "Wheat",
    unitCostPhp: 2650,
    quantityNeeded: 1250,
    quantityFunded: 775,
  },
  {
    id: "food-packs",
    name: "Emergency Food Packs",
    unit: "pack",
    icon: "Package",
    unitCostPhp: 750,
    quantityNeeded: 4200,
    quantityFunded: 2436,
  },
  {
    id: "roofing",
    name: "CGI Roofing Sheets",
    unit: "sheet",
    icon: "Home",
    unitCostPhp: 480,
    quantityNeeded: 5000,
    quantityFunded: 1500,
  },
  {
    id: "water",
    name: "Potable Water (5-gal)",
    unit: "gallon container",
    icon: "Droplets",
    unitCostPhp: 120,
    quantityNeeded: 9600,
    quantityFunded: 6816,
  },
  {
    id: "hygiene",
    name: "Hygiene Kits",
    unit: "kit",
    icon: "ShowerHead",
    unitCostPhp: 350,
    quantityNeeded: 3800,
    quantityFunded: 1672,
  },
  {
    id: "tarps",
    name: "Tarpaulin Shelter Kits",
    unit: "tarpaulin",
    icon: "Tent",
    unitCostPhp: 890,
    quantityNeeded: 1600,
    quantityFunded: 400,
  },
  {
    id: "solar",
    name: "Solar Lanterns",
    unit: "unit",
    icon: "Sun",
    unitCostPhp: 640,
    quantityNeeded: 1900,
    quantityFunded: 380,
  },
  {
    id: "purification",
    name: "Water Purification Tablets (x50)",
    unit: "bottle",
    icon: "FlaskConical",
    unitCostPhp: 95,
    quantityNeeded: 4100,
    quantityFunded: 2788,
  },
];

export const families: Family[] = [
  {
    id: "FAM-0422",
    alias: "Family #FAM-0422",
    barangay: "Barangay Look",
    householdSize: 5,
    urgency: "critical",
    needs: [
      { id: "n1", label: "Emergency Food Packs", quantity: 2, unitCostPhp: 750 },
      { id: "n2", label: "CGI Roofing Sheets", quantity: 10, unitCostPhp: 480 },
      { id: "n3", label: "Potable Water (5-gal)", quantity: 4, unitCostPhp: 120 },
    ],
    amountFundedPhp: 2400,
    deliveryStatus: "in_transit",
    registeredOn: "2026-07-15",
  },
  {
    id: "FAM-0389",
    alias: "Family #FAM-0389",
    barangay: "Barangay Tubod",
    householdSize: 3,
    urgency: "high",
    needs: [
      { id: "n1", label: "Rice (50kg sack)", quantity: 1, unitCostPhp: 2650 },
      { id: "n2", label: "Hygiene Kits", quantity: 3, unitCostPhp: 350 },
      { id: "n3", label: "Solar Lanterns", quantity: 1, unitCostPhp: 640 },
    ],
    amountFundedPhp: 1050,
    deliveryStatus: "pending",
    registeredOn: "2026-07-15",
  },
  {
    id: "FAM-0510",
    alias: "Family #FAM-0510",
    barangay: "Barangay Riverside",
    householdSize: 7,
    urgency: "critical",
    needs: [
      { id: "n1", label: "Tarpaulin Shelter Kit", quantity: 2, unitCostPhp: 890 },
      { id: "n2", label: "Emergency Food Packs", quantity: 4, unitCostPhp: 750 },
      { id: "n3", label: "Water Purification Tablets", quantity: 2, unitCostPhp: 95 },
    ],
    amountFundedPhp: 0,
    deliveryStatus: "pending",
    registeredOn: "2026-07-16",
  },
  {
    id: "FAM-0287",
    alias: "Family #FAM-0287",
    barangay: "Barangay Sto. Niño",
    householdSize: 4,
    urgency: "moderate",
    needs: [
      { id: "n1", label: "Rice (50kg sack)", quantity: 1, unitCostPhp: 2650 },
      { id: "n2", label: "Potable Water (5-gal)", quantity: 3, unitCostPhp: 120 },
    ],
    amountFundedPhp: 3010,
    deliveryStatus: "delivered",
    registeredOn: "2026-07-14",
  },
  {
    id: "FAM-0466",
    alias: "Family #FAM-0466",
    barangay: "Barangay Bagong Sikat",
    householdSize: 6,
    urgency: "high",
    needs: [
      { id: "n1", label: "CGI Roofing Sheets", quantity: 14, unitCostPhp: 480 },
      { id: "n2", label: "Hygiene Kits", quantity: 2, unitCostPhp: 350 },
    ],
    amountFundedPhp: 700,
    deliveryStatus: "pending",
    registeredOn: "2026-07-16",
  },
  {
    id: "FAM-0341",
    alias: "Family #FAM-0341",
    barangay: "Barangay Look",
    householdSize: 2,
    urgency: "moderate",
    needs: [
      { id: "n1", label: "Emergency Food Packs", quantity: 1, unitCostPhp: 750 },
      { id: "n2", label: "Solar Lanterns", quantity: 1, unitCostPhp: 640 },
    ],
    amountFundedPhp: 1390,
    deliveryStatus: "delivered",
    registeredOn: "2026-07-13",
  },
  {
    id: "FAM-0598",
    alias: "Family #FAM-0598",
    barangay: "Barangay Tubod",
    householdSize: 8,
    urgency: "critical",
    needs: [
      { id: "n1", label: "Rice (50kg sack)", quantity: 2, unitCostPhp: 2650 },
      { id: "n2", label: "Tarpaulin Shelter Kit", quantity: 1, unitCostPhp: 890 },
      { id: "n3", label: "Potable Water (5-gal)", quantity: 6, unitCostPhp: 120 },
    ],
    amountFundedPhp: 0,
    deliveryStatus: "pending",
    registeredOn: "2026-07-17",
  },
  {
    id: "FAM-0155",
    alias: "Family #FAM-0155",
    barangay: "Barangay Riverside",
    householdSize: 5,
    urgency: "high",
    needs: [
      { id: "n1", label: "CGI Roofing Sheets", quantity: 8, unitCostPhp: 480 },
      { id: "n2", label: "Emergency Food Packs", quantity: 2, unitCostPhp: 750 },
      { id: "n3", label: "Hygiene Kits", quantity: 1, unitCostPhp: 350 },
    ],
    amountFundedPhp: 4290,
    deliveryStatus: "in_transit",
    registeredOn: "2026-07-15",
  },
];

export const ledgerEntries: LedgerEntry[] = [
  {
    id: "lg-1",
    type: "inflow",
    txHash: "a1f9c3e7b6d2408f5c9a1e7d3b8f0c6a4e2d9b7f1c5a8e3d0b6f4a9c2e7d1b58",
    donorAlias: "Malinaw Diaspora Canada Chapter",
    asset: "USDC",
    assetAmount: 500,
    phpEquivalent: 29075,
    destination: "general_fund",
    timestamp: "2026-07-24T09:12:00+08:00",
  },
  {
    id: "lg-2",
    type: "outflow",
    txHash: "7d2b9f4a1c6e8305d7b1f9a4c2e6d8b0f3a7c1e9d5b2f8a0c4e7d1b9f6a3c250",
    vendor: "Malinaw Rice Traders Coop",
    purpose: "620 sacks of rice (50kg) for Barangay Look & Tubod distribution",
    phpAmount: 1_643_000,
    receiptImageNote: "Official receipt #OR-22841, signed by MDRRMO",
    deliveryPhotoNote: "Delivery photos: warehouse hand-off, 3 images",
    barangaysServed: ["Barangay Look", "Barangay Tubod"],
    timestamp: "2026-07-23T14:30:00+08:00",
  },
  {
    id: "lg-3",
    type: "inflow",
    txHash: "3c8e1a5f9b7d2604c8a2e6f1b9d5c3a7e0f4b8d2c6a1e9f5b3d7c0a8e2f6b419",
    donorAlias: "Freighter Wallet ••••9C3D",
    asset: "XLM",
    assetAmount: 12500,
    phpEquivalent: 280_000,
    destination: "FAM-0422",
    timestamp: "2026-07-23T11:04:00+08:00",
  },
  {
    id: "lg-4",
    type: "outflow",
    txHash: "f4a0d8b2e6c1937a5d9b3f7e1c5a8d0b4f2e6a9c3d7b1f5a8e2c0d6b4f9a3e17",
    vendor: "Ibayo Hardware & Construction Supply",
    purpose: "1,500 CGI roofing sheets for critical shelter repair",
    phpAmount: 720_000,
    receiptImageNote: "Official receipt #OR-22855, signed by MDRRMO",
    deliveryPhotoNote: "Delivery photos: barangay hall drop-off, 5 images",
    barangaysServed: ["Barangay Bagong Sikat", "Barangay Riverside"],
    timestamp: "2026-07-22T16:45:00+08:00",
  },
  {
    id: "lg-5",
    type: "inflow",
    txHash: "9e5c2a7f0b4d861e3a7c1f5b9d2e6a0c4f8b2d6e1a9c5f3b7d0e4a8c2f6b1953",
    donorAlias: "Ibayo Rotary Club",
    asset: "PHPC",
    assetAmount: 150_000,
    phpEquivalent: 150_000,
    destination: "general_fund",
    timestamp: "2026-07-22T08:50:00+08:00",
  },
  {
    id: "lg-6",
    type: "inflow",
    txHash: "6b1f8d3a7c0e492b5d8a1f4c7e0b3d6a9c2f5b8e1d4a7c0f3b6e9d2a5c8f1b40",
    donorAlias: "Anonymous Donor",
    asset: "XLM",
    assetAmount: 8900,
    phpEquivalent: 199_360,
    destination: "general_fund",
    timestamp: "2026-07-21T19:22:00+08:00",
  },
  {
    id: "lg-7",
    type: "outflow",
    txHash: "2a6d9c4f1b8e357a0d3b6f9c2e5a8d1b4f7c0e3a6d9b2f5c8e1a4d7b0f3c6935",
    vendor: "Bayanihan Water Refilling Station",
    purpose: "9,600 units of 5-gallon potable water + purification tablets",
    phpAmount: 1_152_000,
    receiptImageNote: "Official receipt #OR-22849, signed by MDRRMO",
    deliveryPhotoNote: "Delivery photos: tanker unloading, 4 images",
    barangaysServed: ["Barangay Look", "Barangay Sto. Niño", "Barangay Riverside"],
    timestamp: "2026-07-21T10:15:00+08:00",
  },
  {
    id: "lg-8",
    type: "inflow",
    txHash: "d0f7a3c9e2b5148d6a0c3f7b1e4d8a2c5f9b3e6d0a4c7f1b8e2d5a9c3f6b0417",
    donorAlias: "Freighter Wallet ••••4F2A",
    asset: "USDC",
    assetAmount: 200,
    phpEquivalent: 11630,
    destination: "FAM-0510",
    timestamp: "2026-07-20T13:08:00+08:00",
  },
  {
    id: "lg-9",
    type: "outflow",
    txHash: "8c3f0a6d9b2e5147c0a3d6f9b2e5c8a1d4f7b0e3c6a9d2f5b8e1c4a7d0f3b625",
    vendor: "Kalinaw Medical Pharmacy",
    purpose: "Hygiene kits and first-aid supplies for 1,672 households",
    phpAmount: 585_200,
    receiptImageNote: "Official receipt #OR-22862, signed by MDRRMO",
    deliveryPhotoNote: "Delivery photos: barangay health center, 6 images",
    barangaysServed: ["Barangay Tubod", "Barangay Bagong Sikat"],
    timestamp: "2026-07-19T15:40:00+08:00",
  },
  {
    id: "lg-10",
    type: "inflow",
    txHash: "5b9e2c6a0d3f847b1a4d7c0f3b6e9a2d5c8f1b4e7a0d3c6f9b2e5a8d1c4f7b30",
    donorAlias: "Malinaw Young Professionals Network",
    asset: "XLM",
    assetAmount: 22000,
    phpEquivalent: 492_800,
    destination: "general_fund",
    timestamp: "2026-07-19T09:30:00+08:00",
  },
];

export function getTotalNeededPhp(): number {
  return supplyCategories.reduce(
    (sum, c) => sum + c.unitCostPhp * c.quantityNeeded,
    0,
  );
}

export function getTotalFundedPhp(): number {
  return supplyCategories.reduce(
    (sum, c) => sum + c.unitCostPhp * c.quantityFunded,
    0,
  );
}

export function getShortfallPhp(): number {
  return Math.max(
    0,
    getTotalNeededPhp() - calamitySummary.lguFundAllocatedPhp,
  );
}

export function getFamilyTotalCostPhp(family: Family): number {
  return family.needs.reduce((sum, n) => sum + n.quantity * n.unitCostPhp, 0);
}
