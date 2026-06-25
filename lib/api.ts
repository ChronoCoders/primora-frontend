// Typed client for the Primora backend read endpoints. All requests go to
// /api/... so the Next.js rewrite (and Cloudflare in prod) keeps them
// same-origin. Plain fetch, no extra dependencies; intended for client-side use.
//
// Shapes mirror the backend serde structs exactly. Monetary fields
// (`gross_prm`, `total_gross_prm`) are decimal strings (NUMERIC(78,0)) and stay
// strings end to end -- never coerce to number. Timestamps are ISO 8601 strings.

/// A payout (mint proposal) row for a wallet, from GET /wallets/:wallet/payouts.
export type PayoutRow = {
  session_id: string;
  wallet: string;
  gross_prm: string;
  commodity: string;
  status: string;
  created_at: string;
};

/// Earnings aggregated by commodity, from GET /wallets/:wallet/earnings.
export type EarningsRow = {
  commodity: string;
  session_count: number;
  total_gross_prm: string;
};

/// An active session summary, from GET /wallets/:wallet/sessions.
export type SessionSummary = {
  session_id: string;
  commodity: string;
  proof_count: number;
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

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
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
