"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getEarnings24h } from "@/lib/api";
import { publicClientFor } from "@/lib/clients";
import { chainIdFor, chainLabel, ALL_CHAINS, type Chain } from "@/lib/chain";
import { getContract } from "@/lib/contracts";
import { formatPrmWeiAmount, formatUsdCents } from "@/app/page";
import { PayoutHistory } from "@/components/PayoutHistory";

type PrmBalances = Record<Chain, bigint>;

async function readPrmBalances(address: `0x${string}`): Promise<PrmBalances> {
  const [ethereum, polygon] = (await Promise.all(
    ALL_CHAINS.map((chain) => {
      const client = publicClientFor(chain);
      const prim = getContract(chainIdFor(chain), "primToken");
      return client.readContract({
        address: prim.address,
        abi: prim.abi,
        functionName: "balanceOf",
        args: [address],
      });
    }),
  )) as [bigint, bigint];
  return { ethereum, polygon };
}

function WalletBalances() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["prm-balances", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return readPrmBalances(address);
    },
    enabled: isConnected && Boolean(address),
    refetchInterval: 60_000,
  });

  const total = data ? ALL_CHAINS.reduce((acc, c) => acc + data[c], 0n) : 0n;
  const prmText = (v: bigint) => (isLoading ? "…" : isError || !data ? "—" : formatPrmWeiAmount(v.toString()));

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Wallet Balances</div>
      {!isConnected ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Connect your wallet to see balances</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
          {ALL_CHAINS.map((chain) => (
            <div key={chain} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#71717a" }}>{chainLabel(chain)} PRM</span>
              <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{prmText(data?.[chain] ?? 0n)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #1a1a1a" }}>
            <span style={{ color: "#71717a" }}>Total PRM</span>
            <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{prmText(total)}</span>
          </div>
          <div style={{ fontSize: "10px", color: "#52525b", marginTop: "4px", lineHeight: 1.5 }}>
            PRM balances read live on-chain (primToken.balanceOf) on both chains. USDC/USDT
            wallet balances are not shown — the stablecoin token addresses are not exposed to
            the dashboard yet.
          </div>
        </div>
      )}
    </div>
  );
}

function Earnings24hCard() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["earnings24h", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getEarnings24h(address);
    },
    enabled: isConnected && Boolean(address),
  });

  const ready = isConnected && !isLoading && !isError && Boolean(data);
  const prm = !isConnected ? "—" : isLoading ? "…" : !ready || !data ? "—" : `${formatPrmWeiAmount(data.total_gross_prm)} PRM`;
  const net = !isConnected ? "—" : isLoading ? "…" : !ready || !data ? "—" : formatUsdCents(data.total_usd_cents);
  const count = !ready || !data ? "—" : data.payout_count;

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Last 24h</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#71717a" }}>PRM earned</span>
          <span style={{ fontWeight: 600 }}>{prm}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#71717a" }}>Net USD (after 17% fee)</span>
          <span style={{ fontWeight: 700, color: "#4ade80" }}>{net}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#71717a" }}>Payouts</span>
          <span style={{ fontWeight: 600 }}>{count}</span>
        </div>
      </div>
      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #1a1a1a", fontSize: "10px", color: "#52525b", lineHeight: 1.5 }}>
        Redemptions to USDC/USDT are reviewed and approved by an operator before payout — a
        deliberate safeguard that checks each request against session validity and reserve
        health before funds leave the treasury. Buying and selling PRM opens with the
        exchange at launch.
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <>
      <div className="two-col">
        <WalletBalances />
        <Earnings24hCard />
      </div>
      <PayoutHistory title="Payout History" countNoun="payout" />
    </>
  );
}
