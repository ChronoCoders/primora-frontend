"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getCommodities, getEstimate, type CommodityParams } from "@/lib/api";
import { chainLabel, ALL_CHAINS, type Chain } from "@/lib/chain";
import { ActiveMining, formatUsdCents } from "@/app/page";

const DURATIONS = [
  { label: "1 hour", secs: 3_600 },
  { label: "4 hours", secs: 14_400 },
  { label: "8 hours", secs: 28_800 },
];

function durationLabel(secs: number): string {
  return DURATIONS.find((d) => d.secs === secs)?.label ?? `${Math.round(secs / 3600)}h`;
}

function Planner() {
  const { address, isConnected } = useAccount();
  const commoditiesQ = useQuery({ queryKey: ["commodities"], queryFn: getCommodities });
  const commodities: CommodityParams[] = commoditiesQ.data ?? [];

  const [commodity, setCommodity] = useState("Gold");
  const [chain, setChain] = useState<Chain>("ethereum");
  const [durationSecs, setDurationSecs] = useState(28_800);

  const estimateQ = useQuery({
    queryKey: ["estimate", commodity, durationSecs, address],
    queryFn: () => getEstimate(commodity, durationSecs, address),
    enabled: commodities.length > 0,
  });
  const est = estimateQ.data;
  const selected = commodities.find((c) => c.commodity === commodity);

  const netText = estimateQ.isLoading
    ? "…"
    : estimateQ.isError || !est || est.net_usd_cents == null
      ? "—"
      : formatUsdCents(est.net_usd_cents);

  const basisText = !est
    ? ""
    : est.hashrate_basis === "personal"
      ? `based on your active session's measured rate (${est.hashrate_used.toLocaleString("en-US")} H/s)`
      : `reference estimate at ${est.hashrate_used.toLocaleString("en-US")} H/s`;

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Plan a session</div>

      {/* Commodity selector + per-commodity base difficulty */}
      <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Commodity (one per session)</div>
      {commoditiesQ.isLoading ? (
        <div style={{ fontSize: "12px", color: "#52525b", padding: "8px 0" }}>Loading commodities…</div>
      ) : commoditiesQ.isError ? (
        <div style={{ fontSize: "12px", color: "#52525b", padding: "8px 0" }}>Couldn&apos;t load commodities</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginBottom: "6px" }}>
          {commodities.map((c) => {
            const active = c.commodity === commodity;
            return (
              <button
                key={c.commodity}
                type="button"
                onClick={() => setCommodity(c.commodity)}
                style={{
                  textAlign: "left",
                  padding: "10px",
                  borderRadius: "10px",
                  border: active ? "1px solid rgba(245,158,11,.4)" : "1px solid #1f1f1f",
                  background: active ? "rgba(245,158,11,.08)" : "#131313",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 600, color: active ? "#F59E0B" : "#e4e4e7" }}>{c.commodity}</div>
                <div style={{ fontSize: "10px", color: "#71717a", marginTop: "2px" }}>
                  {c.difficulty}× difficulty · {c.multiplier}× payout
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: "9px", color: "#52525b", marginBottom: "14px" }}>
        Base difficulty — the weekly dynamic recompute (§3.3) is not active yet.
      </div>

      {/* Chain + duration */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Mint chain</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {ALL_CHAINS.map((c) => (
              <button key={c} type="button" onClick={() => setChain(c)} style={pill(chain === c)}>{chainLabel(c)}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Duration</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {DURATIONS.map((d) => (
              <button key={d.secs} type="button" onClick={() => setDurationSecs(d.secs)} style={pill(durationSecs === d.secs)}>{d.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Estimate — net after house edge is the headline */}
      <div style={{ background: "#0d0d0f", border: "1px solid #1a1a1a", borderRadius: "14px", padding: "16px" }}>
        <div style={{ fontSize: "11px", color: "#71717a" }}>Estimated net earnings (after house edge)</div>
        <div className="tabnum font-display" style={{ fontSize: "34px", fontWeight: 700, color: "#4ade80", margin: "2px 0" }}>{netText}</div>
        {est ? (
          <>
            <div style={{ fontSize: "11px", color: "#a1a1aa" }}>
              {est.commodity} · {durationLabel(est.duration_secs)} · {basisText}
            </div>
            <div style={{ fontSize: "10px", color: "#52525b", marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <span>House edge {(est.house_edge_bps / 100).toFixed(0)}% (live)</span>
              {est.effective_boost_bps > 0 ? <span>Staking boost +{(est.effective_boost_bps / 100).toFixed(1).replace(/\.0$/, "")}%</span> : null}
              <span>{est.spot_price ? "at current price" : "price unavailable"}</span>
            </div>
          </>
        ) : null}
        <div style={{ fontSize: "10px", color: "#52525b", marginTop: "8px", lineHeight: 1.5 }}>
          An estimate, not a guarantee — actual earnings depend on your machine&apos;s real hashrate,
          the session duration, and the live edge and commodity price at settlement.
          {!isConnected ? " Connect your wallet for a personalized estimate and your staking boost." : ""}
        </div>
      </div>

      {/* Session-start notes */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1a1a1a", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "10px", color: "#a1a1aa", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>How mining works:</span> hashing runs in the Primora
          desktop or CLI client (native RandomX). This dashboard plans and monitors — start your
          client to begin a session; it will appear under Active Mining as it submits proofs. Your
          node/site is assigned when the session starts (see Sites).
        </div>
        <div style={{ fontSize: "10px", color: "#52525b", lineHeight: 1.5 }}>
          Sessions under 10 minutes are priced at the session-start spot price minus a 5% volatility
          buffer (a lower payout), per spec.
        </div>
      </div>
    </div>
  );
}

function pill(active: boolean) {
  return {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: active ? "1px solid rgba(245,158,11,.4)" : "1px solid #1f1f1f",
    background: active ? "rgba(245,158,11,.1)" : "#131313",
    color: active ? "#F59E0B" : "#a1a1aa",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  } as const;
}

export default function MinePage() {
  return (
    <div className="two-col">
      <Planner />
      <ActiveMining />
    </div>
  );
}
