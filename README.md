# Primora Frontend

Next.js + TypeScript + Tailwind + wagmi + RainbowKit + viem.

Connects to the Primora backend (single origin behind Cloudflare) and on-chain
contracts (PrimToken, Treasury, MiningContract, etc.).

## Stack

- **Next.js 16** (App Router, no `src/` dir)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** — design tokens defined in `app/globals.css` via `@theme`
  (Tailwind v4 has no `tailwind.config.ts`).
- **wagmi v2 + viem v2 + RainbowKit v2** for wallet connection and on-chain reads
- **@tanstack/react-query** (wagmi's data layer)

## Setup

- Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_WC_PROJECT_ID`
  (get a project id from https://cloud.walletconnect.com — required for
  WalletConnect; the app falls back to a placeholder for local builds).
- `npm run dev`

Open http://localhost:3000.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Cloud project id (RainbowKit). |
| `NEXT_PUBLIC_API_BASE` | Backend API base path; `/api` (same origin behind Cloudflare). |
| `NEXT_PUBLIC_CHAIN_ID` | Target chain id; `1` for Ethereum mainnet, `31337` for local Anvil. |

## Chains

Configured in `app/providers.tsx`: Ethereum **mainnet** and a local **Anvil**
chain (id `31337`, `http://localhost:8545`) for development.

## Design reference

`design-reference/` holds the 9 HTML design mocks (`overview`, `mine`,
`mymining`, `stake`, `exchange`, `wallet_payouts`, `sites`, `alerts`, `admin`).
They are the exact visual target: every page conversion must preserve its source
mock's colors, fonts, spacing, and layout faithfully. The theme tokens in
`app/globals.css` (background `#0a0a0a`, surface `#111111`, border `#1f1f1f`,
amber accent `#f59e0b`; Space Grotesk display + Inter body) are extracted
verbatim from `design-reference/overview.html`.
