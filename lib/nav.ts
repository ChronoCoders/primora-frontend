/// A single sidebar navigation entry.
export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
};

/// The eight user-facing navigation items, in the mock's exact order. The
/// admin console is a separate shell and is intentionally excluded here.
export const NAV: readonly NavItem[] = [
  { label: "Overview", href: "/", icon: "fa-chart-line" },
  { label: "Mine", href: "/mine", icon: "fa-microchip" },
  { label: "My Mining", href: "/my-mining", icon: "fa-user" },
  { label: "Stake", href: "/stake", icon: "fa-lock" },
  { label: "Exchange", href: "/exchange", icon: "fa-exchange-alt" },
  { label: "Sites", href: "/sites", icon: "fa-globe" },
  { label: "Wallet & Payouts", href: "/wallet", icon: "fa-wallet" },
  { label: "Alerts", href: "/alerts", icon: "fa-bell", badge: 4 },
] as const;

/// Returns the page title for a pathname, derived from the nav labels.
export function titleForPath(pathname: string): string {
  const item = NAV.find((n) => n.href === pathname);
  if (item) return item.label;
  if (pathname.startsWith("/admin")) return "Admin";
  return "Primora";
}
