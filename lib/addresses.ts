import type { Address } from "viem";
import localDeployment from "./deployments/local.json";
import polygonDeployment from "./deployments/polygon.json";
import { ethereumChain, polygonChain } from "./wagmi";

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

/// Shape of a committed deployment JSON (`local.json`, `polygon.json`).
type Deployment = {
  primToken: string;
  treasury: string;
  miningContract: string;
  oracleAggregator: string;
  stakingContract: string;
  nodeRegistry: string;
  houseEdge: string;
};

function fromDeployment(d: Deployment): ContractAddresses {
  return {
    primToken: d.primToken as Address,
    treasury: d.treasury as Address,
    miningContract: d.miningContract as Address,
    oracleAggregator: d.oracleAggregator as Address,
    stakingContract: d.stakingContract as Address,
    nodeRegistry: d.nodeRegistry as Address,
    houseEdge: d.houseEdge as Address,
  };
}

const useLocalChains = process.env.NEXT_PUBLIC_USE_LOCAL_CHAINS === "true";

/// Local Anvil deterministic addresses for chain id 1 (:8545), from local.json.
const localEthereum = fromDeployment(localDeployment);
/// Local Anvil deterministic addresses for chain id 137 (:8546), from
/// polygon.json. Identical to `localEthereum` (shared deployer + nonce).
const localPolygon = fromDeployment(polygonDeployment);

/// Ethereum mainnet (chain id 1) placeholders until contracts are deployed.
const mainnet: ContractAddresses = {
  primToken: ZERO,
  treasury: ZERO,
  miningContract: ZERO,
  oracleAggregator: ZERO,
  stakingContract: ZERO,
  nodeRegistry: ZERO,
  houseEdge: ZERO,
};

/// Polygon mainnet (chain id 137) placeholders until contracts are deployed.
const polygon: ContractAddresses = { ...mainnet };

/// Contract addresses keyed by the active chain ids (local 31337/31338,
/// production 1/137), taken from `lib/wagmi.ts` so the keys always match the
/// configured chains. The `NEXT_PUBLIC_USE_LOCAL_CHAINS` flag selects the local
/// dual-Anvil deploys or the (not-yet-deployed) mainnet/Polygon sets.
export const addresses: Record<number, ContractAddresses> = useLocalChains
  ? { [ethereumChain.id]: localEthereum, [polygonChain.id]: localPolygon }
  : { [ethereumChain.id]: mainnet, [polygonChain.id]: polygon };

/// Returns the address registry for `chainId`, or `undefined` if unsupported.
export function addressesForChain(
  chainId: number,
): ContractAddresses | undefined {
  return addresses[chainId];
}
