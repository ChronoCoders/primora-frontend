import type { Address } from "viem";
import localDeployment from "./deployments/local.json";

/// The set of contracts the frontend reads on-chain.
export type ContractName =
  | "primToken"
  | "treasury"
  | "miningContract"
  | "oracleAggregator"
  | "stakingContract"
  | "nodeRegistry"
  | "houseEdge";

/// Deployed address of every contract on a given chain.
export type ContractAddresses = Record<ContractName, Address>;

const ZERO: Address = "0x0000000000000000000000000000000000000000";

/// Local Anvil (chainId 31337) addresses, sourced from the committed
/// `lib/deployments/local.json`. These are deterministic for the current
/// `Deploy.s.sol` deployment order; if that order changes, regenerate the JSON.
const anvil: ContractAddresses = {
  primToken: localDeployment.primToken as Address,
  treasury: localDeployment.treasury as Address,
  miningContract: localDeployment.miningContract as Address,
  oracleAggregator: localDeployment.oracleAggregator as Address,
  stakingContract: localDeployment.stakingContract as Address,
  nodeRegistry: localDeployment.nodeRegistry as Address,
  houseEdge: localDeployment.houseEdge as Address,
};

/// Ethereum mainnet (chainId 1) placeholders until contracts are deployed.
const mainnet: ContractAddresses = {
  primToken: ZERO,
  treasury: ZERO,
  miningContract: ZERO,
  oracleAggregator: ZERO,
  stakingContract: ZERO,
  nodeRegistry: ZERO,
  houseEdge: ZERO,
};

/// Contract addresses keyed by chain id.
export const addresses: Record<number, ContractAddresses> = {
  1: mainnet,
  31337: anvil,
};

/// Returns the address registry for `chainId`, or `undefined` if unsupported.
export function addressesForChain(
  chainId: number,
): ContractAddresses | undefined {
  return addresses[chainId];
}
