"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPayouts, type PayoutRow } from "@/lib/api";
import {
  ActiveMining,
  EarningsByCommodity,
  PayoutStateRow,
  commodityBadge,
  chainBadge,
  formatPrmWeiAmount,
  formatUsdCents,
  formatDate,
} from "@/app/page";

const HISTORY_LIMIT = 200;

const HISTORY_COLUMNS = [
  { label: "Date", align: "left" as const, width: "20%" },
  { label: "Commodity", align: "left" as const, width: "18%" },
  { label: "Chain", align: "left" as const, width: "14%" },
  { label: "PRM", align: "right" as const, width: "16%" },
  { label: "Net USDC", align: "right" as const, width: "16%" },
  { label: "Status", align: "right" as const, width: undefined },
];

function SessionHistory() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payouts-full", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getPayouts(address, HISTORY_LIMIT);
    },
    enabled: isConnected && Boolean(address),
  });

  const rows: PayoutRow[] = data ?? [];

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px" }}>Session History</div>
        {isConnected && !isLoading && !isError ? (
          <div style={{ fontSize: "11px", color: "#52525b" }}>{rows.length} session{rows.length === 1 ? "" : "s"}</div>
        ) : null}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
            {HISTORY_COLUMNS.map((col) => (
              <th key={col.label} style={{ textAlign: col.align, padding: "6px 0", fontSize: "9px", fontWeight: 700, letterSpacing: ".06em", color: "#52525b", textTransform: "uppercase", width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!isConnected ? (
            <PayoutStateRow message="Connect your wallet to see your mining history" />
          ) : isLoading ? (
            <PayoutStateRow message="Loading…" />
          ) : isError ? (
            <PayoutStateRow message="Couldn't load session history" />
          ) : rows.length === 0 ? (
            <PayoutStateRow message="No mining sessions yet" />
          ) : (
            rows.map((row, i) => {
              const commodity = commodityBadge(row.commodity);
              const chain = chainBadge(row.chain);
              return (
                <tr key={row.session_id} style={i === rows.length - 1 ? undefined : { borderBottom: "1px solid #141414" }}>
                  <td style={{ padding: "10px 0", color: "#71717a" }}>{formatDate(row.created_at)}</td>
                  <td style={{ padding: "10px 0" }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: commodity.bg, color: commodity.color, borderRadius: "4px", fontWeight: 700 }}>{commodity.label}</span>
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: chain.bg, color: chain.color, borderRadius: "4px", fontWeight: 700 }}>{chain.label}</span>
                  </td>
                  <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{formatPrmWeiAmount(row.gross_prm)}</td>
                  <td style={{ padding: "10px 0", textAlign: "right", ...(row.net_usd_cents == null ? { color: "#52525b" } : { fontWeight: 700, color: "#4ade80" }) }}>{formatUsdCents(row.net_usd_cents)}</td>
                  <td style={{ padding: "10px 0", textAlign: "right", color: "#52525b" }}>{row.status}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function MyMiningPage() {
  return (
    <>
      <div className="two-col">
        <ActiveMining />
        <EarningsByCommodity />
      </div>
      <SessionHistory />
    </>
  );
}
