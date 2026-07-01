/// A payout (mint proposal) row for a wallet, from GET /wallets/:wallet/payouts.
export type PayoutRow = {
  session_id: string;
  wallet: string;
  gross_prm: string;
  /// Net payout in USD cents (Spec 4.8); null for rows that predate USD persistence.
  net_usd_cents?: number | null;
  commodity: string;
  chain: string;
  status: string;
  created_at: string;
};

/// Earnings aggregated by commodity, from GET /wallets/:wallet/earnings.
export type EarningsRow = {
  commodity: string;
  session_count: number;
  total_gross_prm: string;
  /// Gross USD value of the summed PRM in cents, at the fixed PRM reference price (Spec 4.8).
  total_usd_cents: number;
};

/// An active session summary, from GET /wallets/:wallet/sessions.
export type SessionSummary = {
  session_id: string;
  commodity: string;
  proof_count: number;
  /// Running session average hashrate in H/s (not instantaneous); 0 until the first proof.
  avg_hashrate: number;
  /// Client software type, lowercase (e.g. "desktop").
  client_type: string;
  /// CPU worker threads reported by the client; 0 if not reported.
  cpu_threads: number;
  /// Submitted proofs that passed pre-filter validation (not full attestation).
  verified_proof_count: number;
  /// Submitted proofs rejected by pre-filter validation.
  rejected_proof_count: number;
  /// Net USD (cents) earned so far this session (grounded, not a projection); 0 if unavailable.
  est_net_usd_cents: number;
  /// Site code of the assigned node (e.g. "JHB"), or null if not configured.
  site_code: string | null;
  /// City of the assigned node (e.g. "Johannesburg"), or null if not configured.
  site_city: string | null;
  /// Whether the session is paused (proofs rejected until resumed).
  paused: boolean;
  status: string;
  started_at: string;
  last_submission_at: string | null;
};

/// Error thrown when the backend returns a non-2xx response. `status` is the
/// HTTP status code; `message` is the backend `{ error }` envelope when present.
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `request failed with status ${res.status}`;
    try {
      const body: unknown = await res.json();
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "string"
      ) {
        message = (body as { error: string }).error;
      }
    } catch {
      // Non-JSON error body; keep the default message.
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  return unwrap<T>(res);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
}

/// Fetches a wallet's payout history, newest first. `limit` defaults to the
/// backend default (50) when omitted; the backend caps it at 200.
export function getPayouts(
  wallet: string,
  limit?: number,
): Promise<PayoutRow[]> {
  const query = limit === undefined ? "" : `?limit=${limit}`;
  return getJson<PayoutRow[]>(
    `/api/wallets/${encodeURIComponent(wallet)}/payouts${query}`,
  );
}

/// Fetches a wallet's earnings aggregated by commodity.
export function getEarnings(wallet: string): Promise<EarningsRow[]> {
  return getJson<EarningsRow[]>(
    `/api/wallets/${encodeURIComponent(wallet)}/earnings`,
  );
}

/// Fetches a wallet's active sessions.
export function getSessions(wallet: string): Promise<SessionSummary[]> {
  return getJson<SessionSummary[]>(
    `/api/wallets/${encodeURIComponent(wallet)}/sessions`,
  );
}

/// Result of a pause/resume control action.
export type SessionControl = { paused: boolean };

/// Pauses a session (proofs rejected until resumed); requires the owning wallet.
export function pauseSession(
  sessionId: string,
  wallet: string,
): Promise<SessionControl> {
  return postJson<SessionControl>(
    `/api/sessions/${encodeURIComponent(sessionId)}/pause`,
    { wallet },
  );
}

/// Resumes a paused session; requires the owning wallet.
export function resumeSession(
  sessionId: string,
  wallet: string,
): Promise<SessionControl> {
  return postJson<SessionControl>(
    `/api/sessions/${encodeURIComponent(sessionId)}/resume`,
    { wallet },
  );
}

/// A wallet's active stake on one chain, from GET /wallets/:wallet/staking.
export type ChainStake = {
  chain: string;
  amount: string;
  lock_period: number;
  active: boolean;
};

/// A wallet's cross-chain staking summary. `effective_boost_bps` is computed and
/// capped by the backend (single source of truth); the frontend only displays it.
export type StakingSummary = {
  chains: ChainStake[];
  total_staked: string;
  effective_boost_bps: number;
};

/// Fetches a wallet's per-chain stake and combined effective boost.
export function getStaking(wallet: string): Promise<StakingSummary> {
  return getJson<StakingSummary>(
    `/api/wallets/${encodeURIComponent(wallet)}/staking`,
  );
}

/// A wallet's total earnings over the last 24 hours, from
/// GET /wallets/:wallet/earnings/24h. `total_gross_prm` is base-unit wei;
/// `total_usd_cents` is net redemption USD (after the house edge).
export type Earnings24h = {
  total_gross_prm: string;
  total_usd_cents: number;
  payout_count: number;
};

/// Fetches a wallet's last-24h gross PRM and net USD earnings.
export function getEarnings24h(wallet: string): Promise<Earnings24h> {
  return getJson<Earnings24h>(
    `/api/wallets/${encodeURIComponent(wallet)}/earnings/24h`,
  );
}

/// The company's cumulative, confirmed-only share of all PRM mined (Spec §12),
/// summed across both chains, from GET /entity/share. Global, not wallet-scoped.
/// `share_bps` is basis points (0..=10000); 0 until the first confirmed mint or
/// when no company wallet is configured. `company_wallet` is null when unset.
export type CompanyMiningShare = {
  company_prm_wei: string;
  total_prm_wei: string;
  share_bps: number;
  company_wallet: string | null;
};

/// Fetches the global Company Mining Share (company vs total confirmed mining).
export function getCompanyMiningShare(): Promise<CompanyMiningShare> {
  return getJson<CompanyMiningShare>("/api/entity/share");
}

/// One chain's absolute Treasury reserve holdings from GET /reserve. All amounts
/// are 6-decimal stablecoin base units as strings (divide by 1e6 for USD).
/// `available` is false when that chain's on-chain read failed.
export type ChainReserve = {
  chain: string;
  usdc: string;
  usdt: string;
  total_usd: string;
  total_redeemed_usd: string;
  available: boolean;
};

/// Absolute USDC/USDT reserve holdings per chain and combined (Spec §11.1/§12),
/// read live on-chain from each Treasury. Assumption-free -- unlike the reserve
/// ratio, whose denominator uses the provisional $0.10 PRM reference price.
export type ReserveResponse = {
  chains: ChainReserve[];
  total_reserve_usd: string;
  total_redeemed_usd: string;
};

/// Fetches the absolute reserve holdings (per chain + combined total, redeemed).
export function getReserve(): Promise<ReserveResponse> {
  return getJson<ReserveResponse>("/api/reserve");
}

/// A mining site from the NODE_SITES roster (Spec §3.4), from GET /sites.
/// Geography only -- code, city, ISO country. No provider/vendor identity.
export type SiteInfo = {
  code: string;
  city: string;
  country: string;
};

/// Fetches the mining-site roster (real NODE_SITES config, geography only).
export function getSites(): Promise<SiteInfo[]> {
  return getJson<SiteInfo[]>("/api/sites");
}
