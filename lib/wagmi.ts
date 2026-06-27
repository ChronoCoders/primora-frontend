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
/// pair instead of real RPCs. Both modes use chain ids 1 and 137, so the
/// chainId-keyed address registry and the backend's chain ids line up unchanged.
const useLocalChains = process.env.NEXT_PUBLIC_USE_LOCAL_CHAINS === "true";

/// Local Anvil standing in for Ethereum: chain id 1 on :8545 (backend dual-chain
/// smoke setup). Real chain id 1 in production is `mainnet`.
const localEthereum = defineChain({
  id: 1,
  name: "Local Ethereum (Anvil)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
});

/// Local Anvil standing in for Polygon: chain id 137 on :8546. Real chain id 137
/// in production is `polygon`.
const localPolygon = defineChain({
  id: 137,
  name: "Local Polygon (Anvil)",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8546"] } },
});

/// The Ethereum-side chain (id 1): local Anvil in dev, mainnet in production.
export const ethereumChain: ViemChain = useLocalChains ? localEthereum : mainnet;
/// The Polygon-side chain (id 137): local Anvil in dev, Polygon in production.
export const polygonChain: ViemChain = useLocalChains ? localPolygon : polygon;

/// Both configured chains, as the non-empty tuple wagmi expects.
export const chains = [ethereumChain, polygonChain] as const;

/// Read RPC URL for a configured chain: an explicit env override when set, else
/// the chain's default endpoint. Used for both wagmi transports and the
/// per-chain read clients in `lib/clients.ts`.
export function rpcUrlFor(chain: ViemChain): string {
  if (chain.id === 1 && process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL) {
    return process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL;
  }
  if (chain.id === 137 && process.env.NEXT_PUBLIC_POLYGON_RPC_URL) {
    return process.env.NEXT_PUBLIC_POLYGON_RPC_URL;
  }
  return chain.rpcUrls.default.http[0];
}

/// Known non-functional WalletConnect projectId values. Any of these (or an empty
/// value) makes WalletConnect's explorer fetch return no listings, so its internal
/// `Object.values(listings)` throws and the page crashes with a full-screen overlay.
/// A real id must come from https://cloud.walletconnect.com.
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

/// Explicit wallet list. `getDefaultConfig`'s default list leads with the
/// SDK-based `metaMaskWallet`, which on desktop silently no-ops (clicking it
/// never reaches the injected provider, so no extension popup fires). Leading
/// with `injectedWallet` connects through `window.ethereum` directly, which
/// reliably triggers the installed MetaMask popup. `walletConnectWallet` is kept
/// so WalletConnect (and mobile/QR) still works — `getDefaultConfig` wires the
/// projectId into it exactly as before.
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

/// Shared wagmi + RainbowKit config. Transports are pinned per chain id so each
/// chain reads from its own RPC.
export const wagmiConfig = getDefaultConfig({
  appName: "Primora",
  projectId,
  wallets,
  chains,
  transports: {
    [ethereumChain.id]: http(rpcUrlFor(ethereumChain)),
    [polygonChain.id]: http(rpcUrlFor(polygonChain)),
  },
  ssr: true,
});
