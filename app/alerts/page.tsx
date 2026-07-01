"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getAlerts, type WalletAlert } from "@/lib/api";

const alertTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatAlertTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : alertTime.format(d);
}

type AlertStyle = { icon: string; color: string; label: string };

function alertStyle(kind: string): AlertStyle {
  switch (kind) {
    case "payout_confirmed":
      return { icon: "fa-circle-check", color: "#4ade80", label: "Payout" };
    case "payout_rejected":
      return { icon: "fa-circle-xmark", color: "#f87171", label: "Payout" };
    case "under_review":
      return { icon: "fa-clock", color: "#F59E0B", label: "Under review" };
    default:
      return { icon: "fa-hourglass-half", color: "#71717a", label: "Payout" };
  }
}

function AlertsList() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["alerts", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getAlerts(address);
    },
    enabled: isConnected && Boolean(address),
  });

  const alerts: WalletAlert[] = data ?? [];

  let body: ReactNode;
  if (!isConnected) {
    body = <StateRow message="Connect your wallet to see your alerts" />;
  } else if (isLoading) {
    body = <StateRow message="Loading…" />;
  } else if (isError) {
    body = <StateRow message="Couldn't load alerts" />;
  } else if (alerts.length === 0) {
    body = <StateRow message="No alerts" />;
  } else {
    body = (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {alerts.map((a, i) => {
          const s = alertStyle(a.kind);
          return (
            <div
              key={`${a.session_id}-${a.kind}-${a.timestamp}`}
              style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: i === alerts.length - 1 ? undefined : "1px solid #141414" }}
            >
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: "13px", marginTop: "2px", width: "16px", textAlign: "center" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: "#e4e4e7" }}>{a.message}</div>
                <div style={{ fontSize: "10px", color: "#52525b", marginTop: "2px" }}>
                  Session {a.session_id.slice(0, 8)} · {formatAlertTime(a.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px" }}>Your Alerts</div>
        {isConnected && !isLoading && !isError && alerts.length > 0 ? (
          <div style={{ fontSize: "11px", color: "#52525b" }}>{alerts.length} recent</div>
        ) : null}
      </div>
      {body}
      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #1a1a1a", fontSize: "10px", color: "#52525b", lineHeight: 1.5 }}>
        This is your own activity: session review status and payout updates. A session shown
        as &quot;under review&quot; may have its payout held pending verification — the review
        outcome is what matters here, not its internals. Platform-wide monitoring lives in the
        restricted operator console.
      </div>
    </div>
  );
}

function StateRow({ message }: { message: string }) {
  return (
    <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>{message}</div>
  );
}

export default function AlertsPage() {
  return <AlertsList />;
}
