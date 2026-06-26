/// Frontend mirror of the backend `Chain` enum and the API `chain` field. String
/// ids match the backend ("ethereum"/"polygon") so the API payload and the
/// frontend align without translation.
export type Chain = "ethereum" | "polygon";

const CHAIN_IDS: Record<Chain, 1 | 137> = {
  ethereum: 1,
  polygon: 137,
};

const CHAIN_LABELS: Record<Chain, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
};

/// All supported chains, in display order.
export const ALL_CHAINS: readonly Chain[] = ["ethereum", "polygon"];

/// Returns the EVM chain id for a `Chain` (1 for Ethereum, 137 for Polygon).
export function chainIdFor(chain: Chain): 1 | 137 {
  return CHAIN_IDS[chain];
}

/// Maps an EVM chain id back to a `Chain`, or `undefined` when unsupported.
export function chainFromId(id: number): Chain | undefined {
  if (id === 1) return "ethereum";
  if (id === 137) return "polygon";
  return undefined;
}

/// Human-readable label for a `Chain`.
export function chainLabel(chain: Chain): string {
  return CHAIN_LABELS[chain];
}
