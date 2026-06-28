"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPayouts, getStaking, getEarnings, getEarnings24h, getSessions, pauseSession, resumeSession, type PayoutRow, type ChainStake, type EarningsRow, type SessionSummary } from "@/lib/api";
import { chainLabel, chainIdFor, type Chain } from "@/lib/chain";
import { publicClientFor } from "@/lib/clients";
import { getContract } from "@/lib/contracts";
import { PRM_REFERENCE_PRICE_8DEC } from "@/lib/constants";

/*
 * Overview page content. All values below are PLACEHOLDER and hardcoded to match
 * design-reference/overview.html; data wiring replaces these consts one source
 * at a time in later steps. Replace the PLACEHOLDER_* consts, not the layout.
 */

type Kpi = {
  label: string;
  labelColor?: string;
  value: string;
  valueColor?: string;
  sub?: ReactNode;
  subColor?: string;
  progress?: { pct: number; color: string };
  accentBorder?: boolean;
};

const PLACEHOLDER_KPIS: Kpi[] = [
  {
    label: "Mining Speed",
    value: "3,842",
    valueColor: "#4ade80",
    sub: "H/s · Desktop App",
    progress: { pct: 78, color: "#4ade80" },
  },
  {
    label: "PRM Earned (24h)",
    value: "148.6",
    sub: "≈ $15.31 net",
    subColor: "#F59E0B",
  },
  {
    label: "Total Staked",
    value: "10,000",
    sub: "+40% boost · 180d lock",
    subColor: "#4ade80",
  },
  {
    label: "Entity Share",
    labelColor: "#F59E0B",
    value: "4.8%",
    accentBorder: true,
    sub: (
      <a
        href="#"
        style={{
          color: "#F59E0B",
          textDecoration: "none",
          fontSize: "10px",
        }}
      >
        On-chain proof →
      </a>
    ),
  },
  {
    label: "Reserve Ratio",
    value: "168%",
    valueColor: "#4ade80",
    sub: "Healthy · above 150%",
    subColor: "#4ade80",
    progress: { pct: 100, color: "#4ade80" },
  },
];

type CommodityMeta = {
  symbol?: string;
  icon?: string;
  name: string;
  difficulty: string;
  color: string;
  multBg: string;
};

const COMMODITY_META: Record<string, CommodityMeta> = {
  gold: { symbol: "Au", name: "Gold", difficulty: "4.0x", color: "#D4A847", multBg: "rgba(212,168,71,.1)" },
  platinum: { symbol: "Pt", name: "Platinum", difficulty: "3.2x", color: "#C8D4DC", multBg: "rgba(200,212,220,.08)" },
  silver: { symbol: "Ag", name: "Silver", difficulty: "2.0x", color: "#A8B4C0", multBg: "rgba(168,180,192,.08)" },
  crudeoil: { icon: "fa-droplet", name: "Crude Oil", difficulty: "1.0x", color: "#94a3b8", multBg: "rgba(148,163,184,.08)" },
};

const COMMODITY_ORDER = ["gold", "platinum", "silver", "crudeoil"];

function commodityMeta(commodity: string): CommodityMeta {
  return (
    COMMODITY_META[commodity.toLowerCase()] ?? {
      symbol: commodity.slice(0, 2),
      name: commodity,
      difficulty: "—",
      color: "#a1a1aa",
      multBg: "rgba(113,113,122,.12)",
    }
  );
}

const STAKING_REVENUE_SHARE = "20% of platform fees";
const STAKING_WEEKLY_REWARD = "—";
const STAKING_MAX_BOOST_BPS = 4000;
const STAKING_LOCK_LABELS: Record<number, string> = { 0: "30d", 1: "90d", 2: "180d" };
const PRM_DECIMALS = 18n;

