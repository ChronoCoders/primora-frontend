import type { NextConfig } from "next";

// In production, Cloudflare fronts a single origin and routes /api/* to the
// backend, so the browser never makes a cross-origin request. In dev we mirror
// that with a Next.js rewrite to the local backend. The destination forwards
// everything after /api/ to the backend root (which has no /api prefix), so
// /api/wallets/0xabc/payouts -> {backendOrigin}/wallets/0xabc/payouts.
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendOrigin}/:path*` },
    ];
  },
};

export default nextConfig;
