import { createPublicClient, http, type PublicClient } from "viem";
import { ethereumChain, polygonChain, rpcUrlFor } from "./wagmi";
import type { Chain } from "./chain";

/// Read-only viem public clients keyed by backend chain id ("ethereum" /
/// "polygon"). wagmi's `useReadContract` only targets the connected chain;
/// these clients let any page read BOTH chains regardless of which the wallet is
/// connected to -- the basis for cross-chain balance aggregation (e.g. summing
/// PRM held on Ethereum and Polygon).
///
/// Example:
///
///   import { publicClientFor } from "@/lib/clients";
///   import { getContract } from "@/lib/contracts";
///   import { chainIdFor } from "@/lib/chain";
///
///   const eth = getContract(chainIdFor("ethereum"), "primToken");
///   const balance = await publicClientFor("ethereum").readContract({
///     ...eth,
///     functionName: "balanceOf",
///     args: [account],
///   });
export const publicClients: Record<Chain, PublicClient> = {
  ethereum: createPublicClient({
    chain: ethereumChain,
    transport: http(rpcUrlFor(ethereumChain)),
  }),
  polygon: createPublicClient({
    chain: polygonChain,
    transport: http(rpcUrlFor(polygonChain)),
  }),
};

/// Returns the read-only public client for `chain`.
export function publicClientFor(chain: Chain): PublicClient {
  return publicClients[chain];
}
