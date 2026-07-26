export function formatPhp(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}

export function formatAsset(amount: number, asset: string): string {
  const decimals = asset === "XLM" ? 2 : asset === "USDC" ? 2 : 2;
  return `${new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: decimals,
  }).format(amount)} ${asset}`;
}

export function phpToAsset(phpAmount: number, assetRatePhp: number): number {
  if (assetRatePhp <= 0) return 0;
  return phpAmount / assetRatePhp;
}

export function truncateAddress(address: string, lead = 6, trail = 6): string {
  if (address.length <= lead + trail) return address;
  return `${address.slice(0, lead)}…${address.slice(-trail)}`;
}

export function truncateTxHash(hash: string): string {
  return truncateAddress(hash, 8, 6);
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
