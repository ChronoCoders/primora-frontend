"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { titleForPath } from "@/lib/nav";

export function TopBar() {
  const pathname = usePathname();
  const title = titleForPath(pathname);

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

      <div className="flex items-center gap-[10px]">
        <div className="flex max-w-[280px] items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1.5">
          <i className="fa-solid fa-shield-halved shrink-0 text-[11px] text-primora-accent" />
          <span className="truncate text-[10px] text-primora-muted">
            All mining is virtual. No real commodities.
          </span>
        </div>
        <ConnectButton />
      </div>
    </div>
  );
}
