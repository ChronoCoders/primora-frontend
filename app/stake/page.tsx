"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useChainId, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStaking, type ChainStake } from "@/lib/api";
import { publicClientFor } from "@/lib/clients";
import { chainIdFor, chainLabel, ALL_CHAINS, type Chain } from "@/lib/chain";
import { getContract } from "@/lib/contracts";
import { formatPrmWei, formatBoost } from "@/app/page";

const LOCK_OPTIONS = [
  { label: "30 days", ordinal: 0, mult: "1.0×" },
  { label: "90 days", ordinal: 1, mult: "1.3×" },
  { label: "180 days", ordinal: 2, mult: "1.6×" },
];

const TIER_TABLE = [
  { threshold: "10,000 PRM", boost: "5%" },
  { threshold: "50,000 PRM", boost: "10%" },
  { threshold: "100,000 PRM", boost: "18%" },
  { threshold: "500,000 PRM", boost: "25%" },
];

const WORKED_EXAMPLES = [
  "A · 10,000 PRM Polygon only → 5% base × 1.0× = 5% boost",
  "B · 30,000 Polygon + 30,000 Ethereum (90d) → 10% base × 1.3× = 13% boost",
  "C · 100,000 Ethereum (180d) → 18% base × 1.6× = 28.8% boost",
  "D · 500,000 Ethereum (180d) → 25% base × 1.6× = 40% boost (capped)",
];

const cardStyle = { padding: "22px" } as const;
const rowStyle = { display: "flex", justifyContent: "space-between" } as const;

const LOCK_LABELS: Record<number, string> = { 0: "30d", 1: "90d", 2: "180d" };

function stakeRowLabel(c: ChainStake): string {
  const base = chainLabel(c.chain as Chain);
  if (c.chain === "ethereum" && c.active) {
    const lock = LOCK_LABELS[c.lock_period];
    return lock ? `${base} · ${lock} lock` : base;
  }
  return base;
}

function CurrentStake() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staking", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getStaking(address);
    },
    enabled: isConnected && Boolean(address),
  });

  const active = (data?.chains ?? []).filter((c) => c.active);

  return (
    <div className="card" style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Your Stake</div>
      {!isConnected ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Connect your wallet to see your stake</div>
      ) : isLoading ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Loading…</div>
      ) : isError || !data ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Couldn&apos;t load your stake</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
          {active.length === 0 ? (
            <div style={{ padding: "10px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>No active stake yet</div>
          ) : (
            active.map((c) => (
              <div key={c.chain} style={rowStyle}>
                <span style={{ color: "#71717a" }}>{stakeRowLabel(c)}</span>
                <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{formatPrmWei(c.amount)} PRM</span>
              </div>
            ))
          )}
          <div style={{ ...rowStyle, paddingTop: "8px", borderTop: "1px solid #1a1a1a" }}>
            <span style={{ color: "#71717a" }}>Total staked (both chains)</span>
            <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{formatPrmWei(data.total_staked)} PRM</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: "#71717a" }}>Effective boost</span>
            <span style={{ fontWeight: 700, color: "#F59E0B" }}>{formatBoost(data.effective_boost_bps)}</span>
          </div>
          <div style={{ fontSize: "10px", color: "#52525b", lineHeight: 1.5 }}>
            Tier is driven by your combined stake across both chains; the lock multiplier comes from the Ethereum lock only. Boost is computed and capped (40%) by the backend from your on-chain stakes.
          </div>
        </div>
      )}
    </div>
  );
}

type TxState = "idle" | "approving" | "staking" | "unstaking" | "done" | "error";

function humanizeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("BelowMinimumStake")) return "Amount is below the minimum stake for this chain.";
  if (msg.includes("AlreadyStaking")) return "You already have an active stake on this chain — unstake it first.";
  if (msg.includes("StillLocked")) return "Your stake is still locked; you can unstake after the lock period ends.";
  if (msg.includes("NotStaking")) return "No active stake to unstake on this chain.";
  if (msg.includes("User rejected") || msg.includes("rejected the request")) return "Transaction rejected in wallet.";
  return e instanceof Error && "shortMessage" in e ? String((e as { shortMessage: unknown }).shortMessage) : "Transaction failed.";
}

