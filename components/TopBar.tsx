"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { titleForPath } from "@/lib/nav";

function formatNativeBalance(
  value: bigint,
  decimals: number,
  symbol: string,
): string {
  const amount = Number(formatUnits(value, decimals));
  if (!Number.isFinite(amount)) return `0 ${symbol}`;
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`;
}

export function TopBar() {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const balanceLabel = !isConnected
    ? null
    : balance
      ? formatNativeBalance(balance.value, balance.decimals, balance.symbol)
      : "…";

  return (
    <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-primora-border bg-primora-bg px-6">
      <div className="flex items-center gap-3">
        <span className="font-display text-[17px] font-semibold">{title}</span>
        <div className="flex items-center gap-2 rounded-full border border-primora-border bg-[#111] px-3 py-1">
          <span className="pulse inline-block h-2 w-2 rounded-full bg-[#4ade80]" />
          <span className="text-[11px] font-medium text-[#4ade80]">
            Mainnet · Polygon + Ethereum
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-nowrap items-center gap-[10px]">
        <div className="hidden min-w-0 items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1.5 lg:flex">
          <i className="fa-solid fa-shield-halved shrink-0 text-[11px] text-primora-accent" />
          <span className="truncate text-[10px] text-primora-muted">
            All mining is virtual. No real commodities.
          </span>
        </div>
        {balanceLabel && (
          <span className="shrink-0 whitespace-nowrap rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1.5 text-[11px] font-medium text-primora-text">
            {balanceLabel}
          </span>
        )}
        <div className="shrink-0">
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </div>
      </div>
    </div>
  );
}