function formatPrmWeiAmount(weiStr: string): string {
  let wei: bigint;
  try {
    wei = BigInt(weiStr);
  } catch {
    return weiStr;
  }
  const scale = 10n ** PRM_DECIMALS;
  const grouped = (wei / scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const remainder = wei % scale;
  if (remainder === 0n) return grouped;
  const frac = ((remainder * 10000n) / scale).toString().padStart(4, "0").replace(/0+$/, "");
  return frac.length > 0 ? `${grouped}.${frac}` : grouped;
}

function formatPrmWei(weiStr: string): string {
  return `${formatPrmWeiAmount(weiStr)} PRM`;
}

function formatPrmWeiShort(weiStr: string): string {
  let wei: bigint;
  try {
    wei = BigInt(weiStr);
  } catch {
    return weiStr;
  }
  const scale = 10n ** PRM_DECIMALS;
  const grouped = (wei / scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const remainder = wei % scale;
  if (remainder === 0n) return grouped;
  const frac = ((remainder * 100n) / scale).toString().padStart(2, "0").replace(/0+$/, "");
  return frac.length > 0 ? `${grouped}.${frac}` : grouped;
}

function formatUsdCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const c = BigInt(cents);
  const sign = c < 0n ? "-" : "";
  const abs = c < 0n ? -c : c;
  const dollars = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const rem = (abs % 100n).toString().padStart(2, "0");
  return `${sign}$${dollars}.${rem}`;
}

function formatBoost(bps: number): string {
  const pct = bps / 100;
  const pctStr = Number.isInteger(pct) ? pct.toString() : pct.toFixed(1);
  return `+${pctStr}%${bps >= STAKING_MAX_BOOST_BPS ? " (max)" : ""}`;
}

function chainRowLabel(c: ChainStake): string {
  const name = isChain(c.chain) ? chainLabel(c.chain) : c.chain;
  if (c.chain === "ethereum") {
    const lock = STAKING_LOCK_LABELS[c.lock_period];
    return lock ? `${name} · ${lock}` : name;
  }
  return name;
}

const PLACEHOLDER_ORACLE = {
  active: "Chainlink",
  difficulty: "1.84x avg",
  priceRef: "TWAP · 5min samples",
};

const ORACLE_PRICE_DECIMALS = 8;

const ORACLE_FEEDS = [
  { label: "XAU/USD", ordinal: 0 },
  { label: "XAG/USD", ordinal: 2 },
  { label: "XPT/USD", ordinal: 1 },
  { label: "WTI/USD", ordinal: 3 },
];

function formatUsd(price: bigint, decimals: number): string {
  const scale = 10n ** BigInt(decimals);
  const cents = (price * 100n + scale / 2n) / scale;
  const grouped = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}.${(cents % 100n).toString().padStart(2, "0")}`;
}

async function readOraclePrices(): Promise<Record<number, bigint | null>> {
  const client = publicClientFor("ethereum");
  const oracle = getContract(chainIdFor("ethereum"), "oracleAggregator");
  const results = await Promise.all(
    ORACLE_FEEDS.map((feed) =>
      client.readContract({
        address: oracle.address,
        abi: oracle.abi,
        functionName: "getPriceUnchecked",
        args: [feed.ordinal],
      }),
    ),
  );
  const prices: Record<number, bigint | null> = {};
  ORACLE_FEEDS.forEach((feed, i) => {
    const [price, , initialized] = results[i] as readonly [bigint, bigint, boolean];
    prices[feed.ordinal] = initialized ? price : null;
  });
  return prices;
}

const RESERVE_THRESHOLDS = [
  { color: "#4ade80", range: "Above 150%", label: "Healthy", labelColor: "#4ade80", labelWeight: 600 },
  { color: "#F59E0B", range: "120-150%", label: "Caution", labelColor: "#52525b", labelWeight: 400 },
  { color: "#f97316", range: "100-120%", label: "Stake paused", labelColor: "#52525b", labelWeight: 400 },
  { color: "#ef4444", range: "Below 100%", label: "All paused", labelColor: "#52525b", labelWeight: 400 },
];

type ReserveData = { reserveUsd: bigint; edgeBps: bigint; ratioBps: bigint | null };

async function readReserve(): Promise<ReserveData> {
  const client = publicClientFor("ethereum");
  const eth = chainIdFor("ethereum");
  const prim = getContract(eth, "primToken");
  const treasury = getContract(eth, "treasury");
  const houseEdge = getContract(eth, "houseEdge");

  const [totalSupply, reserveUsd, edgeBps] = (await Promise.all([
    client.readContract({ address: prim.address, abi: prim.abi, functionName: "totalSupply" }),
    client.readContract({ address: treasury.address, abi: treasury.abi, functionName: "totalReserveUsd" }),
    client.readContract({ address: houseEdge.address, abi: houseEdge.abi, functionName: "currentEdgeBps" }),
  ])) as [bigint, bigint, bigint];

  const prmCirculatingValueUsd6 = (totalSupply * PRM_REFERENCE_PRICE_8DEC) / 10n ** 20n;
  let ratioBps: bigint | null = null;
  if (prmCirculatingValueUsd6 > 0n) {
    ratioBps = (await client.readContract({
      address: treasury.address,
      abi: treasury.abi,
      functionName: "reserveRatioBps",
      args: [prmCirculatingValueUsd6],
    })) as bigint;
  }
  return { reserveUsd, edgeBps, ratioBps };
}

function reserveHealth(ratioBps: bigint): { label: string; color: string } {
  if (ratioBps >= 15_000n) return { label: "Healthy · above 150%", color: "#4ade80" };
  if (ratioBps >= 12_000n) return { label: "Caution · 120-150%", color: "#F59E0B" };
  if (ratioBps >= 10_000n) return { label: "Stake paused · 100-120%", color: "#f97316" };
  return { label: "All paused · below 100%", color: "#ef4444" };
}

function formatEdge(edgeBps: bigint): string {
  return `${edgeBps / 100n}%${edgeBps === 1_700n ? " · default" : ""}`;
}

const PAYOUT_LIMIT = 5;

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : shortDate.format(d);
}

type Badge = { label: string; bg: string; color: string };

const FALLBACK_BADGE: Badge = {
  label: "",
  bg: "rgba(113,113,122,.12)",
  color: "#a1a1aa",
};

const COMMODITY_BADGES: Record<string, Badge> = {
  gold: { label: "Au · Gold", bg: "rgba(212,168,71,.1)", color: "#D4A847" },
  silver: { label: "Ag · Silver", bg: "rgba(168,180,192,.08)", color: "#A8B4C0" },
  platinum: { label: "Pt · Platinum", bg: "rgba(200,212,220,.08)", color: "#C8D4DC" },
  oil: { label: "WTI · Crude Oil", bg: "rgba(148,163,184,.08)", color: "#94a3b8" },
  crudeoil: { label: "WTI · Crude Oil", bg: "rgba(148,163,184,.08)", color: "#94a3b8" },
  wti: { label: "WTI · Crude Oil", bg: "rgba(148,163,184,.08)", color: "#94a3b8" },
};

function commodityBadge(commodity: string): Badge {
  return (
    COMMODITY_BADGES[commodity.toLowerCase()] ?? {
      ...FALLBACK_BADGE,
      label: commodity,
    }
  );
}

const CHAIN_BADGES: Record<Chain, { bg: string; color: string }> = {
  ethereum: { bg: "rgba(98,126,234,.1)", color: "#8299EE" },
  polygon: { bg: "rgba(123,63,228,.1)", color: "#9B6FEA" },
};

function isChain(value: string): value is Chain {
  return value === "ethereum" || value === "polygon";
}

function chainBadge(chain: string): Badge {
  return isChain(chain)
    ? { label: chainLabel(chain), ...CHAIN_BADGES[chain] }
    : { ...FALLBACK_BADGE, label: chain };
}

const PAYOUT_COLUMNS = [
  { label: "Date", align: "left" as const, width: "20%" },
  { label: "Commodity", align: "left" as const, width: "18%" },
  { label: "Chain", align: "left" as const, width: "14%" },
  { label: "PRM", align: "right" as const, width: "16%" },
  { label: "Net USDC", align: "right" as const, width: "16%" },
  { label: "Tx", align: "right" as const, width: undefined },
];

type Site = {
  name: string;
  location: string;
  comms: { label: string; color: string }[];
  active?: boolean;
};

const PLACEHOLDER_SITES: Site[] = [
  { name: "Johannesburg", location: "South Africa", comms: [{ label: "Au", color: "#D4A847" }, { label: "Pt", color: "#C8D4DC" }], active: true },
  { name: "Amsterdam", location: "Netherlands", comms: [{ label: "Ag", color: "#A8B4C0" }] },
  { name: "Dallas", location: "United States", comms: [{ label: "WTI", color: "#94a3b8" }] },
  { name: "Toronto", location: "Canada", comms: [{ label: "Au", color: "#D4A847" }] },
  { name: "Warsaw", location: "Poland", comms: [{ label: "Ag", color: "#A8B4C0" }] },
  { name: "Dubai", location: "UAE", comms: [{ label: "WTI", color: "#94a3b8" }] },
];

const labelStyle: CSSProperties = { fontSize: "10px", color: "#52525b", marginBottom: "3px" };
const subStyle: CSSProperties = { fontSize: "10px", marginTop: "1px" };

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="kpi" style={kpi.accentBorder ? { borderColor: "rgba(245,158,11,.2)" } : undefined}>
      <div className="kpi-label" style={kpi.labelColor ? { color: kpi.labelColor } : undefined}>
        {kpi.label}
      </div>
      <div className="kpi-val" style={kpi.valueColor ? { color: kpi.valueColor } : undefined}>
        {kpi.value}
      </div>
      <div className="kpi-sub" style={kpi.subColor ? { color: kpi.subColor } : undefined}>
        {kpi.sub}
      </div>
      {kpi.progress ? (
        <div className="prog-wrap">
          <div className="prog-bar" style={{ width: `${kpi.progress.pct}%`, background: kpi.progress.color }} />
        </div>
      ) : null}
    </div>
  );
}

function PayoutStateRow({ message }: { message: string }) {
  return (
    <tr>
      <td
        colSpan={PAYOUT_COLUMNS.length}
        style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}
      >
        {message}
      </td>
    </tr>
  );
}

function RecentPayouts() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payouts", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getPayouts(address, PAYOUT_LIMIT);
    },
    enabled: isConnected && Boolean(address),
  });

  const rows: PayoutRow[] = data ?? [];

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px" }}>Recent Payouts</div>
        <Link href="/wallet" style={{ fontSize: "11px", color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
            {PAYOUT_COLUMNS.map((col) => (
              <th key={col.label} style={{ textAlign: col.align, padding: "6px 0", fontSize: "9px", fontWeight: 700, letterSpacing: ".06em", color: "#52525b", textTransform: "uppercase", width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!isConnected ? (
            <PayoutStateRow message="Connect your wallet to see payouts" />
          ) : isLoading ? (
            <PayoutStateRow message="Loading…" />
          ) : isError ? (
            <PayoutStateRow message="Couldn't load payouts" />
          ) : rows.length === 0 ? (
            <PayoutStateRow message="No payouts yet" />
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
                  <td style={{ padding: "10px 0", textAlign: "right", color: "#52525b" }}>—</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function OracleNetwork() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["oracle-prices"],
    queryFn: readOraclePrices,
    refetchInterval: 45_000,
  });

  function priceFor(ordinal: number): string {
    if (isLoading) return "…";
    if (isError) return "—";
    const price = data?.[ordinal];
    return price == null ? "—" : formatUsd(price, ORACLE_PRICE_DECIMALS);
  }

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Oracle &amp; Network</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#71717a" }}>Active oracle</span>
          <span style={{ color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />{PLACEHOLDER_ORACLE.active}
          </span>
        </div>
        {ORACLE_FEEDS.map((feed) => (
          <div key={feed.label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#71717a" }}>{feed.label}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{priceFor(feed.ordinal)}</span>
          </div>
        ))}
        <div style={{ paddingTop: "8px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#71717a" }}>Difficulty</span>
          <span style={{ fontWeight: 600 }}>{PLACEHOLDER_ORACLE.difficulty}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#71717a" }}>Price ref.</span>
          <span style={{ fontSize: "10px", color: "#52525b" }}>{PLACEHOLDER_ORACLE.priceRef}</span>
        </div>
      </div>
    </div>
  );
}

function commodityOrderIndex(commodity: string): number {
  const i = COMMODITY_ORDER.indexOf(commodity.toLowerCase());
  return i === -1 ? COMMODITY_ORDER.length : i;
}

function EarningsByCommodity() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["earnings", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getEarnings(address);
    },
    enabled: isConnected && Boolean(address),
  });

  const rows: EarningsRow[] = [...(data ?? [])].sort(
    (a, b) => commodityOrderIndex(a.commodity) - commodityOrderIndex(b.commodity),
  );
  const totalUsdCents = rows.reduce((acc, r) => acc + BigInt(r.total_usd_cents), 0n);

  function sharePct(cents: number): number {
    if (totalUsdCents === 0n) return 0;
    return Number((BigInt(cents) * 10000n) / totalUsdCents) / 100;
  }

  const message = !isConnected
    ? "Connect your wallet"
    : isLoading
      ? "Loading…"
      : isError
        ? "Couldn't load earnings"
        : rows.length === 0
          ? "No earnings yet"
          : null;

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Earnings by Commodity</div>
      {message ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>{message}</div>
      ) : (
        <div>
          {rows.map((row, i) => {
            const meta = commodityMeta(row.commodity);
            const first = i === 0;
            const last = i === rows.length - 1;
            const padV = first ? "0 0 10px" : last ? "10px 0 0" : "10px 0";
            return (
              <div
                key={row.commodity}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 72px 104px",
                  alignItems: "center",
                  columnGap: "12px",
                  padding: padV,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                  {meta.icon ? (
                    <i className={`fa-solid ${meta.icon}`} style={{ fontSize: "12px", color: meta.color, width: "13px" }} />
                  ) : (
                    <span style={{ fontSize: "13px", fontWeight: 700, color: meta.color, fontFamily: "var(--font-display)" }}>{meta.symbol}</span>
                  )}
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>{meta.name}</span>
                  <span className="comm-tag" style={{ background: meta.multBg, color: meta.color }}>{meta.difficulty}</span>
                </div>
                <div className="prog-wrap" style={{ marginTop: 0 }}>
                  <div className="prog-bar" style={{ width: `${sharePct(row.total_usd_cents)}%`, background: meta.color }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, textAlign: "right" }}>{formatUsdCents(row.total_usd_cents)}</span>
                <span style={{ fontSize: "10px", color: "#52525b", textAlign: "right", whiteSpace: "nowrap" }}>{formatPrmWeiAmount(row.total_gross_prm)} PRM</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ paddingTop: "12px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "10px" }}>
        <span style={{ color: "#71717a" }}>All figures net of 17% platform fee</span>
        <Link href="/my-mining" style={{ color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Full history →</Link>
      </div>
    </div>
  );
}

function StakingCard() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staking", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getStaking(address);
    },
    enabled: isConnected && Boolean(address),
  });

  function boostValue(): string {
    if (isLoading) return "…";
    if (isError) return "—";
    return data ? formatBoost(data.effective_boost_bps) : "—";
  }

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Staking</div>
      {!isConnected ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>
          Connect your wallet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
          {isLoading || isError ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#71717a" }}>Stake</span>
              <span style={{ fontWeight: 600 }}>{isLoading ? "…" : "—"}</span>
            </div>
          ) : (
            (data?.chains ?? []).map((c) => (
              <div key={c.chain} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a" }}>{chainRowLabel(c)}</span>
                <span style={{ fontWeight: 600 }}>{formatPrmWei(c.amount)}</span>
              </div>
            ))
          )}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #1a1a1a" }}>
            <span style={{ color: "#71717a" }}>Effective boost</span>
            <span style={{ fontWeight: 700, color: "#F59E0B" }}>{boostValue()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#71717a" }}>Weekly reward</span>
            <span style={{ fontSize: "11px", color: "#52525b" }}>{STAKING_WEEKLY_REWARD}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#71717a" }}>Revenue share</span>
            <span style={{ fontSize: "11px", color: "#52525b" }}>{STAKING_REVENUE_SHARE}</span>
          </div>
        </div>
      )}
      <Link href="/stake" style={{ display: "block", textAlign: "center", marginTop: "14px", padding: "8px", background: "#1f1f1f", color: "#e4e4e7", borderRadius: "10px", fontSize: "11px", fontWeight: 600, textDecoration: "none" }}>Manage Stake</Link>
    </div>
  );
}

function ethereumLockLabel(chains: ChainStake[]): string | null {
  const eth = chains.find((c) => c.chain === "ethereum" && c.active);
  if (!eth) return null;
  return STAKING_LOCK_LABELS[eth.lock_period] ?? null;
}

function TotalStakedKpi() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staking", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getStaking(address);
    },
    enabled: isConnected && Boolean(address),
  });

  let value = "—";
  let sub: ReactNode = null;
  if (!isConnected) {
    value = "—";
  } else if (isLoading) {
    value = "…";
  } else if (isError || !data) {
    value = "—";
  } else {
    value = formatPrmWeiAmount(data.total_staked);
    const pct = data.effective_boost_bps / 100;
    const pctStr = Number.isInteger(pct) ? pct.toString() : pct.toFixed(1);
    const lock = ethereumLockLabel(data.chains);
    sub = lock ? `+${pctStr}% boost · ${lock}` : `+${pctStr}% boost`;
  }

  return (
    <KpiCard
      kpi={{
        label: "Total Staked",
        value,
        sub,
        subColor: sub ? "#4ade80" : undefined,
      }}
    />
  );
}

function ReserveRatioKpi() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reserve"],
    queryFn: readReserve,
    refetchInterval: 60_000,
  });

  let value = "—";
  let valueColor: string | undefined;
  let sub: ReactNode = null;
  let progress: { pct: number; color: string } | undefined;
  if (isLoading) {
    value = "…";
  } else if (isError || !data || data.ratioBps == null) {
    value = "—";
  } else {
    const h = reserveHealth(data.ratioBps);
    value = `${data.ratioBps / 100n}%`;
    valueColor = h.color;
    sub = h.label;
    progress = { pct: Math.min(100, Number(data.ratioBps) / 150), color: h.color };
  }

  return (
    <KpiCard
      kpi={{ label: "Reserve Ratio", value, valueColor, sub, subColor: valueColor, progress }}
    />
  );
}

function ReserveHealth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reserve"],
    queryFn: readReserve,
    refetchInterval: 60_000,
  });

  const ratioBps = data?.ratioBps ?? null;
  const health = ratioBps != null ? reserveHealth(ratioBps) : null;
  const ratioText = isLoading ? "…" : ratioBps == null ? "—" : `${ratioBps / 100n}%`;
  const ratioColor = health?.color ?? "#52525b";
  const statusText = isLoading
    ? ""
    : health
      ? health.label
      : isError
        ? "unavailable"
        : "no PRM minted yet";
  const edgeText = isLoading ? "…" : data ? formatEdge(data.edgeBps) : "—";

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Reserve Health</div>
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <div className="tabnum font-display" style={{ fontSize: "40px", fontWeight: 700, color: ratioColor }}>{ratioText}</div>
        <div style={{ fontSize: "12px", color: ratioColor, marginTop: "4px" }}>{statusText}</div>
      </div>
      <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
        <tbody>
          {RESERVE_THRESHOLDS.map((t, i) => (
            <tr key={t.range}>
              <td style={{ padding: "3px 0", width: i === 0 ? "14px" : undefined }}>
                <span style={{ color: t.color, fontSize: "8px" }}>■</span>
              </td>
              <td style={{ padding: "3px 0", color: "#71717a", width: i === 0 ? "70px" : undefined }}>{t.range}</td>
              <td style={{ padding: "3px 0", textAlign: "right", color: t.labelColor, fontWeight: t.labelWeight }}>{t.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span style={{ color: "#71717a" }}>House edge</span>
        <span style={{ fontWeight: 600 }}>{edgeText}</span>
      </div>
    </div>
  );
}

function pickActiveSession(sessions: SessionSummary[] | undefined): SessionSummary | null {
  if (!sessions || sessions.length === 0) return null;
  return [...sessions].sort((a, b) => (a.started_at < b.started_at ? 1 : -1))[0];
}

function clientLabel(clientType: string): string {
  if (clientType === "desktop") return "Desktop App";
  if (clientType === "browser") return "Browser";
  if (clientType === "cli") return "CLI";
  return clientType;
}

function PrmEarned24hKpi() {
  const { address, isConnected } = useAccount();
  const { data, isLoading } = useQuery({
    queryKey: ["earnings24h", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getEarnings24h(address);
    },
    enabled: isConnected && Boolean(address),
  });

  let value = "—";
  let sub: ReactNode = null;
  let subColor: string | undefined;
  if (!isConnected) {
    value = "—";
  } else if (isLoading) {
    value = "…";
  } else if (data) {
    value = formatPrmWeiShort(data.total_gross_prm);
    sub = `≈ ${formatUsdCents(data.total_usd_cents)} net`;
    subColor = "#F59E0B";
  }

  return <KpiCard kpi={{ label: "PRM Earned (24h)", value, sub, subColor }} />;
}

function MiningSpeedKpi() {
  const { address, isConnected } = useAccount();
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getSessions(address);
    },
    enabled: isConnected && Boolean(address),
  });
  const active = pickActiveSession(data);

  let value = "—";
  let sub: ReactNode = "Not mining";
  let valueColor: string | undefined;
  if (!isConnected) {
    value = "—";
    sub = "Not mining";
  } else if (isLoading) {
    value = "…";
    sub = "H/s";
  } else if (active) {
    value = active.avg_hashrate.toLocaleString("en-US");
    valueColor = "#4ade80";
    sub = `H/s · ${clientLabel(active.client_type)}`;
  }

  return <KpiCard kpi={{ label: "Mining Speed", value, valueColor, sub }} />;
}

function ActiveMining() {
  const { address, isConnected } = useAccount();
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getSessions(address);
    },
    enabled: isConnected && Boolean(address),
  });
  const { data: staking } = useQuery({
    queryKey: ["staking", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getStaking(address);
    },
    enabled: isConnected && Boolean(address),
  });
  const queryClient = useQueryClient();
  const control = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "pause" | "resume" }) => {
      if (!address) throw new Error("wallet not connected");
      return action === "pause"
        ? pauseSession(id, address)
        : resumeSession(id, address);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sessions", address] }),
  });
  const active = pickActiveSession(sessions);

  if (!isConnected || (!isLoading && !active)) {
    return (
      <div className="card" style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <i className="fa-solid fa-microchip" style={{ color: "#52525b", fontSize: "13px" }} />
          <span style={{ fontSize: "15px", fontWeight: 600 }}>Active Mining</span>
        </div>
        <div style={{ padding: "20px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>
          {isConnected ? "No active mining session" : "Connect your wallet to see mining"}
        </div>
        <div style={{ textAlign: "center" }}>
          <Link href="/mine" style={{ fontSize: "11px", color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Start mining →</Link>
        </div>
      </div>
    );
  }

  if (isLoading || !active) {
    return (
      <div className="card" style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <i className="fa-solid fa-microchip" style={{ color: "#52525b", fontSize: "13px" }} />
          <span style={{ fontSize: "15px", fontWeight: 600 }}>Active Mining</span>
        </div>
        <div style={{ padding: "20px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Loading…</div>
      </div>
    );
  }

  const meta = commodityMeta(active.commodity);
  const boostText = staking ? formatBoost(staking.effective_boost_bps) : "…";

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <i className="fa-solid fa-microchip" style={{ color: active.paused ? "#F59E0B" : "#4ade80", fontSize: "13px" }} />
            <span style={{ fontSize: "15px", fontWeight: 600 }}>Active Mining</span>
            {active.paused ? (
              <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(245,158,11,.12)", color: "#F59E0B", borderRadius: "4px", fontWeight: 700 }}>PAUSED</span>
            ) : (
              <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(34,197,94,.1)", color: "#4ade80", borderRadius: "4px", fontWeight: 700 }}>LIVE</span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#4ade80" }}>
            {active.cpu_threads > 0
              ? `${clientLabel(active.client_type)} · ${active.cpu_threads} threads`
              : clientLabel(active.client_type)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="tabnum font-display" style={{ fontSize: "36px", fontWeight: 700 }}>{active.avg_hashrate.toLocaleString("en-US")}</div>
          <div style={{ fontSize: "11px", color: "#4ade80" }}>H/s avg</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "18px" }}>
        <div>
          <div style={labelStyle}>Commodity</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: meta.color }}>{meta.name}</div>
          <div style={{ ...subStyle, color: meta.color }}>{meta.difficulty} diff</div>
        </div>
        <div>
          <div style={labelStyle}>Net so far</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#F59E0B" }}>{formatUsdCents(active.est_net_usd_cents)}</div>
          <div style={{ ...subStyle, color: "#52525b" }}>after 17% fee</div>
        </div>
        <div>
          <div style={labelStyle}>Staking Boost</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#F59E0B" }}>{boostText}</div>
          <div style={{ ...subStyle, color: "#52525b" }}>effective</div>
        </div>
        {active.site_code ? (
          <div>
            <div style={labelStyle}>Site</div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{active.site_code}</div>
            <div style={{ ...subStyle, color: "#52525b" }}>{active.site_city ?? ""}</div>
          </div>
        ) : (
          <div>
            <div style={labelStyle}>Proofs</div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{active.proof_count}</div>
            <div style={{ ...subStyle, color: "#52525b" }}>submitted</div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: "14px", borderTop: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {active.rejected_proof_count > 0 ? (
          <span style={{ color: "#F59E0B", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "11px" }} />
            {active.verified_proof_count} verified · {active.rejected_proof_count} rejected
          </span>
        ) : active.verified_proof_count > 0 ? (
          <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: "11px" }} />
            Verified clean · {active.verified_proof_count} verified
          </span>
        ) : (
          <span style={{ color: "#52525b", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
            <span className="pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#52525b", display: "inline-block" }} />Awaiting proofs
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => control.mutate({ id: active.session_id, action: active.paused ? "resume" : "pause" })}
            disabled={control.isPending}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: control.isPending ? "default" : "pointer",
              opacity: control.isPending ? 0.6 : 1,
              background: "rgba(34,197,94,.12)",
              color: "#4ade80",
            }}
          >
            {active.paused ? "Resume" : "Pause"}
          </button>
          <Link href="/mine" style={{ fontSize: "11px", color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Open Mine →</Link>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <>
      {/* KPI row */}
      <div className="kpi-grid">
        {PLACEHOLDER_KPIS.map((kpi) => {
          if (kpi.label === "Mining Speed") return <MiningSpeedKpi key={kpi.label} />;
          if (kpi.label === "PRM Earned (24h)") return <PrmEarned24hKpi key={kpi.label} />;
          if (kpi.label === "Total Staked") return <TotalStakedKpi key={kpi.label} />;
          if (kpi.label === "Reserve Ratio") return <ReserveRatioKpi key={kpi.label} />;
          return <KpiCard key={kpi.label} kpi={kpi} />;
        })}
      </div>

      {/* Active Mining + Commodity breakdown */}
      <div className="two-col">
        <ActiveMining />

        <EarningsByCommodity />
      </div>

      {/* Staking + Oracle + Reserve row */}
      <div className="three-col">
        <StakingCard />

        <OracleNetwork />

        <ReserveHealth />
      </div>

      {/* Recent payouts */}
      <RecentPayouts />

      {/* Mining sites */}
      <div className="card" style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>Mining Sites</div>
          <div style={{ fontSize: "11px", color: "#52525b" }}>Auto-routed by commodity · 6/6 online</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
          {PLACEHOLDER_SITES.map((site) => (
            <div key={site.name} style={{ background: "#0d0d0f", border: site.active ? "1px solid rgba(245,158,11,.2)" : "1px solid #1a1a1a", borderRadius: "14px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{site.name}</span>
                <span className="pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              </div>
              <div style={{ fontSize: "10px", color: "#71717a", marginBottom: "4px" }}>{site.location}</div>
              <div style={{ fontSize: "10px" }}>
                {site.comms.map((c, i) => (
                  <span key={c.label}>
                    {i > 0 ? " · " : ""}
                    <span style={{ color: c.color }}>{c.label}</span>
                  </span>
                ))}
              </div>
              {site.active ? (
                <div style={{ fontSize: "10px", color: "#F59E0B", marginTop: "4px", fontWeight: 600 }}>Your active site</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