function StakeForm() {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [selectedChain, setSelectedChain] = useState<Chain>("ethereum");
  const [amount, setAmount] = useState("");
  const [lockOrdinal, setLockOrdinal] = useState(0);
  const [tx, setTx] = useState<TxState>("idle");
  const [error, setError] = useState<string | null>(null);

  const targetChainId = chainIdFor(selectedChain);
  const staking = getContract(targetChainId, "stakingContract");
  const prim = getContract(targetChainId, "primToken");
  const lockRequired = selectedChain === "ethereum";

  const { data: minStakeData } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "minStake",
    chainId: targetChainId,
  });
  const minStake = minStakeData as bigint | undefined;

  const { data: stakingSummary } = useQuery({
    queryKey: ["staking", address],
    queryFn: () => {
      if (!address) throw new Error("wallet not connected");
      return getStaking(address);
    },
    enabled: isConnected && Boolean(address),
  });

  let amountWei: bigint | null = null;
  try {
    amountWei = amount.trim() ? parseUnits(amount.trim(), 18) : null;
  } catch {
    amountWei = null;
  }

  const activeOnSelected = (stakingSummary?.chains ?? []).find(
    (c) => c.chain === selectedChain && c.active,
  );
  const onTargetChain = connectedChainId === targetChainId;
  const busy = tx === "approving" || tx === "staking" || tx === "unstaking" || switching;
  const belowMin = amountWei != null && minStake != null && amountWei < minStake;
  const minText = minStake != null ? formatPrmWei(minStake.toString()) : "…";

  async function handleStake() {
    if (amountWei == null) return;
    setError(null);
    try {
      setTx("approving");
      const approveHash = await writeContractAsync({
        address: prim.address,
        abi: prim.abi,
        functionName: "approve",
        args: [staking.address, amountWei],
        chainId: targetChainId,
      });
      await publicClientFor(selectedChain).waitForTransactionReceipt({ hash: approveHash });
      setTx("staking");
      const stakeHash = await writeContractAsync({
        address: staking.address,
        abi: staking.abi,
        functionName: "stake",
        args: [amountWei, lockOrdinal],
        chainId: targetChainId,
      });
      await publicClientFor(selectedChain).waitForTransactionReceipt({ hash: stakeHash });
      setTx("done");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["staking", address] });
    } catch (e) {
      setTx("error");
      setError(humanizeError(e));
    }
  }

  async function handleUnstake() {
    setError(null);
    try {
      setTx("unstaking");
      const hash = await writeContractAsync({
        address: staking.address,
        abi: staking.abi,
        functionName: "unstake",
        args: [],
        chainId: targetChainId,
      });
      await publicClientFor(selectedChain).waitForTransactionReceipt({ hash });
      setTx("done");
      queryClient.invalidateQueries({ queryKey: ["staking", address] });
    } catch (e) {
      setTx("error");
      setError(humanizeError(e));
    }
  }

  const statusText =
    tx === "approving"
      ? "Approving PRM… confirm in wallet"
      : tx === "staking"
        ? "Staking… confirm in wallet"
        : tx === "unstaking"
          ? "Unstaking… confirm in wallet"
          : tx === "done"
            ? "Confirmed on-chain."
            : null;

  const btn = (bg: string, color: string, disabled: boolean) =>
    ({
      width: "100%",
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      fontSize: "13px",
      fontWeight: 600,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.55 : 1,
      background: bg,
      color,
    }) as const;

  return (
    <div className="card" style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Stake / Unstake</div>

      {!isConnected ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#52525b", fontSize: "12px" }}>Connect your wallet to stake</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Chain</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {ALL_CHAINS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setSelectedChain(c); setTx("idle"); setError(null); }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: selectedChain === c ? "1px solid rgba(245,158,11,.4)" : "1px solid #1f1f1f",
                    background: selectedChain === c ? "rgba(245,158,11,.1)" : "#131313",
                    color: selectedChain === c ? "#F59E0B" : "#a1a1aa",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {chainLabel(c)}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "10px", color: "#52525b", marginTop: "4px" }}>
              Minimum {minText} PRM on {chainLabel(selectedChain)}
              {lockRequired ? " · lock required" : " · no lock (withdraw anytime)"}
            </div>
          </div>

          {activeOnSelected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
                Active stake on {chainLabel(selectedChain)}: <span style={{ fontWeight: 700 }}>{formatPrmWei(activeOnSelected.amount)} PRM</span>
                {selectedChain === "ethereum" && LOCK_LABELS[activeOnSelected.lock_period] ? ` · ${LOCK_LABELS[activeOnSelected.lock_period]} lock` : ""}
              </div>
              {!onTargetChain ? (
                <button type="button" style={btn("#1f1f1f", "#e4e4e7", switching)} disabled={switching} onClick={() => switchChainAsync({ chainId: targetChainId }).catch((e) => setError(humanizeError(e)))}>
                  {switching ? "Switching…" : `Switch to ${chainLabel(selectedChain)} to unstake`}
                </button>
              ) : (
                <button type="button" style={btn("rgba(239,68,68,.12)", "#f87171", busy)} disabled={busy} onClick={handleUnstake}>
                  {tx === "unstaking" ? "Unstaking…" : "Unstake"}
                </button>
              )}
              <div style={{ fontSize: "10px", color: "#52525b" }}>
                One active stake per chain. Ethereum stakes can be withdrawn only after the lock period; Polygon anytime. The contract rejects an early unstake — the reason is shown below if so.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Amount (PRM)</div>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={minStake != null ? minText : "0"}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1f1f1f", background: "#131313", color: "#e4e4e7", fontSize: "13px", fontFamily: "monospace" }}
                />
                {belowMin ? (
                  <div style={{ fontSize: "10px", color: "#f87171", marginTop: "4px" }}>Minimum stake on {chainLabel(selectedChain)} is {minText} PRM.</div>
                ) : null}
              </div>

              {lockRequired ? (
                <div>
                  <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Lock period</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {LOCK_OPTIONS.map((o) => (
                      <button
                        key={o.ordinal}
                        type="button"
                        onClick={() => setLockOrdinal(o.ordinal)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: lockOrdinal === o.ordinal ? "1px solid rgba(245,158,11,.4)" : "1px solid #1f1f1f",
                          background: lockOrdinal === o.ordinal ? "rgba(245,158,11,.1)" : "#131313",
                          color: lockOrdinal === o.ordinal ? "#F59E0B" : "#a1a1aa",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {o.label}
                        <div style={{ fontSize: "9px", color: "#52525b" }}>{o.mult}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!onTargetChain ? (
                <button type="button" style={btn("#1f1f1f", "#e4e4e7", switching)} disabled={switching} onClick={() => switchChainAsync({ chainId: targetChainId }).catch((e) => setError(humanizeError(e)))}>
                  {switching ? "Switching…" : `Switch to ${chainLabel(selectedChain)}`}
                </button>
              ) : (
                <button
                  type="button"
                  style={btn("#F59E0B", "#0a0a0a", busy || amountWei == null || belowMin)}
                  disabled={busy || amountWei == null || belowMin}
                  onClick={handleStake}
                >
                  {tx === "approving" ? "Approving…" : tx === "staking" ? "Staking…" : "Approve & Stake"}
                </button>
              )}
              <div style={{ fontSize: "10px", color: "#52525b" }}>
                Staking is a real two-step on-chain flow: approve PRM to the staking contract, then stake. Both confirm in your wallet.
              </div>
            </div>
          )}

          {statusText ? (
            <div style={{ fontSize: "11px", color: tx === "done" ? "#4ade80" : "#a1a1aa" }}>{statusText}</div>
          ) : null}
          {error ? <div style={{ fontSize: "11px", color: "#f87171" }}>{error}</div> : null}
        </div>
      )}
    </div>
  );
}

