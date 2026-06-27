import { ethereumChain, polygonChain } from "./wagmi";

/// Frontend mirror of the backend `Chain` enum and the API `chain` field. String
/// ids match the backend ("ethereum"/"polygon") so the API payload and the
/// frontend align without translation.
export type Chain = "ethereum" | "polygon";

const CHAIN_IDS: Record<Chain, number> = {
  ethereum: ethereumChain.id,
  polygon: polygonChain.id,
};

const CHAIN_LABELS: Record<Chain, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
};

/// All supported chains, in display order.
export const ALL_CHAINS: readonly Chain[] = ["ethereum", "polygon"];

/// Returns the EVM chain id for a `Chain` (local 31337/31338, production 1/137).
export function chainIdFor(chain: Chain): number {
  return CHAIN_IDS[chain];
}

/// Maps an EVM chain id back to a `Chain`, or `undefined` when unsupported.
export function chainFromId(id: number): Chain | undefined {
  if (id === ethereumChain.id) return "ethereum";
  if (id === polygonChain.id) return "polygon";
  return undefined;
}

/// Human-readable label for a `Chain`.
export function chainLabel(chain: Chain): string {
  return CHAIN_LABELS[chain];
}
