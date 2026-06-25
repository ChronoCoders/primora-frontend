"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6">
      <div className="text-center">
        <h1 className="font-display text-6xl font-semibold tracking-tight text-primora-text">
          Primora
        </h1>
        <p className="mt-4 text-primora-muted">
          Virtual commodity mining, anchored to real markets.
        </p>
      </div>

      <ConnectButton />

      {isConnected && address ? (
        <div className="w-full max-w-md rounded-xl border border-primora-border bg-primora-surface px-6 py-5">
          <div className="text-xs uppercase tracking-wide text-primora-dim">
            Connected wallet
          </div>
          <div className="mt-1 break-all font-mono text-sm text-primora-text">
            {address}
          </div>
          <div className="mt-4 text-xs uppercase tracking-wide text-primora-dim">
            Balance
          </div>
          <div className="mt-1 font-mono text-lg text-primora-accent">
            {balance
              ? `${formatEther(balance.value)} ${balance.symbol}`
              : "Loading…"}
          </div>
        </div>
      ) : (
        <p className="text-sm text-primora-dim">
          Connect a wallet to view your address and balance.
        </p>
      )}
    </main>
  );
}
