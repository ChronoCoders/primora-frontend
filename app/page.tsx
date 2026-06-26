"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

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

const PLACEHOLDER_ACTIVE_MINING = {
  hashrate: "3,842",
  source: "Desktop App · 16 threads",
  stats: [
    { label: "Commodity", value: "Gold", valueColor: "#D4A847", sub: "XAU · 4.0x diff", subColor: "#D4A847" },
    { label: "Est. Net Today", value: "$15.31", valueColor: "#4ade80", sub: "after 17% fee", subColor: "#52525b" },
    { label: "Staking Boost", value: "+40%", valueColor: "#F59E0B", sub: "Max · 180d lock", subColor: "#52525b" },
    { label: "Site", value: "JHB", valueColor: undefined, sub: "Johannesburg", subColor: "#52525b" },
  ],
};

type CommodityEarning = {
  symbol: string;
  symbolColor: string;
  icon?: string;
  name: string;
  mult: string;
  multBg: string;
  multColor: string;
  barPct: number;
  barColor: string;
  amount: string;
  date: string;
};

const PLACEHOLDER_COMMODITY_EARNINGS: CommodityEarning[] = [
  { symbol: "Au", symbolColor: "#D4A847", name: "Gold", mult: "4.0x", multBg: "rgba(212,168,71,.1)", multColor: "#D4A847", barPct: 44, barColor: "#D4A847", amount: "$8.04", date: "Jun 22" },
  { symbol: "Pt", symbolColor: "#C8D4DC", name: "Platinum", mult: "3.2x", multBg: "rgba(200,212,220,.08)", multColor: "#C8D4DC", barPct: 20, barColor: "#C8D4DC", amount: "$14.12", date: "Jun 21" },
  { symbol: "Ag", symbolColor: "#A8B4C0", name: "Silver", mult: "2.0x", multBg: "rgba(168,180,192,.08)", multColor: "#A8B4C0", barPct: 28, barColor: "#A8B4C0", amount: "$13.89", date: "Jun 20" },
  { symbol: "", symbolColor: "#94a3b8", icon: "fa-droplet", name: "Crude Oil", mult: "1.0x", multBg: "rgba(148,163,184,.08)", multColor: "#94a3b8", barPct: 8, barColor: "#94a3b8", amount: "$12.40", date: "Jun 18" },
];

const PLACEHOLDER_STAKING = {
  rows: [
    { label: "Polygon", value: "0 PRM", valueColor: undefined, divider: false },
    { label: "Ethereum · 180d", value: "10,000 PRM", valueColor: undefined, divider: false },
    { label: "Effective boost", value: "+40% (max)", valueColor: "#F59E0B", divider: true },
    { label: "Weekly reward", value: "$4.28 USDC", valueColor: "#4ade80", divider: false },
  ],
  revenueShare: "20% of platform fees",
};

const PLACEHOLDER_ORACLE = {
  active: "Chainlink",
  feeds: [
    { label: "XAU/USD", value: "$3,204.00" },
    { label: "XAG/USD", value: "$31.80" },
    { label: "XPT/USD", value: "$981.00" },
    { label: "WTI/USD", value: "$73.40" },
  ],
  difficulty: "1.84x avg",
  priceRef: "TWAP · 5min samples",
};

const PLACEHOLDER_RESERVE = {
  ratio: "168%",
  status: "Healthy · above 150%",
  thresholds: [
    { color: "#4ade80", range: "Above 150%", label: "Healthy", labelColor: "#4ade80", labelWeight: 600 },
    { color: "#F59E0B", range: "120-150%", label: "Caution", labelColor: "#52525b", labelWeight: 400 },
    { color: "#f97316", range: "100-120%", label: "Stake paused", labelColor: "#52525b", labelWeight: 400 },
    { color: "#ef4444", range: "Below 100%", label: "All paused", labelColor: "#52525b", labelWeight: 400 },
  ],
  houseEdge: "17% · default",
};

type Payout = {
  date: string;
  commodity: { label: string; bg: string; color: string };
  chain: { label: string; bg: string; color: string };
  prm: string;
  net: string;
  tx: string;
};

const POLYGON_BADGE = { bg: "rgba(123,63,228,.1)", color: "#9B6FEA" };
const ETHEREUM_BADGE = { bg: "rgba(98,126,234,.1)", color: "#8299EE" };

