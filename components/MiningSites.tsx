"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getSites, getSessions } from "@/lib/api";

/// The mining-site roster card, backed by GET /sites (real NODE_SITES config,
/// geography only). Shared by Overview and the Sites page so both render the same
/// real data — no hardcoded cities. A site is marked "Your active site" when the
/// connected wallet has an active session routed there (from GET /wallets/:w/sessions).
export function MiningSites() {
  const { address, isConnected } = useAccount();
  const sitesQ = useQuery({ queryKey: ["sites"], queryFn: getSites });
  const sessionsQ = useQuery({
    queryKey: ["sessions", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getSessions(address);
    },
    enabled: isConnected && Boolean(address),
  });

  const sites = sitesQ.data ?? [];
  const activeSiteCodes = new Set(
    (sessionsQ.data ?? []).map((s) => s.site_code).filter((c): c is string => Boolean(c)),
  );

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px" }}>Mining Sites</div>
        {sitesQ.data && sites.length > 0 ? (
          <div style={{ fontSize: "11px", color: "#52525b" }}>{sites.length} regional {sites.length === 1 ? "node" : "nodes"}</div>
        ) : null}
      </div>
      {sitesQ.isLoading ? (
        <div style={{ padding: "20px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Loading…</div>
      ) : sitesQ.isError ? (
        <div style={{ padding: "20px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Couldn&apos;t load sites</div>
      ) : sites.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>No sites configured</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
          {sites.map((site) => {
            const mine = activeSiteCodes.has(site.code);
            return (
              <div key={site.code} style={{ background: "#0d0d0f", border: mine ? "1px solid rgba(245,158,11,.2)" : "1px solid #1a1a1a", borderRadius: "14px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-display)" }}>{site.code}</span>
                  <span style={{ fontSize: "10px", color: "#71717a" }}>{site.country}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#a1a1aa" }}>{site.city}</div>
                {mine ? (
                  <div style={{ fontSize: "10px", color: "#F59E0B", marginTop: "4px", fontWeight: 600 }}>Your active site</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: "12px", fontSize: "10px", color: "#52525b", lineHeight: 1.5 }}>
        Sessions are auto-routed to a regional node (Spec §3.4). Locations are geographic only.
      </div>
    </div>
  );
}
