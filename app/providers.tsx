"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { ReactNode } from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";

const queryClient = new QueryClient();

const primoraTheme = darkTheme({
  accentColor: "#f59e0b",
  accentColorForeground: "#0a0a0a",
  borderRadius: "medium",
});

/// Wraps the app in the wagmi, react-query, and RainbowKit providers.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={primoraTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
