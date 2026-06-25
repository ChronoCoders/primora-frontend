import type { Abi, Address } from "viem";
import {
  primTokenAbi,
  treasuryAbi,
  miningContractAbi,
  oracleAggregatorAbi,
  stakingContractAbi,
  nodeRegistryAbi,
  houseEdgeAbi,
} from "./abis";
import {
  addressesForChain,
  type ContractAddresses,
  type ContractName,
} from "./addresses";

export type { ContractName } from "./addresses";

/// ABI for each contract, keyed by the same names as the address registry.
const abis = {
  primToken: primTokenAbi,
  treasury: treasuryAbi,
  miningContract: miningContractAbi,
  oracleAggregator: oracleAggregatorAbi,
  stakingContract: stakingContractAbi,
  nodeRegistry: nodeRegistryAbi,
  houseEdge: houseEdgeAbi,
} as const;

/// The shape consumed by wagmi's `useReadContract`/`useWriteContract`.
export type ContractConfig<TName extends ContractName> = {
  address: Address;
  abi: (typeof abis)[TName];
};

/// Returns `{ address, abi }` for `name` on `chainId`, ready to spread into
/// wagmi v2's `useReadContract`. Throws if the chain has no address registry.
///
/// Example (in a "use client" component):
///
///   import { useReadContract } from "wagmi";
///   import { useChainId } from "wagmi";
///   import { getContract } from "@/lib/contracts";
///
///   function PrmBalance({ account }: { account: `0x${string}` }) {
///     const chainId = useChainId();
///     const prim = getContract(chainId, "primToken");
///     const { data } = useReadContract({
///       ...prim,
///       functionName: "balanceOf",
///       args: [account],
///     });
///     return <span>{data?.toString() ?? "…"}</span>;
///   }
export function getContract<TName extends ContractName>(
  chainId: number,
  name: TName,
): ContractConfig<TName> {
  const registry: ContractAddresses | undefined = addressesForChain(chainId);
  if (!registry) {
    throw new Error(`no contract addresses configured for chainId ${chainId}`);
  }
  return { address: registry[name], abi: abis[name] };
}

/// The raw ABI for `name`, useful where only the ABI is needed (e.g. decoding).
export function getAbi(name: ContractName): Abi {
  return abis[name] as unknown as Abi;
}
