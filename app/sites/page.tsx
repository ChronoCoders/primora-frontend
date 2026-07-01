"use client";

import { MiningSites } from "@/components/MiningSites";

export default function SitesPage() {
  return (
    <>
      <MiningSites />
      <div className="card" style={{ padding: "22px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Routing</div>
        <div style={{ fontSize: "12px", color: "#a1a1aa", lineHeight: 1.6 }}>
          Each mining session is automatically routed to a regional node (Spec §3.4); the
          node assigned to your active session is highlighted above and shown on the Overview
          Active Mining card. Site locations are geographic only.
        </div>
        <div style={{ fontSize: "10px", color: "#52525b", marginTop: "10px", lineHeight: 1.5 }}>
          Per-node live status (registered / staked / online) and per-commodity routing
          filters are not yet exposed to the dashboard — only the geographic roster and your
          own session&apos;s assigned site are available today.
        </div>
      </div>
    </>
  );
}
