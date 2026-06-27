import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { mainnet, polygon } from "wagmi/chains";
import { defineChain, type Chain as ViemChain } from "viem";

/// When `NEXT_PUBLIC_USE_LOCAL_CHAINS=true`, the app targets the local dual-Anvil
/// pair. Local uses non-colliding chain ids 31337/31338 so MetaMask does not
/// conflict with real Ethereum (1) and Polygon (137); production uses 1/137. The
/// logical Ethereum/Polygon mapping is unchanged; only the numeric ids differ.
const useLocalChains = process.env.NEXT_PUBLIC_USE_LOCAL_CHAINS === "true";

/// Local Anvil standing in for Ethereum: chain id 31337 on :8545. Production is
/// `mainnet` (id 1).
const localEthereum = defineChain({
  id: 31337,
  name: "Ethereum-local (Anvil)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
});

/// Local Anvil standing in for Polygon: chain id 31338 on :8546. Production is
/// `polygon` (id 137).
const localPolygon = defineChain({
  id: 31338,
  name: "Polygon-local (Anvil)",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8546"] } },
});

/// The Ethereum-side chain: local Anvil (31337) in dev, mainnet (1) in production.
export const ethereumChain: ViemChain = useLocalChains ? localEthereum : mainnet;
/// The Polygon-side chain: local Anvil (31338) in dev, Polygon (137) in production.
export const polygonChain: ViemChain = useLocalChains ? localPolygon : polygon;

/// Both configured chains, as the non-empty tuple wagmi expects.
export const chains = [ethereumChain, polygonChain] as const;

/// Read RPC URL for a configured chain: an explicit env override when set, else
/// the chain's default endpoint. Used for both wagmi transports and the
/// per-chain read clients in `lib/clients.ts`.
export function rpcUrlFor(chain: ViemChain): string {
  if (chain.id === ethereumChain.id && process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL) {
    return process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL;
  }
  if (chain.id === polygonChain.id && process.env.NEXT_PUBLIC_POLYGON_RPC_URL) {
    return process.env.NEXT_PUBLIC_POLYGON_RPC_URL;
  }
  return chain.rpcUrls.default.http[0];
}

const PLACEHOLDER_PROJECT_IDS = new Set([
  "",
  "PRIMORA_DEMO",
  "PRIMORA_DEV_PLACEHOLDER",
]);

const rawProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
const projectId = rawProjectId || "PRIMORA_DEV_PLACEHOLDER";

if (typeof window !== "undefined" && PLACEHOLDER_PROJECT_IDS.has(rawProjectId)) {
  console.error(
    `[primora] NEXT_PUBLIC_WC_PROJECT_ID is missing or a placeholder ("${projectId}"). ` +
      "WalletConnect's wallet-listing fetch will fail and the page will crash with an " +
      "Object.values error. Set a real id from https://cloud.walletconnect.com in " +
      ".env.local and restart the dev server.",
  );
}

const wallets = [
  {
    groupName: "Installed",
    wallets: [injectedWallet, metaMaskWallet],
  },
  {
    groupName: "Other",
    wallets: [walletConnectWallet, coinbaseWallet],
  },
];

export const wagmiConfig = getDefaultConfig({
  appName: "Primora",
  projectId,
  wallets,
  chains,
  transports: {
    [ethereumChain.id]: http(rpcUrlFor(ethereumChain)),
    [polygonChain.id]: http(rpcUrlFor(polygonChain)),
  },
  multiInjectedProviderDiscovery: false,
  ssr: true,
});
