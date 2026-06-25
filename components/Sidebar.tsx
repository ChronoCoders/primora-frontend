"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { NAV } from "@/lib/nav";

function shortenAddress(address: string): string {
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-primora-border bg-primora-bg">
      <div className="flex h-[73px] items-center gap-3 border-b border-primora-border px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] bg-primora-accent">
          <i className="fa-solid fa-shield-halved text-[16px] text-[#0a0a0a]" />
        </div>
        <span className="font-display text-xl font-semibold tracking-[-0.01em]">
          Primora
        </span>
      </div>

      <nav className="flex-1 p-3">
        <div className="flex flex-col gap-[2px]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-[10px] border-l-2 border-primora-accent bg-[#1f1f1f] py-[10px] pl-[14px] pr-4 text-sm font-medium text-white no-underline transition-colors"
                    : "flex items-center gap-3 rounded-[10px] px-4 py-[10px] text-sm font-medium text-primora-muted no-underline transition-colors hover:bg-primora-surface hover:text-primora-text"
                }
              >
                <i
                  className={`fa-solid ${item.icon} w-4 text-center${
                    active ? " text-primora-accent" : ""
                  }`}
                />
                <span>{item.label}</span>
                {item.badge !== undefined ? (
                  <span className="ml-auto rounded-full bg-[#ef4444] px-[6px] py-[2px] text-[9px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex items-center gap-3 border-t border-primora-border p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f]">
          <i className="fa-solid fa-user text-[12px] text-primora-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[13px] font-medium">
            {isConnected && address ? shortenAddress(address) : "Not connected"}
          </div>
          <div className="mt-[2px] flex items-center gap-[6px]">
            {isConnected ? (
              <>
                <span className="pulse inline-block h-[6px] w-[6px] rounded-full bg-[#4ade80]" />
                <span className="text-[10px] text-[#4ade80]">Connected</span>
              </>
            ) : (
              <span className="text-[10px] text-primora-dim">
                Wallet not connected
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
