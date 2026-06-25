"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { ReactNode } from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
});

const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "PRIMORA_DEV_PLACEHOLDER";

const config = getDefaultConfig({
  appName: "Primora",
  projectId,
  chains: [mainnet, anvil],
  ssr: true,
});

const queryClient = new QueryClient();

const primoraTheme = darkTheme({
  accentColor: "#f59e0b",
  accentColorForeground: "#0a0a0a",
  borderRadius: "medium",
});

/// Wraps the app in the wagmi, react-query, and RainbowKit providers.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={primoraTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
