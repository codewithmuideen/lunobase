import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  Coins,
  FlaskConical,
  Gift,
  BarChart3,
  CandlestickChart,
  History,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof Coins; badge?: string };

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/trade", label: "Trade", icon: CandlestickChart },
      { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
      { href: "/dashboard/rewards", label: "LunoCoin rewards", icon: Coins, badge: "New" },
      { href: "/dashboard/demo", label: "Demo account", icon: FlaskConical },
    ],
  },
  {
    label: "Funds",
    items: [
      { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
      { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
      { href: "/dashboard/history", label: "History", icon: History },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/verify", label: "Verify identity", icon: BadgeCheck },
      { href: "/dashboard/referrals", label: "Refer a friend", icon: Gift },
      { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
      { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
  { href: "/dashboard/trade", label: "Trade", icon: CandlestickChart },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/history", label: "History", icon: History },
];