const PLACEHOLDER_PAYOUTS: Payout[] = [
  { date: "Jun 21", commodity: { label: "Au · Gold", bg: "rgba(212,168,71,.1)", color: "#D4A847" }, chain: { label: "Polygon", ...POLYGON_BADGE }, prm: "118.2", net: "$15.23", tx: "0x9c4b..." },
  { date: "Jun 20", commodity: { label: "Ag · Silver", bg: "rgba(168,180,192,.08)", color: "#A8B4C0" }, chain: { label: "Polygon", ...POLYGON_BADGE }, prm: "148.6", net: "$13.89", tx: "0x7e2a..." },
  { date: "Jun 19", commodity: { label: "Pt · Platinum", bg: "rgba(200,212,220,.08)", color: "#C8D4DC" }, chain: { label: "Ethereum", ...ETHEREUM_BADGE }, prm: "98.4", net: "$14.12", tx: "0x3d8f..." },
];

type Site = {
  name: string;
  location: string;
  comms: { label: string; color: string }[];
  active?: boolean;
};

const PLACEHOLDER_SITES: Site[] = [
  { name: "Johannesburg", location: "South Africa · Vultr", comms: [{ label: "Au", color: "#D4A847" }, { label: "Pt", color: "#C8D4DC" }], active: true },
  { name: "Amsterdam", location: "Netherlands · DigitalOcean", comms: [{ label: "Ag", color: "#A8B4C0" }] },
  { name: "Dallas", location: "United States · Akamai", comms: [{ label: "WTI", color: "#94a3b8" }] },
  { name: "Toronto", location: "Canada · Vultr", comms: [{ label: "Au", color: "#D4A847" }] },
  { name: "Warsaw", location: "Poland · Vultr", comms: [{ label: "Ag", color: "#A8B4C0" }] },
  { name: "Dubai", location: "UAE · Vultr", comms: [{ label: "WTI", color: "#94a3b8" }] },
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

export default function OverviewPage() {
  return (
    <>
      {/* KPI row */}
      <div className="kpi-grid">
        {PLACEHOLDER_KPIS.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Active Mining + Commodity breakdown */}
      <div className="two-col">
        <div className="card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <i className="fa-solid fa-microchip" style={{ color: "#4ade80", fontSize: "13px" }} />
                <span style={{ fontSize: "15px", fontWeight: 600 }}>Active Mining</span>
                <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(34,197,94,.1)", color: "#4ade80", borderRadius: "4px", fontWeight: 700 }}>LIVE</span>
              </div>
              <div style={{ fontSize: "12px", color: "#4ade80" }}>{PLACEHOLDER_ACTIVE_MINING.source}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="tabnum font-display" style={{ fontSize: "36px", fontWeight: 700 }}>{PLACEHOLDER_ACTIVE_MINING.hashrate}</div>
              <div style={{ fontSize: "11px", color: "#4ade80" }}>H/s</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "18px" }}>
            {PLACEHOLDER_ACTIVE_MINING.stats.map((stat) => (
              <div key={stat.label}>
                <div style={labelStyle}>{stat.label}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, ...(stat.valueColor ? { color: stat.valueColor } : {}) }}>{stat.value}</div>
                <div style={{ ...subStyle, color: stat.subColor }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: "14px", borderTop: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
              <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: "9px" }} />Verified clean
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" style={{ padding: "6px 14px", background: "#059669", color: "#fff", borderRadius: "10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px" }}>
                <i className="fa-solid fa-pause" style={{ fontSize: "9px" }} />Pause
              </button>
              <button type="button" style={{ padding: "6px 14px", background: "#1f1f1f", color: "#e4e4e7", borderRadius: "10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Restart
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "22px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Earnings by Commodity</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {PLACEHOLDER_COMMODITY_EARNINGS.map((row, i) => {
                const first = i === 0;
                const last = i === PLACEHOLDER_COMMODITY_EARNINGS.length - 1;
                const padV = first ? "0 0 10px 0" : last ? "10px 0 0 0" : "10px 0";
                const padCell = first ? "0 0 10px 12px" : last ? "10px 0 0 12px" : "10px 0 10px 12px";
                return (
                  <tr key={row.name}>
                    <td style={{ padding: padV, width: first ? "130px" : undefined }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        {row.icon ? (
                          <i className={`fa-solid ${row.icon}`} style={{ fontSize: "12px", color: row.symbolColor, width: "13px" }} />
                        ) : (
                          <span style={{ fontSize: "13px", fontWeight: 700, color: row.symbolColor, fontFamily: "var(--font-display)" }}>{row.symbol}</span>
                        )}
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>{row.name}</span>
                        <span className="comm-tag" style={{ background: row.multBg, color: row.multColor }}>{row.mult}</span>
                      </div>
                    </td>
                    <td style={{ padding: padCell }}>
                      <div className="prog-wrap" style={{ marginTop: 0 }}>
                        <div className="prog-bar" style={{ width: `${row.barPct}%`, background: row.barColor }} />
                      </div>
                    </td>
                    <td style={{ padding: padCell, textAlign: "right", whiteSpace: "nowrap", width: first ? "110px" : undefined }}>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{row.amount}</span>
                      <span style={{ fontSize: "10px", color: "#52525b", marginLeft: "4px" }}>{row.date}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ paddingTop: "12px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "10px" }}>
            <span style={{ color: "#71717a" }}>All figures net of 17% platform fee</span>
            <Link href="/my-mining" style={{ color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Full history →</Link>
          </div>
        </div>
      </div>

      {/* Staking + Oracle + Reserve row */}
      <div className="three-col">
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Staking</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            {PLACEHOLDER_STAKING.rows.map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", ...(row.divider ? { paddingTop: "8px", borderTop: "1px solid #1a1a1a" } : {}) }}>
                <span style={{ color: "#71717a" }}>{row.label}</span>
                <span style={{ fontWeight: row.valueColor ? 700 : 600, ...(row.valueColor ? { color: row.valueColor } : {}) }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#71717a" }}>Revenue share</span>
              <span style={{ fontSize: "11px", color: "#52525b" }}>{PLACEHOLDER_STAKING.revenueShare}</span>
            </div>
          </div>
          <Link href="/stake" style={{ display: "block", textAlign: "center", marginTop: "14px", padding: "8px", background: "#1f1f1f", color: "#e4e4e7", borderRadius: "10px", fontSize: "11px", fontWeight: 600, textDecoration: "none" }}>Manage Stake</Link>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Oracle &amp; Network</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#71717a" }}>Active oracle</span>
              <span style={{ color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />{PLACEHOLDER_ORACLE.active}
              </span>
            </div>
            {PLACEHOLDER_ORACLE.feeds.map((feed) => (
              <div key={feed.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a" }}>{feed.label}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{feed.value}</span>
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

        <div className="card" style={{ padding: "20px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Reserve Health</div>
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <div className="tabnum font-display" style={{ fontSize: "40px", fontWeight: 700, color: "#4ade80" }}>{PLACEHOLDER_RESERVE.ratio}</div>
            <div style={{ fontSize: "12px", color: "#4ade80", marginTop: "4px" }}>{PLACEHOLDER_RESERVE.status}</div>
          </div>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              {PLACEHOLDER_RESERVE.thresholds.map((t, i) => (
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
            <span style={{ fontWeight: 600 }}>{PLACEHOLDER_RESERVE.houseEdge}</span>
          </div>
        </div>
      </div>

      {/* Recent payouts */}
      <div className="card" style={{ padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>Recent Payouts</div>
          <Link href="/wallet" style={{ fontSize: "11px", color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
              {[
                { label: "Date", align: "left" as const, width: "20%" },
                { label: "Commodity", align: "left" as const, width: "18%" },
                { label: "Chain", align: "left" as const, width: "14%" },
                { label: "PRM", align: "right" as const, width: "16%" },
                { label: "Net USDC", align: "right" as const, width: "16%" },
                { label: "Tx", align: "right" as const, width: undefined },
              ].map((col) => (
                <th key={col.label} style={{ textAlign: col.align, padding: "6px 0", fontSize: "9px", fontWeight: 700, letterSpacing: ".06em", color: "#52525b", textTransform: "uppercase", width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_PAYOUTS.map((p, i) => (
              <tr key={p.tx} style={i === PLACEHOLDER_PAYOUTS.length - 1 ? undefined : { borderBottom: "1px solid #141414" }}>
                <td style={{ padding: "10px 0", color: "#71717a" }}>{p.date}</td>
                <td style={{ padding: "10px 0" }}>
                  <span style={{ fontSize: "10px", padding: "2px 6px", background: p.commodity.bg, color: p.commodity.color, borderRadius: "4px", fontWeight: 700 }}>{p.commodity.label}</span>
                </td>
                <td style={{ padding: "10px 0" }}>
                  <span style={{ fontSize: "10px", padding: "2px 6px", background: p.chain.bg, color: p.chain.color, borderRadius: "4px", fontWeight: 700 }}>{p.chain.label}</span>
                </td>
                <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{p.prm}</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#4ade80" }}>{p.net}</td>
                <td style={{ padding: "10px 0", textAlign: "right" }}>
                  <a href="#" style={{ color: "#F59E0B", textDecoration: "none", fontFamily: "monospace", fontSize: "10px" }}>{p.tx}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