function BoostReference() {
  return (
    <div className="card" style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>Boost Structure</div>
      <div style={{ fontSize: "10px", color: "#52525b", marginBottom: "14px" }}>
        Fixed protocol parameters (Spec §6.4–6.5), enforced on-chain by StakingContract — reference, not your stake.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "8px", fontWeight: 600 }}>Tier (combined stake → base boost)</div>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              {TIER_TABLE.map((t) => (
                <tr key={t.threshold} style={{ borderBottom: "1px solid #141414" }}>
                  <td style={{ padding: "5px 0", color: "#a1a1aa" }}>≥ {t.threshold}</td>
                  <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600, color: "#F59E0B" }}>{t.boost}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "5px 0", color: "#52525b" }}>below 10,000 PRM</td>
                <td style={{ padding: "5px 0", textAlign: "right", color: "#52525b" }}>0%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "8px", fontWeight: 600 }}>Lock multiplier (Ethereum only)</div>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              {LOCK_OPTIONS.map((o) => (
                <tr key={o.ordinal} style={{ borderBottom: "1px solid #141414" }}>
                  <td style={{ padding: "5px 0", color: "#a1a1aa" }}>{o.label}</td>
                  <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600 }}>{o.mult}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "5px 0", color: "#52525b" }}>Polygon (no lock)</td>
                <td style={{ padding: "5px 0", textAlign: "right", color: "#52525b" }}>1.0×</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: "10px", color: "#52525b", marginTop: "8px" }}>effective = base × lock, capped at 40%</div>
        </div>
      </div>
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "8px", fontWeight: 600 }}>Worked examples (Spec §6.5)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {WORKED_EXAMPLES.map((ex) => (
            <div key={ex} style={{ fontSize: "10px", color: "#a1a1aa" }}>{ex}</div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #1a1a1a", fontSize: "11px", color: "#71717a", lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600, color: "#a1a1aa" }}>Revenue share:</span> 20% of platform fee revenue is
        distributed weekly to active stakers, pro-rata by stake at the weekly snapshot (Spec §6.7). Per-staker
        accrued rewards are paid directly on distribution and are not yet exposed to the dashboard.
      </div>
    </div>
  );
}

function GovernancePlaceholder() {
  return (
    <div className="card" style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Governance</div>
      <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.5 }}>
        Ethereum stakers receive governance voting rights. The voting mechanism arrives in Phase 2 (Spec §6.6) —
        it is not active at launch. No voting is available yet.
      </div>
    </div>
  );
}

export default function StakePage() {
  return (
    <>
      <div className="two-col">
        <CurrentStake />
        <StakeForm />
      </div>
      <BoostReference />
      <GovernancePlaceholder />
    </>
  );
}
